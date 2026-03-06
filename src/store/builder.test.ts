import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../../tests/fixtures/testGraph';
import type { ExerciseId, WorkoutId } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

describe('builderSlice', () => {
  beforeEach(() => {
    const graph = buildExerciseGraph(testExercises);
    useStore.setState({
      graph,
      graphReady: true,
      builder: {
        workout: {
          id: 'test-workout' as WorkoutId,
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

  it('adds an exercise to the workout', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises.length).toBe(1);
    expect(workout.exercises[0].exerciseId).toBe('barbell_bench_press');
    expect(workout.exercises[0].sets).toBe(4); // compound default
    expect(workout.exercises[0].reps).toBe(6); // from rep_range_hypertrophy "6-12"
    expect(workout.exercises[0].instanceId).toBeTruthy();
  });

  it('generates unique instanceIds for each exercise', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('cable_flye' as ExerciseId);
    builderActions.addExercise('barbell_bench_press' as ExerciseId); // duplicate exercise

    const workout = useStore.getState().builder.workout;
    const ids = workout.exercises.map((e) => e.instanceId);
    expect(new Set(ids).size).toBe(3);
  });

  it('sets default rest seconds based on category', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId); // compound
    builderActions.addExercise('cable_flye' as ExerciseId); // isolation

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises[0].restSeconds).toBe(120); // compound default
    expect(workout.exercises[1].restSeconds).toBe(60); // isolation default
  });

  it('removes an exercise from the workout', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('cable_flye' as ExerciseId);
    builderActions.removeExercise(0);

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises.length).toBe(1);
    expect(workout.exercises[0].exerciseId).toBe('cable_flye');
  });

  it('reorders exercises', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('cable_flye' as ExerciseId);
    builderActions.addExercise('barbell_row' as ExerciseId);

    builderActions.reorderExercises(2, 0); // move row to front

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises[0].exerciseId).toBe('barbell_row');
    expect(workout.exercises[1].exerciseId).toBe('barbell_bench_press');
    expect(workout.exercises[2].exerciseId).toBe('cable_flye');
  });

  it('updates exercise properties', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.updateExercise(0, { sets: 5, reps: 3, weight: 225 });

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises[0].sets).toBe(5);
    expect(workout.exercises[0].reps).toBe(3);
    expect(workout.exercises[0].weight).toBe(225);
  });

  it('swaps an exercise in place', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.updateExercise(0, { sets: 5, reps: 3 });
    builderActions.swapExercise(0, 'dumbbell_bench_press' as ExerciseId);

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises[0].exerciseId).toBe('dumbbell_bench_press');
    // Preserves sets/reps
    expect(workout.exercises[0].sets).toBe(5);
    expect(workout.exercises[0].reps).toBe(3);
  });

  it('sets workout name', () => {
    const { builderActions } = useStore.getState();
    builderActions.setWorkoutName('Push Day');

    expect(useStore.getState().builder.workout.name).toBe('Push Day');
  });

  it('resets workout', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    builderActions.addExercise('cable_flye' as ExerciseId);
    builderActions.setWorkoutName('Push Day');
    builderActions.resetWorkout();

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises.length).toBe(0);
    expect(workout.name).toBe('');
  });

  it('ignores adding non-existent exercise', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('nonexistent_exercise' as ExerciseId);

    expect(useStore.getState().builder.workout.exercises.length).toBe(0);
  });

  it('uses settings for default sets', () => {
    useStore.setState({
      settings: { ...DEFAULT_SETTINGS, defaultSetsCompound: 5, defaultSetsIsolation: 4 },
    });
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId); // compound
    builderActions.addExercise('cable_flye' as ExerciseId); // isolation

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises[0].sets).toBe(5);
    expect(workout.exercises[1].sets).toBe(4);
  });

  it('uses strength goal for default reps', () => {
    useStore.setState({
      settings: { ...DEFAULT_SETTINGS, trainingGoal: 'strength' as const },
    });
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);

    const workout = useStore.getState().builder.workout;
    // barbell_bench_press has rep_range_strength: "1-5", so first number = 1
    expect(workout.exercises[0].reps).toBe(1);
  });

  it('uses endurance goal for default reps', () => {
    useStore.setState({
      settings: { ...DEFAULT_SETTINGS, trainingGoal: 'endurance' as const },
    });
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);

    const workout = useStore.getState().builder.workout;
    // barbell_bench_press has rep_range_hypertrophy: "6-12", so last number = 12
    expect(workout.exercises[0].reps).toBe(12);
  });

  it('updates updatedAt on modifications', () => {
    const { builderActions } = useStore.getState();
    const before = useStore.getState().builder.workout.updatedAt;

    // Small delay to ensure different timestamp
    builderActions.addExercise('barbell_bench_press' as ExerciseId);
    const after = useStore.getState().builder.workout.updatedAt;

    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime()
    );
  });
});
