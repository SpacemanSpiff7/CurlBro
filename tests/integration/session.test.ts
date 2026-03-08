import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { testExercises } from '../fixtures/testGraph';
import type { SavedWorkout, WorkoutId, ExerciseId, LogId } from '@/types';

describe('Session Flow', () => {
  beforeEach(() => {
    const graph = buildExerciseGraph(testExercises);
    useStore.setState({
      graph,
      library: { workouts: [], logs: [], activities: [], soreness: [] },
      session: {
        active: null,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
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
    expect(session!.currentGroupIndex).toBe(0);
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

    expect(useStore.getState().session.active!.currentGroupIndex).toBe(0);

    useStore.getState().sessionActions.goToGroup(1);

    expect(useStore.getState().session.active!.currentGroupIndex).toBe(1);
  });

  it('swaps exercise mid-session', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    useStore.getState().sessionActions.swapExercise(0, 'dumbbell_bench_press' as ExerciseId);

    expect(useStore.getState().session.active!.exercises[0].exerciseId).toBe('dumbbell_bench_press');
  });

  it('starts in preview mode (startedAt null)', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    const session = useStore.getState().session.active!;
    expect(session.startedAt).toBeNull();
    expect(session.completedAt).toBeNull();
  });

  it('beginSession sets startedAt', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();

    const session = useStore.getState().session.active!;
    expect(session.startedAt).not.toBeNull();
    expect(session.completedAt).toBeNull();
  });

  it('endSession does not set completedAt in preview mode', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);

    // endSession without beginSession — startedAt is null
    useStore.getState().sessionActions.endSession();

    const session = useStore.getState().session.active!;
    expect(session.completedAt).toBeNull();
  });

  it('endSession sets completedAt and stops timer', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();

    // Start a timer so we can verify it stops
    useStore.getState().sessionActions.startTimer(60);
    expect(useStore.getState().session.timer.isRunning).toBe(true);

    useStore.getState().sessionActions.endSession();

    const session = useStore.getState().session.active!;
    expect(session.completedAt).not.toBeNull();
    expect(useStore.getState().session.timer.isRunning).toBe(false);
    expect(useStore.getState().session.timer.remainingSeconds).toBe(0);
  });

  it('saveSession creates a workout log', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();

    useStore.getState().sessionActions.completeSet(0, 0, {
      weight: 155, reps: 8, completed: true,
    });
    useStore.getState().sessionActions.completeSet(0, 1, {
      weight: 155, reps: 7, completed: true,
    });
    useStore.getState().sessionActions.completeSet(1, 0, {
      weight: 30, reps: 12, completed: true,
    });

    useStore.getState().sessionActions.endSession();
    const log = useStore.getState().sessionActions.saveSession();

    expect(log).not.toBeNull();
    expect(log!.workoutId).toBe('test-workout');
    expect(log!.workoutName).toBe('Push Day');
    expect(log!.exercises.length).toBe(2);
    expect(log!.exercises[0].sets[0].completed).toBe(true);
    expect(log!.exercises[0].sets[2].completed).toBe(false);
    expect(log!.durationMinutes).toBeGreaterThanOrEqual(0);

    // Log should be in the library
    expect(useStore.getState().library.logs.length).toBe(1);
    expect(useStore.getState().library.logs[0].id).toBe(log!.id);
  });

  it('saveSession returns null before endSession', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();

    const log = useStore.getState().sessionActions.saveSession();
    expect(log).toBeNull();
    expect(useStore.getState().library.logs.length).toBe(0);
  });

  it('saveSession prevents duplicate saves', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();
    useStore.getState().sessionActions.endSession();

    const log1 = useStore.getState().sessionActions.saveSession();
    const log2 = useStore.getState().sessionActions.saveSession();

    expect(log1).not.toBeNull();
    expect(log2).toBeNull();
    expect(useStore.getState().library.logs.length).toBe(1);
  });

  it('addExerciseToSession appends exercise with empty set', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();

    expect(useStore.getState().session.active!.exercises.length).toBe(2);

    useStore.getState().sessionActions.addExerciseToSession('tricep_pushdown' as ExerciseId);

    const session = useStore.getState().session.active!;
    expect(session.exercises.length).toBe(3);
    expect(session.exercises[2].exerciseId).toBe('tricep_pushdown');
    expect(session.exercises[2].sets.length).toBe(1);
    expect(session.exercises[2].sets[0]).toEqual({
      weight: null, reps: null, completed: false,
    });
    expect(session.currentGroupIndex).toBe(2);
  });

  it('addExerciseToSession is no-op when session is completed', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();
    useStore.getState().sessionActions.endSession();

    useStore.getState().sessionActions.addExerciseToSession('tricep_pushdown' as ExerciseId);

    const session = useStore.getState().session.active!;
    expect(session.exercises.length).toBe(2);
  });

  it('deleteLog removes a log from library', () => {
    const workout = createTestWorkout();
    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.beginSession();
    useStore.getState().sessionActions.endSession();

    const log = useStore.getState().sessionActions.saveSession();
    expect(useStore.getState().library.logs.length).toBe(1);

    useStore.getState().libraryActions.deleteLog(log!.id as LogId);
    expect(useStore.getState().library.logs.length).toBe(0);
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
