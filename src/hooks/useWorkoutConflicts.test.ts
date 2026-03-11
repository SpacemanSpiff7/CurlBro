import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkoutConflicts } from './useWorkoutConflicts';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { getAllExercises } from '@/data/exercises';
import type { ExerciseId, ExerciseGraph, WorkoutId } from '@/types';

let realGraph: ExerciseGraph;

beforeAll(async () => {
  realGraph = buildExerciseGraph(await getAllExercises());
});

describe('useWorkoutConflicts', () => {
  beforeEach(() => {
    const graph = realGraph;
    useStore.setState({
      graph,
      graphReady: true,
      builder: {
        workout: {
          id: 'test' as WorkoutId,
          name: '',
          exercises: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isDirty: false,
        workoutSplit: null,
        suggestions: { pairsWellWith: [], stillNeedToHit: [] },
        validation: {
          pushCount: 0,
          pullCount: 0,
          isometricCount: 0,
          isBalanced: true,
          coveredMuscles: [],
          missingMuscles: [],
        },
      },
    });
  });

  it('returns no conflicts for empty workout', () => {
    const { result } = renderHook(() => useWorkoutConflicts());
    expect(result.current).toEqual([]);
  });

  it('returns no conflicts for single exercise', () => {
    useStore.getState().builderActions.addExercise('barbell_bench_press' as ExerciseId);
    const { result } = renderHook(() => useWorkoutConflicts());
    expect(result.current).toEqual([]);
  });

  it('detects ID-based conflict (deadlift + squat)', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('conventional_deadlift' as ExerciseId);
    builderActions.addExercise('barbell_back_squat' as ExerciseId);

    const { result } = renderHook(() => useWorkoutConflicts());
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].conflict.severity).toBe('caution');
  });

  it('detects bench press + overhead press conflict', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('overhead_press' as ExerciseId);

    const { result } = renderHook(() => useWorkoutConflicts());
    expect(result.current.length).toBeGreaterThan(0);
    const benchOhpConflict = result.current.find(
      (c) =>
        c.conflict.exercises.includes('barbell_bench_press') &&
        c.conflict.exercises.includes('overhead_press')
    );
    expect(benchOhpConflict).toBeDefined();
  });

  it('returns no conflict for non-conflicting exercises', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('barbell_curl' as ExerciseId);

    const { result } = renderHook(() => useWorkoutConflicts());
    expect(result.current).toEqual([]);
  });

  it('sorts caution before warning', () => {
    const { builderActions } = useStore.getState();
    // Warning: barbell_back_squat + barbell_row
    builderActions.addExercise('barbell_back_squat' as ExerciseId);
    builderActions.addExercise('barbell_row' as ExerciseId);
    // Caution: conventional_deadlift + barbell_back_squat
    builderActions.addExercise('conventional_deadlift' as ExerciseId);

    const { result } = renderHook(() => useWorkoutConflicts());
    expect(result.current.length).toBeGreaterThanOrEqual(2);
    // First should be caution
    expect(result.current[0].conflict.severity).toBe('caution');
  });
});
