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
  requiresConfirm?: boolean; // If true, first tap shows "Confirm?", second tap executes
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
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  useMotionValueEvent(motionX, 'change', (v) => {
    const next = v < -5;
    setIsOpen((prev) => (prev !== next ? next : prev));
  });

  /* ── Snap helpers ── */
  const snapClosedRef = useRef<(() => void) | undefined>(undefined);

  const snapClosed = useCallback(() => {
    animate(motionX, 0, { type: 'spring', stiffness: 500, damping: 30 });
    setConfirmingKey(null);
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
        // Snap open at 30% of total action width — low threshold so rows
        // with many actions (4 buttons = 288px) don't require huge gestures
        const pastThreshold = Math.abs(mx) > totalWidth * 0.3;
        if (pastThreshold && mx < 0) {
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

  if (!enabled) {
    return (
      <div className={cn('overflow-hidden', className)} data-swipe-row>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-xl', className)}
      data-swipe-row
    >
      {/* Action buttons behind content */}
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((action) => {
          const isConfirming = confirmingKey === action.key;
          return (
            <button
              key={action.key}
              onClick={() => {
                if (action.requiresConfirm && !isConfirming) {
                  setConfirmingKey(action.key);
                  vibrate(10);
                  return;
                }
                snapClosed();
                action.onAction();
              }}
              className={cn(
                'flex flex-col items-center justify-center text-white text-[10px] font-medium transition-colors',
                isConfirming ? 'bg-red-700 dark:bg-red-800' : action.color,
              )}
              style={{ width: actionWidth }}
              aria-label={isConfirming ? `Confirm ${action.label.toLowerCase()}` : action.label}
            >
              {action.icon}
              <span className="mt-0.5">{isConfirming ? 'Confirm?' : action.label}</span>
            </button>
          );
        })}
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
