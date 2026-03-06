import { describe, it, expect } from 'vitest';
import { deriveGroups, getGroupLabel } from './groupUtils';

interface TestExercise {
  name: string;
  instanceId?: string;
  supersetGroupId?: string;
}

describe('deriveGroups', () => {
  it('returns empty array for empty input', () => {
    expect(deriveGroups<TestExercise>([])).toEqual([]);
  });

  it('creates solo groups for exercises without supersetGroupId', () => {
    const exercises: TestExercise[] = [
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
    ];
    const groups = deriveGroups(exercises);

    expect(groups).toHaveLength(3);
    expect(groups[0].groupId).toBe('solo-0');
    expect(groups[0].exercises).toEqual([{ name: 'A' }]);
    expect(groups[0].indices).toEqual([0]);
    expect(groups[1].groupId).toBe('solo-1');
    expect(groups[2].groupId).toBe('solo-2');
  });

  it('groups consecutive exercises with the same supersetGroupId', () => {
    const exercises: TestExercise[] = [
      { name: 'A', supersetGroupId: 'g1' },
      { name: 'B', supersetGroupId: 'g1' },
      { name: 'C' },
    ];
    const groups = deriveGroups(exercises);

    expect(groups).toHaveLength(2);
    expect(groups[0].groupId).toBe('g1');
    expect(groups[0].exercises).toHaveLength(2);
    expect(groups[0].indices).toEqual([0, 1]);
    expect(groups[1].groupId).toBe('solo-2');
  });

  it('splits non-consecutive exercises with the same supersetGroupId into separate groups', () => {
    const exercises: TestExercise[] = [
      { name: 'A', supersetGroupId: 'g1' },
      { name: 'B' },
      { name: 'C', supersetGroupId: 'g1' },
    ];
    const groups = deriveGroups(exercises);

    expect(groups).toHaveLength(3);
    expect(groups[0].groupId).toBe('g1');
    expect(groups[0].exercises).toHaveLength(1);
    expect(groups[1].groupId).toBe('solo-1');
    expect(groups[2].groupId).toBe('g1');
    expect(groups[2].exercises).toHaveLength(1);
  });

  it('handles multiple different groups', () => {
    const exercises: TestExercise[] = [
      { name: 'A', supersetGroupId: 'g1' },
      { name: 'B', supersetGroupId: 'g1' },
      { name: 'C', supersetGroupId: 'g2' },
      { name: 'D', supersetGroupId: 'g2' },
      { name: 'E', supersetGroupId: 'g2' },
    ];
    const groups = deriveGroups(exercises);

    expect(groups).toHaveLength(2);
    expect(groups[0].groupId).toBe('g1');
    expect(groups[0].exercises).toHaveLength(2);
    expect(groups[0].indices).toEqual([0, 1]);
    expect(groups[1].groupId).toBe('g2');
    expect(groups[1].exercises).toHaveLength(3);
    expect(groups[1].indices).toEqual([2, 3, 4]);
  });

  it('handles a single exercise', () => {
    const groups = deriveGroups<TestExercise>([{ name: 'A' }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe('solo-0');
    expect(groups[0].indices).toEqual([0]);
  });

  it('handles a single grouped exercise', () => {
    const groups = deriveGroups<TestExercise>([{ name: 'A', supersetGroupId: 'g1' }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe('g1');
    expect(groups[0].exercises).toHaveLength(1);
  });

  it('handles mixed solo and grouped exercises', () => {
    const exercises: TestExercise[] = [
      { name: 'A' },
      { name: 'B', supersetGroupId: 'g1' },
      { name: 'C', supersetGroupId: 'g1' },
      { name: 'D' },
      { name: 'E', supersetGroupId: 'g2' },
      { name: 'F', supersetGroupId: 'g2' },
    ];
    const groups = deriveGroups(exercises);

    expect(groups).toHaveLength(4);
    expect(groups[0].groupId).toBe('solo-0');
    expect(groups[1].groupId).toBe('g1');
    expect(groups[1].indices).toEqual([1, 2]);
    expect(groups[2].groupId).toBe('solo-3');
    expect(groups[3].groupId).toBe('g2');
    expect(groups[3].indices).toEqual([4, 5]);
  });

  it('uses instanceId for stable solo group keys', () => {
    const exercises: TestExercise[] = [
      { name: 'A', instanceId: 'aaa' },
      { name: 'B', instanceId: 'bbb' },
      { name: 'C', instanceId: 'ccc' },
    ];
    const groups = deriveGroups(exercises);

    expect(groups).toHaveLength(3);
    expect(groups[0].groupId).toBe('solo-aaa');
    expect(groups[1].groupId).toBe('solo-bbb');
    expect(groups[2].groupId).toBe('solo-ccc');
  });

  it('produces stable keys after deletion when instanceId is present', () => {
    const exercises: TestExercise[] = [
      { name: 'A', instanceId: 'aaa' },
      { name: 'B', instanceId: 'bbb', supersetGroupId: 'g1' },
      { name: 'C', instanceId: 'ccc', supersetGroupId: 'g1' },
      { name: 'D', instanceId: 'ddd' },
    ];

    const beforeGroups = deriveGroups(exercises);
    expect(beforeGroups[2].groupId).toBe('solo-ddd');

    // Delete exercise A (index 0)
    const afterDelete = exercises.slice(1);
    const afterGroups = deriveGroups(afterDelete);

    // D's key should still be solo-ddd, not solo-2 (index-based would change)
    expect(afterGroups[1].groupId).toBe('solo-ddd');
  });

  it('preserves exercise references', () => {
    const a: TestExercise = { name: 'A', supersetGroupId: 'g1' };
    const b: TestExercise = { name: 'B', supersetGroupId: 'g1' };
    const groups = deriveGroups([a, b]);

    expect(groups[0].exercises[0]).toBe(a);
    expect(groups[0].exercises[1]).toBe(b);
  });
});

describe('getGroupLabel', () => {
  it('returns null for size 0', () => {
    expect(getGroupLabel(0)).toBeNull();
  });

  it('returns null for size 1', () => {
    expect(getGroupLabel(1)).toBeNull();
  });

  it('returns "Superset" for size 2', () => {
    expect(getGroupLabel(2)).toBe('Superset');
  });

  it('returns "Tri-set" for size 3', () => {
    expect(getGroupLabel(3)).toBe('Tri-set');
  });

  it('returns "Circuit (N)" for size 4+', () => {
    expect(getGroupLabel(4)).toBe('Circuit (4)');
    expect(getGroupLabel(5)).toBe('Circuit (5)');
    expect(getGroupLabel(10)).toBe('Circuit (10)');
  });
});
