import type { ExerciseGraph, SavedWorkout, ExerciseId } from '@/types';

export interface FormatExportOptions {
  includeTips?: boolean;
}

export function formatExport(
  workout: SavedWorkout,
  graph: ExerciseGraph,
  options: FormatExportOptions = {}
): string {
  const { includeTips = true } = options;
  const dateStr = workout.updatedAt.slice(0, 10); // "yyyy-MM-dd" from ISO string
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

    const weightStr = ex.weight != null ? `${ex.weight}lb` : '';
    const line = `${exercise.name} [${ex.exerciseId}] | ${ex.sets}x${ex.reps} | ${weightStr} | Rest: ${ex.restSeconds}s`;
    lines.push(line);

    if (includeTips && exercise.beginner_tips) {
      lines.push(`  tip: ${exercise.beginner_tips}`);
    }
  }

  return lines.join('\n');
}
