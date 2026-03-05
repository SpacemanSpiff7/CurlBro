import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import type { TabId } from '@/types';

const TAB_ORDER: TabId[] = ['build', 'library', 'active', 'log', 'settings'];
const SWIPE_THRESHOLD = 50; // min px to count as swipe
const SWIPE_MAX_Y = 80; // max vertical movement to stay horizontal

export type SwipeInterceptor = (direction: 'left' | 'right') => boolean;

/**
 * Adds horizontal swipe-to-navigate between bottom nav tabs.
 * Returns a callback ref to attach to the swipeable container element.
 *
 * An optional `interceptor` callback is called before tab navigation.
 * If the interceptor returns `true`, the swipe is consumed and tab
 * navigation is skipped (e.g. to navigate between exercises first).
 */
export function useSwipeTabs(interceptor?: SwipeInterceptor): (node: HTMLElement | null) => void {
  const setActiveTab = useStore((state) => state.setActiveTab);
  const nodeRef = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const interceptorRef = useRef(interceptor);

  useEffect(() => {
    interceptorRef.current = interceptor;
  });

  return useCallback(
    (node: HTMLElement | null) => {
      // Cleanup previous listeners
      cleanupRef.current?.();
      cleanupRef.current = null;
      nodeRef.current = null;

      if (!node) return;
      nodeRef.current = node;

      function handleTouchStart(e: TouchEvent) {
        // Skip tab navigation when touch starts inside a swipe-to-delete row
        const target = e.target as HTMLElement;
        if (target.closest('[data-swipe-row]')) {
          touchStart.current = null;
          return;
        }
        const touch = e.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }

      function handleTouchEnd(e: TouchEvent) {
        if (!touchStart.current) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = Math.abs(touch.clientY - touchStart.current.y);
        touchStart.current = null;

        if (Math.abs(dx) < SWIPE_THRESHOLD || dy > SWIPE_MAX_Y) return;

        const direction = dx < 0 ? 'left' : 'right';

        // Let interceptor handle first
        if (interceptorRef.current && interceptorRef.current(direction)) {
          return; // Interceptor consumed the swipe
        }

        const { activeTab } = useStore.getState();
        const idx = TAB_ORDER.indexOf(activeTab);
        if (idx === -1) return;

        if (dx < 0 && idx < TAB_ORDER.length - 1) {
          setActiveTab(TAB_ORDER[idx + 1]);
        } else if (dx > 0 && idx > 0) {
          setActiveTab(TAB_ORDER[idx - 1]);
        }
      }

      node.addEventListener('touchstart', handleTouchStart, { passive: true });
      node.addEventListener('touchend', handleTouchEnd, { passive: true });

      cleanupRef.current = () => {
        node.removeEventListener('touchstart', handleTouchStart);
        node.removeEventListener('touchend', handleTouchEnd);
      };
    },
    [setActiveTab]
  );
}
