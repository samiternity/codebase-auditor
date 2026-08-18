from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_db
from models.user import User
from middleware.rbac import RequireRole

router = APIRouter(prefix="/admin", tags=["Admin"])

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

class PaginatedUsersResponse(BaseModel):
    total: int
    page: int
    limit: int
    users: List[UserResponse]

class RoleUpdate(BaseModel):
    new_role: str

@router.get("/users", response_model=PaginatedUsersResponse)
def get_users(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    user: dict = Depends(RequireRole(["admin"]))
):
    """Get a paginated list of all users. Admin only."""
    skip = (page - 1) * limit
    total = db.query(User).count()
    users = db.query(User).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": users
    }

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(RequireRole(["admin"]))
):
    """Update a user's role. Admin only."""
    allowed_roles = ["admin", "senior-dev", "junior-dev", "viewer"]
    if role_update.new_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(allowed_roles)}"
        )

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Prevent the last admin from removing their own admin privileges
    if db_user.id == user.get("sub") and role_update.new_role != "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot downgrade the last remaining admin user."
            )

    db_user.role = role_update.new_role
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(RequireRole(["admin"]))
):
    """Delete a user. Admin only."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if db_user.id == user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account."
        )
        
    db.delete(db_user)
    db.commit()
    return None
