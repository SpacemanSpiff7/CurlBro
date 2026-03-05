import { useMemo } from 'react';
import { useStore } from '@/store';
import { WORKOUT_SPLIT_MUSCLES } from '@/types';
import type { ExerciseId, MuscleGroup, SuggestionGroups, SupersetSuggestion } from '@/types';

const DEFAULT_MAJOR_MUSCLES: MuscleGroup[] = [
  'chest', 'upper_back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes',
];

export function useSuggestions(): SuggestionGroups {
  const graph = useStore((state) => state.graph);
  const exercises = useStore((state) => state.builder.workout.exercises);
  const workoutSplit = useStore((state) => state.builder.workoutSplit);

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
    const supersetCandidateMap = new Map<ExerciseId, SupersetSuggestion>();
    for (const ex of exercises) {
      const ss = graph.supersets.get(ex.exerciseId);
      if (ss) {
        for (const ssId of ss) {
          if (!inWorkout.has(ssId) && !supersetCandidateMap.has(ssId)) {
            supersetCandidateMap.set(ssId, {
              exerciseId: ssId,
              parentExerciseId: ex.exerciseId,
            });
          }
        }
      }
    }
    const supersetCandidates = new Set<ExerciseId>(supersetCandidateMap.keys());

    // Still need to hit: muscles not covered, based on selected split or defaults
    const coveredMuscles = new Set<string>();
    for (const ex of exercises) {
      const exercise = graph.exercises.get(ex.exerciseId);
      if (exercise) {
        for (const muscle of exercise.primary_muscles) {
          coveredMuscles.add(muscle);
        }
      }
    }

    const targetMuscles = workoutSplit
      ? WORKOUT_SPLIT_MUSCLES[workoutSplit].primary
      : DEFAULT_MAJOR_MUSCLES;

    const missingMuscles = targetMuscles.filter(
      (m) => !coveredMuscles.has(m)
    );
    const gapExercises = new Set<ExerciseId>();
    for (const muscle of missingMuscles) {
      const muscleExercises = graph.byMuscle.get(muscle);
      if (muscleExercises) {
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

    // Build final supersetWith list from the map, excluding removed candidates
    const finalSupersetWith: SupersetSuggestion[] = [];
    for (const [id, suggestion] of supersetCandidateMap) {
      if (supersetCandidates.has(id)) {
        finalSupersetWith.push(suggestion);
        if (finalSupersetWith.length >= 4) break;
      }
    }

    return {
      pairsWellWith: Array.from(complementCandidates).slice(0, 6),
      stillNeedToHit: Array.from(gapExercises).slice(0, 6),
      supersetWith: finalSupersetWith,
    };
  }, [exercises, graph, workoutSplit]);
}
