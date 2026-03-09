import { memo, useCallback } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeToDelete } from '@/components/shared/SwipeToDelete';
import type { SetLog } from '@/types';

interface SetTrackerProps {
  sets: SetLog[];
  defaultWeight: number | null;
  onCompleteSet: (setIndex: number, data: SetLog) => void;
  onAddSet: () => void;
  onRemoveSet?: (setIndex: number) => void;
  planNotes?: string;
}

const SetRow = memo(function SetRow({
  set,
  index,
  defaultWeight,
  canDelete,
  onComplete,
  onRemove,
}: {
  set: SetLog;
  index: number;
  defaultWeight: number | null;
  canDelete: boolean;
  onComplete: (setIndex: number, data: SetLog) => void;
  onRemove?: (setIndex: number) => void;
}) {
  const handleWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onComplete(index, {
        ...set,
        weight: val === '' ? null : parseFloat(val),
      });
    },
    [index, set, onComplete]
  );

  const handleRepsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onComplete(index, {
        ...set,
        reps: val === '' ? null : parseInt(val),
      });
    },
    [index, set, onComplete]
  );

  const handleToggleComplete = useCallback(() => {
    onComplete(index, {
      weight: set.weight ?? defaultWeight,
      reps: set.reps,
      completed: !set.completed,
    });
  }, [index, set, defaultWeight, onComplete]);

  const rowContent = (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        set.completed
          ? 'bg-success/10 border border-success/20'
          : 'bg-bg-elevated border border-border-subtle'
      }`}
    >
      <span className="text-xs font-medium text-text-tertiary w-6">
        {index + 1}
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={set.weight ?? ''}
        onChange={handleWeightChange}
        placeholder={defaultWeight?.toString() ?? '—'}
        aria-label={`Set ${index + 1} weight`}
        className="w-16 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
      />
      <span className="text-xs text-text-tertiary">lb</span>
      <span className="text-xs text-text-tertiary mx-1">&times;</span>
      <input
        type="number"
        inputMode="numeric"
        value={set.reps ?? ''}
        onChange={handleRepsChange}
        placeholder="—"
        aria-label={`Set ${index + 1} reps`}
        className="w-14 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
      />
      <span className="text-xs text-text-tertiary">reps</span>
      <div className="flex-1" />
      <button
        onClick={handleToggleComplete}
        aria-label={set.completed ? `Undo set ${index + 1}` : `Complete set ${index + 1}`}
        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
          set.completed
            ? 'bg-success text-bg-root'
            : 'bg-bg-surface border border-border-subtle text-text-tertiary hover:border-accent-primary'
        }`}
      >
        <Check size={14} />
      </button>
    </div>
  );

  if (canDelete && onRemove) {
    return (
      <SwipeToDelete onDelete={() => onRemove(index)}>
        {rowContent}
      </SwipeToDelete>
    );
  }

  return rowContent;
});

export const SetTracker = memo(function SetTracker({
  sets,
  defaultWeight,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  planNotes,
}: SetTrackerProps) {
  const canDelete = sets.length > 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Sets
        </span>
        <span className="text-xs text-text-tertiary">
          {sets.filter((s) => s.completed).length}/{sets.length} done
        </span>
      </div>
      {planNotes && (
        <p className="text-xs text-text-tertiary italic px-1 pb-1">{planNotes}</p>
      )}
      {sets.map((set, i) => (
        <SetRow
          key={i}
          set={set}
          index={i}
          defaultWeight={defaultWeight}
          canDelete={canDelete}
          onComplete={onCompleteSet}
          onRemove={onRemoveSet}
        />
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddSet}
        className="text-text-secondary"
      >
        <Plus size={14} className="mr-1" />
        Add Set
      </Button>
    </div>
  );
});
