import { useMemo } from 'react';
import { useStore } from '@/store';
import { deriveGroups } from '@/utils/groupUtils';
import type { ExerciseGroup } from '@/utils/groupUtils';
import type { ExerciseLog } from '@/types';

export function useSessionGroups() {
  const session = useStore((state) => state.session.active);

  const groups = useMemo(() => {
    if (!session) return [];
    return deriveGroups(session.exercises);
  }, [session]);

  const currentGroupIndex = useMemo(() => {
    if (!session || groups.length === 0) return 0;
    // The store stores the group index directly
    return Math.min(session.currentGroupIndex, groups.length - 1);
  }, [session, groups]);

  const currentGroup: ExerciseGroup<ExerciseLog> | null = groups[currentGroupIndex] ?? null;
  const totalGroups = groups.length;

  return { groups, currentGroup, currentGroupIndex, totalGroups };
}
