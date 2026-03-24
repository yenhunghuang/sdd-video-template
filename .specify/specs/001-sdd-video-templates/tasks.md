---
source: spec.md + plan.md
spec_hash: ce3de6dbf9b09e83375e2ac92b188d480d47fbfb30500dae402727cc4adde1b7
plan_hash: 389e45676d6e6049190dfe1f32ac238beb53c893705aa89e80c0d901ab2585f5
status: current
generated_at: 2026-03-24T14:00:00+08:00
---

# Tasks: SDD Video Templates

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Generated**: 2026-03-24
**Total Tasks**: 23 | **Phases**: 7 | **Waves**: 9

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no shared state)
- **[USn]**: Which user story this belongs to

---

## Phase 1: Setup

- [x] T-001 Create project directory structure per plan.md — `src/types/`, `src/templates/`, `src/components/`, `src/styles/`, `src/data/sample/`, `scripts/`
- [x] T-002 Install production dependencies: `zod`, `@remotion/transitions`, `gray-matter`
- [x] T-003 [P] Update `remotion.config.ts` to 1920x1080 30fps output settings
  **禁止修改**: package.json, src/
- [x] T-004 [P] Add script entries to `package.json` — `"speckit-to-genesis"`, `"parse-archive"`, `"render"` 指向 scripts/ 下的對應 Bun 腳本
  **禁止修改**: remotion.config.ts, src/

📍 **Checkpoint**: 專案骨架就緒，`bun install` 成功，`bun dev` 可啟動 Remotion Studio

---

## Phase 2: Foundational

⚠️ **BLOCKS all user stories** — must complete before Phase 3+

- [x] T-005 Create Zod schemas + inferred types in `src/types/schemas.ts` — ModuleDefinitionSchema, ArchitectureDefinitionSchema, GenesisDataSchema, IterationDataSchema, EvolutionDataSchema, SprintDataSchema, ArchitectureDiagramPropsSchema；所有 type 用 `z.infer<>` 推導
- [x] T-006 [P] Create theme constants in `src/styles/theme.ts` — MODULE_COLORS（core/api/data/ui/infra/external）、GRAY、THEME（bg/text/accent/success/danger/muted），全部 `as const`
  **禁止修改**: src/types/

📍 **Checkpoint**: Schema 和色彩系統就緒，其他 component 可開始開發

---

## Phase 3: User Story 4 — 共用動畫 Component (P1) 🎯 MVP

**Goal**: 提供一組可復用的動畫 building blocks，供所有影片模板組合使用
**Independent Test**: 每個 component 獨立掛載到測試 Composition，確認動畫在指定 frame 範圍內正確執行

### Implementation

- [x] T-007 [P] [US4] Create TypewriterText in `src/components/TypewriterText.tsx` — props: text, startFrame, speed?, cursor?, cursorChar?, style?, className?；使用 `useCurrentFrame()` + 字元切片實作逐字動畫 — FR-013, FR-014, FR-015
  **禁止修改**: src/components/SpecDiff.tsx, src/components/TaskChecklist.tsx, src/components/CounterAnimation.tsx, src/components/SceneTitle.tsx, src/components/ArchitectureDiagram.tsx, src/types/, src/styles/
- [x] T-008 [P] [US4] Create SpecDiff in `src/components/SpecDiff.tsx` — props: before, after, startFrame, transitionFrame, style?, className?；before 用紅色/刪除線，after 用綠色/底線，transitionFrame 控制切換時機 — FR-016, FR-017, FR-018
  **禁止修改**: src/components/TypewriterText.tsx, src/components/TaskChecklist.tsx, src/components/CounterAnimation.tsx, src/components/SceneTitle.tsx, src/components/ArchitectureDiagram.tsx, src/types/, src/styles/
- [x] T-009 [P] [US4] Create TaskChecklist in `src/components/TaskChecklist.tsx` — props: tasks[], startFrame, staggerDelay?；逐一出現並打勾動畫，`status: "skipped"` 顯示劃掉樣式 — FR-019, FR-020, FR-021
  **禁止修改**: src/components/TypewriterText.tsx, src/components/SpecDiff.tsx, src/components/CounterAnimation.tsx, src/components/SceneTitle.tsx, src/components/ArchitectureDiagram.tsx, src/types/, src/styles/
- [x] T-010 [P] [US4] Create CounterAnimation in `src/components/CounterAnimation.tsx` — props: from, to, startFrame, duration?, prefix?, suffix?, formatFn?；使用 `spring()` + `interpolate()` 滾動數字 — FR-022, FR-023, FR-024
  **禁止修改**: src/components/TypewriterText.tsx, src/components/SpecDiff.tsx, src/components/TaskChecklist.tsx, src/components/SceneTitle.tsx, src/components/ArchitectureDiagram.tsx, src/types/, src/styles/
- [x] T-011 [P] [US4] Create SceneTitle in `src/components/SceneTitle.tsx` — props: title, subtitle?, startFrame；場景標題卡，fade-in + scale spring 動畫，使用 THEME 色彩
  **禁止修改**: src/components/TypewriterText.tsx, src/components/SpecDiff.tsx, src/components/TaskChecklist.tsx, src/components/CounterAnimation.tsx, src/components/ArchitectureDiagram.tsx, src/types/, src/styles/

📍 **Checkpoint**: US4 完成 — 在 Remotion Studio 中每個 component 可獨立預覽動畫

---

## Phase 4: User Story 3 — 漸進式著色架構圖 (P1) 🎯 MVP

> ⚡ 可與 Phase 3 並行執行

**Goal**: 在影片中顯示架構圖，已完成的模組著色、未完成的灰色，新模組有 spring 過渡動畫
**Independent Test**: 傳入不同的 `coloredModules[]` → 對應模組著色，其餘灰色

### Implementation

- [x] T-012 [P] [US3] Implement ArchitectureDiagram in `src/components/ArchitectureDiagram.tsx` — props: architecture (ArchitectureDefinition), coloredModules[], highlightModules[], animationStartFrame, animationDuration?, showDescriptions?, width?, height?；純 React + SVG 實作：grid 佈局計算模組座標、`<rect>` + `<text>` 繪製模組、`<line>`/`<path>` 繪製連線、`spring()` + `interpolateColors()` 實作 highlightModules 灰色→彩色動畫、category → MODULE_COLORS 色系對照 — FR-008, FR-009, FR-010, FR-011, FR-012
  (depends on T-005 schemas, T-006 theme)
  **禁止修改**: src/components/TypewriterText.tsx, src/components/SpecDiff.tsx, src/components/TaskChecklist.tsx, src/components/CounterAnimation.tsx, src/components/SceneTitle.tsx, src/types/, src/styles/

📍 **Checkpoint**: US3 完成 — 架構圖可獨立渲染，傳不同 coloredModules 顯示不同著色狀態

---

## Phase 5: User Story 1 — Genesis 影片渲染 (P1) 🎯 MVP

**Goal**: 從 SpecKit 產出生成 45-60 秒的「創世紀」影片
**Independent Test**: 範例 `.spec-kit/` → `speckit-to-genesis.ts` → `parse-archive.ts` → JSON → GenesisVideo → MP4

### Implementation

- [x] T-013 [P] [US1] Implement speckit-to-genesis.ts in `scripts/speckit-to-genesis.ts` — 讀取 `.spec-kit/` 下的 constitution.md、spec.md、plan.md、tasks.md，映射輸出為 `openspec/archived/000-genesis/`（proposal.md + tasks.md + spec-delta.md）；使用 Bun 原生 fs API；包含 CLI 參數處理（input dir, output dir）— FR-001, FR-025, FR-026, FR-027
  (depends on T-001 directory structure)
  **禁止修改**: scripts/parse-archive.ts, src/
- [x] T-014 [P] [US1] Implement parse-archive.ts in `scripts/parse-archive.ts` — 讀取任意 `archived/NNN-xxx/` 路徑（proposal.md + tasks.md + spec-delta.md），用 gray-matter 解析 YAML frontmatter，根據 NNN 判斷類型（000=genesis, 001+=iteration），用 Zod schema `.safeParse()` 驗證輸出 JSON，缺少必要檔案時回傳明確錯誤訊息 — FR-002, FR-003, FR-028, FR-029
  (depends on T-005 schemas)
  **禁止修改**: scripts/speckit-to-genesis.ts, src/
- [x] T-015 [P] [US1] Create sample GenesisData JSON in `src/data/sample/genesis.json` — 包含 5 個 principles、6 個 architecture modules（core/api/data/ui/infra/external 各一）、task summary（3 categories）、targetUsers；完整符合 GenesisDataSchema
  (depends on T-005 schemas)
  **禁止修改**: scripts/, src/components/, src/templates/, src/data/sample/iteration-001.json
- [x] T-016 [US1] Implement GenesisVideo in `src/templates/GenesisVideo.tsx` — 使用 `<TransitionSeries>` + `fade()` 編排場景：SceneTitle 標題卡 → TypewriterText 逐條 principles → ArchitectureDiagram（全灰色，coloredModules=[]）→ CounterAnimation task summary → outro；實作 `calculateMetadata` 動態計算 durationInFrames — FR-004, FR-006
  (depends on T-007 TypewriterText, T-010 CounterAnimation, T-011 SceneTitle, T-012 ArchitectureDiagram, T-015 genesis.json)
- [x] T-017 [US1] Register GenesisVideo Composition in `src/Root.tsx` — 使用 GenesisDataSchema 作為 `schema` prop，綁定 `calculateMetadata`，defaultProps 從 `src/data/sample/genesis.json` 載入，fps=30, width=1920, height=1080
  (depends on T-016)

📍 **Checkpoint**: US1 完成 — `bun run speckit-to-genesis` → `bun run parse-archive` → Remotion Studio 預覽 GenesisVideo → 渲染為 MP4

---

## Phase 6: User Story 2 — Iteration 影片渲染 (P1) 🎯 MVP

**Goal**: 從 OpenSpec archived 產出生成 15-20 秒的迭代變更影片
**Independent Test**: 範例 `archived/001-xxx/` → `parse-archive.ts` → JSON → IterationVideo → MP4

### Implementation

- [x] T-018 [P] [US2] Create sample IterationData JSON in `src/data/sample/iteration-001.json` — 包含 iterationNumber="001"、specDiff before/after、5 個 tasks（4 completed + 1 skipped）、architecture 同 genesis、coloredModules=["auth","api"]、highlightModules=["api"]；完整符合 IterationDataSchema
  (depends on T-005 schemas)
  **禁止修改**: scripts/, src/components/, src/templates/, src/data/sample/genesis.json
- [x] T-019 [US2] Implement IterationVideo in `src/templates/IterationVideo.tsx` — 使用 `<TransitionSeries>` + `fade()` 編排場景：SceneTitle 變更標題卡 → SpecDiff before/after → TaskChecklist 動畫打勾 → ArchitectureDiagram（highlightModules 著色動畫）→ outro；實作 `calculateMetadata` 動態計算 durationInFrames — FR-004, FR-006
  (depends on T-008 SpecDiff, T-009 TaskChecklist, T-011 SceneTitle, T-012 ArchitectureDiagram, T-018 iteration-001.json)
- [x] T-020 [US2] Register IterationVideo Composition in `src/Root.tsx` — 使用 IterationDataSchema 作為 `schema` prop，綁定 `calculateMetadata`，defaultProps 從 `src/data/sample/iteration-001.json` 載入，fps=30, width=1920, height=1080
  (depends on T-019, T-017 — 同一檔案需循序修改)

📍 **Checkpoint**: US2 完成 — `bun run parse-archive` → Remotion Studio 預覽 IterationVideo → 渲染為 MP4

---

## Phase 7: Polish & Cross-Cutting

- [x] T-021 [P] Remove unused `MyComposition` from `src/Composition.tsx`，清除 `src/Root.tsx` 中的舊 MyComp import
- [x] T-022 Code cleanup: 確認所有 component props 零 `any` type、移除 TODO 和 unused imports
- [x] T-023 Verify parse-archive error handling: 測試 malformed markdown、缺少必要檔案、無效 NNN 格式的 error path — FR-029

---

## Dependency Graph

### Phase Flow
```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US-04) ⟂ Phase 4 (US-03) → Phase 5 (US-01) → Phase 6 (US-02) → Phase 7 (Polish)
```

> `⟂` = 可並行

### Task Dependencies
```
T-001 → T-002, T-003, T-004
T-002 → T-005, T-006
T-005 → T-007, T-008, T-009, T-010, T-011, T-012
T-006 → T-012
T-005 → T-013, T-014, T-015, T-018
T-007, T-010, T-011, T-012, T-015 → T-016
T-016 → T-017
T-008, T-009, T-011, T-012, T-018 → T-019
T-017, T-019 → T-020
```

### Cross-Story Dependencies
```
US-03 (T-012 ArchitectureDiagram) ← US-01 (T-016 GenesisVideo), US-02 (T-019 IterationVideo)
US-04 (T-007–T-011 共用 components) ← US-01 (T-016), US-02 (T-019)
T-017 (Root.tsx) → T-020 (Root.tsx) — 同一檔案需循序修改
```

> US-03 和 US-04 是 building blocks，被 US-01/US-02 依賴是預期的。US-01 和 US-02 之間除了共用 Root.tsx 外無直接依賴。

---

## Wave Execution Plan

| Wave | Tasks | Rationale |
|------|-------|-----------|
| 1 | T-001 | Setup 目錄結構 |
| 2 | T-002, T-003, T-004 | 安裝依賴 + config（T-003/T-004 parallel，不同檔案）|
| 3 | T-005, T-006 | Foundational（parallel，schemas.ts 和 theme.ts 不同檔案）|
| 4 | T-007, T-008, T-009, T-010, T-011, T-012 | 所有共用 components（parallel，每個都是獨立檔案）|
| 5 | T-013, T-014, T-015, T-018 | Scripts + sample data（parallel，scripts/ 和 src/data/ 不同路徑）|
| 6 | T-016, T-019 | Video templates（parallel，GenesisVideo.tsx 和 IterationVideo.tsx 不同檔案）|
| 7 | T-017 | Register Genesis in Root.tsx |
| 8 | T-020 | Register Iteration in Root.tsx（同一檔案，需在 T-017 後）|
| 9 | T-021, T-022, T-023 | Polish（parallel-ish，T-021 和 T-022 可同時）|

**Solo developer**: waves 循序執行，同 wave 內的 [P] tasks 任意順序。
**AI agents**: Wave 4 最適合 worktree 並行（6 個獨立 component），Wave 5 次之（4 個獨立腳本/資料）。

---

## Self-Validation

| Check | Pass? |
|-------|-------|
| Every user story from spec has tasks? | ✅ US-01～US-04（P1），US-05/US-06 為 P2 不在此 tasks |
| Every task has exact file path? | ✅ |
| Every task has [USn] label (except setup/foundational/polish)? | ✅ |
| No [P] tasks in same wave modify same file? | ✅ |
| Every [P] task has 禁止修改 constraint listed? | ✅ |
| 共用資源（types/, styles/）有唯一擁有者？ | ✅ T-005 owns types/, T-006 owns styles/, 其他 [P] 禁止修改 |
| P1 story completable without P2/P3? | ✅ US-05/US-06 完全不在依賴鏈中 |
| No circular dependencies? | ✅ |
| Waves respect all dependency arrows? | ✅ |
| Checkpoint after each user story? | ✅ |
