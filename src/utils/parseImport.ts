import { v4 as uuidv4 } from 'uuid';
import type { SavedWorkout, WorkoutExercise, WorkoutId, ExerciseId, ExerciseGraph, AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

export interface ParseResult {
  workout: SavedWorkout | null;
  warnings: string[];
  errors: string[];
}

// Header: "## Name | 2026-03-04" or "## Name" (date optional)
const HEADER_WITH_DATE_RE = /^##\s+(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*$/;
const HEADER_NO_DATE_RE = /^##\s+(.+?)\s*$/;

// Full exercise line: Name [id] | 3x10 | 100lb | Rest: 60s
const EXERCISE_FULL_RE = /^(.+?)\s*\[(\w+)\]\s*\|\s*(\d+)x(\d+)\s*\|\s*([\d.]*)\s*(?:lb)?\s*\|\s*Rest:\s*(\d+)s\s*$/;

// Partial: has [id] but missing/malformed fields after it
const EXERCISE_ID_PARTIAL_RE = /^(.+?)\s*\[(\w+)\]\s*(?:\|.*)?$/;

// Name only (no [id]): "Barbell Bench Press | 4x8 | 155lb | Rest: 120s" or just "Barbell Bench Press"
const EXERCISE_NAME_FIELDS_RE = /^(.+?)\s*\|\s*(\d+)x(\d+)\s*\|\s*([\d.]*)\s*(?:lb)?\s*\|\s*Rest:\s*(\d+)s\s*$/;
const EXERCISE_NAME_ONLY_RE = /^([A-Z].{2,})$/;

const TIP_RE = /^\s+tip:\s+(.+)$/;
const SEPARATOR_RE = /^---+$/;

/** Build a lowercase name → ExerciseId lookup from the graph */
function buildNameIndex(graph: ExerciseGraph): Map<string, ExerciseId> {
  const map = new Map<string, ExerciseId>();
  for (const [id, ex] of graph.exercises) {
    map.set(ex.name.toLowerCase(), id);
  }
  return map;
}

/** Try to resolve an exercise ID from a name string using the graph */
function resolveByName(name: string, nameIndex: Map<string, ExerciseId>): ExerciseId | null {
  const lower = name.trim().toLowerCase();
  // Exact match
  if (nameIndex.has(lower)) return nameIndex.get(lower)!;

  // Try without parenthetical suffixes: "Barbell Bench Press" matches "Barbell Bench Press (Flat)"
  for (const [fullName, id] of nameIndex) {
    const baseName = fullName.replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (baseName === lower) return id;
  }

  return null;
}

/** Pick a simple default rep count based on training goal (no exercise context) */
function goalDefaultReps(settings: AppSettings): number {
  if (settings.trainingGoal === 'strength') return 5;
  if (settings.trainingGoal === 'endurance') return 15;
  return 10; // hypertrophy
}

/** Try to parse optional fields from pipe-separated remainder */
function parseFields(parts: string[], settings: AppSettings): { sets: number; reps: number; weight: number | null; restSeconds: number } {
  const defaults = {
    sets: settings.defaultSetsCompound,
    reps: goalDefaultReps(settings),
    weight: null as number | null,
    restSeconds: settings.restTimerCompoundSeconds,
  };

  for (const part of parts) {
    const trimmed = part.trim();
    // "3x10"
    const setsReps = trimmed.match(/^(\d+)x(\d+)$/);
    if (setsReps) {
      defaults.sets = parseInt(setsReps[1]);
      defaults.reps = parseInt(setsReps[2]);
      continue;
    }
    // "155lb" or "155"
    const weight = trimmed.match(/^([\d.]+)\s*(?:lb|kg)?$/);
    if (weight) {
      defaults.weight = parseFloat(weight[1]);
      continue;
    }
    // "Rest: 60s"
    const rest = trimmed.match(/^Rest:\s*(\d+)s$/i);
    if (rest) {
      defaults.restSeconds = parseInt(rest[1]);
      continue;
    }
  }

  return defaults;
}

export function parseImport(text: string, graph: ExerciseGraph, settings: AppSettings = DEFAULT_SETTINGS): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const lines = text.trim().split('\n');

  if (lines.length === 0) {
    errors.push('Empty input');
    return { workout: null, warnings, errors };
  }

  const nameIndex = buildNameIndex(graph);

  // Parse header — try with date first, then without
  let name = 'Imported Workout';
  let date = new Date().toISOString();
  let headerFound = false;

  const headerDateMatch = lines[0].match(HEADER_WITH_DATE_RE);
  if (headerDateMatch) {
    name = headerDateMatch[1];
    headerFound = true;
    const parsed = new Date(headerDateMatch[2]);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toISOString();
    } else {
      warnings.push(`Invalid date "${headerDateMatch[2]}", using today`);
    }
  } else {
    const headerMatch = lines[0].match(HEADER_NO_DATE_RE);
    if (headerMatch) {
      name = headerMatch[1];
      headerFound = true;
    } else {
      warnings.push('No header found, using defaults');
    }
  }

  const exercises: WorkoutExercise[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header and non-exercise lines
    if (i === 0 && headerFound) continue;
    if (SEPARATOR_RE.test(line)) continue;
    if (TIP_RE.test(line)) continue;
    if (line.trim() === '') continue;

    // 1. Full match: Name [id] | 3x10 | 100lb | Rest: 60s
    const fullMatch = line.match(EXERCISE_FULL_RE);
    if (fullMatch) {
      let exerciseId = fullMatch[2] as ExerciseId;
      const exerciseName = fullMatch[1].trim();
      const sets = parseInt(fullMatch[3]);
      const reps = parseInt(fullMatch[4]);
      const weightStr = fullMatch[5];
      const weight = weightStr ? parseFloat(weightStr) : null;
      const restSeconds = parseInt(fullMatch[6]);

      // If ID is unknown, try to resolve by name
      if (!graph.exercises.has(exerciseId)) {
        const resolved = resolveByName(exerciseName, nameIndex);
        if (resolved) {
          exerciseId = resolved;
          warnings.push(`Resolved "${exerciseName}" by name (line ${i + 1})`);
        } else {
          warnings.push(`Unknown exercise: ${exerciseName} [${exerciseId}] (line ${i + 1})`);
        }
      }

      exercises.push({ exerciseId, sets, reps, weight, restSeconds, notes: '' });
      continue;
    }

    // 2. Has [id] but fields are missing/malformed
    const idPartialMatch = line.match(EXERCISE_ID_PARTIAL_RE);
    if (idPartialMatch) {
      let exerciseId = idPartialMatch[2] as ExerciseId;
      const exerciseName = idPartialMatch[1].trim();

      // If ID is unknown, try name lookup
      if (!graph.exercises.has(exerciseId)) {
        const resolved = resolveByName(exerciseName, nameIndex);
        if (resolved) {
          exerciseId = resolved;
          warnings.push(`Resolved "${exerciseName}" by name (line ${i + 1})`);
        } else {
          warnings.push(`Unknown exercise: ${exerciseName} [${exerciseId}] (line ${i + 1})`);
        }
      }

      // Parse whatever fields exist after the [id]
      const afterBracket = line.slice(line.indexOf(']') + 1);
      const parts = afterBracket.split('|').map((p) => p.trim()).filter(Boolean);
      const fields = parseFields(parts, settings);

      exercises.push({ exerciseId, ...fields, notes: '' });
      warnings.push(`Used defaults for missing fields (line ${i + 1})`);
      continue;
    }

    // 3. Name with fields but no [id]: "Barbell Bench Press | 4x8 | 155lb | Rest: 120s"
    const nameFieldsMatch = line.match(EXERCISE_NAME_FIELDS_RE);
    if (nameFieldsMatch) {
      const exerciseName = nameFieldsMatch[1].trim();
      const sets = parseInt(nameFieldsMatch[2]);
      const reps = parseInt(nameFieldsMatch[3]);
      const weightStr = nameFieldsMatch[4];
      const weight = weightStr ? parseFloat(weightStr) : null;
      const restSeconds = parseInt(nameFieldsMatch[5]);

      const resolved = resolveByName(exerciseName, nameIndex);
      if (resolved) {
        exercises.push({ exerciseId: resolved, sets, reps, weight, restSeconds, notes: '' });
        warnings.push(`Resolved "${exerciseName}" by name (line ${i + 1})`);
      } else {
        warnings.push(`Could not find exercise: "${exerciseName}" (line ${i + 1}), skipped`);
      }
      continue;
    }

    // 4. Name only: "Barbell Bench Press"
    const nameOnlyMatch = line.match(EXERCISE_NAME_ONLY_RE);
    if (nameOnlyMatch) {
      const exerciseName = nameOnlyMatch[1].trim();
      const resolved = resolveByName(exerciseName, nameIndex);
      if (resolved) {
        const ex = graph.exercises.get(resolved);
        const defaultSets = ex?.category === 'isolation' ? settings.defaultSetsIsolation : settings.defaultSetsCompound;
        const defaultRest = ex?.category === 'isolation' ? settings.restTimerIsolationSeconds : settings.restTimerCompoundSeconds;
        exercises.push({ exerciseId: resolved, sets: defaultSets, reps: goalDefaultReps(settings), weight: null, restSeconds: defaultRest, notes: '' });
        warnings.push(`Resolved "${exerciseName}" by name, using default sets/reps (line ${i + 1})`);
      } else {
        warnings.push(`Could not find exercise: "${exerciseName}" (line ${i + 1}), skipped`);
      }
      continue;
    }

    // Could not parse at all — skip with warning instead of error
    if (line.trim().length > 0) {
      warnings.push(`Skipped unparseable line ${i + 1}: "${line.trim()}"`);
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
