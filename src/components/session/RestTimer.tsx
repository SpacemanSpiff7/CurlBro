import { memo } from 'react';
import { motion } from 'framer-motion';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';

interface RestTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  isRunning: boolean;
  isDone: boolean;
  restSeconds: number;
  onStart: (seconds: number) => void;
  onStop: () => void;
  onAddTime: (delta: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RING_SIZE = 80;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const RestTimer = memo(function RestTimer({
  remainingSeconds,
  progress,
  isRunning,
  isDone,
  restSeconds,
  onStart,
  onStop,
  onAddTime,
}: RestTimerProps) {
  const isIdle = !isRunning && !isDone;
  const strokeDashoffset = isIdle ? 0 : CIRCUMFERENCE * (1 - progress);
  const displayTime = isIdle ? restSeconds : remainingSeconds;

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

      {/* Center: timer ring */}
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="rotate-[-90deg]"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-bg-elevated)"
            strokeWidth={STROKE_WIDTH}
          />
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
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isDone ? (
            <span className="text-lg font-bold text-success">GO!</span>
          ) : (
            <span className="text-lg font-bold tabular-nums text-text-primary">
              {formatTime(displayTime)}
            </span>
          )}
        </div>
      </div>

      {/* Right: play/pause + reset */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => {
            if (isRunning) {
              onStop();
            } else {
              onStart(isIdle ? restSeconds : remainingSeconds);
            }
          }}
          disabled={isDone}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          className="flex items-center justify-center h-8 w-10 rounded-lg transition-colors disabled:opacity-30"
        >
          {isRunning ? (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Pause size={16} className="text-accent-primary" />
            </motion.div>
          ) : (
            <Play size={16} className="text-text-tertiary hover:text-text-secondary" />
          )}
        </button>
        <button
          onClick={onStop}
          disabled={isIdle}
          aria-label="Reset timer"
          className="flex items-center justify-center h-8 w-10 rounded-lg text-text-tertiary hover:text-text-secondary disabled:opacity-30 transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
});
