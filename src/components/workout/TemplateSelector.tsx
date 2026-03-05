import { memo, useCallback, useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { useStore } from '@/store';
import { SEEDED_WORKOUTS, type SeededWorkout } from '@/data/seededWorkouts';
import { SPLIT_LABELS } from '@/types';
import type { ExerciseId } from '@/types';

const DIFFICULTY_LABELS: Record<SeededWorkout['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const DIFFICULTY_COLORS: Record<SeededWorkout['difficulty'], string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
};

interface CategoryGroup {
  label: string;
  description: string;
  workouts: SeededWorkout[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    label: 'Easy Machine',
    description: 'Machine-only, beginner-friendly',
    workouts: SEEDED_WORKOUTS.filter((w) => w.difficulty === 'beginner'),
  },
  {
    label: 'Intermediate',
    description: 'Free weight + cable mix',
    workouts: SEEDED_WORKOUTS.filter(
      (w) =>
        w.difficulty === 'intermediate' &&
        !['Arm Blaster', 'Shoulder Builder', 'Posterior Chain Focus', 'Core & Conditioning'].includes(w.name)
    ),
  },
  {
    label: 'Advanced',
    description: 'Heavy compound emphasis',
    workouts: SEEDED_WORKOUTS.filter((w) => w.difficulty === 'advanced'),
  },
  {
    label: 'Specialty',
    description: 'Targeted focus sessions',
    workouts: SEEDED_WORKOUTS.filter((w) =>
      ['Arm Blaster', 'Shoulder Builder', 'Posterior Chain Focus', 'Core & Conditioning'].includes(w.name)
    ),
  },
];

const TemplateCard = memo(function TemplateCard({
  workout,
  onSelect,
}: {
  workout: SeededWorkout;
  onSelect: (w: SeededWorkout) => void;
}) {
  return (
    <button
      onClick={() => onSelect(workout)}
      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent-primary hover:bg-accent-glow w-full"
      style={{ minHeight: '48px' }}
      aria-label={`Start from ${workout.name} template`}
    >
      <Dumbbell size={16} className="flex-shrink-0 text-accent-primary" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {workout.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-text-tertiary">
            {SPLIT_LABELS[workout.split] ?? workout.split}
          </span>
          <span className="text-[10px] text-text-tertiary">·</span>
          <span className={`text-[10px] ${DIFFICULTY_COLORS[workout.difficulty]}`}>
            {DIFFICULTY_LABELS[workout.difficulty]}
          </span>
          <span className="text-[10px] text-text-tertiary">·</span>
          <span className="text-[10px] text-text-tertiary">
            {workout.exercises.length} exercises
          </span>
        </div>
      </div>
    </button>
  );
});

function CategorySection({
  group,
  onSelect,
}: {
  group: CategoryGroup;
  onSelect: (w: SeededWorkout) => void;
}) {
  const [open, setOpen] = useState(group.label === 'Easy Machine');

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-1 py-1.5"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-accent-primary" />
          <span className="text-xs font-medium text-text-secondary">
            {group.label}
          </span>
          <span className="text-[10px] text-text-tertiary">
            {group.description}
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-text-tertiary" />
        ) : (
          <ChevronDown size={14} className="text-text-tertiary" />
        )}
      </button>
      {open && (
        <div className="space-y-1.5 mt-1">
          {group.workouts.map((workout) => (
            <TemplateCard
              key={workout.name}
              workout={workout}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TemplateSelector() {
  const loadTemplate = useStore((state) => state.builderActions.loadTemplate);

  const handleSelect = useCallback(
    (workout: SeededWorkout) => {
      loadTemplate(
        workout.name,
        workout.split,
        workout.exercises.map((e) => ({
          exerciseId: e.exerciseId as ExerciseId,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
        }))
      );
    },
    [loadTemplate]
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1">
        Start from template
      </h3>
      <div className="space-y-3">
        {CATEGORIES.map((group) => (
          <CategorySection
            key={group.label}
            group={group}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
