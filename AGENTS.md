# Project Instructions

## Documentation First
- Read [CLAUDE.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/CLAUDE.md) at the start of any non-trivial task. It is the primary project overview and workflow document.
- Before changing a specific area, read the nearest relevant directory guide:
  - [src/store/CLAUDE.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/src/store/CLAUDE.md)
  - [src/components/CLAUDE.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/src/components/CLAUDE.md)
  - [src/components/ads/CLAUDE.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/src/components/ads/CLAUDE.md)
  - [src/hooks/CLAUDE.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/src/hooks/CLAUDE.md)
  - [src/utils/CLAUDE.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/src/utils/CLAUDE.md)
  - [tests/CLAUDE.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/tests/CLAUDE.md)

## Supporting Docs
- Use the docs in `/docs` as the authoritative secondary references:
  - [docs/architecture.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/docs/architecture.md) for data flow, state, session flow, grouping, and tracking
  - [docs/graph-spec.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/docs/graph-spec.md) for exercise graph semantics
  - [docs/import-export-spec.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/docs/import-export-spec.md) for text and log import/export behavior
  - [docs/testing-strategy.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/docs/testing-strategy.md) for test depth and focus
  - [docs/design-system.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/docs/design-system.md) for visual direction
  - [docs/cloudflare-email-list.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/docs/cloudflare-email-list.md) only when working on the email capture / Cloudflare path
- Treat [README.md](/Users/slongo/Documents/GitHub/curlbro/workout-builder/README.md) as a user-facing overview and quick-start, not the main source of implementation detail.

## Memory And Lessons
- At the start of work, scan for repo-authored memory docs such as `MEMORY.md`, `memory.md`, or `*lesson*` / `*lessons*` files and read the ones relevant to the area you are touching.
- Prefer the closest relevant memory or lessons-learned document when multiple exist.
- Ignore dependency and generated documentation under `node_modules/` and `dist/` unless the task explicitly requires it.

## Update Discipline
- When a task changes architecture, workflows, conventions, or notable gotchas, update the relevant documentation, including any memory or lessons-learned files if they exist.
