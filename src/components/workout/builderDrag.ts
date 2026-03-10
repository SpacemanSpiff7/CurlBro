import type { UniqueIdentifier } from '@dnd-kit/core';
import type { WorkoutExercise } from '@/types';
import type { ExerciseGroup } from '@/utils/groupUtils';

export type DropState = 'idle' | 'reorder-before' | 'merge' | 'reorder-after';
export type ActiveDropState = Exclude<DropState, 'idle'>;

export interface BuilderDropTarget {
  groupId: string;
  state: ActiveDropState;
}

const DRAG_ID_PREFIX = 'builder-drag:';
const DROP_ID_PREFIX = 'builder-drop:';

export function getBuilderDragId(groupId: string): string {
  return `${DRAG_ID_PREFIX}${groupId}`;
}

export function getBuilderDropId(groupId: string): string {
  return `${DROP_ID_PREFIX}${groupId}`;
}

export function getGroupIdFromBuilderDragId(id: UniqueIdentifier): string | null {
  const value = String(id);
  return value.startsWith(DRAG_ID_PREFIX) ? value.slice(DRAG_ID_PREFIX.length) : null;
}

export function getGroupIdFromBuilderDropId(id: UniqueIdentifier): string | null {
  const value = String(id);
  return value.startsWith(DROP_ID_PREFIX) ? value.slice(DROP_ID_PREFIX.length) : null;
}

export function getPointerClientY(activatorEvent: Event | null, deltaY: number): number | null {
  if (!activatorEvent) return null;

  if (typeof PointerEvent !== 'undefined' && activatorEvent instanceof PointerEvent) {
    return activatorEvent.clientY + deltaY;
  }

  if (typeof MouseEvent !== 'undefined' && activatorEvent instanceof MouseEvent) {
    return activatorEvent.clientY + deltaY;
  }

  if (typeof TouchEvent !== 'undefined' && activatorEvent instanceof TouchEvent) {
    const touch = activatorEvent.touches[0] ?? activatorEvent.changedTouches[0];
    return touch ? touch.clientY + deltaY : null;
  }

  return null;
}

export function canMergeGroupSizes(sourceSize: number, targetSize: number, maxSize = 5): boolean {
  return sourceSize + targetSize <= maxSize;
}

export function resolveReorderIndex(
  groups: ExerciseGroup<WorkoutExercise>[],
  targetGroupId: string,
  state: ActiveDropState,
): number | null {
  if (state === 'merge') return null;

  const targetGroup = groups.find((group) => group.groupId === targetGroupId);
  if (!targetGroup) return null;

  return state === 'reorder-after'
    ? targetGroup.indices[targetGroup.indices.length - 1] + 1
    : targetGroup.indices[0];
}
