# Architecture Diagram 規格

## 需求

### 自適應尺寸
**ID**: REQ-008
**Priority**: MUST
**描述**: 根據 module 數量和 grid 尺寸動態計算 `MODULE_WIDTH`、`MODULE_HEIGHT`、`GAP_X`、`GAP_Y`，確保不超出 viewport。

**驗收場景**:
- **Scenario: 9 modules (3×3)**
  - Given 9 個 modules 排列為 3×3 grid
  - When 渲染架構圖
  - Then 所有 modules 完整顯示在 1920×1080 viewport 內，不截斷

- **Scenario: 15 modules (5×3)**
  - Given 15 個 modules 排列為 5×3 grid
  - When 渲染架構圖
  - Then 自動縮小 MODULE_WIDTH / HEIGHT，保持所有 modules 可見

- **Scenario: 4 modules (2×2) 不過度放大**
  - Given 4 個 modules 排列為 2×2 grid
  - When 渲染架構圖
  - Then module 尺寸不超過原始預設值（200×80），保持視覺比例

### 連線 Label 顯示
**ID**: REQ-009
**Priority**: MUST
**描述**: 在連線中點顯示 `label` 文字，背景用小矩形遮蓋重疊線段，確保 label 可讀。

**驗收場景**:
- **Scenario: Label 顯示**
  - Given connection 定義 `{ from: "api", to: "db", label: "SQL" }`
  - When 渲染架構圖
  - Then 連線中點顯示 "SQL" 文字，背景有不透明小矩形

- **Scenario: 無 Label 的連線**
  - Given connection 定義 `{ from: "api", to: "cache" }`（無 label）
  - When 渲染架構圖
  - Then 連線正常渲染，無文字

### 曲線連線
**ID**: REQ-010
**Priority**: SHOULD
**描述**: 對跨多行或多列的連線使用 quadratic bezier curve（`<path>` 的 Q 指令），避免穿越中間 modules。

**驗收場景**:
- **Scenario: 跨行連線**
  - Given connection `{ from: (0,2), to: (2,0) }`，中間有 modules
  - When 渲染架構圖
  - Then 使用曲線繞過中間 modules，不直線穿越

- **Scenario: 相鄰 module 連線**
  - Given connection 在相鄰 modules 間（同行或同列差 1）
  - When 渲染架構圖
  - Then 使用直線（短距離不需曲線）

### Module 文字自適應
**ID**: REQ-011
**Priority**: SHOULD
**描述**: 長 label 自動縮小 fontSize 或截斷以適應 module 寬度。

**驗收場景**:
- **Scenario: 長英文 Label**
  - Given module label 為 "Authentication Service"（18 字元）
  - When module 寬度為 200px
  - Then fontSize 自動縮小以完整顯示，或折行

- **Scenario: 短 Label 不縮小**
  - Given module label 為 "API"（3 字元）
  - When 渲染
  - Then 使用預設 fontSize（14px）
