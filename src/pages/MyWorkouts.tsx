import { useState, useCallback, Fragment } from 'react';
import { Play, Pencil, Trash2, Upload, Download, Share2, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { TopBar } from '@/components/shared/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { WorkoutDetailSheet } from '@/components/library/WorkoutDetailSheet';
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
  onTap,
}: {
  workout: SeededWorkout;
  onTap: (w: SeededWorkout) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTap(workout)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap(workout);
        }
      }}
      aria-label={`View ${workout.name} details`}
      className="rounded-xl border border-border-subtle bg-bg-surface p-3 cursor-pointer active:bg-bg-elevated transition-colors"
    >
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
      </div>
    </div>
  );
}

function TemplateSection({
  onTap,
  onStart,
  onEdit,
  onShare,
}: {
  onTap: (w: SeededWorkout) => void;
  onStart: (w: SeededWorkout) => void;
  onEdit: (w: SeededWorkout) => void;
  onShare: (w: SeededWorkout) => void;
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
        Pre-built templates. Tap to preview, swipe for actions.
      </p>
      {open && (
        <div className="space-y-2">
          {SEEDED_WORKOUTS.map((workout) => {
            const actions: SwipeAction[] = [
              {
                key: 'start',
                label: 'Start',
                icon: <Play size={16} />,
                color: 'bg-accent-primary',
                onAction: () => onStart(workout),
              },
              {
                key: 'edit',
                label: 'Edit',
                icon: <Pencil size={16} />,
                color: 'bg-blue-600',
                onAction: () => onEdit(workout),
              },
              {
                key: 'share',
                label: 'Share',
                icon: <Share2 size={16} />,
                color: 'bg-emerald-600',
                onAction: () => onShare(workout),
              },
            ];
            return (
              <SwipeToReveal key={workout.name} actions={actions}>
                <SeededWorkoutCard workout={workout} onTap={onTap} />
              </SwipeToReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MyWorkouts() {
  const [importOpen, setImportOpen] = useState(false);
  const [pendingWorkout, setPendingWorkout] = useState<SavedWorkout | null>(null);
  const [detailWorkout, setDetailWorkout] = useState<SavedWorkout | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const workouts = useStore((state) => state.library.workouts);
  const graph = useStore((state) => state.graph);
  const activeSession = useStore((state) => state.session.active);
  const { deleteWorkout, saveWorkout } = useStore((state) => state.libraryActions);
  const { loadWorkout } = useStore((state) => state.builderActions);
  const { startSession, abandonSession } = useStore((state) => state.sessionActions);
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
      if (activeSession) {
        setPendingWorkout(workout);
      } else {
        startSession(workout);
      }
    },
    [startSession, activeSession]
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
      if (detailWorkout?.id === id) {
        setDetailOpen(false);
        setDetailWorkout(null);
      }
    },
    [deleteWorkout, detailWorkout]
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
      if (activeSession) {
        setPendingWorkout(saved);
      } else {
        startSession(saved);
      }
    },
    [saveWorkout, startSession, activeSession]
  );

  // Seeded workout preview — tap opens detail sheet without saving to library
  const [isSeededPreview, setIsSeededPreview] = useState(false);

  const handleSeededPreview = useCallback((seeded: SeededWorkout) => {
    const saved = seededToSaved(seeded);
    setDetailWorkout(saved);
    setIsSeededPreview(true);
    setDetailOpen(true);
  }, []);

  const handleSeededShare = useCallback(
    async (seeded: SeededWorkout) => {
      const saved = seededToSaved(seeded);
      const text = formatExport(saved, graph, { includeTips: exportIncludeTips });
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard', { duration: 1500 });
      } catch {
        toast.error('Could not copy to clipboard');
      }
    },
    [graph, exportIncludeTips]
  );

  const handleViewDetails = useCallback((workout: SavedWorkout) => {
    setDetailWorkout(workout);
    setIsSeededPreview(false);
    setDetailOpen(true);
  }, []);

  const handleDetailChange = useCallback((open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setDetailWorkout(null);
      setIsSeededPreview(false);
    }
  }, []);

  // Detail sheet action wrappers — save to library first for seeded previews
  const handleDetailStart = useCallback(
    (w: SavedWorkout) => {
      if (isSeededPreview) {
        saveWorkout(w);
        toast.success(`Added "${w.name}" to your library`);
      }
      handleStart(w);
    },
    [isSeededPreview, saveWorkout, handleStart]
  );

  const handleDetailEdit = useCallback(
    (w: SavedWorkout) => {
      if (isSeededPreview) {
        saveWorkout(w);
        toast.success(`Created editable copy of "${w.name}"`);
      }
      handleEdit(w);
    },
    [isSeededPreview, saveWorkout, handleEdit]
  );

  const handleConfirmOverride = useCallback(() => {
    if (!pendingWorkout) return;
    abandonSession();
    startSession(pendingWorkout);
    setPendingWorkout(null);
  }, [pendingWorkout, abandonSession, startSession]);

  const handleCancelOverride = useCallback(() => {
    setPendingWorkout(null);
  }, []);

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
                  key: 'start',
                  label: 'Start',
                  icon: <Play size={16} />,
                  color: 'bg-accent-primary',
                  onAction: () => handleStart(workout),
                },
                {
                  key: 'edit',
                  label: 'Edit',
                  icon: <Pencil size={16} />,
                  color: 'bg-blue-600',
                  onAction: () => handleEdit(workout),
                },
                {
                  key: 'share',
                  label: 'Share',
                  icon: <Share2 size={16} />,
                  color: 'bg-emerald-600',
                  onAction: () => handleExport(workout),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <Trash2 size={16} />,
                  color: 'bg-destructive',
                  onAction: () => handleDelete(workout.id),
                  requiresConfirm: true,
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
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleViewDetails(workout)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleViewDetails(workout);
                          }
                        }}
                        aria-label={`View ${workout.name || 'Untitled'} details`}
                        className="rounded-xl border border-border-subtle bg-bg-surface p-3 cursor-pointer active:bg-bg-elevated transition-colors"
                        style={{ minHeight: '56px' }}
                      >
                        <div className="text-sm font-medium text-text-primary truncate">
                          {workout.name || 'Untitled'}
                        </div>
                        <div className="text-xs text-text-tertiary mt-0.5">
                          {workout.exercises.length} exercises · {workout.updatedAt.slice(0, 10)}
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
        onTap={handleSeededPreview}
        onStart={handleSeededStart}
        onEdit={handleSeededEdit}
        onShare={handleSeededShare}
      />

      </div>
      <ImportSheet open={importOpen} onOpenChange={setImportOpen} />

      <WorkoutDetailSheet
        workout={detailWorkout}
        open={detailOpen}
        onOpenChange={handleDetailChange}
        onStart={handleDetailStart}
        onEdit={handleDetailEdit}
        onExport={handleExport}
        onDelete={isSeededPreview ? undefined : (w) => handleDelete(w.id)}
      />

      <Dialog open={!!pendingWorkout} onOpenChange={(open) => { if (!open) setPendingWorkout(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Replace Active Workout?</DialogTitle>
            <DialogDescription>
              You have a workout in progress. Starting a new one will discard your current session and any recorded sets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={handleCancelOverride}>
              Keep Current
            </Button>
            <Button variant="destructive" className="min-h-[44px]" onClick={handleConfirmOverride}>
              Start New
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
