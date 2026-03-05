import { describe, it, expect } from 'vitest';
import { deriveGroups, getGroupLabel } from './groupUtils';

describe('deriveGroups', () => {
  it('returns empty array for empty input', () => {
    expect(deriveGroups([])).toEqual([]);
  });

  it('creates solo groups for exercises without supersetGroupId', () => {
    const exercises = [
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
    const exercises = [
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
    const exercises = [
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
    const exercises = [
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
    const groups = deriveGroups([{ name: 'A' }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe('solo-0');
    expect(groups[0].indices).toEqual([0]);
  });

  it('handles a single grouped exercise', () => {
    const groups = deriveGroups([{ name: 'A', supersetGroupId: 'g1' }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe('g1');
    expect(groups[0].exercises).toHaveLength(1);
  });

  it('handles mixed solo and grouped exercises', () => {
    const exercises = [
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

  it('preserves exercise references', () => {
    const a = { name: 'A', supersetGroupId: 'g1' };
    const b = { name: 'B', supersetGroupId: 'g1' };
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
