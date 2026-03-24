---
target_spec: video-composition.md
change: add-business-audience-layer
created_at: 2026-03-24T22:10:00+08:00
---

# Delta Spec: 業務受眾展示層 — Video Composition

## ADDED

### Audience 參數支援
**ID**: REQ-012
**Priority**: MUST
**描述**: 所有 video data schema（`IterationDataSchema`、`FullStoryDataSchema`、`FullStoryIterationSchema`）新增 `audience` 欄位（`"technical" | "business"`，預設 `"technical"`），以及 optional 業務欄位。

**驗收場景**:
- **Scenario: 預設向後相容**
  - Given 現有 JSON data 無 `audience` 欄位
  - When 以新版 schema 驗證
  - Then 驗證成功，`audience` 預設為 `"technical"`，業務欄位為 undefined

- **Scenario: 業務模式 JSON 驗證**
  - Given JSON 包含 `audience: "business"` 和 `businessImpact`、`businessSpecDiff` 欄位
  - When 以 schema 驗證
  - Then 驗證成功

### 業務欄位定義
**ID**: REQ-013
**Priority**: MUST
**描述**: `IterationDataSchema` 和 `FullStoryIterationSchema` 新增以下 optional 欄位：
- `businessImpact`: string — 一句話描述業務影響（非技術語言）
- `businessSpecDiff`: `{ before: string, after: string }` — 用業務情境描述變更前後
- `businessTasks`: `Array<{ id, title, status }>` — 用業務成果描述的 task 標題

**驗收場景**:
- **Scenario: 業務欄位 fallback**
  - Given JSON 的 `audience` 為 `"business"` 但無 `businessSpecDiff`
  - When template 渲染
  - Then 使用原始 `specDiff` 內容（graceful fallback）

### BusinessSummaryScene 元件
**ID**: REQ-014
**Priority**: MUST
**描述**: 新增 `BusinessSummaryScene` 元件，在每個 iteration 的 SpecDiff 場景之前顯示 `businessImpact` 文字（大字置中、fade-in 動畫）。

**驗收場景**:
- **Scenario: 業務模式顯示**
  - Given `audience: "business"` 且 `businessImpact` 存在
  - When 渲染 iteration 段落
  - Then SpecDiff 之前出現 BusinessSummaryScene，顯示 businessImpact 文字

- **Scenario: 技術模式不顯示**
  - Given `audience: "technical"`
  - When 渲染 iteration 段落
  - Then 不出現 BusinessSummaryScene，場景順序與修改前一致

### Architecture 業務旁註
**ID**: REQ-015
**Priority**: SHOULD
**描述**: `ArchitectureDiagram` 在 `audience: "business"` 模式下，highlight 的模組旁顯示業務旁註（從 `businessTasks` 或 `businessImpact` 衍生）。

**驗收場景**:
- **Scenario: 旁註顯示**
  - Given `audience: "business"` 且有 highlight modules
  - When 渲染架構圖
  - Then highlight 模組旁出現簡短業務說明文字

- **Scenario: 技術模式無旁註**
  - Given `audience: "technical"`
  - When 渲染架構圖
  - Then 行為與修改前一致，無旁註

### FullStoryVideo 業務模式場景順序
**ID**: REQ-016
**Priority**: MUST
**描述**: FullStoryVideo 在 `audience: "business"` 模式下，每個 iteration 的場景順序調整為：Separator → BusinessSummary → SpecDiff（業務版）→ Tasks（業務版）→ Architecture（含旁註）。

**驗收場景**:
- **Scenario: 業務模式場景順序**
  - Given FullStoryData 含 2 iterations，`audience: "business"`
  - When 渲染完成
  - Then 每個 iteration 段落在原本的 Title 場景後插入 BusinessSummaryScene

## MODIFIED

### 動態 Duration 計算
**ID**: REQ-003 (existing)
**變更原因**: 業務模式新增 BusinessSummaryScene，影響總 frame 數
**原文**: `calculateMetadata` 根據 principles 和 iterations 數量計算
**新版**: 業務模式時，每個 iteration 額外加上 `BUSINESS_SUMMARY_FRAMES`

**驗收場景**:
- **Scenario: 業務模式 duration 正確**
  - Given `audience: "business"` 且 `businessImpact` 存在
  - When calculateMetadata 計算
  - Then durationInFrames 包含每個 iteration 的 BusinessSummaryScene 時長
