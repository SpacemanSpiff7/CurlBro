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
});
