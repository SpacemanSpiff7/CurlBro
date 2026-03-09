import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSetTimer,
  startSetTimer,
  pauseSetTimer,
  resumeSetTimer,
  restartSetTimer,
  stopSetTimer,
} from './useSetTimer';

// Mock audio and haptics
vi.mock('@/utils/audio', () => ({
  playTimerDone: vi.fn(),
}));
vi.mock('@/utils/haptics', () => ({
  vibrateTimerDone: vi.fn(),
}));

describe('useSetTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopSetTimer(); // Reset to idle
  });

  afterEach(() => {
    stopSetTimer();
    vi.useRealTimers();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useSetTimer());
    expect(result.current.activeId).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.completed).toBe(false);
  });

  it('starts a timer with the correct state', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('1-0', 30);
    });

    expect(result.current.activeId).toBe('1-0');
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.remainingSeconds).toBe(30);
    expect(result.current.totalSeconds).toBe(30);
    expect(result.current.progress).toBe(0);
  });

  it('ticks down each second', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('1-0', 10);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remainingSeconds).toBe(9);
    expect(result.current.progress).toBeGreaterThan(0);
  });

  it('completes when reaching zero', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('2-1', 3, onComplete);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.completed).toBe(true);
    expect(result.current.progress).toBe(1);
    expect(result.current.remainingSeconds).toBe(0);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('plays audio and vibrates on completion', async () => {
    const { playTimerDone } = await import('@/utils/audio');
    const { vibrateTimerDone } = await import('@/utils/haptics');

    renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('0-0', 2);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(playTimerDone).toHaveBeenCalled();
    expect(vibrateTimerDone).toHaveBeenCalled();
  });

  it('clears completed flash after 600ms', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('0-0', 1);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.completed).toBe(true);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.completed).toBe(false);
    expect(result.current.activeId).toBeNull();
  });

  it('pauses the timer', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('1-0', 20);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      pauseSetTimer();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(true);
    expect(result.current.remainingSeconds).toBe(15);
    expect(result.current.activeId).toBe('1-0');
  });

  it('resumes after pause', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('1-0', 20);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      pauseSetTimer();
    });

    act(() => {
      resumeSetTimer();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);

    // Should continue counting down from where it paused
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSeconds).toBe(10);
  });

  it('restarts from the beginning', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('3-0', 30);
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    act(() => {
      pauseSetTimer();
    });

    act(() => {
      restartSetTimer();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.remainingSeconds).toBe(30);
    expect(result.current.totalSeconds).toBe(30);
    expect(result.current.progress).toBe(0);
    expect(result.current.activeId).toBe('3-0');
  });

  it('stops and resets to idle', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('1-0', 60);
    });

    act(() => {
      stopSetTimer();
    });

    expect(result.current.activeId).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it('starting a new timer stops the previous one', () => {
    const onComplete1 = vi.fn();
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('1-0', 30, onComplete1);
    });

    act(() => {
      startSetTimer('2-0', 20);
    });

    expect(result.current.activeId).toBe('2-0');
    expect(result.current.totalSeconds).toBe(20);

    // Old callback should not fire
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(onComplete1).not.toHaveBeenCalled();
  });

  it('pause is a no-op when not running', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      pauseSetTimer();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('resume is a no-op when not paused', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      startSetTimer('1-0', 10);
    });

    act(() => {
      resumeSetTimer(); // Already running, not paused
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('restart is a no-op when no active timer', () => {
    const { result } = renderHook(() => useSetTimer());

    act(() => {
      restartSetTimer();
    });

    expect(result.current.activeId).toBeNull();
  });
});
