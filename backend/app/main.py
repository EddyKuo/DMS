from fastapi import FastAPI
from .database import engine, Base
from .storage import init_bucket
from .routers import files, folders, stats

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DMS Backend")

@app.on_event("startup")
def startup_event():
    # Ensure MinIO bucket exists
    try:
        init_bucket()
    except Exception as e:
        print(f"Error initializing MinIO bucket: {e}")

app.include_router(files.router)
app.include_router(folders.router)
app.include_router(stats.router)
