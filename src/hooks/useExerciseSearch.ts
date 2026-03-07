import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useStore } from '@/store';
import {
  ACTIVITY_MUSCLE_IMPACT,
  EXERCISE_TYPE_CATEGORIES,
  EQUIPMENT_GROUP_MEMBERS,
} from '@/types';
import type {
  Exercise,
  ExerciseId,
  MuscleGroup,
  ExerciseTypeFilter,
  EquipmentGroup,
  SorenessEntry,
  ActivityEntry,
  Equipment,
} from '@/types';

interface UseExerciseSearchOptions {
  muscleFilter?: MuscleGroup[];
  exerciseType?: ExerciseTypeFilter | null;
  equipmentGroups?: EquipmentGroup[];
  limit?: number;
}

/** Check if an exercise targets any of the given muscles as primary */
function targetsMuscles(exercise: Exercise, muscles: MuscleGroup[]): boolean {
  return exercise.primary_muscles.some((m) => muscles.includes(m as MuscleGroup));
}

/** Check if an exercise is a recovery category */
export function isRecoveryCategory(category: string): boolean {
  return category === 'stretch_dynamic' || category === 'stretch_static' || category === 'mobility' || category === 'cardio';
}

/** Expand equipment groups into flat set of equipment types */
function expandEquipmentGroups(groups: EquipmentGroup[]): Set<Equipment> {
  const result = new Set<Equipment>();
  for (const group of groups) {
    for (const eq of EQUIPMENT_GROUP_MEMBERS[group]) {
      result.add(eq);
    }
  }
  return result;
}

/** Get muscles fatigued by past activities (yesterday/today) */
function getFatiguedMuscles(activities: ActivityEntry[]): Set<MuscleGroup> {
  const muscles = new Set<MuscleGroup>();
  for (const activity of activities) {
    if (activity.timing === 'yesterday' || activity.timing === 'today') {
      for (const m of ACTIVITY_MUSCLE_IMPACT[activity.type]) {
        muscles.add(m);
      }
    }
  }
  return muscles;
}

/** Get muscles that need warm-up for tomorrow's activities */
function getPreActivityMuscles(activities: ActivityEntry[]): Set<MuscleGroup> {
  const muscles = new Set<MuscleGroup>();
  for (const activity of activities) {
    if (activity.timing === 'tomorrow') {
      for (const m of ACTIVITY_MUSCLE_IMPACT[activity.type]) {
        muscles.add(m);
      }
    }
  }
  return muscles;
}

/** Get sore muscles from soreness entries */
function getSoreMuscles(soreness: SorenessEntry[]): Set<MuscleGroup> {
  const muscles = new Set<MuscleGroup>();
  for (const entry of soreness) {
    if (entry.level !== 'none') {
      muscles.add(entry.muscle);
    }
  }
  return muscles;
}

export function useExerciseSearch(
  query: string,
  options: UseExerciseSearchOptions = {}
): Exercise[] {
  const graph = useStore((state) => state.graph);
  const soreness = useStore((state) => state.library.soreness);
  const activities = useStore((state) => state.library.activities);
  const {
    muscleFilter = [],
    exerciseType = null,
    equipmentGroups = [],
    limit = 50,
  } = options;

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
    // 1. Text search
    let filtered: Exercise[];
    if (query.trim() === '') {
      filtered = exercises;
    } else if (fuse) {
      filtered = fuse.search(query, { limit }).map((r) => r.item);
    } else {
      filtered = exercises;
    }

    // 2. Muscle filter
    if (muscleFilter.length > 0) {
      filtered = filtered.filter((exercise) =>
        exercise.primary_muscles.some((m) =>
          muscleFilter.includes(m as MuscleGroup)
        )
      );
    }

    // 3. Exercise type filter
    if (exerciseType) {
      const allowedCategories = EXERCISE_TYPE_CATEGORIES[exerciseType];
      filtered = filtered.filter((ex) =>
        allowedCategories.includes(ex.category)
      );
    }

    // 4. Equipment group filter
    if (equipmentGroups.length > 0) {
      const allowedEquipment = expandEquipmentGroups(equipmentGroups);
      filtered = filtered.filter((ex) =>
        ex.equipment.some((eq) => allowedEquipment.has(eq as Equipment))
      );
    }

    // 5. Auto-apply soreness — exclude exercises targeting sore muscles (except recovery)
    const soreMuscles = getSoreMuscles(soreness);
    if (soreMuscles.size > 0) {
      filtered = filtered.filter((ex) => {
        if (isRecoveryCategory(ex.category)) return true;
        return !targetsMuscles(ex, Array.from(soreMuscles));
      });
    }

    // 6. Auto-apply post-activity — exclude exercises targeting fatigued muscles (except recovery)
    const fatiguedMuscles = getFatiguedMuscles(activities);
    if (fatiguedMuscles.size > 0) {
      filtered = filtered.filter((ex) => {
        if (isRecoveryCategory(ex.category)) return true;
        return !targetsMuscles(ex, Array.from(fatiguedMuscles));
      });
    }

    // 7. Score & sort — recovery exercises targeting sore/fatigued muscles get boosted
    const allAffectedMuscles = new Set([...soreMuscles, ...fatiguedMuscles]);
    const preActivityMuscles = getPreActivityMuscles(activities);

    if (allAffectedMuscles.size > 0 || preActivityMuscles.size > 0) {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = scoreExercise(a, allAffectedMuscles, preActivityMuscles);
        const scoreB = scoreExercise(b, allAffectedMuscles, preActivityMuscles);
        return scoreA - scoreB;
      });
    }

    // 8. Limit
    return filtered.slice(0, limit);
  }, [query, exercises, fuse, muscleFilter, exerciseType, equipmentGroups, soreness, activities, limit]);
}

/** Score exercises for sort ordering */
function scoreExercise(
  exercise: Exercise,
  affectedMuscles: Set<MuscleGroup>,
  preActivityMuscles: Set<MuscleGroup>,
): number {
  // Recovery exercises targeting affected muscles get boosted to top
  if (isRecoveryCategory(exercise.category)) {
    const targetsAffected = exercise.primary_muscles.some((m) =>
      affectedMuscles.has(m as MuscleGroup)
    );
    if (targetsAffected) return -1;

    // Pre-activity: boost warm-up exercises targeting tomorrow's muscles
    const targetsPreActivity = exercise.primary_muscles.some((m) =>
      preActivityMuscles.has(m as MuscleGroup)
    );
    if (targetsPreActivity && (exercise.category === 'stretch_dynamic' || exercise.category === 'mobility')) {
      return -1;
    }
  }

  return 0;
}

export function useExerciseLookup(id: ExerciseId | null): Exercise | undefined {
  const graph = useStore((state) => state.graph);
  return useMemo(() => {
    if (!id) return undefined;
    return graph.exercises.get(id);
  }, [graph.exercises, id]);
}
