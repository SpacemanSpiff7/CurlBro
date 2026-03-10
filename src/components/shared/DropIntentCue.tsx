import { cn } from '@/lib/utils';
import type { DropState } from '@/components/workout/builderDrag';

interface DropIntentCueProps {
  dropState: DropState;
  active: boolean;
}

/**
 * Absolutely-positioned drop intent indicators.
 * Must be placed inside a `relative` parent (the row wrapper).
 *
 * - reorder-before: bright cyan line in the gap ABOVE the card
 * - reorder-after: bright cyan line in the gap BELOW the card
 * - merge: amber "Superset" belt across the center of the card
 */
export function DropIntentCue({ dropState, active }: DropIntentCueProps) {
  if (!active) return null;

  return (
    <>
      {/* Reorder-before — line in gap above card */}
      <div
        className={cn(
          'pointer-events-none absolute left-2 right-2 z-20 rounded-full transition-all duration-100',
          dropState === 'reorder-before'
            ? '-top-[5px] h-[3px] bg-accent-primary shadow-[0_0_8px_2px_rgba(6,182,212,0.8),0_0_20px_4px_rgba(6,182,212,0.4)]'
            : '-top-[5px] h-0 opacity-0',
        )}
      />

      {/* Reorder-after — line in gap below card */}
      <div
        className={cn(
          'pointer-events-none absolute left-2 right-2 z-20 rounded-full transition-all duration-100',
          dropState === 'reorder-after'
            ? '-bottom-[5px] h-[3px] bg-accent-primary shadow-[0_0_8px_2px_rgba(6,182,212,0.8),0_0_20px_4px_rgba(6,182,212,0.4)]'
            : '-bottom-[5px] h-0 opacity-0',
        )}
      />

      {/* Merge overlay — full card amber tint with label at top */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-20 rounded-xl border-2 transition-all duration-150 flex justify-center',
          dropState === 'merge'
            ? 'opacity-100 bg-warning/15 border-warning/60 shadow-[0_0_24px_rgba(245,158,11,0.3)]'
            : 'opacity-0 border-transparent',
        )}
      >
        <span className="mt-2 text-[11px] font-bold text-warning uppercase tracking-widest">
          Superset
        </span>
      </div>
    </>
  );
}
