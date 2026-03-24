---
target_spec: video-composition.md
change: template-v2-fullstory-and-tooling
created_at: 2026-03-24
---

# Delta Spec: FullStory 合併影片 + defaultOutName 修正

## ADDED

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
**描述**: `calculateFullStoryMetadata` 根據 principles 數量和 iterations 數量動態計算總 frame 數。

**驗收場景**:
- **Scenario: 動態計算正確**
  - Given genesis 有 5 principles + 2 iterations（各有 4、6 個 tasks）
  - When calculateMetadata 計算
  - Then durationInFrames = Genesis 場景總和 + Σ(Iteration 場景) + separators - transitions overlap

## MODIFIED

### defaultOutName 副檔名
**ID**: REQ-004 (修正現有行為)
**Priority**: MUST
**變更原因**: 現有 `calculateGenesisMetadata` 和 `calculateIterationMetadata` 在 `defaultOutName` 中包含 `.mp4`，Remotion CLI 會再附加一次導致 `.mp4.mp4`
**原文**: `defaultOutName: "000-genesis-genesis.mp4"` / `defaultOutName: \`\${iterationNumber}-\${changeName}-iteration.mp4\``
**新版**: 移除 `.mp4` 後綴，交由 Remotion CLI 自動附加

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
