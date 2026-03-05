import { describe, it, expect, beforeEach } from 'vitest';
import { formatExport } from '@/utils/formatExport';
import { parseImport } from '@/utils/parseImport';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../fixtures/testGraph';
import type { SavedWorkout, WorkoutId, ExerciseId, ExerciseGraph, AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

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

    it('includes tips by default', () => {
      const workout = createTestWorkout();
      const text = formatExport(workout, graph);
      expect(text).toContain('  tip:');
    });

    it('omits tips when includeTips is false', () => {
      const workout = createTestWorkout();
      const text = formatExport(workout, graph, { includeTips: false });
      expect(text).not.toContain('  tip:');
    });

    it('adds blank lines between exercises', () => {
      const workout = createTestWorkout();
      const text = formatExport(workout, graph, { includeTips: false });
      const lines = text.split('\n');
      // After header + separator + first exercise, expect a blank line before second exercise
      const benchIdx = lines.findIndex((l) => l.includes('barbell_bench_press'));
      const flyeIdx = lines.findIndex((l) => l.includes('cable_flye'));
      expect(lines[flyeIdx - 1]).toBe('');
      expect(flyeIdx).toBeGreaterThan(benchIdx);
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
      expect(result.warnings.some((w) => w.includes('unknown_id'))).toBe(true);
      // Should still parse the exercise
      expect(result.workout!.exercises.length).toBe(1);
    });

    it('skips unparseable lines with warning', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'not valid',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.warnings.some((w) => w.includes('Skipped'))).toBe(true);
      // No exercises found → error
      expect(result.errors).toContain('No exercises found in input');
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

    it('parses header without date', () => {
      const text = [
        '## Push Day',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout).not.toBeNull();
      expect(result.workout!.name).toBe('Push Day');
      expect(result.workout!.exercises.length).toBe(1);
    });

    it('resolves exercise by name when [id] is missing', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) | 4x8 | 155lb | Rest: 120s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises.length).toBe(1);
      expect(result.workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(result.workout!.exercises[0].sets).toBe(4);
    });

    it('resolves exercise by name without parenthetical', () => {
      const text = [
        '## Test',
        '---',
        'Barbell Bench Press | 4x8 | 155lb | Rest: 120s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
    });

    it('uses defaults for missing fields with [id] present', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press]',
      ].join('\n');

      const result = parseImport(text, graph, DEFAULT_SETTINGS);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises.length).toBe(1);
      expect(result.workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(result.workout!.exercises[0].sets).toBe(4); // defaultSetsCompound
      expect(result.workout!.exercises[0].reps).toBe(10); // hypertrophy goal default
      expect(result.workout!.exercises[0].restSeconds).toBe(120); // restTimerCompoundSeconds
    });

    it('resolves name-only lines with default sets/reps', () => {
      const text = [
        '## Test',
        '---',
        'Barbell Row',
      ].join('\n');

      const result = parseImport(text, graph, DEFAULT_SETTINGS);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises.length).toBe(1);
      expect(result.workout!.exercises[0].exerciseId).toBe('barbell_row');
      expect(result.workout!.exercises[0].sets).toBe(4); // compound
      expect(result.workout!.exercises[0].reps).toBe(10); // hypertrophy goal default
    });

    it('uses strength defaults when settings have strength goal', () => {
      const strengthSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        trainingGoal: 'strength',
        defaultSetsCompound: 5,
      };
      const text = [
        '## Strength Test',
        '---',
        'Barbell Row',
      ].join('\n');

      const result = parseImport(text, graph, strengthSettings);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].sets).toBe(5);
      expect(result.workout!.exercises[0].reps).toBe(5); // strength goal default
    });

    it('uses isolation defaults for name-only isolation exercises', () => {
      const text = [
        '## Test',
        '---',
        'Cable Flye',
      ].join('\n');

      const result = parseImport(text, graph, DEFAULT_SETTINGS);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].sets).toBe(3); // defaultSetsIsolation
      expect(result.workout!.exercises[0].restSeconds).toBe(60); // restTimerIsolationSeconds
    });

    it('skips unknown name-only exercises', () => {
      const text = [
        '## Test',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s',
        'Nonexistent Magic Exercise',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises.length).toBe(1);
      expect(result.warnings.some((w) => w.includes('Nonexistent Magic Exercise'))).toBe(true);
    });

    it('resolves by name when [id] is unknown', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [wrong_id] | 4x8 | 155lb | Rest: 120s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
    });
  });

  describe('superset export', () => {
    it('appends superset tag when supersetGroupId is present', () => {
      const workout = createTestWorkout();
      workout.exercises[0].supersetGroupId = 'ss1';
      workout.exercises[1].supersetGroupId = 'ss1';
      const text = formatExport(workout, graph, { includeTips: false });

      expect(text).toContain('[barbell_bench_press] | 4x8 | 155lb | Rest: 120s [superset:ss1]');
      expect(text).toContain('[cable_flye] | 3x12 |  | Rest: 60s [superset:ss1]');
    });

    it('does not append tag for standalone exercises', () => {
      const workout = createTestWorkout();
      const text = formatExport(workout, graph, { includeTips: false });

      expect(text).not.toContain('[superset:');
    });

    it('handles mixed standalone and grouped exercises', () => {
      const workout = createTestWorkout();
      workout.exercises[0].supersetGroupId = 'ss1';
      // exercise[1] is standalone
      const text = formatExport(workout, graph, { includeTips: false });

      const lines = text.split('\n').filter((l) => l.includes('['));
      const benchLine = lines.find((l) => l.includes('barbell_bench_press'))!;
      const flyeLine = lines.find((l) => l.includes('cable_flye'))!;
      expect(benchLine).toContain('[superset:ss1]');
      expect(flyeLine).not.toContain('[superset:');
    });
  });

  describe('superset import', () => {
    it('parses superset tags from exercise lines', () => {
      const text = [
        '## Upper | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s [superset:ss1]',
        'Barbell Row [barbell_row] | 4x8 | 135lb | Rest: 120s [superset:ss1]',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].supersetGroupId).toBe('ss1');
      expect(result.workout!.exercises[1].supersetGroupId).toBe('ss1');
    });

    it('leaves supersetGroupId undefined for lines without tag', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].supersetGroupId).toBeUndefined();
    });

    it('parses superset tag on partial lines (id only, no fields)', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] [superset:g1]',
      ].join('\n');

      const result = parseImport(text, graph, DEFAULT_SETTINGS);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].supersetGroupId).toBe('g1');
      expect(result.workout!.exercises[0].sets).toBe(4); // default compound
    });

    it('parses superset tag on name-with-fields lines (no id)', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) | 4x8 | 155lb | Rest: 120s [superset:g2]',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(result.workout!.exercises[0].supersetGroupId).toBe('g2');
    });

    it('handles mixed grouped and standalone exercises', () => {
      const text = [
        '## Test | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s [superset:ss1]',
        'Barbell Row [barbell_row] | 4x8 | 135lb | Rest: 120s [superset:ss1]',
        'Cable Flye (Mid-Height) [cable_flye] | 3x12 | | Rest: 60s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises[0].supersetGroupId).toBe('ss1');
      expect(result.workout!.exercises[1].supersetGroupId).toBe('ss1');
      expect(result.workout!.exercises[2].supersetGroupId).toBeUndefined();
    });

    it('backward compatible: old format without tags imports fine', () => {
      const text = [
        '## Push Day | 2026-03-04',
        '---',
        'Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s',
        '  tip: Eyes under bar.',
        'Cable Flye (Mid-Height) [cable_flye] | 3x12 | | Rest: 60s',
      ].join('\n');

      const result = parseImport(text, graph);
      expect(result.errors).toEqual([]);
      expect(result.workout!.exercises.length).toBe(2);
      expect(result.workout!.exercises[0].supersetGroupId).toBeUndefined();
      expect(result.workout!.exercises[1].supersetGroupId).toBeUndefined();
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

    it('export → import preserves superset groups', () => {
      const original = createTestWorkout();
      original.exercises[0].supersetGroupId = 'ss1';
      original.exercises[1].supersetGroupId = 'ss1';

      const exported = formatExport(original, graph);
      const imported = parseImport(exported, graph);

      expect(imported.errors).toEqual([]);
      expect(imported.workout!.exercises[0].supersetGroupId).toBe('ss1');
      expect(imported.workout!.exercises[1].supersetGroupId).toBe('ss1');
    });

    it('export → import preserves mixed standalone and grouped', () => {
      const original = createTestWorkout();
      original.exercises[0].supersetGroupId = 'g1';
      // exercises[1] remains standalone

      const exported = formatExport(original, graph);
      const imported = parseImport(exported, graph);

      expect(imported.errors).toEqual([]);
      expect(imported.workout!.exercises[0].supersetGroupId).toBe('g1');
      expect(imported.workout!.exercises[1].supersetGroupId).toBeUndefined();
    });
  });
});
