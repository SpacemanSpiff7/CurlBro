# Workout Builder App

## What
Client-side React workout builder using an exercise graph (162 exercises, 1340 edges).
Mobile-first, dark-mode-only, static deployment. Zero server-side processing.

## Tech Stack
- React 18+ / TypeScript (strict) / Vite
- Zustand (state) + Immer (immutable updates) + Zod (validation)
- shadcn/ui + Tailwind CSS 4 + Framer Motion
- @dnd-kit for drag-to-reorder
- Fuse.js for fuzzy search
- Vitest + React Testing Library (unit/integration)
- Playwright (E2E)

## Critical Commands
- Dev: `npm run dev`
- Build: `npm run build` (runs tsc && vite build)
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
- `src/components/CLAUDE.md` — component architecture, compound component API
- `src/hooks/CLAUDE.md` — hook patterns, memoization rules
- `src/utils/CLAUDE.md` — utility function conventions
- `tests/CLAUDE.md` — testing conventions and patterns

## Workflow
1. Read relevant docs before starting work on any area
2. Use Plan Mode (Shift+Tab twice) before multi-file changes
3. Write or update tests for every change
4. Run `npx tsc --noEmit` after TypeScript changes
5. Run `npx vitest run` to verify tests pass
6. Run `npm run lint` before committing
7. Commit with conventional commits: feat:, fix:, test:, docs:, refactor:

## Git Strategy
- Branch per phase: `phase-1/foundation`, `phase-2/core-builder`, etc.
- Commit after each meaningful unit of work
- Never commit failing tests or type errors
