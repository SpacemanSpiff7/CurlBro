/**
 * Combines exercise JSON files into a single public/exercises.json catalog.
 * Run: npx tsx scripts/generate-exercises.ts
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data');
const OUTPUT = join(import.meta.dirname, '..', 'public', 'exercises.json');

// Fields to keep per exercise (drop video_url, beginner_tips)
const KEEP_FIELDS = [
  'id',
  'name',
  'category',
  'movement_pattern',
  'force_type',
  'equipment',
  'primary_muscles',
  'secondary_muscles',
  'workout_position',
  'difficulty',
  'bilateral',
  'rep_range_hypertrophy',
  'rep_range_strength',
  'substitutes',
  'complements',
  'superset_candidates',
  'notes',
] as const;

interface RawExercise {
  [key: string]: unknown;
}

function pickFields(exercise: RawExercise): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of KEEP_FIELDS) {
    if (key in exercise) {
      result[key] = exercise[key];
    }
  }
  return result;
}

// Read all numbered exercise files (01-07)
const files = readdirSync(DATA_DIR)
  .filter((f) => /^\d{2}_.*\.json$/.test(f) && !f.startsWith('00'))
  .sort();

const exercises: Record<string, unknown>[] = [];

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
  if (Array.isArray(raw.exercises)) {
    for (const ex of raw.exercises) {
      exercises.push(pickFields(ex));
    }
  }
}

const catalog = {
  description:
    'CurlBro exercise catalog — strength, stretching, and mobility exercises for gym workout building',
  import_instructions_url: '/llms.txt',
  exercise_count: exercises.length,
  exercises,
};

writeFileSync(OUTPUT, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Generated ${OUTPUT} with ${exercises.length} exercises`);
