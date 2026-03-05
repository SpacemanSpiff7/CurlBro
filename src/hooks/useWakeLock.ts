import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Manages the Screen Wake Lock API to prevent the device from sleeping.
 * Automatically re-acquires the lock when the page regains visibility.
 * Releases on unmount.
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // already released
      }
      wakeLockRef.current = null;
    }
    setIsActive(false);
  }, []);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
        setIsActive(false);
      });
    } catch {
      // Permission denied or not supported
      setIsActive(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (wakeLockRef.current) {
      await release();
    } else {
      await request();
    }
  }, [request, release]);

  // Re-acquire when page becomes visible again (OS releases lock on tab switch)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        request();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, request]);

  // Release on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  const isSupported = 'wakeLock' in navigator;

  return { isActive, isSupported, toggle };
}
