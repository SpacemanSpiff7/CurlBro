export function vibrate(pattern: number | number[] = 200): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function vibrateTimerDone(): void {
  vibrate([100, 50, 100, 50, 200]);
}
