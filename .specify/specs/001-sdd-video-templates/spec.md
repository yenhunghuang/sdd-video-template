# 001 — SDD Video Templates

## User Stories

### US-01: Genesis 影片渲染 (P1 — MVP)

**誰**: FDE / 課程講師
**做什麼**: 從 SpecKit 產出（constitution + spec + plan + tasks）生成一支 45-60 秒的「創世紀」影片，說明專案從 0→1 的架構設計與目標。

**Why P1**: 這是資料流的第一個端到端驗證——沒有 Genesis，後續 Iteration / Evolution 都無法串接。

**Independent Test**: 提供範例 `.spec-kit/` 目錄 → 執行 `speckit-to-genesis.ts` → 執行 `parse-archive.ts` → 將 JSON 餵入 `GenesisVideo` component → Remotion Studio 預覽正確 → 渲染為可播放 MP4。

**Acceptance Scenarios**:

```
Given 一個包含 constitution.md、spec.md、plan.md、tasks.md 的 .spec-kit/ 目錄
When 執行 speckit-to-genesis.ts
Then 產出 openspec/archived/000-genesis/ 目錄，包含 proposal.md、tasks.md、spec-delta.md

Given 000-genesis/ 目錄
When 執行 parse-archive.ts
Then 產出符合 GenesisData schema 的 JSON

Given 有效的 GenesisData JSON
When Remotion 渲染 GenesisVideo
Then 輸出 45-60 秒的 MP4，包含：專案名稱標題卡、核心原則逐條打字動畫、架構圖（全模組灰色）、任務總覽
```

---

### US-02: Iteration 影片渲染 (P1 — MVP)

**誰**: FDE / PM
**做什麼**: 從單次 OpenSpec archived 產出，生成 15-20 秒的迭代變更影片，說明本次改了什麼、為什麼改。

**Why P1**: 這是最高頻使用場景——每次迭代都會產出一支。

**Independent Test**: 提供範例 `openspec/archived/001-xxx/` → `parse-archive.ts` → JSON → `IterationVideo` → MP4。

**Acceptance Scenarios**:

```
Given 一個包含 proposal.md、tasks.md、spec-delta.md 的 archived/NNN-xxx/ 目錄
When 執行 parse-archive.ts
Then 產出符合 IterationData schema 的 JSON

Given 有效的 IterationData JSON 且包含 coloredModules 清單
When Remotion 渲染 IterationVideo
Then 輸出 15-20 秒的 MP4，包含：變更標題卡、SpecDiff before/after、TaskChecklist 動畫、架構圖（本次模組著色）
```

---

### US-03: 漸進式著色架構圖 (P1 — MVP)

**誰**: 影片觀眾（PM、主管、客戶）
**做什麼**: 在影片中看到一張架構圖，隨著迭代進展，已完成的模組從灰色漸變為彩色，直覺理解「走到哪了」。

**Why P1**: 這是四種影片的視覺主線——沒有它，影片之間缺乏連貫性。

**Independent Test**: 傳入不同的 `coloredModules[]` → 確認對應模組著色、其餘保持灰色。

**Acceptance Scenarios**:

```
Given 一個含 6 個模組的架構圖定義，coloredModules = []
When 渲染 ArchitectureDiagram
Then 所有模組顯示為灰色（未實作狀態）

Given coloredModules = ["auth", "api"]
When 渲染 ArchitectureDiagram
Then "auth" 和 "api" 模組顯示為彩色，其餘 4 個為灰色

Given coloredModules = ["auth", "api"]，且提供 highlightModules = ["api"]
When 渲染 ArchitectureDiagram 並啟用動畫
Then "api" 模組從灰色漸變為彩色（spring 動畫），"auth" 直接顯示彩色（已完成），其餘灰色
```

---

### US-04: 共用動畫 Component (P1 — MVP)

**誰**: 影片模板開發者（自己）
**做什麼**: 使用一組共用的動畫 component（TypewriterText、SpecDiff、TaskChecklist、CounterAnimation）來組合影片場景。

**Why P1**: 四種影片模板都依賴這些 building blocks，缺一則影片無法組裝。

**Independent Test**: 每個 component 獨立掛載到一個測試 Composition，確認動畫在指定 frame 範圍內正確執行。

**Acceptance Scenarios**:

```
Given TypewriterText 接收 text="Hello World" 和 startFrame=0
When 渲染到 frame 15
Then 畫面顯示部分文字（逐字出現中）

Given SpecDiff 接收 before 和 after 文字
When 渲染完成
Then 先顯示 before（紅色標記），過渡後顯示 after（綠色標記）

Given TaskChecklist 接收 5 個 task items
When 渲染完成
Then 每個 task 逐一出現並打勾，間隔均勻

Given CounterAnimation 接收 from=0, to=42
When 渲染完成
Then 數字從 0 滾動到 42
```

---

### US-05: Evolution 時間軸影片 (P2)

**誰**: FDE / 課程講師
**做什麼**: 串聯所有迭代的架構圖著色過程，生成 90-120 秒的專案完整歷程影片。

**Why P2**: 依賴 Genesis + 多個 Iteration 資料，MVP 階段資料不足。

**Independent Test**: 提供 3+ 個 archived/ 目錄的 JSON → `EvolutionTimeline` → 確認架構圖從全灰到全亮的連續動畫。

**Acceptance Scenarios**:

```
Given 5 個迭代的 IterationData JSON 陣列
When Remotion 渲染 EvolutionTimeline
Then 輸出 90-120 秒 MP4，按時間順序播放每次迭代的架構圖著色，最後全部模組亮起
```

---

### US-06: Sprint Review 影片 (P2)

**誰**: PM / 主管
**做什麼**: 自動彙總最近 N 個迭代，生成 20-30 秒的 Sprint 回顧影片。

**Why P2**: 是 Iteration 的聚合場景，先有單支 Iteration 才有 Sprint。

**Independent Test**: 提供最近 3 個 archived/ 的 JSON → `SprintReview` → 確認統計數字與 task 彙總正確。

**Acceptance Scenarios**:

```
Given 最近 3 個迭代的 IterationData JSON
When Remotion 渲染 SprintReview
Then 輸出 20-30 秒 MP4，包含：Sprint 標題、迭代數量/任務完成數量的 CounterAnimation、關鍵變更摘要、架構圖最終狀態
```

---

## Requirements

### 資料流

> `SpecKit 產出` → `speckit-to-genesis.ts` → `archived/000` → `parse-archive.ts` → `JSON` → `Remotion Component` → `MP4`

| ID | 需求 | 層級 |
|----|------|------|
| FR-001 | `speckit-to-genesis.ts` MUST 讀取 `.spec-kit/` 下的 constitution.md、spec.md、plan.md、tasks.md，轉換為 `openspec/archived/000-genesis/` 目錄格式（proposal.md + tasks.md + spec-delta.md） | MUST |
| FR-002 | `parse-archive.ts` MUST 接受任意 `openspec/archived/NNN-xxx/` 路徑，輸出結構化 JSON。NNN 為三位數序號，xxx 為 kebab-case 名稱 | MUST |
| FR-003 | parse-archive.ts MUST 根據 NNN 值自動判斷影片類型：`000` = Genesis，`001+` = Iteration | MUST |
| FR-004 | 每個影片 template component MUST 只接受對應的 typed JSON props，不接受 raw markdown | MUST |
| FR-005 | `render-video.ts` SHOULD 支援批次渲染——指定目錄後自動掃描所有 archived/ 並逐一渲染 | SHOULD |
| FR-006 | 所有影片 MUST 輸出 1920x1080 30fps MP4 | MUST |
| FR-007 | 影片輸出檔名 MUST 遵循 `{NNN}-{name}-{template}.mp4` 格式（如 `000-genesis-genesis.mp4`） | MUST |

### 四種影片模板 JSON Schema

#### GenesisData

```typescript
interface GenesisData {
  /** 影片類型識別 */
  type: "genesis";
  /** 專案名稱 */
  projectName: string;
  /** 一句話定義 */
  tagline: string;
  /** 核心原則（從 constitution 擷取）*/
  principles: Array<{
    title: string;
    description: string;
  }>;
  /** 架構模組定義（Genesis 時全部未著色）*/
  architecture: ArchitectureDefinition;
  /** 任務統計 */
  taskSummary: {
    total: number;
    categories: Array<{
      name: string;
      count: number;
    }>;
  };
  /** 目標用戶 */
  targetUsers: string[];
}
```

#### IterationData

```typescript
interface IterationData {
  /** 影片類型識別 */
  type: "iteration";
  /** 迭代序號（001, 002, ...）*/
  iterationNumber: string;
  /** 變更名稱 */
  changeName: string;
  /** 變更摘要（一句話）*/
  summary: string;
  /** 變更動機 */
  motivation: string;
  /** spec 差異（before/after）*/
  specDiff: {
    before: string;
    after: string;
  };
  /** 本次完成的任務清單 */
  tasks: Array<{
    id: string;
    title: string;
    status: "completed" | "skipped";
  }>;
  /** 架構模組定義 */
  architecture: ArchitectureDefinition;
  /** 到此迭代為止已完成的模組 ID 列表 */
  coloredModules: string[];
  /** 本次新完成的模組 ID（會有著色動畫）*/
  highlightModules: string[];
}
```

#### EvolutionData

```typescript
interface EvolutionData {
  /** 影片類型識別 */
  type: "evolution";
  /** 專案名稱 */
  projectName: string;
  /** 所有迭代的摘要資料，按時間排序 */
  iterations: Array<{
    iterationNumber: string;
    changeName: string;
    summary: string;
    coloredModules: string[];
    highlightModules: string[];
  }>;
  /** 架構模組定義（完整版）*/
  architecture: ArchitectureDefinition;
  /** 專案整體統計 */
  stats: {
    totalIterations: number;
    totalTasks: number;
    completedTasks: number;
    timeSpan: string;
  };
}
```

#### SprintData

```typescript
interface SprintData {
  /** 影片類型識別 */
  type: "sprint";
  /** Sprint 名稱（如 "Sprint 3"）*/
  sprintName: string;
  /** Sprint 期間 */
  period: string;
  /** 包含的迭代 */
  iterations: Array<{
    iterationNumber: string;
    changeName: string;
    summary: string;
  }>;
  /** Sprint 統計 */
  stats: {
    iterationCount: number;
    tasksCompleted: number;
    tasksSkipped: number;
  };
  /** 關鍵變更摘要（從各 iteration 的 motivation 彙整）*/
  keyChanges: string[];
  /** 架構模組定義 */
  architecture: ArchitectureDefinition;
  /** Sprint 結束時的已完成模組 */
  coloredModules: string[];
}
```

### 共用型別：ArchitectureDefinition

```typescript
interface ArchitectureDefinition {
  /** 架構圖標題 */
  title: string;
  /** 所有模組 */
  modules: Array<ModuleDefinition>;
  /** 模組之間的連線 */
  connections: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

interface ModuleDefinition {
  /** 模組唯一 ID（用於 coloredModules 比對）*/
  id: string;
  /** 顯示名稱 */
  label: string;
  /** 模組描述（hover 或展開時顯示）*/
  description?: string;
  /** 模組分類（決定顏色主題）*/
  category: "core" | "api" | "data" | "ui" | "infra" | "external";
  /** 在架構圖中的位置（格狀佈局）*/
  position: { row: number; col: number };
}
```

### ArchitectureDiagram Component Props

| ID | 需求 | 層級 |
|----|------|------|
| FR-008 | ArchitectureDiagram MUST 接受 `ArchitectureDefinition` 定義所有模組及連線 | MUST |
| FR-009 | ArchitectureDiagram MUST 接受 `coloredModules: string[]`，列表中的模組顯示為對應 category 的彩色，其餘為灰色 | MUST |
| FR-010 | ArchitectureDiagram MUST 接受 `highlightModules: string[]`，列表中的模組在當前影片段落中播放「灰色→彩色」的 spring 過渡動畫 | MUST |
| FR-011 | ArchitectureDiagram SHOULD 根據 `category` 為每類模組指定不同的色系（如 core=藍、api=綠、data=橙、ui=紫、infra=灰藍、external=棕）| SHOULD |
| FR-012 | ArchitectureDiagram MUST 繪製 `connections` 中定義的連線，顏色跟隨端點模組的著色狀態 | MUST |

```typescript
interface ArchitectureDiagramProps {
  /** 架構定義（模組 + 連線）*/
  architecture: ArchitectureDefinition;
  /** 到目前為止已完成（彩色）的模組 ID */
  coloredModules: string[];
  /** 本次新完成的模組 ID（會播放著色動畫）*/
  highlightModules: string[];
  /** 著色動畫的起始 frame（相對於 Composition startFrame）*/
  animationStartFrame: number;
  /** 每個模組著色動畫的持續 frame 數 */
  animationDuration?: number;  // 預設 20 frames
  /** 是否顯示模組描述 */
  showDescriptions?: boolean;  // 預設 false
  /** 佈局尺寸 */
  width?: number;   // 預設 1920
  height?: number;  // 預設 1080
}
```

### 共用 Component API

#### TypewriterText

| ID | 需求 | 層級 |
|----|------|------|
| FR-013 | TypewriterText MUST 接受 `text: string` 並以逐字動畫顯示 | MUST |
| FR-014 | TypewriterText MUST 接受 `startFrame` 和 `speed`（每 frame 顯示幾個字元）控制動畫節奏 | MUST |
| FR-015 | TypewriterText SHOULD 支援 `cursor` prop 控制是否顯示閃爍游標 | SHOULD |

```typescript
interface TypewriterTextProps {
  text: string;
  startFrame: number;
  speed?: number;         // 預設 1（每 frame 1 字元）
  cursor?: boolean;       // 預設 true
  cursorChar?: string;    // 預設 "▌"
  style?: React.CSSProperties;
  className?: string;
}
```

#### SpecDiff

| ID | 需求 | 層級 |
|----|------|------|
| FR-016 | SpecDiff MUST 接受 `before` 和 `after` 文字，依序顯示 | MUST |
| FR-017 | SpecDiff MUST 用紅色/刪除線標記 before，綠色/底線標記 after | MUST |
| FR-018 | SpecDiff MUST 支援 `transitionFrame` 指定 before→after 的切換時機 | MUST |

```typescript
interface SpecDiffProps {
  before: string;
  after: string;
  startFrame: number;
  transitionFrame: number;
  style?: React.CSSProperties;
  className?: string;
}
```

#### TaskChecklist

| ID | 需求 | 層級 |
|----|------|------|
| FR-019 | TaskChecklist MUST 接受 task 陣列，逐一顯示每個 task 並播放打勾動畫 | MUST |
| FR-020 | TaskChecklist MUST 支援 `staggerDelay`（每個 task 之間的間隔 frame 數）| MUST |
| FR-021 | TaskChecklist SHOULD 對 `status: "skipped"` 的 task 顯示為劃掉樣式而非打勾 | SHOULD |

```typescript
interface TaskChecklistProps {
  tasks: Array<{
    id: string;
    title: string;
    status: "completed" | "skipped";
  }>;
  startFrame: number;
  staggerDelay?: number;  // 預設 15 frames
  style?: React.CSSProperties;
  className?: string;
}
```

#### CounterAnimation

| ID | 需求 | 層級 |
|----|------|------|
| FR-022 | CounterAnimation MUST 接受 `from` 和 `to` 數值，以 spring 動畫滾動數字 | MUST |
| FR-023 | CounterAnimation SHOULD 支援 `prefix` 和 `suffix`（如 "+" 或 " tasks"）| SHOULD |
| FR-024 | CounterAnimation SHOULD 支援 `formatFn` 自訂數字格式化（如加千分位）| SHOULD |

```typescript
interface CounterAnimationProps {
  from: number;
  to: number;
  startFrame: number;
  duration?: number;      // 預設 30 frames
  prefix?: string;
  suffix?: string;
  formatFn?: (n: number) => string;
  style?: React.CSSProperties;
  className?: string;
}
```

### Key Entities

| Entity | 代表什麼 | 關鍵屬性 |
|--------|----------|----------|
| ArchivedChange | 一次歸檔的迭代變更 | NNN 序號、名稱、proposal、tasks、spec-delta |
| VideoTemplate | 一種影片模板的定義 | 類型（genesis/iteration/evolution/sprint）、時長範圍、對應 data schema |
| ArchitectureModule | 架構圖中的一個模組 | ID、名稱、category、position、著色狀態 |
| ParsedData | parse-archive 的輸出 | type 欄位決定是哪種 schema，內容為影片 component 所需的全部資料 |

### 腳本需求

| ID | 需求 | 層級 |
|----|------|------|
| FR-025 | speckit-to-genesis.ts MUST 從 constitution.md 擷取 principles | MUST |
| FR-026 | speckit-to-genesis.ts MUST 從 plan.md 擷取 architecture modules（如果 plan 中有定義）| MUST |
| FR-027 | speckit-to-genesis.ts MUST 從 tasks.md 擷取 task 統計 | MUST |
| FR-028 | parse-archive.ts MUST 處理 markdown 中的 YAML frontmatter（如果存在）| MUST |
| FR-029 | parse-archive.ts MUST 在缺少必要檔案時回傳明確錯誤訊息而非 crash | MUST |
| FR-030 | render-video.ts SHOULD 在渲染前檢查 JSON schema 是否合法 | SHOULD |

---

## Success Criteria

### 使用者體驗指標
- FDE 從「有 SDD 產出」到「拿到 MP4」的操作步驟 ≤ 3 個命令
- 影片觀眾（非技術人員）能在 15 秒內理解「這次迭代做了什麼」

### 品質指標
- 所有 P1 影片模板可從範例 JSON 渲染為可播放 MP4
- parse-archive.ts 對缺少欄位的 archived/ 不 crash，而是輸出有意義的錯誤
- TypeScript 零 `any` type（共用 component props 全部 typed）

### 規模指標
- 單支影片渲染時間 < 60 秒（本機 WSL2 環境）
- 支援 ≤ 50 個迭代的 Evolution 時間軸影片
