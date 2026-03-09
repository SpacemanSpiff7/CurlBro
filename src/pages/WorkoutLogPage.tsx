import { useState, useCallback, useMemo, Fragment } from 'react';
import { ClipboardList, Trash2, Share2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deriveGroups, getGroupLabel } from '@/utils/groupUtils';
import { AdSlot } from '@/components/ads/AdSlot';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { toast } from 'sonner';
import { useStore } from '@/store';
import { TopBar } from '@/components/shared/TopBar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { computeLogStats, logToSavedWorkout, formatLogForClipboard } from '@/utils/logUtils';
import { convertWeight, formatWeight } from '@/utils/unitConversion';
import type { WorkoutLog, LogId, WeightUnit } from '@/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function LogRow({
  log,
  onSelect,
  displayUnit,
}: {
  log: WorkoutLog;
  onSelect: (log: WorkoutLog) => void;
  displayUnit: WeightUnit;
}) {
  const stats = useMemo(() => computeLogStats(log), [log]);
  const displayWeight = useMemo(() => {
    if (stats.totalWeight <= 0) return null;
    const converted = convertWeight(stats.totalWeight, log.weightUnit ?? 'lb', displayUnit);
    return formatWeight(converted, displayUnit);
  }, [stats.totalWeight, log.weightUnit, displayUnit]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${log.workoutName} log from ${formatDate(log.completedAt)}`}
      onClick={() => onSelect(log)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(log);
        }
      }}
      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-3 cursor-pointer active:bg-bg-elevated transition-colors"
      style={{ minHeight: '56px' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {log.workoutName || 'Untitled'}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-text-tertiary">{formatDate(log.completedAt)}</span>
          <span className="text-xs text-text-tertiary">·</span>
          <span className="text-xs text-text-tertiary">{formatDuration(log.durationMinutes)}</span>
          {displayWeight && (
            <>
              <span className="text-xs text-text-tertiary">·</span>
              <span className="text-xs text-text-tertiary">
                {displayWeight}
              </span>
            </>
          )}
          <span className="text-xs text-text-tertiary">·</span>
          <span className="text-xs text-text-tertiary">
            {stats.exerciseCount} exercises
          </span>
          <span className="text-xs text-text-tertiary">·</span>
          <span className="text-xs text-text-tertiary">
            {stats.completedSets}/{stats.totalSets} sets
          </span>
        </div>
      </div>
    </div>
  );
}

function LogDetailSheet({
  log,
  open,
  onOpenChange,
}: {
  log: WorkoutLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const graph = useStore((state) => state.graph);
  const saveWorkout = useStore((state) => state.libraryActions.saveWorkout);
  const updateLogNotes = useStore((state) => state.libraryActions.updateLogNotes);
  const currentWeightUnit = useStore((state) => state.settings.weightUnit);

  if (!log) return null;

  const stats = computeLogStats(log);

  const handleSaveAsWorkout = () => {
    const workout = logToSavedWorkout(log);
    saveWorkout(workout);
    toast.success('Saved to Library', { duration: 1500 });
  };

  const handleCopy = async () => {
    const text = formatLogForClipboard(log, graph);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard', { duration: 1500 });
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80dvh] bg-bg-surface overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle className="text-text-primary">{log.workoutName || 'Untitled'}</SheetTitle>
          <div className="text-xs text-text-tertiary">{formatDate(log.completedAt)}</div>
        </SheetHeader>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-lg bg-bg-elevated p-2.5">
            <div className="text-[10px] text-text-tertiary uppercase tracking-wide">Duration</div>
            <div className="text-sm font-medium text-text-primary">{formatDuration(log.durationMinutes)}</div>
          </div>
          <div className="rounded-lg bg-bg-elevated p-2.5">
            <div className="text-[10px] text-text-tertiary uppercase tracking-wide">Total Weight</div>
            <div className="text-sm font-medium text-text-primary">
              {stats.totalWeight > 0
                ? formatWeight(
                    convertWeight(stats.totalWeight, log.weightUnit ?? 'lb', currentWeightUnit),
                    currentWeightUnit,
                  )
                : '--'}
            </div>
          </div>
          <div className="rounded-lg bg-bg-elevated p-2.5">
            <div className="text-[10px] text-text-tertiary uppercase tracking-wide">Exercises</div>
            <div className="text-sm font-medium text-text-primary">{stats.exerciseCount}</div>
          </div>
          <div className="rounded-lg bg-bg-elevated p-2.5">
            <div className="text-[10px] text-text-tertiary uppercase tracking-wide">Sets</div>
            <div className="text-sm font-medium text-text-primary">{stats.completedSets}/{stats.totalSets}</div>
          </div>
        </div>

        {/* Session Notes */}
        <div className="mt-3">
          <label className="text-[10px] text-text-tertiary uppercase tracking-wide font-medium">Session Notes</label>
          <textarea
            value={log.notes ?? ''}
            onChange={(e) => updateLogNotes(log.id as LogId, e.target.value)}
            placeholder="Add session notes..."
            className="w-full mt-1 rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-base md:text-sm text-text-primary placeholder:text-text-tertiary resize-y"
            rows={4}
            aria-label="Session notes"
          />
        </div>

        {/* Exercise breakdown */}
        <div className="mt-4 space-y-3">
          {deriveGroups(log.exercises).map((group) => {
            const label = getGroupLabel(group.exercises.length);

            const renderExerciseLog = (exerciseLog: typeof log.exercises[number], idx: number) => {
              const exercise = graph.exercises.get(exerciseLog.exerciseId);
              const name = exercise?.name ?? exerciseLog.exerciseId;
              return (
                <div key={idx} className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
                  <div className="text-sm font-medium text-text-primary mb-1">{name}</div>
                  {exerciseLog.planNotes && (
                    <p className="text-xs text-text-tertiary italic mb-2">{exerciseLog.planNotes}</p>
                  )}
                  <div className="space-y-1">
                    {exerciseLog.sets.map((set, setIdx) => (
                      <div key={setIdx} className="flex items-center gap-2 text-xs">
                        <span className="text-text-tertiary w-4 text-right">{setIdx + 1}.</span>
                        <span className="text-text-secondary">
                          {set.weight != null
                            ? formatWeight(
                                convertWeight(set.weight, log.weightUnit ?? 'lb', currentWeightUnit),
                                currentWeightUnit,
                              )
                            : '--'}
                          {exerciseLog.trackReps !== false && (
                            <> x {set.reps != null ? set.reps : '--'}</>
                          )}
                          {set.durationSeconds != null && (
                            <> · {set.durationSeconds}s</>
                          )}
                          {set.distanceMeters != null && (
                            <> · {set.distanceMeters} {log.distanceUnit ?? 'mi'}</>
                          )}
                        </span>
                        <span className={set.completed ? 'text-green-600 dark:text-green-400' : 'text-text-tertiary'}>
                          {set.completed ? '\u2713' : '\u2717'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            if (label) {
              return (
                <div
                  key={group.groupId}
                  className="rounded-lg border-l-2 border-accent-primary pl-3 space-y-2"
                >
                  <Badge variant="outline" className="text-[10px]">
                    {label}
                  </Badge>
                  {group.exercises.map((ex, i) => renderExerciseLog(ex, group.indices[i]))}
                </div>
              );
            }

            return renderExerciseLog(group.exercises[0], group.indices[0]);
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pb-4">
          <Button
            onClick={handleSaveAsWorkout}
            className="flex-1 bg-accent-primary text-bg-root hover:bg-accent-hover"
            aria-label="Save as workout"
          >
            <Save size={14} className="mr-1.5" />
            Save as Workout
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex-1"
            aria-label="Share log to clipboard"
          >
            <Share2 size={14} className="mr-1.5" />
            Share
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function WorkoutLogPage() {
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const logs = useStore((state) => state.library.logs);
  const deleteLog = useStore((state) => state.libraryActions.deleteLog);
  const weightUnit = useStore((state) => state.settings.weightUnit);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [logs]
  );

  const handleSelect = useCallback((log: WorkoutLog) => {
    setSelectedLog(log);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: LogId) => {
      deleteLog(id);
      if (selectedLog?.id === id) {
        setSheetOpen(false);
        setSelectedLog(null);
      }
    },
    [deleteLog, selectedLog]
  );

  const handleSheetChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedLog(null);
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-20">
      <TopBar>
        <h1 className="text-xl font-bold text-text-primary">Workout Log</h1>
      </TopBar>

      <div className="flex flex-col gap-2 px-4">
        {sortedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList size={48} className="text-text-tertiary mb-3" />
            <div className="text-sm text-text-secondary">No workouts logged yet</div>
            <div className="text-xs text-text-tertiary mt-1">
              Complete a workout to see it here
            </div>
          </div>
        ) : (
          sortedLogs.map((log, index) => {
            const logActions: SwipeAction[] = [
              {
                key: 'delete',
                label: 'Delete',
                icon: <Trash2 size={16} />,
                color: 'bg-destructive',
                onAction: () => handleDelete(log.id),
                requiresConfirm: true,
              },
            ];

            return (
              <Fragment key={log.id}>
                <SwipeToReveal actions={logActions}>
                  <LogRow
                    log={log}
                    onSelect={handleSelect}
                    displayUnit={weightUnit}
                  />
                </SwipeToReveal>
                {sortedLogs.length >= 5 && (index + 1) % 4 === 0 && index < sortedLogs.length - 1 && (
                  <AdSlot slotKey="log_feed" />
                )}
              </Fragment>
            );
          })
        )}
        {/* Bottom ad — always visible */}
        <AdSlot slotKey="log_feed" className="mt-2" />
      </div>

      <LogDetailSheet
        log={selectedLog}
        open={sheetOpen}
        onOpenChange={handleSheetChange}
      />
    </div>
  );
}
