from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.audit_report import AuditReport
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/audits")
def get_recent_audits(db: Session = Depends(get_db)):
    # Query the AuditReport table, sort by newest first, and grab the top 10
    audits = db.query(AuditReport).order_by(AuditReport.created_at.desc()).limit(10).all()
    return audits

@router.get("/audits/{audit_id}")
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(AuditReport).filter(AuditReport.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit

@router.get("/analytics/score")
def get_overall_score(db: Session = Depends(get_db)):
    audits = db.query(AuditReport).all()
    if not audits:
        return {"score": 100}
    total_score = sum(audit.compliance_score for audit in audits)
    return {"score": round(total_score / len(audits))}

@router.get("/analytics/compliance-trend")
def get_compliance_trend(db: Session = Depends(get_db)):
    # Calculate the average compliance score per day for the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_audits = db.query(AuditReport).filter(AuditReport.created_at >= seven_days_ago).all()
    
    # Group by date string (e.g., 'Aug 01')
    daily_scores = defaultdict(list)
    for audit in recent_audits:
        date_str = audit.created_at.strftime('%b %d')
        daily_scores[date_str].append(audit.compliance_score)
        
    # Format into a list of objects for Recharts
    trend_data = []
    # If no data exists, provide an empty structure so chart doesn't break
    if not daily_scores:
        trend_data.append({"date": datetime.utcnow().strftime('%b %d'), "score": 100})
        return trend_data
        
    for date_str, scores in daily_scores.items():
        avg_score = sum(scores) / len(scores)
        trend_data.append({"date": date_str, "score": round(avg_score)})
        
    # Sort by date
    trend_data.sort(key=lambda x: datetime.strptime(x["date"], '%b %d'))
    return trend_data

@router.get("/analytics/top-violations")
def get_top_violations(db: Session = Depends(get_db)):
    all_audits = db.query(AuditReport).all()
    violation_counter = Counter()
    
    for audit in all_audits:
        if audit.violations:
            try:
                # Load the JSON string from the DB
                violation_list = json.loads(audit.violations)
                for violation in violation_list:
                    # Often LLM returns strings like "Violation of ADR-001: Description"
                    # For a clean chart, we'll just count the full string if we don't have strict IDs
                    violation_counter[violation] += 1
            except json.JSONDecodeError:
                continue
                
    # Format into a list of objects for Recharts
    top_violations = []
    for violation, count in violation_counter.most_common(4):
        # Truncate long descriptions
        display_name = violation if len(violation) < 30 else violation[:27] + "..."
        top_violations.append({"adr": display_name, "name": display_name, "count": count})
        
    # Fallback if no violations
    if not top_violations:
        return [{"adr": "No Violations", "name": "System Healthy", "count": 0}]
        
    return top_violations

@router.get("/system/status")
def get_system_status():
    try:
        from services.vector_db import QdrantService
        qdrant = QdrantService()
        is_onboarded = qdrant.client.collection_exists(qdrant.collection_name)
    except Exception:
        is_onboarded = False
    return {"is_onboarded": is_onboarded}
