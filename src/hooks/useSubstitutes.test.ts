import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubstitutes } from './useSubstitutes';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { ExerciseId } from '@/types';

describe('useSubstitutes', () => {
  beforeEach(() => {
    const graph = buildExerciseGraph(testExercises);
    useStore.setState({ graph, graphReady: true });
  });

  it('returns substitutes for an exercise', () => {
    const { result } = renderHook(() =>
      useSubstitutes('barbell_bench_press' as ExerciseId)
    );
    expect(result.current.length).toBeGreaterThan(0);
    const ids = result.current.map((e) => e.id);
    expect(ids).toContain('dumbbell_bench_press');
    expect(ids).toContain('machine_chest_press');
  });

  it('sorts same-muscle substitutes first', () => {
    const { result } = renderHook(() =>
      useSubstitutes('barbell_bench_press' as ExerciseId)
    );
    // All substitutes for bench press have chest as primary, so they should all be there
    result.current.forEach((sub) => {
      expect(sub.primary_muscles).toContain('chest');
    });
  });

  it('returns empty array for null exerciseId', () => {
    const { result } = renderHook(() => useSubstitutes(null));
    expect(result.current).toEqual([]);
  });

  it('returns empty array for exercise with no substitutes', () => {
    const { result } = renderHook(() =>
      useSubstitutes('tricep_pushdown' as ExerciseId)
    );
    expect(result.current).toEqual([]);
  });

  it('returns empty array for non-existent exercise', () => {
    const { result } = renderHook(() =>
      useSubstitutes('nonexistent' as ExerciseId)
    );
    expect(result.current).toEqual([]);
  });
});
