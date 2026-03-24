# SDD Video Template

Remotion project that converts [Spec-Driven Development (SDD)](https://github.com/anthropics/claude-code) workflow outputs into narrated project evolution videos. Produces 1920x1080 30fps MP4.

## How It Works

```
SDD markdown files
    |
    v
speckit-to-genesis.ts ── converts SpecKit format to OpenSpec archived format
    |
    v
parse-archive.ts ─────── extracts structured data, validates with Zod
    |
    v
JSON (GenesisData / IterationData / FullStoryData)
    |
    v
Remotion Component ────── React scenes with spring/interpolate animations
                          supports audience mode (technical / business)
    |
    v
MP4 (1920x1080 30fps)
```

## Quick Start

### Use as Template

```bash
# 1. Clone and install
git clone <this-repo> my-project-video
cd my-project-video
bun install

# 2. Initialize for your project (replaces sample data)
bun run init

# 3. Preview in Remotion Studio
bun dev

# 4. Render video
bun run render -- GenesisVideo     # Genesis video
bun run render -- IterationVideo   # Iteration video
bun run render -- FullStoryVideo   # Full story (genesis + all iterations)
```

### From Your SDD Files

If you already have SpecKit outputs (`.specify/` or `.spec-kit/`):

```bash
# Step 1: Convert SpecKit → OpenSpec archived format
bun run speckit-to-genesis -- --input .spec-kit/ --output openspec/archived/000-genesis/

# Step 2: Parse archived markdown → JSON
bun run parse-archive -- --input openspec/archived/000-genesis/ --output src/data/sample/genesis.json

# Step 3: Preview and render
bun dev
bun run render -- GenesisVideo
```

For iteration videos:

```bash
bun run parse-archive -- --input openspec/archived/001-feature-name/ --output src/data/sample/iteration-001.json
bun run render -- IterationVideo
```

## Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun dev` | Start Remotion Studio (preview) |
| `bun run render -- <CompositionId>` | Render MP4 |
| `bun run lint` | ESLint + TypeScript type check |
| `bun run init` | Initialize template for your project |
| `bun run speckit-to-genesis` | Convert SpecKit → OpenSpec archived |
| `bun run parse-archive` | Parse archived markdown → JSON |
| `bun run parse-archive -- --audience business` | Parse with business audience mode |

## Project Structure

```
src/
  types/schemas.ts          # Zod schemas (single source of truth)
  templates/
    GenesisVideo.tsx        # 45-60s "genesis" video (project birth)
    IterationVideo.tsx      # 15-20s iteration change video
    FullStoryVideo.tsx      # Genesis + all iterations in one video
    EvolutionTimeline.tsx   # (P2) full project timeline
    SprintReview.tsx        # (P2) sprint review summary
  components/
    TypewriterText.tsx      # Character-by-character typing animation
    SpecDiff.tsx            # Before/after spec change visualization
    TaskChecklist.tsx       # Task items with staggered check animation
    CounterAnimation.tsx    # Animated number counter
    SceneTitle.tsx          # Scene title card with fade-in + scale
    ArchitectureDiagram.tsx # SVG architecture diagram with progressive coloring
    BusinessSummaryScene.tsx # Business impact summary (audience: business)
  styles/theme.ts           # Color palette (THEME, MODULE_COLORS, GRAY)
  data/sample/              # Sample JSON data (replace with your own)
scripts/
  init-template.ts          # Interactive template initializer
  speckit-to-genesis.ts     # SpecKit → OpenSpec format converter
  parse-archive.ts          # Markdown → JSON parser with Zod validation
```

## Video Types

### GenesisVideo (P1)

The "birth" of a project. Shows project name, core principles, architecture overview, task summary, and target users.

**Input**: `GenesisData` — project name, tagline, principles, architecture modules, task categories, target users.

### IterationVideo (P1)

A single iteration/change. Shows what changed (spec diff), completed tasks, and newly colored architecture modules.

**Input**: `IterationData` — change name, summary, motivation, spec before/after, tasks, architecture with colored/highlighted modules.

### FullStoryVideo (P1)

Genesis + all iterations merged into one continuous evolution video. Architecture is defined once at the top level; each iteration progressively colors modules.

**Input**: `FullStoryData` — genesis data + iterations array (without duplicated architecture).

### Audience Mode

All templates support `audience` parameter (`"technical"` | `"business"`, default: `"technical"`).

| Mode | Audience | Content |
|------|----------|---------|
| `technical` | Engineers | Spec diff, task IDs, technical details |
| `business` | PM / 主管 / 業務 | Business impact summary, plain-language changes |

Business mode uses optional fields: `businessImpact`, `businessSpecDiff`, `businessTasks`. If absent, falls back to technical content.

### EvolutionTimeline (P2 - not yet implemented)

Full project history condensed into 90-120s. Replays all iterations as architecture progressively lights up.

### SprintReview (P2 - not yet implemented)

Sprint summary in 20-30s. Aggregates multiple iterations with stats.

## Customizing Your Video Data

The JSON files in `src/data/sample/` drive everything. Edit them directly or generate from SDD files.

### GenesisData Schema

```jsonc
{
  "type": "genesis",
  "projectName": "Your Project",
  "tagline": "One-line description",
  "principles": [
    { "title": "Principle Name", "description": "Why this matters" }
  ],
  "architecture": {
    "title": "System Architecture",
    "modules": [
      {
        "id": "auth",
        "label": "Auth Service",
        "description": "Optional detail",
        "category": "core",        // core | api | data | ui | infra | external
        "position": { "row": 0, "col": 0 }
      }
    ],
    "connections": [
      { "from": "web", "to": "api", "label": "HTTP" }
    ]
  },
  "taskSummary": {
    "total": 42,
    "categories": [
      { "name": "Setup", "count": 8 },
      { "name": "Core Features", "count": 24 }
    ]
  },
  "targetUsers": ["Engineers", "PMs"]
}
```

### IterationData Schema

```jsonc
{
  "type": "iteration",
  "iterationNumber": "001",
  "changeName": "add-user-auth",
  "summary": "What was done",
  "motivation": "Why it was needed",
  "specDiff": {
    "before": "Previous state",
    "after": "New state"
  },
  "tasks": [
    { "id": "T-001", "title": "Task description", "status": "completed" }
    // status: "completed" | "skipped"
  ],
  "architecture": { /* same as genesis */ },
  "coloredModules": ["auth", "api"],      // already implemented (colored from start)
  "highlightModules": ["api"],            // newly added (animate gray → color)
  // Optional: business audience fields (fallback to technical if absent)
  "businessImpact": "使用者現在可以安全登入，不同角色看到不同功能",
  "businessSpecDiff": {
    "before": "任何人都可以看到所有資料",
    "after": "每個人只看到自己有權限的內容"
  },
  "businessTasks": [
    { "id": "T-001", "title": "完成：安全的身份驗證機制", "status": "completed" }
  ]
}
```

### Module Categories & Colors

| Category | Color | Use for |
|----------|-------|---------|
| `core` | Blue | Core business logic, domain services |
| `api` | Green | API gateways, REST/GraphQL endpoints |
| `data` | Amber | Databases, caches, data stores |
| `ui` | Purple | Frontend, web/mobile UI |
| `infra` | Gray | CI/CD, workers, infrastructure |
| `external` | Brown | Third-party services, integrations |

## Architecture Decisions

- **All animations use `useCurrentFrame()`** — CSS transitions are forbidden (won't render in Remotion)
- **Zod schemas are the single source of truth** — used for validation, Remotion Studio UI, and TypeScript types
- **SVG + React for diagrams** — no D3/Mermaid dependency, pure spring/interpolate animations
- **TransitionSeries + fade** — consistent scene sequencing across all templates

## Requirements

- [Bun](https://bun.sh/) >= 1.3
- Node.js >= 22 (for Remotion's webpack)

## License

UNLICENSED
