# System Architecture

## Component Hierarchy

```
App
├── LoadingScreen (while graph initializes)
├── BottomNav (fixed, 4 tabs)
└── TabContent
    ├── BuildWorkout (Tab 1)
    │   ├── TemplateSelector
    │   ├── WorkoutList
    │   │   └── ExerciseCard[] (compound component)
    │   │       ├── ExerciseCard.Header
    │   │       ├── ExerciseCard.SetRepsInputs
    │   │       ├── ExerciseCard.SwapButton
    │   │       ├── ExerciseCard.DragHandle
    │   │       └── ExerciseCard.Actions
    │   ├── SuggestionPanel
    │   ├── WorkoutStatusBar
    │   └── ExercisePicker (Sheet)
    │       └── ExerciseDetail (Sheet)
    ├── MyWorkouts (Tab 2)
    │   ├── WorkoutList (saved)
    │   └── ImportExport
    ├── ActiveWorkout (Tab 3)
    │   ├── SetTracker
    │   ├── RestTimer
    │   └── SessionProgress
    └── Settings (Tab 4)
```

## Data Flow

```
JSON files (7)
  → exercises.ts (merge all)
  → graphBuilder.ts (pure function)
  → Zustand graph slice (immutable after init)
  → Custom hooks (query layer)
  → Components (presentation)
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
- Tab-based navigation via BottomNav
- Horizontal swipe on main content area also navigates between tabs (useSwipeTabs hook)
- No URL routing — state-driven tab switching via `activeTab` in store
- Each tab is an independent subtree with its own error boundary

## Error Boundaries
- One per tab/page
- Graph/store corruption isolated per section
- Fallback UI shows error + retry button
