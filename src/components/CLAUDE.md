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
- SuggestionPanel — complement, gap, and superset suggestions. Superset suggestions include context labels showing which exercise they pair with. Uses `addExerciseToGroup` to create groups.
- MarqueeText — auto-scrolling text when content overflows its container (uses ResizeObserver + framer-motion)
- ExercisePicker — exercise search/filter sheet with optional `onAdd` callback prop;
  when `onAdd` is provided, calls it instead of `builderActions.addExercise` (used in
  both Build tab and ActiveWorkout mid-session add). Auto-closes on exercise selection.
  Prevents mobile keyboard auto-focus and Chrome autocomplete. Includes flex-wrap muscle
  group filters (all 14 visible without scrolling), collapsible BodyStateInput,
  ContextFilters chips, and recovery badges on exercise rows ("Sore area" amber,
  "Good pick" green, "Recovery" blue).
- SwipeToDelete (`shared/`) — Reusable swipe-to-delete wrapper using Framer Motion drag.
  Reveals red trash icon on horizontal swipe past threshold (-80px), haptic feedback on
  delete. Has `data-swipe-row` attribute so useSwipeTabs skips tab navigation on these elements.
- WorkoutList (`workout/`) — Exercise list with dnd-kit drag-to-reorder, SwipeToDelete
  wrappers on each group, and optional inline "+" buttons between groups (via `onAddExercise` prop).
- BodyStateInput (`exercise/`) — Collapsible soreness grid (14 muscles x 4 severity levels:
  none/mild/moderate/severe) + activity chips (run/bike/swim/hike/sport/yoga with
  yesterday/today/tomorrow timing). Persisted to library.soreness and library.activities.
- ContextFilters (`exercise/`) — Smart filter chips derived from body state: Strength,
  Warm-up, Cool-down category filters; "Avoid sore [Muscle]" filters; Post-activity
  recovery; Pre-activity warm-up; Light day mode.
- SupersetContainer (`workout/`) — visual wrapper for grouped exercises with accent border, group label (Superset/Tri-set/Circuit), ungroup button, and sortable drag handle for the whole group
- GroupSetTracker (`session/`) — round-based set tracking for grouped exercises. Displays all exercises in a group side-by-side per round. Used in ActiveWorkout instead of SetTracker when the current group has multiple exercises.
- ExerciseCard — includes superset/ungroup actions in its action menu. "Add to superset" opens ExercisePicker to select an exercise to group with.
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
