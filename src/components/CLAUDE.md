# Component Conventions

## Architecture
- Container/Presenter split: pages are containers (hooks + logic), UI elements are presenters (pure props)
- ExerciseCard uses compound component pattern (ExerciseCard.Header, ExerciseCard.SetTracker, etc.)
- All modals/drawers use shadcn Sheet or Dialog
- All animations use Framer Motion (never raw CSS transitions for interactive elements)

## Rules
- React.memo on all list-item components (ExerciseCard, SuggestionItem, etc.)
- useCallback on all handlers passed as props to memoized children
- Touch targets minimum 44px height
- All interactive elements need aria labels
- No inline styles — Tailwind classes only
- Import lucide-react icons individually: `import { Plus } from 'lucide-react'`
