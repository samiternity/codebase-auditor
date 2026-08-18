from services import vector_db
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from services.rag_engine import AuditEngine
from database import SessionLocal
from models.audit_report import AuditReport
import json
import os
import hmac
import hashlib

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "dummy_webhook_secret")


async def verify_github_signature(request: Request):

    header = request.headers.get('x-hub-signature-256')

    if not header:
        raise HTTPException(status_code=403, detail='missing signature')

    # raw body of request
    body = await request.body()

    # calculate our own hash using secret
    hash_object = hmac.new(WEBHOOK_SECRET.encode('utf-8'), msg=body, digestmod=hashlib.sha256) 
    
    expected_signature = "sha256=" + hash_object.hexdigest()

    # compare github's signature to our expected signature safely
    if not hmac.compare_digest(expected_signature, header):
        raise HTTPException(status_code=403, detail="Invalid signature")

async def run_audit_pipeline(pr_code_diff: str, pr_url: str):
    # trigger the engine
    engine = AuditEngine()
    result = engine.audit_pr(pr_code_diff)
    
    # extract data from llm's response
    status = result.get("status", "fail")
    score = result.get("score", 0)
    violations = result.get("violations", [])
    suggested_fix = result.get("suggested_fix", "")
    
    # save to database

    db = SessionLocal()
    try:
        report = AuditReport(
            pr_url=pr_url,
            pr_id=1,  # Hardcoded for now
            repo_name="sample-repo", # Hardcoded for now
            status=status,
            compliance_score=score,
            # We must convert the Python list of violations into a JSON string for the DB
            violations=json.dumps(violations),
            suggested_fix=suggested_fix
        )
        db.add(report)
        db.commit()
    finally:
        db.close()



@router.post("/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    
    await verify_github_signature(request)
    payload = await request.json()

    # We only care about Pull Requests
    if "pull_request" not in payload:
        return {"status": "ignored", "message": "Not a pull request event"}
    
    pr_url = payload["pull_request"]["html_url"]
    pr_code_diff = "..." # (In a real app, we would fetch the diff from GitHub API here)
    
    # pass the job to FastAPI's background worker
    background_tasks.add_task(run_audit_pipeline, pr_code_diff, pr_url)
    
    return {"status": "success", "message": "Audit triggered"}



