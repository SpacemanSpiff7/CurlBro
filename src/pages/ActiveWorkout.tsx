import { useCallback, useMemo, useState } from 'react';
import { ArrowRightLeft, Check, ChevronLeft, ChevronRight, Play, Plus, Save, Square, Timer, Video } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SetTracker } from '@/components/session/SetTracker';
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
import { computeLogStats } from '@/utils/logUtils';
import type { SetLog, ExerciseId, WorkoutLog } from '@/types';

function WakeLockToggle({ isActive, isSupported, onToggle }: {
  isActive: boolean;
  isSupported: boolean;
  onToggle: () => void;
}) {
  if (!isSupported) return null;

  return (
    <button
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? 'Allow screen sleep' : 'Keep screen on'}
      onClick={onToggle}
      className="flex items-center gap-1.5"
    >
      <span className="text-[10px] text-text-tertiary uppercase tracking-wide">
        Screen
      </span>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
          isActive ? 'bg-warning/80' : 'bg-bg-elevated'
        }`}
        style={isActive ? {
          boxShadow: '0 0 8px var(--color-warning), 0 0 20px color-mix(in srgb, var(--color-warning) 30%, transparent)',
        } : undefined}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform duration-200 ${
            isActive ? 'translate-x-5 bg-white' : 'translate-x-0 bg-text-tertiary'
          }`}
        />
      </div>
    </button>
  );
}

export function ActiveWorkout() {
  const session = useStore((state) => state.session.active);
  const graph = useStore((state) => state.graph);
  const { completeSet, addSet, removeSet, goToExercise, beginSession, endSession, swapExercise, saveSession, addExerciseToSession } = useStore(
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

  // Derive saved status from store — no reset logic needed
  const logs = useStore((state) => state.library.logs);
  const isSaved = useMemo(() => {
    if (!session?.startedAt) return false;
    return logs.some((l) => l.workoutId === session.workoutId && l.startedAt === session.startedAt);
  }, [session, logs]);

  // Find the original workout to get restSeconds per exercise
  const workouts = useStore((state) => state.library.workouts);
  const originalWorkout = useMemo(() => {
    if (!session) return null;
    return workouts.find((w) => w.id === session.workoutId) ?? null;
  }, [session, workouts]);

  const currentExercise = useMemo(() => {
    if (!session) return null;
    return session.exercises[session.currentExerciseIndex] ?? null;
  }, [session]);

  const exerciseInfo = useMemo(() => {
    if (!currentExercise) return null;
    return graph.exercises.get(currentExercise.exerciseId as ExerciseId) ?? null;
  }, [currentExercise, graph]);

  const restSeconds = useMemo(() => {
    if (!session || !originalWorkout) return 60;
    const orig = originalWorkout.exercises[session.currentExerciseIndex];
    return orig?.restSeconds ?? 60;
  }, [session, originalWorkout]);

  const defaultWeight = useMemo(() => {
    if (!session || !originalWorkout) return null;
    return originalWorkout.exercises[session.currentExerciseIndex]?.weight ?? null;
  }, [session, originalWorkout]);

  const handleCompleteSet = useCallback(
    (setIndex: number, data: SetLog) => {
      if (!session) return;
      completeSet(session.currentExerciseIndex, setIndex, data);
    },
    [session, completeSet]
  );

  const handleAddSet = useCallback(() => {
    if (!session) return;
    addSet(session.currentExerciseIndex);
  }, [session, addSet]);

  const handleRemoveSet = useCallback(
    (setIndex: number) => {
      if (!session) return;
      removeSet(session.currentExerciseIndex, setIndex);
      toast('Set removed', { duration: 2000 });
    },
    [session, removeSet]
  );

  const handlePrev = useCallback(() => {
    if (!session || session.currentExerciseIndex <= 0) return;
    goToExercise(session.currentExerciseIndex - 1);
    timer.stop();
  }, [session, goToExercise, timer]);

  const handleNext = useCallback(() => {
    if (!session || session.currentExerciseIndex >= session.exercises.length - 1) return;
    goToExercise(session.currentExerciseIndex + 1);
    timer.stop();
  }, [session, goToExercise, timer]);

  const handleFinish = useCallback(() => {
    endSession(); // endSession already pushes the log to library.logs
  }, [endSession]);

  const handleSwap = useCallback(
    (newId: ExerciseId) => {
      if (!session) return;
      const newExercise = graph.exercises.get(newId);
      swapExercise(session.currentExerciseIndex, newId);
      setSwapOpen(false);
      toast.success(`Swapped to ${newExercise?.name ?? 'new exercise'}`);
    },
    [session, graph, swapExercise]
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
      </div>
    );
  }

  const totalExercises = session.exercises.length;
  const currentIndex = session.currentExerciseIndex;
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

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

      {/* Exercise navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          aria-label="Previous exercise"
          className="h-9 w-9"
        >
          <ChevronLeft size={18} />
        </Button>
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${currentExercise?.exerciseId}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <div className="text-base font-semibold text-text-primary">
                  {exerciseInfo?.name ?? 'Unknown Exercise'}
                </div>
                {exerciseInfo?.video_url && (
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
              <div className="text-xs text-text-tertiary">
                {currentIndex + 1} of {totalExercises}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex >= totalExercises - 1}
          aria-label="Next exercise"
          className="h-9 w-9"
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Substitute panel */}
      {currentExercise && (
        <SubstitutePanel
          exerciseId={currentExercise.exerciseId as ExerciseId}
          open={swapOpen}
          onSwap={handleSwap}
        />
      )}

      {/* Rest timer + wake lock */}
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
        />
        <WakeLockToggle
          isActive={wakeLock.isActive}
          isSupported={wakeLock.isSupported}
          onToggle={wakeLock.toggle}
        />
      </div>

      {/* Set tracker */}
      {currentExercise && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <SetTracker
              sets={currentExercise.sets}
              defaultWeight={defaultWeight}
              onCompleteSet={handleCompleteSet}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Beginner tip — below sets/Add Set */}
      <AnimatePresence mode="wait">
        {exerciseInfo?.beginner_tips && (
          <motion.div
            key={currentExercise?.exerciseId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="rounded-lg bg-accent-primary/10 border border-accent-primary/20 px-3 py-2"
          >
            <span className="text-xs text-accent-primary">{exerciseInfo.beginner_tips}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise dots */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {session.exercises.map((ex, i) => {
          const allDone = ex.sets.every((s) => s.completed);
          const someDone = ex.sets.some((s) => s.completed);
          return (
            <button
              key={i}
              onClick={() => {
                goToExercise(i);
                timer.stop();
              }}
              aria-label={`Go to exercise ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-6 bg-accent-primary'
                  : allDone
                    ? 'w-2.5 bg-success'
                    : someDone
                      ? 'w-2.5 bg-warning'
                      : 'w-2.5 bg-bg-elevated'
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
        exercise={exerciseInfo}
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
