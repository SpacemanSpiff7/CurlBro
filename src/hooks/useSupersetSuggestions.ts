import { useMemo } from 'react';
import { useStore } from '@/store';
import type { Exercise, ExerciseId } from '@/types';

export function useSupersetSuggestions(exerciseId: ExerciseId | null): Exercise[] {
  const graph = useStore((state) => state.graph);
  const workoutExercises = useStore((state) => state.builder.workout.exercises);

  return useMemo(() => {
    if (!exerciseId) return [];
    const ssIds = graph.supersets.get(exerciseId);
    if (!ssIds) return [];

    const exercise = graph.exercises.get(exerciseId);
    if (!exercise) return [];

    const inWorkout = new Set(workoutExercises.map((e) => e.exerciseId));

    const suggestions = Array.from(ssIds)
      .filter((id) => !inWorkout.has(id))
      .map((id) => graph.exercises.get(id))
      .filter((e): e is Exercise => e !== undefined);

    const primaryMuscle = exercise.primary_muscles[0];
    return suggestions.sort((a, b) => {
      const aMatch = a.primary_muscles.includes(primaryMuscle) ? 0 : 1;
      const bMatch = b.primary_muscles.includes(primaryMuscle) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      const exDiff = diffOrder[exercise.difficulty];
      return Math.abs(diffOrder[a.difficulty] - exDiff) - Math.abs(diffOrder[b.difficulty] - exDiff);
    });
  }, [exerciseId, graph, workoutExercises]);
}
