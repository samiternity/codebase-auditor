from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from database import get_db
from models.user import User
from utils.auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user_req.username) | (User.email == user_req.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=409, detail="Username or email already registered")
        
    # Check if this is the first user
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "junior-dev"
    
    new_user = User(
        username=user_req.username,
        email=user_req.email,
        password_hash=get_password_hash(user_req.password),
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token = create_access_token({"sub": new_user.id, "username": new_user.username, "role": new_user.role})
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role,
        "access_token": access_token,
        "token_type": "Bearer"
    }

@router.post("/login")
def login(user_req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_req.username).first()
    if not user or not verify_password(user_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token({"sub": user.id, "username": user.username, "role": user.role})
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "access_token": access_token,
        "token_type": "Bearer"
    }
