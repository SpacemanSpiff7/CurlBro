import { describe, it, expect } from 'vitest';
import {
  ExerciseSchema,
  SavedWorkoutSchema,
  WorkoutLogSchema,
  AppSettingsSchema,
} from './index';

describe('Zod schemas', () => {
  describe('ExerciseSchema', () => {
    it('validates a valid exercise', () => {
      const exercise = {
        id: 'barbell_bench_press',
        name: 'Barbell Bench Press (Flat)',
        category: 'compound',
        movement_pattern: 'horizontal_push',
        force_type: 'push',
        equipment: ['barbell', 'flat_bench'],
        primary_muscles: ['chest'],
        secondary_muscles: ['triceps', 'shoulders'],
        workout_position: 'early',
        difficulty: 'intermediate',
        bilateral: true,
        rep_range_hypertrophy: '6-12',
        rep_range_strength: '1-5',
        video_url: 'https://example.com/bench',
        beginner_tips: 'Eyes under bar.',
        substitutes: ['dumbbell_bench_press'],
        complements: ['incline_dumbbell_press'],
        superset_candidates: ['barbell_row'],
        notes: 'Most popular upper body exercise.',
      };

      const result = ExerciseSchema.safeParse(exercise);
      expect(result.success).toBe(true);
    });

    it('rejects invalid force_type', () => {
      const exercise = {
        id: 'test',
        name: 'Test',
        category: 'compound',
        movement_pattern: 'test',
        force_type: 'invalid',
        equipment: [],
        primary_muscles: [],
        secondary_muscles: [],
        workout_position: 'early',
        difficulty: 'beginner',
        bilateral: true,
        rep_range_hypertrophy: '8-12',
        rep_range_strength: '5-8',
        video_url: '',
        beginner_tips: '',
        substitutes: [],
        complements: [],
        superset_candidates: [],
        notes: '',
      };

      const result = ExerciseSchema.safeParse(exercise);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = ExerciseSchema.safeParse({ id: 'test' });
      expect(result.success).toBe(false);
    });
  });

  describe('SavedWorkoutSchema', () => {
    it('validates a valid saved workout', () => {
      const workout = {
        id: 'workout-1',
        name: 'Push Day',
        exercises: [
          {
            exerciseId: 'barbell_bench_press',
            sets: 4,
            reps: 8,
            weight: 155,
            restSeconds: 120,
            notes: '',
          },
        ],
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      };

      const result = SavedWorkoutSchema.safeParse(workout);
      expect(result.success).toBe(true);
    });

    it('rejects invalid sets', () => {
      const workout = {
        id: 'workout-1',
        name: 'Push Day',
        exercises: [
          {
            exerciseId: 'barbell_bench_press',
            sets: 0,
            reps: 8,
            weight: null,
            restSeconds: 120,
            notes: '',
          },
        ],
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      };

      const result = SavedWorkoutSchema.safeParse(workout);
      expect(result.success).toBe(false);
    });
  });

  describe('WorkoutLogSchema', () => {
    it('validates a valid log', () => {
      const log = {
        id: 'log-1',
        workoutId: 'workout-1',
        workoutName: 'Push Day',
        exercises: [
          {
            exerciseId: 'barbell_bench_press',
            sets: [
              { weight: 135, reps: 8, completed: true },
              { weight: 155, reps: 6, completed: true },
            ],
          },
        ],
        startedAt: '2026-03-04T10:00:00.000Z',
        completedAt: '2026-03-04T11:00:00.000Z',
        durationMinutes: 60,
      };

      const result = WorkoutLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });
  });

  describe('AppSettingsSchema', () => {
    it('validates valid settings', () => {
      const result = AppSettingsSchema.safeParse({
        restTimerCompoundSeconds: 120,
        restTimerIsolationSeconds: 60,
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative timer values', () => {
      const result = AppSettingsSchema.safeParse({
        restTimerCompoundSeconds: -10,
        restTimerIsolationSeconds: 60,
      });
      expect(result.success).toBe(false);
    });

    it('applies defaults for missing fields', () => {
      const result = AppSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.restTimerCompoundSeconds).toBe(120);
        expect(result.data.restTimerIsolationSeconds).toBe(60);
      }
    });
  });
});
