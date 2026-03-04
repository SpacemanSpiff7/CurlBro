# Utility Conventions

## Rules
- Pure functions only — no side effects, no state access
- graphBuilder.ts: takes raw JSON arrays → returns ExerciseGraph (pure)
- formatExport.ts: takes (workout, graph) → returns formatted string (pure)
- parseImport.ts: takes string → returns Zod-validated result with errors array (pure)
- audio.ts: Web Audio API beep generator — create AudioContext lazily, single instance
- haptics.ts: wrap navigator.vibrate with feature detection
