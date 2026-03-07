import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExerciseSearch } from '@/hooks/useExerciseSearch';
import { useStore } from '@/store';
import { buildExerciseGraph } from '@/data/graphBuilder';
import type { MuscleGroup, ExerciseTypeFilter, EquipmentGroup } from '@/types';

/**
 * Extended exercise fixtures for filter testing.
 * 15 exercises spanning all categories with known equipment and muscles.
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
    equipment: ['foam_roller'],
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

describe('Exercise filters', () => {
  beforeAll(() => {
    const graph = buildExerciseGraph(contextTestExercises);
    useStore.setState({ graph, graphReady: true });
  });

  beforeEach(() => {
    // Reset body state between tests
    useStore.setState((state) => ({
      library: { ...state.library, soreness: [], activities: [] },
    }));
  });

  // ─── Exercise Type Filter ────────────────────────────────

  describe('Exercise type filter', () => {
    it("'strength' shows only compound + isolation", () => {
      const { result } = renderHook(() =>
        useExerciseSearch('', { exerciseType: 'strength' as ExerciseTypeFilter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);
      expect(ids.length).toBe(STRENGTH_IDS.length);
      for (const id of STRENGTH_IDS) {
        expect(ids).toContain(id);
      }
      for (const id of [...WARMUP_IDS, ...COOLDOWN_IDS]) {
        expect(ids).not.toContain(id);
      }
    });

    it("'warmup' shows only stretch_dynamic + mobility + cardio", () => {
      const { result } = renderHook(() =>
        useExerciseSearch('', { exerciseType: 'warmup' as ExerciseTypeFilter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);
      expect(ids.length).toBe(WARMUP_IDS.length);
      for (const id of WARMUP_IDS) {
        expect(ids).toContain(id);
      }
      for (const id of [...STRENGTH_IDS, ...COOLDOWN_IDS]) {
        expect(ids).not.toContain(id);
      }
    });

    it("'cooldown' shows only stretch_static", () => {
      const { result } = renderHook(() =>
        useExerciseSearch('', { exerciseType: 'cooldown' as ExerciseTypeFilter, limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);
      expect(ids.length).toBe(COOLDOWN_IDS.length);
      for (const id of COOLDOWN_IDS) {
        expect(ids).toContain(id);
      }
      for (const id of [...STRENGTH_IDS, ...WARMUP_IDS]) {
        expect(ids).not.toContain(id);
      }
    });

    it('null shows all categories', () => {
      const { result } = renderHook(() =>
        useExerciseSearch('', { exerciseType: null, limit: 100 }),
      );

      expect(result.current.length).toBe(contextTestExercises.length);
    });
  });

  // ─── Equipment Group Filter ──────────────────────────────

  describe('Equipment group filter', () => {
    it("'barbell' shows only barbell/ez_bar/trap_bar exercises", () => {
      const { result } = renderHook(() =>
        useExerciseSearch('', { equipmentGroups: ['barbell' as EquipmentGroup], limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);
      // barbell_bench_press (barbell + flat_bench), barbell_squat (barbell), barbell_row (barbell)
      expect(ids).toContain('barbell_bench_press');
      expect(ids).toContain('barbell_squat');
      expect(ids).toContain('barbell_row');
      // Cable and machine exercises should not be included
      expect(ids).not.toContain('cable_flye');
      expect(ids).not.toContain('leg_extension');
    });

    it('multiple groups returns union', () => {
      const { result } = renderHook(() =>
        useExerciseSearch('', {
          equipmentGroups: ['barbell' as EquipmentGroup, 'cable' as EquipmentGroup],
          limit: 100,
        }),
      );

      const ids = result.current.map((e) => e.id);
      // Barbell exercises
      expect(ids).toContain('barbell_bench_press');
      expect(ids).toContain('barbell_squat');
      expect(ids).toContain('barbell_row');
      // Cable exercises
      expect(ids).toContain('cable_flye');
      expect(ids).toContain('tricep_pushdown');
    });

    it('empty array shows all exercises', () => {
      const { result } = renderHook(() =>
        useExerciseSearch('', { equipmentGroups: [], limit: 100 }),
      );

      expect(result.current.length).toBe(contextTestExercises.length);
    });
  });

  // ─── Auto-Apply Soreness ─────────────────────────────────

  describe('Auto-apply soreness', () => {
    it('excludes exercises targeting sore muscles, allows recovery', () => {
      useStore.setState((state) => ({
        library: {
          ...state.library,
          soreness: [{ muscle: 'chest' as MuscleGroup, level: 'moderate' as const }],
        },
      }));

      const { result } = renderHook(() =>
        useExerciseSearch('', { limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Chest strength exercises excluded
      expect(ids).not.toContain('barbell_bench_press');
      expect(ids).not.toContain('cable_flye');

      // Chest stretch (recovery) is allowed
      expect(ids).toContain('chest_stretch');

      // Non-chest exercises unaffected
      expect(ids).toContain('barbell_squat');
      expect(ids).toContain('barbell_row');
      expect(ids).toContain('leg_extension');
      expect(ids).toContain('tricep_pushdown');
    });

    it('recovery-category exercises for sore muscles pass through', () => {
      useStore.setState((state) => ({
        library: {
          ...state.library,
          soreness: [{ muscle: 'quadriceps' as MuscleGroup, level: 'severe' as const }],
        },
      }));

      const { result } = renderHook(() =>
        useExerciseSearch('', { limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Strength exercises targeting quads excluded
      expect(ids).not.toContain('barbell_squat');
      expect(ids).not.toContain('leg_extension');

      // Recovery exercises for quads allowed
      expect(ids).toContain('leg_swing_forward');
      expect(ids).toContain('quad_stretch');
      expect(ids).toContain('quad_mobility');
    });

    it("level 'none' does not filter", () => {
      useStore.setState((state) => ({
        library: {
          ...state.library,
          soreness: [{ muscle: 'chest' as MuscleGroup, level: 'none' as const }],
        },
      }));

      const { result } = renderHook(() =>
        useExerciseSearch('', { limit: 100 }),
      );

      expect(result.current.length).toBe(contextTestExercises.length);
    });
  });

  // ─── Auto-Apply Post-Activity ────────────────────────────

  describe('Auto-apply post-activity', () => {
    it('excludes exercises targeting fatigued leg muscles after run', () => {
      useStore.setState((state) => ({
        library: {
          ...state.library,
          activities: [{
            id: 'test-1',
            type: 'run' as const,
            timing: 'yesterday' as const,
            date: new Date().toISOString(),
          }],
        },
      }));

      const { result } = renderHook(() =>
        useExerciseSearch('', { limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Leg strength exercises excluded (run fatigues quads, hams, glutes, calves)
      expect(ids).not.toContain('barbell_squat');
      expect(ids).not.toContain('leg_extension');

      // Upper body unaffected
      expect(ids).toContain('barbell_bench_press');
      expect(ids).toContain('barbell_row');
      expect(ids).toContain('cable_flye');
      expect(ids).toContain('tricep_pushdown');

      // Recovery for fatigued muscles allowed
      expect(ids).toContain('leg_swing_forward');
      expect(ids).toContain('hamstring_stretch');
      expect(ids).toContain('quad_stretch');
      expect(ids).toContain('hip_circle');
      expect(ids).toContain('quad_mobility');
    });

    it("'general' activity has no muscle exclusion", () => {
      useStore.setState((state) => ({
        library: {
          ...state.library,
          activities: [{
            id: 'test-2',
            type: 'general' as const,
            timing: 'today' as const,
            date: new Date().toISOString(),
          }],
        },
      }));

      const { result } = renderHook(() =>
        useExerciseSearch('', { limit: 100 }),
      );

      // General activity has empty muscle impact → no exclusion
      expect(result.current.length).toBe(contextTestExercises.length);
    });

    it('recovery exercises for fatigued muscles pass through', () => {
      useStore.setState((state) => ({
        library: {
          ...state.library,
          activities: [{
            id: 'test-3',
            type: 'swim' as const,
            timing: 'today' as const,
            date: new Date().toISOString(),
          }],
        },
      }));

      const { result } = renderHook(() =>
        useExerciseSearch('', { limit: 100 }),
      );

      const ids = result.current.map((e) => e.id);

      // Barbell row targets upper_back — excluded
      expect(ids).not.toContain('barbell_row');

      // Recovery targeting swim muscles — allowed
      expect(ids).toContain('arm_circle');
      expect(ids).toContain('thoracic_rotation');
    });
  });

  // ─── Auto-Apply Pre-Activity ─────────────────────────────

  describe('Auto-apply pre-activity', () => {
    it('does not exclude exercises for tomorrow activities, but boosts recovery', () => {
      useStore.setState((state) => ({
        library: {
          ...state.library,
          activities: [{
            id: 'test-4',
            type: 'run' as const,
            timing: 'tomorrow' as const,
            date: new Date().toISOString(),
          }],
        },
      }));

      const { result } = renderHook(() =>
        useExerciseSearch('', { limit: 100 }),
      );

      // Tomorrow activities should NOT exclude anything
      expect(result.current.length).toBe(contextTestExercises.length);

      // Recovery exercises targeting run muscles should be boosted to top
      const ids = result.current.map((e) => e.id);
      const topIds = ids.slice(0, 3);
      // Leg swing targets hamstrings/quads, hip circle targets glutes, quad mobility targets quads
      const runRecoveryIds = ['leg_swing_forward', 'hip_circle', 'quad_mobility'];
      for (const id of runRecoveryIds) {
        expect(topIds).toContain(id);
      }
    });
  });
});
