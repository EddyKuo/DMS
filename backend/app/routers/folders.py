from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Folder, FileRecord, User
from ..schemas import FolderCreate, FolderResponse, FolderContentsResponse
from ..auth import get_current_user
from typing import List

router = APIRouter()

@router.post("/folders", response_model=FolderResponse)
def create_folder(folder: FolderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if folder.parent_id:
        parent = db.query(Folder).filter(Folder.id == folder.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
            
    db_folder = Folder(name=folder.name, parent_id=folder.parent_id)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.get("/folders", response_model=List[FolderResponse])
def list_folders(parent_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # List folders that are children of parent_id (or root if None)
    filter_spec = Folder.parent_id == parent_id if parent_id is not None else Folder.parent_id.is_(None)
    folders = db.query(Folder).filter(filter_spec).all()
    return folders

@router.get("/folders/{folder_id}", response_model=FolderContentsResponse)
def get_folder_contents(folder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if folder_id == 0:
        # Root Folder
        db_folder = Folder(id=0, name="Root", parent_id=None) # Virtual object
        sub_folders = db.query(Folder).filter(Folder.parent_id == None).all()
        files = db.query(FileRecord).filter(FileRecord.folder_id == None).all()
    else:
        # Standard Folder
        db_folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not db_folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        # Subfolders
        sub_folders = db.query(Folder).filter(Folder.parent_id == folder_id).all()
        # Files
        files = db.query(FileRecord).filter(FileRecord.folder_id == folder_id).all() # Accessing relationship ideally, but query works too
    
    return {
        "id": db_folder.id,
        "name": db_folder.name,
        "parent_id": db_folder.parent_id,
        "sub_folders": sub_folders,
        "files": files
    }

def delete_folder_contents(folder_id: int, db: Session):
    """刪除資料夾內所有內容 (檔案及子資料夾)"""
    from ..storage import delete_file_from_minio
    from ..models import FileVersion
    
    # 1. Delete all files in this folder
    files = db.query(FileRecord).filter(FileRecord.folder_id == folder_id).all()
    for file in files:
        # First, delete all versions from MinIO and database
        for version in file.versions:
            try:
                delete_file_from_minio(version.object_name)
            except Exception:
                pass  # Continue deletion even if storage fails
            db.delete(version)
        
        # Then delete the file record
        db.delete(file)
    
    # 2. Recursively delete subfolders
    subfolders = db.query(Folder).filter(Folder.parent_id == folder_id).all()
    for subfolder in subfolders:
        delete_folder_contents(subfolder.id, db)
        db.delete(subfolder)

@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, recursive: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Check contents
    subfolders = db.query(Folder).filter(Folder.parent_id == folder_id).all()
    files = db.query(FileRecord).filter(FileRecord.folder_id == folder_id).all()
    
    has_contents = len(subfolders) > 0 or len(files) > 0
    
    if has_contents:
        if not recursive:
            raise HTTPException(status_code=400, detail="Folder is not empty. Use recursive=true to delete.")
        else:
            delete_folder_contents(folder_id, db)
    
    db.delete(db_folder)
    db.commit()
    return {"message": "Folder deleted successfully"}
