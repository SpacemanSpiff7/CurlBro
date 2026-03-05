import type { WorkoutLog, SavedWorkout, ExerciseGraph, ExerciseId, WorkoutId } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface LogStats {
  date: string;
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  completedSets: number;
  totalWeight: number;
}

export function computeLogStats(log: WorkoutLog): LogStats {
  const d = new Date(log.startedAt);
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  let totalSets = 0;
  let completedSets = 0;
  let totalWeight = 0;

  for (const ex of log.exercises) {
    for (const s of ex.sets) {
      totalSets++;
      if (s.completed) {
        completedSets++;
        totalWeight += (s.weight ?? 0) * (s.reps ?? 0);
      }
    }
  }

  return {
    date,
    durationMinutes: log.durationMinutes,
    exerciseCount: log.exercises.length,
    totalSets,
    completedSets,
    totalWeight,
  };
}

export function logToSavedWorkout(log: WorkoutLog): SavedWorkout {
  const now = new Date().toISOString();

  return {
    id: uuidv4() as WorkoutId,
    name: log.workoutName,
    exercises: log.exercises.map((ex) => {
      const lastCompleted = [...ex.sets].reverse().find((s) => s.completed);
      const firstWithReps = ex.sets.find((s) => s.reps != null);

      return {
        exerciseId: ex.exerciseId,
        sets: ex.sets.length,
        reps: firstWithReps?.reps ?? 8,
        weight: lastCompleted?.weight ?? null,
        restSeconds: 60,
        notes: '',
      };
    }),
    createdAt: now,
    updatedAt: now,
  };
}

export function formatLogForClipboard(
  log: WorkoutLog,
  graph: ExerciseGraph,
): string {
  const dateStr = log.startedAt.slice(0, 10);
  const stats = computeLogStats(log);
  const totalWeightStr = stats.totalWeight.toLocaleString('en-US');

  const lines: string[] = [];
  lines.push(`## ${log.workoutName} | ${dateStr}`);
  lines.push(`Duration: ${stats.durationMinutes} min | Total: ${totalWeightStr} lb`);
  lines.push('---');

  for (const ex of log.exercises) {
    const exercise = graph.exercises.get(ex.exerciseId as ExerciseId);
    const name = exercise?.name ?? ex.exerciseId;
    lines.push(`${name} [${ex.exerciseId}]`);

    const setParts = ex.sets.map((s) => {
      const w = s.weight != null ? `${s.weight}lb` : 'BW';
      const r = s.reps ?? 0;
      const mark = s.completed ? '\u2713' : '\u2717';
      return `${w} \u00d7 ${r} ${mark}`;
    });
    lines.push(`  ${setParts.join(' | ')}`);
  }

  return lines.join('\n');
}
