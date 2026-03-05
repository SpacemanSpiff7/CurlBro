# CurlBro

## What
Client-side React workout builder using an exercise graph (201 exercises, ~1500 edges).
Mobile-first, dark-mode-only, static deployment. Zero server-side processing.
Supports superset/tri-set/circuit grouping — exercises sharing a `supersetGroupId` are
grouped visually and navigated as a unit during active sessions.
Includes a body state system (soreness tracking + recent activities) with context-aware
exercise filtering (warm-up, cool-down, recovery, light day).

## Tech Stack
- React 19 / TypeScript (strict) / Vite 7
- Zustand (state) + Immer (immutable updates) + Zod (validation)
- shadcn/ui + Tailwind CSS 4 + Framer Motion
- @dnd-kit for drag-to-reorder
- Fuse.js for fuzzy search
- sonner for toast notifications
- Vitest + React Testing Library (unit/integration)
- Playwright (E2E)

## Critical Commands
- Dev: `npm run dev`
- Build: `npm run build` (runs prebuild → tsc -b → vite build)
- Typecheck (strict): `npx tsc -b` (builds both tsconfig.app.json + tsconfig.node.json — this is what CI runs, catches issues `tsc --noEmit` misses)
- Typecheck (quick): `npx tsc --noEmit` (faster but less strict — use `tsc -b` before committing)
- Lint: `npm run lint`
- Test (unit): `npm run test` (Vitest)
- Test (unit, watch): `npm run test:watch`
- Test (single file): `npx vitest run src/path/to/file.test.ts`
- Test (coverage): `npm run test:coverage`
- Test (E2E): `npx playwright test`

## Code Style
- ES modules only (import/export), never CommonJS (require)
- Functional components with hooks, never class components
- Destructure imports: `import { useState } from 'react'`
- Branded types for IDs (ExerciseId, WorkoutId) — see src/types/index.ts
- Zod schemas double as runtime validators AND TypeScript types
- All graph queries go through custom hooks — components never access the graph directly
- All state mutations go through Zustand actions — components never mutate state directly
- Shared display labels live in src/types/index.ts (MUSCLE_LABELS, SPLIT_LABELS, CATEGORY_LABELS, ACTIVITY_LABELS) — never duplicate

## Architecture Docs (read before working on related areas)
- `docs/architecture.md` — system architecture, data flow, component hierarchy
- `docs/graph-spec.md` — exercise graph structure, edge semantics, query patterns
- `docs/testing-strategy.md` — test philosophy, patterns, what to test per component type
- `docs/design-system.md` — colors, typography, spacing, animation specs
- `docs/import-export-spec.md` — sharing format specification, parser rules
- `docs/phase-checklist.md` — implementation phases with acceptance criteria

## Directory-Level Docs
Each major directory has its own CLAUDE.md with specific conventions:
- `src/store/CLAUDE.md` — Zustand slice patterns, persistence rules
- `src/components/CLAUDE.md` — component architecture, key components
- `src/components/ads/CLAUDE.md` — ad system architecture, placements, AdSense activation checklist
- `src/hooks/CLAUDE.md` — hook patterns, memoization rules
- `src/utils/CLAUDE.md` — utility function conventions
- `tests/CLAUDE.md` — testing conventions and patterns

## Key Data Files
- `src/data/01-07_*.json` — 7 JSON files with 162 strength exercises
- `src/data/08_stretching_mobility.json` — 32 stretching/mobility exercises (dynamic stretches, static stretches, mobility drills)
- `src/data/09_cardio_warmup.json` — 7 cardio warmup exercises (treadmill, elliptical, bike, rower, stair climber, jump rope)
- `src/data/exerciseConflicts.ts` — 33 exercise conflicts with scientific citations
- `src/data/seededWorkouts.ts` — 16 pre-built workout templates across 4 difficulty tiers
- `src/utils/logUtils.ts` — log display/export helpers (computeLogStats, logToSavedWorkout, formatLogForClipboard)
- `src/utils/groupUtils.ts` — superset group derivation (deriveGroups, getGroupLabel, ExerciseGroup interface)
- `public/exercises.json` — generated exercise catalog (run `npx tsx scripts/generate-exercises.ts`)
- `public/llms.txt` — LLM workout generation instructions (import format + guidance)
- `public/robots.txt` — points crawlers to llms.txt, exercises.json, and sitemap.xml
- `public/sitemap.xml` — sitemap for search engine crawlers
- `public/manifest.json` — PWA web app manifest
- `public/ads.txt` — AdSense publisher verification (placeholder until approved)
- `src/config/ads.ts` — ad slot definitions, AdSense kill switch (`import.meta.env.PROD && false`), publisher ID
- `src/data/houseAds.ts` — 30 house ads across 6 categories (tips + portfolio promos)
- `src/components/shared/CookieConsent.tsx` — EU cookie consent banner + Consent Mode v2 integration

## Custom Agents
- `@exercise-validator` — Validates all exercise JSON files: schema completeness, ID uniqueness, cross-reference integrity, scientific plausibility (movement patterns, muscle targeting, workout position). Run after adding/modifying exercise data.
- `@ui-scaffolder` — Generates new React components following CurlBro conventions (dark-mode tokens, 44px touch targets, React.memo, aria-labels, Framer Motion). Pass a description of what you need.
- `@graph-checker` — Validates exercise graph integrity: edge symmetry, orphan nodes, muscle coverage, dangling references, conflict data. Run after modifying exercise relationships.

Agent definitions live in `.claude/agents/`.

## Workflow
1. Read relevant docs before starting work on any area
2. Use Plan Mode (Shift+Tab twice) before multi-file changes
3. Write or update tests for every change
4. Run `npx tsc -b` after TypeScript changes (strict build — matches CI)
5. Run `npx vitest run` to verify tests pass
6. Run `npm run lint` before committing
7. **Update docs**: After completing changes, update any affected documentation:
   - This `CLAUDE.md` — if commands, key files, known quirks, or architecture changed
   - Directory-level `CLAUDE.md` files — if component conventions, hook patterns, or store actions changed
   - `docs/*.md` — if architecture, graph spec, or design system changed
   - Auto-memory (`MEMORY.md`) — if new gotchas, patterns, or file locations were discovered
   - Keep counts accurate (exercise count, test count, edge count)
8. Commit with conventional commits: feat:, fix:, test:, docs:, refactor:
9. Run `@exercise-validator` after modifying exercise JSON data
10. Run `@graph-checker` after modifying exercise relationships or graph builder

## Git Strategy
- Work on main branch (initial development phase)
- Commit after each meaningful unit of work
- Never commit failing tests or type errors

## Known Quirks
- `endSession()` only sets `completedAt` and stops the timer — call `saveSession()` separately to create the log
- WorkoutExercise uses index-based React keys (allows duplicate exercises) — local component
  state (expanded, video open) may not follow items on drag reorder. A future fix is to add
  unique instance IDs to WorkoutExercise
- The Immer middleware wraps `set()` automatically — no explicit `produce()` call needed
- `navigator.clipboard` requires HTTPS — wrap in try/catch for HTTP dev environments
- Exercise JSON `equipment` and `primary_muscles` fields are validated as `z.string()` arrays,
  not typed enums — the Zod schema is looser than the TypeScript types
- Exercise categories expanded: `compound`, `isolation`, `stretch_dynamic`, `stretch_static`, `mobility`, `cardio`
- `foam_roller` is a valid equipment type (used by mobility exercises)
- Cardio equipment types: `treadmill`, `elliptical`, `stationary_bike`, `rowing_machine`, `stair_climber`, `jump_rope`
- Public asset paths in JSX must use `import.meta.env.BASE_URL` prefix — hardcoded `/foo.png`
  breaks in production where base is `/curlbro/`. Vite only rewrites paths in index.html, not JSX.
- Ad system uses a two-tier approach: Google AdSense (programmatic, behind `ADSENSE_ENABLED`
  kill switch) with house ad fallbacks. Currently house ads only — see
  `src/components/ads/CLAUDE.md` for activation checklist. `ADSENSE_ENABLED` uses
  `import.meta.env.PROD && false` to prevent loading in dev mode.
- Consent Mode v2 defaults in `index.html` must come BEFORE the gtag.js script load.
  Cookie consent banner updates consent via `gtag('consent', 'update', ...)`.
- `index.html` has SEO meta tags, OG/Twitter cards, JSON-LD structured data, and a
  `<noscript>` fallback with indexable content. OG image URLs are absolute (social
  crawlers don't resolve relative URLs). Google Search Console verification meta tag
  needs `REPLACE_WITH_YOUR_CODE` replaced after setup.
- Dynamic `document.title` updates per tab via `TAB_TITLES` map in `App.tsx`.
- Test files under `src/` are compiled by `tsc -b` via `tsconfig.app.json` — they must NOT
  use jest-dom matchers (`toBeInTheDocument`, `toHaveAttribute`). Use vitest-native assertions
  (`toBeTruthy`, `toBeNull`, `getAttribute()`) instead. Jest-dom types are only available at
  vitest runtime via `vitest.setup.ts`, not during `tsc -b`.
