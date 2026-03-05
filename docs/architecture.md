# System Architecture

## Component Hierarchy

```
App
├── LoadingScreen (while graph initializes)
├── BottomNav (fixed, 5 tabs)
└── TabContent
    ├── BuildWorkout (Tab 1)
    │   ├── TemplateSelector
    │   ├── WorkoutList
    │   │   ├── SupersetContainer[] (grouped exercises)
    │   │   └── ExerciseCard[] (compound component)
    │   │       ├── ExerciseCard.Header
    │   │       ├── ExerciseCard.SetRepsInputs
    │   │       ├── ExerciseCard.SwapButton
    │   │       ├── ExerciseCard.DragHandle
    │   │       └── ExerciseCard.Actions
    │   ├── SuggestionPanel
    │   ├── WorkoutStatusBar
    │   └── ExercisePicker (Sheet)
    │       ├── BodyStateInput (collapsible)
    │       ├── ContextFilters (smart chips)
    │       └── ExerciseDetail (Sheet)
    ├── MyWorkouts (Tab 2)
    │   ├── WorkoutList (saved)
    │   └── ImportExport
    ├── ActiveWorkout (Tab 3)
    │   ├── SetTracker / GroupSetTracker
    │   ├── RestTimer (rightSlot: wake lock button)
    │   ├── SessionProgress
    │   ├── ExercisePicker (Sheet, mid-session add)
    │   └── LogSummarySheet (post-save stats)
    ├── WorkoutLogPage (Tab 4)
    │   ├── LogRow[] (sorted by completedAt desc)
    │   └── LogDetailSheet (full breakdown + export)
    └── Settings (Tab 5)
```

## Data Flow

```
JSON files (8, including stretching/mobility)
  → exercises.ts (merge all)
  → graphBuilder.ts (pure function)
  → Zustand graph slice (immutable after init)
  → Custom hooks (query layer)
  → Components (presentation)

Body state (soreness + activities)
  → library.soreness / library.activities (persisted)
  → BodyStateInput (user input)
  → ContextFilters (derived filter chips)
  → useExerciseSearch (contextFilter parameter)
  → ExercisePicker (filtered + badged results)
```

## State Management

| Slice    | Persisted | Middleware      | Purpose                   |
|----------|-----------|-----------------|---------------------------|
| graph    | No        | immer           | Exercise graph (read-only)|
| builder  | No        | immer           | Workout draft in progress |
| library  | Yes       | immer + persist | Saved workouts & logs     |
| session  | No        | immer           | Active workout tracking   |
| settings | Yes       | immer + persist | User preferences          |

### Hydration Strategy
- `persist` middleware stores `library` and `settings` to localStorage
- On hydration, each stored object is validated with its Zod schema
- Invalid data is silently dropped (reset to defaults)
- App never crashes on corrupt localStorage

## Navigation
- Tab-based navigation via BottomNav (Build, Library, Active, Log, Settings)
- Horizontal swipe on main content area also navigates between tabs (useSwipeTabs hook).
  Active tab intercepts swipes to navigate between exercise groups first; tab navigation
  only occurs at the first/last exercise edge.
- No URL routing — state-driven tab switching via `activeTab` in store
- Each tab is an independent subtree with its own error boundary

## Session & Log Flow
1. User starts a workout from Library → ActiveWorkout enters preview mode
2. User taps Start → session begins, timer starts, sets can be tracked
3. User can add exercises mid-session via + button (opens ExercisePicker)
4. User taps Finish → `endSession()` sets `completedAt`, freezes timer
5. User taps Save → `saveSession()` creates WorkoutLog, pushes to `library.logs`, shows summary sheet
6. Logs are viewable on the Log tab with full breakdown, clipboard export, and "Save as Workout" conversion

## Superset Grouping

### Data Model
- `WorkoutExercise.supersetGroupId?: string` — exercises sharing the same ID form a group (superset/tri-set/circuit)
- `ExerciseLog.supersetGroupId?: string` — preserves grouping in completed workout logs
- Groups are implicit: any exercises with the same `supersetGroupId` are grouped
- No separate "group" entity — grouping is derived at render time via `deriveGroups()`

### Group Derivation
`deriveGroups()` in `src/utils/groupUtils.ts` scans the exercise list and produces an `ExerciseGroup<T>[]` array:
- Consecutive exercises with the same `supersetGroupId` form a group
- Exercises without a `supersetGroupId` become solo groups
- `getGroupLabel()` returns "Superset" (2 exercises), "Tri-set" (3), or "Circuit" (4+)
- Used by both `useBuilderGroups` (build tab) and `useSessionGroups` (active session)

### Group-Aware Navigation
- `ActiveSession.currentGroupIndex` tracks the current group (renamed from `currentExerciseIndex`)
- `goToGroup(index)` navigates between groups during active workout
- Groups are navigated as a unit — all exercises in a group are visible simultaneously

### Round-Based Set Tracking
- `GroupSetTracker` renders all exercises in a group side-by-side for each round
- A "round" corresponds to one pass through all exercises in the group
- Users complete sets for each exercise in the group before advancing to the next round

### Builder Integration
- `SupersetContainer` wraps grouped exercises with an accent border and group label
- Users group exercises via ExerciseCard actions or by accepting superset suggestions
- `addExerciseToGroup(exerciseIndex, exerciseId)` creates/extends a group
- `ungroupExercise(exerciseIndex)` removes an exercise from its group
- Drag-and-drop reordering is group-aware (reorders entire groups)

## Error Boundaries
- One per tab/page
- Graph/store corruption isolated per section
- Fallback UI shows error + retry button
