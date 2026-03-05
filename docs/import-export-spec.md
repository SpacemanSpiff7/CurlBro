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
Header:   ## {name} | {date}
Separator: ---
Exercise: {name} [{id}] | {sets}x{reps} | {weight}{unit}? | Rest: {seconds}s
Superset: {name} [{id}] | {sets}x{reps} | {weight}{unit}? | Rest: {seconds}s [superset:{group_id}]
Tip:      tip: {text}
```

## Rules
- `[exercise_id]` ensures perfect import
- Weight is optional (empty between pipes)
- Tips are optional
- Parser is line-based, Zod-validated
- Unrecognized exercise IDs generate warnings, not errors
- Malformed lines generate errors

## Superset Grouping
- Append `[superset:GROUP_ID]` to the end of an exercise line to group it
- Exercises sharing the same GROUP_ID are grouped (superset/tri-set/circuit)
- Grouped exercises must be consecutive lines
- The tag is optional — old format imports without groups (backward compatible)

## Round-trip Guarantee
`parseImport(formatExport(workout))` produces identical workout

## Log Clipboard Format

Completed workout logs use a separate format via `formatLogForClipboard()` that shows actual performed data:

```
## Push Day | 2026-03-04
Duration: 45 min | Total: 12,450 lb
---
Barbell Bench Press [barbell_bench_press]
  155lb × 8 ✓ | 155lb × 7 ✓ | 155lb × 6 ✓

Cable Flye [cable_flye]
  30lb × 12 ✓ | 30lb × 10 ✓
```

### Differences from workout export format
- Header includes duration and total weight (sum of weight × reps for completed sets)
- Sets show actual performed weight/reps (not planned targets)
- Completed sets marked with ✓, incomplete with ✗
- Bodyweight exercises show "BW" instead of weight
- This format is NOT round-trip importable — it is display-only for sharing
