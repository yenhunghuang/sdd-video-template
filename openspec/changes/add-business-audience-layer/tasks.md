---
change: add-business-audience-layer
created_at: 2026-03-24T22:10:00+08:00
---

# Tasks: 業務受眾展示層

**Proposal**: proposal.md | **Design**: design.md
**Total**: 11 | **Done**: 0

## Tasks

### Phase 1: Schema 擴充

- [ ] T-001 [P] 擴充 `IterationDataSchema` 加 `audience`、`businessImpact`、`businessSpecDiff`、`businessTasks` optional 欄位 — `src/types/schemas.ts`
  (depends on: none)
- [ ] T-002 [P] 擴充 `FullStoryIterationSchema` 加 `businessImpact`、`businessSpecDiff`、`businessTasks` optional 欄位；`FullStoryDataSchema` 頂層加 `audience` — `src/types/schemas.ts`
  (depends on: none)

📍 **Checkpoint**: `bun run lint` 通過，現有 sample JSON 仍能通過 schema 驗證

### Phase 2: 新元件 + 元件調整

- [ ] T-003 [P] 新增 `BusinessSummaryScene` 元件 — `src/components/BusinessSummaryScene.tsx`
  [REQ-014] 接受 `impact: string` prop，大字置中 + fade-in/scale 動畫，使用 `useCurrentFrame()` + `spring()`
  (depends on: none)
- [ ] T-004 [P] `ArchitectureDiagram` 加 optional `moduleAnnotations` prop — `src/components/ArchitectureDiagram.tsx`
  [REQ-015] 型別 `Record<string, string>`，在 highlight 模組下方渲染旁註小字
  (depends on: none)

📍 **Checkpoint**: 兩個元件可獨立在 Studio 中 preview（用臨時 Composition 或 storybook 式驗證）

### Phase 3: Template 整合

- [ ] T-005 `IterationVideo` 根據 audience 選擇資料來源 + 條件插入 BusinessSummaryScene — `src/templates/IterationVideo.tsx`
  [REQ-012, REQ-014, REQ-016] 業務模式：SpecDiff 前插入 BusinessSummaryScene，傳入 business 版 props；技術模式：行為不變
  (depends on: T-001, T-003)
- [ ] T-006 `FullStoryVideo` 同理調整 iteration 段落 — `src/templates/FullStoryVideo.tsx`
  [REQ-016] 每個 iteration 的 iterationElements 條件插入 BusinessSummaryScene，傳入 business 版 props 給 SpecDiff / TaskChecklist / ArchitectureDiagram
  (depends on: T-002, T-003, T-004)
- [ ] T-007 更新 `calculateIterationMetadata` 和 `calculateFullStoryMetadata` — `src/templates/IterationVideo.tsx`, `src/templates/FullStoryVideo.tsx`
  [REQ-003 modified] 業務模式時每個 iteration 加上 BUSINESS_SUMMARY_FRAMES
  (depends on: T-005, T-006)

📍 **Checkpoint**: `bun run lint` 通過；Studio preview 技術模式渲染結果與修改前一致

### Phase 4: parse-archive 擴充

- [ ] T-008 新增業務欄位衍生函式 — `scripts/parse-archive.ts`
  [REQ-017] `extractBusinessImpact()`、`extractBusinessSpecDiff()`、`extractBusinessTasks()`，支援 frontmatter 手動覆寫
  (depends on: T-001)
- [ ] T-009 加 `--audience` CLI 參數 — `scripts/parse-archive.ts`
  [REQ-018] `parseArgs` 新增 `audience` option，產出 JSON 設定 `audience` 欄位
  (depends on: T-008)

📍 **Checkpoint**: `bun run parse-archive -- --input openspec/archived/000-genesis/ --audience business` 產出含業務欄位的 JSON

### Phase 5: Sample Data + 驗證

- [ ] T-010 更新 sample JSON 加業務欄位範例 — `src/data/sample/iteration-001.json`, `src/data/sample/fullstory.json`
  加入 `businessImpact`、`businessSpecDiff`、`businessTasks` 範例資料
  (depends on: T-001, T-002)
- [ ] T-011 驗證：技術模式 + 業務模式 Studio preview 確認 — 無檔案變更
  確認現有 JSON（無業務欄位）渲染不變；帶業務欄位 JSON 在兩種 audience 下正確渲染
  (depends on: T-005, T-006, T-010)

### 收尾

- [ ] T-012 清理：移除 TODO、未用的 import
- [ ] T-013 確認 `bun run lint` 通過

## Dependency Graph

```
T-001 ──┬──→ T-005 ──→ T-007
        ├──→ T-008 ──→ T-009
        └──→ T-010 ──→ T-011
T-002 ──┬──→ T-006 ──→ T-007
        └──→ T-010
T-003 ──┬──→ T-005
        └──→ T-006
T-004 ──────→ T-006
```
