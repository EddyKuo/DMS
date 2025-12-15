Phase 1: 專案初始化與基礎架構 (Infrastructure)
這個階段建立專案骨架，並配置好 UI 主題引擎，這是實現「明暗色調」與「科技感」的基礎。

[ ] 建立 React 專案: 使用 Vite (推薦，比 CRA 更快) 初始化專案。

Command: npm create vite@latest frontend -- --template react-ts (強烈建議用 TypeScript 配合您的後端 API 結構)。

[ ] 安裝核心依賴:

@mui/material @emotion/react @emotion/styled: MUI 核心。

@mui/icons-material: 圖標庫。

axios: 處理 HTTP 請求。

react-router-dom: 雖然頁面少，但仍需要處理 / 和 /login 或特定檔案連結。

zustand 或 react-query: 狀態管理 (推薦 Zustand 輕量簡單，或 React Query 處理 Server State)。

[ ] 配置科技感主題 (Theming):

建立 theme.ts。

[ ] 色彩定義: 定義 "Tech Blue" (#00bcd4) 或 "Neon Green" (#00e676) 作為 Primary Color。

[ ] 暗黑模式: 設定 palette.mode: 'dark' 作為預設，搭配深灰背景 (非純黑) 增加層次感。

[ ] 字體: 選用 Roboto 或 Inter，標題可考慮 Orbitron (科技感字體)。

[ ] 建立全域 Layout:

實作 MainLayout.tsx：包含頂部導覽列 (AppBar) 和側邊欄 (Drawer/Sidebar)。

加入「明暗切換開關 (Theme Toggle)」。

Phase 2: 核心功能模組 - 檔案總管 (File Explorer)
這是使用者的主戰場，目標是模仿現代 OS 的檔案總管體驗。

[ ] API 串接層 (Service Layer):

建立 api/client.ts: 設定 Axios Instance (Base URL, Timeout)。

封裝 API 呼叫: getFiles(), createFolder(), deleteFile().

[ ] 麵包屑導航 (Breadcrumbs):

實作頂部路徑顯示 (例如: Home > Documents > Project A)，支援點擊跳轉。

[ ] 檔案列表視圖 (Data Grid):

使用 MUI DataGrid 或 Table 元件。

[ ] 欄位: 圖示 (根據檔案類型變化)、檔名、大小、上傳時間、標籤。

[ ] 互動: 實作「單擊選取」、「雙擊進入資料夾/預覽檔案」。

[ ] 右鍵選單 (Context Menu):

實作自定義右鍵選單：包含 Download, Info, Delete, Share。

Phase 3: 上傳與互動體驗 (Upload & Interaction)
這裡要展現「科技感」，使用動畫與即時反饋。

[ ] 拖曳上傳區 (Drag & Drop Zone):

實作一個 Dropzone 區域 (或全螢幕拖曳偵測)。

視覺效果: 當檔案拖入時，邊框發光 (Neon Glow effect)。

[ ] 上傳進度管理器 (Upload Manager):

[ ] 實作一個浮動視窗 (Floating Panel) 或右下角 Snackbar。

[ ] 顯示每個檔案的上傳進度條 (Linear Progress)。

[ ] 搜尋與過濾 (Search Bar):

實作頂部全域搜尋框 (類似 Spotlight 效果)。

支援依 Tag 或 Date 篩選。

Phase 4: 檔案詳情與預覽 (Detail & Preview)
避免跳轉頁面，使用「抽屜 (Drawer)」或「模態視窗 (Modal)」來顯示資訊。

[ ] 檔案詳情側欄 (Info Drawer):

當選取檔案時，右側滑出詳細資訊欄。

顯示內容：縮圖、詳細 Meta Data、Tags (支援新增/刪除 Tag)。

[ ] 分享功能 (Share Dialog):

點擊分享後彈出 Dialog。

設定過期時間 (Slider 元件)。

顯示生成的連結與「複製」按鈕。

[ ] 檔案預覽 (Preview Modal):

針對圖片/PDF 實作直接預覽功能。

UI 設計建議：如何營造「現代科技感」？
為了達成您想要的風格，請在開發時參考以下視覺準則：

玻璃擬態 (Glassmorphism): 在側邊欄或浮動視窗使用半透明模糊背景 (backdrop-filter: blur(10px) + 半透明背景色)。

霓虹光暈 (Neon Glow): 在選取狀態 (Active State) 或按鈕 Hover 時，加上 box-shadow 的發光效果。

微互動 (Micro-interactions): 按鈕點擊時的波紋效果 (Ripple)，列表載入時的骨架屏 (Skeleton) 動畫。

數據視覺化: 在 Dashboard 首頁加入簡單的圓餅圖或儀表板 (使用 Recharts) 顯示儲存空間使用量。