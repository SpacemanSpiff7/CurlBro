import React, { useCallback, useEffect, useSyncExternalStore, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
function MiniRing({
  progress,
  isRunning,
  isDone,
}: {
  progress: number;
  isRunning: boolean;
  isDone: boolean;
}) {
  const size = 24;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden="true">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-bg-elevated)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isDone ? 'var(--color-success)' : 'var(--color-accent-primary)'}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: isRunning ? 'stroke-dashoffset 1s linear' : 'none',
        }}
      />
    </svg>
  );
}

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
  const [suppressed, setSuppressed] = useState(false);
  useEffect(() => {
    if (activeTab === 'active') {
      setSuppressed(true);
      const id = setTimeout(() => setSuppressed(false), 300);
      return () => clearTimeout(id);
    }
    setSuppressed(false);
  }, [activeTab]);

  // Determine visibility
  const hasActiveSession = !!session?.startedAt && !session?.completedAt;
  const onActiveTab = activeTab === 'active';
  const inlineHidden = !onActiveTab || !inlineVisible;
  const shouldShow = hasActiveSession && !timer.isIdle && inlineHidden && !suppressed;

  const handleTap = useCallback(() => {
    if (activeTab !== 'active') {
      setActiveTab('active');
      // Wait for tab transition + scroll restore + IO evaluation
      setTimeout(() => triggerScrollToTimer(), 400);
    } else {
      triggerScrollToTimer();
    }
  }, [activeTab, setActiveTab]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={handleTap}
          aria-label={
            timer.isDone
              ? 'Rest timer done — tap to view'
              : `Rest timer ${formatTime(timer.displaySeconds)} remaining — tap to view`
          }
          className="fixed left-4 top-[calc(env(safe-area-inset-top,0px)+8px)] z-40 flex min-h-[44px] items-center gap-2 rounded-full border border-border-subtle bg-bg-surface/95 px-3 py-2 shadow-lg backdrop-blur-sm"
        >
          {/* Ring with pulse animation */}
          {timer.isRunning ? (
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MiniRing progress={timer.progress} isRunning isDone={false} />
            </motion.div>
          ) : timer.isDone ? (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MiniRing progress={0} isRunning={false} isDone />
            </motion.div>
          ) : (
            <MiniRing progress={timer.progress} isRunning={false} isDone={false} />
          )}

          {/* Time text */}
          <span
            className={`text-sm font-semibold tabular-nums ${
              timer.isDone
                ? 'text-success'
                : timer.isPaused
                  ? 'text-text-tertiary'
                  : 'text-accent-primary'
            }`}
          >
            {timer.isDone ? 'GO!' : formatTime(timer.displaySeconds)}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export const FloatingRestTimer = React.memo(FloatingRestTimerInner);
