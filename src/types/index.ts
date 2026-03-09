import { z } from 'zod';

// ─── Branded Types ────────────────────────────────────────
type Brand<T, B extends string> = T & { readonly __brand: B };
export type ExerciseId = Brand<string, 'ExerciseId'>;
export type WorkoutId = Brand<string, 'WorkoutId'>;
export type LogId = Brand<string, 'LogId'>;

// ─── Enums ────────────────────────────────────────────────
export const MUSCLE_GROUPS = [
  'chest', 'upper_back', 'shoulders', 'traps', 'biceps', 'triceps',
  'forearms', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core',
  'adductors', 'abductors',
] as const;
export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const FORCE_TYPES = ['push', 'pull', 'isometric'] as const;
export type ForceType = typeof FORCE_TYPES[number];

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'ez_bar', 'cable_machine', 'smith_machine',
  'leg_press_machine', 'hack_squat_machine', 'pendulum_squat_machine',
  'belt_squat_machine', 'leg_extension_machine', 'leg_curl_machine',
  'chest_press_machine', 'shoulder_press_machine', 'lat_pulldown_machine',
  'seated_row_machine', 'pec_deck_machine', 'reverse_fly_machine',
  'pullover_machine', 'lateral_raise_machine', 'hip_adduction_machine',
  'hip_abduction_machine', 'calf_raise_machine', 'assisted_pull_up_machine',
  'ab_crunch_machine', 'hip_thrust_machine', 'pull_up_bar', 'dip_station', 'flat_bench',
  'adjustable_bench', 'preacher_curl_bench', 'roman_chair', 'ab_wheel', 'kettlebell',
  'resistance_band', 'trap_bar', 'medicine_ball', 'battle_ropes', 'bodyweight',
  'foam_roller', 'treadmill', 'elliptical', 'stationary_bike', 'rowing_machine',
  'stair_climber', 'jump_rope', 'sled',
] as const;
export type Equipment = typeof EQUIPMENT_TYPES[number];

export const EQUIPMENT_GROUP_NAMES = [
  'barbell', 'bodyweight', 'cable', 'cardio', 'dumbbell', 'kettlebell', 'machine',
] as const;
export type EquipmentGroup = typeof EQUIPMENT_GROUP_NAMES[number];

export const EQUIPMENT_GROUP_LABELS: Record<EquipmentGroup, string> = {
  barbell: 'Barbell', bodyweight: 'Bodyweight', cable: 'Cable',
  cardio: 'Cardio', dumbbell: 'Dumbbell', kettlebell: 'Kettlebell', machine: 'Machine',
};

export const EQUIPMENT_GROUP_MEMBERS: Record<EquipmentGroup, Equipment[]> = {
  barbell: ['barbell', 'ez_bar', 'trap_bar'],
  bodyweight: ['bodyweight', 'resistance_band', 'ab_wheel', 'medicine_ball', 'battle_ropes', 'foam_roller'],
  cable: ['cable_machine'],
  cardio: ['treadmill', 'elliptical', 'stationary_bike', 'rowing_machine', 'stair_climber', 'jump_rope', 'sled'],
  dumbbell: ['dumbbell'],
  kettlebell: ['kettlebell'],
  machine: [
    'smith_machine', 'leg_press_machine', 'hack_squat_machine', 'pendulum_squat_machine',
    'belt_squat_machine', 'leg_extension_machine', 'leg_curl_machine',
    'chest_press_machine', 'shoulder_press_machine', 'lat_pulldown_machine',
    'seated_row_machine', 'pec_deck_machine', 'reverse_fly_machine',
    'pullover_machine', 'lateral_raise_machine', 'hip_adduction_machine',
    'hip_abduction_machine', 'calf_raise_machine', 'assisted_pull_up_machine',
    'ab_crunch_machine', 'hip_thrust_machine', 'flat_bench', 'adjustable_bench', 'preacher_curl_bench', 'roman_chair',
    'pull_up_bar', 'dip_station',
  ],
};

export type ExerciseTypeFilter = 'strength' | 'warmup' | 'cooldown';

export const EXERCISE_TYPE_CATEGORIES: Record<ExerciseTypeFilter, Category[]> = {
  strength: ['compound', 'isolation'],
  warmup: ['stretch_dynamic', 'mobility', 'cardio'],
  cooldown: ['stretch_static'],
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseTypeFilter, string> = {
  strength: 'Strength', warmup: 'Warm-up', cooldown: 'Cool-down',
};

export const WORKOUT_POSITIONS = ['early', 'early_mid', 'mid', 'mid_late', 'late'] as const;
export type WorkoutPosition = typeof WORKOUT_POSITIONS[number];

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const CATEGORIES = ['compound', 'isolation', 'stretch_dynamic', 'stretch_static', 'mobility', 'cardio'] as const;
export type Category = typeof CATEGORIES[number];

// ─── Units ───────────────────────────────────────────────
export const WEIGHT_UNITS = ['lb', 'kg'] as const;
export type WeightUnit = typeof WEIGHT_UNITS[number];
export const DISTANCE_UNITS = ['mi', 'km'] as const;
export type DistanceUnit = typeof DISTANCE_UNITS[number];

// ─── Load Profile ────────────────────────────────────────
export const LOAD_LEVELS = ['none', 'low', 'moderate', 'high'] as const;
export type LoadLevel = typeof LOAD_LEVELS[number];

export const LoadProfileSchema = z.object({
  spinal: z.enum(LOAD_LEVELS),
  shoulder: z.enum(LOAD_LEVELS),
  elbow: z.enum(LOAD_LEVELS),
  knee: z.enum(LOAD_LEVELS),
  grip: z.enum(LOAD_LEVELS),
  lumbar_stabilizer: z.enum(LOAD_LEVELS),
  rotator_cuff: z.enum(LOAD_LEVELS),
});

export type LoadProfile = z.infer<typeof LoadProfileSchema>;

// ─── Exercise Schema ──────────────────────────────────────
export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(CATEGORIES),
  movement_pattern: z.string(),
  force_type: z.enum(FORCE_TYPES),
  equipment: z.array(z.string()),
  primary_muscles: z.array(z.string()),
  secondary_muscles: z.array(z.string()),
  workout_position: z.enum(WORKOUT_POSITIONS),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  bilateral: z.boolean(),
  rep_range_hypertrophy: z.string(),
  rep_range_strength: z.string(),
  video_url: z.string(),
  beginner_tips: z.string(),
  substitutes: z.array(z.string()),
  complements: z.array(z.string()),
  superset_candidates: z.array(z.string()),
  notes: z.string(),
  load_profile: LoadProfileSchema.optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema> & { id: ExerciseId };

export const ExerciseFileSchema = z.object({
  file: z.string(),
  description: z.string(),
  exercise_count: z.number(),
  exercises: z.array(ExerciseSchema),
});

export type ExerciseFile = z.infer<typeof ExerciseFileSchema>;

// ─── Exercise Graph ───────────────────────────────────────
export interface ExerciseGraph {
  exercises: Map<ExerciseId, Exercise>;
  substitutes: Map<ExerciseId, Set<ExerciseId>>;
  complements: Map<ExerciseId, Set<ExerciseId>>;
  supersets: Map<ExerciseId, Set<ExerciseId>>;
  byMuscle: Map<string, Set<ExerciseId>>;
  byEquipment: Map<string, Set<ExerciseId>>;
  byPattern: Map<string, Set<ExerciseId>>;
  byForceType: Map<ForceType, Set<ExerciseId>>;
}

// ─── Tracking Flags ──────────────────────────────────────
export interface TrackingFlags {
  trackWeight: boolean;
  trackReps: boolean;
  trackDuration: boolean;
  trackDistance: boolean;
}

// ─── Workout Draft ────────────────────────────────────────
export interface WorkoutExercise {
  exerciseId: ExerciseId;
  instanceId?: string;
  sets: number;
  reps: number;
  weight: number | null;
  restSeconds: number;
  notes: string;
  supersetGroupId?: string;
  trackWeight: boolean;
  trackReps: boolean;
  trackDuration: boolean;
  trackDistance: boolean;
  durationSeconds?: number;
}

export interface WorkoutDraft {
  id: WorkoutId;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export const WorkoutExerciseSchema = z.object({
  exerciseId: z.string(),
  instanceId: z.string().optional(),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  weight: z.number().nullable(),
  restSeconds: z.number().int().min(0),
  notes: z.string(),
  supersetGroupId: z.string().optional(),
  trackWeight: z.boolean().default(true),
  trackReps: z.boolean().default(true),
  trackDuration: z.boolean().default(false),
  trackDistance: z.boolean().default(false),
  durationSeconds: z.number().optional(),
});

export const SavedWorkoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  exercises: z.array(WorkoutExerciseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedWorkout = z.infer<typeof SavedWorkoutSchema> & {
  id: WorkoutId;
  exercises: WorkoutExercise[];
};

// ─── Suggestion Groups ───────────────────────────────────
export interface SuggestionGroups {
  pairsWellWith: ExerciseId[];
  stillNeedToHit: ExerciseId[];
}

// ─── Workout Validation ──────────────────────────────────
export interface WorkoutValidation {
  pushCount: number;
  pullCount: number;
  isometricCount: number;
  isBalanced: boolean;
  coveredMuscles: MuscleGroup[];
  missingMuscles: MuscleGroup[];
}

// ─── Active Session ──────────────────────────────────────
export interface SetLog {
  weight: number | null;
  reps: number | null;
  completed: boolean;
  durationSeconds: number | null;
  distanceMeters: number | null;
}

export interface ExerciseLog {
  exerciseId: ExerciseId;
  sets: SetLog[];
  supersetGroupId?: string;
  planNotes?: string;
  trackWeight: boolean;
  trackReps: boolean;
  trackDuration: boolean;
  trackDistance: boolean;
  durationSeconds?: number;
}

export interface ActiveSession {
  workoutId: WorkoutId;
  workoutName: string;
  exercises: ExerciseLog[];
  currentGroupIndex: number;
  startedAt: string | null;
  completedAt: string | null;
  notes: string;
}

export interface TimerState {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  restSeconds: number;
  timerStartedAt: string | null;
}

// ─── Workout Log ─────────────────────────────────────────
export interface WorkoutLog {
  id: LogId;
  workoutId: WorkoutId;
  workoutName: string;
  exercises: ExerciseLog[];
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  notes: string;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

export const WorkoutLogSchema = z.object({
  id: z.string(),
  workoutId: z.string(),
  workoutName: z.string(),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    sets: z.array(z.object({
      weight: z.number().nullable(),
      reps: z.number().nullable(),
      completed: z.boolean(),
      durationSeconds: z.number().nullable().default(null),
      distanceMeters: z.number().nullable().default(null),
    })),
    supersetGroupId: z.string().optional(),
    planNotes: z.string().default(''),
    trackWeight: z.boolean().default(true),
    trackReps: z.boolean().default(true),
    trackDuration: z.boolean().default(false),
    trackDistance: z.boolean().default(false),
    durationSeconds: z.number().optional(),
  })),
  startedAt: z.string(),
  completedAt: z.string(),
  durationMinutes: z.number(),
  notes: z.string().default(''),
  weightUnit: z.enum(WEIGHT_UNITS).default('lb'),
  distanceUnit: z.enum(DISTANCE_UNITS).default('mi'),
});

// ─── Session Validation Schemas ──────────────────────────
export const SetLogSchema = z.object({
  weight: z.number().nullable(),
  reps: z.number().nullable(),
  completed: z.boolean(),
  durationSeconds: z.number().nullable().default(null),
  distanceMeters: z.number().nullable().default(null),
});

export const ExerciseLogSchema = z.object({
  exerciseId: z.string(),
  sets: z.array(SetLogSchema),
  supersetGroupId: z.string().optional(),
  planNotes: z.string().default(''),
  trackWeight: z.boolean().default(true),
  trackReps: z.boolean().default(true),
  trackDuration: z.boolean().default(false),
  trackDistance: z.boolean().default(false),
  durationSeconds: z.number().optional(),
});

export const ActiveSessionSchema = z.object({
  workoutId: z.string(),
  workoutName: z.string(),
  exercises: z.array(ExerciseLogSchema),
  currentGroupIndex: z.number(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  notes: z.string().default(''),
});

export const TimerStateSchema = z.object({
  isRunning: z.boolean(),
  remainingSeconds: z.number(),
  totalSeconds: z.number(),
  restSeconds: z.number(),
  timerStartedAt: z.string().nullable(),
});

// ─── Settings ────────────────────────────────────────────
export interface AppSettings {
  restTimerCompoundSeconds: number;
  restTimerIsolationSeconds: number;
  defaultSetsCompound: number;
  defaultSetsIsolation: number;
  defaultRepsCompound: number;
  defaultRepsIsolation: number;
  exportIncludeTips: boolean;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

export const AppSettingsSchema = z.object({
  restTimerCompoundSeconds: z.number().int().min(0).default(120),
  restTimerIsolationSeconds: z.number().int().min(0).default(60),
  defaultSetsCompound: z.number().int().min(1).default(4),
  defaultSetsIsolation: z.number().int().min(1).default(3),
  defaultRepsCompound: z.number().int().min(1).default(8),
  defaultRepsIsolation: z.number().int().min(1).default(12),
  exportIncludeTips: z.boolean().default(false),
  weightUnit: z.enum(WEIGHT_UNITS).default('lb'),
  distanceUnit: z.enum(DISTANCE_UNITS).default('mi'),
});

export const DEFAULT_SETTINGS: AppSettings = {
  restTimerCompoundSeconds: 120,
  restTimerIsolationSeconds: 60,
  defaultSetsCompound: 4,
  defaultSetsIsolation: 3,
  defaultRepsCompound: 8,
  defaultRepsIsolation: 12,
  exportIncludeTips: false,
  weightUnit: 'lb',
  distanceUnit: 'mi',
};

// ─── Navigation ──────────────────────────────────────────
export type TabId = 'build' | 'library' | 'active' | 'log' | 'settings';

// ─── Display Labels ─────────────────────────────────────
export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  upper_back: 'Back',
  shoulders: 'Shoulders',
  traps: 'Traps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quadriceps: 'Quads',
  hamstrings: 'Hams',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  adductors: 'Adductors',
  abductors: 'Abductors',
};

// ─── Workout Split Muscle Groups ─────────────────────────
// Evidence base: Schoenfeld (2010, 2017 meta-analyses), NSCA Essentials of
// Strength Training (4th ed.), Renaissance Periodization RP Hypertrophy,
// Jeff Nippard PPL programming.
//
// Split semantics:
//   push    = all horizontal + vertical pressing work (chest/shoulder/tricep day)
//   pull    = all vertical + horizontal pulling work (back/bicep day)
//   legs    = all lower body work (quad/hamstring/glute/calf day)
//   upper   = push + pull combined into one session (antagonist-pair day)
//   lower   = same as legs but explicitly paired with an upper day
//   full_body = every major muscle group trained each session
//
// Classification logic:
//   primary   = the split day is explicitly designed to develop this muscle;
//               the session is INCOMPLETE without hitting it
//   secondary = the muscle is meaningfully stressed as a synergist/stabilizer
//               but is not the primary target of the split designation

export const WORKOUT_SPLITS = [
  'push', 'pull', 'legs', 'upper', 'lower', 'full_body',
] as const;
export type WorkoutSplit = typeof WORKOUT_SPLITS[number];

export const SPLIT_LABELS: Record<WorkoutSplit, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower',
  full_body: 'Full Body',
};

export const WORKOUT_SPLIT_MUSCLES: Record<WorkoutSplit, {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
}> = {
  // ── Push Day ────────────────────────────────────────────
  // Bench press, OHP, dips, flyes, tricep isolations.
  // Chest = primary; shoulders = primary (OHP is a push day staple);
  // triceps = primary (close-grip pressing + isolations).
  // Traps assist OHP lockout; core braces all pressing; front delts
  // are part of "shoulders" so not listed separately.
  push: {
    primary: ['chest', 'shoulders', 'triceps'],
    secondary: ['traps', 'core'],
  },

  // ── Pull Day ────────────────────────────────────────────
  // Rows, pull-ups/pulldowns, face pulls, curls, shrugs.
  // Upper back = primary (lats, rhomboids, mid-traps via rows/pulldowns);
  // biceps = primary (curls are a pull-day staple);
  // traps = primary (shrugs, rack pulls, heavy rows work all trap fibers);
  // rear delts = part of "shoulders" secondary;
  // forearms = secondary (grip demands from all pulling);
  // core = secondary (anti-flexion bracing during bent-over rows).
  pull: {
    primary: ['upper_back', 'biceps', 'traps'],
    secondary: ['shoulders', 'forearms', 'core'],
  },

  // ── Legs Day ────────────────────────────────────────────
  // Squats, deadlift variations, leg press, lunges, leg curls, calf raises,
  // hip thrusts, hip adduction/abduction.
  // Quads/hamstrings/glutes = primary;
  // calves = secondary (heavy loaded carries and squat variants);
  // adductors/abductors = secondary (wide-stance squats, isolation machines);
  // core = secondary (bracing throughout all compound leg work).
  legs: {
    primary: ['quadriceps', 'hamstrings', 'glutes'],
    secondary: ['calves', 'adductors', 'abductors', 'core'],
  },

  // ── Upper Body Day ──────────────────────────────────────
  // Combines push + pull into antagonist supersets (bench ↔ row, OHP ↔ pulldown).
  // All pressing and pulling muscles become primary; arms = secondary
  // since bilateral upper sessions typically include compound pressing/pulling
  // but may not include isolation arm work.
  upper: {
    primary: ['chest', 'upper_back', 'shoulders', 'traps'],
    secondary: ['biceps', 'triceps', 'forearms', 'core'],
  },

  // ── Lower Body Day ──────────────────────────────────────
  // Identical target muscles to legs day in a PPL/UL context.
  // Separating it from "legs" lets the UI distinguish PPL vs. Upper/Lower split
  // while the muscle coverage remains the same.
  lower: {
    primary: ['quadriceps', 'hamstrings', 'glutes'],
    secondary: ['calves', 'adductors', 'abductors', 'core'],
  },

  // ── Full Body ───────────────────────────────────────────
  // Every major muscle group is trained in a single session.
  // All 14 muscle groups are at least secondary; the "primary" list covers
  // the six major muscle groups that Schoenfeld identifies as requiring
  // direct training stimulus for complete development (2x/week minimum).
  full_body: {
    primary: ['chest', 'upper_back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes'],
    secondary: ['biceps', 'triceps', 'traps', 'forearms', 'calves', 'core', 'adductors', 'abductors'],
  },
};

// ─── Activity & Body State ──────────────────────────────
export const ACTIVITY_TYPES = ['run', 'bike', 'swim', 'hike', 'sport', 'yoga', 'general', 'rest_day'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  bike: 'Bike',
  swim: 'Swim',
  hike: 'Hike',
  sport: 'Sport',
  yoga: 'Yoga',
  general: 'General',
  rest_day: 'Rest Day',
};

export const ACTIVITY_MUSCLE_IMPACT: Record<ActivityType, MuscleGroup[]> = {
  run: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  bike: ['quadriceps', 'glutes', 'calves'],
  swim: ['upper_back', 'shoulders', 'core'],
  hike: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  sport: ['quadriceps', 'hamstrings', 'glutes', 'core'],
  yoga: [],
  general: [],
  rest_day: [],
};

export const SORENESS_LEVELS = ['none', 'mild', 'moderate', 'severe'] as const;
export type SorenessLevel = typeof SORENESS_LEVELS[number];

export interface SorenessEntry {
  muscle: MuscleGroup;
  level: SorenessLevel;
}

export const TIMING_OPTIONS = ['yesterday', 'today', 'tomorrow'] as const;
export type ActivityTiming = typeof TIMING_OPTIONS[number];

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timing: ActivityTiming;
  date: string;
}

// ─── Category Labels ────────────────────────────────────
export const CATEGORY_LABELS: Record<Category, string> = {
  compound: 'Compound',
  isolation: 'Isolation',
  stretch_dynamic: 'Dynamic Stretch',
  stretch_static: 'Static Stretch',
  mobility: 'Mobility',
  cardio: 'Cardio',
};

// ─── Body State Schemas (must be after constants) ────────
export const SorenessEntrySchema = z.object({
  muscle: z.string(),
  level: z.enum(SORENESS_LEVELS),
});

export const ActivityEntrySchema = z.object({
  id: z.string(),
  type: z.enum(ACTIVITY_TYPES),
  timing: z.enum(TIMING_OPTIONS),
  date: z.string(),
});
