# Tooling 規格

## 需求

### OpenSpec 目錄格式支援
**ID**: REQ-005
**Priority**: MUST
**描述**: parse-archive 自動偵測並支援 OpenSpec 格式（`YYYY-MM-DD-name/`），除現有 SpecKit 格式（`NNN-name/`）外。

**驗收場景**:
- **Scenario: OpenSpec 單目錄解析**
  - Given 一個 `2026-03-20-add-material-breakdown/` 目錄包含 `proposal.md` + `tasks.md` + `design.md`
  - When 執行 `bun run parse-archive -- --input 2026-03-20-add-material-breakdown/`
  - Then 輸出有效的 IterationData JSON，`iterationNumber` 從日期排序推斷

- **Scenario: design.md 替代 spec-delta.md**
  - Given OpenSpec 目錄包含 `design.md` 而非 `spec-delta.md`
  - When 解析時
  - Then 使用 `design.md` 提取 specDiff 和 architecture 資訊

- **Scenario: SpecKit 格式向後相容**
  - Given 一個 `001-add-auth/` 目錄（SpecKit 格式）
  - When 執行 parse-archive
  - Then 行為與修改前完全一致

### 批次解析模式
**ID**: REQ-006
**Priority**: SHOULD
**描述**: 支援一次傳入包含多個 archive 子目錄的父目錄，批次產出多個 JSON。

**驗收場景**:
- **Scenario: 批次解析 OpenSpec archives**
  - Given 一個目錄包含 `000-genesis/` + `2026-03-20-feature-a/` + `2026-03-23-feature-b/`
  - When 執行 `bun run parse-archive -- --input <parent-dir> --output <output-dir>`
  - Then 產出 `genesis.json` + `iteration-001.json` + `iteration-002.json`，按日期排序

- **Scenario: 混合格式批次**
  - Given 父目錄包含 SpecKit (`000-genesis/`) + OpenSpec (`2026-03-*`) 子目錄
  - When 批次解析
  - Then `000-genesis/` 解析為 genesis，其餘按日期排序為 iterations

### OpenSpec specs/ 子目錄支援
**ID**: REQ-007
**Priority**: MAY
**描述**: 若 OpenSpec archive 中有 `specs/` 子目錄含 delta spec 檔案，merge 其內容到 specDiff 提取中。
**狀態**: 未實作（MAY — 可在後續迭代處理）

**驗收場景**:
- **Scenario: specs/ 目錄存在**
  - Given archive 目錄有 `specs/orders.md` 包含 ADDED/MODIFIED sections
  - When 解析時
  - Then specDiff.after 包含 ADDED sections 的摘要

### parse-archive 業務欄位衍生
**ID**: REQ-017
**Priority**: MUST
**描述**: parse-archive 在產出 IterationData JSON 時，從現有欄位自動衍生業務版欄位：
- `businessImpact`：從 `motivation` 取第一句話，移除技術術語
- `businessSpecDiff`：從 `specDiff` 簡化技術細節為業務情境描述
- `businessTasks`：從 `tasks` 的 title 移除技術前綴（Setup、Implement、Add 等），改為成果導向描述

**驗收場景**:
- **Scenario: 自動衍生**
  - Given archive 目錄包含標準 proposal.md + tasks.md + design.md
  - When 執行 parse-archive
  - Then 輸出 JSON 包含 `businessImpact`、`businessSpecDiff`、`businessTasks` 欄位

- **Scenario: 手動覆寫**
  - Given proposal.md frontmatter 包含 `businessImpact: "自訂業務描述"`
  - When 執行 parse-archive
  - Then 使用 frontmatter 值，不自動衍生

### parse-archive audience 參數
**ID**: REQ-018
**Priority**: SHOULD
**描述**: parse-archive 支援 `--audience business` 參數，產出的 JSON 自動設定 `audience: "business"`。

**驗收場景**:
- **Scenario: 指定 audience**
  - Given 執行 `bun run parse-archive -- --input <dir> --audience business`
  - When 解析完成
  - Then 輸出 JSON 的 `audience` 欄位為 `"business"`

- **Scenario: 預設 audience**
  - Given 執行 parse-archive 不帶 `--audience`
  - When 解析完成
  - Then 輸出 JSON 無 `audience` 欄位（使用 schema 預設值 `"technical"`）
