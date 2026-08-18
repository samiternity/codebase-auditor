import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Date, DateTime
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AnalyticsCache(Base):
    __tablename__ = "analytics_cache"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    date = Column(Date, unique=True, nullable=False, index=True)
    compliance_score = Column(Float, nullable=False)
    total_audits = Column(Integer, default=0)
    passed_audits = Column(Integer, default=0)
    failed_audits = Column(Integer, default=0)
    violations_high = Column(Integer, default=0)
    violations_medium = Column(Integer, default=0)
    violations_low = Column(Integer, default=0)
    cached_at = Column(DateTime, default=datetime.utcnow)
