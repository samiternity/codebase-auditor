import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AuditReport(Base):
    __tablename__ = "audit_reports"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    pr_id = Column(Integer, nullable=False, index=True)
    pr_number = Column(Integer)
    pr_url = Column(String(500), nullable=False)
    pr_title = Column(String(500))
    repo_name = Column(String(255), nullable=False, index=True)
    repo_url = Column(String(500))
    file_path = Column(String(500))
    status = Column(String(20), nullable=False, index=True)
    compliance_score = Column(Float)
    violations = Column(Text)  # JSON string
    suggested_fix = Column(Text)
    audit_duration_ms = Column(Integer)
    llm_model_used = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    triggered_by_user_id = Column(String, ForeignKey('users.id'))
    github_commit_hash = Column(String(40))
