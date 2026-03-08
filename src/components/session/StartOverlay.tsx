import { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Play, X } from 'lucide-react';

interface StartOverlayProps {
  workoutName: string;
  exerciseCount: number;
  groupCount: number;
  onStart: () => void;
  onCancel: () => void;
}

export const StartOverlay = memo(function StartOverlay({
  workoutName,
  exerciseCount,
  groupCount,
  onStart,
  onCancel,
}: StartOverlayProps) {
  const showGroups = groupCount < exerciseCount;

  return createPortal(
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed inset-0 z-40 bg-bg-root/95 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label={`Start ${workoutName}`}
    >
      <div className="flex h-full flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
        <div className="flex w-full max-w-sm flex-col gap-6">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-xl font-bold leading-tight text-text-primary">
              {workoutName}
            </h1>
            <p className="mt-1 text-sm text-text-tertiary">
              Ready when you are
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-3">
            <span className="rounded-full bg-bg-elevated px-3 py-1 text-sm text-text-secondary">
              {exerciseCount} Exercise{exerciseCount !== 1 ? 's' : ''}
            </span>
            {showGroups && (
              <span className="rounded-full bg-bg-elevated px-3 py-1 text-sm text-text-secondary">
                {groupCount} Group{groupCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onStart}
              autoFocus
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-accent-primary text-sm font-semibold text-bg-root transition-colors hover:bg-accent-hover active:scale-[0.98]"
              aria-label={`Start ${workoutName}`}
            >
              <Play size={18} />
              Let's Go
            </button>
            <button
              onClick={onCancel}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm text-text-tertiary transition-colors hover:text-text-secondary hover:bg-bg-elevated"
              aria-label="Cancel and go back"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
});
