import { describe, it, expect } from 'vitest';
import { inferTrackingFlags } from './fieldDefaults';
import type { Exercise, ExerciseId } from '@/types';

function makeExercise(
  overrides: Partial<Exercise> & Pick<Exercise, 'category' | 'equipment'>,
): Exercise {
  return {
    id: 'test_exercise' as ExerciseId,
    name: 'Test Exercise',
    movement_pattern: 'test',
    force_type: 'push',
    primary_muscles: ['chest'],
    secondary_muscles: [],
    workout_position: 'mid',
    difficulty: 'intermediate',
    bilateral: true,
    rep_range_hypertrophy: '8-12',
    rep_range_strength: '3-5',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
    ...overrides,
  };
}

describe('inferTrackingFlags', () => {
  it('compound + barbell → weight + reps', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'compound', equipment: ['barbell'] }),
    );
    expect(flags).toEqual({
      trackWeight: true,
      trackReps: true,
      trackDuration: false,
      trackDistance: false,
    });
  });

  it('compound + dumbbell → weight + reps', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'compound', equipment: ['dumbbell'] }),
    );
    expect(flags.trackWeight).toBe(true);
    expect(flags.trackReps).toBe(true);
  });

  it('compound + bodyweight only → reps only', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'compound', equipment: ['bodyweight'] }),
    );
    expect(flags).toEqual({
      trackWeight: false,
      trackReps: true,
      trackDuration: false,
      trackDistance: false,
    });
  });

  it('compound + mixed equipment (bodyweight + dumbbell) → weight + reps', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'compound', equipment: ['bodyweight', 'dumbbell'] }),
    );
    expect(flags.trackWeight).toBe(true);
    expect(flags.trackReps).toBe(true);
  });

  it('isolation + cable_machine → weight + reps', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'isolation', equipment: ['cable_machine'] }),
    );
    expect(flags).toEqual({
      trackWeight: true,
      trackReps: true,
      trackDuration: false,
      trackDistance: false,
    });
  });

  it('isolation + bodyweight only → reps only', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'isolation', equipment: ['bodyweight'] }),
    );
    expect(flags.trackWeight).toBe(false);
    expect(flags.trackReps).toBe(true);
    expect(flags.trackDuration).toBe(false);
  });

  it('stretch_dynamic → duration only', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'stretch_dynamic', equipment: ['bodyweight'] }),
    );
    expect(flags).toEqual({
      trackWeight: false,
      trackReps: false,
      trackDuration: true,
      trackDistance: false,
    });
  });

  it('stretch_static → duration only', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'stretch_static', equipment: ['bodyweight'] }),
    );
    expect(flags).toEqual({
      trackWeight: false,
      trackReps: false,
      trackDuration: true,
      trackDistance: false,
    });
  });

  it('mobility → duration only', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'mobility', equipment: ['foam_roller'] }),
    );
    expect(flags).toEqual({
      trackWeight: false,
      trackReps: false,
      trackDuration: true,
      trackDistance: false,
    });
  });

  it('cardio → duration + distance', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'cardio', equipment: ['treadmill'] }),
    );
    expect(flags).toEqual({
      trackWeight: false,
      trackReps: false,
      trackDuration: true,
      trackDistance: true,
    });
  });

  it('cardio + jump_rope → duration + distance', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'cardio', equipment: ['jump_rope'] }),
    );
    expect(flags.trackDuration).toBe(true);
    expect(flags.trackDistance).toBe(true);
    expect(flags.trackWeight).toBe(false);
    expect(flags.trackReps).toBe(false);
  });

  it('compound + empty equipment → weight + reps (not bodyweight-only)', () => {
    const flags = inferTrackingFlags(
      makeExercise({ category: 'compound', equipment: [] }),
    );
    expect(flags.trackWeight).toBe(true);
    expect(flags.trackReps).toBe(true);
  });
});
