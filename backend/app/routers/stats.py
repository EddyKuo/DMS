from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import FileRecord, FileVersion, User
from ..schemas import SystemStats
from ..auth import get_current_user

router = APIRouter()

@router.get("/stats", response_model=SystemStats)
def get_system_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_files = db.query(FileRecord).count()
    
    # Query size from FileVersion table (size was moved there for versioning)
    total_size = db.query(func.sum(FileVersion.size)).scalar() or 0
    
    # Category breakdown
    categories = db.query(FileRecord.category, func.count(FileRecord.id)).group_by(FileRecord.category).all()
    category_stats = {cat: count for cat, count in categories}
    
    # Placeholder for storage usage (assuming 1GB limit for demo)
    usage_percent = (total_size / (1024 * 1024 * 1024)) * 100
    
    return {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "storage_usage_percent": round(usage_percent, 2),
        "categories": category_stats
    }

