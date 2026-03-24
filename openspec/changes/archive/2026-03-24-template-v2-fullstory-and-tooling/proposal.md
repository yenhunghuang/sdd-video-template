---
change: template-v2-fullstory-and-tooling
created_at: 2026-03-24
---

# Proposal: Template V2 — FullStory 合併影片 + 工具鏈強化

## Sign-off

| Role | Name | Status | Date |
|------|------|--------|------|
| 業務/PM | yen | ✅ 已確認 | 2026-03-24 |

### Review Notes
<!-- 業務確認 proposal 是否正確描述了變更意圖和範圍 -->

---

## 動機

SDD Video Template 目前只能分別產出 Genesis 和 Iteration 單支影片，但實際展示場景（給 PM / 業務 / 客戶）最常見的需求是**一支完整的專案演進影片**。目前要做到這件事需要手動建立 schema、拼接 composition、計算 frame offset，摩擦極大。

同時，parse-archive 工具只支援 SpecKit 格式（`NNN-name/`），完全無法處理 OpenSpec 工作流（`YYYY-MM-DD-name/`），使得 OpenSpec 專案必須手動撰寫所有 JSON 資料。

此外，架構圖元件在 module 數量較多時有排版溢出、連線重疊、label 未顯示等問題，影響影片品質。

## 目標

1. 使用者可用一個 composition 產出「Genesis → N Iterations → Outro」的完整演進影片
2. parse-archive 同時支援 SpecKit 和 OpenSpec 兩種 archive 格式，自動偵測
3. 架構圖在 module 數量 6-15 時仍能正確排版，連線不重疊，label 可見
4. 修復 defaultOutName 雙重副檔名 bug
5. FullStory 層級共用 architecture 定義，iteration 不再重複完整模組列表

## 範圍

### 會做

- **[#1]** 修復所有 calculateMetadata 中 defaultOutName 的 `.mp4` 雙重副檔名
- **[#2]** 新增 `FullStoryDataSchema` + `FullStoryVideo` composition，支援 Genesis + N Iterations 合併
- **[#3]** 在 FullStoryData 中架構定義提升到頂層，iteration 只帶 `coloredModules` + `highlightModules`
- **[#4]** parse-archive 自動偵測 SpecKit (`NNN-`) / OpenSpec (`YYYY-MM-DD-`) 格式並正確解析
- **[#5]** ArchitectureDiagram 自適應尺寸、連線 label 顯示、曲線連線避免穿越

### 不做

- 不實作 P2 的 EvolutionVideo / SprintReview（已有 schema 但不在此次範圍）
- 不修改 speckit-to-genesis.ts（它只負責 SpecKit→archive 轉換，不受影響）
- 不新增語音合成/旁白功能
- 不建立 CLI 的 `--data-dir` 自動發現機制（可在後續迭代處理）
- 不改 GenesisData / IterationData 的現有 schema 結構（向後相容）

## 影響分析

- **使用者影響**: 新增 FullStoryVideo composition 可在 Studio 預覽；parse-archive 可直接處理 OpenSpec archived 目錄；架構圖視覺品質提升
- **技術影響**: 新增 schema (`FullStoryDataSchema`)、新增 template (`FullStoryVideo.tsx`)、修改 `ArchitectureDiagram.tsx`、修改 `parse-archive.ts`、修改 `GenesisVideo.tsx` 和 `IterationVideo.tsx` 的 `calculateMetadata`
- **風險**: ArchitectureDiagram 自適應邏輯可能影響現有 Genesis/Iteration 影片的排版（需回歸測試）

## 成功標準

1. `bun run render -- FullStoryVideo` 產出包含 Genesis + N Iterations 的單一 MP4，檔名無雙重副檔名
2. `bun run parse-archive -- --input <openspec-archived-dir>` 能正確解析 `YYYY-MM-DD-name/` 格式目錄
3. 9+ modules 的架構圖不溢出 1920×1080 viewport，連線 label 可見，跨多行連線不穿越中間 module
4. 既有 GenesisVideo / IterationVideo 的渲染結果不因此次變更而壞掉
