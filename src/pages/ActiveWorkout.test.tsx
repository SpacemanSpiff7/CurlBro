import type { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Exercise, ExerciseGraph, ExerciseId, WorkoutLog, WorkoutId } from '@/types';
import { ActiveWorkout } from './ActiveWorkout';

const mocks = vi.hoisted(() => {
  const bag = {} as {
    state: {
      session: {
        active: NonNullable<ReturnType<typeof createSession>> | null;
        timer: { isRunning: boolean; remainingSeconds: number; totalSeconds: number; restSeconds: number; timerStartedAt: string | null };
      };
      graph: ExerciseGraph;
      library: {
        workouts: Array<{
          id: WorkoutId;
          name: string;
          exercises: Array<{
            exerciseId: ExerciseId;
            sets: number;
            reps: number;
            weight: number | null;
            restSeconds: number;
            notes: string;
            trackWeight: boolean;
            trackReps: boolean;
            trackDuration: boolean;
            trackDistance: boolean;
          }>;
          createdAt: string;
          updatedAt: string;
        }>;
        logs: never[];
        activities: never[];
        soreness: never[];
      };
      builder: {
        workout: {
          id: WorkoutId;
          name: string;
          exercises: never[];
          createdAt: string;
          updatedAt: string;
        };
      };
      activeTab: 'active' | 'library' | 'build' | 'log' | 'settings';
      sessionActions: Record<string, unknown>;
      builderActions: { resetWorkout: ReturnType<typeof vi.fn> };
      setActiveTab: ReturnType<typeof vi.fn>;
    };
    summaryLog: WorkoutLog;
    restTimer: {
      remainingSeconds: number;
      totalSeconds: number;
      progress: number;
      isRunning: boolean;
      isDone: boolean;
      restSeconds: number;
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      addTime: ReturnType<typeof vi.fn>;
      adjustRestDuration: ReturnType<typeof vi.fn>;
    };
  };

  const exerciseId = 'barbell_bench_press' as ExerciseId;
  const workoutId = 'w-1' as WorkoutId;

  function createSession() {
    return {
      workoutId,
      workoutName: 'Push Day',
      exercises: [
        {
          exerciseId,
          restSeconds: 90,
          sets: [{ weight: 155, reps: 8, completed: true, durationSeconds: null, distanceMeters: null }],
          planNotes: '',
          trackWeight: true,
          trackReps: true,
          trackDuration: false,
          trackDistance: false,
        },
      ],
      currentGroupIndex: 0,
      startedAt: '2026-03-01T10:00:00.000Z',
      completedAt: null as string | null,
      notes: '',
    };
  }

  const exercise: Exercise = {
    id: exerciseId,
    name: 'Barbell Bench Press (Flat)',
    category: 'compound',
    movement_pattern: 'horizontal_push',
    force_type: 'push',
    equipment: ['barbell'],
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps'],
    workout_position: 'early',
    difficulty: 'intermediate',
    bilateral: true,
    rep_range_hypertrophy: '6-12',
    rep_range_strength: '3-5',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  };

  const graph: ExerciseGraph = {
    exercises: new Map([[exerciseId, exercise]]),
    substitutes: new Map(),
    complements: new Map(),
    supersets: new Map(),
    byMuscle: new Map(),
    byEquipment: new Map(),
    byPattern: new Map(),
    byForceType: new Map(),
  };

  const summaryLog: WorkoutLog = {
    id: 'log-1' as WorkoutLog['id'],
    workoutId,
    workoutName: 'Push Day',
    exercises: [
      {
        exerciseId,
        restSeconds: 90,
        sets: [{ weight: 155, reps: 8, completed: true, durationSeconds: null, distanceMeters: null }],
        planNotes: '',
        trackWeight: true,
        trackReps: true,
        trackDuration: false,
        trackDistance: false,
      },
    ],
    startedAt: '2026-03-01T10:00:00.000Z',
    completedAt: '2026-03-01T10:45:00.000Z',
    durationMinutes: 45,
    notes: '',
    weightUnit: 'lb',
    distanceUnit: 'mi',
  };

  const state = {
    session: {
      active: createSession(),
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0, restSeconds: 90, timerStartedAt: null as string | null },
    },
    graph,
    library: {
      workouts: [{
        id: workoutId,
        name: 'Push Day',
        exercises: [{
          exerciseId,
          sets: 1,
          reps: 8,
          weight: 155,
          restSeconds: 90,
          notes: '',
          trackWeight: true,
          trackReps: true,
          trackDuration: false,
          trackDistance: false,
        }],
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
      }],
      logs: [],
      activities: [],
      soreness: [],
    },
    builder: {
      workout: {
        id: workoutId,
        name: 'Push Day',
        exercises: [],
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
      },
    },
    activeTab: 'active' as const,
    sessionActions: {
      completeSet: vi.fn(),
      addSet: vi.fn(),
      removeSet: vi.fn(),
      goToGroup: vi.fn(),
      beginSession: vi.fn(),
      abandonSession: vi.fn(() => {
        bag.state.session.active = null;
      }),
      endSession: vi.fn(() => {
        if (bag.state.session.active) {
          bag.state.session.active.completedAt = '2026-03-01T10:45:00.000Z';
        }
      }),
      swapExercise: vi.fn(),
      saveSession: vi.fn(() => bag.summaryLog),
      addExerciseToSession: vi.fn(),
      updateSessionNotes: vi.fn(),
    },
    builderActions: {
      resetWorkout: vi.fn(),
    },
    setActiveTab: vi.fn((tab: 'library' | 'build' | 'active' | 'log' | 'settings') => {
      bag.state.activeTab = tab;
    }),
  };

  const restTimer = {
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
    isRunning: false,
    isDone: false,
    restSeconds: 90,
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    addTime: vi.fn(),
    adjustRestDuration: vi.fn(),
  };

  bag.state = state;
  bag.summaryLog = summaryLog;
  bag.restTimer = restTimer;
  return bag;
});

vi.mock('@/store', () => {
  const useStore = ((selector: (state: typeof mocks.state) => unknown) => selector(mocks.state)) as typeof import('@/store').useStore;
  // @ts-expect-error test mock
  useStore.getState = () => mocks.state;
  return { useStore };
});

vi.mock('@/hooks/useRestTimer', () => ({
  useRestTimer: () => mocks.restTimer,
}));

vi.mock('@/hooks/useElapsedTimer', () => ({
  useElapsedTimer: () => '45:00',
}));

vi.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => ({
    isSupported: false,
    isActive: false,
    toggle: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSessionGroups', () => ({
  useSessionGroups: () => {
    const session = mocks.state.session.active;
    if (!session) {
      return { groups: [], currentGroup: null, currentGroupIndex: 0, totalGroups: 0 };
    }

    return {
      groups: [{ groupId: 'g-1', exercises: session.exercises, indices: [0] }],
      currentGroup: { groupId: 'g-1', exercises: session.exercises, indices: [0] },
      currentGroupIndex: session.currentGroupIndex,
      totalGroups: 1,
    };
  },
}));

vi.mock('@/hooks/useDragOffsetChannel', () => ({
  registerDragOffsetListener: vi.fn(),
}));

vi.mock('@/hooks/useTimerVisibility', () => ({
  setInlineTimerVisible: vi.fn(),
  registerScrollToTimer: vi.fn(),
}));

vi.mock('@/components/shared/PageLayout', () => ({
  PageLayout: ({ children, header, headerRight }: { children: ReactNode; header?: ReactNode; headerRight?: ReactNode }) => (
    <div>
      <div>{header}</div>
      <div>{headerRight}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock('@/components/shared/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/components/shared/MarqueeText', () => ({
  MarqueeText: ({ text }: { text: string }) => <div>{text}</div>,
}));

vi.mock('@/components/session/ExerciseRowStack', () => ({
  ExerciseRowStack: () => <div>Exercise Row</div>,
}));

vi.mock('@/components/session/GroupSetTracker', () => ({
  GroupSetTracker: () => <div>Group Set Tracker</div>,
}));

vi.mock('@/components/session/RestTimer', () => ({
  RestTimer: () => <div>Rest Timer</div>,
}));

vi.mock('@/components/ads/AdSlot', () => ({
  AdSlot: () => <div>Ad Slot</div>,
}));

vi.mock('@/components/exercise/ExercisePicker', () => ({
  ExercisePicker: () => null,
}));

vi.mock('@/components/exercise/SubstitutePanel', () => ({
  SubstitutePanel: () => null,
}));

vi.mock('@/components/exercise/VideoSheet', () => ({
  VideoSheet: () => null,
}));

vi.mock('@/components/session/StartOverlay', () => ({
  StartOverlay: () => null,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('ActiveWorkout', () => {
  beforeEach(() => {
    class MockIntersectionObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    // @ts-expect-error jsdom test stub
    globalThis.IntersectionObserver = MockIntersectionObserver;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    mocks.state.session.active = {
      workoutId: 'w-1' as WorkoutId,
      workoutName: 'Push Day',
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          restSeconds: 90,
          sets: [{ weight: 155, reps: 8, completed: true, durationSeconds: null, distanceMeters: null }],
          planNotes: '',
          trackWeight: true,
          trackReps: true,
          trackDuration: false,
          trackDistance: false,
        },
      ],
      currentGroupIndex: 0,
      startedAt: '2026-03-01T10:00:00.000Z',
      completedAt: null,
      notes: '',
    };
    mocks.state.activeTab = 'active';
    vi.clearAllMocks();
  });

  it('keeps rendering the save summary after the session is abandoned', () => {
    render(<ActiveWorkout />);

    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /end & save/i }));

    expect(screen.getByText('Workout Saved')).toBeTruthy();
    expect(screen.getByText('View Log')).toBeTruthy();
    expect(screen.getByText('No Active Workout')).toBeTruthy();
  });
});
