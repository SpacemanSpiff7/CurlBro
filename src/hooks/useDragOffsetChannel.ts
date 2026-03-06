/**
 * Pub/sub channel for drag offset — avoids React re-renders during drag.
 * App.tsx calls setDragOffset() during gesture; ActiveWorkout subscribes
 * to apply DOM transforms at 60fps.
 */

type DragOffsetListener = (offsetX: number) => void;

let listener: DragOffsetListener | null = null;

export function setDragOffset(offsetX: number) {
  listener?.(offsetX);
}

export function registerDragOffsetListener(fn: DragOffsetListener | null) {
  listener = fn;
}
