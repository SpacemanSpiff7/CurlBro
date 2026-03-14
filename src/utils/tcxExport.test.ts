import { describe, it, expect } from 'vitest';
import { generateTcx } from './tcxExport';
import type { WorkoutLog, ExerciseGraph, ExerciseId } from '@/types';

function makeGraph(exercises: { id: string; name: string; category: string }[]): ExerciseGraph {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = new Map<ExerciseId, any>();
  for (const ex of exercises) {
    map.set(ex.id as ExerciseId, ex);
  }
  return {
    exercises: map,
    substitutes: new Map(),
    complements: new Map(),
    supersets: new Map(),
    byMuscle: new Map(),
    byEquipment: new Map(),
    byPattern: new Map(),
    byForceType: new Map(),
  };
}

function makeLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: 'log1' as WorkoutLog['id'],
    workoutId: 'w1' as WorkoutLog['workoutId'],
    workoutName: 'Push Day',
    exercises: [
      {
        exerciseId: 'bench_press' as ExerciseId,
        sets: [
          { weight: 155, reps: 8, completed: true, durationSeconds: null, distanceMeters: null },
          { weight: 155, reps: 7, completed: true, durationSeconds: null, distanceMeters: null },
        ],
        trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false,
      },
    ],
    startedAt: '2026-03-01T10:00:00.000Z',
    completedAt: '2026-03-01T10:45:00.000Z',
    durationMinutes: 45,
    notes: '',
    weightUnit: 'lb',
    distanceUnit: 'mi',
    ...overrides,
  };
}

describe('generateTcx', () => {
  const graph = makeGraph([{ id: 'bench_press', name: 'Barbell Bench Press', category: 'compound' }]);

  it('starts with XML declaration', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx.startsWith('<?xml version="1.0"')).toBe(true);
  });

  it('contains TrainingCenterDatabase root with correct namespace', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx).toContain('<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">');
  });

  it('has correct TotalTimeSeconds', () => {
    const tcx = generateTcx(makeLog(), graph);
    // 45 min × 60 = 2700
    expect(tcx).toContain('<TotalTimeSeconds>2700</TotalTimeSeconds>');
  });

  it('includes provided calories as integer', () => {
    const tcx = generateTcx(makeLog(), graph, { calories: 285 });
    expect(tcx).toContain('<Calories>285</Calories>');
  });

  it('defaults calories to 0 when not provided', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx).toContain('<Calories>0</Calories>');
  });

  it('has Sport="Other" attribute', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx).toContain('Sport="Other"');
  });

  it('escapes XML special characters in workout name', () => {
    const log = makeLog({ workoutName: 'Push & Pull <Day>' });
    const tcx = generateTcx(log, graph);
    expect(tcx).toContain('Push &amp; Pull &lt;Day&gt;');
    expect(tcx).not.toContain('Push & Pull <Day>');
  });

  it('Id matches startedAt ISO format', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx).toContain('<Id>2026-03-01T10:00:00.000Z</Id>');
  });

  it('Notes contain exercise names from graph', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx).toContain('Barbell Bench Press');
  });

  it('Notes contain branding footer', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx).toContain('Logged with CurlBro');
  });

  it('has Name element with workout name', () => {
    const tcx = generateTcx(makeLog(), graph);
    expect(tcx).toContain('<Name>Push Day</Name>');
  });

  it('escapes Name element', () => {
    const log = makeLog({ workoutName: 'Push & Pull' });
    const tcx = generateTcx(log, graph);
    expect(tcx).toContain('<Name>Push &amp; Pull</Name>');
  });

  it('rounds fractional calories to integer', () => {
    const tcx = generateTcx(makeLog(), graph, { calories: 285.7 });
    expect(tcx).toContain('<Calories>286</Calories>');
  });
});
