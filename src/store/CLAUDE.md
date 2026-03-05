# Store Conventions

## Slice Pattern
All state lives in a single Zustand store (src/store/index.ts) using Immer middleware.
- graphSlice — exercise graph (read-only after init, never persisted)
- builder — workout draft state, workoutSplit, suggestions, validation
- library — saved workouts + logs (persisted to localStorage)
- session — active workout session (NOT persisted)
- settings — user settings (persisted)

## Rules
- Zustand's `immer` middleware wraps `set` automatically: `set((state) => { state.foo = bar; })`
  (no explicit `produce()` call needed)
- Persisted slices use Zustand `persist` middleware with Zod validation on hydration
- If Zod validation fails on hydration, reset to defaults — never crash
- Actions are methods on the store, accessed via `store.builderActions.addExercise()`
- Selectors use shallow equality: `useStore(state => state.builder.workout, shallow)`
- Graph is initialized once via `initGraph()` at app startup, then treated as immutable
- `endSession()` only sets `completedAt` and stops the timer — does NOT create a log
- `saveSession()` creates a `WorkoutLog` from the completed session and pushes to `library.logs` — call after `endSession()`
- `saveSession()` includes duplicate prevention (checks workoutId + startedAt)

## Key Actions
- `loadTemplate(name, split, exercises)` — loads a seeded workout into the builder
- `setWorkoutSplit(split)` — sets the workout split type (push/pull/legs/upper/lower/full_body)
- `resetWorkout()` — clears builder and resets workoutSplit to null
- `removeSet(exerciseIndex, setIndex)` — deletes a set during active session (guards: won't remove last set)
- `pauseTimer()` — pauses the rest timer without resetting (preserves remainingSeconds/totalSeconds)
- `stopTimer()` — fully resets the timer to idle state
- `saveSession()` — creates a WorkoutLog from completed session, pushes to library.logs, returns the log
- `addExerciseToSession(exerciseId)` — appends exercise with 1 empty set to active session, navigates to it
- `deleteLog(id)` — removes a workout log from library.logs
