import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hasSeenWelcome, markWelcomeSeen, resetWelcomeSeen } from './welcomeState';

describe('welcomeState', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('hasSeenWelcome', () => {
    it('returns false when nothing is stored', () => {
      expect(hasSeenWelcome()).toBe(false);
    });

    it('returns true when flag is set', () => {
      sessionStorage.setItem('curlbro_welcome_dismissed', '1');
      expect(hasSeenWelcome()).toBe(true);
    });

    it('returns false for unexpected values', () => {
      sessionStorage.setItem('curlbro_welcome_dismissed', 'true');
      expect(hasSeenWelcome()).toBe(false);
    });
  });

  describe('markWelcomeSeen', () => {
    it('sets the sessionStorage flag', () => {
      markWelcomeSeen();
      expect(sessionStorage.getItem('curlbro_welcome_dismissed')).toBe('1');
    });
  });

  describe('resetWelcomeSeen', () => {
    it('removes the sessionStorage flag', () => {
      sessionStorage.setItem('curlbro_welcome_dismissed', '1');
      resetWelcomeSeen();
      expect(sessionStorage.getItem('curlbro_welcome_dismissed')).toBeNull();
    });

    it('dispatches curlbro_welcome_reset event', () => {
      const handler = vi.fn();
      window.addEventListener('curlbro_welcome_reset', handler);
      resetWelcomeSeen();
      expect(handler).toHaveBeenCalledOnce();
      window.removeEventListener('curlbro_welcome_reset', handler);
    });
  });
});
