import type { WorkoutLog, ExerciseGraph, ExerciseId } from '@/types';
import { formatWeight } from '@/utils/unitConversion';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildNotes(log: WorkoutLog, graph: ExerciseGraph): string {
  const wUnit = log.weightUnit ?? 'lb';
  const lines: string[] = [log.workoutName];

  for (const exLog of log.exercises) {
    const exercise = graph.exercises.get(exLog.exerciseId as ExerciseId);
    const name = exercise?.name ?? exLog.exerciseId;
    const completedSets = exLog.sets.filter((s) => s.completed);
    if (completedSets.length === 0) continue;

    // Determine a compact summary
    const firstSet = completedSets[0];
    if (firstSet.weight != null && firstSet.reps != null) {
      lines.push(`${name}: ${completedSets.length}x${firstSet.reps} @ ${formatWeight(firstSet.weight, wUnit)}`);
    } else if (firstSet.durationSeconds != null) {
      lines.push(`${name}: ${completedSets.length}x${firstSet.durationSeconds}s`);
    } else if (firstSet.reps != null) {
      lines.push(`${name}: ${completedSets.length}x${firstSet.reps}`);
    } else {
      lines.push(`${name}: ${completedSets.length} sets`);
    }
  }

  // Total volume
  let totalWeight = 0;
  for (const exLog of log.exercises) {
    for (const s of exLog.sets) {
      if (s.completed && s.weight != null && s.reps != null) {
        totalWeight += s.weight * s.reps;
      }
    }
  }
  if (totalWeight > 0) {
    lines.push(`Total: ${Math.round(totalWeight).toLocaleString('en-US')} ${wUnit}`);
  }

  lines.push('');
  lines.push('Logged with CurlBro');

  return lines.join('\n');
}

/**
 * Generate a TCX XML string for a workout log.
 * Strava accepts TCX upload with Sport="Other" for strength training.
 */
export function generateTcx(
  log: WorkoutLog,
  graph: ExerciseGraph,
  options?: { calories?: number },
): string {
  const startTime = new Date(log.startedAt).toISOString();
  const totalTimeSeconds = Math.round(log.durationMinutes * 60);
  const calories = Math.round(options?.calories ?? 0);
  const notes = escapeXml(buildNotes(log, graph));

  const name = escapeXml(log.workoutName || 'Workout');

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Other">
      <Id>${startTime}</Id>
      <Lap StartTime="${startTime}">
        <TotalTimeSeconds>${totalTimeSeconds}</TotalTimeSeconds>
        <Calories>${calories}</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
      </Lap>
      <Name>${name}</Name>
      <Notes>${notes}</Notes>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
}
