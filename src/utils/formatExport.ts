import type { ExerciseGraph, SavedWorkout, ExerciseId, WeightUnit } from '@/types';

export interface FormatExportOptions {
  includeTips?: boolean;
  weightUnit?: WeightUnit;
}

/** Format duration seconds as "30s" (<60) or "M:SS" (≥60). */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatExport(
  workout: SavedWorkout,
  graph: ExerciseGraph,
  options: FormatExportOptions = {}
): string {
  const { includeTips = true, weightUnit = 'lb' } = options;
  const dateStr = workout.updatedAt.slice(0, 10);
  const name = workout.name || 'Untitled Workout';

  const lines: string[] = [];
  lines.push(`## ${name} | ${dateStr}`);
  lines.push('---');

  let first = true;
  for (const ex of workout.exercises) {
    const exercise = graph.exercises.get(ex.exerciseId as ExerciseId);
    if (!exercise) continue;

    if (!first) lines.push('');
    first = false;

    const supersetTag = ex.supersetGroupId ? ` [superset:${ex.supersetGroupId}]` : '';

    // Build data field based on tracking flags
    let dataField: string;
    if (ex.trackDuration && ex.durationSeconds != null) {
      dataField = `${ex.sets}x${formatDuration(ex.durationSeconds)}`;
    } else {
      dataField = `${ex.sets}x${ex.reps}`;
    }

    const parts = [`${exercise.name} [${ex.exerciseId}]`, dataField];

    // Weight field (only for weight-tracked exercises with a value)
    if (ex.trackWeight && ex.weight != null) {
      parts.push(`${ex.weight}${weightUnit}`);
    }

    parts.push(`Rest: ${ex.restSeconds}s`);

    lines.push(parts.join(' | ') + supersetTag);

    if (includeTips && exercise.beginner_tips) {
      lines.push(`  tip: ${exercise.beginner_tips}`);
    }
  }

  return lines.join('\n');
}
