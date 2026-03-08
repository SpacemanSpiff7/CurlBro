import { useSyncExternalStore, useCallback, useMemo } from 'react';

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function computeElapsed(startedAt: string | null, completedAt?: string | null): string {
  if (!startedAt) return '00:00';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  return formatElapsed(Math.max(0, Math.floor((end - start) / 1000)));
}

/** Creates a timer store that ticks every second and returns the elapsed time string. */
function createTimerStore(startedAt: string | null, completedAt?: string | null) {
  let snapshot = computeElapsed(startedAt, completedAt);
  const listeners = new Set<() => void>();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Only tick if started and not yet completed
  const shouldTick = !!startedAt && !completedAt;

  let visibilityHandler: (() => void) | null = null;

  function start() {
    if (!shouldTick || intervalId) return;
    intervalId = setInterval(() => {
      snapshot = computeElapsed(startedAt, completedAt);
      listeners.forEach((cb) => cb());
    }, 1000);

    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        snapshot = computeElapsed(startedAt, completedAt);
        listeners.forEach((cb) => cb());
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
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

export function useElapsedTimer(startedAt: string | null, completedAt?: string | null): string {
  const store = useMemo(() => createTimerStore(startedAt, completedAt), [startedAt, completedAt]);

  const subscribe = useCallback(
    (cb: () => void) => store.subscribe(cb),
    [store]
  );

  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
