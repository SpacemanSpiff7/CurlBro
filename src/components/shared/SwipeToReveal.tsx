import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useMotionValue, useMotionValueEvent, motion, animate } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { cn } from '@/lib/utils';
import { vibrate } from '@/utils/haptics';

export interface SwipeAction {
  key: string;
  label: string;
  icon: ReactNode;
  color: string; // Tailwind bg class like 'bg-destructive'
  onAction: () => void;
}

interface SwipeToRevealProps {
  actions: SwipeAction[];
  actionWidth?: number; // px per button, default 72
  children: ReactNode;
  className?: string;
  enabled?: boolean; // default true
}

/* ── Singleton: only one row open at a time ── */
let closeCurrentRow: (() => void) | null = null;

// eslint-disable-next-line react-refresh/only-export-components
export function closeAllSwipeRows(): void {
  closeCurrentRow?.();
  closeCurrentRow = null;
}

/* ── Component ── */
export function SwipeToReveal({
  actions,
  actionWidth = 72,
  children,
  className,
  enabled = true,
}: SwipeToRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const motionX = useMotionValue(0);
  const totalWidth = actions.length * actionWidth;

  const [isOpen, setIsOpen] = useState(false);

  useMotionValueEvent(motionX, 'change', (v) => {
    setIsOpen(v < -5);
  });

  /* ── Snap helpers ── */
  const snapClosedRef = useRef<(() => void) | undefined>(undefined);

  const snapClosed = useCallback(() => {
    animate(motionX, 0, { type: 'spring', stiffness: 500, damping: 30 });
    if (closeCurrentRow === snapClosedRef.current) {
      closeCurrentRow = null;
    }
  }, [motionX]);

  useEffect(() => {
    snapClosedRef.current = snapClosed;
  });

  const snapOpen = useCallback(() => {
    closeCurrentRow?.();
    animate(motionX, -totalWidth, {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    });
    closeCurrentRow = snapClosedRef.current ?? null;
    vibrate(10);
  }, [motionX, totalWidth]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (closeCurrentRow === snapClosedRef.current) {
        closeCurrentRow = null;
      }
    };
  }, []);

  /* ── Tap outside to close ── */
  useEffect(() => {
    if (!isOpen) return;

    function handleTapOutside(e: PointerEvent) {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        snapClosed();
      }
    }

    document.addEventListener('pointerdown', handleTapOutside);
    return () => document.removeEventListener('pointerdown', handleTapOutside);
  }, [isOpen, snapClosed]);

  /* ── Drag gesture ── */
  const bind = useDrag(
    ({ active, movement: [mx], cancel, event, last }) => {
      // Skip if drag started on a dnd handle
      if (!last && active) {
        const target = (event as TouchEvent).target as HTMLElement | null;
        if (target?.closest?.('[data-dnd-handle]')) {
          cancel();
          return;
        }
      }

      // Clamp: only allow leftward (negative) swipe, max to -totalWidth
      const clamped = Math.max(-totalWidth, Math.min(0, mx));

      if (active) {
        motionX.set(clamped);
      }

      if (last) {
        const pastHalf = Math.abs(mx) > totalWidth * 0.5;
        if (pastHalf && mx < 0) {
          snapOpen();
        } else {
          snapClosed();
        }
      }
    },
    {
      axis: 'lock',
      filterTaps: true,
      enabled,
    },
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-xl', className)}
      data-swipe-row
    >
      {/* Action buttons behind content */}
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={() => {
              action.onAction();
              snapClosed();
            }}
            className={cn(
              'flex flex-col items-center justify-center text-white text-[10px] font-medium',
              action.color,
            )}
            style={{ width: actionWidth }}
            aria-label={action.label}
          >
            {action.icon}
            <span className="mt-0.5">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Foreground content that slides */}
      <div {...bind()} style={{ touchAction: 'pan-y' }}>
        <motion.div
          style={{ x: motionX }}
          className="relative bg-bg-surface"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
