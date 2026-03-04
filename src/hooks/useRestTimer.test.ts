import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRestTimer } from './useRestTimer';
import { useStore } from '@/store';

// Mock audio and haptics
vi.mock('@/utils/audio', () => ({
  playTimerDone: vi.fn(),
}));
vi.mock('@/utils/haptics', () => ({
  vibrateTimerDone: vi.fn(),
}));

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store timer state
    useStore.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      },
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no timer running', () => {
    const { result } = renderHook(() => useRestTimer());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.isDone).toBe(false);
  });

  it('starts a timer', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.totalSeconds).toBe(60);
    expect(result.current.progress).toBe(1);
  });

  it('ticks down each second', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(5);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remainingSeconds).toBe(4);
    expect(result.current.progress).toBeCloseTo(0.8);
  });

  it('stops when reaching zero', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(3);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isDone).toBe(true);
  });

  it('can be manually stopped', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isDone).toBe(false);
  });

  it('adds time', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(30);
    });

    act(() => {
      result.current.addTime(15);
    });

    expect(result.current.remainingSeconds).toBe(45);
  });

  it('subtracts time (clamped to 0)', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      result.current.addTime(-15);
    });

    expect(result.current.remainingSeconds).toBe(0);
  });

  it('notifies on completion', async () => {
    const { playTimerDone } = await import('@/utils/audio');
    const { vibrateTimerDone } = await import('@/utils/haptics');

    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(2);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(playTimerDone).toHaveBeenCalled();
    expect(vibrateTimerDone).toHaveBeenCalled();
  });
});
