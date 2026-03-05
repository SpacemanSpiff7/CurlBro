import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipeTabs } from './useSwipeTabs';
import { useStore } from '@/store';
import type { SwipeInterceptor } from './useSwipeTabs';

// Minimal mock for touch events
function createTouchEvent(type: string, x: number, y: number) {
  const touchData = { clientX: x, clientY: y };
  return new TouchEvent(type, {
    [type === 'touchstart' ? 'touches' : 'changedTouches']: [touchData as Touch],
    bubbles: true,
  });
}

function swipe(el: HTMLElement, startX: number, endX: number, y = 100) {
  el.dispatchEvent(createTouchEvent('touchstart', startX, y));
  el.dispatchEvent(createTouchEvent('touchend', endX, y));
}

describe('useSwipeTabs', () => {
  beforeEach(() => {
    useStore.setState({ activeTab: 'active' });
  });

  it('swipes left to next tab without interceptor', () => {
    const { result } = renderHook(() => useSwipeTabs());
    const el = document.createElement('div');
    result.current(el);

    swipe(el, 200, 100); // dx = -100, left swipe

    expect(useStore.getState().activeTab).toBe('log');
  });

  it('swipes right to previous tab without interceptor', () => {
    const { result } = renderHook(() => useSwipeTabs());
    const el = document.createElement('div');
    result.current(el);

    swipe(el, 100, 200); // dx = +100, right swipe

    expect(useStore.getState().activeTab).toBe('library');
  });

  it('interceptor blocks tab navigation when returning true', () => {
    const interceptor: SwipeInterceptor = vi.fn(() => true);
    const { result } = renderHook(() => useSwipeTabs(interceptor));
    const el = document.createElement('div');
    result.current(el);

    swipe(el, 200, 100); // left swipe

    expect(interceptor).toHaveBeenCalledWith('left');
    expect(useStore.getState().activeTab).toBe('active'); // NOT changed
  });

  it('interceptor passes through when returning false', () => {
    const interceptor: SwipeInterceptor = vi.fn(() => false);
    const { result } = renderHook(() => useSwipeTabs(interceptor));
    const el = document.createElement('div');
    result.current(el);

    swipe(el, 200, 100); // left swipe

    expect(interceptor).toHaveBeenCalledWith('left');
    expect(useStore.getState().activeTab).toBe('log'); // Changed
  });

  it('ignores swipe inside data-swipe-row', () => {
    const { result } = renderHook(() => useSwipeTabs());
    const el = document.createElement('div');
    const swipeRow = document.createElement('div');
    swipeRow.setAttribute('data-swipe-row', '');
    el.appendChild(swipeRow);
    result.current(el);

    // Start touch inside the swipe row
    const startEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 100 } as Touch],
      bubbles: true,
    });
    swipeRow.dispatchEvent(startEvent);

    el.dispatchEvent(createTouchEvent('touchend', 100, 100));

    expect(useStore.getState().activeTab).toBe('active'); // unchanged
  });

  it('ignores vertical swipes', () => {
    const { result } = renderHook(() => useSwipeTabs());
    const el = document.createElement('div');
    result.current(el);

    swipe(el, 200, 100, 300); // start y=300, huge vertical movement
    // But we also need a different y for end. Let me fix:
    el.dispatchEvent(createTouchEvent('touchstart', 200, 100));
    el.dispatchEvent(createTouchEvent('touchend', 100, 300));

    // The first swipe might have changed it. Let's reset and test properly:
    useStore.setState({ activeTab: 'active' });

    el.dispatchEvent(createTouchEvent('touchstart', 200, 100));
    el.dispatchEvent(createTouchEvent('touchend', 100, 250)); // dy=150, exceeds SWIPE_MAX_Y (80)

    expect(useStore.getState().activeTab).toBe('active'); // unchanged
  });
});
