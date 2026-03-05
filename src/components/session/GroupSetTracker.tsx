import { memo, useCallback, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { vibrate } from '@/utils/haptics';
import { useStore } from '@/store';
import type { ExerciseGroup } from '@/utils/groupUtils';
import type { SetLog, ExerciseLog, ExerciseId } from '@/types';

interface GroupSetTrackerProps {
  group: ExerciseGroup<ExerciseLog>;
  defaultWeights: (number | null)[];
  onCompleteSet: (exerciseIndex: number, setIndex: number, data: SetLog) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet?: (exerciseIndex: number, setIndex: number) => void;
}

const DELETE_THRESHOLD = -80;

const SetRow = memo(function SetRow({
  set,
  setIndex,
  exerciseIndex,
  defaultWeight,
  canDelete,
  onComplete,
  onRemove,
}: {
  set: SetLog;
  setIndex: number;
  exerciseIndex: number;
  defaultWeight: number | null;
  canDelete: boolean;
  onComplete: (exerciseIndex: number, setIndex: number, data: SetLog) => void;
  onRemove?: (exerciseIndex: number, setIndex: number) => void;
}) {
  const controls = useAnimation();
  const [dragX, setDragX] = useState(0);

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

  const handleToggleComplete = useCallback(() => {
    onComplete(exerciseIndex, setIndex, {
      weight: set.weight ?? defaultWeight,
      reps: set.reps,
      completed: !set.completed,
    });
  }, [exerciseIndex, setIndex, set, defaultWeight, onComplete]);

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    setDragX(info.offset.x);
  }, []);

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      if (canDelete && info.offset.x < DELETE_THRESHOLD && onRemove) {
        vibrate(50);
        await controls.start({ x: -400, opacity: 0, transition: { duration: 0.2 } });
        onRemove(exerciseIndex, setIndex);
      } else {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
      }
      setDragX(0);
    },
    [canDelete, controls, exerciseIndex, setIndex, onRemove]
  );

  const showTrash = canDelete && dragX < -30;

  return (
    <div className="relative overflow-hidden rounded-lg" data-swipe-row>
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 rounded-r-lg transition-opacity ${
          showTrash ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: 'var(--color-destructive)' }}
      >
        <Trash2 size={18} className="text-white" />
      </div>

      <motion.div
        animate={controls}
        drag={canDelete ? 'x' : false}
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`relative flex items-center gap-2 rounded-lg px-3 py-2 ${
          set.completed
            ? 'bg-success/10 border border-success/20'
            : 'bg-bg-elevated border border-border-subtle'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        <span className="text-xs font-medium text-text-tertiary w-6">
          {setIndex + 1}
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={set.weight ?? ''}
          onChange={handleWeightChange}
          placeholder={defaultWeight?.toString() ?? '—'}
          aria-label={`Set ${setIndex + 1} weight`}
          className="w-16 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
        <span className="text-xs text-text-tertiary">lb</span>
        <span className="text-xs text-text-tertiary mx-1">&times;</span>
        <input
          type="number"
          inputMode="numeric"
          value={set.reps ?? ''}
          onChange={handleRepsChange}
          placeholder="—"
          aria-label={`Set ${setIndex + 1} reps`}
          className="w-14 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
        <span className="text-xs text-text-tertiary">reps</span>
        <div className="flex-1" />
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
      </motion.div>
    </div>
  );
});

export const GroupSetTracker = memo(function GroupSetTracker({
  group,
  defaultWeights,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
}: GroupSetTrackerProps) {
  const graph = useStore((state) => state.graph);
  const isSuperset = group.exercises.length > 1;

  if (!isSuperset) {
    // Standalone exercise — render like the original SetTracker
    const exercise = group.exercises[0];
    const exerciseIdx = group.indices[0];
    const canDelete = exercise.sets.length > 1;

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
        {exercise.sets.map((set, i) => (
          <SetRow
            key={i}
            set={set}
            setIndex={i}
            exerciseIndex={exerciseIdx}
            defaultWeight={defaultWeights[0]}
            canDelete={canDelete}
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

            return (
              <div key={exOffset} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-accent-primary ml-1">
                  {info?.name ?? 'Unknown'}
                </span>
                <SetRow
                  set={set}
                  setIndex={roundIdx}
                  exerciseIndex={exerciseIdx}
                  defaultWeight={defaultWeights[exOffset]}
                  canDelete={canDelete}
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
