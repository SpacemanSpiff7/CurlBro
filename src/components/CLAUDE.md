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
- Use `@ui-scaffolder` agent to generate new components — it knows the design tokens, touch
  target rules, memo/callback patterns, and animation specs. See `.claude/agents/ui-scaffolder.md`

## Key Components
- ConflictWarnings — expandable conflict cards, color-coded by severity. Groups conflicts with the same reason into a single card listing all involved exercises.
- TemplateSelector — collapsible seeded workout categories
- VideoSheet — YouTube embed with external link fallback
- WorkoutStatusBar — push/pull ratio + missing muscle badges
- SuggestionPanel — complement and gap suggestions ("Pairs well with", "Still need to hit"). Superset suggestions moved to per-exercise inline `SupersetPanel`.
- MarqueeText — auto-scrolling text when content overflows its container (uses ResizeObserver + framer-motion)
- ExercisePicker — exercise search/filter sheet with optional `onAdd` callback prop and
  optional `title` prop (defaults to "Add Exercise"). When `onAdd` is provided, calls it
  instead of `builderActions.addExercise` (used in Build tab, ActiveWorkout mid-session add,
  and ActiveWorkout swap-via-search). Auto-closes on exercise selection. Prevents mobile
  keyboard auto-focus and Chrome autocomplete. Organized into 4 collapsible FilterSections
  with colored headers: Exercise Type (green, single-select strength/warmup/cooldown),
  Muscles (blue, multi-select 14 alphabetized), Equipment (violet, multi-select 7 groups),
  Body State (amber, contains BodyStateInput). Each section shows badge count when collapsed.
  "Recovery" badge (blue) shown on recovery-category exercises targeting sore/fatigued muscles.
- SubstitutePanel (`exercise/`) — graph-based substitute list for the current exercise.
  Optional `onSearchAll` callback renders a "Search all exercises" button at the bottom,
  allowing users to open ExercisePicker for swap. Panel shows when `open && (substitutes.length > 0 || onSearchAll)`.
- SwipeToReveal (`shared/`) — iOS Mail-style swipe-to-reveal actions component using
  `@use-gesture/react` `useDrag` + Framer Motion. Accepts an array of `SwipeAction` objects
  (key, label, icon, color, onAction). Uses `axis: 'lock'` for directional locking. Module-level
  singleton ensures only one row open at a time. `closeAllSwipeRows()` export for programmatic
  close. Checks `[data-dnd-handle]` to skip gesture on drag handles. Has `data-swipe-row`
  attribute so `useSwipeGesture` skips tab navigation on these elements.
- SwipeToDelete (`shared/`) — Thin wrapper around `SwipeToReveal` with a single Delete action.
  Swiping reveals a Delete button requiring tap to confirm (no auto-delete on release).
  API preserved: `onDelete`, `children`, `enabled`. Used by SetTracker, GroupSetTracker,
  WorkoutList (for grouped exercises).
- WorkoutList (`workout/`) — Exercise list with dnd-kit drag-to-reorder and drag-to-superset.
  Uses DragOverlay for smooth drag visuals. Drop intent (reorder vs superset) detected via
  pointer Y position relative to target card (top/bottom 30% = reorder, center 40% = superset).
  Standalone exercises get SwipeToReveal from ExerciseCard internally (Swap/Super/Delete).
  Grouped exercises (SupersetContainer) are wrapped in SwipeToReveal with Ungroup/Delete actions.
  Accepts `editMode`, `selectedIndices`, `onToggleSelect` props for multi-select editing.
- DragOverlayCard (`workout/`) — Simplified read-only card shown during drag. Displays exercise
  name, muscle tags, sets × reps. For groups: shows group label + stacked card preview.
  Styled with `scale-[1.03]` + elevated shadow per design system.
- EditModeBar (`workout/`) — Floating action bar for edit mode. Shows selected count, Select All,
  Group (≥2 selected), Delete buttons. Positioned above BottomNav with spring slide-up animation.
  Wrapped in AnimatePresence for enter/exit.
- FilterSection (`exercise/`) — Reusable collapsible section with colored header text,
  optional active-filter count badge, AnimatePresence height animation. Used by ExercisePicker
  for Exercise Type, Muscles, Equipment, and Body State sections.
- BodyStateInput (`exercise/`) — Binary soreness (14 muscles, alphabetized, sore/not-sore
  toggle with orange styling) + activity timing chips (Yesterday/Today/Tomorrow) with
  expandable sub-row for activity types (Run/Bike/Swim/Hike/Sport/Yoga). Timing without
  specific activity creates 'general' entry. Persisted to library.soreness and library.activities.
  Soreness and activity effects are auto-applied by useExerciseSearch (no manual filter needed).
- SupersetContainer (`workout/`) — visual wrapper for grouped exercises with accent border, group label (Superset/Tri-set/Circuit), ungroup button, and sortable drag handle for the whole group
- ExerciseRowStack (`session/`) — memo'd stacked exercise name rows for active workout header.
  Each exercise in the current group gets its own full-width row wrapped in `SwipeToReveal`
  with Info (opens VideoSheet) and Swap (opens SubstitutePanel) actions. Shows group label
  (Superset/Tri-set/Circuit) above multi-exercise groups via `getGroupLabel()`. Works
  uniformly for standalone exercises (single row) and supersets (multiple rows). Parent
  `ActiveWorkout` tracks swap/video targets via offset-based state (`swapTargetOffset`,
  `videoTargetOffset`) so Info/Swap work for any exercise in a group — not just the first.
  `data-swipe-row` from `SwipeToReveal` prevents exercise-navigation swipe on these rows.
- GroupSetTracker (`session/`) — round-based set tracking for grouped exercises. Displays all exercises in a group side-by-side per round. Used in ActiveWorkout instead of SetTracker when the current group has multiple exercises.
- StartOverlay (`session/`) — Full-screen frosted glass overlay shown when session is in preview state (startedAt: null). Self-contained heading, exercise/group stats chips, "Let's Go" start button (56px, accent-primary), "Cancel" ghost button. z-40 so BottomNav (z-50) remains accessible. Spring slide-up animation (stiffness: 400, damping: 30). Props: workoutName, exerciseCount, groupCount, onStart, onCancel.
- SupersetPanel (`exercise/`) — graph-based superset suggestion list for the current exercise.
  Uses `useSupersetSuggestions` hook. Optional `onSearchAll` callback renders a "Search all
  exercises" button. Mirrors SubstitutePanel structure. Panel shows when
  `open && (suggestions.length > 0 || onSearchAll)`.
- ExerciseCard — uses `activePanel` enum state (`'none' | 'substitutes' | 'supersets'`) for
  mutually exclusive inline panels. Collapsing the card resets `activePanel` to `'none'`.
  Sortable wrapper is a plain `<div>` (dnd-kit only); animated content uses Framer Motion
  `initial`/`animate`/`exit` (NOT `layout` — conflicts with dnd-kit transforms). Shows ghost
  placeholder when `isDragging`. Supports edit mode: checkbox replaces drag handle, selection
  styling, disabled drag/swipe. `isDropTarget` prop shows highlight ring for superset merge.
  Includes superset/ungroup actions in its expand menu AND swipe-to-reveal actions
  (Swap/Super/Delete). Swipe "Super" opens inline SupersetPanel (not ExercisePicker sheet).
  Two ExercisePicker sheets: "Add to Superset" (from superset "Search all") and "Swap
  Exercise" (from substitute "Search all"). Drag handle has `data-dnd-handle` attribute
  to prevent swipe gesture conflicts.
- AdSlot (`ads/`) — Reusable ad component accepting `slotKey: AdSlotKey`. Renders AdSense
  `<ins>` when enabled or HouseAdComponent fallback. 6 placements across all pages.
  See `ads/CLAUDE.md` for full details.
- HouseAdComponent (`ads/`) — Memo'd presenter for house ads. Renders label, headline, body,
  optional CTA link. Uses `role="complementary"` + accent color left border.
- PrivacyPolicyPage — Bottom sheet (85dvh) with privacy policy content. Opened from Settings.
- AboutPage — Bottom sheet (60dvh) with app info, credits, contact links. Opened from Settings.
- CookieConsent (`shared/`) — EU cookie consent banner for Consent Mode v2. Fixed bottom bar
  above BottomNav. Accept/Reject with equal visual weight (EU compliance). Stores choice in
  `localStorage` key `curlbro_cookie_consent`. Exports `resetCookieConsent()` for Settings
  "Manage Cookies" button. Updates `gtag('consent', 'update', ...)` on accept.
