---
change: template-v2-fullstory-and-tooling
created_at: 2026-03-24
---

# 技術設計: Template V2 — FullStory 合併影片 + 工具鏈強化

## 方案概述

新增 `FullStoryDataSchema` 和 `FullStoryVideo` template，將 Genesis 場景和 N 個 Iteration 場景串接成一支完整演進影片。同時擴展 `parse-archive.ts` 支援 OpenSpec 目錄格式，強化 `ArchitectureDiagram` 的自適應排版和連線渲染。

## 影響範圍分析

| 模組/檔案 | 影響類型 | 說明 |
|-----------|---------|------|
| `src/types/schemas.ts` | 修改 | 新增 `FullStoryDataSchema`，含 `FullStoryIterationSchema`（無 architecture 的輕量 iteration） |
| `src/templates/GenesisVideo.tsx` | 修改 | `defaultOutName` 移除 `.mp4` 後綴 |
| `src/templates/IterationVideo.tsx` | 修改 | `defaultOutName` 移除 `.mp4` 後綴 |
| `src/templates/FullStoryVideo.tsx` | 新增 | FullStory composition，組合 Genesis + N Iterations |
| `src/Root.tsx` | 修改 | 註冊 FullStoryVideo composition，import sample data |
| `src/data/sample/fullstory.json` | 新增 | FullStoryVideo 的 sample data |
| `src/components/ArchitectureDiagram.tsx` | 修改 | 自適應尺寸、連線 label、曲線連線、文字自適應 |
| `scripts/parse-archive.ts` | 修改 | 支援 OpenSpec 目錄格式、批次解析模式 |

## 實作方案

### 1. defaultOutName 修正 [#1]

所有 `calculateMetadata` 函式中 `defaultOutName` 移除 `.mp4` 後綴：

```typescript
// Before
defaultOutName: "000-genesis-genesis.mp4"
// After
defaultOutName: "000-genesis-genesis"
```

影響檔案：`GenesisVideo.tsx:245`、`IterationVideo.tsx:126`

### 2. FullStoryData Schema [#2, #3]

在 `schemas.ts` 新增：

```typescript
// Iteration 在 FullStory 中的輕量版（無 architecture）
export const FullStoryIterationSchema = z.object({
  iterationNumber: z.string(),
  changeName: z.string(),
  summary: z.string(),
  motivation: z.string(),
  specDiff: z.object({ before: z.string(), after: z.string() }),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(["completed", "skipped"]),
  })),
  coloredModules: z.array(z.string()),
  highlightModules: z.array(z.string()),
});

export const FullStoryDataSchema = z.object({
  type: z.literal("fullstory"),
  projectName: z.string(),
  tagline: z.string(),
  principles: z.array(z.object({ title: z.string(), description: z.string() })),
  architecture: ArchitectureDefinitionSchema,  // 頂層共用
  taskSummary: z.object({
    total: z.number(),
    categories: z.array(z.object({ name: z.string(), count: z.number() })),
  }),
  targetUsers: z.array(z.string()),
  iterations: z.array(FullStoryIterationSchema),
});
```

這解決 #3（architecture 去重）：architecture 定義一次在頂層，每個 iteration 只帶 `coloredModules` + `highlightModules`。

### 3. FullStoryVideo Template [#2]

場景結構：

```
Genesis Title → Principles → Architecture → Task Summary
  ↓ fade
[Separator: #001 changeName]
  ↓ fade
Iteration #001: Title → SpecDiff → Tasks → Architecture (highlight)
  ↓ fade
[Separator: #002 changeName]
  ↓ fade
Iteration #002: ...
  ↓ fade
Final Outro: projectName + total stats
```

**Timing 策略**：FullStory 的各場景沿用 Genesis/Iteration 的 timing 常數，但 Genesis 的 ARCH_FRAMES 和 OUTRO_FRAMES 可略短（因為架構圖在後續 iteration 中會重複出現）。

**Separator scene**：獨立的 `<SceneTitle>` 顯示 `#${iterationNumber}` 和 `changeName`，duration 60 frames（2 秒）。

**calculateFullStoryMetadata**：
```typescript
genesisDuration = TITLE + principles + ARCH + TASKS + OUTRO - transitions
iterationDuration(it) = TITLE + SPEC_DIFF + tasks(it) + ARCH + OUTRO - transitions
separatorDuration = 60
total = genesisDuration + Σ(separatorDuration + iterationDuration(it)) + FINAL_OUTRO
      - (iterations.length + 1) * TRANSITION_FRAMES  // inter-section transitions
```

### 4. parse-archive OpenSpec 支援 [#4]

**格式偵測**（在現有 `nnnMatch` 之後加入）：

```typescript
const isOpenSpec = /^\d{4}-\d{2}-\d{2}-/.test(dirName);
const isSpecKit = /^\d{3}-/.test(dirName);
```

**OpenSpec 檔案映射**：
| SpecKit | OpenSpec |
|---------|---------|
| `spec-delta.md` | `design.md`（fallback: `specs/` 目錄下的 delta spec 合併） |
| `proposal.md` | `proposal.md`（相同） |
| `tasks.md` | `tasks.md`（相同） |

**批次模式**：新增 `--batch` flag 或自動偵測（input 目錄含多個子目錄時啟用）。邏輯：
1. 列出所有子目錄
2. 分類：`000-*` → genesis，其餘按名稱（SpecKit NNN 排序 / OpenSpec 日期排序）→ iterations
3. 逐一解析，iteration 序號自動編排 `001`, `002`, ...
4. 輸出到 `--output` 目錄

**向後相容**：單一 `NNN-name/` 輸入時行為完全不變。

### 5. ArchitectureDiagram 增強 [#5]

#### 自適應尺寸

```typescript
const BASE_MODULE_WIDTH = 200;
const BASE_MODULE_HEIGHT = 80;
const MIN_MODULE_WIDTH = 120;
const MIN_MODULE_HEIGHT = 50;
const PADDING = 100; // viewport 邊界留白

// 計算可用空間
const availWidth = width - 2 * PADDING;
const availHeight = height - TITLE_HEIGHT - 2 * PADDING;

// 根據 grid 大小動態調整
const maxCellWidth = availWidth / gridCols;
const maxCellHeight = availHeight / gridRows;

const moduleWidth = Math.min(BASE_MODULE_WIDTH, maxCellWidth * 0.7);
const moduleHeight = Math.min(BASE_MODULE_HEIGHT, maxCellHeight * 0.6);
const gapX = Math.min(GAP_X, (maxCellWidth - moduleWidth));
const gapY = Math.min(GAP_Y, (maxCellHeight - moduleHeight));
```

不超過原始預設值，避免少量 module 時過度放大。

#### 連線 Label

在連線中點（`midX`, `midY`）渲染：
1. 計算中點座標
2. 渲染背景 `<rect>`（`fill={THEME.bg}`, 略大於文字）
3. 渲染 `<text>`（fontSize 10, fill 與線色相同）

#### 曲線連線

判斷條件：若 `|from.row - to.row| + |from.col - to.col| > 2`，使用 quadratic bezier：
- 控制點偏移方向：垂直於連線方向，偏移量與距離成正比
- 實作：`<path d="M x1 y1 Q cx cy x2 y2" />`

相鄰 module（Manhattan distance ≤ 2）維持直線 `<line>`。

#### 文字自適應

```typescript
// 根據 label 長度和 module 寬度計算 fontSize
const baseFontSize = 14;
const maxChars = moduleWidth / (baseFontSize * 0.6); // 估算可容納字元數
const fontSize = label.length > maxChars
  ? Math.max(10, baseFontSize * (maxChars / label.length))
  : baseFontSize;
```

### 關鍵決策

| 決策 | 選擇 | 替代方案 | 原因 |
|------|------|---------|------|
| Architecture 去重方式 | FullStory 頂層共用 | Reference 機制 ($ref) | 頂層共用最簡單，不需要 JSON reference resolver |
| FullStory timing | 沿用原始 timing 常數 | 壓縮版（所有場景縮短） | 保持一致性，使用者可自行調整資料量控制影片長度 |
| 曲線判斷條件 | Manhattan distance > 2 | 所有連線都用曲線 | 短距離曲線不自然，直線更清晰 |
| OpenSpec 格式偵測 | 自動偵測（regex） | `--format` flag | 減少使用者記憶負擔，兩種格式不會衝突 |
| 批次解析觸發 | 自動偵測（子目錄存在） | 強制 `--batch` flag | 單目錄和批次場景自動區分，不增加 flag |

## 資料變更

### 新增 Schema

- `FullStoryIterationSchema`: IterationData 去掉 `type` 和 `architecture` 的子集
- `FullStoryDataSchema`: GenesisData + architecture + iterations 組合

### 現有 Schema 不變

`GenesisDataSchema` 和 `IterationDataSchema` 保持不變，確保向後相容。

## 測試策略

- **Schema 驗證**: 用 sample fullstory.json 測試 `FullStoryDataSchema.safeParse()`
- **Duration 計算**: 單元測試 `calculateFullStoryMetadata`，驗證不同 iteration 數量下的 frame 計算
- **parse-archive**: 用 fixture 目錄測試 SpecKit / OpenSpec / 混合格式的解析
- **ArchitectureDiagram**: 用 Remotion Studio 視覺驗證不同 module 數量（4, 9, 15）的排版
- **defaultOutName**: 渲染後檢查輸出檔名無雙重副檔名
- **回歸測試**: 確認 GenesisVideo 和 IterationVideo 獨立渲染不受影響

## 向後相容性

- **不是 breaking change**：所有現有 schema、template、CLI 行為保持不變
- `GenesisDataSchema` / `IterationDataSchema` 不修改
- `parse-archive` 單目錄 SpecKit 格式行為不變
- ArchitectureDiagram props 介面不變（自適應邏輯為內部實作變更）
- 唯一可見變化：輸出檔名不再有 `.mp4.mp4`（這是 bug fix，不是 breaking change）
