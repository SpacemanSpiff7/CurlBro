export type DropIntent =
  | { type: 'reorder-before'; targetGroupId: string }
  | { type: 'merge'; targetGroupId: string }
  | { type: 'reorder-after'; targetGroupId: string };

export const DROP_INTENT_EDGE_RATIO = 0.20;

/**
 * Resolves drag-drop intent based on pointer Y position relative to the target element.
 * - Top 20% of card height → reorder before
 * - Center 60% of card height → merge into target group
 * - Bottom 20% of card height → reorder after
 */
export function resolveDropIntent(
  pointerY: number,
  targetRect: { top: number; height: number },
  targetGroupId: string,
): DropIntent {
  const relativeY = pointerY - targetRect.top;
  const ratio = relativeY / targetRect.height;

  if (ratio < DROP_INTENT_EDGE_RATIO) {
    return { type: 'reorder-before', targetGroupId };
  }

  if (ratio > 1 - DROP_INTENT_EDGE_RATIO) {
    return { type: 'reorder-after', targetGroupId };
  }

  return { type: 'merge', targetGroupId };
}
