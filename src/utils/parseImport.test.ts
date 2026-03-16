import { describe, it, expect } from 'vitest';
import { parseImport } from './parseImport';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import { DEFAULT_SETTINGS } from '@/types';

const graph = buildExerciseGraph(testExercises);

describe('parseImport', () => {
  // ─── Backward Compatibility (old format) ──────────────
  describe('old format backward compat', () => {
    it('parses old 4-field format: Name [id] | 3x10 | 155lb | Rest: 60s', () => {
      const text = `## Push Day | 2026-03-04
---
Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s`;
      const { workout, errors } = parseImport(text, graph);
      expect(errors).toHaveLength(0);
      expect(workout!.exercises).toHaveLength(1);
      const ex = workout!.exercises[0];
      expect(ex.exerciseId).toBe('barbell_bench_press');
      expect(ex.sets).toBe(4);
      expect(ex.reps).toBe(8);
      expect(ex.weight).toBe(155);
      expect(ex.restSeconds).toBe(120);
      expect(ex.trackWeight).toBe(true);
      expect(ex.trackReps).toBe(true);
      expect(ex.trackDuration).toBe(false);
      expect(ex.trackDistance).toBe(false);
    });

    it('parses old format with empty weight: Name [id] | 3x12 | | Rest: 60s', () => {
      const text = `## Test
---
Cable Flye (Mid-Height) [cable_flye] | 3x12 | | Rest: 60s`;
      const { workout, errors } = parseImport(text, graph);
      expect(errors).toHaveLength(0);
      const ex = workout!.exercises[0];
      expect(ex.sets).toBe(3);
      expect(ex.reps).toBe(12);
      expect(ex.weight).toBeNull();
      expect(ex.restSeconds).toBe(60);
      expect(ex.trackWeight).toBe(true);
      expect(ex.trackReps).toBe(true);
    });

    it('parses old format with bare number weight', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [barbell_bench_press] | 3x10 | 135 | Rest: 90s`;
      const { workout } = parseImport(text, graph);
      expect(workout!.exercises[0].weight).toBe(135);
    });
  });

  // ─── New Format: Weight+Reps ──────────────────────────
  describe('new format weight+reps', () => {
    it('parses without empty weight field: Name [id] | 3x10 | Rest: 60s', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [barbell_bench_press] | 3x10 | Rest: 60s`;
      const { workout, errors } = parseImport(text, graph);
      expect(errors).toHaveLength(0);
      const ex = workout!.exercises[0];
      expect(ex.sets).toBe(3);
      expect(ex.reps).toBe(10);
      expect(ex.weight).toBeNull();
      expect(ex.trackReps).toBe(true);
      expect(ex.trackWeight).toBe(true);
    });

    it('parses with kg unit', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 70kg | Rest: 120s`;
      const { workout } = parseImport(text, graph);
      expect(workout!.exercises[0].weight).toBe(70);
      expect(workout!.exercises[0].trackWeight).toBe(true);
    });
  });

  // ─── New Format: Duration ─────────────────────────────
  describe('duration format', () => {
    it('parses 3x30s (sets × seconds)', () => {
      const text = `## Test
---
Doorway Chest Stretch [chest_stretch] | 3x30s | Rest: 60s`;
      const { workout, errors } = parseImport(text, graph);
      expect(errors).toHaveLength(0);
      const ex = workout!.exercises[0];
      expect(ex.sets).toBe(3);
      expect(ex.durationSeconds).toBe(30);
      expect(ex.trackDuration).toBe(true);
      expect(ex.trackReps).toBe(false);
      expect(ex.trackWeight).toBe(false);
    });

    it('parses 3x1:30 (sets × M:SS)', () => {
      const text = `## Test
---
Doorway Chest Stretch [chest_stretch] | 3x1:30 | Rest: 60s`;
      const { workout } = parseImport(text, graph);
      const ex = workout!.exercises[0];
      expect(ex.sets).toBe(3);
      expect(ex.durationSeconds).toBe(90);
      expect(ex.trackDuration).toBe(true);
    });

    it('parses 1x5:00 (single set, 5 minutes)', () => {
      const text = `## Test
---
Doorway Chest Stretch [chest_stretch] | 1x5:00 | Rest: 0s`;
      const { workout } = parseImport(text, graph);
      const ex = workout!.exercises[0];
      expect(ex.sets).toBe(1);
      expect(ex.durationSeconds).toBe(300);
      expect(ex.trackDuration).toBe(true);
    });

    it('parses standalone duration 5:00 (no set count)', () => {
      const text = `## Test
---
Doorway Chest Stretch [chest_stretch] | 5:00 | Rest: 0s`;
      const { workout } = parseImport(text, graph);
      const ex = workout!.exercises[0];
      expect(ex.durationSeconds).toBe(300);
      expect(ex.trackDuration).toBe(true);
      // Sets default from settings when not specified
      expect(ex.sets).toBe(DEFAULT_SETTINGS.defaultSetsCompound);
    });

    it('parses standalone duration 30s', () => {
      const text = `## Test
---
Doorway Chest Stretch [chest_stretch] | 30s | Rest: 0s`;
      const { workout } = parseImport(text, graph);
      expect(workout!.exercises[0].durationSeconds).toBe(30);
      expect(workout!.exercises[0].trackDuration).toBe(true);
    });
  });

  // ─── New Format: Distance ─────────────────────────────
  describe('distance format', () => {
    it('parses distance in miles: 0.5mi', () => {
      const text = `## Test
---
Doorway Chest Stretch [chest_stretch] | 5:00 | 0.5mi | Rest: 0s`;
      const { workout } = parseImport(text, graph);
      const ex = workout!.exercises[0];
      expect(ex.trackDistance).toBe(true);
      expect(ex.trackDuration).toBe(true);
      expect(ex.durationSeconds).toBe(300);
    });

    it('parses distance in km: 0.8km', () => {
      const text = `## Test
---
Doorway Chest Stretch [chest_stretch] | 5:00 | 0.8km | Rest: 0s`;
      const { workout } = parseImport(text, graph);
      expect(workout!.exercises[0].trackDistance).toBe(true);
    });
  });

  // ─── Header Parsing ───────────────────────────────────
  describe('header parsing', () => {
    it('parses header with date', () => {
      const text = `## Push Day | 2026-03-04
---
Barbell Bench Press (Flat) [barbell_bench_press] | 3x10 | Rest: 60s`;
      const { workout } = parseImport(text, graph);
      expect(workout!.name).toBe('Push Day');
      expect(workout!.createdAt).toContain('2026-03-04');
    });

    it('parses header without date', () => {
      const text = `## Push Day
---
Barbell Bench Press (Flat) [barbell_bench_press] | 3x10 | Rest: 60s`;
      const { workout } = parseImport(text, graph);
      expect(workout!.name).toBe('Push Day');
    });

    it('handles missing header', () => {
      const text = `Barbell Bench Press (Flat) [barbell_bench_press] | 3x10 | 135lb | Rest: 60s`;
      const { workout, warnings } = parseImport(text, graph);
      expect(workout!.name).toBe('Imported Workout');
      expect(warnings.some((w) => w.includes('No header found'))).toBe(true);
    });
  });

  // ─── Name Resolution ──────────────────────────────────
  describe('name resolution', () => {
    it('resolves by name when [id] is unknown', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [unknown_id] | 3x10 | Rest: 60s`;
      const { workout, warnings } = parseImport(text, graph);
      expect(workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(warnings.some((w) => w.includes('Resolved'))).toBe(true);
    });

    it('resolves name-only lines (no [id])', () => {
      const text = `## Test
---
Barbell Bench Press (Flat)`;
      const { workout, warnings } = parseImport(text, graph);
      expect(workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(warnings.some((w) => w.includes('Resolved') && w.includes('default'))).toBe(true);
    });

    it('resolves name-with-fields lines (no [id])', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) | 4x8 | 155lb | Rest: 120s`;
      const { workout, warnings } = parseImport(text, graph);
      expect(workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(workout!.exercises[0].sets).toBe(4);
      expect(workout!.exercises[0].weight).toBe(155);
      expect(warnings.some((w) => w.includes('Resolved'))).toBe(true);
    });
  });

  // ─── Superset Tags ────────────────────────────────────
  describe('superset tags', () => {
    it('extracts superset group ID', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [barbell_bench_press] | 3x8 | 135lb | Rest: 90s [superset:grp1]
Barbell Row [barbell_row] | 3x8 | 135lb | Rest: 90s [superset:grp1]`;
      const { workout } = parseImport(text, graph);
      expect(workout!.exercises[0].supersetGroupId).toBe('grp1');
      expect(workout!.exercises[1].supersetGroupId).toBe('grp1');
    });
  });

  // ─── Edge Cases ───────────────────────────────────────
  describe('edge cases', () => {
    it('returns error for empty input', () => {
      const { workout, errors } = parseImport('', graph);
      expect(workout).toBeNull();
      expect(errors).toHaveLength(1);
    });

    it('returns error when no exercises found', () => {
      const text = `## Just a Header
---`;
      const { workout, errors } = parseImport(text, graph);
      expect(workout).toBeNull();
      expect(errors.some((e) => e.includes('No exercises'))).toBe(true);
    });

    it('skips tip lines', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [barbell_bench_press] | 3x10 | 135lb | Rest: 60s
  tip: Eyes under bar.`;
      const { workout } = parseImport(text, graph);
      expect(workout!.exercises).toHaveLength(1);
    });

    it('skips unparseable lines with warning', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [barbell_bench_press] | 3x10 | Rest: 60s
some random text
Cable Flye (Mid-Height) [cable_flye] | 3x12 | Rest: 60s`;
      const { workout, warnings } = parseImport(text, graph);
      expect(workout!.exercises).toHaveLength(2);
      expect(warnings.some((w) => w.includes('Skipped unparseable'))).toBe(true);
    });

    it('uses default settings when exercise has no fields', () => {
      const text = `## Test
---
Barbell Bench Press (Flat) [barbell_bench_press]`;
      const { workout } = parseImport(text, graph);
      const ex = workout!.exercises[0];
      expect(ex.sets).toBe(DEFAULT_SETTINGS.defaultSetsCompound);
      expect(ex.reps).toBe(DEFAULT_SETTINGS.defaultRepsCompound);
      expect(ex.restSeconds).toBe(DEFAULT_SETTINGS.defaultRestSeconds);
    });
  });

  // ─── Round-trip ───────────────────────────────────────
  describe('round-trip', () => {
    it('round-trips through formatExport → parseImport for weight+reps', async () => {
      const { formatExport } = await import('./formatExport');
      const original = {
        id: 'w-1' as import('@/types').WorkoutId,
        name: 'Push Day',
        exercises: [
          {
            exerciseId: 'barbell_bench_press' as import('@/types').ExerciseId,
            sets: 4,
            reps: 8,
            weight: 155,
            restSeconds: 120,
            notes: '',
            trackWeight: true,
            trackReps: true,
            trackDuration: false,
            trackDistance: false,
          },
        ],
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      };
      const exported = formatExport(original, graph, { includeTips: false });
      const { workout } = parseImport(exported, graph);
      expect(workout!.exercises[0].exerciseId).toBe('barbell_bench_press');
      expect(workout!.exercises[0].sets).toBe(4);
      expect(workout!.exercises[0].reps).toBe(8);
      expect(workout!.exercises[0].weight).toBe(155);
      expect(workout!.exercises[0].restSeconds).toBe(120);
      expect(workout!.exercises[0].trackWeight).toBe(true);
      expect(workout!.exercises[0].trackReps).toBe(true);
    });

    it('round-trips through formatExport → parseImport for duration exercises', async () => {
      const { formatExport } = await import('./formatExport');
      const original = {
        id: 'w-1' as import('@/types').WorkoutId,
        name: 'Stretch',
        exercises: [
          {
            exerciseId: 'chest_stretch' as import('@/types').ExerciseId,
            sets: 3,
            reps: 1,
            weight: null,
            restSeconds: 30,
            notes: '',
            trackWeight: false,
            trackReps: false,
            trackDuration: true,
            trackDistance: false,
            durationSeconds: 30,
          },
        ],
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      };
      const exported = formatExport(original, graph, { includeTips: false });
      const { workout } = parseImport(exported, graph);
      expect(workout!.exercises[0].exerciseId).toBe('chest_stretch');
      expect(workout!.exercises[0].sets).toBe(3);
      expect(workout!.exercises[0].durationSeconds).toBe(30);
      expect(workout!.exercises[0].trackDuration).toBe(true);
      expect(workout!.exercises[0].trackReps).toBe(false);
      expect(workout!.exercises[0].trackWeight).toBe(false);
    });
  });
});
