# DMS Backend - 文件管理系統後端

基於 FastAPI 的文件管理系統後端，支援檔案上傳、下載、版本控管、資料夾管理及標籤分類。

## 技術架構

| 組件 | 技術 |
|------|------|
| Web 框架 | FastAPI |
| 資料庫 | SQLite + SQLAlchemy |
| 物件儲存 | MinIO (S3 相容) |
| 資料驗證 | Pydantic V2 |

## 快速開始

### 1. 安裝依賴

```bash
cd backend
python -m venv .
.\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. 啟動 MinIO

```bash
docker-compose up -d
```

MinIO Console: http://localhost:9001 (admin / password)

### 3. 啟動後端服務

```bash
.\Scripts\activate
uvicorn app.main:app --reload
```

API 文件: http://localhost:8000/docs

---

## 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `MINIO_ENDPOINT` | `localhost:9000` | MinIO 端點 |
| `MINIO_ACCESS_KEY` | `admin` | MinIO 存取金鑰 |
| `MINIO_SECRET_KEY` | `password` | MinIO 密鑰 |
| `BUCKET_NAME` | `dms-files` | 儲存桶名稱 |

---

## 資料模型

### FileRecord (檔案記錄)
```json
{
  "id": 1,
  "filename": "document.pdf",
  "category": "document",
  "folder_id": null,
  "created_at": "2024-01-01T00:00:00"
}
```

### FileVersion (檔案版本)
```json
{
  "id": 1,
  "file_id": 1,
  "version_number": 1,
  "sha1_hash": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
  "size": 12345,
  "content_type": "application/pdf",
  "uploaded_at": "2024-01-01T00:00:00"
}
```

### Folder (資料夾)
```json
{
  "id": 1,
  "name": "Documents",
  "parent_id": null
}
```

### Tag (標籤)
```json
{
  "id": 1,
  "name": "important"
}
```

---

# API 參考

## 檔案管理

### POST /upload
上傳檔案，支援版本控管。

**Request:**
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.pdf" \
  -F "folder_id=1"
```

**Response (201):**
```json
{
  "id": 1,
  "filename": "document.pdf",
  "content_type": "application/pdf",
  "size": 12345,
  "category": "document",
  "uploaded_at": "2024-01-01T12:00:00",
  "folder_id": 1,
  "tags": [],
  "version_count": 1,
  "current_version": {
    "id": 1,
    "version_number": 1,
    "sha1_hash": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    "size": 12345,
    "content_type": "application/pdf",
    "uploaded_at": "2024-01-01T12:00:00"
  }
}
```

**版本控管行為:**
- 新檔案: 建立 FileRecord + FileVersion (version 1)
- 相同檔名、不同內容: 建立新 FileVersion (version N+1)
- 相同檔名、相同內容 (SHA1 相同): 回傳 409 錯誤

**Error (409):**
```json
{
  "detail": "相同內容的檔案已存在 (版本 1)"
}
```

---

### GET /download/{file_id}
下載檔案 (當前版本)。

**Request:**
```bash
curl -O http://localhost:8000/download/1
```

**Response:** 檔案串流 (application/octet-stream)

---

### GET /history
取得上傳歷史記錄。

**Request:**
```bash
curl "http://localhost:8000/history?skip=0&limit=10"
```

| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| `skip` | int | 0 | 跳過筆數 |
| `limit` | int | 100 | 回傳筆數上限 |

**Response (200):**
```json
[
  {
    "id": 1,
    "filename": "document.pdf",
    "content_type": "application/pdf",
    "size": 12345,
    "category": "document",
    "uploaded_at": "2024-01-01T12:00:00",
    "folder_id": null,
    "tags": [],
    "version_count": 2,
    "current_version": { ... }
  }
]
```

---

### GET /files/{file_id}/info
取得檔案詳細資訊。

**Request:**
```bash
curl http://localhost:8000/files/1/info
```

**Response (200):** 同 `/upload` 回應格式

---

### PUT /files/{file_id}
更新檔案元資料。

**Request:**
```bash
curl -X PUT http://localhost:8000/files/1 \
  -H "Content-Type: application/json" \
  -d '{"filename": "new_name.pdf", "folder_id": 2}'
```

**Request Body:**
```json
{
  "filename": "new_name.pdf",
  "folder_id": 2
}
```

**Response (200):** 更新後的 FileResponse

---

### DELETE /files/{file_id}
刪除檔案及所有版本。

**Request:**
```bash
curl -X DELETE http://localhost:8000/files/1
```

**Response (200):**
```json
{
  "message": "File and all versions deleted successfully"
}
```

---

### GET /search
搜尋檔案。

**Request:**
```bash
curl "http://localhost:8000/search?q=report&category=document&tag=important"
```

| 參數 | 類型 | 說明 |
|------|------|------|
| `q` | string | 檔名關鍵字 |
| `category` | string | 分類 (image/video/audio/document/archive/other) |
| `tag` | string | 標籤名稱 |
| `start_date` | datetime | 開始日期 (ISO 8601) |
| `end_date` | datetime | 結束日期 (ISO 8601) |

**Response (200):** FileResponse 陣列

---

## 版本管理

### GET /files/{file_id}/versions
列出檔案所有版本。

**Request:**
```bash
curl http://localhost:8000/files/1/versions
```

**Response (200):**
```json
[
  {
    "id": 1,
    "version_number": 1,
    "sha1_hash": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    "size": 12345,
    "content_type": "application/pdf",
    "uploaded_at": "2024-01-01T12:00:00"
  },
  {
    "id": 2,
    "version_number": 2,
    "sha1_hash": "b94a8fe5ccb19ba61c4c0873d391e987982fbbd4",
    "size": 12500,
    "content_type": "application/pdf",
    "uploaded_at": "2024-01-02T12:00:00"
  }
]
```

---

### GET /files/{file_id}/versions/{version_id}/download
下載特定版本。

**Request:**
```bash
curl -O http://localhost:8000/files/1/versions/1/download
```

**Response:** 檔案串流

---

### PUT /files/{file_id}/versions/{version_id}/restore
還原到特定版本。

**Request:**
```bash
curl -X PUT http://localhost:8000/files/1/versions/1/restore
```

**Response (200):** 更新後的 FileResponse (current_version 切換到指定版本)

---

### DELETE /files/{file_id}/versions/{version_id}
刪除特定版本。

**Request:**
```bash
curl -X DELETE http://localhost:8000/files/1/versions/2
```

**Response (200):**
```json
{
  "message": "版本 2 已刪除"
}
```

**Error (400):** 無法刪除最後一個版本
```json
{
  "detail": "無法刪除最後一個版本，請改用刪除檔案功能"
}
```

---

## 標籤管理

### POST /files/{file_id}/tags
為檔案新增標籤。

**Request:**
```bash
curl -X POST http://localhost:8000/files/1/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "important"}'
```

**Response (200):** 更新後的 FileResponse

---

### DELETE /files/{file_id}/tags/{tag_name}
移除檔案標籤。

**Request:**
```bash
curl -X DELETE http://localhost:8000/files/1/tags/important
```

**Response (200):**
```json
{
  "message": "Tag removed",
  "tags": ["work", "draft"]
}
```

---

## 檔案分享

### GET /files/{file_id}/share
產生帶有時效的分享連結。

**Request:**
```bash
curl "http://localhost:8000/files/1/share?hours=24"
```

| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| `hours` | int | 1 | 連結有效時數 |

**Response (200):**
```json
{
  "url": "http://localhost:9000/dms-files/abc123...?X-Amz-Signature=...",
  "expires_at": "2024-01-02T12:00:00"
}
```

---

## 資料夾管理

### POST /folders
建立資料夾。

**Request:**
```bash
curl -X POST http://localhost:8000/folders \
  -H "Content-Type: application/json" \
  -d '{"name": "Documents", "parent_id": null}'
```

**Request Body:**
```json
{
  "name": "Documents",
  "parent_id": null
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Documents",
  "parent_id": null
}
```

---

### GET /folders
列出資料夾。

**Request:**
```bash
# 列出根目錄資料夾
curl http://localhost:8000/folders

# 列出特定資料夾的子資料夾
curl "http://localhost:8000/folders?parent_id=1"
```

**Response (200):**
```json
[
  {"id": 1, "name": "Documents", "parent_id": null},
  {"id": 2, "name": "Images", "parent_id": null}
]
```

---

### GET /folders/{folder_id}
取得資料夾內容 (子資料夾 + 檔案)。

**Request:**
```bash
# 取得根目錄內容 (folder_id = 0)
curl http://localhost:8000/folders/0

# 取得特定資料夾內容
curl http://localhost:8000/folders/1
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Documents",
  "parent_id": null,
  "sub_folders": [
    {"id": 3, "name": "Reports", "parent_id": 1}
  ],
  "files": [
    {
      "id": 1,
      "filename": "document.pdf",
      "content_type": "application/pdf",
      "size": 12345,
      "category": "document",
      "uploaded_at": "2024-01-01T12:00:00",
      "folder_id": 1,
      "tags": [],
      "version_count": 1,
      "current_version": { ... }
    }
  ]
}
```

---

### DELETE /folders/{folder_id}
刪除資料夾。

**Request:**
```bash
# 刪除空資料夾
curl -X DELETE http://localhost:8000/folders/1

# 遞迴刪除 (含子資料夾和檔案)
curl -X DELETE "http://localhost:8000/folders/1?recursive=true"
```

| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| `recursive` | bool | false | 是否遞迴刪除內容 |

**Response (200):**
```json
{
  "message": "Folder deleted successfully"
}
```

**Error (400):** 資料夾非空且未啟用遞迴
```json
{
  "detail": "Folder is not empty. Use recursive=true to delete."
}
```

---

## 系統統計

### GET /stats
取得系統統計資訊。

**Request:**
```bash
curl http://localhost:8000/stats
```

**Response (200):**
```json
{
  "total_files": 42,
  "total_size_bytes": 1073741824,
  "storage_usage_percent": 10.5,
  "categories": {
    "document": 20,
    "image": 15,
    "video": 5,
    "other": 2
  }
}
```

---

## 錯誤回應格式

所有錯誤回應遵循統一格式：

```json
{
  "detail": "錯誤訊息"
}
```

| HTTP 狀態碼 | 說明 |
|-------------|------|
| 400 | 請求參數錯誤 |
| 404 | 資源不存在 |
| 409 | 資源衝突 (如重複內容) |
| 500 | 伺服器內部錯誤 |

---

## 檔案分類規則

上傳時根據 MIME 類型自動分類：

| Category | MIME 類型 |
|----------|-----------|
| `image` | image/* |
| `video` | video/* |
| `audio` | audio/* |
| `document` | text/*, application/pdf, application/msword, officedocument |
| `archive` | application/zip, application/x-tar, application/x-7z |
| `other` | 其他 |

---

## SHA1 雜湊計算

用於版本控管的重複內容檢測：

- **小檔案 (≤10MB):** 完整內容計算
- **大檔案 (>10MB):** 取樣計算 (前 1MB + 中間 1MB + 後 1MB + 檔案大小)

---

## 資料庫遷移

### 檢查遷移狀態
```bash
.\Scripts\activate
python -m migrations.add_versioning --check
```

### 執行遷移
```bash
python -m migrations.add_versioning --migrate
```

---

## 專案結構

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI 應用程式入口
│   ├── database.py       # SQLAlchemy 設定
│   ├── models.py         # 資料模型 (FileRecord, FileVersion, Folder, Tag)
│   ├── schemas.py        # Pydantic 驗證模型
│   ├── storage.py        # MinIO 操作
│   ├── utils.py          # 工具函數 (SHA1 計算)
│   └── routers/
│       ├── files.py      # 檔案 API
│       ├── folders.py    # 資料夾 API
│       └── stats.py      # 統計 API
├── migrations/
│   └── add_versioning.py # 版本控管遷移腳本
├── docker-compose.yml    # MinIO 容器設定
├── requirements.txt      # Python 依賴
└── dms.db               # SQLite 資料庫
```

---

## License

MIT License
