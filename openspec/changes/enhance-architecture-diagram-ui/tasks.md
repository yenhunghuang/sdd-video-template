---
change: enhance-architecture-diagram-ui
created_at: 2026-03-24T23:35:00+08:00
---

# Tasks: 架構圖 UI 增強

**Proposal**: proposal.md | **Design**: design.md
**Total**: 10 | **Done**: 10

## Tasks

### Phase 1: Schema 清理

- [x] T-001 [P] 移除 `ModuleDefinitionSchema` 的 `position` 欄位 — `src/types/schemas.ts`
  [REQ-008 modified] 移除 `position: z.object({ row: z.number(), col: z.number() })`，確認 Zod v4 預設 strip unknown keys
  (depends on: none)
- [x] T-002 [P] 移除 sample JSON 中所有 modules 的 `position` 欄位 — `src/data/sample/genesis.json`, `src/data/sample/iteration-001.json`, `src/data/sample/fullstory.json`
  [REQ-008 modified] 清除 `"position": { "row": N, "col": N }` 欄位
  (depends on: none)

📍 **Checkpoint**: `bun run lint` 通過，Studio preview 渲染正常（`position` 移除不影響現有佈局邏輯）

### Phase 2: 佈局修正（P0）

- [x] T-003 統一所有 layer 容器寬度 — `src/components/ArchitectureDiagram.tsx`
  [REQ-019] 計算 `maxLayerW`，所有 layer 使用相同寬度，重新計算 `x`（置中）和 `modulePositions`
  (depends on: none)
- [x] T-004 修正 accent bar 圓角裁切 — `src/components/ArchitectureDiagram.tsx`
  [REQ-020] 為每個模組卡片加 `<clipPath>` 定義，accent bar 放在 clipPath 內
  (depends on: none)

📍 **Checkpoint**: Studio preview 確認所有層等寬對齊、accent bar 在圓角區域正確裁切

### Phase 3: 動畫與連線（P1）

- [x] T-005 實作逐層入場動畫 — `src/components/ArchitectureDiagram.tsx`
  [REQ-021] 新增 `STAGGER_FRAMES` 常數，每層用 `spring()` 計算 `layerProgress`，控制 `opacity` + `translateY`；連線用 `min(sourceLayerProgress, targetLayerProgress)` 延遲顯示
  (depends on: T-003)
- [x] T-006 連線起終點改為模組邊緣 — `src/components/ArchitectureDiagram.tsx`
  [REQ-022] 新增 `getEdgePoint()` 函式，根據兩模組相對位置判斷從上/下/左/右邊出發；`moduleCenters` 改為 `moduleRects`（含 x, y, w, h）
  (depends on: T-003)

📍 **Checkpoint**: Studio preview 確認逐層動畫流暢、連線不穿越模組、連線在兩端模組出現後才顯示

### Phase 4: 細節修正（P2）

- [x] T-007 修正 connection label 寬度計算 — `src/components/ArchitectureDiagram.tsx`
  [REQ-023] 新增 `estimateTextWidth()` 函式，區分中英文字元寬度，label 背景矩形使用 `estimateTextWidth() + padding`
  (depends on: none)

📍 **Checkpoint**: 有 label 的連線文字完整顯示在背景矩形內

### Phase 5: 驗證收尾

- [x] T-008 全模板 Studio preview 回歸驗證 — 無檔案變更
  確認 GenesisVideo、IterationVideo、FullStoryVideo 三個模板在 sample data 下渲染正確
  (depends on: T-005, T-006, T-007)
- [x] T-009 清理：移除未用的 import、TODO
  (depends on: T-008)
- [x] T-010 確認 `bun run lint` 通過
  (depends on: T-009)

## Dependency Graph

```
T-001 (parallel)
T-002 (parallel)
T-003 ──┬──→ T-005
        └──→ T-006
T-004 (parallel with T-003)
T-007 (parallel with T-005, T-006)
T-005 ──┬
T-006 ──┼──→ T-008 → T-009 → T-010
T-007 ──┘
```
