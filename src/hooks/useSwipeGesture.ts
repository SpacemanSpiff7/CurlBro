import { useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';

export type SwipeDirection = 'left' | 'right';

interface SwipeGestureConfig {
  onSwipe: (direction: SwipeDirection) => void;
  onDragOffset?: (offsetX: number) => void;
  velocityThreshold?: number;   // px/ms, default 0.3
  distanceThreshold?: number;   // fraction of viewport, default 0.3
  respectSwipeRows?: boolean;   // skip data-swipe-row elements, default true
  enabled?: boolean;            // default true
}

/**
 * Horizontal swipe gesture hook built on @use-gesture/react.
 *
 * Replaces useSwipeTabs with proper directional locking (`axis: 'lock'`)
 * so vertical scrolls are never mistaken for horizontal swipes.
 *
 * Returns bind props to spread onto the container element.
 */
export function useSwipeGesture(config: SwipeGestureConfig) {
  const {
    onSwipe,
    onDragOffset,
    velocityThreshold = 0.3,
    distanceThreshold = 0.3,
    respectSwipeRows = true,
    enabled = true,
  } = config;

  // Use refs for callbacks to avoid re-creating the gesture handler
  const onSwipeRef = useRef(onSwipe);
  const onDragOffsetRef = useRef(onDragOffset);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
    onDragOffsetRef.current = onDragOffset;
  });

  return useDrag(
    ({ active, movement: [mx], velocity: [vx], cancel, event, last }) => {
      if (!enabled) return;

      // On active drag, check if touch started in a swipe row
      if (respectSwipeRows && active && !last) {
        const target = (event as TouchEvent).target as HTMLElement | null;
        if (target?.closest?.('[data-swipe-row]')) {
          cancel();
          return;
        }
      }

      // Report drag offset for potential visual feedback
      if (active) {
        onDragOffsetRef.current?.(mx);
      }

      // On release, check if swipe should trigger
      if (last) {
        onDragOffsetRef.current?.(0); // Reset offset

        const absDistance = Math.abs(mx);
        const viewportWidth = window.innerWidth;
        const meetsDistance = absDistance > viewportWidth * distanceThreshold;
        const meetsVelocity = vx > velocityThreshold;

        if (meetsDistance || meetsVelocity) {
          const direction: SwipeDirection = mx < 0 ? 'left' : 'right';
          onSwipeRef.current(direction);
        }
      }
    },
    {
      axis: 'lock',
      filterTaps: true,
      enabled,
    },
  );
}
