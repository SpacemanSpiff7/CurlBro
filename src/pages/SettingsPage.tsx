import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

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

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-20">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

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
  );
}
