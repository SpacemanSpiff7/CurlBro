# Component Conventions

## Architecture
- Container/Presenter split: pages are containers (hooks + logic), UI elements are presenters (pure props)
- ExerciseCard is a single memoized component with expandable sections (video, substitutes, set editing)
- All modals/drawers use shadcn Sheet or Dialog
- All animations use Framer Motion (never raw CSS transitions for interactive elements)

## Rules
- React.memo on all list-item components (ExerciseCard, TemplateCard, SuggestionItem, etc.)
- useCallback on all handlers passed as props to memoized children
- Touch targets minimum 44px height (use min-h-[44px])
- All interactive elements need aria labels
- Prefer Tailwind classes; inline styles acceptable only for dynamic values (dnd-kit transforms, SVG)
- Import lucide-react icons individually: `import { Plus } from 'lucide-react'`
- Use shared label constants from @/types (MUSCLE_LABELS, SPLIT_LABELS) — never duplicate

## Key Components
- ConflictWarnings — expandable conflict cards, color-coded by severity
- TemplateSelector — collapsible seeded workout categories
- VideoSheet — YouTube embed with external link fallback
- WorkoutStatusBar — push/pull ratio + missing muscle badges
- SuggestionPanel — complement, gap, and superset suggestions. Superset suggestions include context labels showing which exercise they pair with. Uses `addExerciseToGroup` to create groups.
- MarqueeText — auto-scrolling text when content overflows its container (uses ResizeObserver + framer-motion)
- ExercisePicker — exercise search/filter sheet with optional `onAdd` callback prop;
  when `onAdd` is provided, calls it instead of `builderActions.addExercise` (used in
  both Build tab and ActiveWorkout mid-session add)
- SupersetContainer (`workout/`) — visual wrapper for grouped exercises with accent border, group label (Superset/Tri-set/Circuit), ungroup button, and sortable drag handle for the whole group
- GroupSetTracker (`session/`) — round-based set tracking for grouped exercises. Displays all exercises in a group side-by-side per round. Used in ActiveWorkout instead of SetTracker when the current group has multiple exercises.
- ExerciseCard — includes superset/ungroup actions in its action menu. "Add to superset" opens ExercisePicker to select an exercise to group with.
