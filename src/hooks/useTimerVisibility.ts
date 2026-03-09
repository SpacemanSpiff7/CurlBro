/**
 * Module-level pub/sub channel for inline timer visibility + scroll-to-timer action.
 * Follows the useDragOffsetChannel.ts pattern — zero React re-renders.
 *
 * Producer: ActiveWorkout (IntersectionObserver → setInlineTimerVisible)
 * Consumer: FloatingRestTimer (subscribeInlineTimerVisible → show/hide logic)
 */

type Listener = () => void;

// ─── Inline timer visibility ────────────────────────────
let inlineTimerVisible = false;
const visibilityListeners = new Set<Listener>();

export function setInlineTimerVisible(visible: boolean) {
  if (inlineTimerVisible === visible) return;
  inlineTimerVisible = visible;
  visibilityListeners.forEach((fn) => fn());
}

export function getInlineTimerVisible() {
  return inlineTimerVisible;
}

export function subscribeInlineTimerVisible(fn: Listener) {
  visibilityListeners.add(fn);
  return () => {
    visibilityListeners.delete(fn);
  };
}

// ─── Scroll-to-timer action ─────────────────────────────
let scrollToTimerFn: (() => void) | null = null;

export function registerScrollToTimer(fn: (() => void) | null) {
  scrollToTimerFn = fn;
}

export function triggerScrollToTimer() {
  scrollToTimerFn?.();
}
