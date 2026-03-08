import { describe, it, expect } from 'vitest';
import { resolveDropIntent } from './dropIntent';

describe('resolveDropIntent', () => {
  const rect = { top: 100, height: 100 };

  it('returns reorder for top 30% of target', () => {
    // pointerY at 110 → ratio 0.1, in top 30%
    const intent = resolveDropIntent(110, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder', targetGroupId: 'group-1' });
  });

  it('returns reorder for bottom 30% of target', () => {
    // pointerY at 190 → ratio 0.9, in bottom 30%
    const intent = resolveDropIntent(190, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder', targetGroupId: 'group-1' });
  });

  it('returns superset for center 40% of target', () => {
    // pointerY at 150 → ratio 0.5, in center
    const intent = resolveDropIntent(150, rect, 'group-1');
    expect(intent).toEqual({ type: 'superset', targetGroupId: 'group-1' });
  });

  it('returns reorder at boundary (30%)', () => {
    // pointerY at 129 → ratio 0.29, in top 30%
    const intent = resolveDropIntent(129, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder', targetGroupId: 'group-1' });
  });

  it('returns superset just past 30% boundary', () => {
    // pointerY at 131 → ratio 0.31, in center zone
    const intent = resolveDropIntent(131, rect, 'group-1');
    expect(intent).toEqual({ type: 'superset', targetGroupId: 'group-1' });
  });

  it('returns reorder at 70% boundary', () => {
    // pointerY at 171 → ratio 0.71, in bottom 30%
    const intent = resolveDropIntent(171, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder', targetGroupId: 'group-1' });
  });
});
