# Hook Conventions

## Pattern
Hooks are the query layer between components and the Zustand store / exercise graph.
Components never access store.graph directly — always through a hook.

## Rules
- useMemo for all graph traversals (substitutes, suggestions, validation, conflicts)
- Memoization deps should be the minimal set that actually changes
- useExerciseSearch returns results from Fuse.js — index is built once in a useMemo (stable dep)
- useRestTimer manages its own AudioContext lifecycle (create on first use, close on unmount)
- useWorkoutConflicts checks both ID-based and pattern-based exercise conflicts
- useAutoWorkoutName generates a default name from the most common muscle group + date
- useSwipeTabs returns a callback ref for horizontal swipe-to-navigate between bottom nav tabs; skips tab swipe when touch starts inside `[data-swipe-row]`
- useElapsedTimer takes a `startedAt` ISO string, returns formatted elapsed time (MM:SS or H:MM:SS), ticking every second via useSyncExternalStore
- useBuilderGroups — wraps `deriveGroups()` for the builder tab, returns `ExerciseGroup<WorkoutExercise>[]` from the current workout draft
- useSessionGroups — wraps `deriveGroups()` for the active session, returns `ExerciseGroup<ExerciseLog>[]` from the current session
- useSuggestions — superset suggestions now return `SupersetSuggestion[]` (with `exerciseId` and `parentExerciseId`) instead of plain `ExerciseId[]`
- Custom hooks go in src/hooks/, not colocated with components
