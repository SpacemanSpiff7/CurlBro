import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuggestions } from './useSuggestions';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { ExerciseId, WorkoutId } from '@/types';

describe('useSuggestions', () => {
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
        workoutSplit: null,
        suggestions: { pairsWellWith: [], stillNeedToHit: [], supersetWith: [] },
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

  it('returns empty suggestions for empty workout', () => {
    const { result } = renderHook(() => useSuggestions());
    expect(result.current.pairsWellWith).toEqual([]);
    expect(result.current.stillNeedToHit).toEqual([]);
    expect(result.current.supersetWith).toEqual([]);
  });

  it('returns complements after adding an exercise', () => {
    // Add bench press to workout
    useStore.getState().builderActions.addExercise(
      'barbell_bench_press' as ExerciseId
    );

    const { result } = renderHook(() => useSuggestions());

    // Should suggest complements (incline press, cable flye, tricep pushdown)
    expect(result.current.pairsWellWith.length).toBeGreaterThan(0);
  });

  it('excludes exercises already in workout from suggestions', () => {
    useStore.getState().builderActions.addExercise(
      'barbell_bench_press' as ExerciseId
    );
    useStore.getState().builderActions.addExercise(
      'incline_dumbbell_press' as ExerciseId
    );

    const { result } = renderHook(() => useSuggestions());

    // Neither bench press nor incline should appear in suggestions
    const allSuggested = [
      ...result.current.pairsWellWith,
      ...result.current.stillNeedToHit,
      ...result.current.supersetWith.map((s) => s.exerciseId),
    ];
    expect(allSuggested).not.toContain('barbell_bench_press');
    expect(allSuggested).not.toContain('incline_dumbbell_press');
  });

  it('identifies missing muscle groups', () => {
    // Add only push exercises
    useStore.getState().builderActions.addExercise(
      'barbell_bench_press' as ExerciseId
    );

    const { result } = renderHook(() => useSuggestions());

    // Should suggest exercises for missing muscles (back, legs, etc.)
    expect(result.current.stillNeedToHit.length).toBeGreaterThan(0);
  });

  it('returns superset candidates or gap exercises for antagonists', () => {
    // Add bench press — barbell_row is a superset candidate AND covers
    // the missing 'upper_back' muscle, so it may appear in either
    // supersetWith or stillNeedToHit due to dedup
    useStore.getState().builderActions.addExercise(
      'barbell_bench_press' as ExerciseId
    );

    const { result } = renderHook(() => useSuggestions());

    // barbell_row should appear somewhere in suggestions
    const allSuggested = [
      ...result.current.pairsWellWith,
      ...result.current.stillNeedToHit,
      ...result.current.supersetWith.map((s) => s.exerciseId),
    ];
    expect(allSuggested).toContain('barbell_row');
  });
});
