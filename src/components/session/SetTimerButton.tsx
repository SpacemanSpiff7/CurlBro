import { memo } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SetTimerButtonProps {
  isRunning: boolean;
  isPaused: boolean;
  isIdle: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export const SetTimerButton = memo(function SetTimerButton({
  isRunning,
  isPaused,
  isIdle,
  onStart,
  onPause,
  onResume,
  onRestart,
}: SetTimerButtonProps) {
  if (isRunning) {
    return (
      <button
        onClick={onPause}
        aria-label="Pause timer"
        className="h-8 w-8 rounded-full flex items-center justify-center bg-warning/15 text-warning hover:bg-warning/25 transition-colors"
      >
        <Pause size={14} />
      </button>
    );
  }

  if (isPaused) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onResume}
          aria-label="Resume timer"
          className="h-8 w-8 rounded-full flex items-center justify-center bg-warning/15 text-warning hover:bg-warning/25 transition-colors"
        >
          <Play size={14} />
        </button>
        <button
          onClick={onRestart}
          aria-label="Restart timer"
          className="h-7 w-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-warning transition-colors"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    );
  }

  // Idle
  if (isIdle) {
    return (
      <button
        onClick={onStart}
        aria-label="Start timer"
        className="h-8 w-8 rounded-full flex items-center justify-center bg-bg-surface border border-border-subtle text-text-tertiary hover:text-warning hover:border-warning/40 transition-colors"
      >
        <Play size={14} />
      </button>
    );
  }

  return null;
});
