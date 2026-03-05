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
- SuggestionPanel — complement, gap, and superset suggestions
- MarqueeText — auto-scrolling text when content overflows its container (uses ResizeObserver + framer-motion)
- ExercisePicker — exercise search/filter sheet with optional `onAdd` callback prop;
  when `onAdd` is provided, calls it instead of `builderActions.addExercise` (used in
  both Build tab and ActiveWorkout mid-session add)
