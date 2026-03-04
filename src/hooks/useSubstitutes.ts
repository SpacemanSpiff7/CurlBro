import { useMemo } from 'react';
import { useStore } from '@/store';
import type { Exercise, ExerciseId } from '@/types';

export function useSubstitutes(exerciseId: ExerciseId | null): Exercise[] {
  const graph = useStore((state) => state.graph);

  return useMemo(() => {
    if (!exerciseId) return [];
    const subIds = graph.substitutes.get(exerciseId);
    if (!subIds) return [];

    const exercise = graph.exercises.get(exerciseId);
    if (!exercise) return [];

    const subs = Array.from(subIds)
      .map((id) => graph.exercises.get(id))
      .filter((e): e is Exercise => e !== undefined);

    // Sort: same primary muscle first, then by difficulty match
    const primaryMuscle = exercise.primary_muscles[0];
    return subs.sort((a, b) => {
      const aMatch = a.primary_muscles.includes(primaryMuscle) ? 0 : 1;
      const bMatch = b.primary_muscles.includes(primaryMuscle) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;

      const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      const exDiff = diffOrder[exercise.difficulty];
      const aDiff = Math.abs(diffOrder[a.difficulty] - exDiff);
      const bDiff = Math.abs(diffOrder[b.difficulty] - exDiff);
      return aDiff - bDiff;
    });
  }, [exerciseId, graph]);
}
