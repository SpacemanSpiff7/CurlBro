import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/shared/TopBar';
import { useStore } from '@/store';
import { TRAINING_GOALS, TRAINING_GOAL_LABELS } from '@/types';
import type { TrainingGoal } from '@/types';

export function SettingsPage() {
  const settings = useStore((state) => state.settings);
  const { updateSettings, resetSettings } = useStore((state) => state.settingsActions);
  const { clearAll } = useStore((state) => state.libraryActions);

  const handleCompoundChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 0) {
        updateSettings({ restTimerCompoundSeconds: val });
      }
    },
    [updateSettings]
  );

  const handleIsolationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 0) {
        updateSettings({ restTimerIsolationSeconds: val });
      }
    },
    [updateSettings]
  );

  const handleGoalChange = useCallback(
    (goal: TrainingGoal) => {
      updateSettings({ trainingGoal: goal });
    },
    [updateSettings]
  );

  const handleCompoundSetsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 1) {
        updateSettings({ defaultSetsCompound: val });
      }
    },
    [updateSettings]
  );

  const handleIsolationSetsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 1) {
        updateSettings({ defaultSetsIsolation: val });
      }
    },
    [updateSettings]
  );

  return (
    <div className="flex flex-col gap-6 pb-20">
      <TopBar>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </TopBar>

      <div className="flex flex-col gap-6 px-4">

      {/* Training Goal */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Training Goal
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
          <div className="flex gap-1">
            {TRAINING_GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => handleGoalChange(goal)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  settings.trainingGoal === goal
                    ? 'bg-accent-primary text-bg-root'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                }`}
              >
                {TRAINING_GOAL_LABELS[goal]}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            {settings.trainingGoal === 'strength' && 'Lower reps from strength ranges (e.g. 1–5)'}
            {settings.trainingGoal === 'hypertrophy' && 'Moderate reps from hypertrophy ranges (e.g. 6–12)'}
            {settings.trainingGoal === 'endurance' && 'Higher reps from hypertrophy ranges (e.g. 12–15+)'}
          </p>
        </div>
      </div>

      {/* Default Sets */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Default Sets
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="compound-sets" className="text-sm text-text-primary">
              Compound exercises
            </label>
            <div className="flex items-center gap-1">
              <input
                id="compound-sets"
                type="number"
                value={settings.defaultSetsCompound}
                onChange={handleCompoundSetsChange}
                min={1}
                className="w-16 h-10 rounded bg-bg-elevated border border-border-subtle px-2 text-sm text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <span className="text-xs text-text-tertiary">sets</span>
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <label htmlFor="isolation-sets" className="text-sm text-text-primary">
              Isolation exercises
            </label>
            <div className="flex items-center gap-1">
              <input
                id="isolation-sets"
                type="number"
                value={settings.defaultSetsIsolation}
                onChange={handleIsolationSetsChange}
                min={1}
                className="w-16 h-10 rounded bg-bg-elevated border border-border-subtle px-2 text-sm text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <span className="text-xs text-text-tertiary">sets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rest Timer Defaults */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Rest Timer Defaults
        </h2>

        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="compound-rest" className="text-sm text-text-primary">
              Compound exercises
            </label>
            <div className="flex items-center gap-1">
              <input
                id="compound-rest"
                type="number"
                value={settings.restTimerCompoundSeconds}
                onChange={handleCompoundChange}
                min={0}
                className="w-16 h-10 rounded bg-bg-elevated border border-border-subtle px-2 text-sm text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <span className="text-xs text-text-tertiary">sec</span>
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <label htmlFor="isolation-rest" className="text-sm text-text-primary">
              Isolation exercises
            </label>
            <div className="flex items-center gap-1">
              <input
                id="isolation-rest"
                type="number"
                value={settings.restTimerIsolationSeconds}
                onChange={handleIsolationChange}
                min={0}
                className="w-16 h-10 rounded bg-bg-elevated border border-border-subtle px-2 text-sm text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <span className="text-xs text-text-tertiary">sec</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Data
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="w-full justify-start text-text-secondary"
          >
            <RotateCcw size={14} className="mr-2" />
            Reset settings to defaults
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <RotateCcw size={14} className="mr-2" />
            Clear all saved workouts &amp; logs
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
