import { useState, useCallback, memo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MuscleTags } from './MuscleTags';
import { useExerciseSearch } from '@/hooks/useExerciseSearch';
import { useStore } from '@/store';
import { MUSCLE_GROUPS, MUSCLE_LABELS } from '@/types';
import type { Exercise, ExerciseId, MuscleGroup } from '@/types';

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (id: ExerciseId) => void;
}

const ExerciseRow = memo(function ExerciseRow({
  exercise,
  onAdd,
}: {
  exercise: Exercise;
  onAdd: (id: ExerciseId) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-bg-interactive active:bg-bg-elevated"
      onClick={() => onAdd(exercise.id as ExerciseId)}
      aria-label={`Add ${exercise.name}`}
      style={{ minHeight: '52px' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {exercise.name}
        </div>
        <MuscleTags muscles={exercise.primary_muscles} />
      </div>
      <div className="flex-shrink-0 text-text-tertiary">
        <Plus size={18} />
      </div>
    </button>
  );
});

export function ExercisePicker({ open, onOpenChange, onAdd: onAddProp }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup[]>([]);
  const addExercise = useStore((state) => state.builderActions.addExercise);

  const results = useExerciseSearch(query, { muscleFilter });

  const handleAdd = useCallback(
    (id: ExerciseId) => {
      if (onAddProp) {
        onAddProp(id);
      } else {
        addExercise(id);
      }
    },
    [onAddProp, addExercise]
  );

  const toggleMuscle = useCallback((muscle: MuscleGroup) => {
    setMuscleFilter((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] bg-bg-surface p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-text-primary">Add Exercise</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises..."
              className="pl-9 bg-bg-elevated border-border-subtle"
              aria-label="Search exercises"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-2">
          <ScrollArea className="w-full">
            <div className="flex gap-1.5 pb-1">
              {MUSCLE_GROUPS.map((muscle) => (
                <Badge
                  key={muscle}
                  variant={muscleFilter.includes(muscle) ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-xs select-none"
                  onClick={() => toggleMuscle(muscle)}
                >
                  {MUSCLE_LABELS[muscle] ?? muscle}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        <ScrollArea className="flex-1 px-2" style={{ height: 'calc(85dvh - 180px)' }}>
          <div className="space-y-0.5 pb-8">
            {results.length === 0 ? (
              <div className="py-12 text-center text-text-tertiary text-sm">
                No exercises found
              </div>
            ) : (
              results.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  onAdd={handleAdd}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
