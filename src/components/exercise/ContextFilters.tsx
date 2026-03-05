import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store';
import {
  MUSCLE_LABELS,
  ACTIVITY_LABELS,
} from '@/types';
import type {
  ContextFilter,
  Category,
} from '@/types';

interface ContextFiltersProps {
  activeFilter: ContextFilter | null;
  onFilterChange: (filter: ContextFilter | null) => void;
}

interface FilterChip {
  key: string;
  label: string;
  filter: ContextFilter;
  variant: 'context' | 'category';
}

export const ContextFilters = memo(function ContextFilters({
  activeFilter,
  onFilterChange,
}: ContextFiltersProps) {
  const soreness = useStore((state) => state.library.soreness);
  const activities = useStore((state) => state.library.activities);

  const chips = useMemo(() => {
    const result: FilterChip[] = [];

    // Category filters (always shown)
    result.push({
      key: 'cat-strength',
      label: 'Strength',
      filter: { type: 'category', categories: ['compound', 'isolation'] as Category[] },
      variant: 'category',
    });
    result.push({
      key: 'cat-warmup',
      label: 'Warm-up',
      filter: { type: 'category', categories: ['stretch_dynamic', 'mobility', 'cardio'] as Category[] },
      variant: 'category',
    });
    result.push({
      key: 'cat-cooldown',
      label: 'Cool-down',
      filter: { type: 'category', categories: ['stretch_static'] as Category[] },
      variant: 'category',
    });

    // Soreness-based filters
    const soreMuscles = soreness.filter((s) => s.level !== 'none');
    for (const { muscle, level } of soreMuscles) {
      result.push({
        key: `sore-${muscle}`,
        label: `Avoid sore ${MUSCLE_LABELS[muscle]}`,
        filter: { type: 'sore_muscle', muscle, level },
        variant: 'context',
      });
    }

    // Activity-based filters
    for (const activity of activities) {
      if (activity.timing === 'yesterday' || activity.timing === 'today') {
        const key = `post-${activity.type}-${activity.timing}`;
        // Avoid duplicate chips for same activity type
        if (!result.some((r) => r.key === key)) {
          result.push({
            key,
            label: `Post-${ACTIVITY_LABELS[activity.type].toLowerCase()} recovery`,
            filter: { type: 'post_activity', activity: activity.type },
            variant: 'context',
          });
        }
      }
      if (activity.timing === 'tomorrow') {
        const key = `pre-${activity.type}`;
        if (!result.some((r) => r.key === key)) {
          result.push({
            key,
            label: `Pre-${ACTIVITY_LABELS[activity.type].toLowerCase()} warm-up`,
            filter: { type: 'pre_activity', activity: activity.type },
            variant: 'context',
          });
        }
      }
    }

    // Light day — show when multiple muscles are sore
    if (soreMuscles.length >= 2) {
      result.push({
        key: 'light-day',
        label: 'Light day',
        filter: { type: 'light_day' },
        variant: 'context',
      });
    }

    return result;
  }, [soreness, activities]);

  function isActive(chip: FilterChip): boolean {
    if (!activeFilter) return false;
    if (activeFilter.type !== chip.filter.type) return false;

    switch (activeFilter.type) {
      case 'sore_muscle':
        return chip.filter.type === 'sore_muscle' && activeFilter.muscle === chip.filter.muscle;
      case 'post_activity':
        return chip.filter.type === 'post_activity' && activeFilter.activity === chip.filter.activity;
      case 'pre_activity':
        return chip.filter.type === 'pre_activity' && activeFilter.activity === chip.filter.activity;
      case 'light_day':
        return chip.filter.type === 'light_day';
      case 'category':
        return (
          chip.filter.type === 'category' &&
          activeFilter.categories.join(',') === chip.filter.categories.join(',')
        );
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const active = isActive(chip);
          return (
            <Badge
              key={chip.key}
              variant={active ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap text-xs select-none ${
                chip.variant === 'context' && !active
                  ? 'border-brand-primary/40 text-brand-primary'
                  : ''
              }`}
              onClick={() => onFilterChange(active ? null : chip.filter)}
            >
              {chip.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
});
