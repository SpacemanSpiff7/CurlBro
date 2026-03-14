# CurlBro

## What
Client-side React workout builder using an exercise graph (345 exercises, 3000+ edges).
Mobile-first, light/dark theme support (next-themes), static deployment. Zero server-side processing.
Library (My Workouts) is the default/leftmost tab — users land on their saved workouts first.
Supports superset/tri-set/circuit grouping — exercises sharing a `supersetGroupId` are
grouped visually and navigated as a unit during active sessions.
Includes a body state system (soreness tracking + recent activities) with auto-applied
exercise filtering (excludes sore/fatigued muscles, boosts recovery exercises).
Flexible exercise tracking: per-exercise tracking flags (weight/reps/duration/distance)
auto-inferred from category+equipment. Unit preferences (lb/kg, mi/km) with conversion.

## Tech Stack
- React 19 / TypeScript (strict) / Vite 7
- Zustand (state) + Immer (immutable updates) + Zod (validation)
- shadcn/ui + Tailwind CSS 4 + Framer Motion
- @dnd-kit for drag-to-reorder
- @use-gesture/react for directional-locked swipe gestures (tab navigation, swipe-to-reveal)
- Fuse.js for fuzzy search
- sonner for toast notifications
- Vitest + React Testing Library (unit/integration)

## Critical Commands
- Dev: `npm run dev`
- Build: `npm run build` (runs prebuild → tsc -b → vite build)
- Typecheck (strict): `npx tsc -b` (builds both tsconfig.app.json + tsconfig.node.json — this is what CI runs, catches issues `tsc --noEmit` misses)
- Typecheck (quick): `npx tsc --noEmit` (faster but less strict — use `tsc -b` before committing)
- Lint: `npm run lint`
- Test (unit): `npm run test` (Vitest)
- Test (unit, watch): `npm run test:watch`
- Test (single file): `npx vitest run src/path/to/file.test.ts`
- Test (coverage): `npm run test:coverage`
- E2E: not currently configured in-repo (see `docs/phase-checklist.md`)

## Code Style
- ES modules only (import/export), never CommonJS (require)
- Functional components with hooks, never class components
- Destructure imports: `import { useState } from 'react'`
- Branded types for IDs (ExerciseId, WorkoutId) — see src/types/index.ts
- Zod schemas double as runtime validators AND TypeScript types
- All graph queries go through custom hooks — components never access the graph directly
- All state mutations go through Zustand actions — components never mutate state directly
- Shared display labels live in src/types/index.ts (MUSCLE_LABELS, SPLIT_LABELS, CATEGORY_LABELS, ACTIVITY_LABELS) — never duplicate

## Architecture Docs (read before working on related areas)
- `docs/architecture.md` — system architecture, data flow, component hierarchy
- `docs/graph-spec.md` — exercise graph structure, edge semantics, query patterns
- `docs/testing-strategy.md` — test philosophy, patterns, what to test per component type
- `docs/design-system.md` — colors, typography, spacing, animation specs
- `docs/import-export-spec.md` — sharing format specification, parser rules
- `docs/phase-checklist.md` — implementation phases with acceptance criteria

## Directory-Level Docs
Each major directory has its own CLAUDE.md with specific conventions:
- `src/store/CLAUDE.md` — Zustand slice patterns, persistence rules
- `src/components/CLAUDE.md` — component architecture, key components
- `src/components/ads/CLAUDE.md` — ad system architecture, placements, AdSense activation checklist
- `src/hooks/CLAUDE.md` — hook patterns, memoization rules
- `src/utils/CLAUDE.md` — utility function conventions
- `tests/CLAUDE.md` — testing conventions and patterns

## Key Data Files
- `src/data/01-09_*.json` — 9 exercise catalog JSON files with 345 exercises (strength, stretching/mobility, cardio)
- `src/data/00_schema_and_metadata.json` — schema, metadata, movement/equipment catalogs, and authoring notes for the dataset
- `src/data/08_stretching_mobility.json` — stretching/mobility exercises (dynamic stretches, static stretches, mobility drills)
- `src/data/09_cardio_warmup.json` — cardio and conditioning exercises (treadmill, bike, rower, sled push/pull, etc.)
- `src/data/exerciseConflicts.ts` — exercise conflicts with scientific citations
- `src/data/seededWorkouts.ts` — pre-built workout templates across 4 difficulty tiers
- `src/utils/logUtils.ts` — log display/export helpers (computeLogStats, logToSavedWorkout, formatLogForClipboard, formatLogForShare)
- `src/utils/calorieEstimate.ts` — MET-based calorie estimation (estimateCalories, pure function, requires bodyWeightKg + graph)
- `src/utils/tcxExport.ts` — Strava-compatible TCX XML generator (generateTcx, pure function, string-based XML)
- `src/utils/groupUtils.ts` — superset group derivation (deriveGroups, getGroupLabel, ExerciseGroup interface)
- `public/exercises.json` — generated exercise catalog (run `npx tsx scripts/generate-exercises.ts`)
- `public/llms.txt` — LLM workout generation instructions (import format + guidance)
- `public/robots.txt` — points crawlers to llms.txt, exercises.json, and sitemap.xml
- `public/sitemap.xml` — sitemap for search engine crawlers
- `public/manifest.json` — PWA web app manifest
- `public/ads.txt` — AdSense publisher verification (placeholder until approved)
- `src/config/ads.ts` — ad slot definitions, AdSense kill switch (`import.meta.env.PROD && false`), publisher ID
- `src/data/houseAds.ts` — 24 house ads across 5 categories (tips)
- `src/components/shared/CookieConsent.tsx` — EU cookie consent banner + Consent Mode v2 integration
- `src/utils/fieldDefaults.ts` — `inferTrackingFlags(exercise)` — auto-infers tracking flags from category+equipment
- `src/utils/unitConversion.ts` — weight/distance conversion (lb↔kg, mi↔km) and formatting
- `src/utils/cookieConsent.ts` — cookie consent utilities (CONSENT_KEY, resetCookieConsent)
- `src/utils/welcomeState.ts` — welcome page sessionStorage helpers (hasSeenWelcome, markWelcomeSeen, resetWelcomeSeen)
- `src/pages/WelcomePage.tsx` — full-screen welcome overlay with hero, guide sections, flying logo animation
- `public/guide/index.html` — static User Guide (standalone HTML)
- `public/programming/index.html` — static Programming Guide (standalone HTML)

## Custom Agents
- `@exercise-validator` — Validates all exercise JSON files: schema completeness, ID uniqueness, cross-reference integrity, scientific plausibility (movement patterns, muscle targeting, workout position). Run after adding/modifying exercise data.
- `@ui-scaffolder` — Generates new React components following CurlBro conventions (dark-mode tokens, 44px touch targets, React.memo, aria-labels, Framer Motion). Pass a description of what you need.
- `@graph-checker` — Validates exercise graph integrity: edge symmetry, orphan nodes, muscle coverage, dangling references, conflict data. Run after modifying exercise relationships.

Agent definitions live in `.claude/agents/`.

## Workflow
1. Read relevant docs before starting work on any area
2. Use Plan Mode (Shift+Tab twice) before multi-file changes
3. Write or update tests for every change
4. Run `npx tsc -b` after TypeScript changes (strict build — matches CI)
5. Run `npx vitest run` to verify tests pass
6. Run `npm run lint` before committing
7. **Update docs**: After completing changes, update any affected documentation:
   - This `CLAUDE.md` — if commands, key files, known quirks, or architecture changed
   - Directory-level `CLAUDE.md` files — if component conventions, hook patterns, or store actions changed
   - `docs/*.md` — if architecture, graph spec, or design system changed
   - Auto-memory (`MEMORY.md`) — if new gotchas, patterns, or file locations were discovered
   - Keep counts accurate (exercise count, test count, edge count)
8. Commit with conventional commits: feat:, fix:, test:, docs:, refactor:
9. Run `@exercise-validator` after modifying exercise JSON data
10. Run `@graph-checker` after modifying exercise relationships or graph builder

## Git Strategy
- Work on main branch (initial development phase)
- Commit after each meaningful unit of work
- Never commit failing tests or type errors

## Known Quirks
- React.lazy code splitting: All 6 tab pages are lazy-loaded in `App.tsx` via
  `React.lazy(() => import(...).then(m => ({ default: m.NamedExport })))` — the `.then()`
  wrapper is required because pages use named exports, not default exports. Heavy sheets
  and overlays (ExercisePicker, VideoSheet, SubstitutePanel, StartOverlay, WorkoutDetailSheet,
  AboutPage, PrivacyPolicyPage, TermsOfUsePage, BuildGuide, RecordGuide) are also lazy-loaded
  in their respective page files. Wrap render sites in `<Suspense fallback={null}>`.
- Exercise JSON is dynamically imported: `getAllExercises()` in `src/data/exercises.ts` is
  `async` — returns `Promise<RawExercise[]>`. `initGraph()` in the store is also async.
  Tests that use `getAllExercises()` must use `beforeAll(async () => ...)` instead of
  module-level calls. `exerciseFiles` export replaced with `getExerciseFiles()` (async).
- Flexible tracking flags: `TrackingFlags` (`trackWeight`, `trackReps`, `trackDuration`,
  `trackDistance`) on `WorkoutExercise` and `ExerciseLog`. Auto-inferred by
  `inferTrackingFlags()` from exercise category+equipment. Hydration backfills old data
  with safe defaults (`trackWeight: true, trackReps: true, trackDuration: false,
  trackDistance: false`). Fields are split into "default" (inferred from exercise) and
  "non-default" (user-enabled beyond defaults). Builder ExerciseCard collapsed view only
  shows default-active fields (`defaultFlags.trackX && workoutExercise.trackX`); non-default
  active fields appear in expanded section under "Additional tracking". SetTracker and
  GroupSetTracker split rows into primary (default fields, always visible) and secondary
  (non-default fields, expandable with chevron) to prevent mobile overflow. Both accept
  `defaultFlags?: TrackingFlags` prop.
- Unit preferences: `WeightUnit` ('lb'|'kg') and `DistanceUnit` ('mi'|'km') in settings.
  Logs stamp `weightUnit`/`distanceUnit` at save time. Display converts when log unit
  differs from current setting. Export uses configured unit.
- Session state (active workout, recorded sets, rest timer) is persisted to localStorage.
  `TimerState.timerStartedAt` is a wall-clock anchor — `remainingSeconds` is corrected
  for elapsed time on rehydration (page reload) and on `visibilitychange`/`focus` events
  (tab return, screen unlock). Both timers (rest countdown via `syncTimer()` and elapsed
  workout via snapshot recomputation) auto-correct when the user returns to the app.
  Zod schemas (`ActiveSessionSchema`, `TimerStateSchema`) validate session data on hydration;
  invalid data resets to defaults rather than crashing.
- iOS auto-zoom on input focus: all `<input>`/`<textarea>` elements must use `text-base md:text-sm`
  (16px on mobile, 14px on desktop). WebKit auto-zooms when font-size < 16px and never
  auto-resets. The shadcn `Input` component already has this; avoid passing `text-sm` in
  className (twMerge overrides the safe base class).
- `endSession()` only sets `completedAt` and stops the timer — call `saveSession()` separately to create the log.
  Session end paths in ActiveWorkout call `resetBuilderIfMatchesSession()` — only clears
  the builder when the draft matches the session's workout or is empty (preserves unrelated drafts).
- `builder.isDirty` flag tracks unsaved builder mutations. Set `true` by all mutation actions,
  `false` by `loadWorkout`, `resetWorkout`, `loadTemplate`, and `saveWorkout` (when saving current draft).
  NOT persisted — resets on reload. BottomNav reads it for the Build tab dirty dot.
- Edit-in-session guard: editing a workout that has an active session shows a dialog
  (MyWorkouts.tsx). Uses discriminated union `LibraryDialog` to prevent dialog stacking.
  `endSession → saveSession → abandonSession → loadWorkout` flow for "Save & Edit".
- BuildWorkout shows "Unsaved changes" indicator (orange dot + text) below Save when
  `hasUnsavedChanges` memo detects differences. Non-blocking toast on unmount when dirty.
  Info banner when editing the active session's workout.
- WorkoutExercise has an optional `instanceId` field (UUID) used as stable React keys and
  dnd-kit group IDs. Generated via `crypto.randomUUID()` on add/import/template-load.
  Hydration backfills `instanceId` on persisted data missing it. Local component state
  (expanded, video open) may still not follow items on drag reorder.
- The Immer middleware wraps `set()` automatically — no explicit `produce()` call needed
- `navigator.clipboard` requires HTTPS — wrap in try/catch for HTTP dev environments
- Exercise JSON `equipment` and `primary_muscles` fields are validated as `z.string()` arrays,
  not typed enums — the Zod schema is looser than the TypeScript types
- Exercise categories expanded: `compound`, `isolation`, `stretch_dynamic`, `stretch_static`, `mobility`, `cardio`
- `foam_roller` is a valid equipment type (used by mobility exercises)
- Cardio equipment types: `treadmill`, `elliptical`, `stationary_bike`, `rowing_machine`, `stair_climber`, `jump_rope`
- Public asset paths in JSX must use `import.meta.env.BASE_URL` prefix — hardcoded `/foo.png`
  breaks in production where base is `/curlbro/`. Vite only rewrites paths in index.html, not JSX.
- Ad system uses a two-tier approach: Google AdSense (programmatic, behind `ADSENSE_ENABLED`
  kill switch) with house ad fallbacks. Currently house ads only — see
  `src/components/ads/CLAUDE.md` for activation checklist. `ADSENSE_ENABLED` uses
  `import.meta.env.PROD && false` to prevent loading in dev mode.
- Consent Mode v2 defaults in `index.html` must come BEFORE the gtag.js script load.
  Cookie consent banner updates consent via `gtag('consent', 'update', ...)`.
- `index.html` has SEO meta tags, OG/Twitter cards, JSON-LD structured data, and a
  `<noscript>` fallback with indexable content. OG image URLs are absolute (social
  crawlers don't resolve relative URLs). Google Search Console verified via DNS.
- Dynamic `document.title` updates per tab via `TAB_TITLES` map in `App.tsx`.
  Title is "CurlBro" during welcome, "CurlBro — Tab Name" for tabs.
- Welcome page (`WelcomePage.tsx`) shows on fresh navigation (sessionStorage-based via
  `welcomeState.ts`). Full-screen `fixed inset-0 z-60` overlay above BottomNav (z-50).
  Hero section fills viewport with logo, title, elevated "Start Building" button (dumbbell
  icon + text, tactile press animation), and locked guide section (scroll unlocks on "Guide"
  button click). On dismiss: button explodes (16 particles), logo flies to TopBar position
  (0.7s, portaled to body), welcome fades out in sync. Re-triggerable from Settings > Help >
  "Show Welcome Page" via `resetWelcomeSeen()` custom event. Swipe gestures disabled while
  welcome is visible.
- `overscroll-behavior-y: contain` on html/body prevents pull-to-refresh on iOS/Android Chrome.
- Swipe gestures use `@use-gesture/react` with `axis: 'lock'` — first ~10px of touch decides
  vertical (scroll) vs horizontal (swipe). Vertical wins → all swipe handlers ignored.
- Builder drag-and-drop uses explicit mobile-friendly drop zones (top 20% = reorder before,
  center 60% = merge into superset, bottom 20% = reorder after). Reorder shows cyan line
  in gap between cards; merge shows full-card amber overlay with "SUPERSET" label. Drop
  intent tracks real pointer Y via `pointermove`/`touchmove` listeners (not dnd-kit's
  `activatorEvent + delta` which is offset by sensor activation distance). Intent re-evaluates
  continuously as finger moves within a card. Dragged cards/groups keep their exact height
  with an in-place dashed ghost instead of collapsing.
- `SwipeToReveal` uses a module-level singleton to ensure only one row is open at a time.
  `closeAllSwipeRows()` is called on tab switch. The `data-swipe-row` attribute blocks
  tab swipe navigation. `data-dnd-handle` attribute blocks swipe-to-reveal on drag handles.
- `@use-gesture/react` `bind()` props conflict with Framer Motion `motion.div` `onDrag` type.
  Spread `bind()` onto a plain `<div>` wrapper, not a `motion.*` component.
- Tab transitions use `AnimatePresence` + `motion.div` with a `direction` state variable.
  Do NOT use a ref for direction — React 19 `react-hooks/refs` lint rule forbids ref reads
  during render.
- Theme is managed by `next-themes` ThemeProvider (attribute="class", defaultTheme="dark",
  storageKey="curlbro_theme"). CSS variables in `:root` (light) and `.dark` (dark) drive
  all colors — `@theme inline` maps them to Tailwind utilities. Colors that were previously
  hardcoded in `@theme` are now dynamic via `@theme inline` + CSS variables.
- Sonner Toaster uses `useTheme()` from next-themes for `resolvedTheme` to set its theme prop.
- Test files under `src/` are compiled by `tsc -b` via `tsconfig.app.json` — they must NOT
  use jest-dom matchers (`toBeInTheDocument`, `toHaveAttribute`). Use vitest-native assertions
  (`toBeTruthy`, `toBeNull`, `getAttribute()`) instead. Jest-dom types are only available at
  vitest runtime via `vitest.setup.ts`, not during `tsc -b`.
- StartOverlay (session preview): full-screen overlay at z-40 covers TopBar and exercise
  content when startedAt is null. Rendered via createPortal to document.body to prevent
  black screen during tab transition animations. BottomNav (z-50) remains accessible.
  Cancel calls abandonSession() then setActiveTab('library'). The old inline TopBar "Start"
  button was removed.
- swipeInterceptor in App.tsx checks `!session.startedAt` — during preview state, swipe
  gestures navigate tabs normally instead of being consumed by exercise-group navigation.
- Starting a new workout while one is active shows a confirmation dialog (MyWorkouts.tsx).
  Uses abandonSession() to cleanly discard the previous session before calling startSession().
- Builder clear flow: no top-bar Clear button. Bottom Clear button opens a 3-option
  shadcn Dialog: "Save & Clear" / "Clear Without Saving" / "Cancel".
- `startSession(workout)` pre-populates `SetLog.reps` from `ex.reps`, `SetLog.durationSeconds`
  from `ex.durationSeconds`, and `timer.restSeconds` from the first exercise's `restSeconds`
  (default 90).
- `addSet()` inherits `weight`, `reps`, `durationSeconds`, `distanceMeters` from the last
  existing set instead of creating empty sets.
