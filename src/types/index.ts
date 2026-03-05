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
  'pull_up_bar', 'dip_station', 'flat_bench', 'adjustable_bench',
  'preacher_curl_bench', 'roman_chair', 'ab_wheel', 'kettlebell',
  'resistance_band', 'trap_bar', 'medicine_ball', 'battle_ropes', 'bodyweight',
] as const;
export type Equipment = typeof EQUIPMENT_TYPES[number];

export const WORKOUT_POSITIONS = ['early', 'early_mid', 'mid', 'mid_late', 'late'] as const;
export type WorkoutPosition = typeof WORKOUT_POSITIONS[number];

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const CATEGORIES = ['compound', 'isolation'] as const;
export type Category = typeof CATEGORIES[number];

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

// ─── Workout Draft ────────────────────────────────────────
export interface WorkoutExercise {
  exerciseId: ExerciseId;
  sets: number;
  reps: number;
  weight: number | null;
  restSeconds: number;
  notes: string;
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
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  weight: z.number().nullable(),
  restSeconds: z.number().int().min(0),
  notes: z.string(),
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
  supersetWith: ExerciseId[];
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
}

export interface ExerciseLog {
  exerciseId: ExerciseId;
  sets: SetLog[];
}

export interface ActiveSession {
  workoutId: WorkoutId;
  workoutName: string;
  exercises: ExerciseLog[];
  currentExerciseIndex: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface TimerState {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
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
    })),
  })),
  startedAt: z.string(),
  completedAt: z.string(),
  durationMinutes: z.number(),
});

// ─── Training Goals ──────────────────────────────────────
export const TRAINING_GOALS = ['strength', 'hypertrophy', 'endurance'] as const;
export type TrainingGoal = typeof TRAINING_GOALS[number];

export const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  endurance: 'Endurance',
};

// ─── Settings ────────────────────────────────────────────
export interface AppSettings {
  restTimerCompoundSeconds: number;
  restTimerIsolationSeconds: number;
  trainingGoal: TrainingGoal;
  defaultSetsCompound: number;
  defaultSetsIsolation: number;
  exportIncludeTips: boolean;
}

export const AppSettingsSchema = z.object({
  restTimerCompoundSeconds: z.number().int().min(0).default(120),
  restTimerIsolationSeconds: z.number().int().min(0).default(60),
  trainingGoal: z.enum(TRAINING_GOALS).default('hypertrophy'),
  defaultSetsCompound: z.number().int().min(1).default(4),
  defaultSetsIsolation: z.number().int().min(1).default(3),
  exportIncludeTips: z.boolean().default(true),
});

export const DEFAULT_SETTINGS: AppSettings = {
  restTimerCompoundSeconds: 120,
  restTimerIsolationSeconds: 60,
  trainingGoal: 'hypertrophy',
  defaultSetsCompound: 4,
  defaultSetsIsolation: 3,
  exportIncludeTips: true,
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
