import { useState, useCallback, memo, useMemo } from 'react';
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
import { BodyStateInput } from './BodyStateInput';
import { ContextFilters } from './ContextFilters';
import { useExerciseSearch } from '@/hooks/useExerciseSearch';
import { useStore } from '@/store';
import { MUSCLE_GROUPS, MUSCLE_LABELS } from '@/types';
import type { Exercise, ExerciseId, MuscleGroup, ContextFilter, SorenessLevel } from '@/types';

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (id: ExerciseId) => void;
  title?: string;
}

const BADGE_STYLES: Record<string, string> = {
  sore: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  good: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  recovery: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
};

const ExerciseRow = memo(function ExerciseRow({
  exercise,
  onAdd,
  badge,
}: {
  exercise: Exercise;
  onAdd: (id: ExerciseId) => void;
  badge?: { type: 'sore' | 'good' | 'recovery'; label: string } | null;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-bg-interactive active:bg-bg-elevated"
      onClick={() => onAdd(exercise.id as ExerciseId)}
      aria-label={`Add ${exercise.name}`}
      style={{ minHeight: '52px' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {exercise.name}
          </span>
          {badge && (
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${BADGE_STYLES[badge.type]}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <MuscleTags muscles={exercise.primary_muscles} />
      </div>
      <div className="flex-shrink-0 text-text-tertiary">
        <Plus size={18} />
      </div>
    </button>
  );
});

function isRecoveryCategory(category: string): boolean {
  return category === 'stretch_dynamic' || category === 'stretch_static' || category === 'mobility' || category === 'cardio';
}

export function ExercisePicker({ open, onOpenChange, onAdd: onAddProp, title = 'Add Exercise' }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup[]>([]);
  const [contextFilter, setContextFilter] = useState<ContextFilter | null>(null);
  const [bodyStateExpanded, setBodyStateExpanded] = useState(false);
  const addExercise = useStore((state) => state.builderActions.addExercise);
  const soreness = useStore((state) => state.library.soreness);

  const results = useExerciseSearch(query, { muscleFilter, contextFilter });

  const handleAdd = useCallback(
    (id: ExerciseId) => {
      if (onAddProp) {
        onAddProp(id);
      } else {
        addExercise(id);
      }
      onOpenChange(false);
    },
    [onAddProp, addExercise, onOpenChange]
  );

  const toggleMuscle = useCallback((muscle: MuscleGroup) => {
    setMuscleFilter((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  }, []);

  const toggleBodyState = useCallback(() => {
    setBodyStateExpanded((prev) => !prev);
  }, []);

  // Build a map of sore muscles for badge computation
  const soreMap = useMemo(() => {
    const map = new Map<MuscleGroup, SorenessLevel>();
    for (const entry of soreness) {
      if (entry.level !== 'none') {
        map.set(entry.muscle, entry.level);
      }
    }
    return map;
  }, [soreness]);

  const getBadge = useCallback(
    (exercise: Exercise): { type: 'sore' | 'good' | 'recovery'; label: string } | null => {
      if (soreMap.size === 0) return null;

      // Recovery exercises targeting sore muscles
      if (isRecoveryCategory(exercise.category)) {
        const targetsAnySore = exercise.primary_muscles.some((m) =>
          soreMap.has(m as MuscleGroup)
        );
        if (targetsAnySore) return { type: 'recovery', label: 'Recovery' };
      }

      // Check if exercise targets sore muscles
      const hitsSore = exercise.primary_muscles.some((m) =>
        soreMap.has(m as MuscleGroup)
      );
      if (hitsSore) return { type: 'sore', label: 'Sore area' };

      // If there's any soreness and exercise avoids all sore muscles
      return { type: 'good', label: 'Good pick' };
    },
    [soreMap]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85dvh] flex-col bg-bg-surface p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-shrink-0 px-4 pt-4 pb-2">
          <SheetTitle className="text-text-primary">{title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
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
                autoFocus={false}
                autoComplete="off"
                autoCapitalize="none"
                name="exercise-search"
                type="search"
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
            <div className="flex flex-wrap gap-1.5">
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
          </div>

          <BodyStateInput expanded={bodyStateExpanded} onToggle={toggleBodyState} />

          <ContextFilters activeFilter={contextFilter} onFilterChange={setContextFilter} />

          <div className="space-y-0.5 px-2 pb-8">
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
                  badge={getBadge(exercise)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
