import { memo } from 'react';
import { Info, ArrowRightLeft } from 'lucide-react';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { GroupBadge } from '@/components/shared/GroupBadge';
import type { ExerciseGroup } from '@/utils/groupUtils';
import type { ExerciseId, ExerciseLog, ExerciseGraph } from '@/types';

interface ExerciseRowStackProps {
  group: ExerciseGroup<ExerciseLog>;
  graph: ExerciseGraph;
  onInfo: (exerciseOffset: number) => void;
  onSwap: (exerciseOffset: number) => void;
}

export const ExerciseRowStack = memo(function ExerciseRowStack({
  group,
  graph,
  onInfo,
  onSwap,
}: ExerciseRowStackProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* Group label for multi-exercise groups */}
      {group.exercises.length > 1 && (
        <div className="text-center mb-0.5">
          <GroupBadge size={group.exercises.length} />
        </div>
      )}

      {/* Stacked exercise rows */}
      {group.exercises.map((exercise, offset) => {
        const name = graph.exercises.get(exercise.exerciseId as ExerciseId)?.name ?? 'Unknown Exercise';
        const actions: SwipeAction[] = [
          {
            key: 'swap',
            label: 'Swap',
            icon: <ArrowRightLeft size={16} />,
            color: 'bg-warning',
            onAction: () => onSwap(offset),
          },
        ];

        return (
          <SwipeToReveal key={`${exercise.exerciseId}-${offset}`} actions={actions}>
            <div className="flex items-center justify-between px-3 min-h-[44px]">
              <span className="text-sm font-semibold text-text-primary">
                {name}
              </span>
              <button
                onClick={() => onInfo(offset)}
                aria-label={`Info for ${name}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-primary/40 text-accent-primary"
              >
                <Info size={14} />
              </button>
            </div>
          </SwipeToReveal>
        );
      })}
    </div>
  );
});
