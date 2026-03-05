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

function computeElapsed(startedAt: string | null): string {
  if (!startedAt) return '00:00';
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  return formatElapsed(Math.max(0, Math.floor((now - start) / 1000)));
}

/** Creates a timer store that ticks every second and returns the elapsed time string. */
function createTimerStore(startedAt: string | null) {
  let snapshot = computeElapsed(startedAt);
  const listeners = new Set<() => void>();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function start() {
    if (!startedAt || intervalId) return;
    intervalId = setInterval(() => {
      snapshot = computeElapsed(startedAt);
      listeners.forEach((cb) => cb());
    }, 1000);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
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

export function useElapsedTimer(startedAt: string | null): string {
  const store = useMemo(() => createTimerStore(startedAt), [startedAt]);

  const subscribe = useCallback(
    (cb: () => void) => store.subscribe(cb),
    [store]
  );

  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
