# Video Composition 規格

## 需求

### FullStoryVideo Composition
**ID**: REQ-001
**Priority**: MUST
**描述**: 新增 `FullStoryVideo` composition，將 Genesis 和多個 Iteration 合併成一支完整演進影片。

**驗收場景**:
- **Scenario: 基本合併渲染**
  - Given 一個 FullStoryData JSON 包含 genesis + 2 個 iterations
  - When 執行 `bun run render -- FullStoryVideo`
  - Then 產出單一 MP4，場景順序為 Genesis Title → Principles → Architecture → Task Summary → Iteration #001 Title → SpecDiff → Tasks → Architecture → Iteration #002 Title → SpecDiff → Tasks → Architecture → Final Outro

- **Scenario: Iteration 間 separator**
  - Given FullStoryData 包含 2+ iterations
  - When 渲染完成
  - Then 每個 iteration 前有 separator scene 顯示 iteration 編號和名稱

- **Scenario: Studio 預覽**
  - Given FullStoryVideo 已在 Root.tsx 註冊
  - When 使用者執行 `bun dev`
  - Then Studio sidebar 顯示 FullStoryVideo composition，可用 sample data 預覽

### FullStoryData Schema
**ID**: REQ-002
**Priority**: MUST
**描述**: 新增 `FullStoryDataSchema`，architecture 定義一次於頂層，iterations 不重複 architecture。

**驗收場景**:
- **Scenario: Schema 驗證**
  - Given 一個 JSON 物件符合 `{ type: "fullstory", projectName, tagline, principles, architecture, taskSummary, targetUsers, iterations: [...] }`
  - When 以 `FullStoryDataSchema.safeParse()` 驗證
  - Then 驗證成功，iterations 中的每個項目不含 `architecture` 欄位

- **Scenario: Iteration 只帶差異資料**
  - Given FullStoryData 的 iteration 項目
  - When 檢視其結構
  - Then 只包含 `iterationNumber`, `changeName`, `summary`, `motivation`, `specDiff`, `tasks`, `coloredModules`, `highlightModules`（無 `architecture`）

### 動態 Duration 計算
**ID**: REQ-003
**Priority**: MUST
**描述**: `calculateFullStoryMetadata` 根據 principles 數量和 iterations 數量動態計算總 frame 數。業務模式時，每個 iteration 額外加上 `BUSINESS_SUMMARY_FRAMES`。

**驗收場景**:
- **Scenario: 動態計算正確**
  - Given genesis 有 5 principles + 2 iterations（各有 4、6 個 tasks）
  - When calculateMetadata 計算
  - Then durationInFrames = Genesis 場景總和 + Σ(Iteration 場景) + separators - transitions overlap

- **Scenario: 業務模式 duration 正確**
  - Given `audience: "business"` 且 `businessImpact` 存在
  - When calculateMetadata 計算
  - Then durationInFrames 包含每個 iteration 的 BusinessSummaryScene 時長

### defaultOutName 副檔名
**ID**: REQ-004
**Priority**: MUST
**描述**: 所有 `calculateMetadata` 的 `defaultOutName` 不包含 `.mp4` 後綴，交由 Remotion CLI 自動附加。

**驗收場景**:
- **Scenario: Genesis 輸出**
  - Given 執行 `bun run render -- GenesisVideo`
  - When 渲染完成
  - Then 輸出檔名為 `out/000-genesis-genesis.mp4`（無雙重副檔名）

- **Scenario: Iteration 輸出**
  - Given 執行 `bun run render -- IterationVideo`
  - When 渲染完成
  - Then 輸出檔名為 `out/001-add-user-authentication-iteration.mp4`（無雙重副檔名）

- **Scenario: FullStory 輸出**
  - Given 執行 `bun run render -- FullStoryVideo`
  - When 渲染完成
  - Then 輸出檔名無雙重副檔名

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
