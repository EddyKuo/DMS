# DMS - Document Management System

DMS 是一個功能完整的文件管理系統，結合了現代化的前端介面與高效能的後端 API。支援檔案上傳、版本控制、標籤管理、即時預覽及權限控管。

## 📂 專案結構

本專案採用前後端分離架構：

- **[Backend](backend/README.md)**: 基於 Python FastAPI 的 RESTful API 服務。
- **[Frontend](frontend/README.md)**: 基於 React + TypeScript + Vite 的單頁應用程式 (SPA)。
- **MinIO**: 使用 Docker 部署的 S3 相容物件儲存服務。

## 🚀 快速開始

### 1. 環境需求

#### 方法一：Docker (推薦)
- **Docker & Docker Compose**: 即可運行完整服務 (包含 Backend, Frontend, MinIO)。

#### 方法二：手動開發
- **Docker & Docker Compose**: 用於執行 MinIO 服務。
- **Python 3.8+**: 用於執行後端服務。
- **Node.js 18+**: 用於執行前端開發伺服器。

### 2. 啟動服務

#### 方法一：使用 Docker (推薦)

**一鍵啟動後端與資料庫 (Backend + MinIO)**
```bash
cd backend
docker-compose up -d
```
> 後端 API: http://localhost:8000/docs
> MinIO Console: http://localhost:9001 (admin/password)

**啟動前端介面 (Frontend)**
```bash
cd frontend
docker-compose up -d
```
> 前端頁面: http://localhost:3000

---

#### 方法二：手動開發部署

建議依照以下順序啟動各項服務：

**步驟一：啟動 MinIO (資料儲存)**

```bash
cd backend
docker-compose up -d
```
> MinIO Console: http://localhost:9001 (帳號: admin / 密碼: password)

**步驟二：啟動後端 API**

開啟一個新的終端機視窗：

```bash
cd backend
# 建立虛擬環境 (首次執行)
python -m venv .
.\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 執行資料庫遷移
python -m migrations.add_versioning --migrate

# 啟動伺服器
uvicorn app.main:app --reload
```
> API 文件: http://localhost:8000/docs/

**步驟三：啟動前端介面**

開啟另一個新的終端機視窗：

```bash
cd frontend
# 安裝依賴 (首次執行)
npm install

# 啟動開發伺服器
npm run dev
```
> 前端頁面: http://localhost:5173

## ✨ 主要功能

- **檔案管理**: 支援拖曳上傳、資料夾巢狀結構、檔案移動/複製/刪除。
- **版本控制**: 自動記錄檔案變更，支援隨時還原至舊版本。
- **智慧分類**: 根據檔案類型自動分類 (圖片、文件、影片等)。
- **標籤系統**: 自訂標籤以便於搜尋與管理。
- **分享功能**: 產生帶有時效性的安全分享連結。
- **多語系支援**: 完整支援繁體中文、簡體中文與英文介面。
- **深色模式**: 支援系統自動切換或手動切換深色/淺色主題。

## 🛠️ 技術堆疊

### Backend
- **Framework**: FastAPI
- **Database**: SQLite (透過 SQLAlchemy ORM)
- **Storage**: MinIO (S3 Compatible)
- **Validation**: Pydantic V2

### Frontend
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **UI Library**: MUI (Material-UI) v7
- **State Management**: Zustand
- **Charts**: Recharts

## 📄 文件

更多詳細資訊請參考各目錄下的 README：

- [後端說明文件](backend/README.md)
- [前端說明文件](frontend/README.md)

## 📝 License

MIT License
