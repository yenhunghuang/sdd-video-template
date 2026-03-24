---
change: template-v2-fullstory-and-tooling
created_at: 2026-03-24
---

# Tasks: Template V2 — FullStory 合併影片 + 工具鏈強化

**Proposal**: proposal.md | **Design**: design.md
**Total**: 14 | **Done**: 14

## Tasks

### Phase 1: Bug Fix + Schema 基礎

- [x] T-001 [REQ-004] 修正 defaultOutName 雙重副檔名 — `src/templates/GenesisVideo.tsx`
  (depends on: none)
  移除 `calculateGenesisMetadata` 中 `defaultOutName` 的 `.mp4` 後綴：`"000-genesis-genesis.mp4"` → `"000-genesis-genesis"`

- [x] T-002 [P] [REQ-004] 修正 defaultOutName 雙重副檔名 — `src/templates/IterationVideo.tsx`
  (depends on: none)
  移除 `calculateIterationMetadata` 中 `defaultOutName` 的 `.mp4` 後綴

- [x] T-003 [REQ-002] 新增 FullStoryDataSchema — `src/types/schemas.ts`
  (depends on: none)
  新增 `FullStoryIterationSchema`（IterationData 去掉 type + architecture）和 `FullStoryDataSchema`（含頂層 architecture + iterations 陣列），export type `FullStoryData` 和 `FullStoryIteration`

📍 **Checkpoint**: `bun run lint` 通過，schema 定義正確

### Phase 2: FullStoryVideo Template

- [x] T-004 [REQ-001] 建立 FullStoryVideo template — `src/templates/FullStoryVideo.tsx`
  (depends on: T-003)
  實作 `FullStoryVideo` component：用 `<TransitionSeries>` 串接 Genesis 各場景 → Separator → Iteration 各場景（循環）→ Final Outro。架構圖從 props.architecture 取得，iteration 的 coloredModules/highlightModules 傳入。Export `calculateFullStoryMetadata` 動態計算 duration

- [x] T-005 [REQ-001] 建立 sample fullstory.json — `src/data/sample/fullstory.json`
  (depends on: T-003)
  組合現有 genesis.json 和 iteration-001.json 資料為 FullStoryData 格式：architecture 提升到頂層，iteration 去掉 type + architecture 欄位

- [x] T-006 [REQ-001] 在 Root.tsx 註冊 FullStoryVideo — `src/Root.tsx`
  (depends on: T-004, T-005)
  Import FullStoryVideo + calculateFullStoryMetadata + sample data，新增 `<Composition id="FullStoryVideo" ...>` 註冊

📍 **Checkpoint**: `bun dev` 啟動，Studio 可預覽 FullStoryVideo；`bun run lint` 通過

### Phase 3: ArchitectureDiagram 增強

- [x] T-007 [REQ-008] 自適應尺寸 — `src/components/ArchitectureDiagram.tsx`
  (depends on: none)
  將 MODULE_WIDTH/HEIGHT/GAP 從固定常數改為根據 gridCols × gridRows 動態計算，不超過原始預設值，確保 viewport 內完整顯示

- [x] T-008 [REQ-011] Module 文字自適應 — `src/components/ArchitectureDiagram.tsx`
  (depends on: T-007)
  根據 label 長度和計算後的 moduleWidth 動態調整 fontSize，最小 10px

- [x] T-009 [REQ-009] 連線 Label 顯示 — `src/components/ArchitectureDiagram.tsx`
  (depends on: T-007)
  在連線中點渲染 label text + 背景矩形，無 label 時不渲染

- [x] T-010 [REQ-010] 曲線連線 — `src/components/ArchitectureDiagram.tsx`
  (depends on: T-009)
  Manhattan distance > 2 的連線改用 `<path>` quadratic bezier，控制點偏移以避免穿越中間 modules

📍 **Checkpoint**: `bun dev` 預覽，用 sample data 視覺確認不同 module 數量的排版效果；既有 GenesisVideo / IterationVideo 渲染不受影響

### Phase 4: parse-archive 擴展

- [x] T-011 [REQ-005] 新增 OpenSpec 格式偵測 — `scripts/parse-archive.ts`
  (depends on: none)
  在 `nnnMatch` 失敗後新增 OpenSpec 日期格式偵測（`/^\d{4}-\d{2}-\d{2}-/`），使用 `design.md` 替代 `spec-delta.md`，保持 SpecKit 格式向後相容

- [x] T-012 [REQ-005] OpenSpec 檔案映射 — `scripts/parse-archive.ts`
  (depends on: T-011)
  OpenSpec 模式下：required files 改為 `proposal.md` + `tasks.md` + `design.md`，提取邏輯對應 design.md 的格式差異

- [x] T-013 [REQ-006] 批次解析模式 — `scripts/parse-archive.ts`
  (depends on: T-012)
  偵測 input 為包含多個 archive 子目錄的父目錄時：列出子目錄 → 分類排序 → 逐一解析 → 輸出到 --output 目錄（`genesis.json` + `iteration-NNN.json`）

📍 **Checkpoint**: 用 fixture 目錄測試 SpecKit / OpenSpec / 混合格式解析，JSON 通過 schema 驗證

### 收尾

- [x] T-014 確認所有測試通過：`bun run lint` + Studio 預覽 + 渲染測試
  (depends on: T-006, T-010, T-013)

## Dependency Graph

```
T-001 ─────────────────────────────────────────────────┐
T-002 (parallel with T-001) ───────────────────────────┤
T-003 → T-004 ─┐                                      │
T-003 → T-005 ─┤→ T-006 ─────────────────────────────→┤
T-007 → T-008                                         │
T-007 → T-009 → T-010 ───────────────────────────────→┤
T-011 → T-012 → T-013 ───────────────────────────────→┤
                                                       └→ T-014
```

**可並行的 task 群組**:
- Group A: T-001, T-002（bug fix，獨立）
- Group B: T-003 → T-004/T-005 → T-006（FullStory，序列）
- Group C: T-007 → T-008/T-009 → T-010（ArchitectureDiagram，序列）
- Group D: T-011 → T-012 → T-013（parse-archive，序列）

Groups A/B/C/D 之間互相獨立，可並行開發。
