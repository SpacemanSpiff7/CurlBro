import { useRef, useState, useEffect } from 'react';
import { AD_SLOTS, ADSENSE_ENABLED, type AdSlotKey } from '../config/ads';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function useAdSlot(slotKey: AdSlotKey) {
  const config = AD_SLOTS[slotKey];
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);
  const [adsenseActive, setAdsenseActive] = useState(false);
  // When ADSENSE_ENABLED is false (compile-time constant), show house ads immediately
  const [showHouseAd, setShowHouseAd] = useState(!ADSENSE_ENABLED);

  useEffect(() => {
    if (!ADSENSE_ENABLED) return;

    // Defer ad blocker detection and AdSense push to a microtask
    // so we don't call setState synchronously in the effect body
    const raf = requestAnimationFrame(() => {
      // Ad blocker detection
      if (!window.adsbygoogle) {
        setShowHouseAd(true);
        return;
      }

      // Push ad only once per mount
      if (!pushedRef.current && insRef.current) {
        pushedRef.current = true;
        try {
          window.adsbygoogle.push({});
          setAdsenseActive(true);
        } catch {
          setShowHouseAd(true);
        }
      }
    });

    // No-fill detection after 2s
    const timer = setTimeout(() => {
      const ins = insRef.current;
      if (ins && ins.getAttribute('data-ad-status') !== 'filled') {
        setAdsenseActive(false);
        setShowHouseAd(true);
      }
    }, 2000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return { adsenseActive, showHouseAd, insRef, config };
}
