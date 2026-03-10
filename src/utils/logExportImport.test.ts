import { describe, it, expect } from 'vitest';
import { createLogExport, parseLogImport } from './logExportImport';
import type { WorkoutLog, LogId, WorkoutId, ExerciseId } from '@/types';

function makeLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: 'log-1' as LogId,
    workoutId: 'wk-1' as WorkoutId,
    workoutName: 'Push Day',
    exercises: [
      {
        exerciseId: 'barbell_bench_press' as ExerciseId,
        sets: [
          { weight: 135, reps: 8, completed: true, durationSeconds: null, distanceMeters: null },
          { weight: 135, reps: 7, completed: true, durationSeconds: null, distanceMeters: null },
        ],
        planNotes: 'Go heavy',
        trackWeight: true,
        trackReps: true,
        trackDuration: false,
        trackDistance: false,
      },
    ],
    startedAt: '2026-03-01T10:00:00.000Z',
    completedAt: '2026-03-01T11:00:00.000Z',
    durationMinutes: 60,
    notes: 'Good session',
    weightUnit: 'lb',
    distanceUnit: 'mi',
    ...overrides,
  };
}

describe('createLogExport', () => {
  it('produces valid JSON with envelope fields', () => {
    const logs = [makeLog()];
    const json = createLogExport(logs);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(1);
    expect(parsed.app).toBe('curlbro');
    expect(parsed.logCount).toBe(1);
    expect(parsed.logs).toHaveLength(1);
    expect(parsed.exportedAt).toBeTruthy();
  });
});

describe('parseLogImport', () => {
  it('round-trips: parseLogImport(createLogExport(logs)) recovers all logs', () => {
    const logs = [makeLog(), makeLog({ id: 'log-2' as LogId, workoutName: 'Pull Day' })];
    const json = createLogExport(logs);
    const result = parseLogImport(json, new Set());

    expect(result.errors).toHaveLength(0);
    expect(result.logs).toHaveLength(2);
    expect(result.newLogs).toHaveLength(2);
    expect(result.duplicateCount).toBe(0);

    // Verify data integrity
    expect(result.logs[0].workoutName).toBe('Push Day');
    expect(result.logs[0].exercises[0].sets).toHaveLength(2);
    expect(result.logs[0].exercises[0].sets[0].weight).toBe(135);
    expect(result.logs[0].notes).toBe('Good session');
    expect(result.logs[1].workoutName).toBe('Pull Day');
  });

  it('rejects invalid JSON', () => {
    const result = parseLogImport('not json {{{', new Set());
    expect(result.errors).toContain('Invalid JSON file');
    expect(result.logs).toHaveLength(0);
  });

  it('rejects non-CurlBro JSON', () => {
    const result = parseLogImport(JSON.stringify({ foo: 'bar' }), new Set());
    expect(result.errors[0]).toContain('Not a CurlBro export file');
    expect(result.logs).toHaveLength(0);
  });

  it('rejects bad envelope (wrong app)', () => {
    const result = parseLogImport(
      JSON.stringify({ version: 1, app: 'other-app', exportedAt: '', logCount: 0, logs: [] }),
      new Set(),
    );
    expect(result.errors[0]).toContain('Invalid export file format');
  });

  it('skips individual invalid logs with warning', () => {
    const json = createLogExport([makeLog()]);
    const parsed = JSON.parse(json);
    // Corrupt one log, add another valid one
    parsed.logs.push({ bad: 'data' });
    parsed.logCount = 2;

    const result = parseLogImport(JSON.stringify(parsed), new Set());
    expect(result.logs).toHaveLength(1);
    expect(result.warnings.some((w) => w.includes('skipped'))).toBe(true);
  });

  it('detects duplicates', () => {
    const logs = [makeLog()];
    const json = createLogExport(logs);
    const existing = new Set(['log-1']);

    const result = parseLogImport(json, existing);
    expect(result.logs).toHaveLength(1);
    expect(result.newLogs).toHaveLength(0);
    expect(result.duplicateCount).toBe(1);
  });

  it('backfills missing fields (notes, units, tracking flags)', () => {
    const json = createLogExport([makeLog()]);
    const parsed = JSON.parse(json);
    const log = parsed.logs[0];

    // Remove fields that should be backfilled
    delete log.notes;
    delete log.weightUnit;
    delete log.distanceUnit;
    delete log.exercises[0].planNotes;
    delete log.exercises[0].trackWeight;
    delete log.exercises[0].trackDuration;
    delete log.exercises[0].sets[0].durationSeconds;
    delete log.exercises[0].sets[0].distanceMeters;

    const result = parseLogImport(JSON.stringify(parsed), new Set());
    expect(result.errors).toHaveLength(0);
    expect(result.logs).toHaveLength(1);

    const imported = result.logs[0];
    expect(imported.notes).toBe('');
    expect(imported.weightUnit).toBe('lb');
    expect(imported.distanceUnit).toBe('mi');
    expect(imported.exercises[0].planNotes).toBe('');
    expect(imported.exercises[0].trackWeight).toBe(true);
    expect(imported.exercises[0].trackDuration).toBe(false);
    expect(imported.exercises[0].sets[0].durationSeconds).toBeNull();
    expect(imported.exercises[0].sets[0].distanceMeters).toBeNull();
  });

  it('imports future version with warning', () => {
    const json = createLogExport([makeLog()]);
    const parsed = JSON.parse(json);
    parsed.version = 99;

    const result = parseLogImport(JSON.stringify(parsed), new Set());
    expect(result.errors).toHaveLength(0);
    expect(result.logs).toHaveLength(1);
    expect(result.warnings.some((w) => w.includes('newer version'))).toBe(true);
  });

  it('warns on logCount mismatch', () => {
    const json = createLogExport([makeLog()]);
    const parsed = JSON.parse(json);
    parsed.logCount = 5; // Mismatch

    const result = parseLogImport(JSON.stringify(parsed), new Set());
    expect(result.logs).toHaveLength(1);
    expect(result.warnings.some((w) => w.includes('Expected 5'))).toBe(true);
  });
});
