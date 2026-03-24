# Proposal: 架構圖 UI 增強

## 動機

目前 `ArchitectureDiagram` 元件在視覺完成度上有多處不足：各層寬度不一致導致版面參差、accent bar 圓角與卡片不吻合造成渲染瑕疵、卡片缺少入場動畫使影片偏靜態、連線從模組中心出發導致穿越重疊。這些問題在模組數量增加或影片用於對外展示時尤為明顯。

## 目標

提升架構圖的視覺品質與動態表現力，使其在影片中作為核心展示場景時具備專業級呈現效果。

## 範圍

### 會做
- **P0** 統一所有層容器的寬度（取最寬層的寬度）
- **P0** 修正 accent bar 與卡片圓角裁切問題
- **P1** 加入逐層淡入 + 上移的入場動畫
- **P1** 連線起終點改為模組邊緣（上/下/左/右），避免穿越模組
- **P2** 清理 schema 中未使用的 `position` 欄位
- **P2** 修正 connection label 寬度計算（改用固定 padding 取代字元數估算）

### 不做
- 不加圖例（P3，後續迭代）
- 不做智慧佈局策略（P3，需更大的架構調整）
- 不改 theme 配色
- 不影響 `moduleAnnotations`（業務旁註）既有行為

## 影響分析

- **使用者影響**: 影片中架構圖的視覺品質提升，既有功能行為不變
- **技術影響**: 主要修改 `src/components/ArchitectureDiagram.tsx`、`src/types/schemas.ts`
- **風險**: 連線路徑算法變更可能需要針對不同 module 數量的佈局做微調

## 成功標準

- Studio preview 中所有層容器等寬對齊
- accent bar 在卡片圓角區域內正確裁切
- 卡片按層順序逐層出現（有明確的動畫效果）
- 連線不穿越任何模組卡片
- 既有 sample data（genesis、iteration-001、fullstory）渲染結果無 regression
- `bun run lint` 通過
