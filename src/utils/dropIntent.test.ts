import { describe, it, expect } from 'vitest';
import { DROP_INTENT_EDGE_RATIO, resolveDropIntent } from './dropIntent';

describe('resolveDropIntent', () => {
  const rect = { top: 100, height: 100 };

  it('returns reorder-before for top zone of target', () => {
    // pointerY at 110 → ratio 0.1, in top 30%
    const intent = resolveDropIntent(110, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder-before', targetGroupId: 'group-1' });
  });

  it('returns reorder-after for bottom zone of target', () => {
    // pointerY at 190 → ratio 0.9, in bottom 30%
    const intent = resolveDropIntent(190, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder-after', targetGroupId: 'group-1' });
  });

  it('returns merge for center zone of target', () => {
    // pointerY at 150 → ratio 0.5, in center
    const intent = resolveDropIntent(150, rect, 'group-1');
    expect(intent).toEqual({ type: 'merge', targetGroupId: 'group-1' });
  });

  it('returns reorder-before just inside edge band', () => {
    const pointerY = rect.top + rect.height * (DROP_INTENT_EDGE_RATIO - 0.01);
    const intent = resolveDropIntent(pointerY, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder-before', targetGroupId: 'group-1' });
  });

  it('returns merge just past the top edge band', () => {
    const pointerY = rect.top + rect.height * (DROP_INTENT_EDGE_RATIO + 0.01);
    const intent = resolveDropIntent(pointerY, rect, 'group-1');
    expect(intent).toEqual({ type: 'merge', targetGroupId: 'group-1' });
  });

  it('returns merge before the bottom edge band', () => {
    const pointerY = rect.top + rect.height * (1 - DROP_INTENT_EDGE_RATIO - 0.01);
    const intent = resolveDropIntent(pointerY, rect, 'group-1');
    expect(intent).toEqual({ type: 'merge', targetGroupId: 'group-1' });
  });

  it('returns reorder-after just inside bottom edge band', () => {
    const pointerY = rect.top + rect.height * (1 - DROP_INTENT_EDGE_RATIO + 0.01);
    const intent = resolveDropIntent(pointerY, rect, 'group-1');
    expect(intent).toEqual({ type: 'reorder-after', targetGroupId: 'group-1' });
  });
});
