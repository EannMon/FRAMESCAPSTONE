"""
Admin Router - User verification and management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
import logging

from db.database import get_db
from models.user import User, VerificationStatus
from schemas.user import UserResponse, MessageResponse
from core.errors import api_error

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/verification/list", response_model=List[UserResponse])
def get_all_users(
    skip: int = Query(0, ge=0), 
    limit: int = Query(50, ge=1, le=100), 
    db: Session = Depends(get_db)
):
    """
    Get all users for admin verification panel.
    Returns list sorted by registration date.
    Supports pagination.
    """
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        result.append(UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            middle_name=user.middle_name,
            role=user.role.value,
            tupm_id=user.tupm_id,
            department_id=user.department_id,
            program_id=user.program_id,
            face_registered=user.face_registered,
            verification_status=user.verification_status.value,
            year_level=user.year_level,
            section=user.section,
            created_at=user.created_at,
            last_active=user.last_active
        ))
    
    logger.info("Retrieved %d users for verification list (skip=%d, limit=%d)", len(result), skip, limit)
    return result


from pydantic import BaseModel

class VerificationRequest(BaseModel):
    user_id: int
    verification_status: str = None # Optional, for logging or extended logic

@router.post("/verification/approve", response_model=MessageResponse)
def approve_user(req: VerificationRequest, db: Session = Depends(get_db)):
    """
    Approve a user's verification status.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )
    
    user.verification_status = VerificationStatus.VERIFIED
    db.commit()
    
    logger.info("User %d approved", req.user_id)
    return MessageResponse(message=f"User {req.user_id} has been approved")


@router.post("/verification/reject", response_model=MessageResponse)
def reject_user(req: VerificationRequest, db: Session = Depends(get_db)):
    """
    Reject a user's verification status.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )
    
    user.verification_status = VerificationStatus.REJECTED
    db.commit()
    
    logger.info("User %d rejected", req.user_id)
    return MessageResponse(message=f"User {req.user_id} has been rejected")


@router.delete("/user/{user_id}", response_model=MessageResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Permanently delete a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    logger.info("User %d deleted permanently", user_id)
    return MessageResponse(message=f"User {user_id} deleted successfully")
