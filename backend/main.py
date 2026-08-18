from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from starlette.middleware.base import BaseHTTPMiddleware

from database import engine, Base
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.dashboard import router as dashboard_router
from services.webhooks import router as webhooks_router
from middleware.logging import logging_middleware
from middleware.error_handling import error_handling_middleware

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enterprise Codebase Auditor API", version="1.0")

# Middlewares
app.add_middleware(BaseHTTPMiddleware, dispatch=logging_middleware)
app.add_middleware(BaseHTTPMiddleware, dispatch=error_handling_middleware)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(dashboard_router)
app.include_router(webhooks_router)

@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
