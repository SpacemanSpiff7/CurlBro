import { Play, Pencil, Share2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MuscleTags } from '@/components/exercise/MuscleTags';
import { deriveGroups, getGroupLabel } from '@/utils/groupUtils';
import { CATEGORY_LABELS } from '@/types';
import type { SavedWorkout, WorkoutExercise, ExerciseGraph, Category } from '@/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}


export function WorkoutDetailSheet({
  workout,
  open,
  onOpenChange,
  onStart,
  onEdit,
  onExport,
  onDelete,
}: {
  workout: SavedWorkout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (w: SavedWorkout) => void;
  onEdit: (w: SavedWorkout) => void;
  onExport: (w: SavedWorkout) => void;
  onDelete?: (w: SavedWorkout) => void;
}) {
  const graph = useStore((state) => state.graph);

  if (!workout) return null;

  const groups = deriveGroups(workout.exercises);
  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets, 0);
  const supersetGroupCount = groups.filter((g) => g.exercises.length > 1).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80dvh] bg-bg-surface overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-text-primary">{workout.name || 'Untitled'}</SheetTitle>
          <div className="text-xs text-text-tertiary">Updated {formatDate(workout.updatedAt)}</div>
        </SheetHeader>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 px-4">
          <div className="rounded-lg bg-bg-elevated p-2.5">
            <div className="text-[10px] text-text-tertiary uppercase tracking-wide">Exercises</div>
            <div className="text-sm font-medium text-text-primary">{workout.exercises.length}</div>
          </div>
          <div className="rounded-lg bg-bg-elevated p-2.5">
            <div className="text-[10px] text-text-tertiary uppercase tracking-wide">Total Sets</div>
            <div className="text-sm font-medium text-text-primary">{totalSets}</div>
          </div>
          {supersetGroupCount > 0 && (
            <div className="rounded-lg bg-bg-elevated p-2.5">
              <div className="text-[10px] text-text-tertiary uppercase tracking-wide">Groups</div>
              <div className="text-sm font-medium text-text-primary">{supersetGroupCount}</div>
            </div>
          )}
        </div>

        {/* Exercise breakdown */}
        <div className="mt-4 px-4 space-y-3">
          {groups.map((group) => {
            const label = getGroupLabel(group.exercises.length);

            if (label) {
              // Grouped exercises (superset/tri-set/circuit)
              return (
                <div
                  key={group.groupId}
                  className="rounded-lg border-l-2 border-accent-primary pl-3 space-y-2"
                >
                  <Badge variant="outline" className="text-[10px]">
                    {label}
                  </Badge>
                  {group.exercises.map((ex, i) => (
                    <ExerciseCard key={group.indices[i]} exercise={ex} graph={graph} />
                  ))}
                </div>
              );
            }

            // Solo exercise
            const ex = group.exercises[0];
            return <ExerciseCard key={group.indices[0]} exercise={ex} graph={graph} />;
          })}
        </div>

        {/* Action footer */}
        <div className="grid grid-cols-2 gap-2 mt-4 px-4 pb-4">
          <Button
            onClick={() => { onStart(workout); onOpenChange(false); }}
            className={cn(
              'bg-accent-primary text-bg-root hover:bg-accent-hover min-h-[44px]',
              !onDelete && 'col-span-2',
            )}
            aria-label="Start workout"
          >
            <Play size={14} className="mr-1.5" />
            Start
          </Button>
          <Button
            variant="outline"
            onClick={() => { onEdit(workout); onOpenChange(false); }}
            className="min-h-[44px]"
            aria-label="Edit workout"
          >
            <Pencil size={14} className="mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport(workout)}
            className="min-h-[44px]"
            aria-label="Share workout"
          >
            <Share2 size={14} className="mr-1.5" />
            Share
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              onClick={() => { onDelete(workout); onOpenChange(false); }}
              className="min-h-[44px] text-destructive hover:text-destructive"
              aria-label="Delete workout"
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ExerciseCard({
  exercise,
  graph,
}: {
  exercise: WorkoutExercise;
  graph: ExerciseGraph;
}) {
  const info = graph.exercises.get(exercise.exerciseId);
  const name = info?.name ?? exercise.exerciseId;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-sm font-medium text-text-primary truncate">{name}</div>
        {info?.category && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
            {CATEGORY_LABELS[info.category as Category] ?? info.category}
          </Badge>
        )}
      </div>
      <div className="text-xs text-text-secondary">
        {exercise.sets} &times; {exercise.reps}
        {exercise.weight != null && (
          <span> @ {exercise.weight} lbs</span>
        )}
        {exercise.restSeconds > 0 && (
          <span className="text-text-tertiary"> · {exercise.restSeconds}s rest</span>
        )}
      </div>
      {info?.primary_muscles && info.primary_muscles.length > 0 && (
        <div className="mt-1.5">
          <MuscleTags muscles={info.primary_muscles} />
        </div>
      )}
      {exercise.notes && (
        <div className="mt-1.5 text-[11px] text-text-tertiary italic">
          {exercise.notes}
        </div>
      )}
    </div>
  );
}
