import { useState, useEffect, useCallback, useRef } from 'react';
import type { HouseAdCategory } from '../config/ads';
import type { AdSlotKey } from '../config/ads';
import { HOUSE_ADS, type HouseAd } from '../data/houseAds';

// Module-level set tracks shown IDs across mount/unmount (resets on page reload)
const shownIds = new Set<string>();

// Per-slot cache: persists ads across tab switches to avoid excessive refreshes.
// AdSense minimum refresh interval is 30s.
const MIN_DISPLAY_MS = 30_000;
const slotCache = new Map<AdSlotKey, { ad: HouseAd; pickedAt: number }>();

function pickAd(categories: HouseAdCategory[]): HouseAd {
  const pool = HOUSE_ADS.filter(
    (ad) => categories.includes(ad.category) && !shownIds.has(ad.id),
  );

  // Reset category tracking when pool exhausted
  if (pool.length === 0) {
    const categoryIds = HOUSE_ADS
      .filter((ad) => categories.includes(ad.category))
      .map((ad) => ad.id);
    categoryIds.forEach((id) => shownIds.delete(id));
    return pickAd(categories);
  }

  const ad = pool[Math.floor(Math.random() * pool.length)];
  shownIds.add(ad.id);
  return ad;
}

function getOrPickAd(slotKey: AdSlotKey, categories: HouseAdCategory[]): HouseAd {
  const cached = slotCache.get(slotKey);
  if (cached && Date.now() - cached.pickedAt < MIN_DISPLAY_MS) {
    return cached.ad;
  }
  const ad = pickAd(categories);
  slotCache.set(slotKey, { ad, pickedAt: Date.now() });
  return ad;
}

export function useHouseAd(
  slotKey: AdSlotKey,
  categories: HouseAdCategory[],
  rotate: boolean = false,
  intervalMs: number = 0,
) {
  const [ad, setAd] = useState<HouseAd>(() => getOrPickAd(slotKey, categories));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    const newAd = pickAd(categories);
    slotCache.set(slotKey, { ad: newAd, pickedAt: Date.now() });
    setAd(newAd);
  }, [slotKey, categories]);

  useEffect(() => {
    if (rotate && intervalMs > 0) {
      intervalRef.current = setInterval(next, intervalMs);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [rotate, intervalMs, next]);

  return { ad, next };
}
