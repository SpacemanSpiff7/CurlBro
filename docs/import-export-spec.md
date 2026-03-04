# Import/Export Format Specification

## Format

```
## Push Day | 2026-03-04
---
Barbell Bench Press [barbell_bench_press] | 4x8 | 155lb | Rest: 120s
  tip: Wider grip = more chest, narrower = more triceps
Cable Flye [cable_flye] | 3x12 | | Rest: 60s
  tip: Better constant tension than dumbbells
```

## Grammar
```
Header: ## {name} | {date}
Separator: ---
Exercise: {name} [{id}] | {sets}x{reps} | {weight}{unit}? | Rest: {seconds}s
Tip:   tip: {text}
```

## Rules
- `[exercise_id]` ensures perfect import
- Weight is optional (empty between pipes)
- Tips are optional
- Parser is line-based, Zod-validated
- Unrecognized exercise IDs generate warnings, not errors
- Malformed lines generate errors

## Round-trip Guarantee
`parseImport(formatExport(workout))` produces identical workout
