---
target_spec: tooling.md
change: template-v2-fullstory-and-tooling
created_at: 2026-03-24
---

# Delta Spec: parse-archive 支援 OpenSpec 格式

## ADDED

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

**驗收場景**:
- **Scenario: specs/ 目錄存在**
  - Given archive 目錄有 `specs/orders.md` 包含 ADDED/MODIFIED sections
  - When 解析時
  - Then specDiff.after 包含 ADDED sections 的摘要
