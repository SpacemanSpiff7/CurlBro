import { describe, expect, it } from 'vitest';
import {
  canMergeGroupSizes,
  getBuilderDragId,
  getBuilderDropId,
  getGroupIdFromBuilderDragId,
  getGroupIdFromBuilderDropId,
  getPointerClientY,
  resolveReorderIndex,
} from './builderDrag';
import type { WorkoutExercise } from '@/types';
import type { ExerciseGroup } from '@/utils/groupUtils';

function makeGroup(groupId: string, indices: number[]): ExerciseGroup<WorkoutExercise> {
  return {
    groupId,
    indices,
    exercises: indices.map((index) => ({
      exerciseId: `exercise-${index}` as WorkoutExercise['exerciseId'],
      instanceId: `instance-${index}`,
      sets: 3,
      reps: 10,
      weight: null,
      restSeconds: 60,
      notes: '',
      trackWeight: true,
      trackReps: true,
      trackDuration: false,
      trackDistance: false,
    })),
  };
}

describe('builderDrag helpers', () => {
  it('round-trips builder drag IDs', () => {
    const id = getBuilderDragId('group-1');
    expect(getGroupIdFromBuilderDragId(id)).toBe('group-1');
  });

  it('round-trips builder drop IDs', () => {
    const id = getBuilderDropId('group-2');
    expect(getGroupIdFromBuilderDropId(id)).toBe('group-2');
  });

  it('returns null for unrelated IDs', () => {
    expect(getGroupIdFromBuilderDragId('group-1')).toBeNull();
    expect(getGroupIdFromBuilderDropId('group-1')).toBeNull();
  });

  it('extracts pointer Y from mouse events', () => {
    const event = new MouseEvent('pointerdown', { clientY: 120 });
    expect(getPointerClientY(event, 15)).toBe(135);
  });

  it('returns null when there is no pointer event context', () => {
    expect(getPointerClientY(new KeyboardEvent('keydown'), 10)).toBeNull();
  });

  it('resolves reorder-before to the target start index', () => {
    const groups = [makeGroup('g1', [0]), makeGroup('g2', [1, 2]), makeGroup('g3', [3])];
    expect(resolveReorderIndex(groups, 'g2', 'reorder-before')).toBe(1);
  });

  it('resolves reorder-after to just past the target end index', () => {
    const groups = [makeGroup('g1', [0]), makeGroup('g2', [1, 2]), makeGroup('g3', [3])];
    expect(resolveReorderIndex(groups, 'g2', 'reorder-after')).toBe(3);
  });

  it('returns null for merge reorder index requests', () => {
    const groups = [makeGroup('g1', [0]), makeGroup('g2', [1])];
    expect(resolveReorderIndex(groups, 'g2', 'merge')).toBeNull();
  });

  it('enforces the max merge size', () => {
    expect(canMergeGroupSizes(2, 3)).toBe(true);
    expect(canMergeGroupSizes(2, 4)).toBe(false);
  });
});
