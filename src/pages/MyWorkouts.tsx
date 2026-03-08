import { useState, useCallback, Fragment } from 'react';
import { Play, Pencil, Trash2, Upload, Download, Copy, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { TopBar } from '@/components/shared/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
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
import { SEEDED_WORKOUTS, type SeededWorkout } from '@/data/seededWorkouts';
import { SPLIT_LABELS } from '@/types';
import type { SavedWorkout, WorkoutId, ExerciseId } from '@/types';

const DIFFICULTY_COLORS: Record<SeededWorkout['difficulty'], string> = {
  beginner: 'text-green-600 dark:text-green-400',
  intermediate: 'text-yellow-600 dark:text-yellow-400',
  advanced: 'text-red-600 dark:text-red-400',
};

function seededToSaved(workout: SeededWorkout): SavedWorkout {
  const now = new Date().toISOString();
  return {
    id: uuidv4() as WorkoutId,
    name: workout.name,
    exercises: workout.exercises.map((e) => ({
      exerciseId: e.exerciseId as ExerciseId,
      sets: e.sets,
      reps: e.reps,
      weight: null,
      restSeconds: e.restSeconds,
      notes: '',
    })),
    createdAt: now,
    updatedAt: now,
  };
}

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
  const settings = useStore((state) => state.settings);
  const saveWorkout = useStore((state) => state.libraryActions.saveWorkout);

  const handlePreview = useCallback(() => {
    const parsed = parseImport(text, graph, settings);
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
  }, [text, graph, settings, saveWorkout, onOpenChange]);

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
            className="w-full h-40 rounded-lg bg-bg-elevated border border-border-subtle p-3 text-base md:text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-1 focus:ring-accent-primary"
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

function SeededWorkoutCard({
  workout,
  onStart,
  onEdit,
}: {
  workout: SeededWorkout;
  onStart: (w: SeededWorkout) => void;
  onEdit: (w: SeededWorkout) => void;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
      <div className="flex items-center gap-2">
        <Dumbbell size={16} className="flex-shrink-0 text-accent-primary" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {workout.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-text-tertiary">
              {SPLIT_LABELS[workout.split] ?? workout.split}
            </span>
            <span className="text-[10px] text-text-tertiary">·</span>
            <span className={`text-[10px] ${DIFFICULTY_COLORS[workout.difficulty]}`}>
              {workout.difficulty}
            </span>
            <span className="text-[10px] text-text-tertiary">·</span>
            <span className="text-[10px] text-text-tertiary">
              {workout.exercises.length} exercises
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStart(workout)}
            aria-label={`Start ${workout.name}`}
            className="h-9 w-9"
          >
            <Play size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(workout)}
            aria-label={`Customize ${workout.name}`}
            className="h-9 w-9"
          >
            <Pencil size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TemplateSection({
  onStart,
  onEdit,
}: {
  onStart: (w: SeededWorkout) => void;
  onEdit: (w: SeededWorkout) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1"
      >
        <h2 className="text-sm font-semibold text-text-secondary">
          Quick Start
        </h2>
        {open ? (
          <ChevronUp size={16} className="text-text-tertiary" />
        ) : (
          <ChevronDown size={16} className="text-text-tertiary" />
        )}
      </button>
      <p className="text-[11px] text-text-tertiary mb-2">
        Pre-built templates. Tap edit to customize a copy.
      </p>
      {open && (
        <div className="space-y-2">
          {SEEDED_WORKOUTS.map((workout) => (
            <SeededWorkoutCard
              key={workout.name}
              workout={workout}
              onStart={onStart}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MyWorkouts() {
  const [importOpen, setImportOpen] = useState(false);
  const workouts = useStore((state) => state.library.workouts);
  const graph = useStore((state) => state.graph);
  const { deleteWorkout, saveWorkout } = useStore((state) => state.libraryActions);
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

  const exportIncludeTips = useStore((state) => state.settings.exportIncludeTips);

  const handleExport = useCallback(
    async (workout: SavedWorkout) => {
      const text = formatExport(workout, graph, { includeTips: exportIncludeTips });

      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard', { duration: 1500 });
      } catch {
        toast.error('Could not copy to clipboard');
      }
    },
    [graph, exportIncludeTips]
  );

  const handleDelete = useCallback(
    (id: WorkoutId) => {
      deleteWorkout(id);
    },
    [deleteWorkout]
  );

  // Seeded workout handlers — duplicate into user library
  const handleSeededEdit = useCallback(
    (seeded: SeededWorkout) => {
      const saved = seededToSaved(seeded);
      saveWorkout(saved);
      loadWorkout(saved);
      setActiveTab('build');
      toast.success(`Created editable copy of "${seeded.name}"`);
    },
    [saveWorkout, loadWorkout, setActiveTab]
  );

  const handleSeededStart = useCallback(
    (seeded: SeededWorkout) => {
      const saved = seededToSaved(seeded);
      saveWorkout(saved);
      startSession(saved);
    },
    [saveWorkout, startSession]
  );

  return (
    <div className="flex flex-col gap-4 pb-20">
      <TopBar>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Library</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
          >
            <Download size={14} className="mr-1" />
            Import
          </Button>
        </div>
      </TopBar>

      <div className="flex flex-col gap-4 px-4">
      {/* Top ad */}
      <AdSlot slotKey="library_feed" />

      {/* User-created workouts */}
      {workouts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-secondary">
            My Workouts
          </h2>
          <AnimatePresence mode="popLayout">
            {workouts.map((workout, index) => {
              const cardActions: SwipeAction[] = [
                {
                  key: 'copy',
                  label: 'Copy',
                  icon: <Copy size={16} />,
                  color: 'bg-accent-primary',
                  onAction: () => handleExport(workout),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <Trash2 size={16} />,
                  color: 'bg-destructive',
                  onAction: () => handleDelete(workout.id),
                },
              ];

              return (
                <Fragment key={workout.id}>
                  <SwipeToReveal actions={cardActions}>
                    <motion.div
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
                            {workout.exercises.length} exercises | {workout.updatedAt.slice(0, 10)}
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
                  </SwipeToReveal>
                  {workouts.length >= 5 && (index + 1) % 4 === 0 && index < workouts.length - 1 && (
                    <AdSlot slotKey="library_feed" />
                  )}
                </Fragment>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Seeded workout templates */}
      <TemplateSection
        onStart={handleSeededStart}
        onEdit={handleSeededEdit}
      />

      </div>
      <ImportSheet open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
