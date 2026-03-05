import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHouseAd } from './useHouseAd';
import { HOUSE_ADS } from '../data/houseAds';

describe('useHouseAd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an ad from the specified categories', () => {
    const { result } = renderHook(() => useHouseAd(['form_tip']));
    expect(result.current.ad.category).toBe('form_tip');
  });

  it('returns an ad matching one of multiple categories', () => {
    const { result } = renderHook(() =>
      useHouseAd(['form_tip', 'recovery']),
    );
    expect(['form_tip', 'recovery']).toContain(result.current.ad.category);
  });

  it('next() returns a different ad (no repeat)', () => {
    const { result } = renderHook(() => useHouseAd(['form_tip']));
    const firstId = result.current.ad.id;
    act(() => result.current.next());
    expect(result.current.ad.id).not.toBe(firstId);
    expect(result.current.ad.category).toBe('form_tip');
  });

  it('resets pool when all ads in category are exhausted', () => {
    // Use a small category (general has 3 ads) to avoid shared-state issues
    const generalCount = HOUSE_ADS.filter(
      (a) => a.category === 'general',
    ).length;
    const { result } = renderHook(() => useHouseAd(['general']));

    // Exhaust all general ads by calling next enough times
    // (pool includes initial ad + next calls)
    for (let i = 1; i < generalCount + 2; i++) {
      act(() => result.current.next());
    }

    // After exhaustion + reset, should still return a general ad
    expect(result.current.ad.category).toBe('general');
  });

  it('rotates ads on interval when enabled', () => {
    const { result } = renderHook(() =>
      useHouseAd(['form_tip', 'recovery'], true, 5000),
    );
    const firstId = result.current.ad.id;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.ad.id).not.toBe(firstId);
  });

  it('does not rotate when rotate is false', () => {
    const { result } = renderHook(() =>
      useHouseAd(['form_tip'], false, 5000),
    );
    const firstId = result.current.ad.id;

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.ad.id).toBe(firstId);
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = renderHook(() =>
      useHouseAd(['form_tip'], true, 5000),
    );
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
