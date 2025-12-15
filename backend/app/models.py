from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

file_tags = Table('file_tags', Base.metadata,
    Column('file_id', Integer, ForeignKey('file_records.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    files = relationship("FileRecord", secondary=file_tags, back_populates="tags")

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    
    files = relationship("FileRecord", back_populates="folder")
    subfolders = relationship("Folder", backref="parent", remote_side=[id])


class FileVersion(Base):
    """檔案版本 - 儲存每個版本的實際檔案資料"""
    __tablename__ = "file_versions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("file_records.id"), nullable=False)
    version_number = Column(Integer, default=1)
    sha1_hash = Column(String(40), index=True)  # SHA1 produces 40 hex chars
    size = Column(Integer)
    content_type = Column(String)
    bucket_name = Column(String)
    object_name = Column(String, unique=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to FileRecord
    file = relationship("FileRecord", back_populates="versions", foreign_keys=[file_id])


class FileRecord(Base):
    """檔案記錄 - 代表邏輯檔案，可關聯多個版本"""
    __tablename__ = "file_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    category = Column(String, index=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 指向當前版本 (使用 use_alter 避免循環依賴)
    current_version_id = Column(Integer, ForeignKey("file_versions.id", use_alter=True), nullable=True)

    # Relationships
    folder = relationship("Folder", back_populates="files")
    tags = relationship("Tag", secondary=file_tags, back_populates="files")
    versions = relationship("FileVersion", back_populates="file", foreign_keys=[FileVersion.file_id], order_by=FileVersion.version_number)
    
    # 當前版本快捷屬性
    current_version = relationship("FileVersion", foreign_keys=[current_version_id], post_update=True)
    
    # 向後相容的屬性 (從當前版本取得)
    @property
    def content_type(self):
        return self.current_version.content_type if self.current_version else None
    
    @property
    def size(self):
        return self.current_version.size if self.current_version else 0
    
    @property
    def bucket_name(self):
        return self.current_version.bucket_name if self.current_version else None
    
    @property
    def object_name(self):
        return self.current_version.object_name if self.current_version else None
    
    @property
    def uploaded_at(self):
        return self.current_version.uploaded_at if self.current_version else self.created_at

