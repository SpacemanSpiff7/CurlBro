import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutDetailSheet } from './WorkoutDetailSheet';
import type { SavedWorkout, WorkoutId, ExerciseId, ExerciseGraph, Exercise } from '@/types';

// Build a minimal graph for testing
function createTestGraph(): ExerciseGraph {
  const exercises = new Map<ExerciseId, Exercise>();
  exercises.set('barbell_bench_press' as ExerciseId, {
    id: 'barbell_bench_press' as ExerciseId,
    name: 'Barbell Bench Press (Flat)',
    category: 'compound',
    primary_muscles: ['chest'],
    secondary_muscles: ['triceps', 'shoulders'],
    movement_pattern: 'horizontal_push',
    force_type: 'push',
    equipment: ['barbell'],
    workout_position: 'early',
    difficulty: 'intermediate',
    bilateral: true,
    rep_range_hypertrophy: '6-12',
    rep_range_strength: '1-5',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  } as Exercise);
  exercises.set('cable_flye' as ExerciseId, {
    id: 'cable_flye' as ExerciseId,
    name: 'Cable Flye (Mid-Height)',
    category: 'isolation',
    primary_muscles: ['chest'],
    secondary_muscles: ['shoulders'],
    movement_pattern: 'chest_fly',
    force_type: 'push',
    equipment: ['cable_machine'],
    workout_position: 'mid_late',
    difficulty: 'beginner',
    bilateral: true,
    rep_range_hypertrophy: '10-15',
    rep_range_strength: '8-12',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  } as Exercise);
  exercises.set('barbell_row' as ExerciseId, {
    id: 'barbell_row' as ExerciseId,
    name: 'Barbell Row',
    category: 'compound',
    primary_muscles: ['upper_back'],
    secondary_muscles: ['biceps'],
    movement_pattern: 'horizontal_pull',
    force_type: 'pull',
    equipment: ['barbell'],
    workout_position: 'early',
    difficulty: 'intermediate',
    bilateral: true,
    rep_range_hypertrophy: '6-12',
    rep_range_strength: '3-6',
    video_url: '',
    beginner_tips: '',
    substitutes: [],
    complements: [],
    superset_candidates: [],
    notes: '',
  } as Exercise);

  return {
    exercises,
    substitutes: new Map(),
    complements: new Map(),
    supersets: new Map(),
    byMuscle: new Map(),
    byEquipment: new Map(),
    byPattern: new Map(),
    byForceType: new Map(),
  };
}

const mockGraph = createTestGraph();

vi.mock('@/store', () => ({
  useStore: (selector: (state: { graph: ExerciseGraph }) => unknown) =>
    selector({ graph: mockGraph }),
}));

function createTestWorkout(overrides?: Partial<SavedWorkout>): SavedWorkout {
  return {
    id: 'w-1' as WorkoutId,
    name: 'Test Workout',
    exercises: [
      {
        exerciseId: 'barbell_bench_press' as ExerciseId,
        sets: 3,
        reps: 8,
        weight: 155,
        restSeconds: 90,
        notes: '',
      },
      {
        exerciseId: 'cable_flye' as ExerciseId,
        sets: 3,
        reps: 12,
        weight: 30,
        restSeconds: 60,
        notes: 'Squeeze at top',
      },
    ],
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-05T14:00:00.000Z',
    ...overrides,
  };
}

const noop = () => {};

describe('WorkoutDetailSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when workout is null', () => {
    const { container } = render(
      <WorkoutDetailSheet
        workout={null}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders workout name and date', () => {
    const workout = createTestWorkout();
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Test Workout')).toBeTruthy();
    // The date includes "Updated"
    expect(screen.getByText(/Updated/)).toBeTruthy();
  });

  it('renders exercise names from graph lookup', () => {
    const workout = createTestWorkout();
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Barbell Bench Press (Flat)')).toBeTruthy();
    expect(screen.getByText('Cable Flye (Mid-Height)')).toBeTruthy();
  });

  it('shows sets x reps and weight', () => {
    const workout = createTestWorkout();
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    // Check for "@ 155 lbs" and "@ 30 lbs"
    expect(screen.getByText(/155 lbs/)).toBeTruthy();
    expect(screen.getByText(/30 lbs/)).toBeTruthy();
  });

  it('does not show weight for bodyweight exercises', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 3,
          reps: 10,
          weight: null,
          restSeconds: 60,
          notes: '',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByText(/lbs/)).toBeNull();
  });

  it('shows notes when present', () => {
    const workout = createTestWorkout();
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Squeeze at top')).toBeTruthy();
  });

  it('does not show notes row when notes are empty', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 155,
          restSeconds: 90,
          notes: '',
        },
      ],
    });
    const { container } = render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    // No italic notes element
    expect(container.querySelector('.italic')).toBeNull();
  });

  it('shows superset label for grouped exercises', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 155,
          restSeconds: 90,
          notes: '',
          supersetGroupId: 'ss1',
        },
        {
          exerciseId: 'barbell_row' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 135,
          restSeconds: 90,
          notes: '',
          supersetGroupId: 'ss1',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Superset')).toBeTruthy();
    expect(screen.getByText('Barbell Bench Press (Flat)')).toBeTruthy();
    expect(screen.getByText('Barbell Row')).toBeTruthy();
  });

  it('shows tri-set label for 3 grouped exercises', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 155,
          restSeconds: 90,
          notes: '',
          supersetGroupId: 'ss1',
        },
        {
          exerciseId: 'cable_flye' as ExerciseId,
          sets: 3,
          reps: 12,
          weight: 30,
          restSeconds: 60,
          notes: '',
          supersetGroupId: 'ss1',
        },
        {
          exerciseId: 'barbell_row' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 135,
          restSeconds: 90,
          notes: '',
          supersetGroupId: 'ss1',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Tri-set')).toBeTruthy();
  });

  it('falls back to exerciseId when exercise not in graph', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'deleted_exercise' as ExerciseId,
          sets: 3,
          reps: 10,
          weight: null,
          restSeconds: 60,
          notes: '',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('deleted_exercise')).toBeTruthy();
  });

  it('shows stats grid with exercise count and total sets', () => {
    const workout = createTestWorkout();
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    // 2 exercises, 6 total sets (3+3)
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('shows Groups stat only when supersets exist', () => {
    const soloWorkout = createTestWorkout();
    const { unmount } = render(
      <WorkoutDetailSheet
        workout={soloWorkout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByText('Groups')).toBeNull();
    unmount();

    const groupedWorkout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 155,
          restSeconds: 90,
          notes: '',
          supersetGroupId: 'ss1',
        },
        {
          exerciseId: 'barbell_row' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 135,
          restSeconds: 90,
          notes: '',
          supersetGroupId: 'ss1',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={groupedWorkout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Groups')).toBeTruthy();
  });

  it('renders action buttons', () => {
    const workout = createTestWorkout();
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByLabelText('Start workout')).toBeTruthy();
    expect(screen.getByLabelText('Edit workout')).toBeTruthy();
    expect(screen.getByLabelText('Copy workout to clipboard')).toBeTruthy();
    expect(screen.getByLabelText('Delete workout')).toBeTruthy();
  });

  it('shows category badge', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'cable_flye' as ExerciseId,
          sets: 3,
          reps: 12,
          weight: 30,
          restSeconds: 60,
          notes: '',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Isolation')).toBeTruthy();
  });

  it('shows muscle tags', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'barbell_row' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 135,
          restSeconds: 90,
          notes: '',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText('Back')).toBeTruthy();
  });

  it('shows rest time', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          exerciseId: 'barbell_bench_press' as ExerciseId,
          sets: 3,
          reps: 8,
          weight: 155,
          restSeconds: 90,
          notes: '',
        },
      ],
    });
    render(
      <WorkoutDetailSheet
        workout={workout}
        open={true}
        onOpenChange={noop}
        onStart={noop}
        onEdit={noop}
        onExport={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText(/90s rest/)).toBeTruthy();
  });
});
