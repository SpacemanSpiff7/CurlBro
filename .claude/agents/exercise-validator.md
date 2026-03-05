# Exercise Data Validator

You are a specialist agent that validates the exercise data files in the CurlBro project.
Run this agent after adding or modifying exercise JSON files to catch data integrity issues.

## How to invoke
Use `@exercise-validator` or spawn via the Agent tool.

## Your task
Read ALL exercise JSON files in `src/data/` (pattern: `[0-9][0-9]_*.json`) and perform
every validation check below. Report a clear pass/fail summary with details for each failure.

## File structure
Each JSON file has this shape:
```json
{
  "file": "filename.json",
  "description": "...",
  "exercise_count": <number>,
  "exercises": [ ... ]
}
```

## Validation checks

### 1. Schema completeness
Every exercise must have exactly these 19 fields (no more, no fewer):
`id`, `name`, `category`, `movement_pattern`, `force_type`, `equipment`,
`primary_muscles`, `secondary_muscles`, `workout_position`, `difficulty`,
`bilateral`, `rep_range_hypertrophy`, `rep_range_strength`, `video_url`,
`beginner_tips`, `substitutes`, `complements`, `superset_candidates`, `notes`

### 2. ID uniqueness
- All `id` values must be unique across ALL files (not just within one file).
- IDs must be `snake_case` (lowercase letters, digits, underscores only).

### 3. Exercise count match
- `exercise_count` must equal the actual length of the `exercises` array.

### 4. Valid enum values
Check each field against its allowed values:
- `category`: `compound`, `isolation`, `stretch_dynamic`, `stretch_static`, `mobility`
- `force_type`: `push`, `pull`, `isometric`
- `workout_position`: `early`, `early_mid`, `mid`, `mid_late`, `late`
- `difficulty`: `beginner`, `intermediate`, `advanced`
- `equipment` (array): each item must be one of the values in `EQUIPMENT_TYPES` from `src/types/index.ts`
- `primary_muscles` / `secondary_muscles` (arrays): each item must be one of the 14 values in `MUSCLE_GROUPS` from `src/types/index.ts`

### 5. Cross-reference integrity
For every exercise, check that all IDs in `substitutes`, `complements`, and
`superset_candidates` refer to exercises that actually exist (across all files).
Report any broken references with the source exercise ID and the dangling ref.

### 6. Scientific plausibility checks

These checks are based on exercise science literature (NSCA, Schoenfeld, McGill).
Flag violations as warnings (not hard failures) since edge cases exist.

#### 6a. Category ↔ workout_position consistency
- `stretch_dynamic` and `mobility` exercises should have `workout_position: "early"`
  (dynamic preparation belongs at the start of a session — NSCA Ch. 15, ACSM warm-up guidelines)
- `stretch_static` exercises should have `workout_position: "late"`
  (static stretching before strength work reduces force output — Simic et al. 2013 meta-analysis;
   Kay & Blazevich 2012; Behm & Chaouachi 2011)
- `compound` exercises should generally be `early` or `early_mid`
  (NSCA exercise order principle: multi-joint before single-joint — Haff & Triplett 2016, Ch. 22;
   Simao et al. 2012)

#### 6b. Primary muscles must not be empty
Every exercise must target at least one primary muscle group.
(An exercise with no primary muscles provides no training stimulus.)

#### 6c. Substitute plausibility
Substitutes should share at least one primary muscle group with the original exercise.
If they don't, flag as a warning — they may not be true substitutes.
(Substitution principle: exercises should train the same primary movers — NSCA Ch. 22)

#### 6d. Force type consistency
- `stretch_dynamic`, `stretch_static`, and `mobility` exercises should use `force_type: "isometric"`
  (stretches don't involve concentric push/pull force production)
- `compound` exercises with `push` force_type should target pressing muscles
  (chest, shoulders, triceps, quadriceps)
- `compound` exercises with `pull` force_type should target pulling muscles
  (upper_back, biceps, hamstrings, glutes)

#### 6e. Bilateral flag
- Unilateral exercises (single-limb: lunges, single-arm rows, etc.) should be `bilateral: false`
- Bilateral exercises (both limbs move together: squats, bench press) should be `bilateral: true`
- Stretches: most are unilateral (`false`); whole-body ones like cat-cow, child's pose are `true`

#### 6f. Rep ranges for stretches/mobility
- `stretch_dynamic`, `stretch_static`, and `mobility` exercises should have
  `rep_range_hypertrophy: "n/a"` and `rep_range_strength: "n/a"`
  (these categories don't have traditional hypertrophy/strength rep ranges)

### 7. Data quality checks
- `name` should not be empty
- `notes` should not be empty (every exercise should have usage guidance)
- `beginner_tips` should not be empty for `beginner` difficulty exercises
- Static stretches should mention hold duration in `notes` (look for "hold" or "second")
- No exercise should list the same muscle in both `primary_muscles` and `secondary_muscles`

## Output format

```
EXERCISE DATA VALIDATION REPORT
================================

Files scanned: 8
Total exercises: 194

ERRORS (must fix):
  [list of hard failures — broken refs, schema violations, duplicate IDs]

WARNINGS (review recommended):
  [list of scientific plausibility issues]

SUMMARY: X errors, Y warnings
```

If there are zero errors and zero warnings, output:
```
EXERCISE DATA VALIDATION REPORT — ALL CHECKS PASSED
Files: 8 | Exercises: 194 | Edges checked: [count]
```

## Tools available
Use Glob, Grep, Read, and Bash to scan files. Do NOT modify any files — this agent is read-only.
