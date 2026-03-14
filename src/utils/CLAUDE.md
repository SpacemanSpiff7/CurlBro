# Utility Conventions

## Rules
- Pure functions only — no side effects, no state access
- graphBuilder.ts: takes raw JSON arrays → returns ExerciseGraph (pure)
- formatExport.ts: takes (workout, graph, options?) → returns formatted string (pure).
  Formats per tracking flags: weight+reps (`3x10 | 135lb`), reps-only (`3x10`),
  duration (`3x30s`, `1x5:00`). Options: `includeTips`, `weightUnit` (lb/kg).
- parseImport.ts: takes string + graph → returns parsed result with warnings/errors array (pure).
  Flexible field parser handles: `3x10` (reps), `3x30s`/`3x1:30` (duration),
  `135lb`/`70kg` (weight), `0.5mi`/`0.8km` (distance), `Rest: 60s`. Infers tracking
  flags from parsed data. Backward compatible with old 4-field format.
- unitConversion.ts: pure conversion/formatting for weight (lb↔kg) and distance (mi↔km)
- logUtils.ts: pure functions for workout log display and export:
  - `computeLogStats(log)` → date, duration, exercise count, sets, total weight
  - `logToSavedWorkout(log)` → converts log back to SavedWorkout with weights prefilled
  - `formatLogForClipboard(log, graph)` → formatted markdown string for clipboard sharing
  - `formatLogForShare(log, graph, options?)` → mobile-friendly share format (one set per line, no IDs, no markdown headers, optional calorie line)
- calorieEstimate.ts: pure MET-based calorie estimation — `estimateCalories(log, bodyWeightKg, graph)`.
  Uses category-specific MET values weighted by completed set count. Requires body weight in kg.
- tcxExport.ts: pure TCX XML generator — `generateTcx(log, graph, options?)`. Generates
  Strava-compatible TCX with Sport="Other", duration, calories, and exercise summary in Notes.
- fileIO.ts: browser file I/O helpers — `downloadFile(content, filename, mimeType)` creates
  Blob → object URL → invisible `<a download>` click; `readFileAsText(file)` → Promise<string>
- logExportImport.ts: versioned JSON export/import for workout logs (pure functions):
  - `createLogExport(logs)` → JSON string with `{version, app, exportedAt, logCount, logs}` envelope
  - `parseLogImport(json, existingLogIds)` → `LogImportResult` with validated logs, dedup, warnings/errors
  - `LogExportEnvelopeSchema` — Zod schema for the export envelope
  - Backfills missing fields (notes, units, tracking flags, set fields) — mirrors store hydration
- audio.ts: Web Audio API beep generator — create AudioContext lazily, single instance
- haptics.ts: wrap navigator.vibrate with feature detection
