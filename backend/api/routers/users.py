"""
Users Router - Profile management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt

from db.database import get_db
from models.user import User
from schemas.user import (
    UserResponse, 
    UserUpdate,
    PasswordChange,
    PasswordVerify,
    MessageResponse
)

router = APIRouter()


@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Get user profile by ID.
    Returns all user data except password.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
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
    )


@router.put("/{user_id}", response_model=MessageResponse)
def update_user_profile(user_id: int, update_data: UserUpdate, db: Session = Depends(get_db)):
    """
    Update user profile.
    Only updates provided fields.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(user, key, value)
    
    db.commit()
    
    print(f"✅ Updated user {user_id}: {user.first_name} {user.last_name}")
    return MessageResponse(message="Profile updated successfully")


@router.post("/verify-password")
def verify_password(data: PasswordVerify, db: Session = Depends(get_db)):
    """
    Verify current password before allowing changes.
    """
    user = db.query(User).filter(User.id == data.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check password
    stored_hash = user.password_hash
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode('utf-8')
    
    if bcrypt.checkpw(data.password.encode('utf-8'), stored_hash):
        return {"valid": True}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )


@router.put("/change-password", response_model=MessageResponse)
def change_password(data: PasswordChange, db: Session = Depends(get_db)):
    """
    Change user password.
    """
    user = db.query(User).filter(User.id == data.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Hash new password
    new_hash = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = new_hash
    
    db.commit()
    
    print(f"✅ Password changed for user {data.user_id}")
    return MessageResponse(message="Password updated successfully")
