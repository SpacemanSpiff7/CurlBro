# CurlBro

A client-side gym workout builder powered by an exercise graph of 162 exercises and 1,340 relationships. Build workouts with intelligent suggestions, exercise conflict warnings, inline substitutions, drag-to-reorder, and a live session tracker with rest timer.

Mobile-first. Dark mode. No server required.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Scripts

| Command                | Description                          |
|------------------------|--------------------------------------|
| `npm run dev`          | Start Vite dev server                |
| `npm run build`        | Typecheck + production build         |
| `npm run preview`      | Preview production build locally     |
| `npm run test`         | Run all tests (Vitest)               |
| `npm run test:watch`   | Run tests in watch mode              |
| `npm run test:coverage`| Run tests with coverage report       |
| `npm run lint`         | Lint with ESLint                     |
| `npx tsc --noEmit`    | Typecheck without emitting           |

---

## Features

### Build Tab
- Search 162 exercises with fuzzy matching (Fuse.js)
- Filter by muscle group
- Drag-to-reorder exercises
- Inline set/rep/weight editing
- One-tap exercise substitution from the graph
- Smart suggestions: complements, muscle gap analysis, superset candidates
- Push/pull balance indicator
- Workout split selector (Push/Pull/Legs/Upper/Lower/Full Body)
- Exercise conflict warnings with scientific citations
- Auto-generated workout names based on dominant muscle group
- Embedded exercise videos (YouTube + external links)

### My Workouts Tab
- Save and manage user-created workouts
- 16 pre-built templates across 4 difficulty tiers (beginner to advanced)
- Edit a template to create a customizable copy
- Copy workout to clipboard in a human-readable format
- Import workouts from text (round-trip compatible)
- Start live sessions from any workout

### Active Workout Tab
- Exercise-by-exercise navigation
- Per-set weight and rep tracking with completion toggle
- Circular rest timer with audio beep and haptic vibration
- +/- 15 second timer adjustment
- Progress bar and dot indicators

### Settings Tab
- Default rest timer durations (compound vs. isolation)
- Reset settings
- Clear all saved data

---

## Tech Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Framework   | React 19 + TypeScript (strict)                     |
| Build       | Vite 7                                             |
| Styling     | Tailwind CSS 4 + shadcn/ui                         |
| State       | Zustand + Immer (persisted to localStorage)        |
| Validation  | Zod (runtime schemas = TypeScript types)           |
| Animation   | Framer Motion                                      |
| Drag & Drop | @dnd-kit                                           |
| Search      | Fuse.js                                            |
| Toasts      | sonner                                             |
| Testing     | Vitest + React Testing Library                     |

---

## Project Structure

```
src/
  components/
    exercise/      # ExerciseCard, ExercisePicker, SubstitutePanel, MuscleTags, VideoSheet
    session/       # SetTracker, RestTimer
    shared/        # BottomNav, ErrorBoundary
    ui/            # shadcn/ui primitives
    workout/       # WorkoutList, SuggestionPanel, WorkoutStatusBar, TemplateSelector,
                   # ConflictWarnings
  data/
    exercises.ts   # Merges 7 JSON files (162 exercises)
    graphBuilder.ts# Pure function: raw JSON -> ExerciseGraph
    exerciseConflicts.ts  # 33 exercise conflict rules with scientific citations
    seededWorkouts.ts     # 16 pre-built workout templates
    exercises/     # JSON files by muscle group (01-07)
  hooks/           # useExerciseSearch, useSubstitutes, useSuggestions,
                   # useWorkoutValidation, useWorkoutConflicts, useRestTimer,
                   # useAutoWorkoutName
  pages/           # BuildWorkout, MyWorkouts, ActiveWorkout, SettingsPage
  store/           # Single Zustand store (graph, builder, library, session, settings)
  types/           # Branded types, Zod schemas, all interfaces, shared label constants
  utils/           # formatExport, parseImport, audio, haptics
tests/
  fixtures/        # Test exercise graph (8 exercises)
  integration/     # Import/export round-trip, session flow
docs/              # Architecture, graph spec, design system, testing strategy
```

---

## Exercise Graph

The app is built on a pre-computed exercise graph:

- **162 exercises** across 7 muscle-group JSON files
- **3 edge types**: substitutes, complements, superset candidates
- **1,340 total edges** with full bidirectional integrity
- **4 indexes**: by muscle, equipment, movement pattern, force type

The graph is loaded once at startup and treated as immutable. All queries go through custom hooks -- components never access the graph directly.

---

## Exercise Conflicts

33 exercise conflicts across 8 categories warn users about potentially unsafe or suboptimal exercise combinations:

- Spinal compression stacking (e.g., heavy squat + heavy deadlift)
- Shoulder impingement (e.g., bench press before overhead press)
- Elbow stress accumulation
- Lumbar stabilizer pre-fatigue
- Rotator cuff fatigue
- Knee joint stress
- Grip/forearm fatigue before heavy pulls
- Pattern-level conflicts (e.g., two hip hinges)

All conflicts include scientific citations (McGill, NSCA, Cools, Kolber, Willardson).

---

## Seeded Workouts

16 pre-built templates targeting a moderately active adult:

| Category | Count | Description |
|----------|-------|-------------|
| Easy Machine | 4 | Machine-only, beginner-friendly (legs, push, pull, full body) |
| Intermediate | 5 | Free weight + cable mix (PPL + upper/lower) |
| Advanced | 4 | Heavy compound emphasis (push, pull, legs, power full body) |
| Specialty | 4 | Targeted focus (arms, shoulders, posterior chain, core) |

Evidence-based programming from Schoenfeld, RP, Nippard, NSCA.

---

## Import/Export Format

Workouts can be copied and shared as plain text:

```
## Push Day | 2026-03-04
---
Barbell Bench Press (Flat) [barbell_bench_press] | 4x8 | 155lb | Rest: 120s
  tip: Eyes under bar.
Cable Flye (Mid-Height) [cable_flye] | 3x12 | | Rest: 60s
  tip: Pulleys at chest height.
```

The `[exercise_id]` in brackets enables perfect round-trip fidelity -- paste an exported workout back in and it maps to the exact same exercises.

---

## Testing

93 tests across 11 test files:

```bash
# Run all tests
npm run test

# Run a specific test file
npx vitest run src/hooks/useRestTimer.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**What's tested:**
- Type system and Zod schemas
- Graph construction, edge integrity, indexes
- Store actions (add, remove, reorder, swap exercises)
- Fuzzy search and muscle filtering
- Substitutes, suggestions, validation hooks
- Exercise conflict detection (ID-based and pattern-based)
- Rest timer lifecycle
- Import/export parsing and round-trip fidelity
- Full session flow (start, track sets, navigate, finish)

---

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### First Run

```bash
npm install
npm run dev
```

### Before Committing

```bash
npx tsc --noEmit  # Typecheck
npm run lint       # Lint
npm run test       # Tests
npm run build      # Full production build
```

All four must pass with zero errors.

---

## Data Persistence

All data is stored in the browser's `localStorage` under the key `curlbro-storage`. Persisted data includes:

- Saved workouts
- Workout logs (completed sessions)
- Settings (rest timer defaults)

On load, each stored object is validated with its Zod schema. Invalid data is silently dropped -- the app never crashes on corrupt storage.

Seeded workout templates are NOT persisted -- they are always available from the bundled data. When a user edits or starts a template, a copy is created in their personal library.
