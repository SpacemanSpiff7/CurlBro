import { useState, useCallback, useMemo } from 'react';
import { ClipboardList, Trash2, Copy, Save } from 'lucide-react';
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
import type { WorkoutLog, LogId } from '@/types';

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
  onDelete,
}: {
  log: WorkoutLog;
  onSelect: (log: WorkoutLog) => void;
  onDelete: (id: LogId) => void;
}) {
  const stats = useMemo(() => computeLogStats(log), [log]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(`Delete log for "${log.workoutName}"?`)) {
        onDelete(log.id);
      }
    },
    [log.id, log.workoutName, onDelete]
  );

  return (
    <div
      data-swipe-row
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
          {stats.totalWeight > 0 && (
            <>
              <span className="text-xs text-text-tertiary">·</span>
              <span className="text-xs text-text-tertiary">
                {stats.totalWeight.toLocaleString()} lbs
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
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        aria-label={`Delete ${log.workoutName} log`}
        className="h-9 w-9 flex-shrink-0 text-destructive hover:text-destructive"
      >
        <Trash2 size={14} />
      </Button>
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
      <SheetContent side="bottom" className="h-[80dvh] bg-bg-surface overflow-y-auto">
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
              {stats.totalWeight > 0 ? `${stats.totalWeight.toLocaleString()} lbs` : '--'}
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

        {/* Exercise breakdown */}
        <div className="mt-4 space-y-3">
          {log.exercises.map((exerciseLog, exIdx) => {
            const exercise = graph.exercises.get(exerciseLog.exerciseId);
            const name = exercise?.name ?? exerciseLog.exerciseId;
            return (
              <div key={exIdx} className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
                <div className="text-sm font-medium text-text-primary mb-2">{name}</div>
                <div className="space-y-1">
                  {exerciseLog.sets.map((set, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-2 text-xs">
                      <span className="text-text-tertiary w-4 text-right">{setIdx + 1}.</span>
                      <span className="text-text-secondary">
                        {set.weight != null ? `${set.weight} lbs` : '--'}
                        {' x '}
                        {set.reps != null ? set.reps : '--'}
                      </span>
                      <span className={set.completed ? 'text-green-400' : 'text-text-tertiary'}>
                        {set.completed ? '\u2713' : '\u2717'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
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
            aria-label="Copy log to clipboard"
          >
            <Copy size={14} className="mr-1.5" />
            Copy
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
          sortedLogs.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <LogDetailSheet
        log={selectedLog}
        open={sheetOpen}
        onOpenChange={handleSheetChange}
      />
    </div>
  );
}
