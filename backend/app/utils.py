"""
DMS 工具函數
"""
import hashlib

# 當檔案大於此閾值時，使用快速 SHA1 計算
LARGE_FILE_THRESHOLD = 10 * 1024 * 1024  # 10 MB
CHUNK_SIZE = 1 * 1024 * 1024  # 1 MB


def calculate_sha1(content: bytes, size: int) -> str:
    """
    計算檔案 SHA1。
    
    - 小檔案 (<=10MB)：完整內容計算
    - 大檔案 (>10MB)：取前/中/後各 1MB 計算，避免長時間運算
    
    Args:
        content: 檔案內容
        size: 檔案大小 (bytes)
        
    Returns:
        SHA1 雜湊值 (hex string, 40 characters)
    """
    if size <= LARGE_FILE_THRESHOLD:
        # 小檔案：完整計算
        return hashlib.sha1(content).hexdigest()
    
    # 大檔案：取樣計算 (前/中/後各 1MB)
    hasher = hashlib.sha1()
    
    # 前 1MB
    hasher.update(content[:CHUNK_SIZE])
    
    # 中間 1MB
    mid_start = (size // 2) - (CHUNK_SIZE // 2)
    hasher.update(content[mid_start:mid_start + CHUNK_SIZE])
    
    # 後 1MB
    hasher.update(content[-CHUNK_SIZE:])
    
    # 加入檔案大小作為額外熵，降低碰撞機率
    hasher.update(str(size).encode())
    
    return hasher.hexdigest()
