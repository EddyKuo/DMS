"""
資料庫遷移腳本：新增檔案版本控管功能

此腳本將：
1. 建立 file_versions 表
2. 將現有 file_records 資料遷移至 file_versions
3. 修改 file_records 表結構

使用方式：
    python -m migrations.add_versioning

注意：請先備份資料庫！
"""

import sqlite3
import hashlib
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATABASE_PATH = "./dms.db"

# SHA1 計算常數
LARGE_FILE_THRESHOLD = 10 * 1024 * 1024  # 10 MB
CHUNK_SIZE = 1 * 1024 * 1024  # 1 MB


def calculate_sha1_from_file(file_path: str) -> str:
    """計算檔案 SHA1 (與 utils.py 邏輯相同)"""
    try:
        size = os.path.getsize(file_path)
        
        with open(file_path, 'rb') as f:
            if size <= LARGE_FILE_THRESHOLD:
                return hashlib.sha1(f.read()).hexdigest()
            
            # 大檔案：取樣計算
            hasher = hashlib.sha1()
            
            # 前 1MB
            hasher.update(f.read(CHUNK_SIZE))
            
            # 中間 1MB
            mid_start = (size // 2) - (CHUNK_SIZE // 2)
            f.seek(mid_start)
            hasher.update(f.read(CHUNK_SIZE))
            
            # 後 1MB
            f.seek(-CHUNK_SIZE, 2)
            hasher.update(f.read(CHUNK_SIZE))
            
            # 加入檔案大小
            hasher.update(str(size).encode())
            
            return hasher.hexdigest()
    except Exception as e:
        print(f"  [警告] 無法計算 SHA1 for {file_path}: {e}")
        return "0" * 40  # 返回空 hash


def migrate():
    """執行遷移"""
    
    if not os.path.exists(DATABASE_PATH):
        print(f"[錯誤] 資料庫不存在: {DATABASE_PATH}")
        print("如果是全新安裝，請直接啟動應用程式，SQLAlchemy 會自動建立新結構。")
        return False
    
    # 備份資料庫
    backup_path = DATABASE_PATH + ".backup"
    print(f"[1/5] 備份資料庫到 {backup_path}...")
    import shutil
    shutil.copy(DATABASE_PATH, backup_path)
    
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # 檢查是否已經遷移過
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='file_versions'")
        if cursor.fetchone():
            print("[資訊] file_versions 表已存在，跳過遷移。")
            return True
        
        print("[2/5] 建立 file_versions 表...")
        cursor.execute("""
            CREATE TABLE file_versions (
                id INTEGER PRIMARY KEY,
                file_id INTEGER NOT NULL,
                version_number INTEGER DEFAULT 1,
                sha1_hash VARCHAR(40),
                size INTEGER,
                content_type VARCHAR,
                bucket_name VARCHAR,
                object_name VARCHAR UNIQUE,
                uploaded_at DATETIME,
                FOREIGN KEY (file_id) REFERENCES file_records(id)
            )
        """)
        cursor.execute("CREATE INDEX ix_file_versions_id ON file_versions(id)")
        cursor.execute("CREATE INDEX ix_file_versions_sha1_hash ON file_versions(sha1_hash)")
        
        print("[3/5] 遷移現有檔案資料到 file_versions...")
        cursor.execute("""
            SELECT id, content_type, size, bucket_name, object_name, uploaded_at 
            FROM file_records
        """)
        records = cursor.fetchall()
        
        version_data = []
        for record in records:
            # 嘗試計算 SHA1 (如果有 MinIO 存取權限的話)
            # 這裡暫時使用空 hash，實際使用時可能需要從 MinIO 下載檔案計算
            sha1_hash = "0" * 40  # placeholder
            
            version_data.append((
                record['id'],  # file_id
                1,  # version_number
                sha1_hash,
                record['size'],
                record['content_type'],
                record['bucket_name'],
                record['object_name'],
                record['uploaded_at']
            ))
        
        cursor.executemany("""
            INSERT INTO file_versions 
            (file_id, version_number, sha1_hash, size, content_type, bucket_name, object_name, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, version_data)
        
        print(f"  已遷移 {len(version_data)} 筆檔案版本記錄")
        
        print("[4/5] 更新 file_records 表結構...")
        
        # 新增 current_version_id 欄位
        cursor.execute("ALTER TABLE file_records ADD COLUMN current_version_id INTEGER")
        cursor.execute("ALTER TABLE file_records ADD COLUMN created_at DATETIME")
        
        # 設定 current_version_id 指向對應的 file_version
        cursor.execute("""
            UPDATE file_records 
            SET current_version_id = (
                SELECT id FROM file_versions WHERE file_versions.file_id = file_records.id LIMIT 1
            ),
            created_at = uploaded_at
        """)
        
        # 注意：SQLite 不支援直接刪除欄位
        # 舊欄位 (object_name, size, content_type, bucket_name) 會保留但不再使用
        # 如果需要完全移除，需要重建整個表
        
        print("[5/5] 建立外鍵索引...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_file_versions_file_id ON file_versions(file_id)")
        
        conn.commit()
        print("\n[成功] 遷移完成！")
        print(f"  - 建立了 file_versions 表")
        print(f"  - 遷移了 {len(version_data)} 筆版本記錄")
        print(f"  - 更新了 file_records 表結構")
        print(f"\n備份檔案保存於: {backup_path}")
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n[錯誤] 遷移失敗: {e}")
        print("資料庫已回滾，請檢查錯誤後重試。")
        return False
        
    finally:
        conn.close()


def check_migration_status():
    """檢查遷移狀態"""
    if not os.path.exists(DATABASE_PATH):
        print(f"資料庫不存在: {DATABASE_PATH}")
        return
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 檢查 file_versions 表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='file_versions'")
    has_versions = cursor.fetchone() is not None
    
    # 檢查 current_version_id 欄位
    cursor.execute("PRAGMA table_info(file_records)")
    columns = [row[1] for row in cursor.fetchall()]
    has_current_version = 'current_version_id' in columns
    
    conn.close()
    
    print("=== 遷移狀態 ===")
    print(f"file_versions 表: {'✓ 存在' if has_versions else '✗ 不存在'}")
    print(f"current_version_id 欄位: {'✓ 存在' if has_current_version else '✗ 不存在'}")
    
    if has_versions and has_current_version:
        print("\n狀態: 已完成遷移")
    else:
        print("\n狀態: 需要執行遷移")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="DMS 資料庫遷移工具")
    parser.add_argument("--check", action="store_true", help="檢查遷移狀態")
    parser.add_argument("--migrate", action="store_true", help="執行遷移")
    
    args = parser.parse_args()
    
    if args.check:
        check_migration_status()
    elif args.migrate:
        migrate()
    else:
        parser.print_help()
