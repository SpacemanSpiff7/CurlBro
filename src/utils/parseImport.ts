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

// Exercise with [id]: Name [id] | ...fields...  or just  Name [id]
const EXERCISE_WITH_ID_RE = /^(.+?)\s*\[(\w+)\]\s*(?:\|(.*))?$/;

// Name only (no [id]): "Barbell Bench Press" (starts with uppercase, 3+ chars)
const EXERCISE_NAME_ONLY_RE = /^([A-Z].{2,})$/;

// Name with pipe-separated fields (no [id]): "Barbell Bench Press | 4x8 | 155lb | Rest: 120s"
const EXERCISE_NAME_WITH_FIELDS_RE = /^([A-Z].+?)\s*\|(.+)$/;

// Superset tag at end of line: [superset:abc123]
const SUPERSET_TAG_RE = /\s*\[superset:(\S+)\]\s*$/;

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

/** Pick a simple default rep count from settings */
function goalDefaultReps(settings: AppSettings): number {
  return settings.defaultRepsCompound;
}

/** Parse duration string: "30s" → 30, "1:30" → 90, "5:00" → 300 */
function parseDuration(str: string): number | null {
  // "30s"
  const secMatch = str.match(/^(\d+)s$/);
  if (secMatch) return parseInt(secMatch[1]);

  // "1:30" or "5:00"
  const mmssMatch = str.match(/^(\d+):(\d{2})$/);
  if (mmssMatch) return parseInt(mmssMatch[1]) * 60 + parseInt(mmssMatch[2]);

  return null;
}

interface ParsedFields {
  sets: number;
  reps: number;
  weight: number | null;
  restSeconds: number;
  durationSeconds: number | undefined;
  trackWeight: boolean;
  trackReps: boolean;
  trackDuration: boolean;
  trackDistance: boolean;
}

/** Parse pipe-separated fields to determine exercise configuration and tracking flags. */
function parseFields(parts: string[], settings: AppSettings): ParsedFields {
  let sets = settings.defaultSetsCompound;
  let reps = goalDefaultReps(settings);
  let weight: number | null = null;
  let restSeconds = settings.restTimerCompoundSeconds;
  let durationSeconds: number | undefined;
  let hasSetsReps = false;
  let hasDuration = false;
  let hasWeight = false;
  let hasDistance = false;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // "3x30s" or "3x1:30" → sets × duration
    const durSets = trimmed.match(/^(\d+)x(.+)$/);
    if (durSets) {
      const dur = parseDuration(durSets[2]);
      if (dur != null) {
        sets = parseInt(durSets[1]);
        durationSeconds = dur;
        hasDuration = true;
        continue;
      }
    }

    // "3x10" → sets × reps (must come after duration check)
    const setsReps = trimmed.match(/^(\d+)x(\d+)$/);
    if (setsReps) {
      sets = parseInt(setsReps[1]);
      reps = parseInt(setsReps[2]);
      hasSetsReps = true;
      continue;
    }

    // Standalone duration: "5:00" or "30s"
    const dur = parseDuration(trimmed);
    if (dur != null) {
      durationSeconds = dur;
      hasDuration = true;
      continue;
    }

    // "0.5mi" or "0.8km" → distance
    const dist = trimmed.match(/^([\d.]+)\s*(mi|km)$/);
    if (dist) {
      hasDistance = true;
      continue;
    }

    // "155lb" or "61.2kg" → weight
    const weightMatch = trimmed.match(/^([\d.]+)\s*(lb|kg)$/);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
      hasWeight = true;
      continue;
    }

    // Bare number → weight (backward compat: "155" without unit)
    const bareNum = trimmed.match(/^[\d.]+$/);
    if (bareNum) {
      weight = parseFloat(trimmed);
      hasWeight = true;
      continue;
    }

    // "Rest: 60s"
    const rest = trimmed.match(/^Rest:\s*(\d+)s$/i);
    if (rest) {
      restSeconds = parseInt(rest[1]);
      continue;
    }
  }

  // Infer tracking flags from parsed data
  const trackDuration = hasDuration;
  const trackDistance = hasDistance;

  // Duration-based exercises: don't default to reps/weight tracking
  // Reps-based exercises (or no explicit data): default to trackReps + trackWeight (backward compat)
  const trackReps = !hasDuration || hasSetsReps;
  const trackWeight = hasDuration ? hasWeight : true;

  return {
    sets,
    reps,
    weight,
    restSeconds,
    durationSeconds,
    trackWeight,
    trackReps,
    trackDuration,
    trackDistance,
  };
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
    let line = lines[i];

    // Skip header and non-exercise lines
    if (i === 0 && headerFound) continue;
    if (SEPARATOR_RE.test(line)) continue;
    if (TIP_RE.test(line)) continue;
    if (line.trim() === '') continue;

    // Extract optional superset tag before matching exercise patterns
    let supersetGroupId: string | undefined;
    const supersetMatch = line.match(SUPERSET_TAG_RE);
    if (supersetMatch) {
      supersetGroupId = supersetMatch[1];
      line = line.replace(SUPERSET_TAG_RE, '');
    }

    // 1. Has [id] — most reliable: Name [id] | ...fields...
    const idMatch = line.match(EXERCISE_WITH_ID_RE);
    if (idMatch) {
      let exerciseId = idMatch[2] as ExerciseId;
      const exerciseName = idMatch[1].trim();

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

      // Parse fields after the [id]
      const fieldsStr = idMatch[3] ?? '';
      const parts = fieldsStr.split('|').map((p) => p.trim()).filter(Boolean);
      const fields = parseFields(parts, settings);

      exercises.push({
        exerciseId,
        instanceId: crypto.randomUUID(),
        sets: fields.sets,
        reps: fields.reps,
        weight: fields.weight,
        restSeconds: fields.restSeconds,
        notes: '',
        trackWeight: fields.trackWeight,
        trackReps: fields.trackReps,
        trackDuration: fields.trackDuration,
        trackDistance: fields.trackDistance,
        ...(fields.durationSeconds != null ? { durationSeconds: fields.durationSeconds } : {}),
        ...(supersetGroupId && { supersetGroupId }),
      });
      continue;
    }

    // 2. Name with pipe-separated fields but no [id]
    const nameFieldsMatch = line.match(EXERCISE_NAME_WITH_FIELDS_RE);
    if (nameFieldsMatch) {
      const exerciseName = nameFieldsMatch[1].trim();
      const parts = nameFieldsMatch[2].split('|').map((p) => p.trim()).filter(Boolean);
      const fields = parseFields(parts, settings);

      const resolved = resolveByName(exerciseName, nameIndex);
      if (resolved) {
        exercises.push({
          exerciseId: resolved,
          instanceId: crypto.randomUUID(),
          sets: fields.sets,
          reps: fields.reps,
          weight: fields.weight,
          restSeconds: fields.restSeconds,
          notes: '',
          trackWeight: fields.trackWeight,
          trackReps: fields.trackReps,
          trackDuration: fields.trackDuration,
          trackDistance: fields.trackDistance,
          ...(fields.durationSeconds != null ? { durationSeconds: fields.durationSeconds } : {}),
          ...(supersetGroupId && { supersetGroupId }),
        });
        warnings.push(`Resolved "${exerciseName}" by name (line ${i + 1})`);
      } else {
        warnings.push(`Could not find exercise: "${exerciseName}" (line ${i + 1}), skipped`);
      }
      continue;
    }

    // 3. Name only: "Barbell Bench Press"
    const nameOnlyMatch = line.match(EXERCISE_NAME_ONLY_RE);
    if (nameOnlyMatch) {
      const exerciseName = nameOnlyMatch[1].trim();
      const resolved = resolveByName(exerciseName, nameIndex);
      if (resolved) {
        const ex = graph.exercises.get(resolved);
        const defaultSets = ex?.category === 'isolation' ? settings.defaultSetsIsolation : settings.defaultSetsCompound;
        const defaultRest = ex?.category === 'isolation' ? settings.restTimerIsolationSeconds : settings.restTimerCompoundSeconds;
        exercises.push({
          exerciseId: resolved,
          instanceId: crypto.randomUUID(),
          sets: defaultSets,
          reps: goalDefaultReps(settings),
          weight: null,
          restSeconds: defaultRest,
          notes: '',
          trackWeight: true,
          trackReps: true,
          trackDuration: false,
          trackDistance: false,
          ...(supersetGroupId && { supersetGroupId }),
        });
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
