import { useMemo } from 'react';
import { useStore } from '@/store';
import { WORKOUT_SPLIT_MUSCLES } from '@/types';
import type { MuscleGroup, WorkoutValidation } from '@/types';

const DEFAULT_MAJOR_MUSCLES: MuscleGroup[] = [
  'chest', 'upper_back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes',
];

export function useWorkoutValidation(): WorkoutValidation {
  const graph = useStore((state) => state.graph);
  const exercises = useStore((state) => state.builder.workout.exercises);
  const workoutSplit = useStore((state) => state.builder.workoutSplit);

  return useMemo(() => {
    if (exercises.length === 0) {
      return {
        pushCount: 0,
        pullCount: 0,
        isometricCount: 0,
        isBalanced: true,
        coveredMuscles: [],
        missingMuscles: [],
        muscleCounts: {},
      };
    }

    let pushCount = 0;
    let pullCount = 0;
    let isometricCount = 0;
    const coveredMuscles = new Set<MuscleGroup>();
    const muscleCounts: Partial<Record<MuscleGroup, number>> = {};

    for (const ex of exercises) {
      const exercise = graph.exercises.get(ex.exerciseId);
      if (!exercise) continue;

      switch (exercise.force_type) {
        case 'push':
          pushCount++;
          break;
        case 'pull':
          pullCount++;
          break;
        case 'isometric':
          isometricCount++;
          break;
      }

      for (const muscle of exercise.primary_muscles) {
        const m = muscle as MuscleGroup;
        coveredMuscles.add(m);
        muscleCounts[m] = (muscleCounts[m] ?? 0) + 1;
      }
    }

    const total = pushCount + pullCount;
    const ratio = total > 0 ? pushCount / total : 1;
    const isBalanced = total < 2 || (ratio >= 0.3 && ratio <= 0.7);

    // Use split-specific primary muscles when a split is selected,
    // otherwise fall back to default major muscle groups
    const targetMuscles = workoutSplit
      ? WORKOUT_SPLIT_MUSCLES[workoutSplit].primary
      : DEFAULT_MAJOR_MUSCLES;

    const missingMuscles = targetMuscles.filter(
      (m) => !coveredMuscles.has(m)
    );

    return {
      pushCount,
      pullCount,
      isometricCount,
      isBalanced,
      coveredMuscles: Array.from(coveredMuscles),
      missingMuscles,
      muscleCounts,
    };
  }, [exercises, graph, workoutSplit]);
}
