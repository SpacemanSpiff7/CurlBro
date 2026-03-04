import { useState, useCallback } from 'react';
import { Play, Pencil, Trash2, Upload, Download, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useStore } from '@/store';
import { formatExport } from '@/utils/formatExport';
import { parseImport } from '@/utils/parseImport';
import type { SavedWorkout, WorkoutId } from '@/types';

function ImportSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{
    warnings: string[];
    errors: string[];
    name?: string;
    count?: number;
  } | null>(null);
  const graph = useStore((state) => state.graph);
  const saveWorkout = useStore((state) => state.libraryActions.saveWorkout);

  const handlePreview = useCallback(() => {
    const parsed = parseImport(text, graph);
    setResult({
      warnings: parsed.warnings,
      errors: parsed.errors,
      name: parsed.workout?.name,
      count: parsed.workout?.exercises.length,
    });
    if (parsed.workout && parsed.errors.length === 0) {
      saveWorkout(parsed.workout);
      setText('');
      setResult(null);
      onOpenChange(false);
    }
  }, [text, graph, saveWorkout, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70dvh] bg-bg-surface">
        <SheetHeader>
          <SheetTitle className="text-text-primary">Import Workout</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste workout text here..."
            className="w-full h-40 rounded-lg bg-bg-elevated border border-border-subtle p-3 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-1 focus:ring-accent-primary"
            aria-label="Import text"
          />
          {result && (
            <div className="space-y-1">
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-destructive">{e}</div>
              ))}
              {result.warnings.map((w, i) => (
                <div key={i} className="text-xs text-warning">{w}</div>
              ))}
              {result.name && (
                <div className="text-xs text-success">
                  Ready: {result.name} ({result.count} exercises)
                </div>
              )}
            </div>
          )}
          <Button
            onClick={handlePreview}
            disabled={!text.trim()}
            className="bg-accent-primary text-bg-root hover:bg-accent-hover"
          >
            <Upload size={14} className="mr-1" />
            Import
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MyWorkouts() {
  const [importOpen, setImportOpen] = useState(false);
  const workouts = useStore((state) => state.library.workouts);
  const graph = useStore((state) => state.graph);
  const { deleteWorkout } = useStore((state) => state.libraryActions);
  const { loadWorkout } = useStore((state) => state.builderActions);
  const { startSession } = useStore((state) => state.sessionActions);
  const setActiveTab = useStore((state) => state.setActiveTab);

  const handleEdit = useCallback(
    (workout: SavedWorkout) => {
      loadWorkout(workout);
      setActiveTab('build');
    },
    [loadWorkout, setActiveTab]
  );

  const handleStart = useCallback(
    (workout: SavedWorkout) => {
      startSession(workout);
    },
    [startSession]
  );

  const handleExport = useCallback(
    async (workout: SavedWorkout) => {
      const text = formatExport(workout, graph);
      await navigator.clipboard.writeText(text);
    },
    [graph]
  );

  const handleDelete = useCallback(
    (id: WorkoutId) => {
      deleteWorkout(id);
    },
    [deleteWorkout]
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">My Workouts</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportOpen(true)}
        >
          <Download size={14} className="mr-1" />
          Import
        </Button>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-text-tertiary text-sm">
            No saved workouts yet. Build one and save it.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {workouts.map((workout) => (
              <motion.div
                key={workout.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100, height: 0 }}
                className="rounded-xl border border-border-subtle bg-bg-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {workout.name || 'Untitled'}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {workout.exercises.length} exercises
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStart(workout)}
                      aria-label="Start workout"
                      className="h-9 w-9"
                    >
                      <Play size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(workout)}
                      aria-label="Edit workout"
                      className="h-9 w-9"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExport(workout)}
                      aria-label="Copy to clipboard"
                      className="h-9 w-9"
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(workout.id)}
                      aria-label="Delete workout"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ImportSheet open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
