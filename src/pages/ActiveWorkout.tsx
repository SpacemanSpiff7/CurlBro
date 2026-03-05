import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Check, ChevronLeft, ChevronRight, Play, Plus, Save, Smartphone, Square, Timer, Video } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GroupSetTracker } from '@/components/session/GroupSetTracker';
import { RestTimer } from '@/components/session/RestTimer';
import { ExercisePicker } from '@/components/exercise/ExercisePicker';
import { SubstitutePanel } from '@/components/exercise/SubstitutePanel';
import { VideoSheet } from '@/components/exercise/VideoSheet';
import { TopBar } from '@/components/shared/TopBar';
import { MarqueeText } from '@/components/shared/MarqueeText';
import { useStore } from '@/store';
import { useRestTimer } from '@/hooks/useRestTimer';
import { useElapsedTimer } from '@/hooks/useElapsedTimer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useSessionGroups } from '@/hooks/useSessionGroups';
import { getGroupLabel } from '@/utils/groupUtils';
import { computeLogStats } from '@/utils/logUtils';
import type { SetLog, ExerciseId, WorkoutLog } from '@/types';

export function ActiveWorkout() {
  const session = useStore((state) => state.session.active);
  const graph = useStore((state) => state.graph);
  const { completeSet, addSet, removeSet, goToGroup, beginSession, endSession, swapExercise, saveSession, addExerciseToSession } = useStore(
    (state) => state.sessionActions
  );
  const setActiveTab = useStore((state) => state.setActiveTab);

  const isPreview = !!session && !session.startedAt;
  const isCompleted = !!session && !!session.completedAt;
  const isActive = !!session && !!session.startedAt && !session.completedAt;

  const [swapOpen, setSwapOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [summaryLog, setSummaryLog] = useState<WorkoutLog | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const timer = useRestTimer();
  const wakeLock = useWakeLock();
  const elapsed = useElapsedTimer(session?.startedAt ?? null, session?.completedAt);
  const { groups, currentGroup, currentGroupIndex, totalGroups } = useSessionGroups();

  // Derive saved status from store
  const logs = useStore((state) => state.library.logs);
  const isSaved = useMemo(() => {
    if (!session?.startedAt) return false;
    return logs.some((l) => l.workoutId === session.workoutId && l.startedAt === session.startedAt);
  }, [session, logs]);

  // Find the original workout to get restSeconds/weight per exercise
  const workouts = useStore((state) => state.library.workouts);
  const originalWorkout = useMemo(() => {
    if (!session) return null;
    return workouts.find((w) => w.id === session.workoutId) ?? null;
  }, [session, workouts]);

  // For single-exercise groups, get the first exercise info for the header
  const firstExercise = currentGroup?.exercises[0] ?? null;
  const firstExerciseInfo = useMemo(() => {
    if (!firstExercise) return null;
    return graph.exercises.get(firstExercise.exerciseId as ExerciseId) ?? null;
  }, [firstExercise, graph]);

  // Rest seconds: use timer store value (allows +/- adjustment when idle)
  // Initialize store value from the workout's per-group rest seconds
  const groupRestSeconds = useMemo(() => {
    if (!currentGroup || !originalWorkout) return 60;
    return Math.max(
      ...currentGroup.indices.map((idx) => originalWorkout.exercises[idx]?.restSeconds ?? 60)
    );
  }, [currentGroup, originalWorkout]);

  const { setRestDuration } = useStore((state) => state.sessionActions);
  const restSeconds = timer.restSeconds;

  // Sync store restSeconds when navigating to a new group
  useEffect(() => {
    setRestDuration(groupRestSeconds);
  }, [currentGroupIndex, groupRestSeconds, setRestDuration]);

  // Default weights for each exercise in the group
  const defaultWeights = useMemo(() => {
    if (!currentGroup || !originalWorkout) return [];
    return currentGroup.indices.map((idx) => originalWorkout.exercises[idx]?.weight ?? null);
  }, [currentGroup, originalWorkout]);

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
      toast('Set removed', { duration: 2000 });
    },
    [removeSet]
  );

  const handlePrev = useCallback(() => {
    if (currentGroupIndex <= 0) return;
    goToGroup(currentGroupIndex - 1);
    timer.stop();
  }, [currentGroupIndex, goToGroup, timer]);

  const handleNext = useCallback(() => {
    if (currentGroupIndex >= totalGroups - 1) return;
    goToGroup(currentGroupIndex + 1);
    timer.stop();
  }, [currentGroupIndex, totalGroups, goToGroup, timer]);

  const handleFinish = useCallback(() => {
    endSession();
  }, [endSession]);

  const handleSwap = useCallback(
    (newId: ExerciseId) => {
      if (!currentGroup) return;
      // Swap the first exercise in the group (for standalone) or the one the panel was opened for
      const exerciseIdx = currentGroup.indices[0];
      const newExercise = graph.exercises.get(newId);
      swapExercise(exerciseIdx, newId);
      setSwapOpen(false);
      toast.success(`Swapped to ${newExercise?.name ?? 'new exercise'}`);
    },
    [currentGroup, graph, swapExercise]
  );

  const handleSave = useCallback(() => {
    const log = saveSession();
    if (log) {
      setSummaryLog(log);
      setSummaryOpen(true);
    }
  }, [saveSession]);

  const handleAddExercise = useCallback(
    (exerciseId: ExerciseId) => {
      addExerciseToSession(exerciseId);
      setPickerOpen(false);
      toast.success('Exercise added');
    },
    [addExerciseToSession]
  );

  // Build group header name for multi-exercise groups
  const groupHeaderNames = useMemo(() => {
    if (!currentGroup || currentGroup.exercises.length <= 1) return null;
    return currentGroup.exercises
      .map((ex) => graph.exercises.get(ex.exerciseId as ExerciseId)?.name ?? 'Unknown')
      .join(' + ');
  }, [currentGroup, graph]);

  // No active session
  if (!session) {
    return (
      <div className="flex flex-col pb-20">
        <TopBar>
          <h1 className="text-xl font-bold text-text-primary">Active</h1>
        </TopBar>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Timer size={40} className="text-text-tertiary mb-3" />
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            No Active Workout
          </h2>
          <p className="text-sm text-text-tertiary">
            Go to Library and tap play to start a session.
          </p>
        </div>
        <div className="px-4">
          <AdSlot slotKey="rest_timer" />
        </div>
      </div>
    );
  }

  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  const isMultiExerciseGroup = (currentGroup?.exercises.length ?? 0) > 1;
  const groupLabel = getGroupLabel(currentGroup?.exercises.length ?? 0);

  return (
    <div className="flex flex-col gap-4 pb-20">
      <TopBar>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <MarqueeText
              text={session.workoutName || 'Workout'}
              className="text-lg font-bold text-text-primary"
            />
            <div className="text-xs text-text-tertiary">
              {completedSets}/{totalSets} sets completed
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
            {isPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={beginSession}
                className="text-success border-success/30 hover:bg-success/10"
              >
                <Play size={14} className="mr-1" />
                Start
              </Button>
            )}
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
            {isCompleted && !isSaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="text-success border-success/30 hover:bg-success/10"
              >
                <Save size={14} className="mr-1" />
                Save
              </Button>
            )}
            {isCompleted && isSaved && (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-text-tertiary border-border/30 opacity-60"
              >
                <Check size={14} className="mr-1" />
                Saved
              </Button>
            )}
            <span className="text-[10px] tabular-nums text-text-tertiary">
              {elapsed}
            </span>
          </div>
        </div>
      </TopBar>

      <div className="flex flex-col gap-4 px-4">

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-primary transition-all duration-300"
          style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
        />
      </div>

      {/* Group navigation */}
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
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentGroupIndex}-${currentGroup?.groupId}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {isMultiExerciseGroup ? (
                <>
                  <div className="text-[11px] font-medium text-accent-primary uppercase tracking-wide mb-0.5">
                    {groupLabel}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="text-sm font-semibold text-text-primary max-w-[220px] truncate">
                      {groupHeaderNames}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <div className="text-base font-semibold text-text-primary">
                    {firstExerciseInfo?.name ?? 'Unknown Exercise'}
                  </div>
                  {firstExerciseInfo?.video_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVideoOpen(true)}
                      aria-label="Watch video"
                      className="h-7 w-7"
                    >
                      <Video size={14} className="text-text-tertiary" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSwapOpen((o) => !o)}
                    aria-label="Swap exercise"
                    className="h-7 w-7"
                  >
                    <ArrowRightLeft size={14} className={swapOpen ? 'text-accent-primary' : ''} />
                  </Button>
                </div>
              )}
              <div className="text-xs text-text-tertiary">
                {isMultiExerciseGroup
                  ? `Group ${currentGroupIndex + 1} of ${totalGroups}`
                  : `Exercise ${currentGroupIndex + 1} of ${totalGroups}`}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
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

      {/* Substitute panel (standalone only) */}
      {firstExercise && !isMultiExerciseGroup && (
        <SubstitutePanel
          exerciseId={firstExercise.exerciseId as ExerciseId}
          open={swapOpen}
          onSwap={handleSwap}
        />
      )}

      {/* Rest timer */}
      <div className="flex flex-col items-center gap-2">
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
              <button
                onClick={wakeLock.toggle}
                aria-label={wakeLock.isActive ? 'Allow screen sleep' : 'Keep screen on'}
                className={`p-1.5 rounded-lg transition-colors ${
                  wakeLock.isActive
                    ? 'text-warning bg-warning/10'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <Smartphone size={18} />
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Rest timer ad */}
      <AdSlot slotKey="rest_timer" className="mt-1" />

      {/* Group set tracker */}
      {currentGroup && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGroupIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <GroupSetTracker
              group={currentGroup}
              defaultWeights={defaultWeights}
              onCompleteSet={handleCompleteSet}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Beginner tip — standalone exercises only */}
      {!isMultiExerciseGroup && (
        <AnimatePresence mode="wait">
          {firstExerciseInfo?.beginner_tips && (
            <motion.div
              key={firstExercise?.exerciseId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg bg-accent-primary/10 border border-accent-primary/20 px-3 py-2"
            >
              <span className="text-xs text-accent-primary">{firstExerciseInfo.beginner_tips}</span>
            </motion.div>
          )}
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
                timer.stop();
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

      <VideoSheet
        exercise={firstExerciseInfo}
        open={videoOpen}
        onOpenChange={setVideoOpen}
      />

      {/* Save summary sheet */}
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
                    <div className="text-sm font-medium text-text-primary">{stats.totalWeight.toLocaleString()} lb</div>
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

      {/* Exercise picker for mid-session add */}
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdd={handleAddExercise}
      />
      </div>
    </div>
  );
}
