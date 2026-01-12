from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import StreamingResponse
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import FileRecord, FileVersion, Tag, User
from ..storage import upload_file_to_minio, download_file_from_minio, BUCKET_NAME
from ..schemas import FileUpdate, FileResponse, TagCreate, ShareResponse, FileVersionResponse
from ..utils import calculate_sha1
from ..auth import get_current_user
from datetime import datetime
import uuid
import io

router = APIRouter()


def build_file_response(db_file: FileRecord) -> dict:
    """構建包含版本資訊的檔案回應"""
    return {
        "id": db_file.id,
        "filename": db_file.filename,
        "content_type": db_file.content_type,
        "size": db_file.size,
        "category": db_file.category,
        "uploaded_at": db_file.uploaded_at,
        "folder_id": db_file.folder_id,
        "tags": db_file.tags,
        "version_count": len(db_file.versions),
        "current_version": db_file.current_version
    }


@router.post("/upload", response_model=FileResponse)
def upload_file(file: UploadFile = File(...), folder_id: int = Form(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Read file content
    content = file.file.read()
    size = len(content)
    file_obj = io.BytesIO(content)
    
    # Calculate SHA1 hash
    sha1_hash = calculate_sha1(content, size)
    
    # Generate unique object name
    object_name = f"{uuid.uuid4()}-{file.filename}"
    
    # Determine Category
    mime = file.content_type
    if mime.startswith("image/"):
        category = "image"
    elif mime.startswith("video/"):
        category = "video"
    elif mime.startswith("audio/"):
        category = "audio"
    elif mime.startswith("text/") or "pdf" in mime or "msword" in mime or "officedocument" in mime:
        category = "document"
    elif "zip" in mime or "tar" in mime or "7z" in mime:
        category = "archive"
    else:
        category = "other"

    # Check for existing file with same filename in same folder
    existing_file = db.query(FileRecord).filter(
        FileRecord.filename == file.filename,
        FileRecord.folder_id == folder_id
    ).first()
    
    if existing_file:
        # Check if content is identical (SHA1 match)
        if existing_file.current_version and existing_file.current_version.sha1_hash == sha1_hash:
            raise HTTPException(
                status_code=409, 
                detail=f"相同內容的檔案已存在 (版本 {existing_file.current_version.version_number})"
            )
        
        # Create new version
        new_version_number = len(existing_file.versions) + 1
        
        # Upload to MinIO
        try:
            file_obj.seek(0)
            upload_file_to_minio(file_obj, size, object_name, file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")
        
        # Create FileVersion record
        new_version = FileVersion(
            file_id=existing_file.id,
            version_number=new_version_number,
            sha1_hash=sha1_hash,
            size=size,
            content_type=file.content_type,
            bucket_name=BUCKET_NAME,
            object_name=object_name
        )
        db.add(new_version)
        db.commit()
        
        # Update current version pointer
        existing_file.current_version_id = new_version.id
        db.commit()
        db.refresh(existing_file)
        
        return build_file_response(existing_file)
    
    else:
        # New file - create FileRecord and first FileVersion
        
        # Upload to MinIO first
        try:
            file_obj.seek(0)
            upload_file_to_minio(file_obj, size, object_name, file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")
        
        # Create FileRecord
        db_file = FileRecord(
            filename=file.filename,
            category=category,
            folder_id=folder_id
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Create first FileVersion
        first_version = FileVersion(
            file_id=db_file.id,
            version_number=1,
            sha1_hash=sha1_hash,
            size=size,
            content_type=file.content_type,
            bucket_name=BUCKET_NAME,
            object_name=object_name
        )
        db.add(first_version)
        db.commit()
        
        # Set current version
        db_file.current_version_id = first_version.id
        db.commit()
        db.refresh(db_file)
        
        return build_file_response(db_file)


@router.get("/download/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not db_file.current_version:
        raise HTTPException(status_code=404, detail="No version found for this file")
        
    try:
        response = download_file_from_minio(db_file.current_version.object_name)
        
        return StreamingResponse(
            response,
            media_type=db_file.current_version.content_type,
            headers={"Content-Disposition": f"attachment; filename={db_file.filename}"}
        )
    except Exception as e:
        print(f"Error downloading: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download file or file not found in storage")


@router.get("/history", response_model=List[FileResponse])
def get_upload_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    files = db.query(FileRecord).order_by(FileRecord.created_at.desc()).offset(skip).limit(limit).all()
    return [build_file_response(f) for f in files]


@router.delete("/files/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete all versions from MinIO
    from ..storage import delete_file_from_minio
    for version in db_file.versions:
        try:
            delete_file_from_minio(version.object_name)
        except Exception as e:
            print(f"Error removing version {version.version_number} from storage: {e}")
        db.delete(version)
    
    db.delete(db_file)
    db.commit()
    return {"message": "File and all versions deleted successfully"}


@router.put("/files/{file_id}", response_model=FileResponse)
def update_file_metadata(file_id: int, file_update: FileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    if file_update.filename:
        db_file.filename = file_update.filename
    if file_update.folder_id is not None:
        db_file.folder_id = file_update.folder_id
        
    db.commit()
    db.refresh(db_file)
    return build_file_response(db_file)


@router.get("/files/{file_id}/info", response_model=FileResponse)
def get_file_info(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    return build_file_response(db_file)


# ========== 版本管理 API ==========

@router.get("/files/{file_id}/versions", response_model=List[FileVersionResponse])
def list_versions(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """列出檔案的所有版本"""
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return db_file.versions


@router.get("/files/{file_id}/versions/{version_id}/download")
def download_version(file_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """下載特定版本"""
    version = db.query(FileVersion).filter(
        FileVersion.id == version_id,
        FileVersion.file_id == file_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    
    try:
        response = download_file_from_minio(version.object_name)
        return StreamingResponse(
            response,
            media_type=version.content_type,
            headers={"Content-Disposition": f"attachment; filename={db_file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download version: {str(e)}")


@router.delete("/files/{file_id}/versions/{version_id}")
def delete_version(file_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """刪除特定版本 (不可刪除最後一個版本)"""
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if len(db_file.versions) <= 1:
        raise HTTPException(status_code=400, detail="無法刪除最後一個版本，請改用刪除檔案功能")
    
    version = db.query(FileVersion).filter(
        FileVersion.id == version_id,
        FileVersion.file_id == file_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # If deleting current version, switch to the previous version
    if db_file.current_version_id == version_id:
        # Find the latest version that isn't this one
        other_versions = [v for v in db_file.versions if v.id != version_id]
        db_file.current_version_id = other_versions[-1].id
        db.commit()
    
    # Delete from MinIO
    from ..storage import delete_file_from_minio
    try:
        delete_file_from_minio(version.object_name)
    except Exception as e:
        print(f"Error removing version from storage: {e}")
    
    db.delete(version)
    db.commit()
    
    return {"message": f"版本 {version.version_number} 已刪除"}


@router.put("/files/{file_id}/versions/{version_id}/restore", response_model=FileResponse)
def restore_version(file_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """還原到特定版本 (將 current_version 切換到該版本)"""
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    version = db.query(FileVersion).filter(
        FileVersion.id == version_id,
        FileVersion.file_id == file_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    db_file.current_version_id = version_id
    db.commit()
    db.refresh(db_file)
    
    return build_file_response(db_file)


# ========== 現有 API ==========

@router.get("/search", response_model=List[FileResponse])
def search_files(q: str = None, category: str = None, tag: str = None, start_date: datetime = None, end_date: datetime = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(FileRecord)
    if q:
        # Case insensitive search on filename
        # Also search in Tags if q is provided (advanced search)
        query = query.outerjoin(FileRecord.tags).filter(
            or_(
                FileRecord.filename.ilike(f"%{q}%"),
                Tag.name.ilike(f"%{q}%")
            )
        )
    if category:
        query = query.filter(FileRecord.category == category)
    if tag:
        # Exact match for tag filter
        query = query.join(FileRecord.tags).filter(Tag.name == tag)
    if start_date:
        query = query.filter(FileRecord.created_at >= start_date)
    if end_date:
        query = query.filter(FileRecord.created_at <= end_date)
    
    # Distinct because join might return duplicates
    results = query.distinct().all()
    return [build_file_response(f) for f in results]


@router.post("/files/{file_id}/tags", response_model=FileResponse)
def add_tag(file_id: int, tag: TagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    tag_name = tag.name
    db_tag = db.query(Tag).filter(Tag.name == tag_name).first()
    if not db_tag:
        db_tag = Tag(name=tag_name)
        db.add(db_tag)
        db.commit()
    
    if db_tag not in db_file.tags:
        db_file.tags.append(db_tag)
        db.commit()
        
    db.refresh(db_file)
    return build_file_response(db_file)


@router.delete("/files/{file_id}/tags/{tag_name}")
def remove_tag(file_id: int, tag_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    tag = db.query(Tag).filter(Tag.name == tag_name).first()
    if tag and tag in db_file.tags:
        db_file.tags.remove(tag)
        db.commit()
        
    return {"message": "Tag removed", "tags": [t.name for t in db_file.tags]}


@router.get("/files/{file_id}/share", response_model=ShareResponse)
def share_file(file_id: int, hours: int = 1, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not db_file.current_version:
        raise HTTPException(status_code=404, detail="No version found for this file")
        
    from ..storage import get_presigned_url
    from datetime import timedelta, datetime
    
    expires_in = timedelta(hours=hours)
    url = get_presigned_url(db_file.current_version.object_name, expires=expires_in)
    expires_at = datetime.utcnow() + expires_in
    
    return {"url": url, "expires_at": expires_at}

