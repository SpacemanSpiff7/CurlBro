# Testing Strategy

## Test Pyramid
- Many unit tests: hooks, utils, graph builder
- Some integration tests: component flows
- E2E tests are planned, but not currently configured in-repo

## Graph Testing
- Use fixture with 8 exercises spanning 3 muscle groups
- Test all edge types: substitutes, complements, supersets
- Test index maps: byMuscle, byEquipment, byPattern, byForceType
- Full dataset integrity test: zero broken references

## Timer Testing
- Mock setInterval for countdown logic
- Mock AudioContext for beep generation
- Mock navigator.vibrate for haptic feedback

## localStorage Testing
- Mock storage for persistence tests
- Test Zod validation on corrupt data → graceful fallback

## Import/Export Testing
- Round-trip: export → import → compare
- Malformed input: missing IDs, bad format, empty lines
- Edge cases: exercises with no weight, long notes

## Session & Log Testing
- Test endSession/saveSession as a two-step flow (endSession sets completedAt, saveSession creates log)
- Test saveSession duplicate prevention (same workoutId + startedAt → no duplicate)
- Test addExerciseToSession (appends exercise, navigates, no-op when completed)
- Test deleteLog removes from library.logs
- logUtils pure functions: computeLogStats, logToSavedWorkout, formatLogForClipboard
- Edge cases: null weights, incomplete sets, unknown exercise IDs in graph

## Coverage Targets
- Hooks: 90%
- Utils: 95%
- Components: 70%
- Overall: 80%
