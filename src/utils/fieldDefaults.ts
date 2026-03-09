import type { Exercise, TrackingFlags } from '@/types';

/**
 * Infer default tracking flags for an exercise based on its category and equipment.
 *
 * | Category                                    | Equipment        | Weight | Reps | Duration | Distance |
 * |---------------------------------------------|------------------|:------:|:----:|:--------:|:--------:|
 * | compound / isolation                        | non-bodyweight   | true   | true | false    | false    |
 * | compound / isolation                        | bodyweight only  | false  | true | false    | false    |
 * | stretch_dynamic / stretch_static / mobility | any              | false  | false| true     | false    |
 * | cardio                                      | any              | false  | false| true     | true     |
 */
export function inferTrackingFlags(exercise: Exercise): TrackingFlags {
  const { category, equipment } = exercise;

  if (category === 'cardio') {
    return { trackWeight: false, trackReps: false, trackDuration: true, trackDistance: true };
  }

  if (category === 'stretch_dynamic' || category === 'stretch_static' || category === 'mobility') {
    return { trackWeight: false, trackReps: false, trackDuration: true, trackDistance: false };
  }

  // compound / isolation
  const isBodyweightOnly =
    equipment.length > 0 && equipment.every((e) => e === 'bodyweight');

  return {
    trackWeight: !isBodyweightOnly,
    trackReps: true,
    trackDuration: false,
    trackDistance: false,
  };
}
