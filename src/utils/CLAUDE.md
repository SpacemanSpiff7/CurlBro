# Utility Conventions

## Rules
- Pure functions only — no side effects, no state access
- graphBuilder.ts: takes raw JSON arrays → returns ExerciseGraph (pure)
- formatExport.ts: takes (workout, graph) → returns formatted string (pure)
- parseImport.ts: takes string + graph → returns parsed result with warnings/errors array (pure, regex-based parsing)
- logUtils.ts: three pure functions for workout log display and export:
  - `computeLogStats(log)` → date, duration, exercise count, sets, total weight
  - `logToSavedWorkout(log)` → converts log back to SavedWorkout with weights prefilled
  - `formatLogForClipboard(log, graph)` → formatted markdown string for clipboard sharing
- audio.ts: Web Audio API beep generator — create AudioContext lazily, single instance
- haptics.ts: wrap navigator.vibrate with feature detection
