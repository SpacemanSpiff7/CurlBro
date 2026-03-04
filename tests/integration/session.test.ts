import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../fixtures/testGraph';
import type { SavedWorkout, WorkoutId, ExerciseId } from '@/types';

describe('Session Flow', () => {
  beforeEach(() => {
    const graph = buildExerciseGraph(testExercises);
    useStore.setState({
      graph,
      library: { workouts: [], logs: [] },
      session: {
        active: null,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      },
    });
  });

  function createTestWorkout(): SavedWorkout {
    return {
      id: 'test-workout' as WorkoutId,
      name: 'Push Day',
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 155,
          restSeconds: 120,
          notes: '',
        },
        {
          exerciseId: 'cable_flye' as ExerciseId,
          sets: 2,
          reps: 12,
          weight: null,
          restSeconds: 60,
          notes: '',
        },
      ],
      createdAt: '2026-03-04T00:00:00.000Z',
      updatedAt: '2026-03-04T00:00:00.000Z',
    };
  }

  it('starts a session from a workout', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    const session = useStore.getState().session.active;
    expect(session).not.toBeNull();
    expect(session!.workoutId).toBe('test-workout');
    expect(session!.workoutName).toBe('Push Day');
    expect(session!.exercises.length).toBe(2);
    expect(session!.exercises[0].sets.length).toBe(3);
    expect(session!.exercises[1].sets.length).toBe(2);
    expect(session!.currentExerciseIndex).toBe(0);
  });

  it('initializes sets with workout weight', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    const session = useStore.getState().session.active!;
    // First exercise has weight 155
    expect(session.exercises[0].sets[0].weight).toBe(155);
    expect(session.exercises[0].sets[0].completed).toBe(false);
    // Second exercise has null weight
    expect(session.exercises[1].sets[0].weight).toBeNull();
  });

  it('completes a set', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    useStore.getState().sessionActions.completeSet(0, 0, {
      weight: 160,
      reps: 8,
      completed: true,
    });

    const session = useStore.getState().session.active!;
    expect(session.exercises[0].sets[0].weight).toBe(160);
    expect(session.exercises[0].sets[0].reps).toBe(8);
    expect(session.exercises[0].sets[0].completed).toBe(true);
  });

  it('adds a set to an exercise', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    expect(useStore.getState().session.active!.exercises[0].sets.length).toBe(3);

    useStore.getState().sessionActions.addSet(0);

    expect(useStore.getState().session.active!.exercises[0].sets.length).toBe(4);
    expect(useStore.getState().session.active!.exercises[0].sets[3].completed).toBe(false);
  });

  it('navigates between exercises', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    expect(useStore.getState().session.active!.currentExerciseIndex).toBe(0);

    useStore.getState().sessionActions.goToExercise(1);

    expect(useStore.getState().session.active!.currentExerciseIndex).toBe(1);
  });

  it('swaps exercise mid-session', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    useStore.getState().sessionActions.swapExercise(0, 'dumbbell_bench_press' as ExerciseId);

    expect(useStore.getState().session.active!.exercises[0].exerciseId).toBe('dumbbell_bench_press');
  });

  it('ends session and produces a log', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    // Complete some sets
    useStore.getState().sessionActions.completeSet(0, 0, {
      weight: 155, reps: 8, completed: true,
    });
    useStore.getState().sessionActions.completeSet(0, 1, {
      weight: 155, reps: 7, completed: true,
    });

    const log = useStore.getState().sessionActions.endSession();

    expect(log).not.toBeNull();
    expect(log!.workoutId).toBe('test-workout');
    expect(log!.workoutName).toBe('Push Day');
    expect(log!.exercises.length).toBe(2);
    expect(log!.exercises[0].sets[0].completed).toBe(true);
    expect(log!.exercises[0].sets[2].completed).toBe(false);
    expect(log!.durationMinutes).toBeGreaterThanOrEqual(0);

    // Session should be cleared
    expect(useStore.getState().session.active).toBeNull();
  });

  it('manages rest timer', () => {
    const { startTimer, tickTimer, stopTimer, adjustTimer } =
      useStore.getState().sessionActions;

    startTimer(60);
    expect(useStore.getState().session.timer.isRunning).toBe(true);
    expect(useStore.getState().session.timer.remainingSeconds).toBe(60);

    tickTimer();
    expect(useStore.getState().session.timer.remainingSeconds).toBe(59);

    adjustTimer(15);
    expect(useStore.getState().session.timer.remainingSeconds).toBe(74);

    adjustTimer(-20);
    expect(useStore.getState().session.timer.remainingSeconds).toBe(54);

    stopTimer();
    expect(useStore.getState().session.timer.isRunning).toBe(false);
    expect(useStore.getState().session.timer.remainingSeconds).toBe(0);
  });

  it('timer stops at zero', () => {
    const { startTimer, tickTimer } = useStore.getState().sessionActions;

    startTimer(2);

    tickTimer();
    expect(useStore.getState().session.timer.remainingSeconds).toBe(1);
    expect(useStore.getState().session.timer.isRunning).toBe(true);

    tickTimer();
    expect(useStore.getState().session.timer.remainingSeconds).toBe(0);
    expect(useStore.getState().session.timer.isRunning).toBe(false);
  });

  it('switches to active tab when session starts', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    expect(useStore.getState().activeTab).toBe('active');
  });
});
