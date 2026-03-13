# Component Conventions

## Architecture
- Container/Presenter split: pages are containers (hooks + logic), UI elements are presenters (pure props)
- ExerciseCard is a single memoized component with expandable sections (video, substitutes, set editing)
- All modals/drawers use shadcn Sheet or Dialog
- All animations use Framer Motion (never raw CSS transitions for interactive elements)
- All pages use `PageLayout` wrapper for consistent sticky header + content padding
- Reusable confirm dialogs use `ConfirmDialog` (not inline state)
- Empty states use `EmptyState` component
- Group labels (Superset/Tri-set/Circuit) use `GroupBadge` component
- Builder drag concerns (ghost, drop cues) are handled by `BuilderGroupRow` using
  `DragGhostOverlay` and `DropIntentCue` — ExerciseCard and SupersetContainer have
  no drag/drop knowledge. ExerciseCard accepts an optional `dragHandle` slot instead.

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
- WorkoutStatusBar — push/pull ratio + muscle group count badges (sorted by count descending)
- SuggestionPanel — complement and gap suggestions ("Pairs well with", "Still need to hit"). Superset suggestions moved to per-exercise inline `SupersetPanel`.
- MarqueeText — auto-scrolling text when content overflows its container (uses ResizeObserver + framer-motion)
- ExercisePicker — exercise search/filter sheet with optional `onAdd` callback prop and
  optional `title` prop (defaults to "Add Exercise"). When `onAdd` is provided, calls it
  instead of `builderActions.addExercise` (used in Build tab, ActiveWorkout mid-session add,
  and ActiveWorkout swap-via-search). Auto-closes on exercise selection. All filters (query,
  muscle, exercise type, equipment, expanded sections) reset on close — whether by selection
  or dismiss. Prevents mobile keyboard auto-focus and Chrome autocomplete. Organized into
  4 collapsible FilterSections
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
- SwipeToReveal (`shared/`) — Swipe shell for reveal actions. When `enabled={false}`, it renders
  a plain passthrough container with `overflow-hidden` so builder drag rows are not wrapped in
  swipe/motion/overflow behavior during active drag.
- PageLayout (`shared/`) — Consistent page frame wrapper. Renders sticky TopBar with backdrop
  blur + content container. All pages use this. Props: `header`, `headerRight`, `children`,
  `contentClassName`. One place to change page padding, header behavior, safe-area handling.
- EmptyState (`shared/`) — Centered icon + title + optional subtitle + optional action slot.
  Used in ActiveWorkout (no session) and WorkoutLogPage (no logs).
- ConfirmDialog (`shared/`) — Reusable confirmation modal wrapping shadcn Dialog. Props:
  `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `destructive`, `onConfirm`.
  Used in MyWorkouts (replace active workout) and SettingsPage (delete all data).
- GroupBadge (`shared/`) — Renders Superset/Tri-set/Circuit badge via `getGroupLabel()`.
  Returns null for size <= 1. Used in SupersetContainer, ExerciseRowStack, WorkoutDetailSheet,
  LogDetailSheet, DragOverlayCard. Accepts `variant` prop ('secondary' | 'outline').
- DropIntentCue (`shared/`) — Absolutely-positioned drop intent indicators rendered at row level.
  Must be inside a `relative` parent (BuilderGroupRow's `motion.div`). Three visual states:
  reorder-before/after = cyan line in the gap between cards (`-top-[5px]`/`-bottom-[5px]`),
  merge = full-card amber overlay with "SUPERSET" label at top. Props: `dropState`, `active`.
- DragGhostOverlay (`shared/`) — Wraps children with dashed-border ghost overlay when element
  is the source of an active drag. Props: `active`, `borderRadius`, `children`.
  Used by BuilderGroupRow for both solo cards and superset containers.
- WorkoutList (`workout/`) — Exercise list with dnd-kit drag-to-reorder and drag-to-superset.
  Uses `select-none` on the container to prevent accidental text highlighting during drag.
  Uses DragOverlay for smooth drag visuals. WorkoutList owns the builder drag state and renders
  rows as stable draggable/droppable targets rather than live-sortable neighbors. Tracks real
  pointer Y via `pointermove`/`touchmove` listeners (not dnd-kit's `activatorEvent + delta`,
  which is unreliable due to sensor activation offset). Drop intent re-evaluates continuously
  as the finger moves within a card. Dragged sources keep their original height and show an
  in-place dashed ghost to avoid list jumps.
  Standalone exercises get SwipeToReveal from ExerciseCard internally (Swap/Super/Delete).
  Grouped exercises (SupersetContainer) are wrapped in SwipeToReveal with Ungroup/Delete actions.
  Accepts `editMode`, `selectedIndices`, `onToggleSelect` props for multi-select editing.
- BuilderGroupRow (`workout/`) — builder row adapter that combines `useDraggable` and
  `useDroppable`, owns all drag concerns (ghost via `DragGhostOverlay`, drop cues via
  `DropIntentCue`, merge/reorder styling). Passes a `dragHandle` slot to ExerciseCard/
  SupersetContainer. Wrapped in `motion.div` with `layout` + `layoutId` for smooth Framer
  FLIP animations on reorder. Safe with raw useDraggable/useDroppable since dnd-kit doesn't
  transform source elements (no conflict with Framer layout).
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
- SupersetContainer (`workout/`) — pure visual wrapper for grouped exercises with accent border,
  `GroupBadge` label, ungroup button, and optional `dragHandle` slot. No drag/drop knowledge —
  all drag concerns (ghost, drop cues) are handled externally by BuilderGroupRow.
- ExerciseRowStack (`session/`) — memo'd stacked exercise name rows for active workout header.
  Each exercise in the current group gets its own full-width row wrapped in `SwipeToReveal`
  with Info (opens VideoSheet) and Swap (opens SubstitutePanel) actions. Shows group label
  (Superset/Tri-set/Circuit) above multi-exercise groups via `getGroupLabel()`. Works
  uniformly for standalone exercises (single row) and supersets (multiple rows). Parent
  `ActiveWorkout` tracks swap/video targets via offset-based state (`swapTargetOffset`,
  `videoTargetOffset`) so Info/Swap work for any exercise in a group — not just the first.
  `data-swipe-row` from `SwipeToReveal` prevents exercise-navigation swipe on these rows.
- FloatingRestTimer (`session/`) — both `FloatingRestTimerInner` and internal `MiniRing` are
  `React.memo`-wrapped for render optimization. Draggable floating pill indicator showing rest timer status
  when the inline timer is scrolled out of view or user is on another tab. Rendered in App.tsx
  (always mounted, self-manages visibility via AnimatePresence). Compact pill: 24px SVG progress
  ring + M:SS text. Tap navigates to active tab + scrolls inline timer into view. Drag to any
  of 4 screen corners (top-left, top-right, bottom-left, bottom-right) with spring snap
  animation. Direction-based: drag 25% of viewport width/height to flip that axis. Corner
  preference persisted to localStorage (`curlbro_floating_timer_corner`). Uses
  `@use-gesture/react` `useDrag` with `filterTaps: true` on a plain `<div>` wrapper (avoids
  motion.* onDrag type conflict). Framer Motion `useMotionValue` for 60fps drag tracking.
  Uses `useFloatingTimerState` (wall-clock computation, read-only) and `useTimerVisibility`
  (pub/sub for IntersectionObserver data). 300ms suppression on tab switch to active to prevent
  flash. Positioned `fixed z-40` with `top:0 left:0` base + motion value transforms.
- SetTracker (`session/`) — adaptive set tracking component for standalone exercises. Renders
  input fields conditionally based on `TrackingFlags` prop: weight input (trackWeight), reps
  input (trackReps), duration input (trackDuration), distance input (trackDistance). Reads
  `weightUnit`/`distanceUnit` from store for unit labels. Uses `SwipeToDelete` for multi-set
  rows. Includes plan notes display when provided. Accepts `defaultFlags?: TrackingFlags` prop.
  Set rows split into primary (default fields, always visible) and secondary (non-default
  fields, expandable with chevron). Primary: `df.trackX && trackingFlags.trackX`. Secondary:
  `!df.trackX && trackingFlags.trackX`. `secondaryExpanded` is local state per set. Prevents
  mobile overflow by keeping checkmark/timer always visible on the primary row.
- GroupSetTracker (`session/`) — round-based set tracking for grouped exercises. Displays all
  exercises in a group side-by-side per round. Used in ActiveWorkout instead of SetTracker when
  the current group has multiple exercises. Same primary/secondary row split pattern as
  SetTracker. Accepts `defaultFlags?: TrackingFlags[]` prop (array, one per group exercise).
- StartOverlay (`session/`) — Full-screen frosted glass overlay shown when session is in preview
  state (startedAt: null). Rendered via createPortal to document.body to avoid z-index conflicts
  with tab AnimatePresence transitions. Self-contained heading, exercise/group stats chips,
  "Let's Go" start button (56px, accent-primary), "Cancel" ghost button. z-40 so BottomNav
  (z-50) remains accessible. Spring slide-up animation (stiffness: 400, damping: 30).
  Props: workoutName, exerciseCount, groupCount, onStart, onCancel.
- SupersetPanel (`exercise/`) — graph-based superset suggestion list for the current exercise.
  Uses `useSupersetSuggestions` hook. Optional `onSearchAll` callback renders a "Search all
  exercises" button. Mirrors SubstitutePanel structure. Panel shows when
  `open && (suggestions.length > 0 || onSearchAll)`.
- ExerciseCard — pure exercise presenter with no drag/drop knowledge. Uses `activePanel` enum
  state (`'none' | 'substitutes' | 'supersets'`) for mutually exclusive inline panels.
  Collapsing the card resets `activePanel` to `'none'`. Animated content uses Framer Motion
  `initial`/`animate`/`exit`. Supports edit mode: checkbox replaces drag handle, selection
  styling, disabled drag/swipe. Accepts optional `dragHandle` slot (React.ReactNode) from
  BuilderGroupRow — rendered in the header area. Drop cues and ghost rendering are handled
  externally by BuilderGroupRow using `DropIntentCue` and `DragGhostOverlay`.
  **Collapsed view** shows only fields where BOTH `defaultFlags.trackX && workoutExercise.trackX`
  (default-inferred AND user-enabled). Uses `inferTrackingFlags()` from `fieldDefaults.ts` to
  determine default flags. Non-default active fields are hidden in collapsed state.
  **Expand strip** at the bottom of the card (below plan inputs, above expandable content) —
  full-width tappable strip with chevron icon. Lights up with `bg-accent-primary/10` +
  `text-accent-primary` when expanded; subtle `text-text-tertiary` when collapsed.
  **Expanded section** layout: Rest timer input + non-default tracking inputs inline on the
  same row, then Notes textarea, then tracking flag toggles (Weight/Reps/Duration chips) +
  Ungroup button (if grouped) on the same row.
  Swap/Superset/Delete are swipe-only actions (removed from expanded view).
  Swipe-to-reveal actions: Swap/Super/Delete. Swipe "Super" opens inline SupersetPanel.
  Two ExercisePicker sheets: "Add to Superset" (from superset "Search all") and "Swap
  Exercise" (from substitute "Search all").
- AdSlot (`ads/`) — Reusable ad component accepting `slotKey: AdSlotKey`. Renders AdSense
  `<ins>` when enabled or HouseAdComponent fallback. 6 placements across all pages.
  See `ads/CLAUDE.md` for full details.
- HouseAdComponent (`ads/`) — Memo'd presenter for house ads. Renders label, headline, body,
  optional CTA link. Uses `role="complementary"` + accent color left border.
- WorkoutDetailSheet (`library/`) — Bottom sheet (80dvh) showing prescribed workout contents.
  Receives `SavedWorkout | null`, `open`, `onOpenChange`, and action callbacks (`onStart`,
  `onEdit`, `onExport`, `onDelete`). Displays header (name + "Updated {date}"), stats
  grid (exercises, total sets, groups if >0), grouped exercise breakdown via
  `deriveGroups()` + `getGroupLabel()` with accent left-border containers for supersets/
  tri-sets/circuits, and 2×2 action footer (Start, Edit, Share, Delete). Each exercise card
  shows name, category badge, sets × reps, weight (if set), rest time, muscle tags, and
  notes (if non-empty). Falls back to `exerciseId` string when graph lookup fails.
  Opened from Library tab by tapping the workout card text area (name + metadata).
- WelcomePage (`pages/`) — Full-screen welcome overlay (z-60) shown on fresh navigation.
  Two-part layout: hero (logo, title, elevated "Start Building" button with dumbbell icon,
  locked guide scroll hint) + below-fold guide sections (5 sections with whileInView animations,
  MockFilterChips/MockRestTimerRing demos, BuildGuide/RecordGuide sheet links, bottom CTA).
  Scroll locked until "Guide" button clicked (`guideUnlocked` state toggles overflow).
  Dismiss triggers: button explosion (16 radial particles), flying logo animation (portaled to
  body, 0.7s flight to TopBar position with synchronized welcome fade-out). Uses
  `welcomeState.ts` sessionStorage helpers. Re-triggerable from Settings via custom event.
- PrivacyPolicyPage — Bottom sheet (85dvh) with privacy policy content. Opened from Settings.
- AboutPage — Bottom sheet (60dvh) with app info, credits, contact links. Opened from Settings.
- BuildGuide (`pages/`) — Bottom sheet (95dvh) "Build a Workout" quick start guide with 7
  scroll-reveal sections. Uses GuideSection, ScrollProgressBar, GuideTip shared components
  and mock illustrations. Opened from Settings > Help > Quick Start.
- RecordGuide (`pages/`) — Bottom sheet (95dvh) "Record a Workout" quick start guide with 8
  scroll-reveal sections. Same shared components pattern. Opened from Settings > Help > Quick Start.
- GuideSection (`guide/`) — Scroll-reveal section wrapper with numbered step badge (spring
  scale animation), icon, title. Uses Framer Motion `whileInView` with `once: true`.
- ScrollProgressBar (`guide/`) — 2px accent progress bar using `useScroll({ container })` +
  `useTransform`. Accepts `RefObject<HTMLDivElement | null>`.
- GuideTip (`guide/`) — Pro tip callout with Lightbulb icon in `text-warning`.
- Mock illustrations (`guide/illustrations/`) — 8 self-contained visual demos (MockExerciseCard,
  MockSwipeReveal, MockSetRows, MockRestTimerRing, MockDotIndicators, MockDropZones,
  MockFilterChips, MockStatusBar). Use design tokens + Framer Motion but no real app imports.
- CookieConsent (`shared/`) — EU cookie consent banner for Consent Mode v2. Fixed bottom bar
  above BottomNav. Accept/Reject with equal visual weight (EU compliance). Stores choice in
  `localStorage` key `curlbro_cookie_consent`. Exports `resetCookieConsent()` for Settings
  "Manage Cookies" button. Updates `gtag('consent', 'update', ...)` on accept.
