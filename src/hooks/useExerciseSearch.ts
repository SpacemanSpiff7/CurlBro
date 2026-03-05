import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useStore } from '@/store';
import { ACTIVITY_MUSCLE_IMPACT } from '@/types';
import type {
  Exercise,
  ExerciseId,
  MuscleGroup,
  ContextFilter,
  SorenessEntry,
  Category,
} from '@/types';

interface UseExerciseSearchOptions {
  muscleFilter?: MuscleGroup[];
  contextFilter?: ContextFilter | null;
  limit?: number;
}

/** Check if an exercise targets any of the given muscles as primary */
function targetsMuscles(exercise: Exercise, muscles: MuscleGroup[]): boolean {
  return exercise.primary_muscles.some((m) => muscles.includes(m as MuscleGroup));
}

/** Check if an exercise is a stretch or mobility category */
function isRecoveryCategory(category: string): boolean {
  return category === 'stretch_dynamic' || category === 'stretch_static' || category === 'mobility' || category === 'cardio';
}

/** Apply context filter to a list of exercises, returning filtered + scored results */
function applyContextFilter(
  exercises: Exercise[],
  filter: ContextFilter,
  soreness: SorenessEntry[],
): Exercise[] {
  switch (filter.type) {
    case 'sore_muscle': {
      const { muscle, level } = filter;
      if (level === 'none') return exercises;
      if (level === 'mild') {
        // Mild: show everything, no exclusion
        return exercises;
      }
      // Moderate/severe: exclude exercises that target the sore muscle as primary
      // UNLESS it's a stretch/mobility targeting it (recovery)
      return exercises.filter((ex) => {
        const hitsSoreMuscle = ex.primary_muscles.includes(muscle);
        if (!hitsSoreMuscle) return true;
        // Allow stretches/mobility for recovery
        return isRecoveryCategory(ex.category);
      });
    }

    case 'post_activity': {
      const fatiguedMuscles = ACTIVITY_MUSCLE_IMPACT[filter.activity];
      if (fatiguedMuscles.length === 0) return exercises;
      return exercises.filter((ex) => {
        const hitsImpacted = targetsMuscles(ex, fatiguedMuscles);
        if (!hitsImpacted) return true;
        // Allow stretches/mobility for fatigued muscles (recovery)
        return isRecoveryCategory(ex.category);
      });
    }

    case 'pre_activity': {
      const targetMuscles = ACTIVITY_MUSCLE_IMPACT[filter.activity];
      if (targetMuscles.length === 0) return exercises;
      // Show dynamic stretches and mobility targeting the activity's muscles
      return exercises.filter((ex) => {
        if (ex.category !== 'stretch_dynamic' && ex.category !== 'mobility' && ex.category !== 'cardio') return false;
        return targetsMuscles(ex, targetMuscles);
      });
    }

    case 'light_day': {
      const soreMuscles = soreness
        .filter((s) => s.level !== 'none')
        .map((s) => s.muscle);
      return exercises.filter((ex) => {
        // All stretches and mobility are fine
        if (isRecoveryCategory(ex.category)) return true;
        // Isolation exercises for non-sore muscles
        if (ex.category === 'isolation' && !targetsMuscles(ex, soreMuscles)) return true;
        return false;
      });
    }

    case 'category': {
      const { categories } = filter;
      return exercises.filter((ex) =>
        categories.includes(ex.category as Category)
      );
    }
  }
}

/** Score exercises for sort ordering based on body state */
function scoreExercise(
  exercise: Exercise,
  soreness: SorenessEntry[],
): number {
  if (soreness.length === 0) return 0;

  const soreMuscles = soreness.filter((s) => s.level !== 'none');
  if (soreMuscles.length === 0) return 0;

  const soreMap = new Map(soreMuscles.map((s) => [s.muscle, s.level]));

  // Check primary muscles
  for (const m of exercise.primary_muscles) {
    const level = soreMap.get(m as MuscleGroup);
    if (level === 'severe') return 3; // worst — primary targets severely sore
    if (level === 'moderate') return 2;
    if (level === 'mild') return 1;
  }

  // Recovery exercises targeting sore muscles get boosted
  if (isRecoveryCategory(exercise.category)) {
    const targetsAnySore = exercise.primary_muscles.some((m) =>
      soreMap.has(m as MuscleGroup)
    );
    if (targetsAnySore) return -1; // boost recovery exercises
  }

  return 0; // neutral — doesn't target any sore muscles (good pick)
}

export function useExerciseSearch(
  query: string,
  options: UseExerciseSearchOptions = {}
): Exercise[] {
  const graph = useStore((state) => state.graph);
  const soreness = useStore((state) => state.library.soreness);
  const { muscleFilter = [], contextFilter = null, limit = 50 } = options;

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

    if (contextFilter) {
      filtered = applyContextFilter(filtered, contextFilter, soreness);
    }

    // Sort by body-state relevance when soreness data exists and context filter is active
    if (contextFilter && soreness.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = scoreExercise(a, soreness);
        const scoreB = scoreExercise(b, soreness);
        return scoreA - scoreB;
      });
    }

    return filtered.slice(0, limit);
  }, [query, exercises, fuse, muscleFilter, contextFilter, soreness, limit]);
}

export function useExerciseLookup(id: ExerciseId | null): Exercise | undefined {
  const graph = useStore((state) => state.graph);
  return useMemo(() => {
    if (!id) return undefined;
    return graph.exercises.get(id);
  }, [graph.exercises, id]);
}
