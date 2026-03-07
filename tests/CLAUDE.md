# Testing Conventions

## Philosophy
Test behavior, not implementation. Use accessible queries (getByRole, getByLabelText).
testid is last resort.

## Structure
- Unit tests colocated: `src/hooks/useRestTimer.test.ts` next to `useRestTimer.ts`
- Component tests colocated: `src/components/exercise/ExerciseCard.test.tsx`
- Integration tests: `tests/integration/` (multi-component flows)
- E2E tests: `tests/e2e/` (Playwright, full user journeys)

## What to Test
- Hooks: input/output behavior, edge cases, error states
- Pure functions (graphBuilder, formatExport, parseImport, logUtils): comprehensive unit tests
- Presenters: renders correct content, responds to interactions
- Containers: integration tests verifying hook + component work together
- Graph queries: test with small fixture graph (8 exercises), not the full 194
- Exercise filters: test exerciseType, equipmentGroups, auto-apply soreness, auto-apply post-activity, auto-apply pre-activity with fixture exercises (tests/exerciseFilters.test.ts)
- Session flow: endSession/saveSession split, addExerciseToSession, deleteLog
- Log utilities: computeLogStats, logToSavedWorkout, formatLogForClipboard (edge cases: null weights, incomplete sets)

## Patterns
- Use `renderHook` from @testing-library/react for hook tests
- Use `userEvent.setup()` (not fireEvent) for interaction tests
- Mock Zustand store with a test wrapper when needed
- Use `tests/fixtures/testGraph.ts` for representative exercise graph
- Snapshot tests: NEVER

## Running
- Single file: `npx vitest run src/path/to/file.test.ts`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage` (target: 80%+ on hooks and utils)

## Pre-commit checklist
Always run both before committing:
1. `npx tsc -b` — strict build that matches CI (catches issues `tsc --noEmit` misses)
2. `npx vitest run` — all tests must pass
