import { useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Square, Timer } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SetTracker } from '@/components/session/SetTracker';
import { RestTimer } from '@/components/session/RestTimer';
import { useStore } from '@/store';
import { useRestTimer } from '@/hooks/useRestTimer';
import type { SetLog, ExerciseId } from '@/types';

export function ActiveWorkout() {
  const session = useStore((state) => state.session.active);
  const graph = useStore((state) => state.graph);
  const { completeSet, addSet, goToExercise, endSession } = useStore(
    (state) => state.sessionActions
  );
  const setActiveTab = useStore((state) => state.setActiveTab);
  const addLog = useStore((state) => state.libraryActions.addLog);

  const timer = useRestTimer();

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
    const log = endSession();
    if (log) {
      addLog(log);
    }
    setActiveTab('library');
  }, [endSession, addLog, setActiveTab]);

  const handleStartTimer = useCallback(
    (seconds: number) => {
      timer.start(seconds);
    },
    [timer]
  );

  // No active session
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <Timer size={40} className="text-text-tertiary mb-3" />
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          No Active Workout
        </h2>
        <p className="text-sm text-text-tertiary">
          Go to My Workouts and tap play to start a session.
        </p>
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
    <div className="flex flex-col gap-4 px-4 py-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">
            {session.workoutName || 'Workout'}
          </h1>
          <div className="text-xs text-text-tertiary">
            {completedSets}/{totalSets} sets completed
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFinish}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Square size={14} className="mr-1" />
          Finish
        </Button>
      </div>

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
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="text-base font-semibold text-text-primary">
                {exerciseInfo?.name ?? 'Unknown Exercise'}
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

      {/* Beginner tip */}
      {exerciseInfo?.beginner_tips && (
        <div className="rounded-lg bg-accent-primary/10 border border-accent-primary/20 px-3 py-2">
          <span className="text-xs text-accent-primary">{exerciseInfo.beginner_tips}</span>
        </div>
      )}

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
              onStartTimer={handleStartTimer}
              restSeconds={restSeconds}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Rest timer */}
      <AnimatePresence>
        {(timer.isRunning || timer.isDone) && (
          <RestTimer
            remainingSeconds={timer.remainingSeconds}
            totalSeconds={timer.totalSeconds}
            progress={timer.progress}
            isRunning={timer.isRunning}
            isDone={timer.isDone}
            onStop={timer.stop}
            onAddTime={timer.addTime}
          />
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
      </div>
    </div>
  );
}
