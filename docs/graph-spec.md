# Exercise Graph Specification

## Overview
- 162 exercises across 7 JSON files
- 1340 total edges (516 substitute, 513 complement, 311 superset)
- 434 cross-file edges
- 37 unique movement patterns
- 19 fields per exercise

## Node Structure (Exercise)
Each exercise has: id, name, category, movement_pattern, force_type, equipment,
primary_muscles, secondary_muscles, workout_position, difficulty, bilateral,
rep_range_hypertrophy, rep_range_strength, video_url, beginner_tips,
substitutes, complements, superset_candidates, notes.

## Edge Types

### substitutes (bidirectional)
- **Meaning**: Use this INSTEAD of that
- **Relationship**: Same muscle group, same movement pattern, similar difficulty
- **Use case**: Equipment unavailable, user preference, injury workaround

### complements (same-session synergists)
- **Meaning**: These belong in the SAME session
- **Relationship**: Synergists, same-group variations, different portions of a muscle
- **Use case**: Building push/pull/leg days

### superset_candidates (back-to-back pairs)
- **Meaning**: Do these BACK-TO-BACK during rest periods
- **Relationship**: Antagonist pairs, non-competing fillers
- **Use case**: Time-efficient training

## Index Maps
- `byMuscle`: Map<MuscleGroup, Set<ExerciseId>>
- `byEquipment`: Map<Equipment, Set<ExerciseId>>
- `byPattern`: Map<MovementPattern, Set<ExerciseId>>
- `byForceType`: Map<ForceType, Set<ExerciseId>>

## Query Algorithms

### suggestNext(workout)
1. Get complements of exercises already in workout
2. Exclude exercises already in workout
3. Group by: "Pairs well with" (complements), "Still need to hit" (uncovered muscles), "Superset with" (superset candidates)
4. Superset suggestions return `SupersetSuggestion` objects with `exerciseId` and `parentExerciseId` (the exercise they pair with)

### getSubstitutes(exerciseId)
1. Get substitutes set for the exercise
2. Sort by: same primary muscle first, then by difficulty match

### computeBalance(workout)
1. Count push/pull/isometric exercises
2. Balanced = push/pull ratio between 0.5 and 2.0
3. List covered and missing primary muscle groups
