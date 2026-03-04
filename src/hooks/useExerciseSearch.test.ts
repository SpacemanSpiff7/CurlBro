import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExerciseSearch } from './useExerciseSearch';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { MuscleGroup } from '@/types';

describe('useExerciseSearch', () => {
  beforeEach(() => {
    // Initialize the store with our test graph
    const graph = buildExerciseGraph(testExercises);
    useStore.setState({ graph, graphReady: true });
  });

  it('returns all exercises for empty query', () => {
    const { result } = renderHook(() => useExerciseSearch(''));
    expect(result.current.length).toBe(8);
  });

  it('finds exercises by name', () => {
    const { result } = renderHook(() => useExerciseSearch('bench press'));
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].name).toContain('Bench Press');
  });

  it('handles fuzzy matching (typos)', () => {
    const { result } = renderHook(() => useExerciseSearch('bech pres'));
    expect(result.current.length).toBeGreaterThan(0);
    // Should still find bench press variants
    const hasPress = result.current.some((e) => e.name.includes('Press'));
    expect(hasPress).toBe(true);
  });

  it('finds exercises by muscle group', () => {
    const { result } = renderHook(() => useExerciseSearch('chest'));
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('filters by muscle group', () => {
    const { result } = renderHook(() =>
      useExerciseSearch('', { muscleFilter: ['upper_back' as MuscleGroup] })
    );
    // Should only return back exercises
    expect(result.current.length).toBe(2); // barbell_row, dumbbell_row
    result.current.forEach((exercise) => {
      expect(exercise.primary_muscles).toContain('upper_back');
    });
  });

  it('combines search query with muscle filter', () => {
    const { result } = renderHook(() =>
      useExerciseSearch('row', { muscleFilter: ['upper_back' as MuscleGroup] })
    );
    expect(result.current.length).toBeGreaterThan(0);
    result.current.forEach((exercise) => {
      expect(exercise.primary_muscles).toContain('upper_back');
    });
  });

  it('returns empty array for no matches', () => {
    const { result } = renderHook(() => useExerciseSearch('zzzzzzzzz'));
    expect(result.current.length).toBe(0);
  });

  it('respects limit option', () => {
    const { result } = renderHook(() =>
      useExerciseSearch('', { limit: 3 })
    );
    expect(result.current.length).toBe(3);
  });
});
