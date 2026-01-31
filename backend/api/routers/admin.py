"""
Admin Router - User verification and management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.user import User, VerificationStatus
from schemas.user import UserResponse, MessageResponse

router = APIRouter()


@router.get("/verification/list", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """
    Get all users for admin verification panel.
    Returns list sorted by registration date.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    
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
    
    print(f"✅ Retrieved {len(result)} users for verification list")
    return result


@router.post("/verification/approve", response_model=MessageResponse)
def approve_user(user_id: int, db: Session = Depends(get_db)):
    """
    Approve a user's verification status.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.verification_status = VerificationStatus.VERIFIED
    db.commit()
    
    print(f"✅ User {user_id} approved")
    return MessageResponse(message=f"User {user_id} has been approved")


@router.post("/verification/reject", response_model=MessageResponse)
def reject_user(user_id: int, db: Session = Depends(get_db)):
    """
    Reject a user's verification status.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.verification_status = VerificationStatus.REJECTED
    db.commit()
    
    print(f"✅ User {user_id} rejected")
    return MessageResponse(message=f"User {user_id} has been rejected")


@router.delete("/user/{user_id}", response_model=MessageResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Permanently delete a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    print(f"✅ User {user_id} deleted permanently")
    return MessageResponse(message=f"User {user_id} deleted successfully")
