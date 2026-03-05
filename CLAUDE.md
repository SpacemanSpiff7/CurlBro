# CurlBro

## What
Client-side React workout builder using an exercise graph (162 exercises, 1340 edges).
Mobile-first, dark-mode-only, static deployment. Zero server-side processing.
Supports superset/tri-set/circuit grouping — exercises sharing a `supersetGroupId` are
grouped visually and navigated as a unit during active sessions.

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
- Build: `npm run build` (runs prebuild → tsc → vite build)
- Typecheck: `npx tsc --noEmit`
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
- Shared display labels live in src/types/index.ts (MUSCLE_LABELS, SPLIT_LABELS) — never duplicate

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
- `src/hooks/CLAUDE.md` — hook patterns, memoization rules
- `src/utils/CLAUDE.md` — utility function conventions
- `tests/CLAUDE.md` — testing conventions and patterns

## Key Data Files
- `src/data/01-07_*.json` — 7 JSON files with 162 exercises
- `src/data/exerciseConflicts.ts` — 33 exercise conflicts with scientific citations
- `src/data/seededWorkouts.ts` — 16 pre-built workout templates across 4 difficulty tiers
- `src/utils/logUtils.ts` — log display/export helpers (computeLogStats, logToSavedWorkout, formatLogForClipboard)
- `src/utils/groupUtils.ts` — superset group derivation (deriveGroups, getGroupLabel, ExerciseGroup interface)
- `public/exercises.json` — generated exercise catalog (run `npx tsx scripts/generate-exercises.ts`)
- `public/llms.txt` — LLM workout generation instructions (import format + guidance)
- `public/robots.txt` — points crawlers to llms.txt and exercises.json

## Workflow
1. Read relevant docs before starting work on any area
2. Use Plan Mode (Shift+Tab twice) before multi-file changes
3. Write or update tests for every change
4. Run `npx tsc --noEmit` after TypeScript changes
5. Run `npx vitest run` to verify tests pass
6. Run `npm run lint` before committing
7. Commit with conventional commits: feat:, fix:, test:, docs:, refactor:

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
- Public asset paths in JSX must use `import.meta.env.BASE_URL` prefix — hardcoded `/foo.png`
  breaks in production where base is `/curlbro/`. Vite only rewrites paths in index.html, not JSX.
