/**
 * App-wide constants for the native iOS app on the App Store.
 * Lives in config (not a component) so links, analytics, structured data,
 * and the PWA manifest can all share a single source of truth.
 *
 * NOTE: the App Store ID/URL is also hardcoded in a few non-JS/TS surfaces
 * that cannot import this module — keep them in sync if the id ever changes:
 *   - index.html              (apple-itunes-app meta + MobileApplication JSON-LD)
 *   - public/manifest.json    (related_applications)
 *   - marketing/src/components/sections/Hero.astro  (separate Astro project)
 */
export const APP_STORE_ID = '6762241598';
export const APP_STORE_URL = `https://apps.apple.com/us/app/curlbro/id${APP_STORE_ID}`;

/** Where an App Store link/badge was clicked — sent as the GA4 event label. */
export type AppStorePlacement = 'welcome' | 'about' | 'settings';
