---
changeName: add-business-audience-layer
---

# Proposal: 業務受眾展示層

## Sign-off

| Role | Name | Status | Date |
|------|------|--------|------|
| 業務/PM | — | ✅ 已確認 | 2026-03-24 |

### Review Notes
<!-- 確認 proposal 的變更範圍：只影響影片展示層，不改動 SDD 開發流程 -->

---

## 動機

目前影片內容（SpecDiff、TaskChecklist、ArchitectureDiagram）使用技術語言撰寫，PM、業務、主管等非技術受眾難以理解。例如 specDiff 顯示「所有 API 需要 JWT token 驗證」——不熟悉 JWT 的人無法從中得到有意義的資訊。

影片的技術內容已經到位，缺的是一層「翻譯」，讓同一份 spec 資料能用業務語言重新呈現。

## 目標

1. 非技術受眾觀看影片後，能理解每次迭代「做了什麼」和「為什麼做」
2. 影片可根據 audience（技術 vs 業務）切換呈現方式
3. 不改動現有 SDD 工作流程（spec→code→verify），業務語言在 parse-archive 階段衍生產出

## 範圍

### 會做

- Schema 擴充：在 `IterationDataSchema` 和 `FullStoryIterationSchema` 加 optional 業務欄位（`businessImpact`、`businessSpecDiff`、`businessTasks`）
- parse-archive 擴充：從現有 `motivation`、`specDiff`、`tasks` 自動衍生業務版文字（fallback：直接使用原文）
- 新增 `BusinessSummaryScene` 元件：在 SpecDiff 之前展示一句話的業務影響摘要
- SpecDiff 元件調整：支援顯示業務版 before/after（用白話文描述情境變化）
- TaskChecklist 元件調整：支援顯示業務版 task 標題（描述業務成果而非技術實作）
- ArchitectureDiagram 元件調整：highlight 的模組旁顯示「這次改了什麼」的業務旁註
- GenesisVideo / IterationVideo / FullStoryVideo 支援 `audience` 參數切換技術/業務模式

### 不做

- 不改 SDD 流程中的 spec/proposal/design/tasks 格式
- 不建立獨立的「業務版 template」— 用同一個 template + audience 參數切換
- 不整合 LLM 自動翻譯（P2 — 先用手動撰寫或 parse-archive 規則轉換）
- 不新增音訊/旁白功能（獨立迭代）

## 影響分析

- **使用者影響**: 影片觀看者可看到業務友善的內容呈現；影片製作者的 SDD 流程不受影響
- **技術影響**: `schemas.ts`（加欄位）、`parse-archive.ts`（加衍生邏輯）、所有 template 和部分 component（加 audience 切換）
- **風險**: 業務欄位為 optional + fallback，現有 JSON data 不需修改即可渲染，向後相容風險低

## 成功標準

1. 現有 sample JSON（無業務欄位）在新版 template 中渲染結果與修改前完全一致
2. 帶有業務欄位的 JSON 在 `audience: "business"` 模式下，影片中不出現技術術語（JWT、endpoint、middleware 等）
3. PM/業務人員觀看業務模式影片後，能用自己的話描述該迭代做了什麼（定性驗證）
