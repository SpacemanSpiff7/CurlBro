import { useCallback, useSyncExternalStore } from 'react';
import { useStore } from '@/store';

interface FloatingTimerSnapshot {
  displaySeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isDone: boolean;
  isPaused: boolean;
  isIdle: boolean;
  progress: number; // 0–1, fraction remaining
}

const IDLE_SNAPSHOT: FloatingTimerSnapshot = {
  displaySeconds: 0,
  totalSeconds: 0,
  isRunning: false,
  isDone: false,
  isPaused: false,
  isIdle: true,
  progress: 0,
};

/**
 * Creates a store that ticks once per second, computing remaining time from
 * the wall-clock anchor (timerStartedAt) in the Zustand store.
 *
 * Read-only — never calls tickTimer(). Works even when ActiveWorkout is unmounted.
 */
function createFloatingTimerStore() {
  let snapshot: FloatingTimerSnapshot = IDLE_SNAPSHOT;
  const listeners = new Set<() => void>();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let visibilityHandler: (() => void) | null = null;

  function computeSnapshot(): FloatingTimerSnapshot {
    const timer = useStore.getState().session.timer;

    // Idle: never started or fully reset
    if (timer.totalSeconds <= 0) return IDLE_SNAPSHOT;

    // Running: compute from wall clock
    if (timer.isRunning && timer.timerStartedAt) {
      const startMs = new Date(timer.timerStartedAt).getTime();
      if (isNaN(startMs)) return IDLE_SNAPSHOT;
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const remaining = Math.max(0, timer.totalSeconds - elapsed);
      const done = remaining <= 0;
      return {
        displaySeconds: remaining,
        totalSeconds: timer.totalSeconds,
        isRunning: !done,
        isDone: done,
        isPaused: false,
        isIdle: false,
        progress: timer.totalSeconds > 0 ? remaining / timer.totalSeconds : 0,
      };
    }

    // Paused: remainingSeconds frozen, timerStartedAt is null
    if (!timer.isRunning && timer.remainingSeconds > 0) {
      return {
        displaySeconds: timer.remainingSeconds,
        totalSeconds: timer.totalSeconds,
        isRunning: false,
        isDone: false,
        isPaused: true,
        isIdle: false,
        progress: timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 0,
      };
    }

    // Done (GO!): not running, totalSeconds > 0, remainingSeconds <= 0
    if (!timer.isRunning && timer.totalSeconds > 0 && timer.remainingSeconds <= 0) {
      return {
        displaySeconds: 0,
        totalSeconds: timer.totalSeconds,
        isRunning: false,
        isDone: true,
        isPaused: false,
        isIdle: false,
        progress: 0,
      };
    }

    return IDLE_SNAPSHOT;
  }

  function notify() {
    const next = computeSnapshot();
    // Only notify if something changed
    if (
      next.displaySeconds !== snapshot.displaySeconds ||
      next.isRunning !== snapshot.isRunning ||
      next.isDone !== snapshot.isDone ||
      next.isPaused !== snapshot.isPaused ||
      next.isIdle !== snapshot.isIdle ||
      next.totalSeconds !== snapshot.totalSeconds
    ) {
      snapshot = next;
      listeners.forEach((cb) => cb());
    }
  }

  let storeUnsub: (() => void) | null = null;

  function start() {
    if (intervalId) return;
    // Initial computation
    snapshot = computeSnapshot();

    intervalId = setInterval(notify, 1000);

    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        notify();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // React to Zustand timer changes instantly (start/stop/pause/adjust)
    storeUnsub = useStore.subscribe((state, prevState) => {
      if (state.session.timer !== prevState.session.timer) {
        notify();
      }
    });
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    if (storeUnsub) {
      storeUnsub();
      storeUnsub = null;
    }
  }

  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      if (listeners.size === 1) start();
      return () => {
        listeners.delete(cb);
        if (listeners.size === 0) stop();
      };
    },
    getSnapshot() {
      return snapshot;
    },
  };
}

// Module-level singleton — one store for the floating timer
const floatingTimerStore = createFloatingTimerStore();

/**
 * Read-only timer projection hook for the floating rest timer indicator.
 * Computes remaining time from the wall-clock anchor (timerStartedAt),
 * independent of useRestTimer. Works even when ActiveWorkout is unmounted.
 */
export function useFloatingTimerState(): FloatingTimerSnapshot {
  const subscribe = useCallback(
    (cb: () => void) => floatingTimerStore.subscribe(cb),
    []
  );

  const getSnapshot = useCallback(() => floatingTimerStore.getSnapshot(), []);

  return useSyncExternalStore(subscribe, getSnapshot);
}
