from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]

    class Config:
        from_attributes = True


class TagResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class TagCreate(BaseModel):
    name: str


class FileVersionResponse(BaseModel):
    """檔案版本回應"""
    id: int
    version_number: int
    sha1_hash: Optional[str] = None
    size: int
    content_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class FileResponse(BaseModel):
    """檔案記錄回應 (含版本資訊)"""
    id: int
    filename: str
    content_type: Optional[str] = None
    size: Optional[int] = 0
    category: str
    uploaded_at: Optional[datetime] = None
    folder_id: Optional[int] = None
    tags: List[TagResponse] = []
    
    # 版本資訊
    version_count: int = 1
    current_version: Optional[FileVersionResponse] = None

    class Config:
        from_attributes = True

class FileUpdate(BaseModel):
    filename: Optional[str] = None
    folder_id: Optional[int] = None

class FolderContentsResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    sub_folders: List[FolderResponse] = []
    files: List[FileResponse] = []

    class Config:
        from_attributes = True

class ShareResponse(BaseModel):
    url: str
    expires_at: datetime

class SystemStats(BaseModel):
    total_files: int
    total_size_bytes: int
    storage_usage_percent: float = 0.0
    categories: dict
