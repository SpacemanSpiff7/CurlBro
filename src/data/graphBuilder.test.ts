import { describe, it, expect } from 'vitest';
import { buildExerciseGraph } from './graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import { getAllExercises } from './exercises';
import type { ExerciseId } from '@/types';

describe('buildExerciseGraph', () => {
  describe('with fixture data', () => {
    const graph = buildExerciseGraph(testExercises);

    it('builds correct number of exercises', () => {
      expect(graph.exercises.size).toBe(10);
    });

    it('indexes exercises by ID', () => {
      const bench = graph.exercises.get('barbell_bench_press' as ExerciseId);
      expect(bench).toBeDefined();
      expect(bench!.name).toBe('Barbell Bench Press (Flat)');
    });

    it('builds substitutes map', () => {
      const benchSubs = graph.substitutes.get('barbell_bench_press' as ExerciseId);
      expect(benchSubs).toBeDefined();
      expect(benchSubs!.has('dumbbell_bench_press' as ExerciseId)).toBe(true);
      expect(benchSubs!.has('machine_chest_press' as ExerciseId)).toBe(true);
    });

    it('builds complements map', () => {
      const benchComps = graph.complements.get('barbell_bench_press' as ExerciseId);
      expect(benchComps).toBeDefined();
      expect(benchComps!.has('incline_dumbbell_press' as ExerciseId)).toBe(true);
      expect(benchComps!.has('cable_flye' as ExerciseId)).toBe(true);
      expect(benchComps!.has('tricep_pushdown' as ExerciseId)).toBe(true);
    });

    it('builds superset map', () => {
      const benchSS = graph.supersets.get('barbell_bench_press' as ExerciseId);
      expect(benchSS).toBeDefined();
      expect(benchSS!.has('barbell_row' as ExerciseId)).toBe(true);
    });

    it('indexes by muscle group', () => {
      const chestExercises = graph.byMuscle.get('chest');
      expect(chestExercises).toBeDefined();
      expect(chestExercises!.size).toBe(6); // bench, db bench, incline, cable flye, machine, chest_stretch
    });

    it('indexes by equipment', () => {
      const barbellExercises = graph.byEquipment.get('barbell');
      expect(barbellExercises).toBeDefined();
      expect(barbellExercises!.has('barbell_bench_press' as ExerciseId)).toBe(true);
      expect(barbellExercises!.has('barbell_row' as ExerciseId)).toBe(true);
    });

    it('indexes by movement pattern', () => {
      const horizontalPush = graph.byPattern.get('horizontal_push');
      expect(horizontalPush).toBeDefined();
      expect(horizontalPush!.size).toBe(3); // bench, db bench, machine
    });

    it('indexes by force type', () => {
      const pushExercises = graph.byForceType.get('push');
      const pullExercises = graph.byForceType.get('pull');
      expect(pushExercises).toBeDefined();
      expect(pullExercises).toBeDefined();
      expect(pushExercises!.size).toBe(6); // 5 chest + 1 tricep
      expect(pullExercises!.size).toBe(2); // row, db row
    });

    it('excludes edges to non-existent exercises', () => {
      // lat_pulldown is referenced but not in our fixture
      const rowComps = graph.complements.get('barbell_row' as ExerciseId);
      expect(rowComps).toBeDefined();
      expect(rowComps!.has('lat_pulldown' as ExerciseId)).toBe(false);
      expect(rowComps!.has('dumbbell_row' as ExerciseId)).toBe(true);
    });
  });

  describe('with full dataset', () => {
    const rawExercises = getAllExercises();
    const graph = buildExerciseGraph(rawExercises);

    it('builds all 345 exercises', () => {
      expect(graph.exercises.size).toBe(345);
    });

    it('has no broken substitute references', () => {
      let brokenRefs = 0;
      for (const [id, subs] of graph.substitutes) {
        for (const subId of subs) {
          if (!graph.exercises.has(subId)) {
            brokenRefs++;
            console.error(`Broken substitute: ${id} -> ${subId}`);
          }
        }
      }
      expect(brokenRefs).toBe(0);
    });

    it('has no broken complement references', () => {
      let brokenRefs = 0;
      for (const [id, comps] of graph.complements) {
        for (const compId of comps) {
          if (!graph.exercises.has(compId)) {
            brokenRefs++;
            console.error(`Broken complement: ${id} -> ${compId}`);
          }
        }
      }
      expect(brokenRefs).toBe(0);
    });

    it('has no broken superset references', () => {
      let brokenRefs = 0;
      for (const [id, supersets] of graph.supersets) {
        for (const ssId of supersets) {
          if (!graph.exercises.has(ssId)) {
            brokenRefs++;
            console.error(`Broken superset: ${id} -> ${ssId}`);
          }
        }
      }
      expect(brokenRefs).toBe(0);
    });

    it('has expected number of total edges', () => {
      let substituteEdges = 0;
      let complementEdges = 0;
      let supersetEdges = 0;

      for (const subs of graph.substitutes.values()) substituteEdges += subs.size;
      for (const comps of graph.complements.values()) complementEdges += comps.size;
      for (const ss of graph.supersets.values()) supersetEdges += ss.size;

      const totalEdges = substituteEdges + complementEdges + supersetEdges;
      expect(totalEdges).toBeGreaterThan(1000);
    });

    it('indexes all muscle groups', () => {
      expect(graph.byMuscle.size).toBeGreaterThanOrEqual(10);
    });

    it('indexes all force types', () => {
      expect(graph.byForceType.has('push')).toBe(true);
      expect(graph.byForceType.has('pull')).toBe(true);
      expect(graph.byForceType.has('isometric')).toBe(true);
    });
  });
});
