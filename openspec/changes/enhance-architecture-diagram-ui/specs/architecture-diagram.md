---
target_spec: architecture-diagram.md
change: enhance-architecture-diagram-ui
created_at: 2026-03-24T23:35:00+08:00
---

# Delta Spec: 架構圖 UI 增強

## ADDED

### 統一層容器寬度
**ID**: REQ-019
**Priority**: MUST
**描述**: 所有 category layer 容器使用相同寬度（取所有層中最寬的值），確保視覺對齊。

**驗收場景**:
- **Scenario: 不同模組數的層等寬**
  - Given 架構定義有 3 個 category，分別含 1、2、3 個 modules
  - When 渲染架構圖
  - Then 3 個 layer 容器寬度相同（等於 3-module 那層的自然寬度）

- **Scenario: 少模組的層內模組仍置中**
  - Given 統一寬度後，1-module 層有多餘空間
  - When 渲染
  - Then module 卡片在 layer 容器內水平置中

### Accent Bar 圓角裁切
**ID**: REQ-020
**Priority**: MUST
**描述**: 模組卡片左側 accent bar 使用 `clipPath` 裁切於卡片圓角形狀內，不突出於 `rx=10` 的圓角外。

**驗收場景**:
- **Scenario: 圓角邊緣無溢出**
  - Given module 卡片 `rx=10`，accent bar 寬 4px
  - When 渲染任何模組
  - Then accent bar 在卡片左上角和左下角的圓角區域被正確裁切

### 逐層入場動畫
**ID**: REQ-021
**Priority**: MUST
**描述**: 架構圖首次出現時，layer 容器和其內的 module 卡片按層順序逐層淡入 + 上移。每層間隔固定 frame 數。連線在兩端模組都出現後才顯示。

**驗收場景**:
- **Scenario: 逐層出現**
  - Given 架構定義有 4 個 category layers
  - When 渲染架構圖場景
  - Then 第 1 層先出現，隨後第 2、3、4 層依序淡入，各層間有明顯時間差

- **Scenario: 連線延遲顯示**
  - Given connection 連接 layer-1 的 module 和 layer-3 的 module
  - When 渲染
  - Then 連線在 layer-3 出現後才開始淡入，不會在 layer-3 尚未出現時就顯示

- **Scenario: 動畫使用 Remotion 合規方式**
  - When 實作動畫
  - Then 使用 `useCurrentFrame()` + `spring()` / `interpolate()`，不使用 CSS animation 或 transition

### 連線起終點改為模組邊緣
**ID**: REQ-022
**Priority**: MUST
**描述**: 連線的起點和終點從模組中心改為模組矩形的邊緣（上/下/左/右），根據兩個模組的相對位置選擇最近的邊。

**驗收場景**:
- **Scenario: 垂直方向連線**
  - Given source module 在 target module 上方（不同 layer）
  - When 渲染連線
  - Then 起點在 source 下邊緣中點，終點在 target 上邊緣中點

- **Scenario: 水平方向連線**
  - Given source 和 target 在同一 layer
  - When 渲染連線
  - Then 起點在 source 右邊緣中點，終點在 target 左邊緣中點（或反向）

- **Scenario: 連線不穿越模組**
  - Given 任何架構定義的連線
  - When 渲染
  - Then 連線路徑不穿越任何模組卡片矩形

### Connection Label 寬度修正
**ID**: REQ-023
**Priority**: SHOULD
**描述**: Connection label 背景矩形寬度改用固定 padding 方式計算，不依賴 `label.length * N` 字元數估算。

**驗收場景**:
- **Scenario: 中文 label 不截斷**
  - Given connection label 為 "資料查詢"（4 個中文字）
  - When 渲染
  - Then label 文字完整顯示在背景矩形內，不溢出

- **Scenario: 短英文 label 不過寬**
  - Given connection label 為 "HTTP"
  - When 渲染
  - Then 背景矩形寬度適當，不會過度寬於文字

## MODIFIED

### 自適應尺寸
**ID**: REQ-008 (existing)
**變更原因**: 移除未使用的 `position` 欄位，佈局改為純 category 分層
**原文**: 根據 module 數量和 grid 尺寸動態計算尺寸
**新版**: 根據 module 數量和 category 分層動態計算尺寸。`ModuleDefinitionSchema` 移除 `position` 欄位（`{ row, col }`），佈局完全由 category 分組決定。

**驗收場景**:
- **Scenario: 無 position 欄位**
  - Given module 定義不含 `position` 欄位
  - When 以 schema 驗證
  - Then 驗證成功

- **Scenario: 向後相容（含 position 的舊資料）**
  - Given 舊 JSON 仍含 `position` 欄位
  - When 以新 schema（使用 `.passthrough()` 或 `.strip()`）驗證
  - Then 驗證成功，`position` 被忽略
