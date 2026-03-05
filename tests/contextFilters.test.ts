import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExerciseSearch } from '@/hooks/useExerciseSearch';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import type { ContextFilter, Category, MuscleGroup } from '@/types';

/**
 * Extended exercise fixtures for context-filter testing.
 * Adds stretch_dynamic, stretch_static, and mobility exercises
 * on top of the standard 8-exercise test graph.
 */
const contextTestExercises = [
  // ── Compound (strength) ──────────────────────────────────
  {
    id: 'barbell_bench_press',
    name: 'Barbell Bench Press (Flat)',
    category: 'compound' as const,
    movement_pattern: 'horizontal_push',
    force_type: 'push' as const,
    equipment: ['barbell', 'flat_bench'],
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    workout_position: 'early' as const,
    difficulty: 'intermediate' as const,
    bilateral: true,
    rep_range_hypertrophy: '6-12',
    rep_range_strength: '1-5',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'barbell_squat',
    name: 'Barbell Back Squat',
    category: 'compound' as const,
    movement_pattern: 'squat',
    force_type: 'push' as const,
    equipment: ['barbell'],
    primary_muscles: ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings', 'core'],
    workout_position: 'early' as const,
    difficulty: 'intermediate' as const,
    bilateral: true,
    rep_range_hypertrophy: '6-12',
    rep_range_strength: '1-5',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'barbell_row',
    name: 'Barbell Row',
    category: 'compound' as const,
    movement_pattern: 'horizontal_pull',
    force_type: 'pull' as const,
    equipment: ['barbell'],
    primary_muscles: ['upper_back'],
    secondary_muscles: ['biceps', 'forearms'],
    workout_position: 'early' as const,
    difficulty: 'intermediate' as const,
    bilateral: true,
    rep_range_hypertrophy: '6-12',
    rep_range_strength: '3-6',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },

  // ── Isolation (strength) ─────────────────────────────────
  {
    id: 'cable_flye',
    name: 'Cable Flye (Mid-Height)',
    category: 'isolation' as const,
    movement_pattern: 'chest_fly',
    force_type: 'push' as const,
    equipment: ['cable_machine'],
    primary_muscles: ['chest'],
    secondary_muscles: ['shoulders'],
    workout_position: 'mid_late' as const,
    difficulty: 'beginner' as const,
    bilateral: true,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '8-12',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'leg_extension',
    name: 'Leg Extension',
    category: 'isolation' as const,
    movement_pattern: 'knee_extension',
    force_type: 'push' as const,
    equipment: ['leg_extension_machine'],
    primary_muscles: ['quadriceps'],
    secondary_muscles: [],
    workout_position: 'mid_late' as const,
    difficulty: 'beginner' as const,
    bilateral: true,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '8-12',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'tricep_pushdown',
    name: 'Tricep Pushdown',
    category: 'isolation' as const,
    movement_pattern: 'elbow_extension',
    force_type: 'push' as const,
    equipment: ['cable_machine'],
    primary_muscles: ['triceps'],
    secondary_muscles: [],
    workout_position: 'late' as const,
    difficulty: 'beginner' as const,
    bilateral: true,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '8-12',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },

  // ── Dynamic Stretches (warm-up) ──────────────────────────
  {
    id: 'leg_swing_forward',
    name: 'Leg Swing (Forward/Back)',
    category: 'stretch_dynamic' as const,
    movement_pattern: 'hip_flexion',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['hamstrings', 'quadriceps'],
    secondary_muscles: ['glutes'],
    workout_position: 'early' as const,
    difficulty: 'beginner' as const,
    bilateral: false,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '10-15',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'arm_circle',
    name: 'Arm Circle',
    category: 'stretch_dynamic' as const,
    movement_pattern: 'shoulder_rotation',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['shoulders'],
    secondary_muscles: ['upper_back'],
    workout_position: 'early' as const,
    difficulty: 'beginner' as const,
    bilateral: true,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '10-15',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },

  // ── Mobility ─────────────────────────────────────────────
  {
    id: 'hip_circle',
    name: 'Hip Circle',
    category: 'mobility' as const,
    movement_pattern: 'hip_rotation',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['glutes', 'adductors'],
    secondary_muscles: ['core'],
    workout_position: 'early' as const,
    difficulty: 'beginner' as const,
    bilateral: false,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '10-15',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'thoracic_rotation',
    name: 'Thoracic Spine Rotation',
    category: 'mobility' as const,
    movement_pattern: 'spinal_rotation',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['upper_back', 'core'],
    secondary_muscles: [],
    workout_position: 'early' as const,
    difficulty: 'beginner' as const,
    bilateral: false,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '10-15',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'quad_mobility',
    name: 'Quad Mobilization',
    category: 'mobility' as const,
    movement_pattern: 'knee_flexion',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['quadriceps'],
    secondary_muscles: [],
    workout_position: 'early' as const,
    difficulty: 'beginner' as const,
    bilateral: false,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '10-15',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },

  // ── Static Stretches (cool-down) ─────────────────────────
  {
    id: 'chest_stretch',
    name: 'Doorway Chest Stretch',
    category: 'stretch_static' as const,
    movement_pattern: 'chest_stretch',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['chest'],
    secondary_muscles: ['shoulders'],
    workout_position: 'late' as const,
    difficulty: 'beginner' as const,
    bilateral: true,
    rep_range_hypertrophy: '30s hold',
    rep_range_strength: '30s hold',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'hamstring_stretch',
    name: 'Seated Hamstring Stretch',
    category: 'stretch_static' as const,
    movement_pattern: 'hip_flexion_stretch',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['hamstrings'],
    secondary_muscles: ['calves'],
    workout_position: 'late' as const,
    difficulty: 'beginner' as const,
    bilateral: true,
    rep_range_hypertrophy: '30s hold',
    rep_range_strength: '30s hold',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
  {
    id: 'quad_stretch',
    name: 'Standing Quad Stretch',
    category: 'stretch_static' as const,
    movement_pattern: 'knee_flexion_stretch',
    force_type: 'isometric' as const,
    equipment: ['bodyweight'],
    primary_muscles: ['quadriceps'],
    secondary_muscles: [],
    workout_position: 'late' as const,
    difficulty: 'beginner' as const,
    bilateral: false,
    rep_range_hypertrophy: '30s hold',
    rep_range_strength: '30s hold',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  },
];

// Helpers
const COMPOUND_IDS = ['barbell_bench_press', 'barbell_squat', 'barbell_row'];
const ISOLATION_IDS = ['cable_flye', 'leg_extension', 'tricep_pushdown'];
const STRETCH_DYNAMIC_IDS = ['leg_swing_forward', 'arm_circle'];
const MOBILITY_IDS = ['hip_circle', 'thoracic_rotation', 'quad_mobility'];
const STRETCH_STATIC_IDS = ['chest_stretch', 'hamstring_stretch', 'quad_stretch'];

const STRENGTH_IDS = [...COMPOUND_IDS, ...ISOLATION_IDS];
const WARMUP_IDS = [...STRETCH_DYNAMIC_IDS, ...MOBILITY_IDS];
const COOLDOWN_IDS = [...STRETCH_STATIC_IDS];
const RECOVERY_IDS = [...STRETCH_DYNAMIC_IDS, ...STRETCH_STATIC_IDS, ...MOBILITY_IDS];

describe('Context-aware exercise filters', () => {
  beforeAll(() => {
    const graph = buildExerciseGraph(contextTestExercises);
    useStore.setState({ graph, graphReady: true });
  });

  beforeEach(() => {
    // Reset soreness between tests so light_day doesn't pick up stale state
    useStore.setState((state) => ({
      library: { ...state.library, soreness: [] },
    }));
  });

  // ─── Category Filters ──────────────────────────────────────

  describe('category filter', () => {
    it('compound + isolation shows only strength exercises', () => {
      const filter: ContextFilter = {
        type: 'category',
        categories: ['compound', 'isolation'],
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);
      expect(ids.length).toBe(STRENGTH_IDS.length);
      for (const id of STRENGTH_IDS) {
        expect(ids).toContain(id);
      }
      // No warm-up or cool-down exercises
      for (const id of [...WARMUP_IDS, ...COOLDOWN_IDS]) {
        expect(ids).not.toContain(id);
      }
    });

    it('stretch_dynamic + mobility shows only warm-up exercises', () => {
      const filter: ContextFilter = {
        type: 'category',
        categories: ['stretch_dynamic', 'mobility'],
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);
      expect(ids.length).toBe(WARMUP_IDS.length);
      for (const id of WARMUP_IDS) {
        expect(ids).toContain(id);
      }
      // No strength or cool-down exercises
      for (const id of [...STRENGTH_IDS, ...COOLDOWN_IDS]) {
        expect(ids).not.toContain(id);
      }
    });

    it('stretch_static shows only cool-down exercises', () => {
      const filter: ContextFilter = {
        type: 'category',
        categories: ['stretch_static'],
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);
      expect(ids.length).toBe(COOLDOWN_IDS.length);
      for (const id of COOLDOWN_IDS) {
        expect(ids).toContain(id);
      }
      // No strength or warm-up exercises
      for (const id of [...STRENGTH_IDS, ...WARMUP_IDS]) {
        expect(ids).not.toContain(id);
      }
    });
  });

  // ─── Sore Muscle Filter ────────────────────────────────────

  describe('sore muscle filter', () => {
    it('moderate soreness: excludes exercises targeting that muscle as primary, allows recovery', () => {
      const filter: ContextFilter = {
        type: 'sore_muscle',
        muscle: 'chest' as MuscleGroup,
        level: 'moderate',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Compound/isolation chest exercises should be excluded
      expect(ids).not.toContain('barbell_bench_press'); // compound, primary chest
      expect(ids).not.toContain('cable_flye');          // isolation, primary chest

      // Static chest stretch should be ALLOWED (recovery category)
      expect(ids).toContain('chest_stretch');

      // Non-chest exercises should be unaffected
      expect(ids).toContain('barbell_squat');
      expect(ids).toContain('barbell_row');
      expect(ids).toContain('leg_extension');
      expect(ids).toContain('tricep_pushdown');
    });

    it('mild soreness: does not exclude anything', () => {
      const filter: ContextFilter = {
        type: 'sore_muscle',
        muscle: 'chest' as MuscleGroup,
        level: 'mild',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      // All exercises should be present
      expect(result.current.length).toBe(contextTestExercises.length);
    });

    it('none soreness level: does not exclude anything', () => {
      const filter: ContextFilter = {
        type: 'sore_muscle',
        muscle: 'chest' as MuscleGroup,
        level: 'none',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      expect(result.current.length).toBe(contextTestExercises.length);
    });

    it('severe soreness: excludes exercises targeting that muscle as primary', () => {
      const filter: ContextFilter = {
        type: 'sore_muscle',
        muscle: 'quadriceps' as MuscleGroup,
        level: 'severe',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Quad-primary strength exercises excluded
      expect(ids).not.toContain('barbell_squat');   // compound, primary quads
      expect(ids).not.toContain('leg_extension');    // isolation, primary quads

      // Dynamic stretch for quads — recovery category, ALLOWED
      expect(ids).toContain('leg_swing_forward');    // stretch_dynamic, primary quads + hams

      // Quad static stretch — recovery category, ALLOWED
      expect(ids).toContain('quad_stretch');

      // Quad mobility — recovery category, ALLOWED
      expect(ids).toContain('quad_mobility');
    });
  });

  // ─── Post-Activity Filter ─────────────────────────────────

  describe('post-activity filter', () => {
    it('excludes exercises targeting fatigued muscles, allows recovery categories', () => {
      // After a run, fatigued muscles are: quadriceps, hamstrings, glutes, calves
      const filter: ContextFilter = {
        type: 'post_activity',
        activity: 'run',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Strength exercises targeting fatigued muscles should be excluded
      expect(ids).not.toContain('barbell_squat');  // primary: quadriceps, glutes
      expect(ids).not.toContain('leg_extension');   // primary: quadriceps

      // Upper body strength should be unaffected
      expect(ids).toContain('barbell_bench_press');
      expect(ids).toContain('barbell_row');
      expect(ids).toContain('cable_flye');
      expect(ids).toContain('tricep_pushdown');

      // Recovery categories targeting fatigued muscles should be ALLOWED
      expect(ids).toContain('leg_swing_forward');   // stretch_dynamic, primary: hamstrings, quadriceps
      expect(ids).toContain('hamstring_stretch');    // stretch_static, primary: hamstrings
      expect(ids).toContain('quad_stretch');         // stretch_static, primary: quadriceps
      expect(ids).toContain('hip_circle');           // mobility, primary: glutes, adductors
      expect(ids).toContain('quad_mobility');        // mobility, primary: quadriceps
    });

    it('yoga (no fatigued muscles) returns all exercises', () => {
      const filter: ContextFilter = {
        type: 'post_activity',
        activity: 'yoga',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      expect(result.current.length).toBe(contextTestExercises.length);
    });

    it('swim excludes upper body strength for fatigued muscles', () => {
      // Swim fatigues: upper_back, shoulders, core
      const filter: ContextFilter = {
        type: 'post_activity',
        activity: 'swim',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Barbell row targets upper_back — excluded
      expect(ids).not.toContain('barbell_row');

      // Arm circle targets shoulders — recovery category, ALLOWED
      expect(ids).toContain('arm_circle');

      // Thoracic rotation targets upper_back + core — recovery category, ALLOWED
      expect(ids).toContain('thoracic_rotation');

      // Leg exercises should be unaffected
      expect(ids).toContain('barbell_squat');
      expect(ids).toContain('leg_extension');
    });
  });

  // ─── Pre-Activity Filter ──────────────────────────────────

  describe('pre-activity filter', () => {
    it('shows only dynamic stretches and mobility targeting the activity muscles', () => {
      // Pre-run: muscles = quadriceps, hamstrings, glutes, calves
      const filter: ContextFilter = {
        type: 'pre_activity',
        activity: 'run',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Dynamic stretch targeting quads/hams — included
      expect(ids).toContain('leg_swing_forward');

      // Mobility targeting glutes — included
      expect(ids).toContain('hip_circle');

      // Mobility targeting quads — included
      expect(ids).toContain('quad_mobility');

      // No strength exercises
      for (const id of STRENGTH_IDS) {
        expect(ids).not.toContain(id);
      }

      // No static stretches (those are cool-down, not warm-up)
      for (const id of STRETCH_STATIC_IDS) {
        expect(ids).not.toContain(id);
      }

      // Arm circle targets shoulders — not a run muscle, excluded
      expect(ids).not.toContain('arm_circle');
    });

    it('pre-swim shows upper body dynamic stretches and mobility', () => {
      // Pre-swim: muscles = upper_back, shoulders, core
      const filter: ContextFilter = {
        type: 'pre_activity',
        activity: 'swim',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Arm circle targets shoulders — included
      expect(ids).toContain('arm_circle');

      // Thoracic rotation targets upper_back + core — included
      expect(ids).toContain('thoracic_rotation');

      // Leg warm-up exercises should NOT be included (not swim muscles)
      expect(ids).not.toContain('leg_swing_forward');
      expect(ids).not.toContain('hip_circle');

      // No strength exercises
      for (const id of STRENGTH_IDS) {
        expect(ids).not.toContain(id);
      }
    });

    it('pre-yoga (no target muscles) returns all exercises (no filtering needed)', () => {
      // Yoga has no ACTIVITY_MUSCLE_IMPACT muscles, so the pre-activity filter
      // short-circuits and returns everything (no muscles to warm up for).
      const filter: ContextFilter = {
        type: 'pre_activity',
        activity: 'yoga',
      };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      expect(result.current.length).toBe(contextTestExercises.length);
    });
  });

  // ─── Light Day Filter ─────────────────────────────────────

  describe('light day filter', () => {
    it('with no soreness: shows all stretches/mobility + all isolation exercises', () => {
      // No soreness entries set (cleared in beforeEach)
      const filter: ContextFilter = { type: 'light_day' };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // All recovery exercises are included
      for (const id of RECOVERY_IDS) {
        expect(ids).toContain(id);
      }

      // Isolation exercises for non-sore muscles (no sore muscles = all isolation allowed)
      for (const id of ISOLATION_IDS) {
        expect(ids).toContain(id);
      }

      // Compound exercises are excluded on a light day
      for (const id of COMPOUND_IDS) {
        expect(ids).not.toContain(id);
      }
    });

    it('with sore muscles: shows stretches/mobility + isolation for non-sore muscles only', () => {
      // Set chest as sore
      useStore.setState((state) => ({
        library: {
          ...state.library,
          soreness: [
            { muscle: 'chest' as MuscleGroup, level: 'moderate' as const },
          ],
        },
      }));

      const filter: ContextFilter = { type: 'light_day' };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // All recovery exercises still included (stretches/mobility always allowed)
      for (const id of RECOVERY_IDS) {
        expect(ids).toContain(id);
      }

      // cable_flye targets chest (sore) — isolation for sore muscle, EXCLUDED
      expect(ids).not.toContain('cable_flye');

      // leg_extension targets quads (not sore) — INCLUDED
      expect(ids).toContain('leg_extension');

      // tricep_pushdown targets triceps (not sore) — INCLUDED
      expect(ids).toContain('tricep_pushdown');

      // All compound exercises excluded regardless
      for (const id of COMPOUND_IDS) {
        expect(ids).not.toContain(id);
      }
    });

    it('soreness with level "none" is ignored for light day exclusions', () => {
      // Set chest soreness to 'none' — should not affect isolation filtering
      useStore.setState((state) => ({
        library: {
          ...state.library,
          soreness: [
            { muscle: 'chest' as MuscleGroup, level: 'none' as const },
          ],
        },
      }));

      const filter: ContextFilter = { type: 'light_day' };
      const { result } = renderHook(() =>
        useExerciseSearch('', { contextFilter: filter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // cable_flye should be included because 'none' level is filtered out
      expect(ids).toContain('cable_flye');
      expect(ids).toContain('leg_extension');
      expect(ids).toContain('tricep_pushdown');
    });
  });
});
