import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  Exercise,
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
  TrainingGoal,
  SuggestionGroups,
  WorkoutValidation,
  TabId,
  SetLog,
  ExerciseLog,
  LogId,
  WorkoutSplit,
  SorenessEntry,
  ActivityEntry,
} from '@/types';
import {
  DEFAULT_SETTINGS,
  SavedWorkoutSchema,
  WorkoutLogSchema,
  AppSettingsSchema,
  SorenessEntrySchema,
  ActivityEntrySchema,
} from '@/types';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { getAllExercises } from '@/data/exercises';
import { deriveGroups } from '@/utils/groupUtils';

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
    addExerciseToGroup: (exerciseId: ExerciseId, targetIndex: number) => void;
    ungroupExercise: (index: number) => void;
    removeExercise: (index: number) => void;
    reorderExercises: (from: number, to: number) => void;
    updateExercise: (index: number, updates: Partial<WorkoutExercise>) => void;
    swapExercise: (index: number, newExerciseId: ExerciseId) => void;
    resetWorkout: () => void;
    loadWorkout: (workout: SavedWorkout) => void;
    loadTemplate: (name: string, split: WorkoutSplit | null, exercises: { exerciseId: ExerciseId; sets: number; reps: number; restSeconds: number }[]) => void;
  };

  // Library (persisted)
  library: {
    workouts: SavedWorkout[];
    logs: WorkoutLog[];
    activities: ActivityEntry[];
    soreness: SorenessEntry[];
  };
  libraryActions: {
    saveWorkout: (workout: WorkoutDraft) => void;
    deleteWorkout: (id: WorkoutId) => void;
    addLog: (log: WorkoutLog) => void;
    deleteLog: (id: LogId) => void;
    addActivity: (entry: ActivityEntry) => void;
    removeActivity: (id: string) => void;
    setSoreness: (entries: SorenessEntry[]) => void;
    clearSoreness: () => void;
    clearAll: () => void;
  };

  // Session
  session: {
    active: ActiveSession | null;
    timer: TimerState;
  };
  sessionActions: {
    startSession: (workout: SavedWorkout) => void;
    beginSession: () => void;
    endSession: () => void;
    saveSession: () => WorkoutLog | null;
    addExerciseToSession: (exerciseId: ExerciseId) => void;
    completeSet: (exerciseIndex: number, setIndex: number, data: SetLog) => void;
    addSet: (exerciseIndex: number) => void;
    removeSet: (exerciseIndex: number, setIndex: number) => void;
    goToGroup: (index: number) => void;
    swapExercise: (exerciseIndex: number, newExerciseId: ExerciseId) => void;
    startTimer: (seconds: number) => void;
    stopTimer: () => void;
    pauseTimer: () => void;
    tickTimer: () => void;
    adjustTimer: (delta: number) => void;
    adjustRestDuration: (delta: number) => void;
    setRestDuration: (seconds: number) => void;
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
  restSeconds: 90,
};

/** Pick the default rep count for an exercise based on training goal */
export function getDefaultReps(exercise: Exercise, goal: TrainingGoal): number {
  const fallback = 8;
  if (goal === 'strength') {
    return parseInt(exercise.rep_range_strength.split('-')[0]) || fallback;
  }
  if (goal === 'endurance') {
    const parts = exercise.rep_range_hypertrophy.split('-');
    return parseInt(parts[parts.length - 1]) || fallback;
  }
  // hypertrophy (default)
  return parseInt(exercise.rep_range_hypertrophy.split('-')[0]) || fallback;
}

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

          const sets = exercise.category === 'compound'
            ? settings.defaultSetsCompound
            : settings.defaultSetsIsolation;
          const reps = getDefaultReps(exercise, settings.trainingGoal);

          set((state) => {
            state.builder.workout.exercises.push({
              exerciseId,
              sets,
              reps,
              weight: null,
              restSeconds,
              notes: '',
            });
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        addExerciseToGroup: (exerciseId: ExerciseId, targetIndex: number) => {
          const graph = get().graph;
          const exercise = graph.exercises.get(exerciseId);
          if (!exercise) return;

          const settings = get().settings;
          const restSeconds = exercise.category === 'compound'
            ? settings.restTimerCompoundSeconds
            : settings.restTimerIsolationSeconds;
          const sets = exercise.category === 'compound'
            ? settings.defaultSetsCompound
            : settings.defaultSetsIsolation;
          const reps = getDefaultReps(exercise, settings.trainingGoal);

          set((state) => {
            const exercises = state.builder.workout.exercises;
            const target = exercises[targetIndex];
            if (!target) return;

            // Assign group ID if target doesn't have one
            if (!target.supersetGroupId) {
              target.supersetGroupId = crypto.randomUUID();
            }
            const groupId = target.supersetGroupId;

            // Find the last member of this group to insert after
            let lastGroupIndex = targetIndex;
            for (let i = targetIndex + 1; i < exercises.length; i++) {
              if (exercises[i].supersetGroupId === groupId) {
                lastGroupIndex = i;
              } else {
                break;
              }
            }

            exercises.splice(lastGroupIndex + 1, 0, {
              exerciseId,
              sets,
              reps,
              weight: null,
              restSeconds,
              notes: '',
              supersetGroupId: groupId,
            });
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        ungroupExercise: (index: number) => {
          set((state) => {
            const exercises = state.builder.workout.exercises;
            const ex = exercises[index];
            if (!ex?.supersetGroupId) return;

            const groupId = ex.supersetGroupId;
            ex.supersetGroupId = undefined;

            // If only 1 member remains in the group, clear its ID too
            const remaining = exercises.filter((e) => e.supersetGroupId === groupId);
            if (remaining.length === 1) {
              remaining[0].supersetGroupId = undefined;
            }
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        removeExercise: (index: number) => {
          set((state) => {
            const exercises = state.builder.workout.exercises;
            const removed = exercises[index];
            const groupId = removed?.supersetGroupId;
            exercises.splice(index, 1);
            // If the removed exercise was in a group, check if only 1 member remains
            if (groupId) {
              const remaining = exercises.filter((e) => e.supersetGroupId === groupId);
              if (remaining.length === 1) {
                remaining[0].supersetGroupId = undefined;
              }
            }
            state.builder.workout.updatedAt = new Date().toISOString();
          });
        },
        reorderExercises: (from: number, to: number) => {
          set((state) => {
            const exercises = state.builder.workout.exercises;
            const fromEx = exercises[from];
            const groupId = fromEx?.supersetGroupId;

            if (groupId) {
              // Move the entire group as a unit
              const groupIndices: number[] = [];
              for (let i = 0; i < exercises.length; i++) {
                if (exercises[i].supersetGroupId === groupId) {
                  groupIndices.push(i);
                }
              }
              // Only move as group if indices are consecutive
              const isConsecutive = groupIndices.every(
                (idx, i) => i === 0 || idx === groupIndices[i - 1] + 1,
              );
              if (isConsecutive && groupIndices.length > 1) {
                const groupStart = groupIndices[0];
                const groupItems = exercises.splice(groupStart, groupIndices.length);
                const adjustedTo = to > groupStart ? to - groupIndices.length : to;
                const insertAt = Math.max(0, Math.min(adjustedTo, exercises.length));
                exercises.splice(insertAt, 0, ...groupItems);
              } else {
                // Non-consecutive or solo — move single item
                const [moved] = exercises.splice(from, 1);
                exercises.splice(to, 0, moved);
              }
            } else {
              const [moved] = exercises.splice(from, 1);
              exercises.splice(to, 0, moved);
            }
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
        loadTemplate: (name, split, exercises) => {
          const graph = get().graph;
          const now = new Date().toISOString();
          set((state) => {
            state.builder.workout = {
              id: uuidv4() as WorkoutId,
              name,
              exercises: exercises
                .filter((e) => graph.exercises.has(e.exerciseId))
                .map((e) => ({
                  exerciseId: e.exerciseId,
                  sets: e.sets,
                  reps: e.reps,
                  weight: null,
                  restSeconds: e.restSeconds,
                  notes: '',
                })),
              createdAt: now,
              updatedAt: now,
            };
            state.builder.workoutSplit = split;
          });
        },
      },

      // Library
      library: {
        workouts: [],
        logs: [],
        activities: [],
        soreness: [],
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
        deleteLog: (id: LogId) => {
          set((state) => {
            state.library.logs = state.library.logs.filter((l) => l.id !== id);
          });
        },
        addActivity: (entry: ActivityEntry) => {
          set((state) => {
            state.library.activities.push(entry);
          });
        },
        removeActivity: (id: string) => {
          set((state) => {
            state.library.activities = state.library.activities.filter((a) => a.id !== id);
          });
        },
        setSoreness: (entries: SorenessEntry[]) => {
          set((state) => {
            state.library.soreness = entries;
          });
        },
        clearSoreness: () => {
          set((state) => {
            state.library.soreness = [];
          });
        },
        clearAll: () => {
          set((state) => {
            state.library.workouts = [];
            state.library.logs = [];
            state.library.activities = [];
            state.library.soreness = [];
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
                ...(ex.supersetGroupId ? { supersetGroupId: ex.supersetGroupId } : {}),
              })),
              currentGroupIndex: 0,
              startedAt: null,
              completedAt: null,
            };
            state.session.timer = emptyTimer;
            state.activeTab = 'active';
          });
        },
        beginSession: () => {
          set((state) => {
            if (state.session.active && !state.session.active.startedAt) {
              state.session.active.startedAt = new Date().toISOString();
            }
          });
        },
        endSession: () => {
          set((state) => {
            if (state.session.active?.startedAt) {
              state.session.active.completedAt = new Date().toISOString();
            }
            state.session.timer = emptyTimer;
          });
        },
        saveSession: () => {
          const session = get().session.active;
          if (!session?.startedAt || !session?.completedAt) return null;

          // Prevent duplicate saves
          const existingLogs = get().library.logs;
          if (existingLogs.some((l) => l.workoutId === session.workoutId && l.startedAt === session.startedAt)) {
            return null;
          }

          const durationMinutes = Math.round(
            (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
          );

          // Filter out exercises where no sets were completed
          const completedExercises = session.exercises.filter(
            (ex) => ex.sets.some((s) => s.completed),
          );

          const log: WorkoutLog = {
            id: uuidv4() as LogId,
            workoutId: session.workoutId,
            workoutName: session.workoutName,
            exercises: completedExercises,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            durationMinutes,
          };

          set((state) => {
            state.library.logs.push(log);
          });

          return log;
        },
        addExerciseToSession: (exerciseId: ExerciseId) => {
          set((state) => {
            const session = state.session.active;
            if (!session || session.completedAt) return;
            session.exercises.push({
              exerciseId,
              sets: [{ weight: null, reps: null, completed: false }],
            });
            // New exercise is a solo group at the end
            const groups = deriveGroups(session.exercises);
            session.currentGroupIndex = groups.length - 1;
          });
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
        removeSet: (exerciseIndex: number, setIndex: number) => {
          set((state) => {
            const exercise = state.session.active?.exercises[exerciseIndex];
            if (exercise && exercise.sets.length > 1) {
              exercise.sets.splice(setIndex, 1);
            }
          });
        },
        goToGroup: (index: number) => {
          set((state) => {
            if (state.session.active) {
              state.session.active.currentGroupIndex = index;
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
              restSeconds: state.session.timer.restSeconds,
            };
          });
        },
        stopTimer: () => {
          set((state) => {
            state.session.timer = emptyTimer;
          });
        },
        pauseTimer: () => {
          set((state) => {
            state.session.timer.isRunning = false;
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
        adjustRestDuration: (delta: number) => {
          set((state) => {
            const newTime = Math.max(15, state.session.timer.restSeconds + delta);
            state.session.timer.restSeconds = newTime;
          });
        },
        setRestDuration: (seconds: number) => {
          set((state) => {
            state.session.timer.restSeconds = Math.max(15, seconds);
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

          const activities = (state.library.activities ?? []).filter((a) => {
            const parsed = ActivityEntrySchema.safeParse(a);
            return parsed.success;
          });

          const soreness = (state.library.soreness ?? []).filter((s) => {
            const parsed = SorenessEntrySchema.safeParse(s);
            return parsed.success;
          });

          const settingsParsed = AppSettingsSchema.safeParse(state.settings);
          const settings = settingsParsed.success ? state.settings : DEFAULT_SETTINGS;

          state.library.workouts = workouts;
          state.library.logs = logs;
          state.library.activities = activities;
          state.library.soreness = soreness;
          state.settings = settings;
        } catch {
          state.library = { workouts: [], logs: [], activities: [], soreness: [] };
          state.settings = DEFAULT_SETTINGS;
        }
      },
    }
  )
);
