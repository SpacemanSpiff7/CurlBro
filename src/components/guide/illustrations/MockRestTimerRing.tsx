import { motion } from 'framer-motion';
import { Play, Minus, Plus } from 'lucide-react';

const SIZE = 100;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MockRestTimerRing() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="flex flex-col items-center gap-3">
        {/* Ring */}
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Background track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              className="stroke-border-subtle"
            />
            {/* Animated arc */}
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              className="stroke-accent-primary"
              style={{ rotate: -90, transformOrigin: 'center' }}
              animate={{ strokeDashoffset: [0, CIRCUMFERENCE] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear',
              }}
            />
          </svg>
          {/* Center time */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-text-primary tabular-nums">
              1:30
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated text-text-secondary">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-white">
            <Play className="h-4 w-4" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated text-text-secondary">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
