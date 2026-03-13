import { Badge } from '@/components/ui/badge';
import { useWorkoutValidation } from '@/hooks/useWorkoutValidation';
import { useStore } from '@/store';
import { MUSCLE_LABELS } from '@/types';
import type { MuscleGroup } from '@/types';

export function WorkoutStatusBar() {
  const exercises = useStore((state) => state.builder.workout.exercises);
  const validation = useWorkoutValidation();

  if (exercises.length === 0) return null;

  const sortedMuscleCounts = Object.entries(validation.muscleCounts)
    .sort(([, a], [, b]) => b - a) as [MuscleGroup, number][];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2">
      {/* Push/Pull ratio */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-text-tertiary uppercase">
          Push/Pull
        </span>
        <Badge
          variant={validation.isBalanced ? 'secondary' : 'outline'}
          className={`text-[10px] ${
            !validation.isBalanced ? 'border-warning text-warning' : ''
          }`}
        >
          {validation.pushCount}/{validation.pullCount}
        </Badge>
      </div>

      {/* Muscle group counts */}
      {sortedMuscleCounts.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {sortedMuscleCounts.map(([muscle, count]) => (
            <Badge
              key={muscle}
              variant="secondary"
              className="text-[10px] px-1 py-0"
            >
              {MUSCLE_LABELS[muscle as keyof typeof MUSCLE_LABELS] ?? muscle} ×{count}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
