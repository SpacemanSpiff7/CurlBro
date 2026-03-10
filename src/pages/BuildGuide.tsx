import { useRef } from 'react';
import {
  Type,
  Search,
  SlidersHorizontal,
  GripVertical,
  ArrowLeftRight,
  Brain,
  Share2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { GuideSection } from '@/components/guide/GuideSection';
import { ScrollProgressBar } from '@/components/guide/ScrollProgressBar';
import { GuideTip } from '@/components/guide/GuideTip';
import { MockFilterChips } from '@/components/guide/illustrations/MockFilterChips';
import { MockExerciseCard } from '@/components/guide/illustrations/MockExerciseCard';
import { MockDropZones } from '@/components/guide/illustrations/MockDropZones';
import { MockSwipeReveal } from '@/components/guide/illustrations/MockSwipeReveal';
import { MockStatusBar } from '@/components/guide/illustrations/MockStatusBar';

interface BuildGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATE_BADGES = ['Easy Machine', 'Intermediate', 'Advanced', 'Specialty'] as const;

export function BuildGuide({ open, onOpenChange }: BuildGuideProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95dvh] bg-bg-surface overflow-hidden">
        <ScrollProgressBar scrollRef={scrollRef} />
        <SheetHeader>
          <SheetTitle className="text-text-primary">Build a Workout</SheetTitle>
          <SheetDescription className="sr-only">
            Guide to building workouts in CurlBro
          </SheetDescription>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="overflow-y-auto h-full px-4 pb-[env(safe-area-inset-bottom)] pt-2 space-y-8"
        >
          {/* 1. Name Your Workout */}
          <GuideSection step={1} icon={Type} title="Name Your Workout">
            <p className="text-sm text-text-secondary leading-relaxed">
              Name your workout or leave it blank &mdash; CurlBro auto-generates one from
              your exercises. Pick a template to start fast.
            </p>
            <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 space-y-3">
              <div className="h-10 rounded-lg border border-border-subtle bg-bg-elevated px-3 flex items-center">
                <span className="text-sm text-text-tertiary">Workout name...</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_BADGES.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent-primary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </GuideSection>

          {/* 2. Find the Right Exercises */}
          <GuideSection step={2} icon={Search} title="Find the Right Exercises">
            <p className="text-sm text-text-secondary leading-relaxed">
              Tap &ldquo;+ Add Exercise&rdquo; to search 300+ exercises by name. Filter by
              muscle group, equipment, and type. Mark sore muscles and CurlBro
              automatically hides exercises that target sore or fatigued muscles
              and highlights recovery options.
            </p>
            <MockFilterChips />
          </GuideSection>

          {/* 3. Configure Sets, Reps & More */}
          <GuideSection step={3} icon={SlidersHorizontal} title="Configure Sets, Reps & More">
            <p className="text-sm text-text-secondary leading-relaxed">
              Each card shows sets &times; reps &times; weight. Tap the chevron to expand for
              rest time and form notes. Tracking adapts per exercise &mdash; strength
              exercises track weight and reps, cardio tracks duration and distance.
              Defaults come from Settings.
            </p>
            <MockExerciseCard />
          </GuideSection>

          {/* 4. Drag to Reorder & Create Supersets */}
          <GuideSection step={4} icon={GripVertical} title="Drag to Reorder & Create Supersets">
            <p className="text-sm text-text-secondary leading-relaxed">
              Hold the grip handle to drag. The list stays stable while you drag so targets do
              not slide underneath your finger: top rail moves before, center highlight adds to
              a superset, and bottom rail moves after. Grouping works for tri-sets and circuits
              too (up to 5 total exercises).
            </p>
            <MockDropZones />
          </GuideSection>

          {/* 5. Swipe for Quick Actions */}
          <GuideSection step={5} icon={ArrowLeftRight} title="Swipe for Quick Actions">
            <p className="text-sm text-text-secondary leading-relaxed">
              Swipe any exercise left to reveal Swap, Super, and Delete. Each shows smart
              suggestions before falling back to full search.
            </p>
            <MockSwipeReveal />
            <GuideTip>
              Swap suggests exercises targeting the same muscles at similar difficulty.
            </GuideTip>
          </GuideSection>

          {/* 6. Smart Suggestions & Validation */}
          <GuideSection step={6} icon={Brain} title="Smart Suggestions & Validation">
            <p className="text-sm text-text-secondary leading-relaxed">
              CurlBro tracks your push/pull balance, flags exercise conflicts,
              and suggests exercises that pair well. Select a workout split to see
              which muscles you&apos;re missing. Use Edit mode to select multiple
              exercises for bulk grouping or deletion.
            </p>
            <MockStatusBar />
          </GuideSection>

          {/* 7. Save & Share */}
          <GuideSection step={7} icon={Share2} title="Save & Share">
            <p className="text-sm text-text-secondary leading-relaxed">
              Tap Save to store your workout. Export as text to share with friends. Import
              workouts from text &mdash; CurlBro fuzzy-matches exercise names and reconstructs
              supersets.
            </p>
            <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex gap-3">
                <div className="flex-1 flex items-center justify-center rounded-lg bg-accent-primary py-2.5">
                  <span className="text-sm font-medium text-white">Save</span>
                </div>
                <div className="flex-1 flex items-center justify-center rounded-lg border border-border-subtle py-2.5">
                  <span className="text-sm font-medium text-text-primary">Share</span>
                </div>
              </div>
            </div>
          </GuideSection>

          {/* Bottom spacer for safe scrolling */}
          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
