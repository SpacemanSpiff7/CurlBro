import { Minus, Pause, Plus } from 'lucide-react';

const RING_SIZE = 100;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Static mock that mirrors the real RestTimer layout at 0:20 idle. */
export function MockRestTimerRing() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="flex items-center justify-center gap-2">
        {/* Left: +15 / -15 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center h-8 w-10 rounded-lg text-xs text-text-tertiary">
            <Plus size={12} className="mr-0.5" />
            15
          </div>
          <div className="flex items-center justify-center h-8 w-10 rounded-lg text-xs text-text-tertiary">
            <Minus size={12} className="mr-0.5" />
            15
          </div>
        </div>

        {/* Center: timer ring */}
        <div className="relative" style={{ width: RING_SIZE + 24, height: RING_SIZE + 24 }}>
          <div
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
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--color-accent-primary)"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={0}
              />
            </svg>
            <div className="relative flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular-nums text-text-primary">
                0:20
              </span>
              <div className="mt-0.5 text-text-tertiary">
                <Pause size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: empty spacer to match real layout */}
        <div className="w-10" />
      </div>
    </div>
  );
}
