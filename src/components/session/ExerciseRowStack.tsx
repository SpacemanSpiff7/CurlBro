import { memo } from 'react';
import { Info, ArrowRightLeft } from 'lucide-react';
import { SwipeToReveal } from '@/components/shared/SwipeToReveal';
import type { SwipeAction } from '@/components/shared/SwipeToReveal';
import { getGroupLabel } from '@/utils/groupUtils';
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
  const groupLabel = getGroupLabel(group.exercises.length);

  return (
    <div className="flex flex-col gap-1">
      {/* Group label for multi-exercise groups */}
      {groupLabel && (
        <div className="text-[11px] font-medium text-accent-primary uppercase tracking-wide text-center mb-0.5">
          {groupLabel}
        </div>
      )}

      {/* Stacked exercise rows */}
      {group.exercises.map((exercise, offset) => {
        const name = graph.exercises.get(exercise.exerciseId as ExerciseId)?.name ?? 'Unknown Exercise';
        const actions: SwipeAction[] = [
          {
            key: 'info',
            label: 'Info',
            icon: <Info size={16} />,
            color: 'bg-accent-primary',
            onAction: () => onInfo(offset),
          },
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
            <div className="flex items-center px-3 min-h-[44px]">
              <span className="text-sm font-semibold text-text-primary">
                {name}
              </span>
            </div>
          </SwipeToReveal>
        );
      })}
    </div>
  );
});
