import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetTracker } from './SetTracker';
import type { SetLog, TrackingFlags } from '@/types';

vi.mock('@/store', () => ({
  useStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      settings: { weightUnit: 'lb', distanceUnit: 'mi' },
    }),
}));

vi.mock('@/components/shared/SwipeToDelete', () => ({
  SwipeToDelete: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function makeSet(overrides: Partial<SetLog> = {}): SetLog {
  return {
    weight: null,
    reps: null,
    completed: false,
    durationSeconds: null,
    distanceMeters: null,
    ...overrides,
  };
}

const FLAGS_WEIGHT_REPS: TrackingFlags = {
  trackWeight: true,
  trackReps: true,
  trackDuration: false,
  trackDistance: false,
};

const FLAGS_DURATION: TrackingFlags = {
  trackWeight: false,
  trackReps: false,
  trackDuration: true,
  trackDistance: false,
};

const FLAGS_DURATION_DISTANCE: TrackingFlags = {
  trackWeight: false,
  trackReps: false,
  trackDuration: true,
  trackDistance: true,
};

const FLAGS_REPS_ONLY: TrackingFlags = {
  trackWeight: false,
  trackReps: true,
  trackDuration: false,
  trackDistance: false,
};

const noop = () => {};

describe('SetTracker', () => {
  describe('field visibility by tracking flags', () => {
    it('renders weight + reps fields for weight+reps tracking', () => {
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={135}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={noop}
          onAddSet={noop}
        />
      );
      expect(screen.getByLabelText('Set 1 weight')).toBeTruthy();
      expect(screen.getByLabelText('Set 1 reps')).toBeTruthy();
      expect(screen.queryByLabelText('Set 1 duration')).toBeNull();
      expect(screen.queryByLabelText('Set 1 distance')).toBeNull();
    });

    it('renders duration field only for duration tracking', () => {
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_DURATION}
          onCompleteSet={noop}
          onAddSet={noop}
        />
      );
      expect(screen.getByLabelText('Set 1 duration')).toBeTruthy();
      expect(screen.queryByLabelText('Set 1 weight')).toBeNull();
      expect(screen.queryByLabelText('Set 1 reps')).toBeNull();
      expect(screen.queryByLabelText('Set 1 distance')).toBeNull();
    });

    it('renders duration + distance fields for cardio tracking', () => {
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_DURATION_DISTANCE}
          onCompleteSet={noop}
          onAddSet={noop}
        />
      );
      expect(screen.getByLabelText('Set 1 duration')).toBeTruthy();
      expect(screen.getByLabelText('Set 1 distance')).toBeTruthy();
      expect(screen.queryByLabelText('Set 1 weight')).toBeNull();
      expect(screen.queryByLabelText('Set 1 reps')).toBeNull();
    });

    it('renders reps only field for bodyweight tracking', () => {
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_REPS_ONLY}
          onCompleteSet={noop}
          onAddSet={noop}
        />
      );
      expect(screen.getByLabelText('Set 1 reps')).toBeTruthy();
      expect(screen.queryByLabelText('Set 1 weight')).toBeNull();
      expect(screen.queryByLabelText('Set 1 duration')).toBeNull();
      expect(screen.queryByLabelText('Set 1 distance')).toBeNull();
    });
  });

  describe('set completion', () => {
    it('shows completion count', () => {
      render(
        <SetTracker
          sets={[makeSet({ completed: true }), makeSet(), makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={noop}
          onAddSet={noop}
        />
      );
      expect(screen.getByText('1/3 done')).toBeTruthy();
    });

    it('toggles set completed on button click', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={135}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={onComplete}
          onAddSet={noop}
        />
      );
      await user.click(screen.getByLabelText('Complete set 1'));
      expect(onComplete).toHaveBeenCalledWith(0, expect.objectContaining({
        completed: true,
        weight: 135, // fills in defaultWeight
      }));
    });
  });

  describe('input interactions', () => {
    it('calls onCompleteSet when weight is changed', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={onComplete}
          onAddSet={noop}
        />
      );
      await user.type(screen.getByLabelText('Set 1 weight'), '100');
      expect(onComplete).toHaveBeenCalled();
    });

    it('calls onCompleteSet when reps is changed', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={onComplete}
          onAddSet={noop}
        />
      );
      await user.type(screen.getByLabelText('Set 1 reps'), '8');
      expect(onComplete).toHaveBeenCalled();
    });

    it('calls onCompleteSet when duration is changed', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_DURATION}
          onCompleteSet={onComplete}
          onAddSet={noop}
        />
      );
      await user.type(screen.getByLabelText('Set 1 duration'), '30');
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('multiple sets', () => {
    it('renders multiple set rows', () => {
      render(
        <SetTracker
          sets={[makeSet(), makeSet(), makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={noop}
          onAddSet={noop}
        />
      );
      expect(screen.getByLabelText('Set 1 weight')).toBeTruthy();
      expect(screen.getByLabelText('Set 2 weight')).toBeTruthy();
      expect(screen.getByLabelText('Set 3 weight')).toBeTruthy();
    });
  });

  describe('add set button', () => {
    it('calls onAddSet when Add Set is clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={noop}
          onAddSet={onAdd}
        />
      );
      await user.click(screen.getByText('Add Set'));
      expect(onAdd).toHaveBeenCalledOnce();
    });
  });

  describe('plan notes', () => {
    it('renders plan notes when provided', () => {
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={noop}
          onAddSet={noop}
          planNotes="Focus on slow eccentric"
        />
      );
      expect(screen.getByText('Focus on slow eccentric')).toBeTruthy();
    });

    it('does not render notes section when empty', () => {
      render(
        <SetTracker
          sets={[makeSet()]}
          defaultWeight={null}
          trackingFlags={FLAGS_WEIGHT_REPS}
          onCompleteSet={noop}
          onAddSet={noop}
        />
      );
      expect(screen.queryByText(/Focus/)).toBeNull();
    });
  });
});
