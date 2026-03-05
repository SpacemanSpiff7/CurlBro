export type AdSlotKey = 'build' | 'rest_timer' | 'post_workout' | 'library_feed' | 'log_feed' | 'settings';
export type HouseAdCategory = 'form_tip' | 'recovery' | 'challenge' | 'portfolio' | 'nutrition' | 'general';

export interface AdSlotConfig {
  slotId: string;
  format: 'horizontal' | 'auto';
  houseAdCategories: HouseAdCategory[];
  rotateHouseAds: boolean;
  rotateIntervalMs: number;
}

export const AD_PUBLISHER_ID = 'ca-pub-2480873220343955';
export const ADSENSE_ENABLED = import.meta.env.PROD && false; // Kill switch — false until approved; never loads in dev

export const AD_SLOTS: Record<AdSlotKey, AdSlotConfig> = {
  build:         { slotId: '', format: 'horizontal', houseAdCategories: ['form_tip', 'challenge', 'portfolio'], rotateHouseAds: false, rotateIntervalMs: 0 },
  rest_timer:    { slotId: '', format: 'horizontal', houseAdCategories: ['form_tip', 'portfolio', 'general'], rotateHouseAds: true, rotateIntervalMs: 30_000 },
  post_workout:  { slotId: '', format: 'auto', houseAdCategories: ['recovery', 'nutrition', 'portfolio'], rotateHouseAds: false, rotateIntervalMs: 0 },
  library_feed:  { slotId: '', format: 'horizontal', houseAdCategories: ['challenge', 'portfolio', 'general'], rotateHouseAds: false, rotateIntervalMs: 0 },
  log_feed:      { slotId: '', format: 'horizontal', houseAdCategories: ['recovery', 'portfolio', 'general'], rotateHouseAds: false, rotateIntervalMs: 0 },
  settings:      { slotId: '', format: 'horizontal', houseAdCategories: ['portfolio', 'general'], rotateHouseAds: false, rotateIntervalMs: 0 },
};
