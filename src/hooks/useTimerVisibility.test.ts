import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setInlineTimerVisible,
  getInlineTimerVisible,
  subscribeInlineTimerVisible,
  registerScrollToTimer,
  triggerScrollToTimer,
} from './useTimerVisibility';

describe('useTimerVisibility', () => {
  beforeEach(() => {
    // Reset to default state
    setInlineTimerVisible(false);
    registerScrollToTimer(null);
  });

  describe('inline timer visibility', () => {
    it('starts as not visible', () => {
      // After reset in beforeEach, calling again with false is a no-op
      expect(getInlineTimerVisible()).toBe(false);
    });

    it('updates visibility and notifies listeners', () => {
      const listener = vi.fn();
      const unsub = subscribeInlineTimerVisible(listener);

      setInlineTimerVisible(true);
      expect(getInlineTimerVisible()).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);

      setInlineTimerVisible(false);
      expect(getInlineTimerVisible()).toBe(false);
      expect(listener).toHaveBeenCalledTimes(2);

      unsub();
    });

    it('skips notification when value unchanged', () => {
      const listener = vi.fn();
      const unsub = subscribeInlineTimerVisible(listener);

      setInlineTimerVisible(false); // already false
      expect(listener).not.toHaveBeenCalled();

      setInlineTimerVisible(true);
      setInlineTimerVisible(true); // same value
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
    });

    it('unsubscribes cleanly', () => {
      const listener = vi.fn();
      const unsub = subscribeInlineTimerVisible(listener);
      unsub();

      setInlineTimerVisible(true);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('scroll-to-timer action', () => {
    it('triggers registered scroll function', () => {
      const scrollFn = vi.fn();
      registerScrollToTimer(scrollFn);

      triggerScrollToTimer();
      expect(scrollFn).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no function registered', () => {
      // Should not throw
      triggerScrollToTimer();
    });

    it('clears registration with null', () => {
      const scrollFn = vi.fn();
      registerScrollToTimer(scrollFn);
      registerScrollToTimer(null);

      triggerScrollToTimer();
      expect(scrollFn).not.toHaveBeenCalled();
    });
  });
});
