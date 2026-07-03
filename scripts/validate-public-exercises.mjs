#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CANONICAL = 'https://curlbro.com/ai/exercises.v1.json';
const INSTRUCTIONS = 'https://curlbro.com/llms.txt';
const EXPECTED_COUNT = 428;
const REQUIRED_CATALOG_FIELDS = Object.freeze([
  'schema_version',
  'canonical_url',
  'import_instructions_url',
  'exercise_count',
  'exercises',
]);
const ALLOWED_CATALOG_FIELDS = new Set(REQUIRED_CATALOG_FIELDS);
const REQUIRED_FIELDS = Object.freeze([
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
]);
const ALLOWED_FIELDS = new Set(REQUIRED_FIELDS);
const FORBIDDEN_FIELDS = Object.freeze([
  'notes',
  'beginner_tips',
  'substitutes',
  'complements',
  'superset_candidates',
  'video',
  'video_url',
  'load_profile',
  'tier',
  'canonical_pattern',
  'exercise_role',
  'intensity_zone',
  'stability_demand',
  'injury_safe',
  'rep_range',
]);

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function fail(errors, message) {
  errors.push(message);
}

function validateCatalog(catalog, label) {
  const errors = [];
  for (const key of Object.keys(catalog)) {
    if (!ALLOWED_CATALOG_FIELDS.has(key)) {
      fail(errors, `${label}: non-public top-level field ${key}`);
    }
  }
  if (catalog.schema_version !== 1) fail(errors, `${label}: schema_version must be 1`);
  if (catalog.canonical_url !== CANONICAL) fail(errors, `${label}: canonical_url mismatch`);
  if (catalog.import_instructions_url !== INSTRUCTIONS) fail(errors, `${label}: import_instructions_url mismatch`);
  if (!Array.isArray(catalog.exercises)) return [`${label}: exercises must be an array`];
  if (catalog.exercise_count !== catalog.exercises.length) {
    fail(errors, `${label}: exercise_count ${catalog.exercise_count} != exercises.length ${catalog.exercises.length}`);
  }
  if (catalog.exercise_count !== EXPECTED_COUNT) {
    fail(errors, `${label}: exercise_count ${catalog.exercise_count} != expected ${EXPECTED_COUNT}`);
  }

  const seen = new Set();
  for (const exercise of catalog.exercises) {
    const id = exercise?.id ?? '<missing id>';
    if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
      fail(errors, `${label}: exercise row must be an object`);
      continue;
    }
    for (const field of REQUIRED_FIELDS) {
      if (!(field in exercise)) fail(errors, `${label}: ${id} missing ${field}`);
    }
    for (const key of Object.keys(exercise)) {
      if (!ALLOWED_FIELDS.has(key)) fail(errors, `${label}: ${id} contains non-public field ${key}`);
    }
    for (const field of FORBIDDEN_FIELDS) {
      if (field in exercise) fail(errors, `${label}: ${id} leaks forbidden field ${field}`);
    }
    if (seen.has(id)) fail(errors, `${label}: duplicate exercise id ${id}`);
    seen.add(id);
  }
  return errors;
}

const canonicalRaw = readFileSync(join(ROOT, 'marketing/public/ai/exercises.v1.json'), 'utf8');
const aliasRaw = readFileSync(join(ROOT, 'marketing/public/exercises.json'), 'utf8');
const appRaw = readFileSync(join(ROOT, 'public/exercises.json'), 'utf8');
const errors = [
  ...validateCatalog(JSON.parse(canonicalRaw), 'marketing/public/ai/exercises.v1.json'),
  ...validateCatalog(JSON.parse(aliasRaw), 'marketing/public/exercises.json'),
  ...validateCatalog(JSON.parse(appRaw), 'public/exercises.json'),
];
if (canonicalRaw !== aliasRaw) errors.push('marketing alias differs from canonical public catalog');
if (canonicalRaw !== appRaw) errors.push('app public catalog differs from canonical public catalog');

if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`public catalog error: ${error}\n`);
  process.exit(1);
}
process.stderr.write(`Public exercise catalog validated (${EXPECTED_COUNT} exercises, no forbidden keys)\n`);
