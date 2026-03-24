---
target_spec: tooling.md
change: add-business-audience-layer
created_at: 2026-03-24T22:10:00+08:00
---

# Delta Spec: 業務受眾展示層 — Tooling

## ADDED

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
