import type { AdSlotKey } from '../../config/ads';
import { AD_PUBLISHER_ID, ADSENSE_ENABLED } from '../../config/ads';
import { useAdSlot } from '../../hooks/useAdSlot';
import { useHouseAd } from '../../hooks/useHouseAd';
import { HouseAdComponent } from './HouseAd';

interface AdSlotProps {
  slotKey: AdSlotKey;
  className?: string;
}

export function AdSlot({ slotKey, className = '' }: AdSlotProps) {
  const { adsenseActive, showHouseAd, insRef, config } = useAdSlot(slotKey);
  const { ad } = useHouseAd(
    config.houseAdCategories,
    config.rotateHouseAds,
    config.rotateIntervalMs,
  );

  return (
    <div className={className}>
      {ADSENSE_ENABLED && (
        <div style={{ display: adsenseActive ? 'block' : 'none' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">
            Sponsored
          </p>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-600/50 p-1">
            <ins
              ref={insRef}
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={AD_PUBLISHER_ID}
              data-ad-slot={config.slotId}
              data-ad-format={config.format}
              data-full-width-responsive="true"
            />
          </div>
        </div>
      )}
      {showHouseAd && <HouseAdComponent ad={ad} />}
    </div>
  );
}
