import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  ExerciseGraph,
  ExerciseId,
  WorkoutDraft,
  WorkoutExercise,
  WorkoutId,
  SavedWorkout,
  WorkoutLog,
  ActiveSession,
  TimerState,
  AppSettings,
  SuggestionGroups,
  WorkoutValidation,
  TabId,
  SetLog,
  ExerciseLog,
  LogId,
  WorkoutSplit,
} from '@/types';
import {
  DEFAULT_SETTINGS,
  SavedWorkoutSchema,
  WorkoutLogSchema,
  AppSettingsSchema,
} from '@/types';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { getAllExercises } from '@/data/exercises';

// ─── State Shape ─────────────────────────────────────────
interface AppState {
  // Graph (read-only after init)
  graph: ExerciseGraph;
  graphReady: boolean;
  initGraph: () => void;

  // Builder
  builder: {
    workout: WorkoutDraft;
    workoutSplit: WorkoutSplit | null;
    suggestions: SuggestionGroups;
    validation: WorkoutValidation;
  };
  builderActions: {
    setWorkoutName: (name: string) => void;
    setWorkoutSplit: (split: WorkoutSplit | null) => void;
    addExercise: (exerciseId: ExerciseId) => void;
    removeExercise: (index: number) => void;
    reorderExercises: (from: number, to: number) => void;
    updateExercise: (index: number, updates: Partial<WorkoutExercise>) => void;
    swapExercise: (index: number, newExerciseId: ExerciseId) => void;
    resetWorkout: () => void;
    loadWorkout: (workout: SavedWorkout) => void;
  };

  // Library (persisted)
  library: {
    workouts: SavedWorkout[];
    logs: WorkoutLog[];
  };
  libraryActions: {
    saveWorkout: (workout: WorkoutDraft) => void;
    deleteWorkout: (id: WorkoutId) => void;
    addLog: (log: WorkoutLog) => void;
    clearAll: () => void;
  };

  // Session
  session: {
    active: ActiveSession | null;
    timer: TimerState;
  };
  sessionActions: {
    startSession: (workout: SavedWorkout) => void;
    endSession: () => WorkoutLog | null;
    completeSet: (exerciseIndex: number, setIndex: number, data: SetLog) => void;
    addSet: (exerciseIndex: number) => void;
    goToExercise: (index: number) => void;
    swapExercise: (exerciseIndex: number, newExerciseId: ExerciseId) => void;
    startTimer: (seconds: number) => void;
    stopTimer: () => void;
    tickTimer: () => void;
    adjustTimer: (delta: number) => void;
  };

  // Settings (persisted)
  settings: AppSettings;
  settingsActions: {
    updateSettings: (updates: Partial<AppSettings>) => void;
    resetSettings: () => void;
  };

  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

function createEmptyDraft(): WorkoutDraft {
  return {
    id: uuidv4() as WorkoutId,
    name: '',
    exercises: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createEmptyGraph(): ExerciseGraph {
  return {
    exercises: new Map(),
    substitutes: new Map(),
    complements: new Map(),
    supersets: new Map(),
    byMuscle: new Map(),
    byEquipment: new Map(),
    byPattern: new Map(),
    byForceType: new Map(),
  };
}

const emptySuggestions: SuggestionGroups = {
  pairsWellWith: [],
  stillNeedToHit: [],
  supersetWith: [],
};

const emptyValidation: WorkoutValidation = {
  pushCount: 0,
  pullCount: 0,
  isometricCount: 0,
  isBalanced: true,
  coveredMuscles: [],
  missingMuscles: [],
};

const emptyTimer: TimerState = {
  isRunning: false,
  remainingSeconds: 0,
  totalSeconds: 0,
};

// ─── Store ───────────────────────────────────────────────
export const useStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // Graph
      graph: createEmptyGraph(),
      graphReady: false,
      initGraph: () => {
        const rawExercises = getAllExercises();
        const graph = buildExerciseGraph(rawExercises);
        set((state) => {
          state.graph = graph as ExerciseGraph;
          state.graphReady = true;
        });
      },

      // Builder
      builder: {
        workout: createEmptyDraft(),
        workoutSplit: null,
        suggestions: emptySuggestions,
        validation: emptyValidation,
      },
      builderActions: {
        setWorkoutSplit: (split: WorkoutSplit | null) => {
          set((state) => {
            state.builder.workoutSplit = split;
          });
        },
        setWorkoutName: (name: string) => {
          set((state) => {
            state.builder.workout.name = name;
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        addExercise: (exerciseId: ExerciseId) => {
          const graph = get().graph;
          const exercise = graph.exercises.get(exerciseId);
          if (!exercise) return;

          const settings = get().settings;
          const restSeconds = exercise.category === 'compound'
            ? settings.restTimerCompoundSeconds
            : settings.restTimerIsolationSeconds;

          set((state) => {
            state.builder.workout.exercises.push({
              exerciseId,
              sets: exercise.category === 'compound' ? 4 : 3,
              reps: parseInt(exercise.rep_range_hypertrophy.split('-')[0]) || 8,
              weight: null,
              restSeconds,
              notes: '',
            });
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        removeExercise: (index: number) => {
          set((state) => {
            state.builder.workout.exercises.splice(index, 1);
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        reorderExercises: (from: number, to: number) => {
          set((state) => {
            const exercises = state.builder.workout.exercises;
            const [moved] = exercises.splice(from, 1);
            exercises.splice(to, 0, moved);
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        updateExercise: (index: number, updates: Partial<WorkoutExercise>) => {
          set((state) => {
            const ex = state.builder.workout.exercises[index];
            if (ex) {
              Object.assign(ex, updates);
              state.builder.workout.updatedAt = new Date().toISOString();
            }
          });
        },
        swapExercise: (index: number, newExerciseId: ExerciseId) => {
          set((state) => {
            const ex = state.builder.workout.exercises[index];
            if (ex) {
              ex.exerciseId = newExerciseId;
              state.builder.workout.updatedAt = new Date().toISOString();
            }
          });
        },
        resetWorkout: () => {
          set((state) => {
            state.builder.workout = createEmptyDraft();
            state.builder.workoutSplit = null;
            state.builder.suggestions = emptySuggestions;
            state.builder.validation = emptyValidation;
          });
        },
        loadWorkout: (workout: SavedWorkout) => {
          set((state) => {
            state.builder.workout = {
              ...workout,
              updatedAt: new Date().toISOString(),
            };
          });
        },
      },

      // Library
      library: {
        workouts: [],
        logs: [],
      },
      libraryActions: {
        saveWorkout: (workout: WorkoutDraft) => {
          set((state) => {
            const saved: SavedWorkout = {
              ...workout,
              updatedAt: new Date().toISOString(),
            };
            const existingIndex = state.library.workouts.findIndex(
              (w) => w.id === workout.id
            );
            if (existingIndex >= 0) {
              state.library.workouts[existingIndex] = saved;
            } else {
              state.library.workouts.push(saved);
            }
          });
        },
        deleteWorkout: (id: WorkoutId) => {
          set((state) => {
            state.library.workouts = state.library.workouts.filter(
              (w) => w.id !== id
            );
          });
        },
        addLog: (log: WorkoutLog) => {
          set((state) => {
            state.library.logs.push(log);
          });
        },
        clearAll: () => {
          set((state) => {
            state.library.workouts = [];
            state.library.logs = [];
          });
        },
      },

      // Session
      session: {
        active: null,
        timer: emptyTimer,
      },
      sessionActions: {
        startSession: (workout: SavedWorkout) => {
          set((state) => {
            state.session.active = {
              workoutId: workout.id,
              workoutName: workout.name,
              exercises: workout.exercises.map((ex): ExerciseLog => ({
                exerciseId: ex.exerciseId as ExerciseId,
                sets: Array.from({ length: ex.sets }, (): SetLog => ({
                  weight: ex.weight,
                  reps: null,
                  completed: false,
                })),
              })),
              currentExerciseIndex: 0,
              startedAt: new Date().toISOString(),
            };
            state.session.timer = emptyTimer;
            state.activeTab = 'active';
          });
        },
        endSession: () => {
          const session = get().session.active;
          if (!session) return null;

          const startedAt = new Date(session.startedAt);
          const completedAt = new Date();
          const durationMinutes = Math.round(
            (completedAt.getTime() - startedAt.getTime()) / 60000
          );

          const log: WorkoutLog = {
            id: uuidv4() as LogId,
            workoutId: session.workoutId,
            workoutName: session.workoutName,
            exercises: session.exercises,
            startedAt: session.startedAt,
            completedAt: completedAt.toISOString(),
            durationMinutes,
          };

          set((state) => {
            state.session.active = null;
            state.session.timer = emptyTimer;
            state.library.logs.push(log);
          });

          return log;
        },
        completeSet: (exerciseIndex: number, setIndex: number, data: SetLog) => {
          set((state) => {
            const exercise = state.session.active?.exercises[exerciseIndex];
            if (exercise?.sets[setIndex]) {
              exercise.sets[setIndex] = data;
            }
          });
        },
        addSet: (exerciseIndex: number) => {
          set((state) => {
            const exercise = state.session.active?.exercises[exerciseIndex];
            if (exercise) {
              exercise.sets.push({ weight: null, reps: null, completed: false });
            }
          });
        },
        goToExercise: (index: number) => {
          set((state) => {
            if (state.session.active) {
              state.session.active.currentExerciseIndex = index;
            }
          });
        },
        swapExercise: (exerciseIndex: number, newExerciseId: ExerciseId) => {
          set((state) => {
            const exercise = state.session.active?.exercises[exerciseIndex];
            if (exercise) {
              exercise.exerciseId = newExerciseId;
            }
          });
        },
        startTimer: (seconds: number) => {
          set((state) => {
            state.session.timer = {
              isRunning: true,
              remainingSeconds: seconds,
              totalSeconds: seconds,
            };
          });
        },
        stopTimer: () => {
          set((state) => {
            state.session.timer = emptyTimer;
          });
        },
        tickTimer: () => {
          set((state) => {
            if (state.session.timer.isRunning && state.session.timer.remainingSeconds > 0) {
              state.session.timer.remainingSeconds -= 1;
            }
            if (state.session.timer.remainingSeconds <= 0) {
              state.session.timer.isRunning = false;
            }
          });
        },
        adjustTimer: (delta: number) => {
          set((state) => {
            const newTime = Math.max(0, state.session.timer.remainingSeconds + delta);
            state.session.timer.remainingSeconds = newTime;
            state.session.timer.totalSeconds = Math.max(
              state.session.timer.totalSeconds,
              newTime
            );
          });
        },
      },

      // Settings
      settings: DEFAULT_SETTINGS,
      settingsActions: {
        updateSettings: (updates: Partial<AppSettings>) => {
          set((state) => {
            Object.assign(state.settings, updates);
          });
        },
        resetSettings: () => {
          set((state) => {
            state.settings = DEFAULT_SETTINGS;
          });
        },
      },

      // Navigation
      activeTab: 'build' as TabId,
      setActiveTab: (tab: TabId) => {
        set((state) => {
          state.activeTab = tab;
        });
      },
    })),
    {
      name: 'curlbro-storage',
      partialize: (state) => ({
        library: state.library,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Validate persisted data with Zod
        try {
          const workouts = state.library.workouts.map((w) => {
            const parsed = SavedWorkoutSchema.safeParse(w);
            return parsed.success ? w : null;
          }).filter(Boolean) as SavedWorkout[];

          const logs = state.library.logs.map((l) => {
            const parsed = WorkoutLogSchema.safeParse(l);
            return parsed.success ? l : null;
          }).filter(Boolean) as WorkoutLog[];

          const settingsParsed = AppSettingsSchema.safeParse(state.settings);
          const settings = settingsParsed.success ? state.settings : DEFAULT_SETTINGS;

          state.library.workouts = workouts;
          state.library.logs = logs;
          state.settings = settings;
        } catch {
          state.library = { workouts: [], logs: [] };
          state.settings = DEFAULT_SETTINGS;
        }
      },
    }
  )
);
