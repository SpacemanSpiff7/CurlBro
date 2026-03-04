import { memo } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  isRunning: boolean;
  isDone: boolean;
  onStop: () => void;
  onAddTime: (delta: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RING_SIZE = 160;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const RestTimer = memo(function RestTimer({
  remainingSeconds,
  progress,
  isRunning,
  isDone,
  onStop,
  onAddTime,
}: RestTimerProps) {
  if (!isRunning && !isDone) return null;

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="rotate-[-90deg]"
        >
          {/* Background ring */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-bg-elevated)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress ring */}
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
          <span className="text-3xl font-bold tabular-nums text-text-primary">
            {isDone ? 'GO!' : formatTime(remainingSeconds)}
          </span>
          {isDone && (
            <span className="text-xs text-success">Rest complete</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddTime(-15)}
          disabled={isDone || remainingSeconds <= 15}
          aria-label="Subtract 15 seconds"
          className="h-9 w-16"
        >
          <Minus size={14} className="mr-1" />
          15s
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onStop}
          aria-label="Stop timer"
          className="h-9 w-9"
        >
          <X size={14} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddTime(15)}
          disabled={isDone}
          aria-label="Add 15 seconds"
          className="h-9 w-16"
        >
          <Plus size={14} className="mr-1" />
          15s
        </Button>
      </div>
    </motion.div>
  );
});
