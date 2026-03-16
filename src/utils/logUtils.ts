import type { WorkoutLog, SavedWorkout, ExerciseGraph, ExerciseId, WorkoutId, WeightUnit, DistanceUnit } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { deriveGroups, getGroupLabel } from '@/utils/groupUtils';
import { formatWeight, formatDistance } from '@/utils/unitConversion';
import { v4 as uuidv4 } from 'uuid';

export interface LogStats {
  date: string;
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  completedSets: number;
  totalWeight: number;
  totalDurationSeconds: number;
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
  let totalDurationSeconds = 0;

  for (const ex of log.exercises) {
    for (const s of ex.sets) {
      totalSets++;
      if (s.completed) {
        completedSets++;
        if (s.weight != null && s.reps != null) {
          totalWeight += s.weight * s.reps;
        }
        if (s.durationSeconds != null) {
          totalDurationSeconds += s.durationSeconds;
        }
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
    totalDurationSeconds,
  };
}

export function logToSavedWorkout(
  log: WorkoutLog,
  defaultRestSeconds = DEFAULT_SETTINGS.defaultRestSeconds,
): SavedWorkout {
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
        restSeconds: ex.restSeconds ?? defaultRestSeconds,
        notes: ex.planNotes ?? '',
        trackWeight: ex.trackWeight,
        trackReps: ex.trackReps,
        trackDuration: ex.trackDuration,
        trackDistance: ex.trackDistance,
        ...(ex.durationSeconds != null ? { durationSeconds: ex.durationSeconds } : {}),
        ...(ex.supersetGroupId && { supersetGroupId: ex.supersetGroupId }),
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
  const wUnit = log.weightUnit ?? 'lb';
  const dUnit = log.distanceUnit ?? 'mi';

  const lines: string[] = [];
  lines.push(`## ${log.workoutName} | ${dateStr}`);

  const headerParts = [`Duration: ${stats.durationMinutes} min`];
  if (stats.totalWeight > 0) {
    const totalStr = Math.round(stats.totalWeight).toLocaleString('en-US');
    headerParts.push(`Total: ${totalStr} ${wUnit}`);
  }
  if (stats.totalDurationSeconds > 0) {
    const mins = Math.round(stats.totalDurationSeconds / 60);
    headerParts.push(`Active: ${mins} min`);
  }
  lines.push(headerParts.join(' | '));
  lines.push('---');

  const groups = deriveGroups(log.exercises);

  for (const group of groups) {
    const label = getGroupLabel(group.exercises.length);

    if (label) {
      lines.push('');
      lines.push(`[${label}]`);
    }

    for (const ex of group.exercises) {
      const exercise = graph.exercises.get(ex.exerciseId as ExerciseId);
      const name = exercise?.name ?? ex.exerciseId;
      lines.push(`${name} [${ex.exerciseId}]`);

      const setParts = ex.sets.map((s) => {
        const parts: string[] = [];

        if (s.weight != null) {
          parts.push(formatWeight(s.weight, wUnit));
        }
        if (s.reps != null) {
          parts.push(`${s.reps} reps`);
        }
        if (s.durationSeconds != null) {
          parts.push(`${s.durationSeconds}s`);
        }
        if (s.distanceMeters != null) {
          parts.push(formatDistance(s.distanceMeters, dUnit));
        }

        if (parts.length === 0) parts.push('BW');

        const mark = s.completed ? '\u2713' : '\u2717';
        return `${parts.join(' \u00d7 ')} ${mark}`;
      });
      lines.push(`  ${setParts.join(' | ')}`);
    }
  }

  return lines.join('\n');
}

function formatDurationCompact(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}:00`;
  }
  return `${seconds}s`;
}

function formatSetForShare(
  s: { weight: number | null; reps: number | null; completed: boolean; durationSeconds: number | null; distanceMeters: number | null },
  wUnit: WeightUnit,
  dUnit: DistanceUnit,
): string {
  const parts: string[] = [];

  if (s.weight != null) {
    parts.push(formatWeight(s.weight, wUnit));
  } else if (s.reps != null && s.durationSeconds == null && s.distanceMeters == null) {
    // Bodyweight exercise with only reps
    parts.push('BW');
  }

  if (s.reps != null) {
    parts.push(`x ${s.reps}`);
  }

  if (s.durationSeconds != null) {
    parts.push(formatDurationCompact(s.durationSeconds));
  }

  if (s.distanceMeters != null) {
    parts.push(formatDistance(s.distanceMeters, dUnit));
  }

  if (parts.length === 0) parts.push('BW');

  const mark = s.completed ? '\u2713' : '\u2717';
  return `${parts.join(' ')} ${mark}`;
}

export interface ShareFormatOptions {
  calories?: number;
}

/**
 * Mobile-friendly share format: one set per line, no IDs, no markdown headers.
 */
export function formatLogForShare(
  log: WorkoutLog,
  graph: ExerciseGraph,
  options?: ShareFormatOptions,
): string {
  const stats = computeLogStats(log);
  const wUnit = log.weightUnit ?? 'lb';
  const dUnit = log.distanceUnit ?? 'mi';

  const d = new Date(log.startedAt);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const lines: string[] = [];
  lines.push(`${log.workoutName || 'Untitled'} -- ${dateStr}`);

  const headerParts: string[] = [`${stats.durationMinutes} min`];
  if (stats.totalWeight > 0) {
    const totalStr = Math.round(stats.totalWeight).toLocaleString('en-US');
    headerParts.push(`${totalStr} ${wUnit} lifted`);
  }
  if (options?.calories != null && options.calories > 0) {
    headerParts.push(`~${options.calories} cal`);
  }
  lines.push(headerParts.join(' \u00b7 '));

  const groups = deriveGroups(log.exercises);

  for (const group of groups) {
    const label = getGroupLabel(group.exercises.length);

    lines.push('');
    if (label) {
      lines.push(`[${label}]`);
    }

    for (const ex of group.exercises) {
      const exercise = graph.exercises.get(ex.exerciseId as ExerciseId);
      const name = exercise?.name ?? ex.exerciseId;
      lines.push(name);

      for (let i = 0; i < ex.sets.length; i++) {
        const setStr = formatSetForShare(ex.sets[i], wUnit, dUnit);
        lines.push(`  ${i + 1}. ${setStr}`);
      }
    }
  }

  return lines.join('\n');
}
