import { memo, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store';
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  SORENESS_LEVELS,
  ACTIVITY_TYPES,
  ACTIVITY_LABELS,
  TIMING_OPTIONS,
} from '@/types';
import type {
  MuscleGroup,
  SorenessLevel,
  ActivityType,
  ActivityTiming,
} from '@/types';

const SORENESS_COLORS: Record<SorenessLevel, string> = {
  none: 'bg-bg-elevated text-text-tertiary border-border-subtle',
  mild: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
  moderate: 'bg-orange-900/30 text-orange-400 border-orange-700',
  severe: 'bg-red-900/30 text-red-400 border-red-700',
};

const TIMING_LABELS: Record<ActivityTiming, string> = {
  yesterday: 'Yesterday',
  today: 'Today',
  tomorrow: 'Tomorrow',
};

interface BodyStateInputProps {
  expanded: boolean;
  onToggle: () => void;
}

export const BodyStateInput = memo(function BodyStateInput({
  expanded,
  onToggle,
}: BodyStateInputProps) {
  const soreness = useStore((state) => state.library.soreness);
  const activities = useStore((state) => state.library.activities);
  const setSoreness = useStore((state) => state.libraryActions.setSoreness);
  const addActivity = useStore((state) => state.libraryActions.addActivity);
  const removeActivity = useStore((state) => state.libraryActions.removeActivity);

  const hasSoreness = soreness.some((s) => s.level !== 'none');
  const hasActivities = activities.length > 0;
  const hasAnyState = hasSoreness || hasActivities;

  const getSorenessLevel = useCallback(
    (muscle: MuscleGroup): SorenessLevel => {
      const entry = soreness.find((s) => s.muscle === muscle);
      return entry?.level ?? 'none';
    },
    [soreness]
  );

  const cycleSoreness = useCallback(
    (muscle: MuscleGroup) => {
      const currentLevel = getSorenessLevel(muscle);
      const currentIndex = SORENESS_LEVELS.indexOf(currentLevel);
      const nextLevel = SORENESS_LEVELS[(currentIndex + 1) % SORENESS_LEVELS.length];

      const filtered = soreness.filter((s) => s.muscle !== muscle);
      if (nextLevel !== 'none') {
        filtered.push({ muscle, level: nextLevel });
      }
      setSoreness(filtered);
    },
    [soreness, getSorenessLevel, setSoreness]
  );

  const toggleActivity = useCallback(
    (type: ActivityType, timing: ActivityTiming) => {
      const existing = activities.find(
        (a) => a.type === type && a.timing === timing
      );
      if (existing) {
        removeActivity(existing.id);
      } else {
        addActivity({
          id: uuidv4(),
          type,
          timing,
          date: new Date().toISOString(),
        });
      }
    },
    [activities, addActivity, removeActivity]
  );

  const isActivityActive = useCallback(
    (type: ActivityType, timing: ActivityTiming): boolean => {
      return activities.some((a) => a.type === type && a.timing === timing);
    },
    [activities]
  );

  return (
    <div className="px-4 pb-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
        aria-expanded={expanded}
        aria-label="Toggle body state input"
      >
        <span className="flex items-center gap-2">
          Body State
          {hasAnyState && (
            <span className="h-2 w-2 rounded-full bg-brand-primary" />
          )}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="mt-2 space-y-3">
          {/* Soreness Grid */}
          <div>
            <div className="text-xs text-text-tertiary mb-1.5 px-1">
              Soreness — tap to cycle
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((muscle) => {
                const level = getSorenessLevel(muscle);
                return (
                  <button
                    key={muscle}
                    onClick={() => cycleSoreness(muscle)}
                    className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors select-none ${SORENESS_COLORS[level]}`}
                    aria-label={`${MUSCLE_LABELS[muscle]} soreness: ${level}`}
                  >
                    {MUSCLE_LABELS[muscle]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Chips */}
          <div>
            <div className="text-xs text-text-tertiary mb-1.5 px-1">
              Recent / planned activity
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_TYPES.filter((t) => t !== 'rest_day').map((type) =>
                TIMING_OPTIONS.map((timing) => {
                  const active = isActivityActive(type, timing);
                  return (
                    <Badge
                      key={`${type}-${timing}`}
                      variant={active ? 'default' : 'outline'}
                      className="cursor-pointer text-xs select-none"
                      onClick={() => toggleActivity(type, timing)}
                    >
                      {ACTIVITY_LABELS[type]} {TIMING_LABELS[timing].toLowerCase()}
                      {active && (
                        <X size={10} className="ml-1" />
                      )}
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
