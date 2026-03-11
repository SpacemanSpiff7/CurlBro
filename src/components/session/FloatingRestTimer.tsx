import React, { useCallback, useEffect, useRef, useSyncExternalStore, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { useStore } from '@/store';
import { useFloatingTimerState } from '@/hooks/useFloatingTimerState';
import {
  getInlineTimerVisible,
  subscribeInlineTimerVisible,
  triggerScrollToTimer,
} from '@/hooks/useTimerVisibility';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Mini SVG progress ring for the floating indicator. */
function MiniRing({ progress }: { progress: number }) {
  const size = 24;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-bg-elevated)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-accent-primary)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

/* ── Draggable corner logic ─────────────────────────── */

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const STORAGE_KEY = 'curlbro_floating_timer_corner';
const PAD = 16;
const TOP_OFFSET = 68; // clear TopBar
const BOTTOM_OFFSET = 72; // clear BottomNav (64px + 8px)
/** Fraction of viewport the user must drag to trigger a corner change. */
const DRAG_THRESHOLD = 0.25;

function getStoredCorner(): Corner {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && CORNERS.includes(v as Corner)) return v as Corner;
  } catch { /* noop */ }
  return 'bottom-right';
}

function getCornerPosition(corner: Corner, w: number, h: number) {
  const isTop = corner.startsWith('top');
  const isLeft = corner.endsWith('left');
  return {
    x: isLeft ? PAD : window.innerWidth - w - PAD,
    y: isTop ? TOP_OFFSET : window.innerHeight - h - BOTTOM_OFFSET,
  };
}

/** Compute target corner by flipping axes based on drag direction + threshold. */
function resolveCornerFromDrag(
  startCorner: Corner,
  mx: number,
  my: number,
): Corner {
  const threshX = window.innerWidth * DRAG_THRESHOLD;
  const threshY = window.innerHeight * DRAG_THRESHOLD;

  let isTop = startCorner.startsWith('top');
  let isLeft = startCorner.endsWith('left');

  if (Math.abs(mx) > threshX) isLeft = mx < 0;
  if (Math.abs(my) > threshY) isTop = my < 0;

  return `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Corner;
}

/* ── Component ──────────────────────────────────────── */

function FloatingRestTimerInner() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const session = useStore((state) => state.session.active);
  const timer = useFloatingTimerState();

  // Subscribe to inline timer visibility via useSyncExternalStore
  const inlineVisible = useSyncExternalStore(
    subscribeInlineTimerVisible,
    getInlineTimerVisible
  );

  // 300ms suppression when switching TO the active tab
  // Uses "setState during render" pattern (React 19 safe — no setState in effects)
  const [suppressed, setSuppressed] = useState(false);
  const [prevTab, setPrevTab] = useState(activeTab);
  if (activeTab !== prevTab) {
    setPrevTab(activeTab);
    setSuppressed(activeTab === 'active');
  }
  useEffect(() => {
    if (!suppressed) return;
    const id = setTimeout(() => setSuppressed(false), 300);
    return () => clearTimeout(id);
  }, [suppressed]);

  // Determine visibility
  const hasActiveSession = !!session?.startedAt && !session?.completedAt;
  const onActiveTab = activeTab === 'active';
  const inlineHidden = !onActiveTab || !inlineVisible;
  const shouldShow = hasActiveSession && timer.isRunning && inlineHidden && !suppressed;

  // ── Corner state + drag positioning ──────────────────
  const [corner, setCorner] = useState<Corner>(getStoredCorner);

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const elSizeRef = useRef({ w: 110, h: 44 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const positionInitialized = useRef(false);
  const wasDraggingRef = useRef(false);
  // Guard to prevent the init effect from clobbering an in-progress drag snap animation
  const isSnappingRef = useRef(false);

  // Snap motion values to a corner position
  const snapToCorner = useCallback(
    (c: Corner, animated: boolean) => {
      const pos = getCornerPosition(c, elSizeRef.current.w, elSizeRef.current.h);
      if (animated) {
        animate(motionX, pos.x, { type: 'spring', stiffness: 400, damping: 30 });
        animate(motionY, pos.y, { type: 'spring', stiffness: 400, damping: 30 });
      } else {
        motionX.set(pos.x);
        motionY.set(pos.y);
      }
    },
    [motionX, motionY]
  );

  // Measure element and initialize position when it first appears
  useEffect(() => {
    if (!shouldShow) {
      positionInitialized.current = false;
      return;
    }
    // Wait a frame for the element to render
    const id = requestAnimationFrame(() => {
      // Don't clobber an in-progress drag snap animation
      if (isSnappingRef.current) return;
      if (buttonRef.current) {
        elSizeRef.current = {
          w: buttonRef.current.offsetWidth,
          h: buttonRef.current.offsetHeight,
        };
      }
      snapToCorner(corner, false);
      positionInitialized.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [shouldShow, corner, snapToCorner]);

  // Re-snap on window resize
  useEffect(() => {
    const handleResize = () => {
      if (positionInitialized.current && !isSnappingRef.current) {
        snapToCorner(corner, false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [corner, snapToCorner]);

  // Drag gesture — spread on plain <div> to avoid motion.* onDrag type conflict.
  // Direction-based: drag 25% of viewport in a direction to flip that axis.
  const bind = useDrag(
    ({ movement: [mx, my], memo, last, tap }) => {
      if (tap) return memo;

      if (!memo) {
        wasDraggingRef.current = true;
        memo = { sx: motionX.get(), sy: motionY.get(), startCorner: corner };
      }

      const { sx, sy } = memo as { sx: number; sy: number; startCorner: Corner };

      if (!last) {
        motionX.set(sx + mx);
        motionY.set(sy + my);
        return memo;
      }

      // Release: resolve target corner from drag direction + threshold
      const startCorner = (memo as { startCorner: Corner }).startCorner;
      const nearest = resolveCornerFromDrag(startCorner, mx, my);
      const target = getCornerPosition(nearest, elSizeRef.current.w, elSizeRef.current.h);

      isSnappingRef.current = true;
      const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };
      const xAnim = animate(motionX, target.x, spring);
      const yAnim = animate(motionY, target.y, {
        ...spring,
        onComplete: () => { isSnappingRef.current = false; },
      });

      // If corner changed, persist it
      if (nearest !== startCorner) {
        setCorner(nearest);
        try { localStorage.setItem(STORAGE_KEY, nearest); } catch { /* noop */ }
      } else {
        // Same corner — just clear snapping flag when animation ends
        // (onComplete above handles this)
      }

      // Prevent onClick from firing after drag
      setTimeout(() => { wasDraggingRef.current = false; }, 50);

      // Return cleanup refs so we could cancel if needed
      void xAnim; void yAnim;
      return undefined;
    },
    { filterTaps: true }
  );

  const handleTap = useCallback(() => {
    if (wasDraggingRef.current) return;
    if (activeTab !== 'active') {
      setActiveTab('active');
      setTimeout(() => triggerScrollToTimer(), 400);
    } else {
      triggerScrollToTimer();
    }
  }, [activeTab, setActiveTab]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            x: motionX,
            y: motionY,
            zIndex: 40,
          }}
        >
          {/* Plain div wrapper for @use-gesture bind() — avoids motion.* onDrag type conflict */}
          <div {...bind()} style={{ touchAction: 'none' }}>
            <button
              ref={buttonRef}
              onClick={handleTap}
              aria-label={`Rest timer ${formatTime(timer.displaySeconds)} remaining — tap to view, drag to move`}
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-border-subtle bg-bg-surface/75 px-3 py-2 shadow-lg backdrop-blur-sm cursor-grab active:cursor-grabbing select-none"
            >
              <motion.div
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MiniRing progress={timer.progress} />
              </motion.div>
              <span className="text-sm font-semibold tabular-nums text-accent-primary">
                {formatTime(timer.displaySeconds)}
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const FloatingRestTimer = React.memo(FloatingRestTimerInner);
