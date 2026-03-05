import { memo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { HouseAd as HouseAdType } from '../../data/houseAds';

interface HouseAdProps {
  ad: HouseAdType;
}

export const HouseAdComponent = memo(function HouseAdComponent({ ad }: HouseAdProps) {
  const content = (
    <div
      className={`rounded-lg bg-zinc-900/50 border border-zinc-700/50 p-3 border-l-4 ${ad.accentColor}`}
      role="complementary"
      aria-label="Sponsored content"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">
        {ad.label}
      </p>
      <p className="font-mono text-sm text-zinc-200">{ad.headline}</p>
      <p className="font-sans text-xs text-zinc-400 mt-1">{ad.body}</p>
      {ad.cta && (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-accent-primary mt-2">
          {ad.cta}
          <ExternalLink className="w-3 h-3" />
        </span>
      )}
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
