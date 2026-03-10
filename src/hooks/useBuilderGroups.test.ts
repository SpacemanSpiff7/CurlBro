import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBuilderGroups } from './useBuilderGroups';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { ExerciseId, WorkoutId } from '@/types';

describe('useBuilderGroups', () => {
  beforeEach(() => {
    const graph = buildExerciseGraph(testExercises);
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

  it('returns empty array for empty workout', () => {
    const { result } = renderHook(() => useBuilderGroups());
    expect(result.current).toEqual([]);
  });

  it('returns solo groups for standalone exercises', () => {
    useStore.getState().builderActions.addExercise('barbell_bench_press' as ExerciseId);
    useStore.getState().builderActions.addExercise('barbell_row' as ExerciseId);

    const { result } = renderHook(() => useBuilderGroups());
    expect(result.current).toHaveLength(2);
    expect(result.current[0].exercises).toHaveLength(1);
    expect(result.current[1].exercises).toHaveLength(1);
  });

  it('groups superset exercises together', () => {
    useStore.getState().builderActions.addExercise('barbell_bench_press' as ExerciseId);
    useStore.getState().builderActions.addExerciseToGroup('barbell_row' as ExerciseId, 0);

    const { result } = renderHook(() => useBuilderGroups());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].exercises).toHaveLength(2);
    expect(result.current[0].indices).toEqual([0, 1]);
  });

  it('tracks correct indices for mixed groups', () => {
    useStore.getState().builderActions.addExercise('barbell_bench_press' as ExerciseId);
    useStore.getState().builderActions.addExerciseToGroup('barbell_row' as ExerciseId, 0);
    useStore.getState().builderActions.addExercise('tricep_pushdown' as ExerciseId);

    const { result } = renderHook(() => useBuilderGroups());
    expect(result.current).toHaveLength(2);
    // First group: superset pair
    expect(result.current[0].exercises).toHaveLength(2);
    expect(result.current[0].indices).toEqual([0, 1]);
    // Second group: standalone
    expect(result.current[1].exercises).toHaveLength(1);
    expect(result.current[1].indices).toEqual([2]);
  });
});
