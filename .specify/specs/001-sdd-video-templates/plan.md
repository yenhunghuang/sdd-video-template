---
source: spec.md
source_hash: ce3de6dbf9b09e83375e2ac92b188d480d47fbfb30500dae402727cc4adde1b7
status: current
generated_at: 2026-03-24T12:00:00+08:00
---

# 001 — SDD Video Templates: Technical Plan

## 方向摘要

我們打算這樣做：

- 用 **Remotion 4.x + React + TypeScript** 建立四種影片模板，資料來源是 SDD 工作流的 markdown 檔案
- 中間層有兩支 Bun 腳本：`speckit-to-genesis.ts` 負責格式轉換、`parse-archive.ts` 負責 markdown → JSON，影片 component 只吃 JSON
- 用 **Zod schema** 做 JSON 驗證和 Remotion Studio 的參數化介面，開發時可以直接在 Studio 側邊欄調參數
- 第一階段做 Genesis + Iteration 兩種影片和所有共用 component，Evolution 和 Sprint 留到 Phase 2

**已確認的決策**：

1. ✅ **架構圖渲染方式**：用純 React + SVG（不引入 D3/Mermaid），因為 Remotion 不支援 DOM 外的渲染引擎，SVG 可直接用 spring 動畫
2. ✅ **影片場景切換**：用 `<TransitionSeries>` + `fade()` 做場景轉場，保持視覺簡潔
3. ✅ **Zod 作為 schema 驗證層**：既用於 Remotion 的 `schema` prop（Studio UI 參數化），也用於 parse-archive 的輸出驗證

---
（以下為技術細節）

## Technical Context

| 項目 | 值 |
|------|-----|
| **Language/Version** | TypeScript 5.9, React 19 |
| **Runtime** | Bun（腳本）, Node 18+（Remotion 渲染） |
| **Primary Dependencies** | Remotion 4.0.x, @remotion/transitions, @remotion/tailwind-v4, zod |
| **Storage** | 檔案系統（markdown → JSON → MP4），無資料庫 |
| **Testing** | Remotion Studio 預覽 + Bun test（腳本單元測試） |
| **Target Platform** | WSL2 Linux, 1920x1080 30fps |
| **Project Type** | single（純前端 + CLI 腳本）|
| **Performance Goals** | 單支影片渲染 < 60s |
| **Constraints** | 無 CSS transitions/animate-*（Remotion 規則）、無 SaaS、無配音 |

## Constitution Check

| 原則 | Plan 對齊方式 | 狀態 |
|------|--------------|------|
| 資料驅動 | 所有 component 接受 Zod-validated JSON props，zero hardcode | ✅ |
| 簡單動畫 | 只用 spring + interpolate + fade transition，無複雜重疊 | ✅ |
| Remotion 慣例 | useCurrentFrame、spring、interpolate、Sequence/Series、premountFor | ✅ |
| 單一資料流 | SDD md → speckit-to-genesis → parse-archive → JSON → Component → MP4 | ✅ |
| 模板可複製 | 僅依賴 archived/ 標準格式，Zod schema 自帶驗證 | ✅ |

## Project Structure

```
sdd-video-template/
├── src/
│   ├── types/
│   │   └── schemas.ts              # Zod schemas + inferred types（所有 data/props 定義）
│   ├── templates/
│   │   ├── GenesisVideo.tsx         # 創世紀影片（P1）
│   │   ├── IterationVideo.tsx       # 迭代變更影片（P1）
│   │   ├── EvolutionTimeline.tsx    # 演化時間軸（P2）
│   │   └── SprintReview.tsx         # Sprint 回顧（P2）
│   ├── components/
│   │   ├── ArchitectureDiagram.tsx  # 漸進式著色架構圖（SVG）
│   │   ├── TypewriterText.tsx       # 打字機效果
│   │   ├── SpecDiff.tsx             # Before/After diff
│   │   ├── TaskChecklist.tsx        # 任務清單逐項動畫
│   │   ├── CounterAnimation.tsx     # 數字計數器
│   │   └── SceneTitle.tsx           # 場景標題卡（共用）
│   ├── styles/
│   │   └── theme.ts                 # 色彩常數、category 色系對照
│   ├── data/
│   │   └── sample/
│   │       ├── genesis.json         # GenesisData 範例
│   │       └── iteration-001.json   # IterationData 範例
│   ├── Root.tsx                     # Remotion entry，註冊所有 Composition
│   ├── index.ts
│   └── index.css
├── scripts/
│   ├── speckit-to-genesis.ts        # .spec-kit/ → archived/000-genesis/
│   ├── parse-archive.ts             # archived/NNN-xxx/ → JSON
│   └── render-video.ts              # 批次渲染腳本（P2）
├── .specify/                        # SpecKit 文件
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

**Why 這個結構**：

- `src/types/schemas.ts` 集中所有 Zod schema，Remotion component 和 parse 腳本共用同一份 schema。避免型別定義分散。
- `src/styles/theme.ts` 集中色彩定義，ArchitectureDiagram 的 category 色系和其他 component 的主題色都從這裡取。
- `scripts/` 與 `src/` 分離，腳本是 Bun runtime 的 CLI 工具，不經過 Remotion 的 webpack。
- `src/data/sample/` 提供開發用範例 JSON，也作為 Composition defaultProps。

## Architecture Decisions

### AD-001: Zod Schema 統一驗證 + 型別推導

**Context**: spec 定義了 4 種 JSON schema（GenesisData、IterationData 等），需要在 parse 腳本驗證輸出、在 Remotion component 定義 props、在 Studio 提供 UI 編輯。

**Decision**: 用 Zod 定義所有 schema，透過 `z.infer<>` 推導 TypeScript type。同一份 schema 用於：
1. `parse-archive.ts` 的輸出驗證（`.parse()` / `.safeParse()`）
2. Remotion `<Composition schema={...}>` 的 Studio 參數化
3. `render-video.ts` 渲染前的 JSON 校驗

**Alternatives Rejected**:
- 純 TypeScript interface + 手動驗證：多一層維護成本，runtime 無法驗證
- JSON Schema：與 Remotion 的 Zod 生態不相容

**Remotion 注意**: Remotion 要求 props 用 `type` 而非 `interface`（為了 `defaultProps` 型別安全）。Zod 的 `z.infer<>` 天然產出 `type`，完美匹配。

### AD-002: 架構圖用純 SVG + React，不引入 D3/Mermaid

**Context**: ArchitectureDiagram 需要漸進式著色動畫（spring 過渡），且在 Remotion 中渲染。

**Decision**: 用 React + SVG 手繪架構圖。模組是 `<rect>` + `<text>`，連線是 `<line>` / `<path>`。著色動畫透過 `spring()` + `interpolate()` 控制 `fill` opacity。

**Alternatives Rejected**:
- D3.js：DOM manipulation 模式與 React 衝突，且 Remotion 需要純 declarative 渲染
- Mermaid：輸出是靜態 SVG，無法逐模組動畫
- Canvas：Remotion 對 Canvas 的支援有限，且不適合文字清晰度要求

**佈局策略**: 用格狀佈局（grid layout），每個模組有 `position: { row, col }`，由 component 計算絕對座標。簡單且可預測，不需要複雜的 force-directed layout。

### AD-003: 場景編排用 TransitionSeries + Series

**Context**: 每支影片由多個場景組成（標題卡 → 內容 → 架構圖 → 結尾），需要順序播放和轉場。

**Decision**:
- 影片內場景用 `<TransitionSeries>` + `fade()` 轉場
- 場景內元素用 `<Sequence>` + `premountFor` 控制出場時機
- 時長動態計算：`calculateMetadata` 根據資料量（principles 數、tasks 數）決定 `durationInFrames`

**Alternatives Rejected**:
- 純 `<Series>`：無法做轉場效果
- 手動 interpolate 所有場景進出：代碼量暴增，難維護

### AD-004: speckit-to-genesis 產出 OpenSpec 相容格式

**Context**: Genesis 的資料來源是 `.spec-kit/`（SpecKit 格式），但影片 pipeline 統一從 `archived/NNN-xxx/` 讀取。

**Decision**: `speckit-to-genesis.ts` 將 SpecKit 的 4 份文件映射為 OpenSpec archived 的 3 份文件：

| SpecKit 來源 | → OpenSpec 目標 | 映射邏輯 |
|-------------|-----------------|----------|
| constitution.md + spec.md | → proposal.md | 合併為「專案的起始 proposal」 |
| tasks.md | → tasks.md | 直接複製（格式相容）|
| plan.md | → spec-delta.md | 作為「初始架構 delta」，包含 architecture modules |

**Why**: 讓 `parse-archive.ts` 只需要處理一種目錄格式，不用分兩條 parse 路徑。

### AD-005: Component Props 的 frame 控制策略

**Context**: 共用 component（TypewriterText、TaskChecklist 等）需要知道「在整支影片的哪個時間點開始動畫」。

**Decision**: 每個 component 接受 `startFrame` prop，但內部動畫基於 `useCurrentFrame()`（Sequence 的 local frame）。呼叫端透過 `<Sequence from={startFrame}>` 包裹 component。

```tsx
// 呼叫端
<Sequence from={30} durationInFrames={60} premountFor={15}>
  <TypewriterText text="Hello" />
</Sequence>

// TypewriterText 內部
const frame = useCurrentFrame(); // 0-59，不是 30-89
```

**Why**: 符合 Remotion 的 local frame 慣例。component 不需要知道自己在全域 timeline 的位置。`startFrame` prop 仍保留在 interface 中，但語義是「告訴父層從哪個 frame 開始排這個 Sequence」，不是 component 內部使用。

## 時長計算策略

每種影片的 `durationInFrames` 由 `calculateMetadata` 動態決定：

| 影片 | 計算公式 | 備註 |
|------|----------|------|
| Genesis | `titleCard(90) + principles(count × 60) + architecture(90) + taskSummary(60) + outro(30) − transitions` | 45-60s 目標 |
| Iteration | `titleCard(60) + specDiff(90) + tasks(count × 15 + 30) + architecture(60) + outro(30) − transitions` | 15-20s 目標 |
| Evolution | `intro(60) + iterations(count × 45) + finale(90) − transitions` | 90-120s 目標 |
| Sprint | `titleCard(60) + stats(60) + keyChanges(count × 30) + architecture(60) − transitions` | 20-30s 目標 |

`calculateMetadata` 接收 JSON props，按上述公式計算 frames，確保影片時長不超過 constitution 的 120 秒上限。

## 色彩系統

`src/styles/theme.ts` 集中管理：

```typescript
// Module category → 色系
const MODULE_COLORS = {
  core:     { base: "#3B82F6", light: "#93C5FD" },  // 藍
  api:      { base: "#10B981", light: "#6EE7B7" },  // 綠
  data:     { base: "#F59E0B", light: "#FCD34D" },  // 橙
  ui:       { base: "#8B5CF6", light: "#C4B5FD" },  // 紫
  infra:    { base: "#6B7280", light: "#D1D5DB" },  // 灰藍
  external: { base: "#92400E", light: "#D97706" },  // 棕
} as const;

// 灰色（未完成模組）
const GRAY = { base: "#E5E7EB", light: "#F3F4F6" };

// 全域主題色
const THEME = {
  bg: "#0F172A",        // 深色背景（Slate 900）
  text: "#F8FAFC",      // 淺色文字（Slate 50）
  accent: "#3B82F6",    // 主色（Blue 500）
  success: "#10B981",   // 成功綠
  danger: "#EF4444",    // 刪除紅
  muted: "#64748B",     // 次要文字
} as const;
```

## 新增 Dependencies

| Package | 用途 | 類型 |
|---------|------|------|
| `zod` | JSON schema 驗證 + Remotion 參數化 | production |
| `@remotion/transitions` | 場景轉場（fade, slide）| production |
| `gray-matter` | markdown YAML frontmatter 解析（parse-archive 用）| production |

不需要的：
- ~~D3.js~~ — SVG 手繪
- ~~@remotion/three~~ — 不做 3D
- ~~@remotion/lottie~~ — 不用 Lottie 動畫

## Complexity Tracking

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Dependencies | 3 new（zod, @remotion/transitions, gray-matter）| ≤ 8 | ✅ |
| Data models | 4 schemas + 2 shared types | ≤ 6 | ✅ |
| API endpoints | 0（CLI 工具，無 API）| ≤ 12 | ✅ |
| External integrations | 0 | ≤ 3 | ✅ |
| Template components | 4（2 P1 + 2 P2）| — | ✅ |
| Shared components | 6（ArchitectureDiagram + 4 動畫 + SceneTitle）| — | ✅ |
| CLI scripts | 3（speckit-to-genesis + parse-archive + render-video）| — | ✅ |
