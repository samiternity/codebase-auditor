import asyncio
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.ingestion import IngestionService, LOG_QUEUE

router = APIRouter(prefix="/api/repositories", tags=["Repositories"])

class IngestRequest(BaseModel):
    github_url: str

def run_ingestion_task(url: str):
    LOG_QUEUE.clear()
    try:
        service = IngestionService()
        service.process_github_repo(url)
    except Exception as e:
        LOG_QUEUE.append(f"Error ingesting repo: {e}")
        LOG_QUEUE.append("DONE")

@router.post("/ingest")
async def ingest_repository(request: IngestRequest, background_tasks: BackgroundTasks):
    if not request.github_url or not request.github_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid GitHub URL")
        
    background_tasks.add_task(run_ingestion_task, request.github_url)
    
    return {"status": "success", "message": "Repository ingestion started in the background."}

@router.get("/logs")
async def get_logs():
    async def event_generator():
        last_idx = 0
        while True:
            if last_idx < len(LOG_QUEUE):
                msg = LOG_QUEUE[last_idx]
                yield f"data: {msg}\n\n"
                last_idx += 1
                if msg == "DONE":
                    break
            else:
                await asyncio.sleep(0.5)
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/webhook-config")
async def get_webhook_config():
    import os
    return {
        "webhook_secret": os.getenv("WEBHOOK_SECRET", "dummy_webhook_secret"),
        "content_type": "application/json"
    }
