export interface ExerciseGroup<T> {
  groupId: string;
  exercises: T[];
  indices: number[];
}

/**
 * Scans a flat array of exercises, grouping consecutive exercises that share
 * the same supersetGroupId. Standalone exercises (no supersetGroupId) become
 * groups of 1 with a generated groupId based on their index.
 */
export function deriveGroups<T extends { supersetGroupId?: string }>(
  exercises: T[],
): ExerciseGroup<T>[] {
  const groups: ExerciseGroup<T>[] = [];

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const groupId = ex.supersetGroupId;

    if (groupId) {
      const last = groups[groups.length - 1];
      if (last && last.groupId === groupId) {
        last.exercises.push(ex);
        last.indices.push(i);
        continue;
      }
    }

    groups.push({
      groupId: groupId ?? `solo-${i}`,
      exercises: [ex],
      indices: [i],
    });
  }

  return groups;
}

/**
 * Returns a display label for a group based on its size.
 * 1 exercise = null (standalone), 2 = "Superset", 3 = "Tri-set", 4+ = "Circuit (N)"
 */
export function getGroupLabel(size: number): string | null {
  if (size <= 1) return null;
  if (size === 2) return 'Superset';
  if (size === 3) return 'Tri-set';
  return `Circuit (${size})`;
}
