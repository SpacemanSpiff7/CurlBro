import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useStore } from '@/store';
import type { Exercise, ExerciseId, MuscleGroup } from '@/types';

interface UseExerciseSearchOptions {
  muscleFilter?: MuscleGroup[];
  limit?: number;
}

export function useExerciseSearch(
  query: string,
  options: UseExerciseSearchOptions = {}
): Exercise[] {
  const graph = useStore((state) => state.graph);
  const { muscleFilter = [], limit = 50 } = options;

  const exercises = useMemo(() => {
    return Array.from(graph.exercises.values());
  }, [graph.exercises]);

  const fuse = useMemo(() => {
    if (exercises.length === 0) return null;
    return new Fuse(exercises, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'primary_muscles', weight: 0.3 },
        { name: 'equipment', weight: 0.2 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [exercises]);

  return useMemo(() => {
    let filtered: Exercise[];

    if (query.trim() === '') {
      filtered = exercises;
    } else if (fuse) {
      filtered = fuse.search(query, { limit }).map((r) => r.item);
    } else {
      filtered = exercises;
    }

    if (muscleFilter.length > 0) {
      filtered = filtered.filter((exercise) =>
        exercise.primary_muscles.some((m) =>
          muscleFilter.includes(m as MuscleGroup)
        )
      );
    }

    return filtered.slice(0, limit);
  }, [query, exercises, fuse, muscleFilter, limit]);
}

export function useExerciseLookup(id: ExerciseId | null): Exercise | undefined {
  const graph = useStore((state) => state.graph);
  return useMemo(() => {
    if (!id) return undefined;
    return graph.exercises.get(id);
  }, [graph.exercises, id]);
}
