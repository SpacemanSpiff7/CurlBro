import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  ArrowLeftRight,
  ClipboardCheck,
  Timer,
  Layers,
  RefreshCw,
  StickyNote,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollProgressBar } from '@/components/guide/ScrollProgressBar';
import { GuideSection } from '@/components/guide/GuideSection';
import { GuideTip } from '@/components/guide/GuideTip';
import { MockDotIndicators } from '@/components/guide/illustrations/MockDotIndicators';
import { MockSetRows } from '@/components/guide/illustrations/MockSetRows';
import { MockRestTimerRing } from '@/components/guide/illustrations/MockRestTimerRing';


interface RecordGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ---------- Inline illustration: Start Overlay ---------- */
function MockStartOverlay() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-bold text-text-primary">Push Day</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs text-text-secondary">
            5 exercises
          </span>
          <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs text-text-secondary">
            2 supersets
          </span>
        </div>
        <motion.button
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-accent-primary px-5 py-2 text-xs font-semibold text-bg-root"
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Play className="h-3.5 w-3.5" />
          Let's Go
        </motion.button>
      </div>
    </div>
  );
}

/* ---------- Inline illustration: Superset stack ---------- */
function MockSupersetStack() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-primary">
          Superset
        </span>
        <div className="space-y-1">
          <div className="flex items-center rounded-lg border-l-2 border-accent-primary bg-bg-elevated px-3 py-2">
            <span className="text-sm text-text-primary">Bench Press</span>
          </div>
          <div className="flex items-center rounded-lg border-l-2 border-accent-primary bg-bg-elevated px-3 py-2">
            <span className="text-sm text-text-primary">Cable Fly</span>
          </div>
        </div>
        <p className="text-center text-[10px] text-text-tertiary">Round 1 of 3</p>
      </div>
    </div>
  );
}

/* ---------- Inline illustration: Swap actions ---------- */
function MockSwapActions() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="relative h-14 rounded-lg overflow-hidden">
        {/* Action buttons behind */}
        <div className="absolute inset-y-0 right-0 flex">
          <div className="flex w-[60px] flex-col items-center justify-center bg-cyan-500 text-white">
            <Info className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Info</span>
          </div>
          <div className="flex w-[60px] flex-col items-center justify-center bg-accent-primary text-white">
            <RefreshCw className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Swap</span>
          </div>
        </div>

        {/* Sliding card */}
        <motion.div
          className="absolute inset-0 flex items-center rounded-lg bg-bg-elevated px-3"
          animate={{ x: [0, -120, -120, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 1,
            times: [0, 0.25, 0.65, 0.9],
            ease: 'easeInOut',
          }}
        >
          <p className="text-sm font-medium text-text-primary">Lat Pulldown</p>
          <p className="ml-auto text-xs text-text-tertiary">3 x 12</p>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Inline illustration: Session top bar ---------- */
function MockSessionTopBar() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2.5">
        <p className="text-sm font-semibold text-text-primary">Push Day</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
            8/15 sets
          </span>
          <span className="tabular-nums text-xs text-text-tertiary">23:45</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inline illustration: Finish summary ---------- */
function MockFinishSummary() {
  const cards = [
    { label: 'Date', value: 'Mar 9' },
    { label: 'Duration', value: '47:32' },
    { label: 'Exercises', value: '6' },
    { label: 'Total Weight', value: '8,420 lb' },
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 overflow-hidden">
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center rounded-lg bg-bg-elevated px-3 py-2.5"
          >
            <span className="text-[10px] text-text-tertiary">{c.label}</span>
            <span className="text-sm font-semibold text-text-primary">{c.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <span className="rounded-lg bg-accent-primary/15 px-3 py-1 text-xs font-medium text-accent-primary">
          View Log
        </span>
      </div>
    </div>
  );
}

/* ========================================================= */

export function RecordGuide({ open, onOpenChange }: RecordGuideProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95dvh] bg-bg-surface overflow-hidden">
        <ScrollProgressBar scrollRef={scrollRef} />
        <SheetHeader>
          <SheetTitle className="text-text-primary">Record a Workout</SheetTitle>
          <SheetDescription className="sr-only">
            Guide to recording workouts in CurlBro
          </SheetDescription>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="overflow-y-auto h-full px-4 pb-[env(safe-area-inset-bottom)] pt-2 space-y-8"
        >
          {/* 1. Start Your Session */}
          <GuideSection step={1} icon={Play} title="Start Your Session">
            <p className="text-sm text-text-secondary leading-relaxed">
              From the Library, tap Play on any workout. A preview overlay shows
              exercise and group counts. Tap "Let's Go" to begin — the elapsed
              timer starts immediately.
            </p>
            <MockStartOverlay />
          </GuideSection>

          {/* 2. Navigate Between Exercises */}
          <GuideSection step={2} icon={ArrowLeftRight} title="Navigate Between Exercises">
            <p className="text-sm text-text-secondary leading-relaxed">
              Swipe left/right or use the arrows to move between exercises. Dot
              indicators show your progress — green for done, amber for
              in-progress, gray for upcoming.
            </p>
            <MockDotIndicators />
          </GuideSection>

          {/* 3. Log Your Sets */}
          <GuideSection step={3} icon={ClipboardCheck} title="Log Your Sets">
            <p className="text-sm text-text-secondary leading-relaxed">
              Enter weight and reps for each set. Tap the checkmark to
              complete — it turns green. Swipe left on a set to delete it. Tap
              "+ Add Set" for extra volume.
            </p>
            <MockSetRows />
          </GuideSection>

          {/* 4. Rest Timer */}
          <GuideSection step={4} icon={Timer} title="Rest Timer">
            <p className="text-sm text-text-secondary leading-relaxed">
              Tap the progress ring to start your rest countdown. +15/−15
              buttons adjust time on the fly. Audio beep + haptic buzz when it
              hits zero. The ring pulses in the final 10 seconds.
            </p>
            <MockRestTimerRing />
            <GuideTip>
              Toggle the wake lock (phone icon) to keep your screen on during
              rest.
            </GuideTip>
          </GuideSection>

          {/* 5. Supersets & Circuits */}
          <GuideSection step={5} icon={Layers} title="Supersets & Circuits">
            <p className="text-sm text-text-secondary leading-relaxed">
              Grouped exercises appear stacked together. Complete one round
              across all exercises before the next. Wider dot indicators
              represent groups.
            </p>
            <MockSupersetStack />
          </GuideSection>

          {/* 6. Swap Mid-Session */}
          <GuideSection step={6} icon={RefreshCw} title="Swap Mid-Session">
            <p className="text-sm text-text-secondary leading-relaxed">
              Equipment taken? Swipe an exercise name left — Swap shows
              graph-based substitutes targeting the same muscles. Or search all
              300+ exercises.
            </p>
            <MockSwapActions />
          </GuideSection>

          {/* 7. Session Notes & Tools */}
          <GuideSection step={7} icon={StickyNote} title="Session Notes & Tools">
            <p className="text-sm text-text-secondary leading-relaxed">
              Tap the notes icon to capture session observations. The elapsed
              timer and completed set count run in the top bar. Add mid-session
              exercises with the + button on the dot indicators.
            </p>
            <MockSessionTopBar />
          </GuideSection>

          {/* 8. Finish & Save */}
          <GuideSection step={8} icon={CheckCircle2} title="Finish & Save">
            <p className="text-sm text-text-secondary leading-relaxed">
              Tap Finish to end your session. Save records your workout log —
              date, duration, exercise count, and total weight lifted. View your
              history anytime in the Log tab.
            </p>
            <MockFinishSummary />
          </GuideSection>

          {/* Bottom spacer for safe scrolling */}
          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
