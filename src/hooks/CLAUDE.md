# Hook Conventions

## Pattern
Hooks are the query layer between components and the Zustand store / exercise graph.
Components never access store.graph directly — always through a hook.

## Rules
- useMemo for all graph traversals (substitutes, suggestions, validation, conflicts)
- Memoization deps should be the minimal set that actually changes
- useExerciseSearch returns results from Fuse.js — index is built once in a useMemo (stable dep).
  Accepts an optional `contextFilter` parameter (ContextFilter type) for body-state-aware
  filtering and sorting. Filters by category (strength/warm-up/cool-down), avoids sore
  muscles, and applies recovery/warm-up/light-day logic. Results are annotated with
  recovery badges for the UI layer.
- useRestTimer manages its own AudioContext lifecycle (create on first use, close on unmount).
  Exposes `restSeconds` and `adjustRestDuration(delta)` for idle-state rest duration adjustment.
- useWorkoutConflicts checks both ID-based and pattern-based exercise conflicts
- useAutoWorkoutName generates a default name from the most common muscle group + date
- useSwipeGesture — horizontal swipe gesture hook built on `@use-gesture/react` `useDrag`. Uses
  `axis: 'lock'` for directional locking (first ~10px decides vertical vs horizontal). Triggers
  on velocity > 0.3 px/ms OR distance > 30% viewport width. `respectSwipeRows` (default true)
  cancels gesture when touch starts inside `[data-swipe-row]`. Used in App.tsx for tab
  navigation with an `onSwipe` callback that checks the swipe interceptor first. Replaces
  the old `useSwipeTabs` hook.
- useElapsedTimer takes a `startedAt` ISO string, returns formatted elapsed time (MM:SS or H:MM:SS), ticking every second via useSyncExternalStore
- useBuilderGroups — wraps `deriveGroups()` for the builder tab, returns `ExerciseGroup<WorkoutExercise>[]` from the current workout draft
- useSessionGroups — wraps `deriveGroups()` for the active session, returns `ExerciseGroup<ExerciseLog>[]` from the current session
- useSuggestions — superset suggestions now return `SupersetSuggestion[]` (with `exerciseId` and `parentExerciseId`) instead of plain `ExerciseId[]`
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
- Custom hooks go in src/hooks/, not colocated with components
