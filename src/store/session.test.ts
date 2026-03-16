import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store';
import type { SavedWorkout, WorkoutExercise, ExerciseId, WorkoutId } from '@/types';

describe('session timer actions', () => {
  beforeEach(() => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
      },
    }));
  });

  describe('adjustRestDuration', () => {
    it('adds 15 seconds to rest duration', () => {
      const { adjustRestDuration } = useStore.getState().sessionActions;
      adjustRestDuration(15);

      expect(useStore.getState().session.timer.restSeconds).toBe(105);
    });

    it('subtracts 15 seconds from rest duration', () => {
      const { adjustRestDuration } = useStore.getState().sessionActions;
      adjustRestDuration(-15);

      expect(useStore.getState().session.timer.restSeconds).toBe(75);
    });

    it('clamps rest duration to minimum 15 seconds', () => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: { ...state.session.timer, restSeconds: 20 },
        },
      }));

      const { adjustRestDuration } = useStore.getState().sessionActions;
      adjustRestDuration(-15);

      expect(useStore.getState().session.timer.restSeconds).toBe(15);
    });

    it('does not go below 15 seconds', () => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: { ...state.session.timer, restSeconds: 15 },
        },
      }));

      const { adjustRestDuration } = useStore.getState().sessionActions;
      adjustRestDuration(-15);

      expect(useStore.getState().session.timer.restSeconds).toBe(15);
    });
  });

  describe('setRestDuration', () => {
    it('sets rest duration directly', () => {
      const { setRestDuration } = useStore.getState().sessionActions;
      setRestDuration(120);

      expect(useStore.getState().session.timer.restSeconds).toBe(120);
    });

    it('clamps to minimum 15', () => {
      const { setRestDuration } = useStore.getState().sessionActions;
      setRestDuration(5);

      expect(useStore.getState().session.timer.restSeconds).toBe(15);
    });
  });

  describe('startTimer preserves restSeconds', () => {
    it('keeps existing restSeconds when starting timer', () => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: { ...state.session.timer, restSeconds: 120 },
        },
      }));

      const { startTimer } = useStore.getState().sessionActions;
      startTimer(60);

      const { timer } = useStore.getState().session;
      expect(timer.isRunning).toBe(true);
      expect(timer.remainingSeconds).toBe(60);
      expect(timer.totalSeconds).toBe(60);
      expect(timer.restSeconds).toBe(120);
    });
  });

  describe('syncTimer', () => {
    it('corrects remaining time based on wall clock', () => {
      // Set up a running timer that started 30s ago with 90s total
      const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            isRunning: true,
            remainingSeconds: 90, // stale — hasn't been ticked
            totalSeconds: 90,
            restSeconds: 90,
            timerStartedAt: thirtySecondsAgo,
          },
        },
      }));

      const { syncTimer } = useStore.getState().sessionActions;
      syncTimer();

      const timer = useStore.getState().session.timer;
      expect(timer.remainingSeconds).toBe(60);
      expect(timer.isRunning).toBe(true);
      // timerStartedAt should NOT be reset
      expect(timer.timerStartedAt).toBe(thirtySecondsAgo);
    });

    it('stops timer when expired during background', () => {
      const twoMinutesAgo = new Date(Date.now() - 120_000).toISOString();
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            isRunning: true,
            remainingSeconds: 90,
            totalSeconds: 90,
            restSeconds: 90,
            timerStartedAt: twoMinutesAgo,
          },
        },
      }));

      const { syncTimer } = useStore.getState().sessionActions;
      syncTimer();

      const timer = useStore.getState().session.timer;
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingSeconds).toBe(0);
      expect(timer.timerStartedAt).toBeNull();
    });

    it('no-ops when timer is paused', () => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            isRunning: false,
            remainingSeconds: 45,
            totalSeconds: 90,
            restSeconds: 90,
            timerStartedAt: null,
          },
        },
      }));

      const { syncTimer } = useStore.getState().sessionActions;
      syncTimer();

      const timer = useStore.getState().session.timer;
      expect(timer.remainingSeconds).toBe(45);
    });

    it('no-ops when no timer started', () => {
      const { syncTimer } = useStore.getState().sessionActions;
      syncTimer();

      const timer = useStore.getState().session.timer;
      expect(timer.remainingSeconds).toBe(0);
      expect(timer.isRunning).toBe(false);
    });
  });

  describe('adjustTimer wall-clock invariant', () => {
    it('increases totalSeconds by the same delta', () => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            isRunning: true,
            remainingSeconds: 60,
            totalSeconds: 90,
            restSeconds: 90,
            timerStartedAt: new Date().toISOString(),
          },
        },
      }));

      const { adjustTimer } = useStore.getState().sessionActions;
      adjustTimer(15);

      const timer = useStore.getState().session.timer;
      expect(timer.remainingSeconds).toBe(75);
      expect(timer.totalSeconds).toBe(105);
    });

    it('decreases totalSeconds with negative delta', () => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            isRunning: true,
            remainingSeconds: 60,
            totalSeconds: 90,
            restSeconds: 90,
            timerStartedAt: new Date().toISOString(),
          },
        },
      }));

      const { adjustTimer } = useStore.getState().sessionActions;
      adjustTimer(-15);

      const timer = useStore.getState().session.timer;
      expect(timer.remainingSeconds).toBe(45);
      expect(timer.totalSeconds).toBe(75);
    });

    it('ensures totalSeconds >= remainingSeconds when delta is large negative', () => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            isRunning: true,
            remainingSeconds: 10,
            totalSeconds: 20,
            restSeconds: 90,
            timerStartedAt: new Date().toISOString(),
          },
        },
      }));

      const { adjustTimer } = useStore.getState().sessionActions;
      adjustTimer(-30);

      const timer = useStore.getState().session.timer;
      expect(timer.remainingSeconds).toBe(0);
      // totalSeconds = max(0, 20 + (-30)) = max(0, -10) = 0
      expect(timer.totalSeconds).toBe(0);
    });
  });
});

// ─── Helper ──────────────────────────────────────────────
function makeWorkoutExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    exerciseId: 'bench_press' as ExerciseId,
    instanceId: crypto.randomUUID(),
    sets: 3,
    reps: 10,
    weight: null,
    restSeconds: 90,
    notes: '',
    trackWeight: true,
    trackReps: true,
    trackDuration: false,
    trackDistance: false,
    ...overrides,
  };
}

function makeSavedWorkout(exercises: WorkoutExercise[]): SavedWorkout {
  return {
    id: crypto.randomUUID() as WorkoutId,
    name: 'Test Workout',
    exercises,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── startSession pre-populates SetLog fields ────────────
describe('startSession pre-populates SetLog fields from WorkoutExercise', () => {
  beforeEach(() => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        active: null,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
      },
    }));
  });

  it('initializes sets with reps from the exercise', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ reps: 10, sets: 2 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const exercise = useStore.getState().session.active!.exercises[0];
    const sets = exercise.sets;
    expect(sets).toHaveLength(2);
    expect(sets[0].reps).toBe(10);
    expect(sets[1].reps).toBe(10);
    expect(exercise.restSeconds).toBe(90);
  });

  it('initializes sets with durationSeconds from the exercise', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ durationSeconds: 30, sets: 2 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets[0].durationSeconds).toBe(30);
    expect(sets[1].durationSeconds).toBe(30);
  });

  it('initializes sets with weight from the exercise', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ weight: 135, sets: 2 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets[0].weight).toBe(135);
    expect(sets[1].weight).toBe(135);
  });

  it('initializes all tracked fields together', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ reps: 10, durationSeconds: 30, weight: 135, sets: 3 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets).toHaveLength(3);
    for (const set of sets) {
      expect(set.reps).toBe(10);
      expect(set.durationSeconds).toBe(30);
      expect(set.weight).toBe(135);
      expect(set.completed).toBe(false);
    }
  });

  it('sets reps to null when exercise has no reps defined', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ reps: undefined as unknown as number, sets: 1 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets[0].reps).toBeNull();
  });

  it('sets durationSeconds to null when exercise has no durationSeconds', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ durationSeconds: undefined, sets: 1 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets[0].durationSeconds).toBeNull();
  });

  it('sets weight to null when exercise has null weight', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ weight: null, sets: 1 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets[0].weight).toBeNull();
  });
});

// ─── startSession initializes rest timer from current group ─
describe('startSession initializes rest timer from current group', () => {
  beforeEach(() => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        active: null,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
      },
    }));
  });

  it('sets restSeconds from first exercise restSeconds', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ restSeconds: 120 }),
      makeWorkoutExercise({ restSeconds: 60 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    expect(useStore.getState().session.timer.restSeconds).toBe(120);
  });

  it('uses the max restSeconds for the first superset group', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ restSeconds: 60, supersetGroupId: 'ss1' }),
      makeWorkoutExercise({ restSeconds: 90, supersetGroupId: 'ss1' }),
      makeWorkoutExercise({ restSeconds: 45 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    expect(useStore.getState().session.timer.restSeconds).toBe(90);
  });

  it('defaults restSeconds to 90 when first exercise has no restSeconds', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ restSeconds: undefined as unknown as number }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    expect(useStore.getState().session.timer.restSeconds).toBe(90);
  });

  it('defaults restSeconds to 90 for an empty workout', () => {
    const workout = makeSavedWorkout([]);

    useStore.getState().sessionActions.startSession(workout);

    expect(useStore.getState().session.timer.restSeconds).toBe(90);
  });

  it('resets timer running state on startSession', () => {
    // Simulate a timer that was running from a previous session
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: { isRunning: true, remainingSeconds: 45, totalSeconds: 90, restSeconds: 60, timerStartedAt: new Date().toISOString() },
      },
    }));

    const workout = makeSavedWorkout([
      makeWorkoutExercise({ restSeconds: 120 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    const timer = useStore.getState().session.timer;
    expect(timer.isRunning).toBe(false);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.totalSeconds).toBe(0);
    expect(timer.restSeconds).toBe(120);
    expect(timer.timerStartedAt).toBeNull();
  });
});

describe('group navigation resets timer to the group default', () => {
  beforeEach(() => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        active: null,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
      },
    }));
  });

  it('stops a running timer and switches to the destination group restSeconds', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ restSeconds: 120 }),
      makeWorkoutExercise({ restSeconds: 60 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.startTimer(75);
    useStore.getState().sessionActions.goToGroup(1);

    const timer = useStore.getState().session.timer;
    expect(useStore.getState().session.active!.currentGroupIndex).toBe(1);
    expect(timer.isRunning).toBe(false);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.totalSeconds).toBe(0);
    expect(timer.restSeconds).toBe(60);
  });
});

describe('stopTimer restores the current group restSeconds', () => {
  beforeEach(() => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        active: null,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
      },
    }));
  });

  it('clears a temporary override and restores the planned rest', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ restSeconds: 120 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);
    useStore.getState().sessionActions.setRestDuration(150);
    useStore.getState().sessionActions.stopTimer();

    const timer = useStore.getState().session.timer;
    expect(timer.isRunning).toBe(false);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.totalSeconds).toBe(0);
    expect(timer.restSeconds).toBe(120);
  });
});

// ─── addSet inherits values from last existing set ───────
describe('addSet inherits values from the last existing set', () => {
  beforeEach(() => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        active: null,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
      },
    }));
  });

  it('copies weight, reps, durationSeconds, distanceMeters from last set', () => {
    // Start a session to get an active session, then manually set the set values
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ weight: 135, reps: 10, sets: 1 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    // Complete the first set with specific values
    useStore.getState().sessionActions.completeSet(0, 0, {
      weight: 185,
      reps: 8,
      completed: true,
      durationSeconds: 45,
      distanceMeters: 100,
    });

    useStore.getState().sessionActions.addSet(0);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets).toHaveLength(2);

    const newSet = sets[1];
    expect(newSet.weight).toBe(185);
    expect(newSet.reps).toBe(8);
    expect(newSet.durationSeconds).toBe(45);
    expect(newSet.distanceMeters).toBe(100);
    expect(newSet.completed).toBe(false);
  });

  it('inherits from the last set when multiple sets exist', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ weight: 100, reps: 12, sets: 2 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    // Update the second set (last set) with different values
    useStore.getState().sessionActions.completeSet(0, 1, {
      weight: 120,
      reps: 10,
      completed: true,
      durationSeconds: 60,
      distanceMeters: null,
    });

    useStore.getState().sessionActions.addSet(0);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets).toHaveLength(3);

    const newSet = sets[2];
    expect(newSet.weight).toBe(120);
    expect(newSet.reps).toBe(10);
    expect(newSet.durationSeconds).toBe(60);
    expect(newSet.distanceMeters).toBeNull();
    expect(newSet.completed).toBe(false);
  });

  it('inherits null values from last set when fields are null', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ weight: null, sets: 1 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    useStore.getState().sessionActions.addSet(0);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets).toHaveLength(2);

    const newSet = sets[1];
    expect(newSet.weight).toBeNull();
    expect(newSet.distanceMeters).toBeNull();
    expect(newSet.completed).toBe(false);
  });

  it('new set is always not completed', () => {
    const workout = makeSavedWorkout([
      makeWorkoutExercise({ weight: 135, reps: 10, sets: 1 }),
    ]);

    useStore.getState().sessionActions.startSession(workout);

    // Complete the first set
    useStore.getState().sessionActions.completeSet(0, 0, {
      weight: 135,
      reps: 10,
      completed: true,
      durationSeconds: null,
      distanceMeters: null,
    });

    useStore.getState().sessionActions.addSet(0);

    const sets = useStore.getState().session.active!.exercises[0].sets;
    expect(sets[0].completed).toBe(true);
    expect(sets[1].completed).toBe(false);
  });
});
