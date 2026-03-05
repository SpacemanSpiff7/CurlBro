import { memo } from 'react';
import { motion } from 'framer-motion';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const RING_SIZE = 88;
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
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAddTime(-15)}
        disabled={isIdle || isDone || remainingSeconds <= 15}
        aria-label="Subtract 15 seconds"
        className="h-8 w-12 text-xs text-text-tertiary"
      >
        <Minus size={12} className="mr-0.5" />
        15
      </Button>

      <button
        onClick={() => {
          if (isDone) {
            onStop();
          } else if (isRunning) {
            onStop();
          } else {
            onStart(isIdle ? restSeconds : remainingSeconds);
          }
        }}
        aria-label={isRunning ? 'Stop timer' : isDone ? 'Reset timer' : 'Start rest timer'}
        className="relative"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
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
            <>
              <span className="text-lg font-bold text-success">GO!</span>
              <RotateCcw size={12} className="text-text-tertiary mt-0.5" />
            </>
          ) : (
            <>
              <span className="text-lg font-bold tabular-nums text-text-primary">
                {formatTime(displayTime)}
              </span>
              {isIdle ? (
                <Play size={12} className="text-text-tertiary mt-0.5" />
              ) : (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Pause size={12} className="text-accent-primary mt-0.5" />
                </motion.div>
              )}
            </>
          )}
        </div>
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAddTime(15)}
        disabled={isDone}
        aria-label="Add 15 seconds"
        className="h-8 w-12 text-xs text-text-tertiary"
      >
        <Plus size={12} className="mr-0.5" />
        15
      </Button>
    </div>
  );
});
