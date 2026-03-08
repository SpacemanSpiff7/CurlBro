export type DropIntent =
  | { type: 'reorder'; targetGroupId: string }
  | { type: 'superset'; targetGroupId: string };

/**
 * Resolves drag-drop intent based on pointer Y position relative to the target element.
 * - Top/bottom 30% of card height → reorder (standard sort behavior)
 * - Center 40% of card height → superset merge
 */
export function resolveDropIntent(
  pointerY: number,
  targetRect: { top: number; height: number },
  targetGroupId: string,
): DropIntent {
  const relativeY = pointerY - targetRect.top;
  const ratio = relativeY / targetRect.height;

  if (ratio < 0.3 || ratio > 0.7) {
    return { type: 'reorder', targetGroupId };
  }

  return { type: 'superset', targetGroupId };
}
