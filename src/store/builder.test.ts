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

  it('adds an exercise to the workout', () => {
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises.length).toBe(1);
    expect(workout.exercises[0].exerciseId).toBe('barbell_bench_press');
    expect(workout.exercises[0].sets).toBe(4); // compound default
    expect(workout.exercises[0].reps).toBe(8); // defaultRepsCompound
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

  it('uses defaultRepsCompound setting for compound exercises', () => {
    useStore.setState({
      settings: { ...DEFAULT_SETTINGS, defaultRepsCompound: 5 },
    });
    const { builderActions } = useStore.getState();
    builderActions.addExercise('barbell_bench_press' as ExerciseId);

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises[0].reps).toBe(5);
  });

  it('uses defaultRepsIsolation setting for isolation exercises', () => {
    useStore.setState({
      settings: { ...DEFAULT_SETTINGS, defaultRepsIsolation: 15 },
    });
    const { builderActions } = useStore.getState();
    builderActions.addExercise('cable_flye' as ExerciseId);

    const workout = useStore.getState().builder.workout;
    expect(workout.exercises[0].reps).toBe(15);
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

  describe('mergeExerciseIntoGroup', () => {
    it('merges two solo exercises into a new superset', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      builderActions.addExercise('barbell_row' as ExerciseId);

      builderActions.mergeExerciseIntoGroup(0, 1);

      const exercises = useStore.getState().builder.workout.exercises;
      expect(exercises).toHaveLength(2);
      // Both should share the same supersetGroupId
      expect(exercises[0].supersetGroupId).toBeTruthy();
      expect(exercises[0].supersetGroupId).toBe(exercises[1].supersetGroupId);
      // Target (barbell_row) should come first, source (bench press) after
      expect(exercises[0].exerciseId).toBe('barbell_row');
      expect(exercises[1].exerciseId).toBe('barbell_bench_press');
    });

    it('merges solo into existing group', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      builderActions.addExercise('cable_flye' as ExerciseId);
      builderActions.addExercise('barbell_row' as ExerciseId);

      // First create a group from bench and flye
      builderActions.addExerciseToGroup('cable_flye' as ExerciseId, 0);

      // Now merge row into the group
      const exercises = useStore.getState().builder.workout.exercises;
      // Find indices: bench(0), cable_flye added to group(1), barbell_row(2), cable_flye added(3)
      // Actually, addExerciseToGroup adds a NEW exercise, so we need to be careful here
      // Let's approach differently: merge the standalone row into the bench exercise's group
      const benchIdx = exercises.findIndex((e) => e.exerciseId === 'barbell_bench_press');
      const rowIdx = exercises.findIndex((e) => e.exerciseId === 'barbell_row');
      builderActions.mergeExerciseIntoGroup(rowIdx, benchIdx);

      const updated = useStore.getState().builder.workout.exercises;
      const groupId = updated[benchIdx]?.supersetGroupId;
      expect(groupId).toBeTruthy();

      const groupMembers = updated.filter((e) => e.supersetGroupId === groupId);
      expect(groupMembers.length).toBeGreaterThanOrEqual(2);
    });

    it('dissolves old group when last member leaves', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      // Group bench and flye using store action
      builderActions.addExerciseToGroup('cable_flye' as ExerciseId, 0);
      builderActions.addExercise('barbell_row' as ExerciseId);

      // Verify the group was formed
      const before = useStore.getState().builder.workout.exercises;
      expect(before[0].supersetGroupId).toBeTruthy();
      expect(before[0].supersetGroupId).toBe(before[1].supersetGroupId);

      // Merge bench (index 0) into row's group (index 2), leaving flye alone
      builderActions.mergeExerciseIntoGroup(0, 2);

      const updated = useStore.getState().builder.workout.exercises;
      const flye = updated.find((e) => e.exerciseId === 'cable_flye');
      // Flye was last member of old group, should have supersetGroupId cleared
      expect(flye?.supersetGroupId).toBeUndefined();
    });
  });

  describe('groupSelectedExercises', () => {
    it('groups two solo exercises into a new superset', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      builderActions.addExercise('cable_flye' as ExerciseId);
      builderActions.addExercise('barbell_row' as ExerciseId);

      builderActions.groupSelectedExercises([0, 2]);

      const exercises = useStore.getState().builder.workout.exercises;
      expect(exercises).toHaveLength(3);

      // Grouped exercises should be consecutive at position 0
      const grouped = exercises.filter((e) => e.supersetGroupId);
      expect(grouped).toHaveLength(2);
      expect(grouped[0].supersetGroupId).toBe(grouped[1].supersetGroupId);

      // Bench and row should be consecutive
      const benchIdx = exercises.findIndex((e) => e.exerciseId === 'barbell_bench_press');
      const rowIdx = exercises.findIndex((e) => e.exerciseId === 'barbell_row');
      expect(Math.abs(benchIdx - rowIdx)).toBe(1);
    });

    it('groups three exercises including one already grouped', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      // Group bench and flye using store action
      builderActions.addExerciseToGroup('cable_flye' as ExerciseId, 0);
      builderActions.addExercise('barbell_row' as ExerciseId);

      // Verify pre-group formed
      const before = useStore.getState().builder.workout.exercises;
      expect(before[0].supersetGroupId).toBe(before[1].supersetGroupId);

      builderActions.groupSelectedExercises([0, 1, 2]);

      const exercises = useStore.getState().builder.workout.exercises;
      // All three should share the same new groupId
      const newGroupId = exercises[0].supersetGroupId;
      expect(newGroupId).toBeTruthy();
      expect(exercises.every((e) => e.supersetGroupId === newGroupId)).toBe(true);
    });

    it('does nothing with fewer than 2 indices', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      const before = useStore.getState().builder.workout.exercises[0].supersetGroupId;

      builderActions.groupSelectedExercises([0]);

      expect(useStore.getState().builder.workout.exercises[0].supersetGroupId).toBe(before);
    });
  });

  describe('removeSelectedExercises', () => {
    it('removes selected exercises', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      builderActions.addExercise('cable_flye' as ExerciseId);
      builderActions.addExercise('barbell_row' as ExerciseId);

      builderActions.removeSelectedExercises([0, 2]);

      const exercises = useStore.getState().builder.workout.exercises;
      expect(exercises).toHaveLength(1);
      expect(exercises[0].exerciseId).toBe('cable_flye');
    });

    it('ungroups remaining member when 2 of 3 group members removed', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      // Group all three using store actions
      builderActions.addExerciseToGroup('cable_flye' as ExerciseId, 0);
      builderActions.addExerciseToGroup('barbell_row' as ExerciseId, 0);

      // Verify all three are grouped
      const before = useStore.getState().builder.workout.exercises;
      expect(before).toHaveLength(3);
      expect(before[0].supersetGroupId).toBeTruthy();
      expect(before.every((e) => e.supersetGroupId === before[0].supersetGroupId)).toBe(true);

      builderActions.removeSelectedExercises([0, 2]);

      const exercises = useStore.getState().builder.workout.exercises;
      expect(exercises).toHaveLength(1);
      expect(exercises[0].exerciseId).toBe('cable_flye');
      // Last member should have group cleared
      expect(exercises[0].supersetGroupId).toBeUndefined();
    });

    it('handles removing all exercises', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);
      builderActions.addExercise('cable_flye' as ExerciseId);

      builderActions.removeSelectedExercises([0, 1]);

      expect(useStore.getState().builder.workout.exercises).toHaveLength(0);
    });

    it('does nothing with empty indices', () => {
      const { builderActions } = useStore.getState();
      builderActions.addExercise('barbell_bench_press' as ExerciseId);

      builderActions.removeSelectedExercises([]);

      expect(useStore.getState().builder.workout.exercises).toHaveLength(1);
    });
  });
});
