import type { WorkoutLog, ExerciseGraph, ExerciseId, Category } from '@/types';

const MET_BY_CATEGORY: Record<Category, number> = {
  compound: 5.0,
  isolation: 3.5,
  cardio: 7.0,
  stretch_dynamic: 3.0,
  stretch_static: 2.5,
  mobility: 2.5,
};

const FALLBACK_MET = 4.0;

/**
 * Estimate calories burned for a workout log using MET-based formula.
 * MET_avg is weighted by completed set count per exercise.
 * Formula: calories = MET_avg × bodyWeightKg × (durationMinutes / 60)
 */
export function estimateCalories(
  log: WorkoutLog,
  bodyWeightKg: number,
  graph: ExerciseGraph,
): number {
  if (log.durationMinutes <= 0) return 0;

  let totalCompletedSets = 0;
  let weightedMetSum = 0;

  for (const exLog of log.exercises) {
    const completedSets = exLog.sets.filter((s) => s.completed).length;
    if (completedSets === 0) continue;

    const exercise = graph.exercises.get(exLog.exerciseId as ExerciseId);
    const met = exercise ? (MET_BY_CATEGORY[exercise.category] ?? FALLBACK_MET) : FALLBACK_MET;

    weightedMetSum += met * completedSets;
    totalCompletedSets += completedSets;
  }

  if (totalCompletedSets === 0) return 0;

  const metAvg = weightedMetSum / totalCompletedSets;
  return Math.round(metAvg * bodyWeightKg * (log.durationMinutes / 60));
}
