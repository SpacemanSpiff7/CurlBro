import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdSlot } from './useAdSlot';

// ADSENSE_ENABLED is false, so all tests verify house ad fallback behavior

describe('useAdSlot', () => {
  it('shows house ad when ADSENSE_ENABLED is false', () => {
    const { result } = renderHook(() => useAdSlot('build'));
    expect(result.current.showHouseAd).toBe(true);
    expect(result.current.adsenseActive).toBe(false);
  });

  it('returns the correct config for a slot key', () => {
    const { result } = renderHook(() => useAdSlot('rest_timer'));
    expect(result.current.config.rotateHouseAds).toBe(true);
    expect(result.current.config.rotateIntervalMs).toBe(30_000);
    expect(result.current.config.format).toBe('horizontal');
  });

  it('returns config with expected house ad categories', () => {
    const { result } = renderHook(() => useAdSlot('post_workout'));
    expect(result.current.config.houseAdCategories).toEqual([
      'recovery',
      'nutrition',
      'general',
    ]);
  });

  it('provides an insRef for AdSense element', () => {
    const { result } = renderHook(() => useAdSlot('settings'));
    expect(result.current.insRef).toBeDefined();
    expect(result.current.insRef.current).toBeNull();
  });

  it('returns non-rotating config for build slot', () => {
    const { result } = renderHook(() => useAdSlot('build'));
    expect(result.current.config.rotateHouseAds).toBe(false);
    expect(result.current.config.rotateIntervalMs).toBe(0);
  });
});
