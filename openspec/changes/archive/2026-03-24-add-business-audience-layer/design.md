---
change: add-business-audience-layer
created_at: 2026-03-24T22:10:00+08:00
---

# 技術設計: 業務受眾展示層

## 方案概述

在現有 schema 加 optional 業務欄位 + `audience` discriminator，讓同一個 template 根據 audience 值選擇顯示技術或業務內容。parse-archive 負責從現有資料衍生業務文字。所有變更向後相容，現有 JSON 不需修改。

## 影響範圍分析

| 模組/檔案 | 影響類型 | 說明 |
|-----------|---------|------|
| `src/types/schemas.ts` | 修改 | 加 `audience`、`businessImpact`、`businessSpecDiff`、`businessTasks` optional 欄位 |
| `src/components/BusinessSummaryScene.tsx` | 新增 | 大字置中顯示 businessImpact，fade-in 動畫 |
| `src/components/SpecDiff.tsx` | 修改 | 無需改動元件本身 — template 層決定傳入 technical 或 business 版 props |
| `src/components/TaskChecklist.tsx` | 修改 | 同上，template 層傳入不同 tasks array |
| `src/components/ArchitectureDiagram.tsx` | 修改 | 加 optional `moduleAnnotations` prop，業務模式下顯示旁註文字 |
| `src/templates/IterationVideo.tsx` | 修改 | 根據 audience 選擇資料來源、條件插入 BusinessSummaryScene |
| `src/templates/FullStoryVideo.tsx` | 修改 | 同上，iteration 段落條件插入 BusinessSummaryScene |
| `src/templates/GenesisVideo.tsx` | 修改 | 小幅調整：audience 傳遞（genesis 場景本身無業務/技術差異） |
| `scripts/parse-archive.ts` | 修改 | 加業務欄位衍生函式、`--audience` CLI 參數 |
| `src/data/sample/iteration-001.json` | 修改 | 加業務欄位範例資料 |
| `src/data/sample/fullstory.json` | 修改 | 同上 |

## 實作方案

### Schema 擴充

```typescript
// schemas.ts — IterationDataSchema 新增欄位
audience: z.enum(["technical", "business"]).default("technical").optional(),
businessImpact: z.string().optional(),
businessSpecDiff: z.object({
  before: z.string(),
  after: z.string(),
}).optional(),
businessTasks: z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(["completed", "skipped"]),
  }),
).optional(),
```

`FullStoryIterationSchema` 同理加 `businessImpact`、`businessSpecDiff`、`businessTasks`。
`FullStoryDataSchema` 頂層加 `audience`（iterations 內的各項不需重複 audience）。

### Template 資料選擇邏輯

在 template 中用 helper 選擇資料來源：

```typescript
// 在 template 內（非獨立 util）
const specDiff = audience === "business" && businessSpecDiff
  ? businessSpecDiff
  : props.specDiff;
const tasks = audience === "business" && businessTasks
  ? businessTasks
  : props.tasks;
```

不建立獨立 utility — 邏輯簡單，inline 在 template 即可。

### BusinessSummaryScene 元件

與 `SceneTitle` 類似的結構，但用更大的字體和 accent 色強調業務影響：

- 接受 `impact: string` prop
- `useCurrentFrame()` + `spring()` 做 fade-in + scale 動畫
- 置中顯示，字體 40px，THEME.accent 色
- Duration：`BUSINESS_SUMMARY_FRAMES = 90`（3 秒）

### ArchitectureDiagram 旁註

新增 optional prop：

```typescript
moduleAnnotations?: Record<string, string>;
// e.g. { "auth": "新增：登入驗證", "api": "更新：權限檢查" }
```

在 highlight 模組的方塊下方或右側渲染小字旁註。template 層負責從 `businessTasks` 組裝 `moduleAnnotations`。

### parse-archive 衍生邏輯

新增三個 extract 函式：

1. `extractBusinessImpact(motivation: string)` — 取 motivation 第一句，作為 businessImpact
2. `extractBusinessSpecDiff(specDiff)` — 初版直接複製原文（為未來 LLM 翻譯預留接口）
3. `extractBusinessTasks(tasks)` — 移除常見技術動詞前綴（Setup、Implement、Add、Configure），改為「完成：」開頭

支援 frontmatter 手動覆寫：若 `proposal.md` 的 frontmatter 有 `businessImpact` 等欄位，優先使用。

### 關鍵決策

| 決策 | 選擇 | 替代方案 | 原因 |
|------|------|---------|------|
| 同一 template + audience 參數 | ✅ 採用 | 獨立建 BusinessIterationVideo template | 減少重複程式碼，共用動畫邏輯和 duration 計算 |
| 業務欄位為 optional + fallback | ✅ 採用 | 必填欄位 | 向後相容，現有 JSON 不需改動 |
| parse-archive 簡單規則衍生 | ✅ 採用 | LLM API 翻譯 | P1 先用規則，P2 再考慮 LLM，降低外部依賴 |
| audience 放 top-level | ✅ 採用 | 每個 iteration 獨立設 audience | 一支影片只有一種受眾，不需混合 |

## 資料變更

Schema 新增 optional 欄位（詳見上方），Zod `.default()` + `.optional()` 確保向後相容。無 breaking change。

## 測試策略

- 現有 sample JSON 渲染結果不變（visual regression — 人工 Studio preview 確認）
- 新建帶業務欄位的 sample JSON，在 Studio 中 preview 確認業務模式渲染正確
- `schemas.ts` 的 `.safeParse()` 測試：無業務欄位的 JSON 驗證通過、有業務欄位的 JSON 驗證通過
- parse-archive：用現有 archive 目錄執行，確認輸出 JSON 多了業務欄位

## 向後相容性

完全向後相容。所有新增欄位為 optional，`audience` 預設為 `"technical"`。現有 JSON、現有 CLI 命令、現有渲染結果均不受影響。
