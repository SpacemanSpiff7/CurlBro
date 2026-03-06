import { memo } from 'react';
import { Lightbulb, Moon, Flame, Apple, Dumbbell, ExternalLink } from 'lucide-react';
import type { HouseAd as HouseAdType } from '../../data/houseAds';
import type { HouseAdCategory } from '../../config/ads';

const CATEGORY_ICON: Record<HouseAdCategory, typeof Lightbulb> = {
  form_tip: Lightbulb,
  recovery: Moon,
  challenge: Flame,
  nutrition: Apple,
  general: Dumbbell,
};

const CATEGORY_COLORS: Record<HouseAdCategory, { icon: string; bg: string; tag: string }> = {
  form_tip: { icon: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10 dark:bg-cyan-500/8', tag: 'text-cyan-600/70 dark:text-cyan-400/70' },
  recovery: { icon: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-500/8', tag: 'text-green-600/70 dark:text-green-400/70' },
  challenge: { icon: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/8', tag: 'text-amber-600/70 dark:text-amber-400/70' },
  nutrition: { icon: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 dark:bg-violet-500/8', tag: 'text-violet-600/70 dark:text-violet-400/70' },
  general: { icon: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-500/10 dark:bg-zinc-500/8', tag: 'text-zinc-500/70 dark:text-zinc-400/70' },
};

const CATEGORY_TAG: Record<HouseAdCategory, string> = {
  form_tip: 'Tip',
  recovery: 'Recovery',
  challenge: 'Challenge',
  nutrition: 'Nutrition',
  general: 'Tip',
};

interface HouseAdProps {
  ad: HouseAdType;
}

export const HouseAdComponent = memo(function HouseAdComponent({ ad }: HouseAdProps) {
  const Icon = CATEGORY_ICON[ad.category];
  const colors = CATEGORY_COLORS[ad.category];
  const tag = CATEGORY_TAG[ad.category];

  const content = (
    <div
      className={`rounded-xl ${colors.bg} border border-black/[0.06] dark:border-white/[0.04] p-3.5`}
      role="complementary"
      aria-label="Tip"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>
          <Icon size={16} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
              {ad.headline}
            </p>
            <span className={`text-[9px] font-medium uppercase tracking-[0.1em] ${colors.tag} flex-shrink-0`}>
              {tag}
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{ad.body}</p>
          {ad.cta && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${colors.icon} mt-2`}>
              {ad.cta}
              <ExternalLink className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (ad.href) {
    return (
      <a href={ad.href} target="_blank" rel="noopener noreferrer" className="block no-underline">
        {content}
      </a>
    );
  }

  return content;
});
