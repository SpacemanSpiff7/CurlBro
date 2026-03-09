import { memo } from 'react';
import { motion } from 'framer-motion';

interface SetTimerFillProps {
  progress: number;
  completed: boolean;
  isRunning: boolean;
}

export const SetTimerFill = memo(function SetTimerFill({
  progress,
  completed,
  isRunning,
}: SetTimerFillProps) {
  if (progress <= 0 && !completed) return null;

  return (
    <motion.div
      className="absolute inset-0 z-0 rounded-lg pointer-events-none"
      initial={false}
      animate={{
        width: `${progress * 100}%`,
        backgroundColor: completed
          ? 'color-mix(in srgb, var(--color-success) 20%, transparent)'
          : 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        borderTopRightRadius: completed ? 8 : isRunning ? [12, 20, 8, 16] : 8,
        borderBottomRightRadius: completed ? 8 : isRunning ? [16, 8, 20, 12] : 8,
      }}
      transition={
        completed
          ? { backgroundColor: { duration: 0.3 }, width: { duration: 0 } }
          : isRunning
            ? {
                width: { duration: 1, ease: 'linear' },
                borderTopRightRadius: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                borderBottomRightRadius: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
              }
            : { width: { duration: 0.3 } }
      }
      style={{ originX: 0 }}
    />
  );
});
