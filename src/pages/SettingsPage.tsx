import { useState, useCallback } from 'react';
import { RotateCcw, Trash2, Info, Shield, FileText, ExternalLink, Cookie, Mail, BookOpen, Dumbbell, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { resetCookieConsent } from '@/components/shared/CookieConsent';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/shared/TopBar';
import { AboutPage } from './AboutPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsOfUsePage } from './TermsOfUsePage';
import { useStore } from '@/store';
import { TRAINING_GOALS, TRAINING_GOAL_LABELS } from '@/types';
import type { TrainingGoal } from '@/types';

export function SettingsPage() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
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
    <div className="flex flex-col gap-4 pb-20">
      <TopBar>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </TopBar>

      <div className="flex flex-col gap-4 px-4">

      {/* Help */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Help
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
          <a
            href={`${import.meta.env.BASE_URL}guide/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            <BookOpen size={14} />
            User Guide
            <ExternalLink size={12} className="ml-auto opacity-50" />
          </a>
          <a
            href={`${import.meta.env.BASE_URL}programming/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            <Dumbbell size={14} />
            Workout Programming
            <ExternalLink size={12} className="ml-auto opacity-50" />
          </a>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Appearance
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {resolvedTheme === 'dark' ? (
                <Moon size={14} className="text-text-secondary" />
              ) : (
                <Sun size={14} className="text-text-secondary" />
              )}
              <div className="text-sm text-text-primary">Dark mode</div>
            </div>
            <button
              role="switch"
              aria-checked={resolvedTheme === 'dark'}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-root ${
                resolvedTheme === 'dark' ? 'bg-accent-primary' : 'bg-bg-interactive'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  resolvedTheme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

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

      {/* Export */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Export
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-text-primary">Include tips</div>
              <div className="text-[11px] text-text-tertiary">
                Adds form cues below each exercise
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.exportIncludeTips}
              onClick={() => updateSettings({ exportIncludeTips: !settings.exportIncludeTips })}
              className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-root ${
                settings.exportIncludeTips ? 'bg-accent-primary' : 'bg-bg-interactive'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  settings.exportIncludeTips ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
          {!confirmDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Delete all data
            </Button>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
              <p className="text-xs text-destructive">
                This will delete all your workouts and history. Are you sure?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 text-text-secondary"
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { clearAll(); setConfirmDelete(false); }}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* About */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          About
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAboutOpen(true)}
            className="w-full justify-start text-text-secondary"
          >
            <Info size={14} className="mr-2" />
            About CurlBro
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start text-text-secondary"
          >
            <a href="https://simonelongo.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} className="mr-2" />
              simonelongo.com
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start text-text-secondary"
          >
            <a href="https://simonelongo.com/contact" target="_blank" rel="noopener noreferrer">
              <Mail size={14} className="mr-2" />
              Contact
            </a>
          </Button>
        </div>
      </div>

      {/* Legal */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Legal
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPrivacyOpen(true)}
            className="w-full justify-start text-text-secondary"
          >
            <Shield size={14} className="mr-2" />
            Privacy Policy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTermsOpen(true)}
            className="w-full justify-start text-text-secondary"
          >
            <FileText size={14} className="mr-2" />
            Terms of Use
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetCookieConsent}
            className="w-full justify-start text-text-secondary"
          >
            <Cookie size={14} className="mr-2" />
            Manage Cookies
          </Button>
        </div>
      </div>
      </div>

      <AboutPage open={aboutOpen} onOpenChange={setAboutOpen} />
      <PrivacyPolicyPage open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <TermsOfUsePage open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}
