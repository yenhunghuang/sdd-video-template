---
change: enhance-architecture-diagram-ui
created_at: 2026-03-24T23:35:00+08:00
---

# 技術設計: 架構圖 UI 增強

## 方案概述

在 `ArchitectureDiagram.tsx` 內部重構佈局邏輯、動畫系統和連線算法，不改變元件的外部 API（props 不變）。同時清理 `ModuleDefinitionSchema` 中未使用的 `position` 欄位。

## 影響範圍分析

| 模組/檔案 | 影響類型 | 說明 |
|-----------|---------|------|
| `src/components/ArchitectureDiagram.tsx` | 修改 | 佈局、動畫、連線算法全部在此 |
| `src/types/schemas.ts` | 修改 | 移除 `ModuleDefinitionSchema.position` |
| `src/data/sample/genesis.json` | 修改 | 移除 modules 中的 `position` 欄位 |
| `src/data/sample/iteration-001.json` | 修改 | 同上 |
| `src/data/sample/fullstory.json` | 修改 | 同上 |

## 實作方案

### 1. 統一層寬度

在 `layers` 陣列建完後，計算 `maxLayerW = Math.max(...layers.map(l => l.w))`，然後將所有 layer 的 `w` 設為 `maxLayerW`，重新計算每層的 `x`（置中）和 `modulePositions`（模組在新寬度內置中）。

### 2. Accent Bar 裁切

為每個模組卡片加 `<clipPath>` 定義，形狀與卡片的 `<rect rx={10}>` 一致。accent bar 放在此 `clipPath` 內，自然被圓角裁切。

```tsx
<defs>
  <clipPath id={`clip-${mod.id}`}>
    <rect x={x} y={y} width={MODULE_W} height={MODULE_H} rx={10} />
  </clipPath>
</defs>
<g clipPath={`url(#clip-${mod.id})`}>
  <rect x={x} y={y} width={4} height={MODULE_H} fill={accentColor} />
</g>
```

### 3. 逐層入場動畫

新增 `entranceDelay` 概念：每層有一個基於 index 的延遲（`layerIndex * STAGGER_FRAMES`）。

```
layerProgress = spring({
  frame: max(0, frame - animationStartFrame - layerIndex * STAGGER_FRAMES),
  ...
})
```

- Layer 容器：`opacity: layerProgress`，`translateY: interpolate(layerProgress, [0,1], [20, 0])`
- 模組卡片：跟隨所屬 layer 的 progress
- 連線：`connectionProgress = min(sourceLayerProgress, targetLayerProgress)`，確保兩端都出現後才顯示

`STAGGER_FRAMES` 預設 5（約 0.17 秒 @30fps），可在 props 中覆寫（用現有 `animationDuration`）。

### 4. 連線邊緣計算

新增 `getEdgePoint(sourceCenter, targetCenter, moduleRect)` 函式，計算從 module 矩形邊緣出發的點：

```typescript
const getEdgePoint = (
  fromCenter: Point,
  toCenter: Point,
  rect: { x: number; y: number; w: number; h: number }
): Point => {
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // 判斷從哪個邊出去
  if (absDx / rect.w > absDy / rect.h) {
    // 水平方向為主 → 左或右邊
    const edgeX = dx > 0 ? rect.x + rect.w : rect.x;
    return { x: edgeX, y: fromCenter.y };
  } else {
    // 垂直方向為主 → 上或下邊
    const edgeY = dy > 0 ? rect.y + rect.h : rect.y;
    return { x: fromCenter.x, y: edgeY };
  }
};
```

連線路徑改用邊緣點而非中心點。曲線的 control point 計算保持不變（基於起終點的中點偏移）。

### 5. Label 寬度修正

改用 `estimatedWidth` 計算：

```typescript
// 中文字平均 ~14px @fontSize=11, 英文 ~7px
const estimateWidth = (text: string, fontSize: number): number => {
  let w = 0;
  for (const ch of text) {
    w += ch.charCodeAt(0) > 0x7f ? fontSize * 1.2 : fontSize * 0.65;
  }
  return w;
};
const labelW = estimateWidth(conn.label, 11) + 16; // + padding
```

### 6. 移除 position 欄位

- `ModuleDefinitionSchema` 移除 `position` 欄位
- Schema 加 `.strip()` 確保舊 JSON 含 `position` 時不 fail（Zod v4 預設 strip unknown keys）
- Sample JSON 移除 `position` 欄位

### 關鍵決策

| 決策 | 選擇 | 替代方案 | 原因 |
|------|------|---------|------|
| Accent bar 裁切 | `clipPath` | `linearGradient` 左邊緣著色 | clipPath 語義更清晰，且保留 accent bar 作為獨立元素的可控性 |
| 入場動畫單位 | 以 layer 為單位 stagger | 以 module 為單位 stagger | layer 級動畫更有結構感，module 級太碎 |
| position 移除策略 | 直接移除 + strip | 保留為 optional deprecated | 沒有任何消費者使用，保留只增加混淆 |
| 連線邊緣算法 | 基於方向比例判斷出邊 | 精確射線-矩形交點計算 | 簡單方案對水平/垂直佈局足夠準確，精確算法 overkill |

## 資料變更

- `ModuleDefinitionSchema` 移除 `position: z.object({ row: z.number(), col: z.number() })`
- Sample JSON 移除對應欄位

## 測試策略

- Studio preview 驗證：用 `bun dev` 逐一檢查 GenesisVideo、IterationVideo、FullStoryVideo
- 視覺回歸：確認 sample data 渲染結果中層對齊、accent bar 正確、動畫流暢、連線不穿越
- Type check：`bun run lint` 確認 schema 變更不影響 type safety

## 向後相容性

- 非 breaking change：元件 props 不變
- Schema 變更：Zod v4 預設 strip unknown keys，舊 JSON 含 `position` 不會 fail
- `parse-archive.ts` 若產出 `position` 欄位，會被 schema strip 掉，不影響渲染
