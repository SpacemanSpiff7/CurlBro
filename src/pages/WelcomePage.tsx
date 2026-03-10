import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Brain,
  Play,
  Layers,
  Shield,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { MockFilterChips } from '@/components/guide/illustrations/MockFilterChips';
import { MockRestTimerRing } from '@/components/guide/illustrations/MockRestTimerRing';
import { BuildGuide } from './BuildGuide';
import { RecordGuide } from './RecordGuide';
import { markWelcomeSeen } from '@/utils/welcomeState';

interface WelcomePageProps {
  onDismiss: () => void;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

/* ── Explosion particles ─────────────────────────────── */

const PARTICLE_COUNT = 16;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 60 + Math.random() * 70;
  const size = 3 + Math.random() * 7;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size,
    delay: Math.random() * 0.06,
  };
});

function ExplosionParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.1 }}
          transition={{ duration: 0.5, delay: p.delay, ease: 'easeOut' }}
          className="absolute rounded-full bg-accent-primary"
          style={{ width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}

/* ── Logo fly-to-topbar animation ────────────────────── */

function FlyingLogo({ from }: { from: DOMRect }) {
  // TopBar logo: h-9 w-9 (36px), inside px-4 pt-4 → top-left at (16,16)
  const targetLeft = 16; // px-4
  const targetTop = 16; // pt-4

  return (
    <motion.img
      src={`${import.meta.env.BASE_URL}logo.png`}
      alt=""
      initial={{
        position: 'fixed',
        left: from.left,
        top: from.top,
        width: from.width,
        height: from.height,
        opacity: 1,
        zIndex: 70,
      }}
      animate={{
        left: targetLeft,
        top: targetTop,
        width: 36,
        height: 36,
        opacity: [1, 1, 1, 0],
        borderRadius: 8,
      }}
      transition={{
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: 0.7, times: [0, 0.7, 0.92, 1] },
      }}
      className="pointer-events-none object-contain"
    />
  );
}

/* ── Main component ──────────────────────────────────── */

export function WelcomePage({ onDismiss }: WelcomePageProps) {
  const [buildGuideOpen, setBuildGuideOpen] = useState(false);
  const [recordGuideOpen, setRecordGuideOpen] = useState(false);
  const [exploding, setExploding] = useState(false);
  const [guideUnlocked, setGuideUnlocked] = useState(false);
  const [flyFrom, setFlyFrom] = useState<DOMRect | null>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  const handleDismiss = useCallback(() => {
    // Capture logo position before animating
    if (logoRef.current) {
      const rect = logoRef.current.getBoundingClientRect();
      // Only fly if logo is reasonably visible in the viewport
      if (rect.top > -rect.height && rect.bottom < window.innerHeight + rect.height) {
        setFlyFrom(rect);
      }
    }
    setExploding(true);
    // Dismiss at 400ms so the 0.3s exit finishes at ~700ms,
    // matching the flying logo's 0.7s arrival
    setTimeout(() => {
      markWelcomeSeen();
      onDismiss();
    }, 400);
  }, [onDismiss]);

  const scrollToGuide = useCallback(() => {
    setGuideUnlocked(true);
    // Wait for overflow to update before scrolling
    requestAnimationFrame(() => {
      guideRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-60 flex flex-col bg-bg-root"
    >
      <div
        ref={scrollRef}
        className={`flex-1 ${guideUnlocked ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {/* ── Hero ── fills the viewport, centered ── */}
        <div className="flex min-h-dvh flex-col items-center justify-center px-5">
          {/* Logo */}
          <motion.img
            ref={logoRef}
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="CurlBro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              exploding && flyFrom
                ? { opacity: 0, scale: 0.95 }
                : { opacity: 1, scale: 1 }
            }
            transition={
              exploding
                ? { duration: 0.1 }
                : { type: 'spring', stiffness: 300, damping: 25 }
            }
            className="h-28 w-auto"
          />

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary"
          >
            CurlBro
          </motion.h1>

          {/* Start Building button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="relative mt-8"
          >
            <motion.button
              onClick={handleDismiss}
              disabled={exploding}
              whileHover={{ y: -2 }}
              whileTap={{ y: 3, scale: 0.97 }}
              animate={
                exploding
                  ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] }
                  : undefined
              }
              transition={
                exploding
                  ? { duration: 0.4, ease: 'easeOut' }
                  : { type: 'spring', stiffness: 400, damping: 18 }
              }
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-bg-card px-10 py-5 shadow-[0_6px_24px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.06)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.1)] active:shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)]"
              aria-label="Start Building"
            >
              <Dumbbell size={40} className="rotate-45 text-accent-primary" />
              <span className="text-base font-semibold text-accent-primary">
                Start Building
              </span>
            </motion.button>
            <ExplosionParticles active={exploding} />
          </motion.div>

          {/* Guide scroll hint */}
          <motion.button
            onClick={scrollToGuide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 flex flex-col items-center gap-1 text-text-tertiary transition-colors hover:text-text-secondary"
            style={{ minHeight: '44px' }}
          >
            <span className="text-xs font-medium uppercase tracking-widest">
              Guide
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown size={18} />
            </motion.div>
          </motion.button>
        </div>

        {/* ── Guide sections ── below the fold ── */}
        <div
          ref={guideRef}
          className="mx-auto max-w-lg space-y-8 px-5 pb-[env(safe-area-inset-bottom)] pt-12"
        >
          <Section
            icon={<Dumbbell size={20} className="shrink-0 text-accent-primary" />}
            title="Build Your Workout"
          >
            <p className="text-sm text-text-secondary leading-relaxed">
              Search 300+ exercises by name, muscle, or equipment.
              Drag to reorder. Swipe to swap or delete.
            </p>
            <div className="overflow-hidden rounded-xl">
              <MockFilterChips />
            </div>
            <button
              onClick={() => setBuildGuideOpen(true)}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-primary hover:text-accent-hover transition-colors"
              style={{ minHeight: '44px' }}
            >
              Quick Start: Build a Workout &rarr;
            </button>
          </Section>

          <Section
            icon={<Brain size={20} className="shrink-0 text-accent-primary" />}
            title="Train Smarter"
          >
            <p className="text-sm text-text-secondary leading-relaxed">
              Conflict detection flags risky exercise pairings.
              Gap analysis shows muscles you haven&apos;t covered yet.
              Push/pull balance and superset suggestions.
            </p>
          </Section>

          <Section
            icon={<Play size={20} className="shrink-0 text-accent-primary" />}
            title="Record Your Sessions"
          >
            <p className="text-sm text-text-secondary leading-relaxed">
              Track sets, weight, and reps as you go.
              Built-in rest timer with audio and haptic alerts.
            </p>
            <div className="overflow-hidden rounded-xl">
              <MockRestTimerRing />
            </div>
            <button
              onClick={() => setRecordGuideOpen(true)}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-primary hover:text-accent-hover transition-colors"
              style={{ minHeight: '44px' }}
            >
              Quick Start: Record a Workout &rarr;
            </button>
          </Section>

          <Section
            icon={<Layers size={20} className="shrink-0 text-accent-primary" />}
            title="Start with a Template"
          >
            <p className="text-sm text-text-secondary leading-relaxed">
              Pre-built workouts across beginner, intermediate, advanced, and specialty tiers.
              From machine-only routines to barbell programs.
            </p>
          </Section>

          <Section
            icon={<Shield size={20} className="shrink-0 text-accent-primary" />}
            title="Your Data Stays Here"
          >
            <p className="text-sm text-text-secondary leading-relaxed">
              No account needed. Everything stays in your browser.
              Export and import workouts and logs anytime.
            </p>
          </Section>

          {/* Bottom CTA + footer links */}
          <div className="space-y-4 pb-8 pt-4">
            <button
              onClick={handleDismiss}
              disabled={exploding}
              className="w-full rounded-xl bg-accent-primary py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
              style={{ minHeight: '56px' }}
            >
              Start Building
            </button>
            <div className="flex items-center justify-center gap-4 text-sm text-text-tertiary">
              <a
                href={`${import.meta.env.BASE_URL}guide/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 py-3 hover:text-text-secondary transition-colors"
                style={{ minHeight: '44px' }}
              >
                User Guide
                <ExternalLink size={12} />
              </a>
              <span className="text-border-subtle">|</span>
              <a
                href={`${import.meta.env.BASE_URL}programming/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 py-3 hover:text-text-secondary transition-colors"
                style={{ minHeight: '44px' }}
              >
                Programming Guide
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <BuildGuide open={buildGuideOpen} onOpenChange={setBuildGuideOpen} />
      <RecordGuide open={recordGuideOpen} onOpenChange={setRecordGuideOpen} />

      {/* Flying logo — portaled to body so it survives the welcome exit animation */}
      {createPortal(
        <AnimatePresence>
          {flyFrom && <FlyingLogo from={flyFrom} />}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
