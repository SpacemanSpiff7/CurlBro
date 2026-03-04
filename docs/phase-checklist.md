# Phase Checklist

## Phase 1: Foundation ✅
- [x] Vite + React + TypeScript + Tailwind 4 + shadcn/ui setup
- [x] Type system with branded types and Zod schemas
- [x] Exercise JSON files in src/data/
- [x] graphBuilder.ts — raw data → ExerciseGraph
- [x] Zustand store with all slices
- [x] Vitest + testing infrastructure
- [x] Test fixture graph (8 exercises)
- [x] Bottom nav shell with 4 tabs
- [x] CSS custom properties + Google Fonts
- [x] Graph builds with 162 exercises, 1340 edges
- [x] Full dataset edge integrity tests pass
- [x] `npm run build` succeeds with zero errors

## Phase 2: Core Builder
- [ ] useExerciseSearch hook (Fuse.js)
- [ ] ExercisePicker (Sheet, search, filters)
- [ ] ExerciseCard compound component
- [ ] WorkoutList with dnd-kit reorder
- [ ] BuildWorkout page with FAB
- [ ] builderSlice tests
- [ ] All tests pass, coverage > 80% on hooks

## Phase 3: Intelligence
- [ ] useSuggestions hook
- [ ] SuggestionPanel
- [ ] useSubstitutes hook
- [ ] SubstitutePanel
- [ ] useWorkoutValidation hook
- [ ] WorkoutStatusBar
- [ ] TemplateSelector

## Phase 4: Persistence & Sharing
- [ ] Library persistence (Zustand persist)
- [ ] MyWorkouts page
- [ ] formatExport.ts
- [ ] parseImport.ts
- [ ] ImportExport component
- [ ] Round-trip tests

## Phase 5: Live Workout
- [ ] Session tracking (sessionSlice)
- [ ] SetTracker
- [ ] useRestTimer hook
- [ ] RestTimer UI
- [ ] ActiveWorkout page
- [ ] Session progress navigation

## Phase 6: Polish & E2E
- [ ] Framer Motion animations
- [ ] Error boundaries
- [ ] Empty states
- [ ] 5 E2E journeys (Playwright)
- [ ] Accessibility audit
- [ ] Performance audit
