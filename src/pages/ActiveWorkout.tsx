import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Save, Smartphone, Square, StickyNote, Timer } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ExerciseRowStack } from '@/components/session/ExerciseRowStack';
import { GroupSetTracker } from '@/components/session/GroupSetTracker';
import { RestTimer } from '@/components/session/RestTimer';
import { PageLayout } from '@/components/shared/PageLayout';

const StartOverlay = lazy(() => import('@/components/session/StartOverlay').then(m => ({ default: m.StartOverlay })));
const ExercisePicker = lazy(() => import('@/components/exercise/ExercisePicker').then(m => ({ default: m.ExercisePicker })));
const SubstitutePanel = lazy(() => import('@/components/exercise/SubstitutePanel').then(m => ({ default: m.SubstitutePanel })));
const VideoSheet = lazy(() => import('@/components/exercise/VideoSheet').then(m => ({ default: m.VideoSheet })));
import { EmptyState } from '@/components/shared/EmptyState';
import { MarqueeText } from '@/components/shared/MarqueeText';
import { useStore } from '@/store';
import { useRestTimer } from '@/hooks/useRestTimer';
import { useElapsedTimer } from '@/hooks/useElapsedTimer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useSessionGroups } from '@/hooks/useSessionGroups';
import { registerDragOffsetListener } from '@/hooks/useDragOffsetChannel';
import { setInlineTimerVisible, registerScrollToTimer } from '@/hooks/useTimerVisibility';
import { computeLogStats } from '@/utils/logUtils';
import { inferTrackingFlags } from '@/utils/fieldDefaults';
import { formatWeight } from '@/utils/unitConversion';
import type { SetLog, ExerciseId, WorkoutLog } from '@/types';

export function ActiveWorkout() {
  const session = useStore((state) => state.session.active);
  const graph = useStore((state) => state.graph);
  const { completeSet, addSet, removeSet, goToGroup, beginSession, abandonSession, endSession, swapExercise, saveSession, addExerciseToSession, updateSessionNotes } = useStore(
    (state) => state.sessionActions
  );
  const setActiveTab = useStore((state) => state.setActiveTab);
  const resetWorkout = useStore((state) => state.builderActions.resetWorkout);
  const builderWorkoutId = useStore((state) => state.builder.workout.id);

  const resetBuilderIfMatchesSession = useCallback(() => {
    if (!session) return;
    const builder = useStore.getState().builder.workout;
    const builderEmpty = builder.exercises.length === 0 && !builder.name.trim();
    if (builderWorkoutId === session.workoutId || builderEmpty) {
      resetWorkout();
    }
  }, [builderWorkoutId, session, resetWorkout]);

  const isPreview = !!session && !session.startedAt;
  const isActive = !!session && !!session.startedAt && !session.completedAt;

  // null = closed, number = offset within currentGroup.exercises[]
  const [swapTargetOffset, setSwapTargetOffset] = useState<number | null>(null);
  const [videoTargetOffset, setVideoTargetOffset] = useState<number | null>(null);
  const [summaryLog, setSummaryLog] = useState<WorkoutLog | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [swapPickerOpen, setSwapPickerOpen] = useState(false);
  const timer = useRestTimer();
  const wakeLock = useWakeLock();
  const elapsed = useElapsedTimer(session?.startedAt ?? null, session?.completedAt);
  const { groups, currentGroup, currentGroupIndex, totalGroups } = useSessionGroups();

  // IntersectionObserver for inline timer visibility + scroll-to-timer action.
  // Uses callback ref (useState) instead of useRef so the effect re-runs reliably
  // when the timer element mounts/unmounts (useRef doesn't trigger re-renders).
  const [timerEl, setTimerEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!timerEl) {
      setInlineTimerVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInlineTimerVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(timerEl);

    // Scroll listener as backup — IO can miss visibility during Framer Motion
    // layout animations (transforms temporarily shift elements off-screen).
    // Throttled via rAF to avoid excessive getBoundingClientRect calls.
    let rafId = 0;
    const checkVisibility = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = timerEl.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        setInlineTimerVisible(inView);
      });
    };
    window.addEventListener('scroll', checkVisibility, { passive: true });

    registerScrollToTimer(() => {
      timerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', checkVisibility);
      // NOTE: intentionally NOT calling setInlineTimerVisible(false) here.
      // With AnimatePresence mode="popLayout", the old component's cleanup runs
      // AFTER the new component has already set up its IO — resetting here would
      // override the new component's correct value. The FloatingRestTimer's
      // `!onActiveTab` short-circuit handles the "not on active tab" case.
      registerScrollToTimer(null);
    };
  }, [timerEl]);

  // Derive nav direction from currentGroupIndex changes (React 19 safe — setState during render)
  const [navDirection, setNavDirection] = useState<'left' | 'right'>('left');
  const [prevGroupIndex, setPrevGroupIndex] = useState(currentGroupIndex);
  if (currentGroupIndex !== prevGroupIndex) {
    setNavDirection(currentGroupIndex > prevGroupIndex ? 'left' : 'right');
    setPrevGroupIndex(currentGroupIndex);
  }

  // Finger-following drag offset via DOM manipulation (no re-renders)
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    registerDragOffsetListener((offsetX) => {
      if (offsetX === 0) {
        // Release: spring back
        el.style.transition = 'transform 0.3s ease-out';
        el.style.transform = 'translateX(0px)';
      } else {
        // Active drag: follow finger instantly
        el.style.transition = 'none';
        el.style.transform = `translateX(${offsetX}px)`;
      }
    });

    return () => {
      registerDragOffsetListener(null);
    };
  }, []);

  // Reset transform when group changes (after AnimatePresence swaps content)
  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = 'translateX(0px)';
    }
  }, [currentGroupIndex]);

  // Derive saved status from store

  const previewExerciseCount = session ? session.exercises.length : 0;

  // Find the original workout to get restSeconds/weight per exercise
  const workouts = useStore((state) => state.library.workouts);
  const originalWorkout = useMemo(() => {
    if (!session) return null;
    return workouts.find((w) => w.id === session.workoutId) ?? null;
  }, [session, workouts]);

  const restSeconds = timer.restSeconds;

  // Default weights for each exercise in the group
  const defaultWeights = useMemo(() => {
    if (!currentGroup || !originalWorkout) return [];
    return currentGroup.indices.map((idx) => originalWorkout.exercises[idx]?.weight ?? null);
  }, [currentGroup, originalWorkout]);

  // Derive the exercise info for the video target
  const videoTargetExercise = useMemo(() => {
    if (videoTargetOffset === null || !currentGroup) return null;
    const ex = currentGroup.exercises[videoTargetOffset];
    return ex ? graph.exercises.get(ex.exerciseId as ExerciseId) ?? null : null;
  }, [videoTargetOffset, currentGroup, graph]);

  // Derive the exercise for the swap target
  const swapTargetExercise = useMemo(() => {
    if (swapTargetOffset === null || !currentGroup) return null;
    return currentGroup.exercises[swapTargetOffset] ?? null;
  }, [swapTargetOffset, currentGroup]);

  const handleCompleteSet = useCallback(
    (exerciseIndex: number, setIndex: number, data: SetLog) => {
      completeSet(exerciseIndex, setIndex, data);
    },
    [completeSet]
  );

  const handleAddSet = useCallback(
    (exerciseIndex: number) => {
      addSet(exerciseIndex);
    },
    [addSet]
  );

  const handleRemoveSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      removeSet(exerciseIndex, setIndex);
      toast('Set removed', { duration: 800 });
    },
    [removeSet]
  );

  const handlePrev = useCallback(() => {
    if (currentGroupIndex <= 0) return;
    goToGroup(currentGroupIndex - 1);
    setSwapTargetOffset(null);
    setVideoTargetOffset(null);
  }, [currentGroupIndex, goToGroup]);

  const handleNext = useCallback(() => {
    if (currentGroupIndex >= totalGroups - 1) return;
    goToGroup(currentGroupIndex + 1);
    setSwapTargetOffset(null);
    setVideoTargetOffset(null);
  }, [currentGroupIndex, totalGroups, goToGroup]);

  const [endDialogOpen, setEndDialogOpen] = useState(false);
  // Snapshot remaining seconds when dialog opens so we can resume accurately
  const timerSnapshotRef = useRef(0);

  const handleFinish = useCallback(() => {
    // Pause timer and capture remaining time for potential resume
    const timerState = useStore.getState().session.timer;
    if (timerState.isRunning && timerState.timerStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(timerState.timerStartedAt).getTime()) / 1000);
      timerSnapshotRef.current = Math.max(0, timerState.totalSeconds - elapsed);
    } else {
      timerSnapshotRef.current = timerState.remainingSeconds;
    }
    timer.pause();
    setEndDialogOpen(true);
  }, [timer]);

  const handleSwap = useCallback(
    (newId: ExerciseId) => {
      if (!currentGroup || swapTargetOffset === null) return;
      const exerciseIdx = currentGroup.indices[swapTargetOffset];
      const newExercise = graph.exercises.get(newId);
      swapExercise(exerciseIdx, newId);
      setSwapTargetOffset(null);
      toast.success(`Swapped to ${newExercise?.name ?? 'new exercise'}`);
    },
    [currentGroup, swapTargetOffset, graph, swapExercise]
  );

  const handleSwapFromPicker = useCallback(
    (newId: ExerciseId) => {
      handleSwap(newId);
      setSwapPickerOpen(false);
    },
    [handleSwap]
  );

  const handleEndAndSave = useCallback(() => {
    setEndDialogOpen(false);
    endSession();
    const log = saveSession();
    if (log) {
      setSummaryLog(log);
      setSummaryOpen(true);
    }
    resetBuilderIfMatchesSession();
    abandonSession();
  }, [endSession, saveSession, abandonSession, resetBuilderIfMatchesSession]);

  const handleEndAndDiscard = useCallback(() => {
    setEndDialogOpen(false);
    abandonSession();
    resetBuilderIfMatchesSession();
    setActiveTab('library');
  }, [abandonSession, resetBuilderIfMatchesSession, setActiveTab]);

  const handleResumeWorkout = useCallback(() => {
    setEndDialogOpen(false);
    // Resume timer if it had time remaining
    if (timerSnapshotRef.current > 0) {
      timer.start(timerSnapshotRef.current);
    }
  }, [timer]);

  const handleCancel = useCallback(() => {
    abandonSession();
    setActiveTab('library');
  }, [abandonSession, setActiveTab]);

  const handleAddExercise = useCallback(
    (exerciseId: ExerciseId) => {
      addExerciseToSession(exerciseId);
      setPickerOpen(false);
      toast.success('Exercise added');
    },
    [addExerciseToSession]
  );

  // Session notes — collapsible section with debounced auto-save
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(session?.notes ?? '');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateSessionNotes(value);
    }, 300);
  }, [updateSessionNotes]);
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  // Prescribed durations for each exercise in the group (from the plan)
  const prescribedDurations = useMemo(() => {
    if (!currentGroup || !originalWorkout) return [];
    return currentGroup.indices.map((idx) => originalWorkout.exercises[idx]?.durationSeconds);
  }, [currentGroup, originalWorkout]);

  // Default tracking flags for each exercise in the group (from exercise metadata)
  const defaultFlagsList = useMemo(() => {
    if (!currentGroup) return [];
    return currentGroup.exercises.map((ex) => {
      const info = graph.exercises.get(ex.exerciseId as ExerciseId);
      return info
        ? inferTrackingFlags(info)
        : { trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false };
    });
  }, [currentGroup, graph]);

  // Derive planNotes for the current group
  const currentPlanNotes = useMemo(() => {
    if (!currentGroup || !session) return [];
    return currentGroup.exercises.map((ex) => ex.planNotes ?? '');
  }, [currentGroup, session]);

  // Stable callbacks for ExerciseRowStack (memo'd — inline arrows would defeat memoization)
  const handleExerciseInfo = useCallback((offset: number) => {
    setVideoTargetOffset(offset);
  }, []);

  const handleExerciseSwap = useCallback((offset: number) => {
    setSwapTargetOffset((prev) => (prev === offset ? null : offset));
  }, []);

  const summarySheet = (
    <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
      <SheetContent side="bottom" className="bg-bg-surface">
        <SheetHeader>
          <SheetTitle className="text-text-primary">Workout Saved</SheetTitle>
        </SheetHeader>
        {summaryLog && (() => {
          const stats = computeLogStats(summaryLog);
          return (
            <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-bg-elevated p-3">
                  <div className="text-xs text-text-tertiary">Date</div>
                  <div className="text-sm font-medium text-text-primary">{stats.date}</div>
                </div>
                <div className="rounded-lg bg-bg-elevated p-3">
                  <div className="text-xs text-text-tertiary">Duration</div>
                  <div className="text-sm font-medium text-text-primary">{stats.durationMinutes} min</div>
                </div>
                <div className="rounded-lg bg-bg-elevated p-3">
                  <div className="text-xs text-text-tertiary">Exercises</div>
                  <div className="text-sm font-medium text-text-primary">{stats.exerciseCount}</div>
                </div>
                <div className="rounded-lg bg-bg-elevated p-3">
                  <div className="text-xs text-text-tertiary">Total Weight</div>
                  <div className="text-sm font-medium text-text-primary">
                    {stats.totalWeight > 0
                      ? formatWeight(stats.totalWeight, summaryLog.weightUnit ?? 'lb')
                      : '--'}
                  </div>
                </div>
              </div>
              <AdSlot slotKey="post_workout" />
              <Button
                variant="outline"
                onClick={() => {
                  setSummaryOpen(false);
                  setActiveTab('log');
                }}
                className="w-full"
              >
                View Log
              </Button>
            </div>
          );
        })()}
      </SheetContent>
    </Sheet>
  );

  // No active session
  if (!session) {
    return (
      <>
        <PageLayout
          header={<h1 className="text-xl font-bold text-text-primary">Active</h1>}
          contentClassName="px-4"
        >
          <EmptyState
            icon={Timer}
            title="No Active Workout"
            subtitle={
              <span>
                Go to{' '}
                <button
                  onClick={() => setActiveTab('library')}
                  className="font-medium text-accent-primary hover:text-accent-hover transition-colors"
                >
                  Library
                </button>
                {' '}to select a workout.
              </span>
            }
          />
        </PageLayout>
        {summarySheet}
      </>
    );
  }

  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  const headerRight = (
    <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
      {isActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFinish}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Square size={14} className="mr-1" />
          Finish
        </Button>
      )}
      <span className="text-[10px] tabular-nums text-text-tertiary">
        {elapsed}
      </span>
    </div>
  );

  return (
    <PageLayout
      header={
        <div className="min-w-0 flex-1">
          <MarqueeText
            text={session.workoutName || 'Workout'}
            className="text-lg font-bold text-text-primary"
          />
          <div className="text-xs text-text-tertiary">
            {completedSets}/{totalSets} sets completed
          </div>
        </div>
      }
      headerRight={headerRight}
      contentClassName="flex flex-col gap-4 px-4"
    >

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-primary transition-all duration-300"
          style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
        />
      </div>

      {/* Group navigation — contentRef for finger-following drag */}
      <div ref={contentRef} className="flex flex-col gap-4">

      {/* Navigation row */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={currentGroupIndex <= 0}
          aria-label="Previous group"
          className="h-9 w-9"
        >
          <ChevronLeft size={18} />
        </Button>
        <span className="text-xs text-text-tertiary">
          {currentGroup && currentGroup.exercises.length > 1
            ? `Group ${currentGroupIndex + 1} of ${totalGroups}`
            : `Exercise ${currentGroupIndex + 1} of ${totalGroups}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={currentGroupIndex >= totalGroups - 1}
          aria-label="Next group"
          className="h-9 w-9"
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Stacked exercise rows */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentGroupIndex}-${currentGroup?.groupId}`}
          initial={{ opacity: 0, x: navDirection === 'left' ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {currentGroup && (
            <ExerciseRowStack
              group={currentGroup}
              graph={graph}
              onInfo={handleExerciseInfo}
              onSwap={handleExerciseSwap}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Substitute panel — for whichever exercise was swiped */}
      {swapTargetExercise && (
        <Suspense fallback={null}>
          <SubstitutePanel
            exerciseId={swapTargetExercise.exerciseId as ExerciseId}
            open={true}
            onSwap={handleSwap}
            onSearchAll={() => setSwapPickerOpen(true)}
          />
        </Suspense>
      )}

      {/* Rest timer */}
      <div ref={setTimerEl} className="flex flex-col items-center gap-2">
        <RestTimer
          remainingSeconds={timer.remainingSeconds}
          totalSeconds={timer.totalSeconds}
          progress={timer.progress}
          isRunning={timer.isRunning}
          isDone={timer.isDone}
          restSeconds={restSeconds}
          onStart={timer.start}
          onStop={timer.stop}
          onPause={timer.pause}
          onAddTime={timer.addTime}
          onAdjustRestDuration={timer.adjustRestDuration}
          rightSlot={
            wakeLock.isSupported ? (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={wakeLock.toggle}
                  aria-label={wakeLock.isActive ? 'Allow screen sleep' : 'Keep screen on'}
                  role="switch"
                  aria-checked={wakeLock.isActive}
                  className="relative w-8 h-14 rounded-full border transition-colors duration-300 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: wakeLock.isActive ? 'var(--color-warning)' : 'var(--color-border-subtle)',
                    backgroundColor: wakeLock.isActive ? 'color-mix(in srgb, var(--color-warning) 15%, transparent)' : 'var(--color-bg-elevated)',
                  }}
                >
                  {/* Track glow when active */}
                  {wakeLock.isActive && (
                    <span
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        boxShadow: '0 0 8px color-mix(in srgb, var(--color-warning) 30%, transparent)',
                      }}
                    />
                  )}
                  {/* Thumb */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      bottom: wakeLock.isActive ? 'calc(100% - 24px)' : '4px',
                      backgroundColor: wakeLock.isActive ? 'var(--color-warning)' : 'var(--color-text-tertiary)',
                      boxShadow: wakeLock.isActive ? '0 0 6px var(--color-warning)' : 'none',
                    }}
                  >
                    <Smartphone size={12} className="text-bg-root" />
                  </span>
                </button>
                <span className="text-[11px] text-text-tertiary leading-tight text-center whitespace-nowrap">
                  Keep Awake
                </span>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Rest timer ad — re-key on group nav to swap ad (cache enforces 30s minimum) */}
      <AdSlot key={currentGroupIndex} slotKey="rest_timer" className="mt-1" />

      {/* Group set tracker */}
      {currentGroup && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGroupIndex}
            initial={{ opacity: 0, x: navDirection === 'left' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <GroupSetTracker
              group={currentGroup}
              defaultWeights={defaultWeights}
              defaultFlags={defaultFlagsList}
              onCompleteSet={handleCompleteSet}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              planNotes={currentPlanNotes}
              prescribedDurations={prescribedDurations}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Group dots — one dot per group */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {groups.map((group, i) => {
          const allDone = group.exercises.every((ex) =>
            ex.sets.every((s) => s.completed)
          );
          const someDone = group.exercises.some((ex) =>
            ex.sets.some((s) => s.completed)
          );
          const isMulti = group.exercises.length > 1;
          return (
            <button
              key={i}
              onClick={() => {
                goToGroup(i);
                setSwapTargetOffset(null);
                setVideoTargetOffset(null);
              }}
              aria-label={`Go to ${isMulti ? 'group' : 'exercise'} ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === currentGroupIndex
                  ? isMulti ? 'w-8 bg-accent-primary' : 'w-6 bg-accent-primary'
                  : allDone
                    ? isMulti ? 'w-4 bg-success' : 'w-2.5 bg-success'
                    : someDone
                      ? isMulti ? 'w-4 bg-warning' : 'w-2.5 bg-warning'
                      : isMulti ? 'w-4 bg-bg-elevated' : 'w-2.5 bg-bg-elevated'
              }`}
            />
          );
        })}
        {isActive && (
          <button
            onClick={() => setPickerOpen(true)}
            aria-label="Add exercise"
            className="h-6 w-6 flex items-center justify-center rounded-full bg-bg-elevated text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      {/* Session Notes */}
      {isActive && (
        <>
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-text-tertiary"
            aria-label={notesExpanded ? 'Collapse session notes' : 'Expand session notes'}
          >
            <StickyNote size={14} />
            <span className="flex-1 text-left truncate">
              {localNotes ? localNotes.slice(0, 40) + (localNotes.length > 40 ? '...' : '') : 'Tap to add notes'}
            </span>
            {notesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <AnimatePresence>
            {notesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <textarea
                  value={localNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Workout notes..."
                  className="w-full px-4 pb-3 text-base md:text-sm bg-transparent text-text-primary placeholder:text-text-tertiary resize-none outline-none"
                  rows={3}
                  autoFocus
                  aria-label="Session notes"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      </div>

      <Suspense fallback={null}>
        <VideoSheet
          exercise={videoTargetExercise}
          open={videoTargetOffset !== null}
          onOpenChange={(open) => { if (!open) setVideoTargetOffset(null); }}
        />
      </Suspense>

      {/* Save summary sheet */}
      {summarySheet}

      {/* Exercise picker for mid-session add */}
      <Suspense fallback={null}>
        <ExercisePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onAdd={handleAddExercise}
        />
      </Suspense>

      {/* Exercise picker for swap via search */}
      <Suspense fallback={null}>
        <ExercisePicker
          open={swapPickerOpen}
          onOpenChange={setSwapPickerOpen}
          onAdd={handleSwapFromPicker}
          title="Swap Exercise"
        />
      </Suspense>

      {/* End workout confirmation */}
      <Dialog open={endDialogOpen} onOpenChange={(open) => {
        if (!open) handleResumeWorkout();
      }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>End your workout?</DialogTitle>
            <DialogDescription>
              {completedSets} of {totalSets} sets completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleEndAndSave} className="min-h-[44px] bg-accent-primary text-bg-root hover:bg-accent-hover">
              <Save size={14} className="mr-1" />
              End &amp; Save
            </Button>
            <Button variant="ghost" onClick={handleEndAndDiscard} className="min-h-[44px] text-text-tertiary">
              End without saving
            </Button>
            <Button variant="ghost" onClick={handleResumeWorkout} className="min-h-[44px]">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {isPreview && (
          <Suspense fallback={null}>
            <StartOverlay
              workoutName={session.workoutName || 'Workout'}
              exerciseCount={previewExerciseCount}
              groupCount={totalGroups}
              onStart={beginSession}
              onCancel={handleCancel}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
