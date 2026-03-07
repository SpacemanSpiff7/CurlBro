# Exercise Graph Specification

## Overview
- 194 exercises across 8 JSON files (162 strength + 32 stretching/mobility)
- ~1500 total edges (substitutes, complements, superset candidates)
- 434+ cross-file edges
- 37+ unique movement patterns (including stretch and mobility patterns)
- 19 fields per exercise
- 5 categories: compound, isolation, stretch_dynamic, stretch_static, mobility

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
3. Group by: "Pairs well with" (complements), "Still need to hit" (uncovered muscles)

### getSupersetSuggestions(exerciseId)
1. Get superset candidates set for the exercise from `graph.supersets`
2. Exclude exercises already in workout
3. Sort by: same primary muscle first, then by difficulty match
4. Used by `useSupersetSuggestions` hook for per-exercise inline superset panel

### getSubstitutes(exerciseId)
1. Get substitutes set for the exercise
2. Sort by: same primary muscle first, then by difficulty match

### computeBalance(workout)
1. Count push/pull/isometric exercises
2. Balanced = push/pull ratio between 0.5 and 2.0
3. List covered and missing primary muscle groups
