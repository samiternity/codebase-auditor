import os
import requests
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from utils.auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

@router.get("/github/login")
def github_login(request: Request):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured")
    
    # Dynamically build the redirect URI based on where the request came from
    # E.g., http://13.53.245.246:8000/api/auth/github/callback
    base_url = str(request.base_url).rstrip("/")
    redirect_uri = f"{base_url}/api/auth/github/callback"
    
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email&redirect_uri={redirect_uri}"
    return RedirectResponse(url=github_auth_url)

@router.get("/github/callback")
def github_callback(code: str):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
        
    # Exchange code for token
    token_url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    data = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code
    }
    
    response = requests.post(token_url, headers=headers, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to authenticate with GitHub")
        
    token_data = response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned from GitHub")
        
    # Get user info
    user_url = "https://api.github.com/user"
    user_headers = {"Authorization": f"Bearer {access_token}"}
    user_response = requests.get(user_url, headers=user_headers)
    if user_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user data")
        
    user_data = user_response.json()
    username = user_data.get("login")
    
    # Generate JWT
    jwt_token = create_access_token({"sub": username, "role": "admin"}) # Give admin for simplicity
    
    # Redirect to frontend with token
    redirect_url = f"{FRONTEND_URL}/login/success?token={jwt_token}&username={username}"
    return RedirectResponse(url=redirect_url)
