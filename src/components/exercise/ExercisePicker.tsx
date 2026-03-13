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
import { FilterSection } from './FilterSection';
import { useExerciseSearch, isRecoveryCategory } from '@/hooks/useExerciseSearch';
import { useStore } from '@/store';
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  EQUIPMENT_GROUP_NAMES,
  EQUIPMENT_GROUP_LABELS,
  EXERCISE_TYPE_LABELS,
  ACTIVITY_MUSCLE_IMPACT,
} from '@/types';
import type {
  Exercise,
  ExerciseId,
  MuscleGroup,
  ExerciseTypeFilter,
  EquipmentGroup,
  SorenessLevel,
} from '@/types';

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (id: ExerciseId) => void;
  title?: string;
}

const BADGE_STYLES: Record<string, string> = {
  recovery: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
};

const SECTION_COLORS = {
  exerciseType: 'text-emerald-600 dark:text-emerald-400',
  muscles: 'text-blue-600 dark:text-blue-400',
  equipment: 'text-violet-600 dark:text-violet-400',
  bodyState: 'text-amber-600 dark:text-amber-400',
};

const EXERCISE_TYPE_KEYS: ExerciseTypeFilter[] = ['strength', 'warmup', 'cooldown'];

const MUSCLES_SORTED = [...MUSCLE_GROUPS].sort((a, b) =>
  (MUSCLE_LABELS[a] ?? a).localeCompare(MUSCLE_LABELS[b] ?? b)
);

const ExerciseRow = memo(function ExerciseRow({
  exercise,
  onAdd,
  badge,
}: {
  exercise: Exercise;
  onAdd: (id: ExerciseId) => void;
  badge?: { type: 'recovery'; label: string } | null;
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

export function ExercisePicker({ open, onOpenChange, onAdd: onAddProp, title = 'Add Exercise' }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup[]>([]);
  const [exerciseType, setExerciseType] = useState<ExerciseTypeFilter | null>(null);
  const [equipmentGroups, setEquipmentGroups] = useState<EquipmentGroup[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const addExercise = useStore((state) => state.builderActions.addExercise);
  const soreness = useStore((state) => state.library.soreness);
  const activities = useStore((state) => state.library.activities);

  const results = useExerciseSearch(query, { muscleFilter, exerciseType, equipmentGroups });

  const clearFilters = useCallback(() => {
    setQuery('');
    setMuscleFilter([]);
    setExerciseType(null);
    setEquipmentGroups([]);
    setExpandedSections(new Set());
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) clearFilters();
      onOpenChange(nextOpen);
    },
    [clearFilters, onOpenChange]
  );

  const handleAdd = useCallback(
    (id: ExerciseId) => {
      if (onAddProp) {
        onAddProp(id);
      } else {
        addExercise(id);
      }
      handleOpenChange(false);
    },
    [onAddProp, addExercise, handleOpenChange]
  );

  const toggleMuscle = useCallback((muscle: MuscleGroup) => {
    setMuscleFilter((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  }, []);

  const toggleExerciseType = useCallback((type: ExerciseTypeFilter) => {
    setExerciseType((prev) => (prev === type ? null : type));
  }, []);

  const toggleEquipmentGroup = useCallback((group: EquipmentGroup) => {
    setEquipmentGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    );
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Compute sore muscle map for badge display
  const soreMap = useMemo(() => {
    const map = new Map<MuscleGroup, SorenessLevel>();
    for (const entry of soreness) {
      if (entry.level !== 'none') {
        map.set(entry.muscle, entry.level);
      }
    }
    return map;
  }, [soreness]);

  // Compute fatigued muscles from activities
  const fatiguedMuscles = useMemo(() => {
    const muscles = new Set<MuscleGroup>();
    for (const activity of activities) {
      if (activity.timing === 'yesterday' || activity.timing === 'today') {
        for (const m of ACTIVITY_MUSCLE_IMPACT[activity.type]) {
          muscles.add(m as MuscleGroup);
        }
      }
    }
    return muscles;
  }, [activities]);

  const getBadge = useCallback(
    (exercise: Exercise): { type: 'recovery'; label: string } | null => {
      if (soreMap.size === 0 && fatiguedMuscles.size === 0) return null;

      // Recovery exercises targeting sore/fatigued muscles
      if (isRecoveryCategory(exercise.category)) {
        const targetsAnySore = exercise.primary_muscles.some((m) =>
          soreMap.has(m as MuscleGroup)
        );
        const targetsFatigued = exercise.primary_muscles.some((m) =>
          fatiguedMuscles.has(m as MuscleGroup)
        );
        if (targetsAnySore || targetsFatigued) {
          return { type: 'recovery', label: 'Recovery' };
        }
      }

      return null;
    },
    [soreMap, fatiguedMuscles]
  );

  // Section badge counts
  const exerciseTypeBadge = exerciseType ? 1 : 0;
  const muscleBadge = muscleFilter.length;
  const equipmentBadge = equipmentGroups.length;
  const bodyStateBadge = useMemo(() => {
    const soreCount = soreness.filter((s) => s.level !== 'none').length;
    const activeTimings = new Set(activities.map((a) => a.timing)).size;
    return soreCount + activeTimings;
  }, [soreness, activities]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85dvh] flex-col bg-bg-surface p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-shrink-0 px-4 pt-4 pb-2">
          <SheetTitle className="text-text-primary">{title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {/* Search bar */}
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

          {/* Exercise Type section */}
          <FilterSection
            title="Exercise Type"
            colorClass={SECTION_COLORS.exerciseType}
            expanded={expandedSections.has('exerciseType')}
            onToggle={() => toggleSection('exerciseType')}
            badge={exerciseTypeBadge}
          >
            <div className="flex flex-wrap gap-1.5">
              {EXERCISE_TYPE_KEYS.map((type) => (
                <Badge
                  key={type}
                  variant={exerciseType === type ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-xs select-none"
                  onClick={() => toggleExerciseType(type)}
                >
                  {EXERCISE_TYPE_LABELS[type]}
                </Badge>
              ))}
            </div>
          </FilterSection>

          {/* Muscles section */}
          <FilterSection
            title="Muscles"
            colorClass={SECTION_COLORS.muscles}
            expanded={expandedSections.has('muscles')}
            onToggle={() => toggleSection('muscles')}
            badge={muscleBadge}
          >
            <div className="flex flex-wrap gap-1.5">
              {MUSCLES_SORTED.map((muscle) => (
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
          </FilterSection>

          {/* Equipment section */}
          <FilterSection
            title="Equipment"
            colorClass={SECTION_COLORS.equipment}
            expanded={expandedSections.has('equipment')}
            onToggle={() => toggleSection('equipment')}
            badge={equipmentBadge}
          >
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_GROUP_NAMES.map((group) => (
                <Badge
                  key={group}
                  variant={equipmentGroups.includes(group) ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-xs select-none"
                  onClick={() => toggleEquipmentGroup(group)}
                >
                  {EQUIPMENT_GROUP_LABELS[group]}
                </Badge>
              ))}
            </div>
          </FilterSection>

          {/* Body State section */}
          <FilterSection
            title="Body State"
            colorClass={SECTION_COLORS.bodyState}
            expanded={expandedSections.has('bodyState')}
            onToggle={() => toggleSection('bodyState')}
            badge={bodyStateBadge}
          >
            <BodyStateInput />
          </FilterSection>

          <div className="mx-4 border-t border-border-subtle" />

          {/* Results */}
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
