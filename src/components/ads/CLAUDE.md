# Ad System

## Architecture

Two-tier ad system: Google AdSense (programmatic) with house ad fallbacks.
AdSense is behind a kill switch (`ADSENSE_ENABLED` in `src/config/ads.ts`) — currently
`false`. House ads are the full experience until AdSense is approved.

### Components
- `AdSlot` — Core reusable component. Accepts `slotKey: AdSlotKey` and optional `className`.
  Composes `useAdSlot` (AdSense lifecycle) and `useHouseAd` (fallback content). When
  `ADSENSE_ENABLED` is false, only renders `HouseAdComponent` — no AdSense DOM elements.
- `HouseAdComponent` — Memo'd presenter. Renders label, headline, body, optional CTA.
  Wraps in `<a target="_blank">` when `href` present, otherwise renders as `<div>`.
  Uses `role="complementary"` + `aria-label="Sponsored content"` for accessibility.

### Hooks (`src/hooks/`)
- `useHouseAd(categories, rotate?, intervalMs?)` — Selects a random house ad from the
  filtered pool. Module-level `Set<string>` tracks shown IDs to prevent repeats within a
  session (resets on page reload). Auto-resets category pool when exhausted. Optional
  rotation via `setInterval` for long-visible slots (rest timer uses 30s rotation).
- `useAdSlot(slotKey)` — Manages AdSense `<ins>` lifecycle. When `ADSENSE_ENABLED` is
  false, immediately returns `showHouseAd: true`. When enabled: detects ad blockers
  (`window.adsbygoogle` undefined), pushes ad once per mount (`pushedRef` guard), and
  detects no-fill after 2s timeout (checks `data-ad-status !== 'filled'`). Uses
  `requestAnimationFrame` to defer setState calls (React 19 strict mode compliance).

### Config (`src/config/ads.ts`)
- `ADSENSE_ENABLED` — Kill switch. Set to `true` after AdSense approval.
- `AD_PUBLISHER_ID` — Fill with `ca-pub-XXXXXXXXXXXXXXXX` after approval.
- `AD_SLOTS` — Record of 6 slot configs with `slotId`, `format`, `houseAdCategories`,
  and rotation settings.

### Data (`src/data/houseAds.ts`)
24 house ads across 5 categories:
- `form_tip` (8) — cyan accent, exercise technique tips
- `recovery` (5) — green accent, sleep/hydration/rest
- `challenge` (4) — amber accent, workout variety prompts
- `nutrition` (4) — violet accent, protein/creatine/carbs
- `general` (3) — zinc accent, progressive overload/consistency

## 6 Ad Placements

| Slot Key | Page | Location | Rotates |
|----------|------|----------|---------|
| `build` | BuildWorkout | Above "Add Exercise" button | No |
| `rest_timer` | ActiveWorkout | Between RestTimer and GroupSetTracker (active only) | Yes (30s) |
| `post_workout` | ActiveWorkout | Summary sheet, between stats grid and "View Log" | No |
| `library_feed` | MyWorkouts | After every 4th workout card (5+ workouts, not after last) | No |
| `log_feed` | WorkoutLogPage | After every 4th log entry (5+ logs, not after last) | No |
| `settings` | SettingsPage | Above the About section | No |

## Design Tokens

```
Container bg:         bg-zinc-900/50 (distinct from app bg-zinc-950)
Container border:     border border-zinc-700/50 rounded-lg
Left accent border:   border-l-4 + category color
Sponsored label:      font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500
House ad headline:    font-mono text-sm text-zinc-200
House ad body:        font-sans text-xs text-zinc-400
CTA text:             font-mono text-xs text-accent-primary
Container padding:    p-3
```

AdSense container (when active) gets a distinct background (`bg-zinc-800/50`) and
4-side border (`border-zinc-600/50`) for Google policy compliance.

## In-Feed Ad Pattern

Library and Log pages use Fragment wrapping to interleave ads:
```tsx
items.map((item, index) => (
  <Fragment key={item.id}>
    <ItemRow ... />
    {items.length >= 5 && (index + 1) % 4 === 0 && index < items.length - 1 && (
      <AdSlot slotKey="..." />
    )}
  </Fragment>
))
```

## AdSense Test Traffic Protection

`ADSENSE_ENABLED` uses `import.meta.env.PROD && false` — even when the `false` is flipped
to `true`, AdSense never loads in dev (`npm run dev`). This prevents accidental impressions
or clicks during development, which can lead to AdSense account suspension.

Additional precautions:
- Never click your own ads, even accidentally during testing
- Use Chrome DevTools "Block request URL" to block `pagead2.googlesyndication.com` during local testing
- When testing on production domain, use Google's official Publisher Console instead of interacting with ads
- `public/ads.txt` exists with placeholder publisher ID — update after AdSense approval

## AdSense Activation Checklist (Phase 5 — post-approval)

1. Add AdSense script to `index.html` `<head>`:
   `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXX" crossorigin="anonymous">`
2. Set `AD_PUBLISHER_ID` in `src/config/ads.ts`
3. Change `ADSENSE_ENABLED` from `import.meta.env.PROD && false` to `import.meta.env.PROD && true`
4. Fill all 6 `slotId` values from AdSense dashboard
5. Update `public/ads.txt` with actual publisher ID: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
6. Block inappropriate ad categories in AdSense dashboard
7. Google Search Console verified via DNS (no HTML meta tag needed)

## Testing

Tests use vitest assertions (not jest-dom matchers) because `tsc -b` compiles test files
under `src/` via `tsconfig.app.json`, which doesn't include jest-dom type defs. Use
`toBeTruthy()`, `toBeNull()`, `getAttribute()` instead of `toBeInTheDocument()`,
`toHaveAttribute()`.

- `src/hooks/useHouseAd.test.ts` — selection, no-repeat, rotation, pool reset, cleanup
- `src/hooks/useAdSlot.test.ts` — fallback logic, config correctness
- `src/components/ads/HouseAd.test.tsx` — rendering, links, accessibility, accent colors
- `src/components/ads/AdSlot.test.tsx` — house ad fallback, no AdSense DOM when disabled

Note: `useHouseAd` uses a module-level `shownIds` Set that persists across tests. Tests
must not depend on exact pool counts — use small categories (e.g., `general` with 3 ads)
for exhaustion tests.
