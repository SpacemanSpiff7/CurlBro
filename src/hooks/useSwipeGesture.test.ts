import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipeGesture } from './useSwipeGesture';

describe('useSwipeGesture', () => {
  it('returns a bind function', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipe: vi.fn() }),
    );
    expect(typeof result.current).toBe('function');
  });

  it('bind returns event handlers object', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipe: vi.fn() }),
    );
    const handlers = result.current();
    expect(handlers).toBeTruthy();
    expect(typeof handlers).toBe('object');
  });

  it('disabled config returns bind that still works', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipe: vi.fn(), enabled: false }),
    );
    const handlers = result.current();
    expect(handlers).toBeTruthy();
  });

  it('accepts all config options without error', () => {
    const onSwipe = vi.fn();
    const onDragOffset = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipe,
        onDragOffset,
        velocityThreshold: 0.5,
        distanceThreshold: 0.4,
        respectSwipeRows: false,
        enabled: true,
      }),
    );
    expect(typeof result.current).toBe('function');
  });
});
