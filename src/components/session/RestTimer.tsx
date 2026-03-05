import { memo } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';

interface RestTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  isRunning: boolean;
  isDone: boolean;
  restSeconds: number;
  onStart: (seconds: number) => void;
  onStop: () => void;
  onPause: () => void;
  onAddTime: (delta: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RING_SIZE = 100;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const RestTimer = memo(function RestTimer({
  remainingSeconds,
  totalSeconds,
  progress,
  isRunning,
  isDone,
  restSeconds,
  onStart,
  onStop,
  onPause,
  onAddTime,
}: RestTimerProps) {
  // States: idle (never started), running, paused (started then paused), done
  const isPaused = !isRunning && !isDone && totalSeconds > 0 && remainingSeconds > 0;
  const isIdle = !isRunning && !isDone && !isPaused;
  const strokeDashoffset = isIdle ? 0 : CIRCUMFERENCE * (1 - progress);
  const displayTime = isIdle ? restSeconds : remainingSeconds;

  const handleRingTap = () => {
    if (isDone) {
      // Reset to idle
      onStop();
    } else if (isRunning) {
      // Pause
      onPause();
    } else if (isPaused) {
      // Resume from remaining time
      onStart(remainingSeconds);
    } else {
      // Idle → start
      onStart(restSeconds);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Left: -15 / +15 */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onAddTime(15)}
          disabled={isDone}
          aria-label="Add 15 seconds"
          className="flex items-center justify-center h-8 w-10 rounded-lg text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-30 transition-colors"
        >
          <Plus size={12} className="mr-0.5" />
          15
        </button>
        <button
          onClick={() => onAddTime(-15)}
          disabled={isIdle || isDone || remainingSeconds <= 15}
          aria-label="Subtract 15 seconds"
          className="flex items-center justify-center h-8 w-10 rounded-lg text-xs text-text-tertiary hover:text-text-secondary disabled:opacity-30 transition-colors"
        >
          <Minus size={12} className="mr-0.5" />
          15
        </button>
      </div>

      {/* Center: tappable timer ring */}
      <div className="relative" style={{ width: RING_SIZE + 24, height: RING_SIZE + 24 }}>
        <button
          onClick={handleRingTap}
          aria-label={
            isDone ? 'Reset timer'
              : isRunning ? 'Pause timer'
              : isPaused ? 'Resume timer'
              : 'Start timer'
          }
          className="absolute inset-0 flex items-center justify-center"
          style={{ left: 12, top: 12, width: RING_SIZE, height: RING_SIZE }}
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="rotate-[-90deg] absolute inset-0"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-bg-elevated)"
              strokeWidth={STROKE_WIDTH}
            />
            {isRunning ? (
              <motion.circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--color-accent-primary)"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            ) : (
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={isDone ? 'var(--color-success)' : 'var(--color-accent-primary)'}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            )}
          </svg>
          <div className="relative flex flex-col items-center justify-center">
            {isDone ? (
              <span className="text-lg font-bold text-success">GO!</span>
            ) : (
              <span className="text-lg font-bold tabular-nums text-text-primary">
                {formatTime(displayTime)}
              </span>
            )}
          </div>
        </button>

        {/* Reset icon — appears when paused, positioned top-right outside ring */}
        {isPaused && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            aria-label="Reset timer"
            className="absolute flex items-center justify-center h-6 w-6 rounded-full bg-bg-elevated border border-border-subtle text-text-tertiary hover:text-text-secondary"
            style={{ top: -4, right: -4 }}
          >
            <RotateCcw size={12} />
          </motion.button>
        )}
      </div>
    </div>
  );
});
