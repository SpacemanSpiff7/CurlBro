/**
 * Integration tests for the expanded exercise dataset (345 exercises).
 *
 * Validates:
 *  - Schema compliance for every exercise
 *  - Graph integrity (no broken edges, bidirectional consistency)
 *  - New exercises (glute_drive_machine, sled_pull, ab_crunch_machine)
 *  - Equipment type consistency between JSON and TypeScript types
 *  - Load profile schema validation
 *  - Equipment filtering with new types (sled, hip_thrust_machine)
 */
import { describe, it, expect } from 'vitest';
import { getAllExercises, exerciseFiles } from './exercises';
import { buildExerciseGraph } from './graphBuilder';
import {
  ExerciseSchema,
  EQUIPMENT_TYPES,
  EQUIPMENT_GROUP_MEMBERS,
  LOAD_LEVELS,
  LoadProfileSchema,
  type ExerciseId,
  type EquipmentGroup,
} from '@/types';

// ─── Setup ──────────────────────────────────────────────────
const allExercises = getAllExercises();
const graph = buildExerciseGraph(allExercises);
const allIds = new Set(allExercises.map((e) => e.id));

// ─── Dataset Integrity ──────────────────────────────────────
describe('exercise dataset integrity', () => {
  it('has exactly 345 exercises', () => {
    expect(allExercises.length).toBe(345);
    expect(graph.exercises.size).toBe(345);
  });

  it('loads from 9 exercise files', () => {
    // exerciseFiles includes all 9 data files (01-09)
    const filesWithExercises = exerciseFiles.filter((f) => f.exercises.length > 0);
    expect(filesWithExercises.length).toBe(9);
  });

  it('has no duplicate exercise IDs', () => {
    const ids = allExercises.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('every exercise passes Zod schema validation', () => {
    const failures: string[] = [];
    for (const ex of allExercises) {
      const result = ExerciseSchema.safeParse(ex);
      if (!result.success) {
        failures.push(`${ex.id}: ${result.error.issues.map((i) => i.message).join(', ')}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('declared exercise_count matches actual count per file', () => {
    for (const file of exerciseFiles) {
      expect(file.exercise_count).toBe(file.exercises.length);
    }
  });
});

// ─── Graph Edge Integrity ────────────────────────────────────
describe('graph edge integrity', () => {
  it('has no broken substitute references', () => {
    const broken: string[] = [];
    for (const [id, subs] of graph.substitutes) {
      for (const subId of subs) {
        if (!graph.exercises.has(subId)) {
          broken.push(`${id} -> ${subId}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('has no broken complement references', () => {
    const broken: string[] = [];
    for (const [id, comps] of graph.complements) {
      for (const compId of comps) {
        if (!graph.exercises.has(compId)) {
          broken.push(`${id} -> ${compId}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('has no broken superset references', () => {
    const broken: string[] = [];
    for (const [id, supersets] of graph.supersets) {
      for (const ssId of supersets) {
        if (!graph.exercises.has(ssId)) {
          broken.push(`${id} -> ${ssId}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('has 3000+ total edges', () => {
    let total = 0;
    for (const subs of graph.substitutes.values()) total += subs.size;
    for (const comps of graph.complements.values()) total += comps.size;
    for (const ss of graph.supersets.values()) total += ss.size;
    expect(total).toBeGreaterThan(3000);
  });

  it('new exercises have bidirectional substitute edges', () => {
    // Verify our newly-added exercises have proper bidirectional edges.
    // Full dataset substitute edges are intentionally one-directional in many cases
    // (e.g., a machine is a substitute for barbell but not vice versa).
    const newIds = ['glute_drive_machine', 'sled_pull', 'ab_crunch_machine'] as const;
    const missing: string[] = [];
    for (const id of newIds) {
      const subs = graph.substitutes.get(id as ExerciseId);
      if (subs) {
        for (const subId of subs) {
          const reverse = graph.substitutes.get(subId);
          if (!reverse?.has(id as ExerciseId)) {
            missing.push(`${id} -> ${subId} (missing reverse)`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

// ─── New Exercises ───────────────────────────────────────────
describe('new exercise: glute_drive_machine', () => {
  const ex = allExercises.find((e) => e.id === 'glute_drive_machine');

  it('exists in the dataset', () => {
    expect(ex).toBeDefined();
  });

  it('has correct basic properties', () => {
    expect(ex!.category).toBe('compound');
    expect(ex!.movement_pattern).toBe('hip_extension');
    expect(ex!.force_type).toBe('push');
    expect(ex!.equipment).toEqual(['hip_thrust_machine']);
    expect(ex!.primary_muscles).toContain('glutes');
    expect(ex!.difficulty).toBe('beginner');
    expect(ex!.workout_position).toBe('early_mid');
  });

  it('has valid substitute references', () => {
    for (const subId of ex!.substitutes) {
      expect(allIds.has(subId)).toBe(true);
    }
    expect(ex!.substitutes).toContain('hip_thrust');
    expect(ex!.substitutes).toContain('glute_bridge');
  });

  it('has valid complement references', () => {
    for (const compId of ex!.complements) {
      expect(allIds.has(compId)).toBe(true);
    }
  });

  it('has valid superset candidate references', () => {
    for (const ssId of ex!.superset_candidates) {
      expect(allIds.has(ssId)).toBe(true);
    }
  });

  it('has back-edges from substitutes', () => {
    const hipThrust = allExercises.find((e) => e.id === 'hip_thrust');
    const smithHipThrust = allExercises.find((e) => e.id === 'smith_machine_hip_thrust');
    const gluteBridge = allExercises.find((e) => e.id === 'glute_bridge');

    expect(hipThrust!.substitutes).toContain('glute_drive_machine');
    expect(smithHipThrust!.substitutes).toContain('glute_drive_machine');
    expect(gluteBridge!.substitutes).toContain('glute_drive_machine');
  });

  it('has a complete load_profile', () => {
    const lp = (ex as Record<string, unknown>).load_profile;
    expect(lp).toBeDefined();
    const result = LoadProfileSchema.safeParse(lp);
    expect(result.success).toBe(true);
  });

  it('is indexed by equipment in the graph', () => {
    const htmExercises = graph.byEquipment.get('hip_thrust_machine');
    expect(htmExercises).toBeDefined();
    expect(htmExercises!.has('glute_drive_machine' as ExerciseId)).toBe(true);
  });

  it('is indexed by muscle in the graph', () => {
    const gluteExercises = graph.byMuscle.get('glutes');
    expect(gluteExercises).toBeDefined();
    expect(gluteExercises!.has('glute_drive_machine' as ExerciseId)).toBe(true);
  });
});

describe('new exercise: sled_pull', () => {
  const ex = allExercises.find((e) => e.id === 'sled_pull');

  it('exists in the dataset', () => {
    expect(ex).toBeDefined();
  });

  it('has correct basic properties', () => {
    expect(ex!.category).toBe('compound');
    expect(ex!.movement_pattern).toBe('full_body_conditioning');
    expect(ex!.force_type).toBe('pull');
    expect(ex!.equipment).toEqual(['sled']);
    expect(ex!.primary_muscles).toEqual(expect.arrayContaining(['quadriceps', 'hamstrings', 'glutes']));
    expect(ex!.difficulty).toBe('beginner');
  });

  it('has valid substitute references', () => {
    for (const subId of ex!.substitutes) {
      expect(allIds.has(subId)).toBe(true);
    }
  });

  it('has valid complement references', () => {
    for (const compId of ex!.complements) {
      expect(allIds.has(compId)).toBe(true);
    }
  });

  it('has back-edges from sled_push', () => {
    const sledPush = allExercises.find((e) => e.id === 'sled_push');
    expect(sledPush!.substitutes).toContain('sled_pull');
    expect(sledPush!.complements).toContain('sled_pull');
  });

  it('has back-edge from treadmill_walk', () => {
    const tw = allExercises.find((e) => e.id === 'treadmill_walk');
    expect(tw!.substitutes).toContain('sled_pull');
  });

  it('has a complete load_profile', () => {
    const lp = (ex as Record<string, unknown>).load_profile;
    expect(lp).toBeDefined();
    const result = LoadProfileSchema.safeParse(lp);
    expect(result.success).toBe(true);
  });

  it('is indexed by equipment "sled" in the graph', () => {
    const sledExercises = graph.byEquipment.get('sled');
    expect(sledExercises).toBeDefined();
    expect(sledExercises!.has('sled_pull' as ExerciseId)).toBe(true);
  });
});

describe('restored exercise: ab_crunch_machine', () => {
  const ex = allExercises.find((e) => e.id === 'ab_crunch_machine');

  it('exists in the dataset', () => {
    expect(ex).toBeDefined();
  });

  it('has correct basic properties', () => {
    expect(ex!.category).toBe('isolation');
    expect(ex!.movement_pattern).toBe('spinal_flexion');
    expect(ex!.force_type).toBe('pull');
    expect(ex!.equipment).toEqual(['ab_crunch_machine']);
    expect(ex!.primary_muscles).toContain('core');
    expect(ex!.difficulty).toBe('beginner');
    expect(ex!.workout_position).toBe('late');
  });

  it('has valid edge references', () => {
    for (const subId of ex!.substitutes) {
      expect(allIds.has(subId)).toBe(true);
    }
    for (const compId of ex!.complements) {
      expect(allIds.has(compId)).toBe(true);
    }
    for (const ssId of ex!.superset_candidates) {
      expect(allIds.has(ssId)).toBe(true);
    }
  });

  it('has a complete load_profile', () => {
    const lp = (ex as Record<string, unknown>).load_profile;
    expect(lp).toBeDefined();
    const result = LoadProfileSchema.safeParse(lp);
    expect(result.success).toBe(true);
  });
});

describe('sled_push equipment fix', () => {
  const ex = allExercises.find((e) => e.id === 'sled_push');

  it('uses sled equipment (not bodyweight)', () => {
    expect(ex!.equipment).toEqual(['sled']);
  });

  it('is indexed under "sled" equipment in the graph', () => {
    const sledExercises = graph.byEquipment.get('sled');
    expect(sledExercises).toBeDefined();
    expect(sledExercises!.has('sled_push' as ExerciseId)).toBe(true);
  });

  it('is NOT indexed under "bodyweight" equipment', () => {
    const bwExercises = graph.byEquipment.get('bodyweight');
    expect(bwExercises?.has('sled_push' as ExerciseId) ?? false).toBe(false);
  });
});

// ─── Equipment Type Consistency ──────────────────────────────
describe('equipment type consistency', () => {
  it('new equipment types exist in EQUIPMENT_TYPES', () => {
    const eqTypes = EQUIPMENT_TYPES as readonly string[];
    expect(eqTypes).toContain('hip_thrust_machine');
    expect(eqTypes).toContain('sled');
    expect(eqTypes).toContain('ab_crunch_machine');
  });

  it('all exercise equipment values are in EQUIPMENT_TYPES', () => {
    const eqSet = new Set<string>(EQUIPMENT_TYPES);
    const unknownEquipment: string[] = [];
    for (const ex of allExercises) {
      for (const eq of ex.equipment) {
        if (!eqSet.has(eq)) {
          unknownEquipment.push(`${ex.id}: ${eq}`);
        }
      }
    }
    expect(unknownEquipment).toEqual([]);
  });

  it('all EQUIPMENT_GROUP_MEMBERS entries exist in EQUIPMENT_TYPES', () => {
    const eqSet = new Set<string>(EQUIPMENT_TYPES);
    const missing: string[] = [];
    for (const [group, members] of Object.entries(EQUIPMENT_GROUP_MEMBERS)) {
      for (const member of members) {
        if (!eqSet.has(member)) {
          missing.push(`${group}: ${member}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('sled is in the cardio equipment group', () => {
    expect(EQUIPMENT_GROUP_MEMBERS['cardio' as EquipmentGroup]).toContain('sled');
  });

  it('hip_thrust_machine is in the machine equipment group', () => {
    expect(EQUIPMENT_GROUP_MEMBERS['machine' as EquipmentGroup]).toContain('hip_thrust_machine');
  });
});

// ─── Load Profile Validation ─────────────────────────────────
describe('load_profile validation', () => {
  const exercisesWithLoadProfile = allExercises.filter(
    (e) => (e as Record<string, unknown>).load_profile != null
  );

  it('most exercises have a load_profile', () => {
    // All 320 from feature branch + 3 new ones should have load_profile
    expect(exercisesWithLoadProfile.length).toBeGreaterThan(300);
  });

  it('all load_profiles pass schema validation', () => {
    const failures: string[] = [];
    for (const ex of exercisesWithLoadProfile) {
      const lp = (ex as Record<string, unknown>).load_profile;
      const result = LoadProfileSchema.safeParse(lp);
      if (!result.success) {
        failures.push(`${ex.id}: ${result.error.issues.map((i) => i.message).join(', ')}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('all load_profile values use valid load levels', () => {
    const validLevels = new Set(LOAD_LEVELS);
    const invalid: string[] = [];
    for (const ex of exercisesWithLoadProfile) {
      const lp = (ex as Record<string, unknown>).load_profile as Record<string, string>;
      for (const [key, value] of Object.entries(lp)) {
        if (!validLevels.has(value as typeof LOAD_LEVELS[number])) {
          invalid.push(`${ex.id}.${key}: ${value}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('all load_profiles have exactly 7 fields', () => {
    const expectedFields = ['spinal', 'shoulder', 'elbow', 'knee', 'grip', 'lumbar_stabilizer', 'rotator_cuff'];
    const mismatched: string[] = [];
    for (const ex of exercisesWithLoadProfile) {
      const lp = (ex as Record<string, unknown>).load_profile as Record<string, string>;
      const keys = Object.keys(lp).sort();
      if (keys.length !== 7 || !expectedFields.every((f) => keys.includes(f))) {
        mismatched.push(`${ex.id}: ${keys.join(', ')}`);
      }
    }
    expect(mismatched).toEqual([]);
  });
});

// ─── Graph Index Completeness ─────────────────────────────────
describe('graph index completeness', () => {
  it('indexes all 14 muscle groups', () => {
    expect(graph.byMuscle.size).toBeGreaterThanOrEqual(14);
  });

  it('indexes all 3 force types', () => {
    expect(graph.byForceType.has('push')).toBe(true);
    expect(graph.byForceType.has('pull')).toBe(true);
    expect(graph.byForceType.has('isometric')).toBe(true);
  });

  it('every exercise is indexed by at least one muscle', () => {
    const indexedByMuscle = new Set<string>();
    for (const ids of graph.byMuscle.values()) {
      for (const id of ids) indexedByMuscle.add(id);
    }
    for (const ex of allExercises) {
      expect(indexedByMuscle.has(ex.id as string)).toBe(true);
    }
  });

  it('every exercise is indexed by at least one equipment type', () => {
    const indexedByEquip = new Set<string>();
    for (const ids of graph.byEquipment.values()) {
      for (const id of ids) indexedByEquip.add(id);
    }
    for (const ex of allExercises) {
      expect(indexedByEquip.has(ex.id as string)).toBe(true);
    }
  });

  it('every exercise is indexed by movement pattern', () => {
    const indexedByPattern = new Set<string>();
    for (const ids of graph.byPattern.values()) {
      for (const id of ids) indexedByPattern.add(id);
    }
    for (const ex of allExercises) {
      expect(indexedByPattern.has(ex.id as string)).toBe(true);
    }
  });
});
