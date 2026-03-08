# Store Conventions

## Slice Pattern
All state lives in a single Zustand store (src/store/index.ts) using Immer middleware.
- graphSlice — exercise graph (read-only after init, never persisted)
- builder — workout draft state, workoutSplit, suggestions, validation
- library — saved workouts, logs, soreness entries, and activity entries (persisted to localStorage)
- session — active workout session + rest timer (persisted to localStorage, Zod-validated on hydration)
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
- `pauseTimer()` — pauses the rest timer without resetting (preserves remainingSeconds/totalSeconds), clears `timerStartedAt`
- `stopTimer()` — fully resets the timer to idle state
- `startTimer(seconds)` — starts the rest timer and sets `timerStartedAt` wall-clock anchor for rehydration
- `TimerState.timerStartedAt` — ISO timestamp set on `startTimer`, cleared on pause/stop/expiry. Used on rehydration to correct `remainingSeconds` for elapsed wall-clock time (handles backgrounded tabs, page reloads)
- `adjustRestDuration(delta)` — adjusts `timer.restSeconds` by delta (clamped to min 15s)
- `setRestDuration(seconds)` — sets `timer.restSeconds` to exact value (clamped to min 15s)
- `saveSession()` — creates a WorkoutLog from completed session, pushes to library.logs, returns the log. Filters out `supersetGroupId` from exercise logs before saving.
- `addExerciseToSession(exerciseId)` — appends exercise with 1 empty set to active session, navigates to it
- `deleteLog(id)` — removes a workout log from library.logs
- `addExercise(exerciseId)` — appends exercise with `instanceId: crypto.randomUUID()` and settings-based defaults
- `addExerciseToGroup(exerciseIndex, exerciseId)` — adds an exercise adjacent to `exerciseIndex` with `instanceId`, assigns both the same `supersetGroupId` (creates a new group or extends an existing one)
- `loadTemplate(name, split, exercises)` — loads a seeded workout; each exercise gets a fresh `instanceId`
- Hydration backfills `instanceId` on persisted workouts that predate the field
- `ungroupExercise(exerciseIndex)` — removes `supersetGroupId` from the exercise at `exerciseIndex`
- `goToGroup(index)` — navigates to a group by index during active session (replaces per-exercise navigation)
- `removeExercise(index)` — removes an exercise; if the removed exercise was the last member of a group, cleans up the `supersetGroupId` on the remaining member
- Reorder is group-aware: dragging reorders entire groups, not individual exercises within a group
- `addActivity(activity)` — adds an ActivityEntry to `library.activities` (type + timing)
- `removeActivity(id)` — removes an activity entry by id
- `setSoreness(entries)` — replaces all soreness entries in `library.soreness` (none/mild/moderate/severe)
- `clearSoreness()` — resets all soreness entries
- `library.soreness: SorenessEntry[]` — persisted array of {muscle, level} pairs, Zod-validated on hydration
- `library.activities: ActivityEntry[]` — persisted array of {type, timing} pairs (run/bike/swim/hike/sport/yoga + yesterday/today/tomorrow), Zod-validated on hydration
