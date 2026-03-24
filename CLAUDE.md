# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SDD Video Template — a Remotion project that converts Spec-Driven Development (SDD) workflow outputs (SpecKit + OpenSpec) into narrated project evolution videos. Produces 1920x1080 30fps MP4s from JSON data.

## Commands

```bash
bun install              # Install dependencies
bun dev                  # Start Remotion Studio (preview)
bun run render           # Render video (add -- GenesisVideo or -- IterationVideo)
bun run lint             # ESLint + tsc type check
bun run speckit-to-genesis -- --input .spec-kit/ --output openspec/archived/000-genesis/
bun run parse-archive -- --input openspec/archived/000-genesis/
```

Scripts in `scripts/` run via Bun (excluded from tsconfig, use `@types/bun`). Source in `src/` goes through Remotion's webpack.

## Architecture

### Data Flow

```
SDD markdown files → speckit-to-genesis.ts → archived/000-genesis/ → parse-archive.ts → JSON → Remotion Component → MP4
```

### Two Runtimes

- **Remotion (webpack/Node)**: Everything in `src/` — React components, schemas, styles. TypeScript checked via project tsconfig.
- **Bun**: Everything in `scripts/` — CLI tools for markdown→JSON conversion. Excluded from tsconfig, uses Bun native APIs (`Bun.file`, `Bun.write`).

### Schema-First Design

`src/types/schemas.ts` is the single source of truth. Zod schemas (v4) define all data types and are used for:
1. Remotion `<Composition schema={...}>` props (Studio sidebar UI)
2. `parse-archive.ts` output validation (`.safeParse()`)
3. TypeScript types via `z.infer<>`

Four video data schemas: `GenesisData`, `IterationData`, `EvolutionData` (P2), `SprintData` (P2).

### Video Template Pattern

Each template in `src/templates/` follows the same structure:
- Accepts its typed data as props (e.g., `GenesisData`)
- Uses `<TransitionSeries>` + `fade()` for scene sequencing
- Exports a `calculateMetadata` function for dynamic duration
- Registered in `src/Root.tsx` with schema + defaultProps from `src/data/sample/`

### Shared Components (`src/components/`)

Six reusable animation building blocks: `TypewriterText`, `SpecDiff`, `TaskChecklist`, `CounterAnimation`, `SceneTitle`, `ArchitectureDiagram`. All driven by `useCurrentFrame()` + `spring()`/`interpolate()`.

### Theme System

`src/styles/theme.ts` centralizes all colors: `THEME` (global palette), `MODULE_COLORS` (architecture diagram category→color mapping), `GRAY` (unimplemented modules).

## Remotion Rules (Critical)

- **ALL animations MUST use `useCurrentFrame()`** — CSS transitions/animations are FORBIDDEN and will not render
- Inside a `<Sequence>`, `useCurrentFrame()` returns local frame (0-based), not global
- Use `spring()` for natural motion (0→1), `interpolate()` for linear mapping
- `{ damping: 200 }` = smooth no-bounce; default config = slight bounce
- `<TransitionSeries.Transition>` shortens total duration (scenes overlap during transition)
- `premountFor` only works with default layout, not `layout="none"`
- JSON imports in Root.tsx need `as unknown as Type` cast because literal types widen

## SDD Workflow Context

This project uses SpecKit (`.specify/` directory) for spec-driven development. Specs, plans, and tasks live in `.specify/specs/001-sdd-video-templates/`. P2 features (EvolutionTimeline, SprintReview) are not yet implemented.
