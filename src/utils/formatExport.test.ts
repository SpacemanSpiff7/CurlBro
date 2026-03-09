import { describe, it, expect } from 'vitest';
import { formatExport } from './formatExport';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { SavedWorkout, WorkoutId, ExerciseId } from '@/types';

const graph = buildExerciseGraph(testExercises);

function makeWorkout(exercises: SavedWorkout['exercises']): SavedWorkout {
  return {
    id: 'w-1' as WorkoutId,
    name: 'Test Workout',
    exercises,
    createdAt: '2026-03-04T00:00:00.000Z',
    updatedAt: '2026-03-04T00:00:00.000Z',
  };
}

function ex(
  id: string,
  overrides: Partial<SavedWorkout['exercises'][0]> = {}
): SavedWorkout['exercises'][0] {
  return {
    exerciseId: id as ExerciseId,
    sets: 3,
    reps: 10,
    weight: null,
    restSeconds: 60,
    notes: '',
    trackWeight: true,
    trackReps: true,
    trackDuration: false,
    trackDistance: false,
    ...overrides,
  };
}

describe('formatExport', () => {
  it('formats weight+reps exercise with weight', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 4, reps: 8, weight: 155 }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 60s');
  });

  it('formats weight+reps exercise without weight (bodyweight)', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 3, reps: 12, weight: null }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    // No weight field when weight is null
    expect(text).toContain('Barbell Bench Press (Flat) [barbell_bench_press] | 3x12 | Rest: 60s');
    // Should NOT have empty weight between pipes
    expect(text).not.toContain('| |');
  });

  it('formats reps-only exercise (trackWeight: false)', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 3, reps: 15, weight: null, trackWeight: false }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('| 3x15 | Rest: 60s');
  });

  it('formats duration exercise (seconds < 60)', () => {
    const workout = makeWorkout([
      ex('chest_stretch', {
        sets: 3,
        reps: 1,
        trackWeight: false,
        trackReps: false,
        trackDuration: true,
        durationSeconds: 30,
      }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('Doorway Chest Stretch [chest_stretch] | 3x30s | Rest: 60s');
  });

  it('formats duration exercise (seconds >= 60) as M:SS', () => {
    const workout = makeWorkout([
      ex('chest_stretch', {
        sets: 1,
        reps: 1,
        trackWeight: false,
        trackReps: false,
        trackDuration: true,
        durationSeconds: 300,
      }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('| 1x5:00 | Rest: 60s');
  });

  it('formats duration exercise with mixed M:SS (90s = 1:30)', () => {
    const workout = makeWorkout([
      ex('chest_stretch', {
        sets: 3,
        reps: 1,
        trackWeight: false,
        trackReps: false,
        trackDuration: true,
        durationSeconds: 90,
      }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('| 3x1:30 | Rest: 60s');
  });

  it('uses kg unit when specified', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 4, reps: 8, weight: 70 }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false, weightUnit: 'kg' });
    expect(text).toContain('| 70kg |');
  });

  it('includes tips when requested', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 4, reps: 8, weight: 155 }),
    ]);
    const text = formatExport(workout, graph, { includeTips: true });
    expect(text).toContain('  tip: Eyes under bar.');
  });

  it('omits tips when not requested', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 4, reps: 8, weight: 155 }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).not.toContain('tip:');
  });

  it('includes superset tag', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 3, reps: 8, weight: 135, supersetGroupId: 'grp1' }),
      ex('barbell_row', { sets: 3, reps: 8, weight: 135, supersetGroupId: 'grp1' }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('[superset:grp1]');
  });

  it('includes header and separator', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 3, reps: 10, weight: 135 }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('## Test Workout | 2026-03-04');
    expect(text).toContain('---');
  });

  it('defaults name to Untitled Workout', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 3, reps: 10, weight: 135 }),
    ]);
    workout.name = '';
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('## Untitled Workout');
  });

  it('formats mixed workout with weight+reps and duration exercises', () => {
    const workout = makeWorkout([
      ex('barbell_bench_press', { sets: 4, reps: 8, weight: 155 }),
      ex('chest_stretch', {
        sets: 3,
        reps: 1,
        trackWeight: false,
        trackReps: false,
        trackDuration: true,
        durationSeconds: 30,
      }),
    ]);
    const text = formatExport(workout, graph, { includeTips: false });
    expect(text).toContain('4x8 | 155lb');
    expect(text).toContain('3x30s');
  });
});
