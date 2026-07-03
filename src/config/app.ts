/**
 * App-wide constants for the native iOS app on the App Store and CurlBro's
 * official external links (Instagram, custom GPT).
 * Lives in config (not a component) so links, analytics, structured data,
 * and the PWA manifest can all share a single source of truth.
 *
 * NOTE: these URLs are also hardcoded in a few non-JS/TS surfaces that cannot
 * import this module — keep them in sync if any of them ever change:
 *   - index.html              (apple-itunes-app meta + JSON-LD, incl. Instagram sameAs)
 *   - public/manifest.json    (related_applications)
 *   - marketing/ (separate Astro project):
 *       src/components/sections/Hero.astro        (App Store URL)
 *       src/components/sections/GetInTouch.astro  (Instagram row)
 *       src/layouts/Base.astro                    (Instagram in JSON-LD sameAs)
 *       src/pages/exercises.astro                 (custom GPT link)
 *       public/llms.txt                           (custom GPT link)
 */
export const APP_STORE_ID = '6762241598';
export const APP_STORE_URL = `https://apps.apple.com/us/app/curlbro/id${APP_STORE_ID}`;

/** Where an App Store link/badge was clicked — sent as the GA4 event label. */
export type AppStorePlacement = 'welcome' | 'about' | 'settings';

export const INSTAGRAM_HANDLE = 'lift_with_curlbro';
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

/** Official "CurlBro Trainer" custom GPT — generates workouts in the import format. */
export const CUSTOM_GPT_URL =
  'https://chatgpt.com/g/g-6a2dceea318481919722582fc2154d6d-curlbro-trainer';
