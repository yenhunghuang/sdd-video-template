# SDD Video Template — Constitution

## Project Purpose

一個 Remotion 專案模板，將 SDD 工作流的結構化產出（SpecKit + OpenSpec）自動轉換為專案開發過程的解說影片。目標用戶：FDE 交付 POC、SDD 課程學員、企業客戶 PM/主管。

## Core Principles

| # | 原則 | 為什麼 |
|---|------|--------|
| 1 | **資料驅動** — 所有影片 component 接受 JSON props，不硬編碼內容 | clone → 換資料 → 渲染，零修改程式碼 |
| 2 | **簡單動畫** — 以 typewriter、spring、fade 為主，避免複雜重疊動畫 | 降低維護成本，確保渲染穩定性 |
| 3 | **Remotion 慣例** — 遵循 useCurrentFrame / interpolate / spring 模式 | 與 Remotion 生態一致，降低學習曲線 |
| 4 | **單一資料流** — SDD 產出 → parse → JSON → Remotion component → MP4 | 職責清晰，每層可獨立測試 |
| 5 | **模板可複製** — 不假設特定專案結構，僅依賴 archived/ 的標準格式 | 任何 SDD 專案都能直接使用 |

## Technical Boundaries

| 可以做 | 不做 |
|--------|------|
| Motion Graphics（文字動畫、圖表、架構圖）| 真人影片/實拍剪輯 |
| 1920x1080 30fps 橫屏 | SaaS 化（無後端、無登入）|
| 單支影片 ≤ 120 秒 | ElevenLabs 配音（Phase 1）|
| JSON 驅動的參數化影片 | 超過 120 秒的長影片 |
| TailwindCSS 樣式 | 複雜的自訂 CSS 動畫系統 |

## Quality Standards

- 每個影片 template component 可獨立渲染、獨立測試
- parse-archive.ts 對任意 archived/NNN-xxx/ 輸出一致的 JSON schema
- `bun run render` 能從範例 JSON 產出可播放的 MP4
- 所有共用 component 有明確的 props interface，無 `any` type
