import { useMemo } from 'react';
import { useStore } from '@/store';
import type { MuscleGroup, WorkoutValidation } from '@/types';

const MAJOR_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'upper_back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes',
];

export function useWorkoutValidation(): WorkoutValidation {
  const graph = useStore((state) => state.graph);
  const exercises = useStore((state) => state.builder.workout.exercises);

  return useMemo(() => {
    if (exercises.length === 0) {
      return {
        pushCount: 0,
        pullCount: 0,
        isometricCount: 0,
        isBalanced: true,
        coveredMuscles: [],
        missingMuscles: [],
      };
    }

    let pushCount = 0;
    let pullCount = 0;
    let isometricCount = 0;
    const coveredMuscles = new Set<MuscleGroup>();

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
        coveredMuscles.add(muscle as MuscleGroup);
      }
    }

    const total = pushCount + pullCount;
    const ratio = total > 0 ? pushCount / total : 1;
    const isBalanced = total < 2 || (ratio >= 0.3 && ratio <= 0.7);

    const missingMuscles = MAJOR_MUSCLE_GROUPS.filter(
      (m) => !coveredMuscles.has(m)
    );

    return {
      pushCount,
      pullCount,
      isometricCount,
      isBalanced,
      coveredMuscles: Array.from(coveredMuscles),
      missingMuscles,
    };
  }, [exercises, graph]);
}
