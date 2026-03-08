import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store';

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
