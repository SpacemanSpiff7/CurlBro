import { describe, it, expect } from 'vitest';
import { estimateCalories } from './calorieEstimate';
import type { WorkoutLog, ExerciseGraph, ExerciseId } from '@/types';

function makeGraph(exercises: { id: string; category: string }[]): ExerciseGraph {
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
    workoutName: 'Test',
    exercises: [],
    startedAt: '2026-03-01T10:00:00Z',
    completedAt: '2026-03-01T11:00:00Z',
    durationMinutes: 60,
    notes: '',
    weightUnit: 'lb',
    distanceUnit: 'mi',
    ...overrides,
  };
}

describe('estimateCalories', () => {
  it('returns correct calories for all compound exercises', () => {
    const graph = makeGraph([{ id: 'bench_press', category: 'compound' }]);
    const log = makeLog({
      exercises: [{
        exerciseId: 'bench_press' as ExerciseId,
        sets: [{ weight: 135, reps: 8, completed: true, durationSeconds: null, distanceMeters: null }],
        restSeconds: 90,
        trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false,
      }],
    });
    // MET 5.0 × 80kg × 1.0h = 400
    expect(estimateCalories(log, 80, graph)).toBe(400);
  });

  it('uses isolation MET for isolation exercises', () => {
    const graph = makeGraph([{ id: 'curl', category: 'isolation' }]);
    const log = makeLog({
      exercises: [{
        exerciseId: 'curl' as ExerciseId,
        sets: [{ weight: 30, reps: 12, completed: true, durationSeconds: null, distanceMeters: null }],
        restSeconds: 90,
        trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false,
      }],
    });
    // MET 3.5 × 80kg × 1.0h = 280
    expect(estimateCalories(log, 80, graph)).toBe(280);
  });

  it('uses cardio MET for cardio exercises', () => {
    const graph = makeGraph([{ id: 'treadmill_run', category: 'cardio' }]);
    const log = makeLog({
      exercises: [{
        exerciseId: 'treadmill_run' as ExerciseId,
        sets: [{ weight: null, reps: null, completed: true, durationSeconds: 1800, distanceMeters: null }],
        restSeconds: 90,
        trackWeight: false, trackReps: false, trackDuration: true, trackDistance: false,
      }],
    });
    // MET 7.0 × 80kg × 1.0h = 560
    expect(estimateCalories(log, 80, graph)).toBe(560);
  });

  it('computes weighted average MET for mixed categories', () => {
    const graph = makeGraph([
      { id: 'bench', category: 'compound' },
      { id: 'curl', category: 'isolation' },
    ]);
    const log = makeLog({
      exercises: [
        {
          exerciseId: 'bench' as ExerciseId,
          sets: [
            { weight: 135, reps: 8, completed: true, durationSeconds: null, distanceMeters: null },
            { weight: 135, reps: 8, completed: true, durationSeconds: null, distanceMeters: null },
          ],
          restSeconds: 90,
          trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false,
        },
        {
          exerciseId: 'curl' as ExerciseId,
          sets: [
            { weight: 30, reps: 12, completed: true, durationSeconds: null, distanceMeters: null },
          ],
          restSeconds: 90,
          trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false,
        },
      ],
    });
    // 2 compound sets (MET 5.0) + 1 isolation set (MET 3.5)
    // Weighted avg = (5.0*2 + 3.5*1) / 3 = 13.5/3 = 4.5
    // 4.5 × 80 × 1.0 = 360
    expect(estimateCalories(log, 80, graph)).toBe(360);
  });

  it('uses fallback MET for exercises not in graph', () => {
    const graph = makeGraph([]);
    const log = makeLog({
      exercises: [{
        exerciseId: 'unknown_exercise' as ExerciseId,
        sets: [{ weight: null, reps: 10, completed: true, durationSeconds: null, distanceMeters: null }],
        restSeconds: 90,
        trackWeight: false, trackReps: true, trackDuration: false, trackDistance: false,
      }],
    });
    // Fallback MET 4.0 × 80 × 1.0 = 320
    expect(estimateCalories(log, 80, graph)).toBe(320);
  });

  it('returns 0 when no sets are completed', () => {
    const graph = makeGraph([{ id: 'bench', category: 'compound' }]);
    const log = makeLog({
      exercises: [{
        exerciseId: 'bench' as ExerciseId,
        sets: [{ weight: 135, reps: 8, completed: false, durationSeconds: null, distanceMeters: null }],
        restSeconds: 90,
        trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false,
      }],
    });
    expect(estimateCalories(log, 80, graph)).toBe(0);
  });

  it('returns 0 when duration is zero', () => {
    const graph = makeGraph([{ id: 'bench', category: 'compound' }]);
    const log = makeLog({
      durationMinutes: 0,
      exercises: [{
        exerciseId: 'bench' as ExerciseId,
        sets: [{ weight: 135, reps: 8, completed: true, durationSeconds: null, distanceMeters: null }],
        restSeconds: 90,
        trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false,
      }],
    });
    expect(estimateCalories(log, 80, graph)).toBe(0);
  });
});
