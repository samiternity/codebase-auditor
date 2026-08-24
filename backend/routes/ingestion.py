from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from services.ingestion import IngestionService

router = APIRouter(prefix="/api/repositories", tags=["Repositories"])

class IngestRequest(BaseModel):
    github_url: str

def run_ingestion_task(url: str):
    try:
        service = IngestionService()
        service.process_github_repo(url)
    except Exception as e:
        print(f"Error ingesting repo: {e}")

@router.post("/ingest")
async def ingest_repository(request: IngestRequest, background_tasks: BackgroundTasks):
    if not request.github_url or not request.github_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid GitHub URL")
        
    background_tasks.add_task(run_ingestion_task, request.github_url)
    
    return {"status": "success", "message": "Repository ingestion started in the background."}

@router.get("/webhook-config")
async def get_webhook_config():
    import os
    return {
        "webhook_secret": os.getenv("WEBHOOK_SECRET", "dummy_webhook_secret"),
        "content_type": "application/json"
    }
