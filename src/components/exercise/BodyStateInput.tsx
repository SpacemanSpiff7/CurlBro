import { memo, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store';
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
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

const TIMING_LABELS: Record<ActivityTiming, string> = {
  yesterday: 'Yesterday',
  today: 'Today',
  tomorrow: 'Tomorrow',
};

const MUSCLES_SORTED = [...MUSCLE_GROUPS].sort((a, b) =>
  (MUSCLE_LABELS[a] ?? a).localeCompare(MUSCLE_LABELS[b] ?? b)
);

const SELECTABLE_ACTIVITY_TYPES = ACTIVITY_TYPES.filter(
  (t) => t !== 'rest_day' && t !== 'general'
) as Exclude<ActivityType, 'rest_day' | 'general'>[];

export const BodyStateInput = memo(function BodyStateInput() {
  const soreness = useStore((state) => state.library.soreness);
  const activities = useStore((state) => state.library.activities);
  const setSoreness = useStore((state) => state.libraryActions.setSoreness);
  const addActivity = useStore((state) => state.libraryActions.addActivity);
  const removeActivity = useStore((state) => state.libraryActions.removeActivity);

  const [expandedTiming, setExpandedTiming] = useState<ActivityTiming | null>(null);

  const isSore = useCallback(
    (muscle: MuscleGroup): boolean => {
      const entry = soreness.find((s) => s.muscle === muscle);
      return entry != null && entry.level !== 'none';
    },
    [soreness]
  );

  const toggleSoreness = useCallback(
    (muscle: MuscleGroup) => {
      const currentlySore = soreness.find((s) => s.muscle === muscle);
      const filtered = soreness.filter((s) => s.muscle !== muscle);
      if (currentlySore && currentlySore.level !== 'none') {
        // Un-sore
        setSoreness(filtered);
      } else {
        // Set as sore (moderate internally)
        filtered.push({ muscle, level: 'moderate' as SorenessLevel });
        setSoreness(filtered);
      }
    },
    [soreness, setSoreness]
  );

  const isTimingActive = useCallback(
    (timing: ActivityTiming): boolean => {
      return activities.some((a) => a.timing === timing);
    },
    [activities]
  );

  const isActivityActive = useCallback(
    (type: ActivityType, timing: ActivityTiming): boolean => {
      return activities.some((a) => a.type === type && a.timing === timing);
    },
    [activities]
  );

  const toggleActivity = useCallback(
    (type: ActivityType, timing: ActivityTiming) => {
      const existing = activities.find(
        (a) => a.type === type && a.timing === timing
      );
      if (existing) {
        removeActivity(existing.id);
        // If no specific activities left, ensure general entry exists
        const remainingForTiming = activities.filter(
          (a) => a.timing === timing && a.id !== existing.id
        );
        if (remainingForTiming.length === 0) {
          addActivity({
            id: uuidv4(),
            type: 'general',
            timing,
            date: new Date().toISOString(),
          });
        }
      } else {
        // Remove general entry if it exists, add specific
        const generalEntry = activities.find(
          (a) => a.type === 'general' && a.timing === timing
        );
        if (generalEntry) {
          removeActivity(generalEntry.id);
        }
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

  const handleTimingTap = useCallback(
    (timing: ActivityTiming) => {
      if (isTimingActive(timing)) {
        if (expandedTiming === timing) {
          // Tapping active + expanded timing → clear all and collapse
          const toRemove = activities.filter((a) => a.timing === timing);
          for (const a of toRemove) {
            removeActivity(a.id);
          }
          setExpandedTiming(null);
        } else {
          // Tapping active but collapsed → just expand
          setExpandedTiming(timing);
        }
      } else {
        // Activate timing with general entry and expand sub-row
        addActivity({
          id: uuidv4(),
          type: 'general',
          timing,
          date: new Date().toISOString(),
        });
        setExpandedTiming(timing);
      }
    },
    [isTimingActive, expandedTiming, activities, removeActivity, addActivity]
  );

  return (
    <div className="space-y-3">
      {/* Soreness section */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5 px-1">
          Soreness
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLES_SORTED.map((muscle) => {
            const sore = isSore(muscle);
            return (
              <button
                key={muscle}
                onClick={() => toggleSoreness(muscle)}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors select-none ${
                  sore
                    ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                    : 'bg-bg-elevated text-text-tertiary border-border-subtle'
                }`}
                aria-label={`${MUSCLE_LABELS[muscle]} soreness: ${sore ? 'sore' : 'not sore'}`}
              >
                {MUSCLE_LABELS[muscle]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity section */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5 px-1">
          Recent Activity
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIMING_OPTIONS.map((timing) => {
            const active = isTimingActive(timing);
            return (
              <Badge
                key={timing}
                variant={active ? 'default' : 'outline'}
                className={`cursor-pointer text-xs select-none ${
                  active
                    ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                    : ''
                }`}
                onClick={() => handleTimingTap(timing)}
              >
                {TIMING_LABELS[timing]}
              </Badge>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {expandedTiming && isTimingActive(expandedTiming) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 mt-2 pl-2">
                {SELECTABLE_ACTIVITY_TYPES.map((type) => {
                  const active = isActivityActive(type, expandedTiming);
                  return (
                    <Badge
                      key={type}
                      variant={active ? 'default' : 'outline'}
                      className="cursor-pointer text-xs select-none"
                      onClick={() => toggleActivity(type, expandedTiming)}
                    >
                      {ACTIVITY_LABELS[type]}
                    </Badge>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
