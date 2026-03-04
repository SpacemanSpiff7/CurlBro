import { describe, it, expect, beforeEach } from 'vitest';
import { formatExport } from '@/utils/formatExport';
import { parseImport } from '@/utils/parseImport';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../fixtures/testGraph';
import type { SavedWorkout, WorkoutId, ExerciseId, ExerciseGraph } from '@/types';

describe('Import/Export', () => {
  let graph: ExerciseGraph;

  beforeEach(() => {
    graph = buildExerciseGraph(testExercises);
  });

  function createTestWorkout(): SavedWorkout {
    return {
      id: 'test-workout' as WorkoutId,
      name: 'Push Day',
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 4,
          reps: 8,
          weight: 155,
          restSeconds: 120,
          notes: '',
        },
        {
          exerciseId: 'cable_flye' as ExerciseId,
          sets: 3,
          reps: 12,
          weight: null,
          restSeconds: 60,
          notes: '',
        },
      ],
      createdAt: '2026-03-04T00:00:00.000Z',
      updatedAt: '2026-03-04T00:00:00.000Z',
    };
  }

  describe('formatExport', () => {
    it('produces correct format', () => {
      const workout = createTestWorkout();
      const text = formatExport(workout, graph);

      expect(text).toContain('## Push Day | 2026-03-04');
      expect(text).toContain('---');
      expect(text).toContain('Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s');
      expect(text).toContain('Cable Flye (Mid-Height) [cable_flye] | 3x12 |  | Rest: 60s');
    });

    it('includes tips', () => {
      const workout = createTestWorkout();
      const text = formatExport(workout, graph);
      expect(text).toContain('  tip:');
    });

    it('handles empty weight', () => {
      const workout = createTestWorkout();
      const text = formatExport(workout, graph);
      // Cable flye has null weight — should be empty between pipes
      const cableFlye = text.split('\n').find((l) => l.includes('cable_flye'));
      expect(cableFlye).toContain('|  | Rest:');
    });
  });

  describe('parseImport', () => {
    it('parses valid export text', () => {
      const text = [
        '## Push Day | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s',
        '  tip: Eyes under bar.',
        'Cable Flye (Mid-Height) [cable_flye] | 3x12 | | Rest: 60s',
        '  tip: Pulleys at chest height.',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout).not.toBeNull();
      expect(result.workout!.name).toBe('Push Day');
      expect(result.workout!.exercises.length).toBe(2);
      expect(result.workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(result.workout!.exercises[0].sets).toBe(4);
      expect(result.workout!.exercises[0].reps).toBe(8);
      expect(result.workout!.exercises[0].weight).toBe(155);
      expect(result.workout!.exercises[0].restSeconds).toBe(120);
      expect(result.workout!.exercises[1].weight).toBeNull();
    });

    it('warns on unknown exercise IDs', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Unknown Exercise [unknown_id] | 3x10 | 100lb | Rest: 60s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('unknown_id');
      // Should still parse the exercise
      expect(result.workout!.exercises.length).toBe(1);
    });

    it('errors on malformed lines', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'This is not a valid exercise line',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('errors on empty input', () => {
      const result = parseImport('', graph);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.workout).toBeNull();
    });

    it('handles missing header gracefully', () => {
      const text = [
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.warnings).toContain('No header found, using defaults');
      expect(result.workout).not.toBeNull();
      expect(result.workout!.name).toBe('Imported Workout');
    });
  });

  describe('round-trip', () => {
    it('export → import produces equivalent workout', () => {
      const original = createTestWorkout();
      const exported = formatExport(original, graph);
      const imported = parseImport(exported, graph);

      expect(imported.errors).toEqual([]);
      expect(imported.workout).not.toBeNull();
      expect(imported.workout!.name).toBe(original.name);
      expect(imported.workout!.exercises.length).toBe(original.exercises.length);

      for (let i = 0; i < original.exercises.length; i++) {
        const orig = original.exercises[i];
        const imp = imported.workout!.exercises[i];
        expect(imp.exerciseId).toBe(orig.exerciseId);
        expect(imp.sets).toBe(orig.sets);
        expect(imp.reps).toBe(orig.reps);
        expect(imp.weight).toBe(orig.weight);
        expect(imp.restSeconds).toBe(orig.restSeconds);
      }
    });
  });
});
