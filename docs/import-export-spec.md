# Import/Export Format Specification

## Format

```
## Push Day | 2026-03-04
---
Barbell Bench Press [barbell_bench_press] | 4x8 | 155lb | Rest: 120s
  tip: Wider grip = more chest, narrower = more triceps
Cable Flye [cable_flye] | 3x12 | Rest: 60s
  tip: Better constant tension than dumbbells
```

## Grammar
```
Header:      ## {name} | {date}
Separator:   ---
Reps+weight: {name} [{id}] | {sets}x{reps} | {weight}{unit} | Rest: {seconds}s
Reps only:   {name} [{id}] | {sets}x{reps} | Rest: {seconds}s
Duration:    {name} [{id}] | {sets}x{duration} | Rest: {seconds}s
Superset:    ...exercise line... [superset:{group_id}]
Tip:         tip: {text}
```

### Duration format
- `30s` — seconds (< 60)
- `1:30` — M:SS (≥ 60 seconds)
- Examples: `3x30s` (3 sets of 30s), `1x5:00` (1 set of 5 min)

### Weight unit
- Export uses the user's configured unit: `155lb` or `70kg`
- Import accepts both `lb` and `kg` (or bare number for backward compat)

## Rules
- `[exercise_id]` ensures perfect import
- Weight field is omitted when weight is null (no empty pipes)
- Tips are optional
- Parser is line-based, field-order-flexible
- Unrecognized exercise IDs generate warnings, not errors
- Unparseable lines generate warnings and are skipped

## Import Field Parsing
The parser splits pipe-separated fields and identifies each by pattern:
- `{N}x{N}` → sets × reps
- `{N}x{N}s` or `{N}x{M:SS}` → sets × duration (trackDuration=true)
- `{N}s` or `{M:SS}` standalone → duration
- `{N}lb` or `{N}kg` → weight (trackWeight=true)
- `{N}mi` or `{N}km` → distance (trackDistance=true)
- `Rest: {N}s` → rest time
- Bare number → weight (backward compat)

### Tracking flag inference
- Duration-format data → trackDuration=true, trackReps=false, trackWeight=false
- Reps-format data → trackReps=true, trackWeight=true (backward compat)
- Distance data → trackDistance=true (additive)
- Weight data in duration context → trackWeight=true

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
  155 lb × 8 reps ✓ | 155 lb × 7 reps ✓ | 155 lb × 6 reps ✓

Cable Flye [cable_flye]
  30 lb × 12 reps ✓ | 30 lb × 10 reps ✓
```

### Differences from workout export format
- Header includes duration and total weight (sum of weight × reps for completed sets)
- Sets show actual performed weight/reps (not planned targets)
- Completed sets marked with ✓, incomplete with ✗
- Bodyweight exercises show "BW" instead of weight
- Duration/distance values shown when tracked (e.g., `30s`, `804.7 mi`)
- This format is NOT round-trip importable — it is display-only for sharing
