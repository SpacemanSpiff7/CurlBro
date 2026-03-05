import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { playTimerDone } from '@/utils/audio';
import { vibrateTimerDone } from '@/utils/haptics';

export function useRestTimer() {
  const timer = useStore((state) => state.session.timer);
  const { startTimer, stopTimer, pauseTimer, tickTimer, adjustTimer, adjustRestDuration } = useStore(
    (state) => state.sessionActions
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNotifiedRef = useRef(false);

  // Manage the interval
  useEffect(() => {
    if (timer.isRunning) {
      hasNotifiedRef.current = false;
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.isRunning, tickTimer]);

  // Notify when timer reaches zero
  useEffect(() => {
    if (!timer.isRunning && timer.totalSeconds > 0 && timer.remainingSeconds <= 0 && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      playTimerDone();
      vibrateTimerDone();
    }
  }, [timer.isRunning, timer.remainingSeconds, timer.totalSeconds]);

  const start = useCallback(
    (seconds: number) => {
      hasNotifiedRef.current = false;
      startTimer(seconds);
    },
    [startTimer]
  );

  const stop = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  const pause = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  const addTime = useCallback(
    (delta: number) => {
      adjustTimer(delta);
    },
    [adjustTimer]
  );

  const progress = timer.totalSeconds > 0
    ? timer.remainingSeconds / timer.totalSeconds
    : 0;

  const adjustRest = useCallback(
    (delta: number) => {
      adjustRestDuration(delta);
    },
    [adjustRestDuration]
  );

  return {
    isRunning: timer.isRunning,
    remainingSeconds: timer.remainingSeconds,
    totalSeconds: timer.totalSeconds,
    restSeconds: timer.restSeconds,
    progress,
    isDone: !timer.isRunning && timer.totalSeconds > 0 && timer.remainingSeconds <= 0,
    start,
    stop,
    pause,
    addTime,
    adjustRestDuration: adjustRest,
  };
}
