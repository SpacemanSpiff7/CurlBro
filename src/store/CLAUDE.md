# Store Conventions

## Slice Pattern
All state lives in a single Zustand store (src/store/index.ts) using Immer middleware.
- graphSlice — exercise graph (read-only after init, never persisted)
- builder — workout draft state, workoutSplit, suggestions, validation. `builder.workout` (the draft) is persisted to localStorage so in-progress workouts survive page refresh. Derived state (suggestions, validation, workoutSplit) is NOT persisted — recomputed from graph + exercises on render.
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
- `TimerState.timerStartedAt` — ISO timestamp set on `startTimer`, cleared on pause/stop/expiry. Used by `syncTimer` (on tab return) and rehydration (on reload) to correct `remainingSeconds` for elapsed wall-clock time.
- `adjustRestDuration(delta)` — adjusts `timer.restSeconds` by delta (clamped to min 15s)
- `adjustTimer(delta)` — adjusts `remainingSeconds` and `totalSeconds` by the same delta to maintain the wall-clock invariant (`totalSeconds - elapsed_since(timerStartedAt) = remainingSeconds`)
- `setRestDuration(seconds)` — sets `timer.restSeconds` to exact value (clamped to min 15s)
- `syncTimer()` — recalculates `remainingSeconds` from wall-clock anchor (`timerStartedAt`). Called on `visibilitychange`/`focus` events to correct timer drift after tab backgrounding. Does NOT reset `timerStartedAt`.
- `saveSession()` — creates a WorkoutLog from completed session, pushes to library.logs, returns the log. Stamps `weightUnit` / `distanceUnit` from current settings.
- `addExerciseToSession(exerciseId)` — appends exercise with 1 empty set to active session, navigates to it
- `abandonSession()` — discards current session entirely, sets session.active to null and resets timer to emptyTimer. Does NOT navigate — caller handles tab switch.
- `startSession(workout)` — creates a new preview session (startedAt: null), resets timer, navigates to Active tab. Overwrites session.active unconditionally — UI layer (MyWorkouts) guards with a confirmation dialog when a session is already active.
- `deleteLog(id)` — removes a workout log from library.logs
- `addExercise(exerciseId)` — appends exercise with `instanceId: crypto.randomUUID()` and settings-based defaults
- `addExerciseToGroup(exerciseId, targetIndex)` — adds an exercise adjacent to `targetIndex` with `instanceId`, assigns both the same `supersetGroupId` (creates a new group or extends an existing one)
- `loadTemplate(name, split, exercises)` — loads a seeded workout; each exercise gets a fresh `instanceId`
- Hydration backfills `instanceId` on persisted workouts that predate the field
- `ungroupExercise(index)` — removes `supersetGroupId` from the exercise at `index`
- `goToGroup(index)` — navigates to a group by index during active session (replaces per-exercise navigation)
- `removeExercise(index)` — removes an exercise; if the removed exercise was the last member of a group, cleans up the `supersetGroupId` on the remaining member
- Reorder is group-aware: dragging reorders entire groups, not individual exercises within a group
- `mergeExerciseIntoGroup(fromIndex, targetIndex)` — moves a single exercise into the target's superset group. Creates a new group if target is solo. Inserts after last group member. Cleans up old group if source was last member.
- `groupSelectedExercises(indices)` — creates a new superset from exercises at given indices. Moves them consecutively at the position of the first selected. Cleans up orphaned old groups. Requires ≥2 indices.
- `removeSelectedExercises(indices)` — removes exercises at given indices. Cleans up groups left with ≤1 member. Removes from end first to preserve indices.
- `updateSessionNotes(notes)` — sets the `notes` field on the active session (workout-level session notes)
- `updateLogNotes(logId, notes)` — updates `notes` on a specific workout log in `library.logs`
- `startSession(workout)` copies `WorkoutExercise.notes` → `ExerciseLog.planNotes` and initializes `session.notes` to `''`
- `saveSession()` copies `session.notes` → `WorkoutLog.notes` and preserves `planNotes` on exercise logs
- Hydration backfills `notes` on logs/sessions and `planNotes` on exercise logs (pre-notes-feature data)
- `addActivity(activity)` — adds an ActivityEntry to `library.activities` (type + timing)
- `removeActivity(id)` — removes an activity entry by id
- `setSoreness(entries)` — replaces all soreness entries in `library.soreness` (none/mild/moderate/severe)
- `clearSoreness()` — resets all soreness entries
- `addExercise()` / `addExerciseToGroup()` / `swapExercise()` / `loadTemplate()` / `addExerciseToSession()` all call `inferTrackingFlags()` to auto-set tracking flags from exercise category+equipment
- `updateExercise(index, updates)` — builder-side generic mutation used for sets, reps, rest, notes, tracking flags, prescribed duration, and other `WorkoutExercise` fields
- `settingsActions.updateSettings(partial)` — merges partial settings including `weightUnit`, `distanceUnit`, export settings, and default sets/reps/timers
- `library.soreness: SorenessEntry[]` — persisted array of {muscle, level} pairs, Zod-validated on hydration
- `library.activities: ActivityEntry[]` — persisted array of {type, timing} pairs (run/bike/swim/hike/sport/yoga + yesterday/today/tomorrow), Zod-validated on hydration
