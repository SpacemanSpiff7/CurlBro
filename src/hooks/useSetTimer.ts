import { useSyncExternalStore } from 'react';
import { playTimerDone } from '@/utils/audio';
import { vibrateTimerDone } from '@/utils/haptics';

// ─── State Shape ────────────────────────────────────────
export interface SetTimerState {
  /** Unique ID of the set being timed (e.g. "3-1" for exerciseIdx 3, setIdx 1) */
  activeId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  /** 0→1 progress (updated once per second; Framer Motion interpolates visually) */
  progress: number;
  /** True briefly after timer reaches zero — drives green flash */
  completed: boolean;
}

const IDLE: SetTimerState = {
  activeId: null,
  isRunning: false,
  isPaused: false,
  remainingSeconds: 0,
  totalSeconds: 0,
  progress: 0,
  completed: false,
};

// ─── Module-level singleton ─────────────────────────────
let _state: SetTimerState = { ...IDLE };
let _startedAt: number | null = null; // wall-clock ms
let _pausedRemaining: number | null = null;
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _onComplete: (() => void) | null = null;
let _completedTimeout: ReturnType<typeof setTimeout> | null = null;

// ─── Pub/Sub ────────────────────────────────────────────
const _listeners = new Set<() => void>();

function emit() {
  _state = { ..._state };
  for (const l of _listeners) l();
}

function subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot(): SetTimerState {
  return _state;
}

// SSR fallback
function getServerSnapshot(): SetTimerState {
  return IDLE;
}

// ─── Internal helpers ───────────────────────────────────
function clearTimers() {
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  if (_completedTimeout) { clearTimeout(_completedTimeout); _completedTimeout = null; }
}

function computeRemaining(): number {
  if (!_startedAt) return _state.remainingSeconds;
  const elapsed = (Date.now() - _startedAt) / 1000;
  return Math.max(0, _state.totalSeconds - elapsed);
}

function tick() {
  const remaining = computeRemaining();
  _state.remainingSeconds = Math.ceil(remaining);
  _state.progress = _state.totalSeconds > 0 ? 1 - (remaining / _state.totalSeconds) : 0;

  if (remaining <= 0) {
    // Timer done
    clearTimers();
    _state.isRunning = false;
    _state.remainingSeconds = 0;
    _state.progress = 1;
    _state.completed = true;
    _startedAt = null;

    playTimerDone();
    vibrateTimerDone();

    const cb = _onComplete;
    _onComplete = null;
    emit();
    if (cb) cb();

    // Clear completed flash after 600ms, then reset to idle
    _completedTimeout = setTimeout(() => {
      if (_state.completed && !_state.isRunning) {
        _state.completed = false;
        _state.activeId = null;
        emit();
      }
    }, 600);
    return;
  }

  emit();
}

// ─── Visibility correction ──────────────────────────────
function handleVisibility() {
  if (document.visibilityState === 'visible' && _state.isRunning) {
    tick();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', () => {
    if (_state.isRunning) tick();
  });
}

// ─── Public API ─────────────────────────────────────────

/** Start a timer for a specific set. Stops any active timer first. */
export function startSetTimer(id: string, seconds: number, onComplete?: () => void) {
  clearTimers();
  _startedAt = Date.now();
  _pausedRemaining = null;
  _onComplete = onComplete ?? null;
  _state = {
    activeId: id,
    isRunning: true,
    isPaused: false,
    remainingSeconds: seconds,
    totalSeconds: seconds,
    progress: 0,
    completed: false,
  };
  _intervalId = setInterval(tick, 1000);
  emit();
}

/** Pause the active timer. */
export function pauseSetTimer() {
  if (!_state.isRunning) return;
  clearTimers();
  _pausedRemaining = computeRemaining();
  _startedAt = null;
  _state.isRunning = false;
  _state.isPaused = true;
  _state.remainingSeconds = Math.ceil(_pausedRemaining);
  emit();
}

/** Resume a paused timer. */
export function resumeSetTimer() {
  if (!_state.isPaused || _pausedRemaining == null) return;
  _startedAt = Date.now() - ((_state.totalSeconds - _pausedRemaining) * 1000);
  _pausedRemaining = null;
  _state.isRunning = true;
  _state.isPaused = false;
  _intervalId = setInterval(tick, 1000);
  emit();
}

/** Restart the timer from the beginning with the same duration. */
export function restartSetTimer() {
  if (!_state.activeId) return;
  const id = _state.activeId;
  const total = _state.totalSeconds;
  const cb = _onComplete;
  startSetTimer(id, total, cb ?? undefined);
}

/** Stop the timer completely and reset to idle. */
export function stopSetTimer() {
  clearTimers();
  _startedAt = null;
  _pausedRemaining = null;
  _onComplete = null;
  _state = { ...IDLE };
  emit();
}

// ─── React hook ─────────────────────────────────────────

/** Subscribe to the singleton set timer state. */
export function useSetTimer(): SetTimerState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
