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
  ActiveSessionSchema,
  TimerStateSchema,
} from '@/types';
import { buildExerciseGraph } from '@/data/graphBuilder';
import { getAllExercises } from '@/data/exercises';
import { deriveGroups } from '@/utils/groupUtils';
import { inferTrackingFlags } from '@/utils/fieldDefaults';

// ─── State Shape ─────────────────────────────────────────
interface AppState {
  // Graph (read-only after init)
  graph: ExerciseGraph;
  graphReady: boolean;
  initGraph: () => void;

  // Builder
  builder: {
    workout: WorkoutDraft;
    isDirty: boolean;
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
    mergeExerciseIntoGroup: (fromIndex: number, targetIndex: number) => void;
    groupSelectedExercises: (indices: number[]) => void;
    removeSelectedExercises: (indices: number[]) => void;
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
    updateLogNotes: (logId: LogId, notes: string) => void;
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
    abandonSession: () => void;
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
    syncTimer: () => void;
    updateSessionNotes: (notes: string) => void;
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
  timerStartedAt: null,
};

/** Pick the default rep count for an exercise based on user settings */
export function getDefaultReps(exercise: Exercise, settings: AppSettings): number {
  return exercise.category === 'compound' || exercise.category === 'cardio'
    ? settings.defaultRepsCompound
    : settings.defaultRepsIsolation;
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
        isDirty: false,
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
            state.builder.isDirty = true;
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
          const reps = getDefaultReps(exercise, settings);

          const flags = inferTrackingFlags(exercise);

          set((state) => {
            state.builder.workout.exercises.push({
              exerciseId,
              instanceId: crypto.randomUUID(),
              sets,
              reps,
              weight: null,
              restSeconds,
              notes: '',
              ...flags,
            });
            state.builder.workout.updatedAt = new Date().toISOString();
            state.builder.isDirty = true;
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
          const reps = getDefaultReps(exercise, settings);

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

            const flags = inferTrackingFlags(exercise);
            exercises.splice(lastGroupIndex + 1, 0, {
              exerciseId,
              instanceId: crypto.randomUUID(),
              sets,
              reps,
              weight: null,
              restSeconds,
              notes: '',
              ...flags,
              supersetGroupId: groupId,
            });
            state.builder.workout.updatedAt = new Date().toISOString();
            state.builder.isDirty = true;
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
            state.builder.isDirty = true;
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
            state.builder.isDirty = true;
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
            state.builder.isDirty = true;
          });
        },
        updateExercise: (index: number, updates: Partial<WorkoutExercise>) => {
          set((state) => {
            const ex = state.builder.workout.exercises[index];
            if (ex) {
              Object.assign(ex, updates);
              state.builder.workout.updatedAt = new Date().toISOString();
              state.builder.isDirty = true;
            }
          });
        },
        swapExercise: (index: number, newExerciseId: ExerciseId) => {
          const graph = get().graph;
          const newExercise = graph.exercises.get(newExerciseId);
          set((state) => {
            const ex = state.builder.workout.exercises[index];
            if (ex) {
              ex.exerciseId = newExerciseId;
              if (newExercise) {
                const flags = inferTrackingFlags(newExercise);
                ex.trackWeight = flags.trackWeight;
                ex.trackReps = flags.trackReps;
                ex.trackDuration = flags.trackDuration;
                ex.trackDistance = flags.trackDistance;
              }
              state.builder.workout.updatedAt = new Date().toISOString();
              state.builder.isDirty = true;
            }
          });
        },
        mergeExerciseIntoGroup: (fromIndex: number, targetIndex: number) => {
          set((state) => {
            const exercises = state.builder.workout.exercises;
            const source = exercises[fromIndex];
            const target = exercises[targetIndex];
            if (!source || !target || fromIndex === targetIndex) return;

            // Assign group ID if target doesn't have one
            if (!target.supersetGroupId) {
              target.supersetGroupId = crypto.randomUUID();
            }
            const targetGroupId = target.supersetGroupId;

            // Record source's old group before modifying
            const oldGroupId = source.supersetGroupId;

            // Assign target's groupId to source
            source.supersetGroupId = targetGroupId;

            // Splice source out of its current position
            const [removed] = exercises.splice(fromIndex, 1);

            // Find the last consecutive member of target's group
            let lastGroupIndex = -1;
            for (let i = 0; i < exercises.length; i++) {
              if (exercises[i].supersetGroupId === targetGroupId) {
                lastGroupIndex = i;
              }
            }

            // Insert source after last target group member
            const insertAt = lastGroupIndex >= 0 ? lastGroupIndex + 1 : exercises.length;
            exercises.splice(insertAt, 0, removed);

            // If source's old group now has ≤1 member → clear its supersetGroupId
            if (oldGroupId) {
              const remaining = exercises.filter((e) => e.supersetGroupId === oldGroupId);
              if (remaining.length === 1) {
                remaining[0].supersetGroupId = undefined;
              }
            }

            state.builder.workout.updatedAt = new Date().toISOString();
            state.builder.isDirty = true;
          });
        },
        groupSelectedExercises: (indices: number[]) => {
          if (indices.length < 2) return;
          set((state) => {
            const exercises = state.builder.workout.exercises;
            const sorted = [...indices].sort((a, b) => a - b);
            const newGroupId = crypto.randomUUID();

            // Track old groups that may need cleanup
            const oldGroupIds = new Set<string>();
            for (const idx of sorted) {
              const ex = exercises[idx];
              if (ex?.supersetGroupId) {
                oldGroupIds.add(ex.supersetGroupId);
              }
            }

            // Assign new group ID
            for (const idx of sorted) {
              exercises[idx].supersetGroupId = newGroupId;
            }

            // Collect exercises and remove from array (reverse order)
            const collected: WorkoutExercise[] = [];
            for (let i = sorted.length - 1; i >= 0; i--) {
              const [ex] = exercises.splice(sorted[i], 1);
              collected.unshift(ex);
            }

            // Insert all at position of first selected index
            const insertAt = Math.min(sorted[0], exercises.length);
            exercises.splice(insertAt, 0, ...collected);

            // Clean up orphaned old groups
            for (const gid of oldGroupIds) {
              const remaining = exercises.filter((e) => e.supersetGroupId === gid);
              if (remaining.length === 1) {
                remaining[0].supersetGroupId = undefined;
              }
            }

            state.builder.workout.updatedAt = new Date().toISOString();
            state.builder.isDirty = true;
          });
        },
        removeSelectedExercises: (indices: number[]) => {
          if (indices.length === 0) return;
          set((state) => {
            const exercises = state.builder.workout.exercises;
            const sorted = [...indices].sort((a, b) => b - a); // descending

            // Track affected groups
            const affectedGroupIds = new Set<string>();
            for (const idx of sorted) {
              const ex = exercises[idx];
              if (ex?.supersetGroupId) {
                affectedGroupIds.add(ex.supersetGroupId);
              }
              exercises.splice(idx, 1);
            }

            // Clean up groups with ≤1 member
            for (const gid of affectedGroupIds) {
              const remaining = exercises.filter((e) => e.supersetGroupId === gid);
              if (remaining.length === 1) {
                remaining[0].supersetGroupId = undefined;
              }
            }

            state.builder.workout.updatedAt = new Date().toISOString();
            state.builder.isDirty = true;
          });
        },
        resetWorkout: () => {
          set((state) => {
            state.builder.workout = createEmptyDraft();
            state.builder.isDirty = false;
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
            state.builder.isDirty = false;
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
                .map((e) => {
                  const ex = graph.exercises.get(e.exerciseId)!;
                  const flags = inferTrackingFlags(ex);
                  return {
                    exerciseId: e.exerciseId,
                    instanceId: crypto.randomUUID(),
                    sets: e.sets,
                    reps: e.reps,
                    weight: null,
                    restSeconds: e.restSeconds,
                    notes: '',
                    ...flags,
                  };
                }),
              createdAt: now,
              updatedAt: now,
            };
            state.builder.workoutSplit = split;
            state.builder.isDirty = false;
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
            // Clear dirty flag if saving the current builder draft
            if (state.builder.workout.id === workout.id) {
              state.builder.isDirty = false;
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
        updateLogNotes: (logId: LogId, notes: string) => {
          set((state) => {
            const log = state.library.logs.find((l) => l.id === logId);
            if (log) log.notes = notes;
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
                  reps: ex.reps ?? null,
                  completed: false,
                  durationSeconds: ex.durationSeconds ?? null,
                  distanceMeters: null,
                })),
                ...(ex.supersetGroupId ? { supersetGroupId: ex.supersetGroupId } : {}),
                planNotes: ex.notes,
                trackWeight: ex.trackWeight,
                trackReps: ex.trackReps,
                trackDuration: ex.trackDuration,
                trackDistance: ex.trackDistance,
                ...(ex.durationSeconds != null ? { durationSeconds: ex.durationSeconds } : {}),
              })),
              currentGroupIndex: 0,
              startedAt: null,
              completedAt: null,
              notes: '',
            };
            state.session.timer = { ...emptyTimer, restSeconds: workout.exercises[0]?.restSeconds ?? 90 };
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
        abandonSession: () => {
          set((state) => {
            state.session.active = null;
            state.session.timer = emptyTimer;
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

          const settings = get().settings;
          const log: WorkoutLog = {
            id: uuidv4() as LogId,
            workoutId: session.workoutId,
            workoutName: session.workoutName,
            exercises: completedExercises,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            durationMinutes,
            notes: session.notes ?? '',
            weightUnit: settings.weightUnit,
            distanceUnit: settings.distanceUnit,
          };

          set((state) => {
            state.library.logs.push(log);
          });

          return log;
        },
        addExerciseToSession: (exerciseId: ExerciseId) => {
          const graph = get().graph;
          const exercise = graph.exercises.get(exerciseId);
          const flags = exercise
            ? inferTrackingFlags(exercise)
            : { trackWeight: true, trackReps: true, trackDuration: false, trackDistance: false };
          set((state) => {
            const session = state.session.active;
            if (!session || session.completedAt) return;
            session.exercises.push({
              exerciseId,
              sets: [{ weight: null, reps: null, completed: false, durationSeconds: null, distanceMeters: null }],
              ...flags,
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
              const last = exercise.sets[exercise.sets.length - 1];
              exercise.sets.push({
                weight: last?.weight ?? null,
                reps: last?.reps ?? null,
                completed: false,
                durationSeconds: last?.durationSeconds ?? null,
                distanceMeters: last?.distanceMeters ?? null,
              });
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
              timerStartedAt: new Date().toISOString(),
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
            state.session.timer.timerStartedAt = null;
          });
        },
        tickTimer: () => {
          set((state) => {
            if (state.session.timer.isRunning && state.session.timer.remainingSeconds > 0) {
              state.session.timer.remainingSeconds -= 1;
            }
            if (state.session.timer.remainingSeconds <= 0) {
              state.session.timer.isRunning = false;
              state.session.timer.timerStartedAt = null;
            }
          });
        },
        adjustTimer: (delta: number) => {
          set((state) => {
            const timer = state.session.timer;
            const newRemaining = Math.max(0, timer.remainingSeconds + delta);
            timer.remainingSeconds = newRemaining;
            timer.totalSeconds = Math.max(newRemaining, timer.totalSeconds + delta);
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
        syncTimer: () => {
          set((state) => {
            const timer = state.session.timer;
            if (!timer.isRunning || !timer.timerStartedAt) return;
            const startMs = new Date(timer.timerStartedAt).getTime();
            if (isNaN(startMs)) return;
            const elapsed = Math.floor((Date.now() - startMs) / 1000);
            const corrected = Math.max(0, timer.totalSeconds - elapsed);
            if (corrected <= 0) {
              timer.isRunning = false;
              timer.remainingSeconds = 0;
              timer.timerStartedAt = null;
            } else {
              timer.remainingSeconds = corrected;
            }
          });
        },
        updateSessionNotes: (notes: string) => {
          set((state) => {
            if (state.session.active) {
              state.session.active.notes = notes;
            }
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
        session: state.session,
        builder: { workout: state.builder.workout },
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

          // Backfill instanceId for exercises saved before this field existed
          for (const w of workouts) {
            for (const ex of w.exercises) {
              if (!ex.instanceId) {
                ex.instanceId = crypto.randomUUID();
              }
              // Backfill tracking flags (pre-flexible-tracking data)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const exAny = ex as any;
              if (typeof exAny.trackWeight !== 'boolean') exAny.trackWeight = true;
              if (typeof exAny.trackReps !== 'boolean') exAny.trackReps = true;
              if (typeof exAny.trackDuration !== 'boolean') exAny.trackDuration = false;
              if (typeof exAny.trackDistance !== 'boolean') exAny.trackDistance = false;
            }
          }

          // Backfill notes on logs (pre-notes-feature data)
          for (const log of logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const logAny = log as any;
            if (typeof logAny.notes !== 'string') {
              logAny.notes = '';
            }
            // Backfill unit stamps (pre-flexible-tracking data)
            if (!logAny.weightUnit) logAny.weightUnit = 'lb';
            if (!logAny.distanceUnit) logAny.distanceUnit = 'mi';

            for (const ex of log.exercises) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const exAny = ex as any;
              if (typeof exAny.planNotes !== 'string') {
                exAny.planNotes = '';
              }
              // Backfill tracking flags on ExerciseLog
              if (typeof exAny.trackWeight !== 'boolean') exAny.trackWeight = true;
              if (typeof exAny.trackReps !== 'boolean') exAny.trackReps = true;
              if (typeof exAny.trackDuration !== 'boolean') exAny.trackDuration = false;
              if (typeof exAny.trackDistance !== 'boolean') exAny.trackDistance = false;

              // Backfill new SetLog fields
              for (const s of ex.sets) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sAny = s as any;
                if (sAny.durationSeconds === undefined) sAny.durationSeconds = null;
                if (sAny.distanceMeters === undefined) sAny.distanceMeters = null;
              }
            }
          }

          state.library.workouts = workouts;
          state.library.logs = logs;
          state.library.activities = activities;
          state.library.soreness = soreness;
          state.settings = settings;

          // Backfill unit preferences on settings (pre-flexible-tracking data)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const settingsAny = state.settings as any;
          if (!settingsAny.weightUnit) settingsAny.weightUnit = 'lb';
          if (!settingsAny.distanceUnit) settingsAny.distanceUnit = 'mi';

          // Restore builder draft (if persisted)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const builderAny = state as any;
          if (builderAny.builder?.workout?.exercises?.length > 0) {
            const draft = builderAny.builder.workout;
            for (const ex of draft.exercises) {
              if (!ex.instanceId) {
                ex.instanceId = crypto.randomUUID();
              }
              if (typeof ex.trackWeight !== 'boolean') ex.trackWeight = true;
              if (typeof ex.trackReps !== 'boolean') ex.trackReps = true;
              if (typeof ex.trackDuration !== 'boolean') ex.trackDuration = false;
              if (typeof ex.trackDistance !== 'boolean') ex.trackDistance = false;
            }
            state.builder.workout = draft;
          }

          // Validate and restore session
          if (state.session?.active) {
            // Backfill notes on active session (pre-notes-feature data)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof (state.session.active as any).notes !== 'string') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (state.session.active as any).notes = '';
            }
            for (const ex of state.session.active.exercises) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const exAny = ex as any;
              if (typeof exAny.planNotes !== 'string') {
                exAny.planNotes = '';
              }
              // Backfill tracking flags on session ExerciseLog
              if (typeof exAny.trackWeight !== 'boolean') exAny.trackWeight = true;
              if (typeof exAny.trackReps !== 'boolean') exAny.trackReps = true;
              if (typeof exAny.trackDuration !== 'boolean') exAny.trackDuration = false;
              if (typeof exAny.trackDistance !== 'boolean') exAny.trackDistance = false;

              // Backfill new SetLog fields on session sets
              for (const s of ex.sets) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sAny = s as any;
                if (sAny.durationSeconds === undefined) sAny.durationSeconds = null;
                if (sAny.distanceMeters === undefined) sAny.distanceMeters = null;
              }
            }
            const sessionParsed = ActiveSessionSchema.safeParse(state.session.active);
            if (!sessionParsed.success) {
              state.session.active = null;
            }
          }

          // Correct timer for elapsed wall-clock time
          if (state.session?.timer) {
            const timerParsed = TimerStateSchema.safeParse(state.session.timer);
            if (timerParsed.success) {
              const timer = state.session.timer;
              if (timer.isRunning && timer.timerStartedAt) {
                const startMs = new Date(timer.timerStartedAt).getTime();
                if (!isNaN(startMs)) {
                  const elapsed = Math.floor((Date.now() - startMs) / 1000);
                  const corrected = Math.max(0, timer.totalSeconds - elapsed);
                  if (corrected <= 0) {
                    state.session.timer.isRunning = false;
                    state.session.timer.remainingSeconds = 0;
                    state.session.timer.timerStartedAt = null;
                  } else {
                    state.session.timer.remainingSeconds = corrected;
                  }
                }
              }
            } else {
              state.session.timer = { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null };
            }
          }
        } catch {
          state.library = { workouts: [], logs: [], activities: [], soreness: [] };
          state.settings = DEFAULT_SETTINGS;
          state.session = { active: null, timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null } };
        }
      },
    }
  )
);
