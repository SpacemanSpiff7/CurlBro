import { Badge } from '@/components/ui/badge';
import { useWorkoutValidation } from '@/hooks/useWorkoutValidation';
import { useStore } from '@/store';
import { MUSCLE_LABELS } from '@/types';

export function WorkoutStatusBar() {
  const exercises = useStore((state) => state.builder.workout.exercises);
  const workoutSplit = useStore((state) => state.builder.workoutSplit);
  const validation = useWorkoutValidation();

  if (exercises.length === 0) return null;

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

      {/* Missing muscles — only show when a workout split is selected */}
      {workoutSplit && validation.missingMuscles.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium text-text-tertiary">
            Missing:
          </span>
          <div className="flex flex-wrap gap-0.5">
            {validation.missingMuscles.map((muscle) => (
              <Badge
                key={muscle}
                variant="outline"
                className="text-[10px] px-1 py-0 border-warning/40 text-warning/80"
              >
                {MUSCLE_LABELS[muscle as keyof typeof MUSCLE_LABELS] ?? muscle}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
