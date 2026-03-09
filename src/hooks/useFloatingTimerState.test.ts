import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFloatingTimerState } from './useFloatingTimerState';
import { useStore } from '@/store';

describe('useFloatingTimerState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store timer state
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
      },
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns idle state when timer has not started', () => {
    const { result } = renderHook(() => useFloatingTimerState());
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isDone).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.displaySeconds).toBe(0);
  });

  it('computes remaining time from wall-clock anchor when running', () => {
    const now = Date.now();
    // Start a 60s timer 10s ago
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: true,
          remainingSeconds: 50, // store may be stale
          totalSeconds: 60,
          restSeconds: 90,
          timerStartedAt: new Date(now - 10_000).toISOString(),
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());

    // Should compute from wall-clock: 60 - 10 = 50
    expect(result.current.isRunning).toBe(true);
    expect(result.current.displaySeconds).toBe(50);
    expect(result.current.totalSeconds).toBe(60);
    expect(result.current.progress).toBeCloseTo(50 / 60, 1);
  });

  it('detects paused state', () => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: false,
          remainingSeconds: 30,
          totalSeconds: 60,
          restSeconds: 90,
          timerStartedAt: null,
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());

    expect(result.current.isPaused).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.displaySeconds).toBe(30);
  });

  it('detects done state', () => {
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: false,
          remainingSeconds: 0,
          totalSeconds: 60,
          restSeconds: 90,
          timerStartedAt: null,
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());

    expect(result.current.isDone).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.displaySeconds).toBe(0);
  });

  it('detects expired timer via wall clock', () => {
    const now = Date.now();
    // Timer started 120s ago with totalSeconds=60 — should be expired
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: true,
          remainingSeconds: 60, // stale
          totalSeconds: 60,
          restSeconds: 90,
          timerStartedAt: new Date(now - 120_000).toISOString(),
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());

    expect(result.current.isDone).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.displaySeconds).toBe(0);
  });

  it('reacts instantly when timer is stopped via store', () => {
    const now = Date.now();
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: true,
          remainingSeconds: 30,
          totalSeconds: 60,
          restSeconds: 90,
          timerStartedAt: new Date(now).toISOString(),
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());
    expect(result.current.isRunning).toBe(true);

    // Stop the timer — should reflect immediately, not after 1s tick
    act(() => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null },
        },
      }));
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('reacts instantly when timer is paused via store', () => {
    const now = Date.now();
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: true,
          remainingSeconds: 45,
          totalSeconds: 60,
          restSeconds: 90,
          timerStartedAt: new Date(now).toISOString(),
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());
    expect(result.current.isRunning).toBe(true);

    // Pause the timer
    act(() => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            isRunning: false,
            remainingSeconds: 45,
            totalSeconds: 60,
            restSeconds: 90,
            timerStartedAt: null,
          },
        },
      }));
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.displaySeconds).toBe(45);
  });

  it('reflects adjustTimer (+15s) immediately', () => {
    const now = Date.now();
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: true,
          remainingSeconds: 30,
          totalSeconds: 60,
          restSeconds: 90,
          timerStartedAt: new Date(now).toISOString(),
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());
    const initialTotal = result.current.totalSeconds;

    // Adjust timer +15s (mimics adjustTimer action)
    act(() => {
      useStore.setState((state) => ({
        ...state,
        session: {
          ...state.session,
          timer: {
            ...state.session.timer,
            remainingSeconds: state.session.timer.remainingSeconds + 15,
            totalSeconds: state.session.timer.totalSeconds + 15,
          },
        },
      }));
    });

    expect(result.current.totalSeconds).toBe(initialTotal + 15);
  });

  it('ticks every second while running', () => {
    const now = Date.now();
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: {
          isRunning: true,
          remainingSeconds: 10,
          totalSeconds: 10,
          restSeconds: 90,
          timerStartedAt: new Date(now).toISOString(),
        },
      },
    }));

    const { result } = renderHook(() => useFloatingTimerState());
    const initial = result.current.displaySeconds;

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.displaySeconds).toBe(initial - 2);
  });
});
