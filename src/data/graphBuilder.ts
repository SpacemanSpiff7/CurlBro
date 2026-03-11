import type { Exercise, ExerciseGraph, ExerciseId, ForceType } from '@/types';

export interface RawExercise {
  id: string;
  name: string;
  category: string;
  movement_pattern: string;
  force_type: string;
  equipment: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  workout_position: string;
  difficulty: string;
  bilateral: boolean;
  rep_range_hypertrophy: string;
  rep_range_strength: string;
  video_url: string;
  beginner_tips: string;
  substitutes: string[];
  complements: string[];
  superset_candidates: string[];
  notes: string;
}

function getOrCreateSet<K, V>(map: Map<K, Set<V>>, key: K): Set<V> {
  let set = map.get(key);
  if (!set) {
    set = new Set<V>();
    map.set(key, set);
  }
  return set;
}

export function buildExerciseGraph(rawExercises: RawExercise[]): ExerciseGraph {
  const exercises = new Map<ExerciseId, Exercise>();
  const substitutes = new Map<ExerciseId, Set<ExerciseId>>();
  const complements = new Map<ExerciseId, Set<ExerciseId>>();
  const supersets = new Map<ExerciseId, Set<ExerciseId>>();
  const byMuscle = new Map<string, Set<ExerciseId>>();
  const byEquipment = new Map<string, Set<ExerciseId>>();
  const byPattern = new Map<string, Set<ExerciseId>>();
  const byForceType = new Map<ForceType, Set<ExerciseId>>();

  // First pass: register all exercises
  for (const raw of rawExercises) {
    const id = raw.id as ExerciseId;
    exercises.set(id, raw as unknown as Exercise);

    // Index by muscle group
    for (const muscle of raw.primary_muscles) {
      getOrCreateSet(byMuscle, muscle).add(id);
    }
    for (const muscle of raw.secondary_muscles) {
      getOrCreateSet(byMuscle, muscle).add(id);
    }

    // Index by equipment
    for (const equip of raw.equipment) {
      getOrCreateSet(byEquipment, equip).add(id);
    }

    // Index by movement pattern
    getOrCreateSet(byPattern, raw.movement_pattern).add(id);

    // Index by force type
    getOrCreateSet(byForceType, raw.force_type as ForceType).add(id);
  }

  // Second pass: build edge maps (only for IDs that exist in exercises)
  for (const raw of rawExercises) {
    const id = raw.id as ExerciseId;

    for (const subId of raw.substitutes) {
      if (exercises.has(subId as ExerciseId)) {
        getOrCreateSet(substitutes, id).add(subId as ExerciseId);
      }
    }

    for (const compId of raw.complements) {
      if (exercises.has(compId as ExerciseId)) {
        getOrCreateSet(complements, id).add(compId as ExerciseId);
      }
    }

    for (const ssId of raw.superset_candidates) {
      if (exercises.has(ssId as ExerciseId)) {
        getOrCreateSet(supersets, id).add(ssId as ExerciseId);
      }
    }
  }

  return {
    exercises,
    substitutes,
    complements,
    supersets,
    byMuscle,
    byEquipment,
    byPattern,
    byForceType,
  };
}
