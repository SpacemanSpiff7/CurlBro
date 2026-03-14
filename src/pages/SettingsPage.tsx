import { lazy, Suspense, useState, useEffect } from 'react';
import { RotateCcw, Trash2, Info, Shield, FileText, ExternalLink, Cookie, Mail, BookOpen, Dumbbell, Sun, Moon, Bug, HelpCircle, Zap, Hammer, Timer, ChevronDown, Weight, Ruler, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { resetCookieConsent } from '@/utils/cookieConsent';
import { resetWelcomeSeen } from '@/utils/welcomeState';
import { Button } from '@/components/ui/button';
import { JoinListSheet } from '@/components/shared/JoinListSheet';
import { PageLayout } from '@/components/shared/PageLayout';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useStore } from '@/store';

const AboutPage = lazy(() => import('./AboutPage').then(m => ({ default: m.AboutPage })));
const PrivacyPolicyPage = lazy(() => import('./PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfUsePage = lazy(() => import('./TermsOfUsePage').then(m => ({ default: m.TermsOfUsePage })));
const BuildGuide = lazy(() => import('./BuildGuide').then(m => ({ default: m.BuildGuide })));
const RecordGuide = lazy(() => import('./RecordGuide').then(m => ({ default: m.RecordGuide })));

function NumberSetting({ value, min, fallback, onChange }: {
  value: number; min: number; fallback: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  // Sync from store when value changes externally (e.g. reset)
  useEffect(() => { setLocal(String(value)); }, [value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      className="w-16 h-10 rounded bg-bg-elevated border border-border-subtle px-2 text-base md:text-sm text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
      min={min}
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        const n = parseInt(e.target.value);
        if (!isNaN(n) && n >= min) onChange(n);
      }}
      onBlur={() => {
        const n = parseInt(local);
        if (isNaN(n) || n < min) {
          onChange(fallback);
          setLocal(String(fallback));
        } else {
          setLocal(String(n));
        }
      }}
    />
  );
}

function NullableNumberSetting({ value, min, onChange }: {
  value: number | null; min: number;
  onChange: (v: number | null) => void;
}) {
  const [local, setLocal] = useState(value != null ? String(value) : '');
  // Sync from store when value changes externally (e.g. reset)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocal(value != null ? String(value) : ''); }, [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      className="w-16 h-10 rounded bg-bg-elevated border border-border-subtle px-2 text-base md:text-sm text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
      min={min}
      value={local}
      placeholder="--"
      onChange={(e) => {
        setLocal(e.target.value);
        if (e.target.value === '') {
          onChange(null);
        } else {
          const n = parseFloat(e.target.value);
          if (!isNaN(n) && n >= min) onChange(n);
        }
      }}
      onBlur={() => {
        if (local === '') {
          onChange(null);
        } else {
          const n = parseFloat(local);
          if (isNaN(n) || n < min) {
            onChange(null);
            setLocal('');
          } else {
            setLocal(String(n));
          }
        }
      }}
    />
  );
}

export function SettingsPage() {
  const [joinListOpen, setJoinListOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRepHint, setShowRepHint] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [buildGuideOpen, setBuildGuideOpen] = useState(false);
  const [recordGuideOpen, setRecordGuideOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const settings = useStore((state) => state.settings);
  const { updateSettings, resetSettings } = useStore((state) => state.settingsActions);
  const { clearAll } = useStore((state) => state.libraryActions);

  return (
    <PageLayout
      header={<h1 className="text-xl font-bold text-text-primary">Settings</h1>}
      contentClassName="flex flex-col gap-4 px-4"
    >

      {/* Join list */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Join Our List
        </h2>
        <button
          onClick={() => setJoinListOpen(true)}
          className="flex w-full items-start gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 text-left transition-colors hover:bg-bg-elevated"
          style={{ minHeight: '44px' }}
          aria-label="Join our list"
        >
          <Mail size={18} className="mt-0.5 shrink-0 text-accent-primary" />
          <div className="space-y-1">
            <div className="text-sm font-medium text-text-primary">Join Our List</div>
            <div className="text-xs leading-relaxed text-text-secondary">
              Get launch updates and leave extra details about how you train.
            </div>
          </div>
        </button>
      </div>

      {/* Help */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Help
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
          <button
            onClick={resetWelcomeSeen}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
            style={{ minHeight: '44px' }}
            aria-label="Show welcome page"
          >
            <Sparkles size={14} className="text-accent-primary" />
            Show Welcome Page
          </button>
          <button
            onClick={() => setQuickStartOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
            style={{ minHeight: '44px' }}
            aria-expanded={quickStartOpen}
            aria-label="Toggle quick start guides"
          >
            <Zap size={14} className="text-accent-primary" />
            Quick Start
            <ChevronDown
              size={14}
              className={`ml-auto text-text-tertiary transition-transform ${quickStartOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {quickStartOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 pl-4">
                  <button
                    onClick={() => setBuildGuideOpen(true)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <Hammer size={14} className="text-accent-primary" />
                    Build a Workout
                  </button>
                  <button
                    onClick={() => setRecordGuideOpen(true)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <Timer size={14} className="text-accent-primary" />
                    Record a Workout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Units */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Units
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Weight size={14} className="text-text-secondary" />
              <div className="text-sm text-text-primary">Weight</div>
            </div>
            <div className="flex rounded-lg border border-border-subtle overflow-hidden">
              {(['lb', 'kg'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => updateSettings({ weightUnit: unit })}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    settings.weightUnit === unit
                      ? 'bg-accent-primary text-bg-root'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                  }`}
                  style={{ minHeight: '36px' }}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler size={14} className="text-text-secondary" />
              <div className="text-sm text-text-primary">Distance</div>
            </div>
            <div className="flex rounded-lg border border-border-subtle overflow-hidden">
              {(['mi', 'km'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => updateSettings({ distanceUnit: unit })}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    settings.distanceUnit === unit
                      ? 'bg-accent-primary text-bg-root'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                  }`}
                  style={{ minHeight: '36px' }}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell size={14} className="text-text-secondary" />
              <div className="text-sm text-text-primary">Body Weight</div>
            </div>
            <div className="flex items-center gap-1">
              <NullableNumberSetting
                value={settings.bodyWeight}
                min={1}
                onChange={(v) => updateSettings({ bodyWeight: v })}
              />
              <span className="text-xs text-text-tertiary">{settings.weightUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Default Reps */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
            Default Reps
          </h2>
          <button
            onClick={() => setShowRepHint((v) => !v)}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label="Rep range guidance"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        {showRepHint && (
          <p className="text-xs text-text-tertiary">
            Strength: 1–5 reps · Hypertrophy: 6–12 reps · Endurance: 12–20+ reps
          </p>
        )}
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">
              Compound exercises
            </label>
            <div className="flex items-center gap-1">
              <NumberSetting
                value={settings.defaultRepsCompound}
                min={1}
                fallback={8}
                onChange={(v) => updateSettings({ defaultRepsCompound: v })}
              />
              <span className="text-xs text-text-tertiary">reps</span>
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">
              Isolation exercises
            </label>
            <div className="flex items-center gap-1">
              <NumberSetting
                value={settings.defaultRepsIsolation}
                min={1}
                fallback={12}
                onChange={(v) => updateSettings({ defaultRepsIsolation: v })}
              />
              <span className="text-xs text-text-tertiary">reps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Default Sets */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Default Sets
        </h2>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">
              Compound exercises
            </label>
            <div className="flex items-center gap-1">
              <NumberSetting
                value={settings.defaultSetsCompound}
                min={1}
                fallback={4}
                onChange={(v) => updateSettings({ defaultSetsCompound: v })}
              />
              <span className="text-xs text-text-tertiary">sets</span>
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">
              Isolation exercises
            </label>
            <div className="flex items-center gap-1">
              <NumberSetting
                value={settings.defaultSetsIsolation}
                min={1}
                fallback={3}
                onChange={(v) => updateSettings({ defaultSetsIsolation: v })}
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
            <label className="text-sm text-text-primary">
              Compound exercises
            </label>
            <div className="flex items-center gap-1">
              <NumberSetting
                value={settings.restTimerCompoundSeconds}
                min={0}
                fallback={120}
                onChange={(v) => updateSettings({ restTimerCompoundSeconds: v })}
              />
              <span className="text-xs text-text-tertiary">sec</span>
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <label className="text-sm text-text-primary">
              Isolation exercises
            </label>
            <div className="flex items-center gap-1">
              <NumberSetting
                value={settings.restTimerIsolationSeconds}
                min={0}
                fallback={60}
                onChange={(v) => updateSettings({ restTimerIsolationSeconds: v })}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <Trash2 size={14} className="mr-2" />
            Delete all data
          </Button>
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title="Delete All Data?"
            description="This will delete all your workouts and history. This action cannot be undone."
            confirmLabel="Delete"
            destructive
            onConfirm={clearAll}
          />
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
            <a href="mailto:contact@curlbro.com">
              <Mail size={14} className="mr-2" />
              Contact
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start text-text-secondary"
          >
            <a
              href={`https://github.com/SpacemanSpiff7/CurlBro/issues/new?title=Bug%3A+&body=${encodeURIComponent(`**Describe the bug**\n\n\n**Steps to reproduce**\n1. \n2. \n3. \n\n**Expected behavior**\n\n\n---\n**Device info** (auto-filled)\n- Browser: ${navigator.userAgent}\n- Platform: ${navigator.platform}\n- Screen: ${window.screen.width}x${window.screen.height}\n- Viewport: ${window.innerWidth}x${window.innerHeight}\n- Touch: ${navigator.maxTouchPoints > 0 ? 'yes' : 'no'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Bug size={14} className="mr-2" />
              Report a Bug
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
      <Suspense fallback={null}>
        <JoinListSheet open={joinListOpen} onOpenChange={setJoinListOpen} source="settings" />
        <AboutPage open={aboutOpen} onOpenChange={setAboutOpen} />
        <PrivacyPolicyPage open={privacyOpen} onOpenChange={setPrivacyOpen} />
        <TermsOfUsePage open={termsOpen} onOpenChange={setTermsOpen} />
        <BuildGuide open={buildGuideOpen} onOpenChange={setBuildGuideOpen} />
        <RecordGuide open={recordGuideOpen} onOpenChange={setRecordGuideOpen} />
      </Suspense>
    </PageLayout>
  );
}
