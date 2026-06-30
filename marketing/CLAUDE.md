# CurlBro Marketing Site (Astro)

## What
The marketing landing page served at **curlbro.com/** (root). Astro 6, static output,
Tailwind 4, a few React islands (EmailForm, CookieConsent). Separate from the Vite SPA, which
is served at **curlbro.com/app/**. Astro config: `base: '/'`, `outDir: '../dist'`, default
directory build → pages are `/`, `/exercises/`, `/app/`.

Build first, then the app: `cd marketing && npx astro build` writes to `../dist/`; the root
build then runs `vite build` into `dist/app/`. (Astro cleans `dist/`, so it must run first.)

## Pages & shared chrome
- `src/layouts/Base.astro` wraps **every** page and renders the shared `<TopNav/>` + skip-link
  (`#main`) + `<Colophon/>`.
- `src/pages/index.astro` — the home page. Its sections carry the ids the nav targets.
- `src/pages/exercises.astro` — a **separate page** (GPT exercise catalog). It has its own
  content and does NOT contain the home sections.
- New top-level content → its own `src/pages/<name>.astro` route, never a home-page anchor.

## ⚠️ Nav link contract (READ THIS before touching `TopNav.astro`)

Because `TopNav` renders on **every page**, a bare same-page anchor like `href="#whole-idea"`
is a **dead link on any page that doesn't contain that section** (e.g. `/exercises/`). This is
exactly the bug that broke the nav after clicking "Exercises."

**Rules (positive form — always do this):**
1. **Home-section nav links MUST use the absolute-to-home hash form `/#section`** (e.g.
   `/#iphone`, `/#whole-idea`, `/#get-in-touch`) — never bare `#section`. From the home page the
   JS intercepts and smooth-scrolls; from any other page the browser navigates home and
   `initHashOnLoad()` scrolls to the section after load.
2. **The CurlBro logo MUST link to `/`** (home), never a hash. `Logo.astro` carries
   `data-home-link`; on the home page `initHomeLogo()` intercepts the click and smooth-scrolls
   to the top instead of reloading.
3. **A page route (e.g. Exercises) uses its real path** `/exercises/`, not an anchor.

A grep guard enforces rule 1 & 2: root `package.json` → `lint:nav` fails if a bare
`#iphone|#whole-idea|#get-in-touch|#top` href reappears in `TopNav.astro`. It is chained into
`npm run lint` **and** run as its own step in `.github/workflows/deploy.yml` (so it gates
deploys even though CI doesn't run the full `npm run lint`). Mirrors the existing `lint:copy`
guard's shape.

### Section id ↔ nav label map
| Nav label | href | Section id | Component |
|---|---|---|---|
| (logo) | `/` | — | `Logo.astro` (`data-home-link`) |
| iPhone App | `/#iphone` | `id="iphone"` | `sections/CurlBroOnIPhone.astro` |
| About | `/#whole-idea` | `id="whole-idea"` | `sections/WholeIdea.astro` |
| Exercises | `/exercises/` | — (own page) | `pages/exercises.astro` |
| Contact | `/#get-in-touch` | `id="get-in-touch"` | `sections/GetInTouch.astro` |
| (Hero) | — | `id="top"` | `sections/Hero.astro` |

## How nav scrolling works (`src/scripts/animations.ts`)
- `initSmoothAnchors()` — on any `a[href]` click, parses `new URL(link.href, location.href)`.
  Same pathname + existing hash target → `preventDefault()` + `scrollToSection()`. Different
  pathname (cross-page `/#x`) or missing target → let the browser navigate; nothing is hijacked.
  This also keeps the skip-link `#main` working on every page.
- `initHashOnLoad()` — on load, if the URL has a hash that resolves to a section, scrolls to it
  (after two rAFs so layout settles), overriding the browser's native jump. This is what makes
  cross-page links land correctly (e.g. arriving at `/#whole-idea` from `/exercises/`).
- `initHomeLogo()` — logo smooth-scrolls to top when already on `/`, else navigates to `/`.
- `scrollToSection()` — body-pin sections (`.section-body-pin`: About, Contact) scroll ~0.3vh
  deeper so the pinned body lands centered; others scroll to just under the 52px sticky nav.
- `initActiveNav()` keys off `data-nav-target` (kept on the desktop links) and self-disables on
  pages without those sections — leave it alone.
- `globals.css` sets `html { scroll-padding-top: 56px }` so native hash jumps / the skip-link
  clear the sticky nav.

## Commands
- Dev: `npm run dev:marketing` (from repo root) or `npx astro dev --port 4322` (from `marketing/`)
- Build: `cd marketing && npx astro build`
- Lint (incl. nav guard): `npm run lint` (from repo root)

## Content lint
Root `lint:copy` bans hype words (`journey`, `unleash`, `crush it`, `elevate`, `AI-powered`)
in `marketing/src/`. Keep copy plain and concrete.
