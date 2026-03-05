import { useMemo } from 'react';
import { useStore } from '@/store';
import { MUSCLE_LABELS } from '@/types';
import type { MuscleGroup } from '@/types';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(): string {
  const now = new Date();
  return `${MONTH_ABBR[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

/**
 * Generates a workout name like "Chest Workout Mar 4, 2026"
 * based on the most common primary muscle group across all exercises,
 * falling back to the first exercise's primary muscle.
 */
export function useAutoWorkoutName(): string {
  const graph = useStore((state) => state.graph);
  const exercises = useStore((state) => state.builder.workout.exercises);

  return useMemo(() => {
    if (exercises.length === 0) return '';

    // Count primary muscle frequency across all exercises
    const muscleCounts = new Map<MuscleGroup, number>();

    for (const ex of exercises) {
      const meta = graph.exercises.get(ex.exerciseId);
      if (!meta) continue;
      for (const muscle of meta.primary_muscles) {
        const m = muscle as MuscleGroup;
        muscleCounts.set(m, (muscleCounts.get(m) || 0) + 1);
      }
    }

    if (muscleCounts.size === 0) return '';

    // Find the most common muscle group
    let topMuscle: MuscleGroup = 'chest';
    let topCount = 0;
    for (const [muscle, count] of muscleCounts) {
      if (count > topCount) {
        topCount = count;
        topMuscle = muscle;
      }
    }

    const label = MUSCLE_LABELS[topMuscle] ?? topMuscle;
    return `${label} Workout ${formatDate()}`;
  }, [exercises, graph]);
}
