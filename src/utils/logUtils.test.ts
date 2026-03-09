import { describe, it, expect } from 'vitest';
import { computeLogStats, logToSavedWorkout, formatLogForClipboard } from './logUtils';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { WorkoutLog, ExerciseId, WorkoutId, LogId } from '@/types';

function s(weight: number | null, reps: number | null, completed: boolean): WorkoutLog['exercises'][0]['sets'][0] {
  return { weight, reps, completed, durationSeconds: null, distanceMeters: null };
}

function createTestLog(): WorkoutLog {
  return {
    id: 'log-1' as LogId,
    workoutId: 'w-1' as WorkoutId,
    workoutName: 'Push Day',
    exercises: [
      {
        exerciseId: 'barbell_bench_press' as ExerciseId,
        sets: [s(155, 8, true), s(155, 7, true), s(155, 6, true)],
        trackWeight: true,
        trackReps: true,
        trackDuration: false,
        trackDistance: false,
      },
      {
        exerciseId: 'cable_flye' as ExerciseId,
        sets: [s(30, 12, true), s(30, 10, true)],
        trackWeight: true,
        trackReps: true,
        trackDuration: false,
        trackDistance: false,
      },
    ],
    startedAt: '2026-03-04T10:00:00.000Z',
    completedAt: '2026-03-04T10:45:00.000Z',
    durationMinutes: 45,
    notes: '',
    weightUnit: 'lb',
    distanceUnit: 'mi',
  };
}

describe('computeLogStats', () => {
  it('computes stats from a complete log', () => {
    const log = createTestLog();
    const stats = computeLogStats(log);

    expect(stats.durationMinutes).toBe(45);
    expect(stats.exerciseCount).toBe(2);
    expect(stats.totalSets).toBe(5);
    expect(stats.completedSets).toBe(5);
    // (155*8) + (155*7) + (155*6) + (30*12) + (30*10) = 1240+1085+930+360+300 = 3915
    expect(stats.totalWeight).toBe(3915);
    expect(stats.date).toMatch(/Mar/);
  });

  it('handles incomplete sets', () => {
    const log = createTestLog();
    log.exercises[0].sets[2] = s(155, null, false);
    const stats = computeLogStats(log);

    expect(stats.completedSets).toBe(4);
    // Without the third bench set: 3915 - 930 = 2985
    expect(stats.totalWeight).toBe(2985);
  });

  it('handles null weight as zero', () => {
    const log = createTestLog();
    log.exercises[0].sets[0] = s(null, 10, true);
    const stats = computeLogStats(log);

    // 0*10 + 155*7 + 155*6 + 30*12 + 30*10 = 0+1085+930+360+300 = 2675
    expect(stats.totalWeight).toBe(2675);
  });
});

describe('logToSavedWorkout', () => {
  it('converts a log to a saved workout', () => {
    const log = createTestLog();
    const workout = logToSavedWorkout(log);

    expect(workout.name).toBe('Push Day');
    expect(workout.id).toBeDefined();
    expect(workout.id).not.toBe(log.workoutId);
    expect(workout.exercises.length).toBe(2);
  });

  it('uses weight from last completed set', () => {
    const log = createTestLog();
    const workout = logToSavedWorkout(log);

    // Last completed bench set has weight 155
    expect(workout.exercises[0].weight).toBe(155);
    // Last completed flye set has weight 30
    expect(workout.exercises[1].weight).toBe(30);
  });

  it('uses reps from first set with reps', () => {
    const log = createTestLog();
    const workout = logToSavedWorkout(log);

    expect(workout.exercises[0].reps).toBe(8);
    expect(workout.exercises[1].reps).toBe(12);
  });

  it('uses set count from log', () => {
    const log = createTestLog();
    const workout = logToSavedWorkout(log);

    expect(workout.exercises[0].sets).toBe(3);
    expect(workout.exercises[1].sets).toBe(2);
  });

  it('defaults reps to 8 when no set has reps', () => {
    const log = createTestLog();
    log.exercises[0].sets = [s(100, null, false)];
    const workout = logToSavedWorkout(log);

    expect(workout.exercises[0].reps).toBe(8);
  });

  it('uses null weight when no set was completed', () => {
    const log = createTestLog();
    log.exercises[0].sets = [s(100, 8, false)];
    const workout = logToSavedWorkout(log);

    expect(workout.exercises[0].weight).toBeNull();
  });

  it('sets restSeconds to 60 and notes from planNotes', () => {
    const log = createTestLog();
    const workout = logToSavedWorkout(log);

    for (const ex of workout.exercises) {
      expect(ex.restSeconds).toBe(60);
      expect(ex.notes).toBe('');
    }
  });

  it('carries planNotes to workout notes', () => {
    const log = createTestLog();
    log.exercises[0].planNotes = 'Pause at bottom';
    const workout = logToSavedWorkout(log);

    expect(workout.exercises[0].notes).toBe('Pause at bottom');
    expect(workout.exercises[1].notes).toBe('');
  });
});

describe('formatLogForClipboard', () => {
  it('formats a log for clipboard', () => {
    const graph = buildExerciseGraph(testExercises);
    const log = createTestLog();
    const output = formatLogForClipboard(log, graph);

    expect(output).toContain('## Push Day | 2026-03-04');
    expect(output).toContain('Duration: 45 min | Total: 3,915 lb');
    expect(output).toContain('Barbell Bench Press (Flat) [barbell_bench_press]');
    expect(output).toContain('Cable Flye (Mid-Height) [cable_flye]');
    expect(output).toContain('155lb');
    expect(output).toContain('\u2713');
  });

  it('shows BW for null weight sets', () => {
    const graph = buildExerciseGraph(testExercises);
    const log = createTestLog();
    log.exercises[0].sets = [s(null, 10, true)];
    const output = formatLogForClipboard(log, graph);

    expect(output).toContain('BW \u00d7 10 \u2713');
  });

  it('shows checkmark for incomplete sets', () => {
    const graph = buildExerciseGraph(testExercises);
    const log = createTestLog();
    log.exercises[0].sets[0] = s(155, 8, false);
    const output = formatLogForClipboard(log, graph);

    expect(output).toContain('155lb \u00d7 8 \u2717');
  });

  it('falls back to exerciseId when exercise not in graph', () => {
    const graph = buildExerciseGraph(testExercises);
    const log = createTestLog();
    log.exercises[0].exerciseId = 'unknown_exercise' as ExerciseId;
    const output = formatLogForClipboard(log, graph);

    expect(output).toContain('unknown_exercise [unknown_exercise]');
  });

  it('groups superset exercises with a label', () => {
    const graph = buildExerciseGraph(testExercises);
    const log = createTestLog();
    log.exercises[0].supersetGroupId = 'ss1';
    log.exercises[1].supersetGroupId = 'ss1';
    const output = formatLogForClipboard(log, graph);

    expect(output).toContain('[Superset]');
    // Both exercises should appear after the label
    const lines = output.split('\n');
    const labelIdx = lines.findIndex((l) => l.includes('[Superset]'));
    const benchIdx = lines.findIndex((l) => l.includes('barbell_bench_press'));
    const flyeIdx = lines.findIndex((l) => l.includes('cable_flye'));
    expect(labelIdx).toBeLessThan(benchIdx);
    expect(benchIdx).toBeLessThan(flyeIdx);
  });

  it('does not show group label for standalone exercises', () => {
    const graph = buildExerciseGraph(testExercises);
    const log = createTestLog();
    const output = formatLogForClipboard(log, graph);

    expect(output).not.toContain('[Superset]');
    expect(output).not.toContain('[Tri-set]');
    expect(output).not.toContain('[Circuit');
  });
});

describe('logToSavedWorkout superset preservation', () => {
  it('preserves supersetGroupId', () => {
    const log = createTestLog();
    log.exercises[0].supersetGroupId = 'ss1';
    log.exercises[1].supersetGroupId = 'ss1';
    const workout = logToSavedWorkout(log);

    expect(workout.exercises[0].supersetGroupId).toBe('ss1');
    expect(workout.exercises[1].supersetGroupId).toBe('ss1');
  });

  it('does not add supersetGroupId when not present on log', () => {
    const log = createTestLog();
    const workout = logToSavedWorkout(log);

    expect(workout.exercises[0].supersetGroupId).toBeUndefined();
    expect(workout.exercises[1].supersetGroupId).toBeUndefined();
  });
});
