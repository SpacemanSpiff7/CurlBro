import { useMemo } from 'react';
import { useStore } from '@/store';
import type { ExerciseId, MuscleGroup, SuggestionGroups } from '@/types';

const MAJOR_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'upper_back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes',
];

export function useSuggestions(): SuggestionGroups {
  const graph = useStore((state) => state.graph);
  const exercises = useStore((state) => state.builder.workout.exercises);

  return useMemo(() => {
    if (exercises.length === 0) {
      return { pairsWellWith: [], stillNeedToHit: [], supersetWith: [] };
    }

    const inWorkout = new Set(exercises.map((e) => e.exerciseId));

    // Pairs well with: complements of current exercises, not already in workout
    const complementCandidates = new Set<ExerciseId>();
    for (const ex of exercises) {
      const comps = graph.complements.get(ex.exerciseId);
      if (comps) {
        for (const compId of comps) {
          if (!inWorkout.has(compId)) {
            complementCandidates.add(compId);
          }
        }
      }
    }

    // Superset with: superset candidates of current exercises, not already in workout
    const supersetCandidates = new Set<ExerciseId>();
    for (const ex of exercises) {
      const ss = graph.supersets.get(ex.exerciseId);
      if (ss) {
        for (const ssId of ss) {
          if (!inWorkout.has(ssId)) {
            supersetCandidates.add(ssId);
          }
        }
      }
    }

    // Still need to hit: major muscles not covered by current exercises
    const coveredMuscles = new Set<string>();
    for (const ex of exercises) {
      const exercise = graph.exercises.get(ex.exerciseId);
      if (exercise) {
        for (const muscle of exercise.primary_muscles) {
          coveredMuscles.add(muscle);
        }
      }
    }

    const missingMuscles = MAJOR_MUSCLE_GROUPS.filter(
      (m) => !coveredMuscles.has(m)
    );
    const gapExercises = new Set<ExerciseId>();
    for (const muscle of missingMuscles) {
      const muscleExercises = graph.byMuscle.get(muscle);
      if (muscleExercises) {
        // Pick up to 3 exercises per missing muscle, preferring compounds
        const candidates = Array.from(muscleExercises)
          .filter((id) => !inWorkout.has(id))
          .slice(0, 3);
        for (const id of candidates) {
          gapExercises.add(id);
        }
      }
    }

    // Remove overlap: don't show same exercise in multiple groups
    for (const id of complementCandidates) {
      gapExercises.delete(id);
      supersetCandidates.delete(id);
    }
    for (const id of gapExercises) {
      supersetCandidates.delete(id);
    }

    return {
      pairsWellWith: Array.from(complementCandidates).slice(0, 6),
      stillNeedToHit: Array.from(gapExercises).slice(0, 6),
      supersetWith: Array.from(supersetCandidates).slice(0, 4),
    };
  }, [exercises, graph]);
}
