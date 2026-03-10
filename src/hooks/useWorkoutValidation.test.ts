import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkoutValidation } from './useWorkoutValidation';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { ExerciseId, WorkoutId } from '@/types';

describe('useWorkoutValidation', () => {
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

  it('returns balanced for empty workout', () => {
    const { result } = renderHook(() => useWorkoutValidation());
    expect(result.current.isBalanced).toBe(true);
    expect(result.current.pushCount).toBe(0);
    expect(result.current.pullCount).toBe(0);
  });

  it('counts push and pull exercises', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('cable_flye' as ExerciseId);
    builderActions.addExercise('barbell_row' as ExerciseId);

    const { result } = renderHook(() => useWorkoutValidation());
    expect(result.current.pushCount).toBe(2);
    expect(result.current.pullCount).toBe(1);
  });

  it('detects unbalanced workout (all push)', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('incline_dumbbell_press' as ExerciseId);
    builderActions.addExercise('cable_flye' as ExerciseId);
    builderActions.addExercise('machine_chest_press' as ExerciseId);

    const { result } = renderHook(() => useWorkoutValidation());
    expect(result.current.isBalanced).toBe(false);
  });

  it('detects balanced workout (mix of push and pull)', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('barbell_row' as ExerciseId);

    const { result } = renderHook(() => useWorkoutValidation());
    expect(result.current.isBalanced).toBe(true);
  });

  it('lists covered muscles', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('barbell_row' as ExerciseId);

    const { result } = renderHook(() => useWorkoutValidation());
    expect(result.current.coveredMuscles).toContain('chest');
    expect(result.current.coveredMuscles).toContain('upper_back');
  });

  it('lists missing major muscles', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);

    const { result } = renderHook(() => useWorkoutValidation());
    expect(result.current.missingMuscles).toContain('upper_back');
    expect(result.current.missingMuscles).toContain('quadriceps');
    expect(result.current.missingMuscles).toContain('hamstrings');
  });
});
