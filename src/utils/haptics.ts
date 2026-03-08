export function vibrate(pattern: number | number[] = 200): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function vibrateTimerDone(): void {
  vibrate([100, 50, 100, 50, 200]);
}

export function vibrateDragStart(): void {
  vibrate(10);
}

export function vibrateSupersetIntent(): void {
  vibrate(15);
}

export function vibrateGrouped(): void {
  vibrate([10, 50, 10]);
}

export function vibrateSelect(): void {
  vibrate(5);
}
