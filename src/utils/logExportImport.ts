/**
 * Log export/import: versioned JSON envelope with Zod validation.
 * Pure functions — no state access.
 */
import { z } from 'zod';
import { WorkoutLogSchema } from '@/types';
import type { WorkoutLog, LogId, WorkoutId, ExerciseId } from '@/types';

// ─── Export Envelope ─────────────────────────────────────
const LOG_EXPORT_VERSION = 1;
const APP_IDENTIFIER = 'curlbro';

export const LogExportEnvelopeSchema = z.object({
  version: z.number().int().min(1),
  app: z.literal(APP_IDENTIFIER),
  exportedAt: z.string(),
  logCount: z.number().int().min(0),
  logs: z.array(z.unknown()),
});

export type LogExportEnvelope = z.infer<typeof LogExportEnvelopeSchema>;

// ─── Import Result ───────────────────────────────────────
export interface LogImportResult {
  logs: WorkoutLog[];
  newLogs: WorkoutLog[];
  duplicateCount: number;
  warnings: string[];
  errors: string[];
}

// ─── Export ──────────────────────────────────────────────
export function createLogExport(logs: WorkoutLog[]): string {
  const envelope: LogExportEnvelope = {
    version: LOG_EXPORT_VERSION,
    app: APP_IDENTIFIER,
    exportedAt: new Date().toISOString(),
    logCount: logs.length,
    logs,
  };
  return JSON.stringify(envelope, null, 2);
}

// ─── Import ──────────────────────────────────────────────

/** Backfill defaults on a raw log object (mirrors store hydration logic). */
function backfillLog(raw: Record<string, unknown>): Record<string, unknown> {
  // Top-level defaults
  if (typeof raw.notes !== 'string') raw.notes = '';
  if (!raw.weightUnit) raw.weightUnit = 'lb';
  if (!raw.distanceUnit) raw.distanceUnit = 'mi';

  const exercises = raw.exercises;
  if (Array.isArray(exercises)) {
    for (const ex of exercises) {
      if (ex && typeof ex === 'object') {
        const e = ex as Record<string, unknown>;
        if (typeof e.planNotes !== 'string') e.planNotes = '';
        if (typeof e.trackWeight !== 'boolean') e.trackWeight = true;
        if (typeof e.trackReps !== 'boolean') e.trackReps = true;
        if (typeof e.trackDuration !== 'boolean') e.trackDuration = false;
        if (typeof e.trackDistance !== 'boolean') e.trackDistance = false;

        const sets = e.sets;
        if (Array.isArray(sets)) {
          for (const s of sets) {
            if (s && typeof s === 'object') {
              const set = s as Record<string, unknown>;
              if (set.durationSeconds === undefined) set.durationSeconds = null;
              if (set.distanceMeters === undefined) set.distanceMeters = null;
            }
          }
        }
      }
    }
  }

  return raw;
}

export function parseLogImport(
  json: string,
  existingLogIds: Set<string>,
): LogImportResult {
  const result: LogImportResult = {
    logs: [],
    newLogs: [],
    duplicateCount: 0,
    warnings: [],
    errors: [],
  };

  // 1. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    result.errors.push('Invalid JSON file');
    return result;
  }

  // 2. Validate envelope
  const envelopeResult = LogExportEnvelopeSchema.safeParse(parsed);
  if (!envelopeResult.success) {
    // Check if it's a JSON file but not a CurlBro export
    if (parsed && typeof parsed === 'object' && !('app' in (parsed as Record<string, unknown>))) {
      result.errors.push('Not a CurlBro export file');
    } else {
      result.errors.push('Invalid export file format');
    }
    return result;
  }

  const envelope = envelopeResult.data;

  // 3. Future version warning
  if (envelope.version > LOG_EXPORT_VERSION) {
    result.warnings.push(
      `File was created by a newer version of CurlBro (v${envelope.version}). Some data may not import correctly.`,
    );
  }

  // 4. logCount mismatch warning
  if (envelope.logCount !== envelope.logs.length) {
    result.warnings.push(
      `Expected ${envelope.logCount} logs but found ${envelope.logs.length}`,
    );
  }

  // 5. Validate each log
  for (let i = 0; i < envelope.logs.length; i++) {
    const rawLog = envelope.logs[i];
    if (!rawLog || typeof rawLog !== 'object') {
      result.warnings.push(`Log ${i + 1}: skipped (not an object)`);
      continue;
    }

    // Backfill missing fields before validation
    const backfilled = backfillLog(rawLog as Record<string, unknown>);
    const logResult = WorkoutLogSchema.safeParse(backfilled);

    if (!logResult.success) {
      result.warnings.push(`Log ${i + 1}: skipped (invalid data)`);
      continue;
    }

    // Cast branded types (Zod validates as plain strings)
    const log = logResult.data as unknown as WorkoutLog;
    (log as { id: LogId }).id = logResult.data.id as LogId;
    (log as { workoutId: WorkoutId }).workoutId = logResult.data.workoutId as WorkoutId;
    for (const ex of log.exercises) {
      (ex as { exerciseId: ExerciseId }).exerciseId = ex.exerciseId as unknown as ExerciseId;
    }

    result.logs.push(log);

    // Dedup check
    if (existingLogIds.has(log.id)) {
      result.duplicateCount++;
    } else {
      result.newLogs.push(log);
    }
  }

  return result;
}
