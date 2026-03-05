import { v4 as uuidv4 } from 'uuid';
import type { SavedWorkout, WorkoutExercise, WorkoutId, ExerciseId, ExerciseGraph } from '@/types';

export interface ParseResult {
  workout: SavedWorkout | null;
  warnings: string[];
  errors: string[];
}

const HEADER_RE = /^##\s+(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*$/;
const EXERCISE_RE = /^(.+?)\s*\[(\w+)\]\s*\|\s*(\d+)x(\d+)\s*\|\s*([\d.]*)\s*(?:lb)?\s*\|\s*Rest:\s*(\d+)s\s*$/;
const TIP_RE = /^\s+tip:\s+(.+)$/;
const SEPARATOR_RE = /^---$/;

export function parseImport(text: string, graph: ExerciseGraph): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const lines = text.trim().split('\n');

  if (lines.length === 0) {
    errors.push('Empty input');
    return { workout: null, warnings, errors };
  }

  // Parse header
  let name = 'Imported Workout';
  let date = new Date().toISOString();
  const headerMatch = lines[0].match(HEADER_RE);
  if (headerMatch) {
    name = headerMatch[1];
    const parsed = new Date(headerMatch[2]);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toISOString();
    } else {
      warnings.push(`Invalid date "${headerMatch[2]}", using today`);
    }
  } else {
    warnings.push('No header found, using defaults');
  }

  const exercises: WorkoutExercise[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header and separator
    if (i === 0 && headerMatch) continue;
    if (SEPARATOR_RE.test(line)) continue;
    if (TIP_RE.test(line)) continue;
    if (line.trim() === '') continue;

    const exerciseMatch = line.match(EXERCISE_RE);
    if (exerciseMatch) {
      const exerciseId = exerciseMatch[2] as ExerciseId;
      const sets = parseInt(exerciseMatch[3]);
      const reps = parseInt(exerciseMatch[4]);
      const weightStr = exerciseMatch[5];
      const weight = weightStr ? parseFloat(weightStr) : null;
      const restSeconds = parseInt(exerciseMatch[6]);

      if (!graph.exercises.has(exerciseId)) {
        warnings.push(`Unknown exercise ID: ${exerciseId} (line ${i + 1})`);
      }

      exercises.push({
        exerciseId,
        sets,
        reps,
        weight,
        restSeconds,
        notes: '',
      });
    } else if (!headerMatch || i > 0) {
      // Only report error for lines that aren't the header
      if (line.trim().length > 0) {
        errors.push(`Could not parse line ${i + 1}: "${line.trim()}"`);
      }
    }
  }

  if (exercises.length === 0) {
    errors.push('No exercises found in input');
    return { workout: null, warnings, errors };
  }

  const now = new Date().toISOString();
  const workout: SavedWorkout = {
    id: uuidv4() as WorkoutId,
    name,
    exercises,
    createdAt: date,
    updatedAt: now,
  };

  return { workout, warnings, errors };
}
