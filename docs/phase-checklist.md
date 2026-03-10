# Phase Checklist

## Phase 1: Foundation ✅
- [x] Vite + React + TypeScript + Tailwind 4 + shadcn/ui setup
- [x] Type system with branded types and Zod schemas
- [x] Exercise JSON files in src/data/
- [x] graphBuilder.ts — raw data → ExerciseGraph
- [x] Zustand store with all slices
- [x] Vitest + testing infrastructure
- [x] Test fixture graph (8 exercises)
- [x] Bottom nav shell (expanded later to 5 tabs)
- [x] CSS custom properties + Google Fonts
- [x] Graph builds with 345 exercises, 3000+ edges
- [x] Full dataset edge integrity tests pass
- [x] `npm run build` succeeds with zero errors

## Phase 2: Core Builder ✅
- [x] useExerciseSearch hook (Fuse.js)
- [x] ExercisePicker (Sheet, search, filters)
- [x] ExerciseCard compound component
- [x] WorkoutList with dnd-kit reorder
- [x] BuildWorkout page with FAB
- [x] builderSlice tests
- [x] All tests pass, coverage > 80% on hooks

## Phase 3: Intelligence ✅
- [x] useSuggestions hook
- [x] SuggestionPanel
- [x] useSubstitutes hook
- [x] SubstitutePanel
- [x] useWorkoutValidation hook
- [x] WorkoutStatusBar
- [x] TemplateSelector

## Phase 4: Persistence & Sharing ✅
- [x] Library persistence (Zustand persist)
- [x] MyWorkouts page
- [x] formatExport.ts
- [x] parseImport.ts
- [x] ImportExport component
- [x] Round-trip tests

## Phase 5: Live Workout ✅
- [x] Session tracking (sessionSlice)
- [x] SetTracker
- [x] useRestTimer hook
- [x] RestTimer UI
- [x] ActiveWorkout page
- [x] Session progress navigation
- [x] SettingsPage with rest timer defaults

## Phase 6: Polish & E2E ✅
- [x] Error boundaries (per tab)
- [x] Empty states
- [x] Production build succeeds
- [ ] Framer Motion animations (already integrated throughout)
- [ ] Playwright E2E tests (infrastructure not yet set up)
- [ ] Accessibility audit
- [ ] Performance audit

## Phase 7: Workout Log & Save Flow ✅
- [x] Split endSession/saveSession — explicit save step after finishing
- [x] Save button in completed state (replaces disabled "Done")
- [x] Post-save summary sheet (date, duration, exercises, total weight)
- [x] Add exercise mid-session via ExercisePicker (+ button next to dots)
- [x] ExercisePicker `onAdd` prop for reuse in active session
- [x] WorkoutLogPage — log list sorted by completedAt descending
- [x] Log detail sheet with full exercise/set breakdown
- [x] "Save as Workout" — convert log to SavedWorkout with weights prefilled
- [x] "Copy" — formatted clipboard export of completed workout
- [x] Delete log with confirmation
- [x] Log tab in BottomNav (ClipboardList icon, between Active and Settings)
- [x] Swipe navigation updated for 5 tabs
- [x] logUtils.ts — computeLogStats, logToSavedWorkout, formatLogForClipboard
- [x] Session tests updated + logUtils unit tests
