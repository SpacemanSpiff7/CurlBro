import { memo, useCallback, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SwipeToDelete } from '@/components/shared/SwipeToDelete';
import { useStore } from '@/store';
import type { SetLog, TrackingFlags } from '@/types';

interface SetTrackerProps {
  sets: SetLog[];
  defaultWeight: number | null;
  trackingFlags: TrackingFlags;
  defaultFlags?: TrackingFlags;
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
  trackingFlags,
  defaultFlags: defaultFlagsProp,
  weightLabel,
  distanceLabel,
  onComplete,
  onRemove,
}: {
  set: SetLog;
  index: number;
  defaultWeight: number | null;
  canDelete: boolean;
  trackingFlags: TrackingFlags;
  defaultFlags?: TrackingFlags;
  weightLabel: string;
  distanceLabel: string;
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

  const handleDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      onComplete(index, {
        ...set,
        durationSeconds: raw === '' ? null : parseInt(raw),
      });
    },
    [index, set, onComplete]
  );

  const handleDistanceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      onComplete(index, {
        ...set,
        distanceMeters: raw === '' ? null : parseFloat(raw),
      });
    },
    [index, set, onComplete]
  );

  const handleToggleComplete = useCallback(() => {
    onComplete(index, {
      ...set,
      weight: set.weight ?? defaultWeight,
      completed: !set.completed,
    });
  }, [index, set, defaultWeight, onComplete]);

  const df = defaultFlagsProp ?? trackingFlags;
  const hasSecondaryFields =
    (trackingFlags.trackWeight && !df.trackWeight) ||
    (trackingFlags.trackReps && !df.trackReps) ||
    (trackingFlags.trackDuration && !df.trackDuration) ||
    (trackingFlags.trackDistance && !df.trackDistance);

  const [secondaryExpanded, setSecondaryExpanded] = useState(false);

  const rowContent = (
    <div
      className={`rounded-lg overflow-hidden ${
        set.completed
          ? 'bg-success/10 border border-success/20'
          : 'bg-bg-elevated border border-border-subtle'
      }`}
    >
      {/* Primary row — default fields */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-xs font-medium text-text-tertiary w-6">
          {index + 1}
        </span>
        {df.trackWeight && trackingFlags.trackWeight && (
          <>
            <input
              type="number"
              inputMode="decimal"
              value={set.weight ?? ''}
              onChange={handleWeightChange}
              placeholder={defaultWeight?.toString() ?? '—'}
              aria-label={`Set ${index + 1} weight`}
              className="w-16 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <span className="text-xs text-text-tertiary">{weightLabel}</span>
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
              aria-label={`Set ${index + 1} reps`}
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
              value={set.durationSeconds != null ? set.durationSeconds : ''}
              onChange={handleDurationChange}
              placeholder="0"
              aria-label={`Set ${index + 1} duration`}
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
              aria-label={`Set ${index + 1} distance`}
              className="w-20 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <span className="text-xs text-text-tertiary">{distanceLabel}</span>
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
      {/* Secondary row — non-default active fields */}
      <AnimatePresence>
        {secondaryExpanded && hasSecondaryFields && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
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
                    aria-label={`Set ${index + 1} weight`}
                    className="w-16 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <span className="text-xs text-text-tertiary">{weightLabel}</span>
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
                    aria-label={`Set ${index + 1} reps`}
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
                    value={set.durationSeconds != null ? set.durationSeconds : ''}
                    onChange={handleDurationChange}
                    placeholder="0"
                    aria-label={`Set ${index + 1} duration`}
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
                    aria-label={`Set ${index + 1} distance`}
                    className="w-20 rounded bg-bg-surface border border-border-subtle px-2 py-1.5 text-base md:text-sm text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <span className="text-xs text-text-tertiary">{distanceLabel}</span>
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
  trackingFlags,
  defaultFlags,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  planNotes,
}: SetTrackerProps) {
  const weightUnit = useStore((state) => state.settings.weightUnit);
  const distanceUnit = useStore((state) => state.settings.distanceUnit);
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
          trackingFlags={trackingFlags}
          defaultFlags={defaultFlags}
          weightLabel={weightUnit}
          distanceLabel={distanceUnit}
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
