import { useMemo } from 'react';
import { useStore } from '@/store';
import { deriveGroups } from '@/utils/groupUtils';
import type { WorkoutExercise } from '@/types';
import type { ExerciseGroup } from '@/utils/groupUtils';

export function useBuilderGroups(): ExerciseGroup<WorkoutExercise>[] {
  const exercises = useStore((state) => state.builder.workout.exercises);
  return useMemo(() => deriveGroups(exercises), [exercises]);
}
