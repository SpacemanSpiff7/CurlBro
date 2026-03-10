import { memo, useCallback, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SwipeToDelete } from '@/components/shared/SwipeToDelete';
import { SetTimerButton } from './SetTimerButton';
import { SetTimerFill } from './SetTimerFill';
import { useSetTimer, startSetTimer, pauseSetTimer, resumeSetTimer, restartSetTimer, stopSetTimer } from '@/hooks/useSetTimer';
import { useStore } from '@/store';
import type { ExerciseGroup } from '@/utils/groupUtils';
import type { SetLog, ExerciseLog, ExerciseId, TrackingFlags, WeightUnit, DistanceUnit } from '@/types';

interface GroupSetTrackerProps {
  group: ExerciseGroup<ExerciseLog>;
  defaultWeights: (number | null)[];
  defaultFlags?: TrackingFlags[];
  onCompleteSet: (exerciseIndex: number, setIndex: number, data: SetLog) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet?: (exerciseIndex: number, setIndex: number) => void;
  planNotes?: string[];
  /** Prescribed duration per exercise (from WorkoutExercise.durationSeconds) */
  prescribedDurations?: (number | undefined)[];
}

const SetRow = memo(function SetRow({
  set,
  setIndex,
  exerciseIndex,
  defaultWeight,
  canDelete,
  trackingFlags,
  defaultFlags: defaultFlagsProp,
  prescribedDuration,
  weightUnit,
  distanceUnit,
  onComplete,
  onRemove,
}: {
  set: SetLog;
  setIndex: number;
  exerciseIndex: number;
  defaultWeight: number | null;
  canDelete: boolean;
  trackingFlags: TrackingFlags;
  defaultFlags?: TrackingFlags;
  prescribedDuration?: number;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  onComplete: (exerciseIndex: number, setIndex: number, data: SetLog) => void;
  onRemove?: (exerciseIndex: number, setIndex: number) => void;
}) {
  const timerState = useSetTimer();
  const timerId = `${exerciseIndex}-${setIndex}`;
  const isMyTimer = timerState.activeId === timerId;
  const isTimerRunning = isMyTimer && timerState.isRunning;
  const isTimerPaused = isMyTimer && timerState.isPaused;
  const isTimerCompleted = isMyTimer && timerState.completed;
  const showTimer = trackingFlags.trackDuration && !set.completed;
  const timerDuration = prescribedDuration ?? (set.durationSeconds ?? 30);

  const handleWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onComplete(exerciseIndex, setIndex, {
        ...set,
        weight: val === '' ? null : parseFloat(val),
      });
    },
    [exerciseIndex, setIndex, set, onComplete]
  );

  const handleRepsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onComplete(exerciseIndex, setIndex, {
        ...set,
        reps: val === '' ? null : parseInt(val),
      });
    },
    [exerciseIndex, setIndex, set, onComplete]
  );

  const handleDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      onComplete(exerciseIndex, setIndex, {
        ...set,
        durationSeconds: raw === '' ? null : parseInt(raw),
      });
    },
    [exerciseIndex, setIndex, set, onComplete]
  );

  const handleDistanceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      onComplete(exerciseIndex, setIndex, {
        ...set,
        distanceMeters: raw === '' ? null : parseFloat(raw),
      });
    },
    [exerciseIndex, setIndex, set, onComplete]
  );

  const handleToggleComplete = useCallback(() => {
    // Stop set timer on manual completion (no flash/beep — just reset to idle)
    if (!set.completed && isMyTimer && (isTimerRunning || isTimerPaused)) {
      stopSetTimer();
    }
    onComplete(exerciseIndex, setIndex, {
      ...set,
      weight: set.weight ?? defaultWeight,
      completed: !set.completed,
    });
  }, [exerciseIndex, setIndex, set, defaultWeight, onComplete, isMyTimer, isTimerRunning, isTimerPaused]);

  const handleTimerStart = useCallback(() => {
    startSetTimer(timerId, timerDuration, () => {
      onComplete(exerciseIndex, setIndex, {
        ...set,
        durationSeconds: timerDuration,
        completed: true,
      });
    });
  }, [timerId, timerDuration, exerciseIndex, setIndex, set, onComplete]);

  const handleTimerPause = useCallback(() => pauseSetTimer(), []);
  const handleTimerResume = useCallback(() => resumeSetTimer(), []);
  const handleTimerRestart = useCallback(() => restartSetTimer(), []);

  const df = defaultFlagsProp ?? trackingFlags;
  const hasSecondaryFields =
    (trackingFlags.trackWeight && !df.trackWeight) ||
    (trackingFlags.trackReps && !df.trackReps) ||
    (trackingFlags.trackDuration && !df.trackDuration) ||
    (trackingFlags.trackDistance && !df.trackDistance);

  const [secondaryExpanded, setSecondaryExpanded] = useState(false);

  const rowContent = (
    <div
      className={`relative rounded-lg overflow-hidden ${
        set.completed
          ? 'bg-success/10 border border-success/20'
          : isTimerRunning
            ? 'bg-bg-elevated border border-warning/40'
            : 'bg-bg-elevated border border-border-subtle'
      }`}
    >
      {/* Timer fill background */}
      {(isMyTimer || isTimerCompleted) && (
        <SetTimerFill
          progress={timerState.progress}
          completed={isTimerCompleted}
          isRunning={isTimerRunning}
        />
      )}

      {/* Primary row — default fields */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-2 w-full">
        <span className="text-xs font-medium text-text-tertiary w-6">
          {setIndex + 1}
        </span>
        {df.trackWeight && trackingFlags.trackWeight && (
          <>
            <input
              type="number"
              inputMode="decimal"
              value={set.weight ?? ''}
              onChange={handleWeightChange}
              placeholder={defaultWeight?.toString() ?? '—'}
              aria-label={`Set ${setIndex + 1} weight`}
              className="w-16 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <span className="text-xs text-text-tertiary">{weightUnit}</span>
          </>
        )}
        {df.trackWeight && trackingFlags.trackWeight && df.trackReps && trackingFlags.trackReps && (
          <span className="text-xs text-text-tertiary mx-1">&times;</span>
        )}
        {df.trackReps && trackingFlags.trackReps && (
          <>
            <input
              type="number"
              inputMode="numeric"
              value={set.reps ?? ''}
              onChange={handleRepsChange}
              placeholder="—"
              aria-label={`Set ${setIndex + 1} reps`}
              className="w-14 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <span className="text-xs text-text-tertiary">reps</span>
          </>
        )}
        {df.trackDuration && trackingFlags.trackDuration && (
          <>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={isTimerRunning || isTimerPaused ? timerState.remainingSeconds : (set.durationSeconds != null ? set.durationSeconds : '')}
              onChange={handleDurationChange}
              placeholder={prescribedDuration?.toString() ?? '0'}
              aria-label={`Set ${setIndex + 1} duration`}
              readOnly={isTimerRunning || isTimerPaused}
              className="w-20 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <span className="text-xs text-text-tertiary">sec</span>
          </>
        )}
        {df.trackDistance && trackingFlags.trackDistance && (
          <>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              value={set.distanceMeters != null ? set.distanceMeters : ''}
              onChange={handleDistanceChange}
              placeholder="0"
              aria-label={`Set ${setIndex + 1} distance`}
              className="w-20 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <span className="text-xs text-text-tertiary">{distanceUnit}</span>
          </>
        )}
        <div className="flex-1" />
        {hasSecondaryFields && (
          <button
            onClick={() => setSecondaryExpanded(!secondaryExpanded)}
            aria-label={secondaryExpanded ? 'Hide extra fields' : 'Show extra fields'}
            className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${secondaryExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
        {showTimer && (
          <SetTimerButton
            isRunning={isTimerRunning}
            isPaused={isTimerPaused}
            isIdle={!isMyTimer || (!isTimerRunning && !isTimerPaused)}
            onStart={handleTimerStart}
            onPause={handleTimerPause}
            onResume={handleTimerResume}
            onRestart={handleTimerRestart}
          />
        )}
        <button
          onClick={handleToggleComplete}
          aria-label={set.completed ? `Undo set ${setIndex + 1}` : `Complete set ${setIndex + 1}`}
          className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
            set.completed
              ? 'bg-success text-bg-root'
              : 'bg-bg-surface border border-border-subtle text-text-tertiary hover:border-accent-primary'
          }`}
        >
          <Check size={14} />
        </button>
      </div>
      {/* Secondary row — non-default active fields */}
      <AnimatePresence>
        {secondaryExpanded && hasSecondaryFields && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden relative z-10"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border-subtle/50">
              <span className="w-6" />
              {!df.trackWeight && trackingFlags.trackWeight && (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={set.weight ?? ''}
                    onChange={handleWeightChange}
                    placeholder={defaultWeight?.toString() ?? '—'}
                    aria-label={`Set ${setIndex + 1} weight`}
                    className="w-16 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <span className="text-xs text-text-tertiary">{weightUnit}</span>
                </>
              )}
              {!df.trackReps && trackingFlags.trackReps && (
                <>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? ''}
                    onChange={handleRepsChange}
                    placeholder="—"
                    aria-label={`Set ${setIndex + 1} reps`}
                    className="w-14 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <span className="text-xs text-text-tertiary">reps</span>
                </>
              )}
              {!df.trackDuration && trackingFlags.trackDuration && (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={isTimerRunning || isTimerPaused ? timerState.remainingSeconds : (set.durationSeconds != null ? set.durationSeconds : '')}
                    onChange={handleDurationChange}
                    placeholder={prescribedDuration?.toString() ?? '0'}
                    aria-label={`Set ${setIndex + 1} duration`}
                    readOnly={isTimerRunning || isTimerPaused}
                    className="w-20 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <span className="text-xs text-text-tertiary">sec</span>
                </>
              )}
              {!df.trackDistance && trackingFlags.trackDistance && (
                <>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    value={set.distanceMeters != null ? set.distanceMeters : ''}
                    onChange={handleDistanceChange}
                    placeholder="0"
                    aria-label={`Set ${setIndex + 1} distance`}
                    className="w-20 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <span className="text-xs text-text-tertiary">{distanceUnit}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (canDelete && onRemove) {
    return (
      <SwipeToDelete onDelete={() => onRemove(exerciseIndex, setIndex)}>
        {rowContent}
      </SwipeToDelete>
    );
  }

  return rowContent;
});

export const GroupSetTracker = memo(function GroupSetTracker({
  group,
  defaultWeights,
  defaultFlags,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  planNotes,
  prescribedDurations,
}: GroupSetTrackerProps) {
  const graph = useStore((state) => state.graph);
  const weightUnit = useStore((state) => state.settings.weightUnit);
  const distanceUnit = useStore((state) => state.settings.distanceUnit);
  const isSuperset = group.exercises.length > 1;

  /** Extract tracking flags from an ExerciseLog */
  const getFlags = useCallback((ex: ExerciseLog): TrackingFlags => ({
    trackWeight: ex.trackWeight,
    trackReps: ex.trackReps,
    trackDuration: ex.trackDuration,
    trackDistance: ex.trackDistance,
  }), []);

  if (!isSuperset) {
    // Standalone exercise — render like the original SetTracker
    const exercise = group.exercises[0];
    const exerciseIdx = group.indices[0];
    const canDelete = exercise.sets.length > 1;
    const flags = getFlags(exercise);
    const prescribed = prescribedDurations?.[0];

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Sets
          </span>
          <span className="text-xs text-text-tertiary">
            {exercise.sets.filter((s) => s.completed).length}/{exercise.sets.length} done
          </span>
        </div>
        {planNotes?.[0] && (
          <p className="text-xs text-text-tertiary italic px-1 pb-1">{planNotes[0]}</p>
        )}
        {exercise.sets.map((set, i) => (
          <SetRow
            key={i}
            set={set}
            setIndex={i}
            exerciseIndex={exerciseIdx}
            defaultWeight={defaultWeights[0]}
            canDelete={canDelete}
            trackingFlags={flags}
            defaultFlags={defaultFlags?.[0]}
            prescribedDuration={prescribed}
            weightUnit={weightUnit}
            distanceUnit={distanceUnit}
            onComplete={onCompleteSet}
            onRemove={onRemoveSet}
          />
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddSet(exerciseIdx)}
          className="text-text-secondary"
        >
          <Plus size={14} className="mr-1" />
          Add Set
        </Button>
      </div>
    );
  }

  // Superset/tri-set/circuit — organize by rounds
  const maxSets = Math.max(...group.exercises.map((ex) => ex.sets.length));
  const totalSets = group.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = group.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Rounds
        </span>
        <span className="text-xs text-text-tertiary">
          {completedSets}/{totalSets} done
        </span>
      </div>

      {Array.from({ length: maxSets }, (_, roundIdx) => (
        <div key={roundIdx} className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
            Round {roundIdx + 1}
          </span>
          {group.exercises.map((exercise, exOffset) => {
            if (roundIdx >= exercise.sets.length) return null;
            const set = exercise.sets[roundIdx];
            const exerciseIdx = group.indices[exOffset];
            const info = graph.exercises.get(exercise.exerciseId as ExerciseId);
            const canDelete = exercise.sets.length > 1;
            const flags = getFlags(exercise);
            const prescribed = prescribedDurations?.[exOffset];

            return (
              <div key={exOffset} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-accent-primary ml-1">
                  {info?.name ?? 'Unknown'}
                </span>
                {roundIdx === 0 && planNotes?.[exOffset] && (
                  <p className="text-[10px] text-text-tertiary italic ml-1">{planNotes[exOffset]}</p>
                )}
                <SetRow
                  set={set}
                  setIndex={roundIdx}
                  exerciseIndex={exerciseIdx}
                  defaultWeight={defaultWeights[exOffset]}
                  canDelete={canDelete}
                  trackingFlags={flags}
                  defaultFlags={defaultFlags?.[exOffset]}
                  prescribedDuration={prescribed}
                  weightUnit={weightUnit}
                  distanceUnit={distanceUnit}
                  onComplete={onCompleteSet}
                  onRemove={onRemoveSet}
                />
              </div>
            );
          })}
        </div>
      ))}

      {/* Add set buttons for each exercise */}
      <div className="flex gap-2">
        {group.exercises.map((_, exOffset) => {
          const exerciseIdx = group.indices[exOffset];
          const info = graph.exercises.get(group.exercises[exOffset].exerciseId as ExerciseId);
          return (
            <Button
              key={exOffset}
              variant="ghost"
              size="sm"
              onClick={() => onAddSet(exerciseIdx)}
              className="text-text-secondary flex-1"
            >
              <Plus size={14} className="mr-1" />
              {group.exercises.length > 1
                ? `+ ${info?.name?.split(' ').slice(0, 2).join(' ') ?? 'Set'}`
                : 'Add Set'}
            </Button>
          );
        })}
      </div>
    </div>
  );
});
