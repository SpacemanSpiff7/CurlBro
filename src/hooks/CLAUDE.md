# Hook Conventions

## Pattern
Hooks are the query layer between components and the Zustand store / exercise graph.
Components never access store.graph directly — always through a hook.

## Rules
- useMemo for all graph traversals (substitutes, suggestions, validation, conflicts)
- Memoization deps should be the minimal set that actually changes
- useExerciseSearch returns results from Fuse.js — index is built once in a useMemo (stable dep).
  Accepts optional `exerciseType` (ExerciseTypeFilter), `equipmentGroups` (EquipmentGroup[]),
  and `muscleFilter` (MuscleGroup[]) for explicit filtering. Auto-applies soreness and
  activity-based filtering by reading store.library.soreness and store.library.activities:
  excludes exercises targeting sore/fatigued muscles (except recovery categories), boosts
  recovery exercises for affected muscles to the top of results. No manual contextFilter
  parameter needed — body state is applied automatically.
- useRestTimer manages its own AudioContext lifecycle (create on first use, close on unmount).
  Exposes `restSeconds` and `adjustRestDuration(delta)` for idle-state rest duration adjustment.
  Calls `syncTimer()` on mount to correct for elapsed time during tab switch unmount.
  Listens for `visibilitychange` and `focus` events to call `syncTimer()` on tab return,
  correcting timer drift from browser throttling during backgrounding.
  Returns a `useMemo`-wrapped object with granular deps — safe to use in `useCallback` dependency
  arrays without causing unnecessary re-renders.
- useWorkoutConflicts checks both ID-based and pattern-based exercise conflicts
- useAutoWorkoutName generates a default name from the most common muscle group + date
- useSwipeGesture — horizontal swipe gesture hook built on `@use-gesture/react` `useDrag`. Uses
  `axis: 'lock'` for directional locking (first ~10px decides vertical vs horizontal). Triggers
  on velocity > 0.5 px/ms OR distance > 35% viewport width. `respectSwipeRows` (default true)
  cancels gesture when touch starts inside `[data-swipe-row]`. `onDragOffset` callback reports
  live drag offset for finger-following UI. Used in App.tsx for tab navigation with an
  `onSwipe` callback that checks the swipe interceptor first.
- useDragOffsetChannel — module-level pub/sub channel for drag offset. `setDragOffset(offsetX)`
  called by App.tsx during drag; `registerDragOffsetListener(fn)` called by ActiveWorkout to
  receive offsets. Avoids React re-renders — DOM transforms applied directly for 60fps.
- useElapsedTimer takes a `startedAt` ISO string, returns formatted elapsed time (MM:SS or H:MM:SS), ticking every second via useSyncExternalStore.
  Listens for `visibilitychange` to force snapshot recomputation on tab return (corrects drift from browser throttling).
- useBuilderGroups — wraps `deriveGroups()` for the builder tab, returns `ExerciseGroup<WorkoutExercise>[]` from the current workout draft
- useSessionGroups — wraps `deriveGroups()` for the active session, returns `ExerciseGroup<ExerciseLog>[]` from the current session
- useSuggestions — returns complement and gap suggestions (`pairsWellWith`, `stillNeedToHit`). Superset suggestions moved to per-exercise `useSupersetSuggestions` hook.
- useSupersetSuggestions — per-exercise superset graph query. Queries `graph.supersets.get(exerciseId)`, filters out exercises already in workout, sorts by primary muscle match then difficulty proximity. Used by `SupersetPanel`.
- useHouseAd — selects random house ad from filtered category pool. Module-level `Set<string>`
  prevents repeats within a session (resets on reload). Supports optional rotation via
  `setInterval` for long-visible slots. Auto-resets pool when category exhausted. Per-slot
  cache (`slotCache`) enforces 30s minimum display time (AdSense policy) — `getOrPickAd`
  returns cached ad if called again within the window. Components can re-key `<AdSlot>`
  to trigger a swap; the cache prevents too-frequent refreshes.
- useAdSlot — manages AdSense `<ins>` lifecycle per slot. When `ADSENSE_ENABLED` is false
  (current default), immediately returns `showHouseAd: true`. When enabled: detects ad
  blockers, pushes ad once per mount, falls back on no-fill after 2s. Uses `requestAnimationFrame`
  to defer setState (React 19 strict mode compliance).
- useTimerVisibility — module-level pub/sub channel (follows `useDragOffsetChannel` pattern) for
  inline timer visibility and scroll-to-timer action. `setInlineTimerVisible(bool)` called by
  ActiveWorkout's IntersectionObserver; `subscribeInlineTimerVisible(fn)` / `getInlineTimerVisible()`
  consumed by FloatingRestTimer. `registerScrollToTimer(fn)` / `triggerScrollToTimer()` action
  channel for tap-to-scroll-back behavior.
- useFloatingTimerState — read-only timer projection hook for the floating rest timer indicator.
  Uses `useSyncExternalStore` with a module-level singleton store that ticks once/second.
  Computes remaining time from `timerStartedAt` wall-clock anchor (never calls `tickTimer()`).
  Works even when ActiveWorkout is unmounted. Listens for `visibilitychange` to correct on
  tab return. Also subscribes to Zustand store changes for instant response to start/stop/
  pause/adjust actions (no 1-second delay).
  Returns `{ displaySeconds, totalSeconds, isRunning, isDone, isPaused, isIdle, progress }`.
- useSetTimer — module-level singleton timer for per-set duration countdown. Built on
  `useSyncExternalStore` with `visibilitychange` wall-clock correction (same pattern as
  `useFloatingTimerState`). API: `start(seconds)`, `pause()`, `resume()`, `stop()`,
  `restart()`. Auto-completes set on zero (beep + haptics). Completely independent from
  the rest timer system — both can run simultaneously.
- Custom hooks go in src/hooks/, not colocated with components
