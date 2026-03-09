import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MuscleTags } from '@/components/exercise/MuscleTags';
import { getGroupLabel } from '@/utils/groupUtils';
import { useStore } from '@/store';
import type { ExerciseGroup } from '@/utils/groupUtils';
import type { WorkoutExercise } from '@/types';

interface DragOverlayCardProps {
  group: ExerciseGroup<WorkoutExercise>;
}

export const DragOverlayCard = memo(function DragOverlayCard({ group }: DragOverlayCardProps) {
  const graph = useStore((state) => state.graph);
  const isGrouped = group.exercises.length > 1;
  const label = getGroupLabel(group.exercises.length);

  return (
    <div className="scale-[1.03] shadow-[0_10px_40px_rgba(0,0,0,0.3)] rounded-xl pointer-events-none">
      {isGrouped && label && (
        <div className="flex items-center gap-2 px-3 py-1 border-l-2 border-accent-primary rounded-t-xl bg-bg-surface">
          <Badge variant="secondary" className="text-[10px]">
            {label}
          </Badge>
        </div>
      )}
      {group.exercises.map((workoutExercise, i) => {
        const exercise = graph.exercises.get(workoutExercise.exerciseId);
        if (!exercise) return null;
        return (
          <div
            key={workoutExercise.instanceId ?? i}
            className={`rounded-xl border border-border-subtle bg-bg-surface overflow-hidden ${
              isGrouped ? 'border-l-2 border-l-accent-primary ml-2' : ''
            }`}
          >
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {exercise.name}
                </div>
                <MuscleTags muscles={exercise.primary_muscles} />
              </div>
              <div className="text-xs text-text-tertiary whitespace-nowrap">
                {workoutExercise.sets}
                {workoutExercise.trackReps && <> × {workoutExercise.reps}</>}
                {workoutExercise.trackDuration && workoutExercise.durationSeconds != null && (
                  <> × {workoutExercise.durationSeconds}s</>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
