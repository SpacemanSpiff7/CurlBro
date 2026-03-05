import { useState, useEffect, useCallback, useRef } from 'react';
import type { HouseAdCategory } from '../config/ads';
import { HOUSE_ADS, type HouseAd } from '../data/houseAds';

// Module-level set tracks shown IDs across mount/unmount (resets on page reload)
const shownIds = new Set<string>();

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

export function useHouseAd(
  categories: HouseAdCategory[],
  rotate: boolean = false,
  intervalMs: number = 0,
) {
  const [ad, setAd] = useState<HouseAd>(() => pickAd(categories));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setAd(pickAd(categories));
  }, [categories]);

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
