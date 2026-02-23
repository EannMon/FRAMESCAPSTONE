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
        department_name=user.department.name if user.department else None,
        program_name=user.program.name if user.program else None,
        face_registered=user.face_registered,
        verification_status=user.verification_status.value,
        year_level=user.year_level,
        section=user.section,
        contact_number=user.contact_number,
        birthday=user.birthday,
        home_address=user.home_address,
        current_term=user.current_term,
        academic_advisor=user.academic_advisor,
        gpa=user.gpa,
        emergency_contact_name=user.emergency_contact_name,
        emergency_contact_relationship=user.emergency_contact_relationship,
        emergency_contact_phone=user.emergency_contact_phone,
        emergency_contact_address=user.emergency_contact_address,
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

@router.get("/notifications/{user_id}")
def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    """
    Unified notification endpoint for all roles.
    """
    from models.user import User, UserRole, VerificationStatus
    from models.attendance_log import AttendanceLog
    from models.audit_log import AuditLog
    from models.class_ import Class
    from models.subject import Subject
    from datetime import datetime, timedelta

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    notifications = []
    
    if user.role == UserRole.HEAD:
        # Dept Head Notifications (Pending Verifications + Audit)
        pending = db.query(User).filter(User.verification_status == VerificationStatus.PENDING).order_by(User.created_at.desc()).limit(5).all()
        for p in pending:
            notifications.append({
                "id": f"v-{p.id}",
                "icon": "fas fa-user-clock",
                "text": f"New Registration: {p.first_name} {p.last_name}",
                "time": "Pending",
                "read": False,
                "link": "/dept-head-dashboard"
            })
            
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5).all()
        for log in logs:
            if log.action_type in ["USER_VERIFY", "USER_REJECT"]: continue
            notifications.append({
                "id": f"a-{log.id}",
                "icon": "fas fa-shield-alt",
                "text": f"System Alert: {log.action_type.replace('_', ' ')}",
                "time": log.timestamp.strftime("%I:%M %p"),
                "read": True,
                "link": "/dept-head-logs"
            })

    elif user.role == UserRole.FACULTY:
        # Faculty Notifications (Recent attendance in their classes)
        faculty_classes = db.query(Class).filter(Class.faculty_id == user_id).all()
        class_ids = [c.id for c in faculty_classes]
        
        if class_ids:
            recent_logs = db.query(AttendanceLog).filter(AttendanceLog.class_id.in_(class_ids)).order_by(AttendanceLog.timestamp.desc()).limit(10).all()
            for al in recent_logs:
                # Find student name
                student = db.query(User).filter(User.id == al.user_id).first()
                cls = db.query(Class).filter(Class.id == al.class_id).first()
                subject = db.query(Subject).filter(Subject.id == cls.subject_id).first() if cls else None
                
                notifications.append({
                    "id": f"att-{al.id}",
                    "icon": "fas fa-user-check",
                    "text": f"{student.first_name if student else 'User'} logged {al.action.value} in {subject.code if subject else 'Class'}",
                    "time": al.timestamp.strftime("%I:%M %p"),
                    "read": True,
                    "link": "/faculty-attendance"
                })

    elif user.role == UserRole.STUDENT:
        # Student Notifications (Personal attendance confirmations)
        personal_logs = db.query(AttendanceLog).filter(AttendanceLog.user_id == user_id).order_by(AttendanceLog.timestamp.desc()).limit(10).all()
        for al in personal_logs:
            cls = db.query(Class).filter(Class.id == al.class_id).first()
            subject = db.query(Subject).filter(Subject.id == cls.subject_id).first() if cls else None
            notifications.append({
                "id": f"satt-{al.id}",
                "icon": "fas fa-calendar-check",
                "text": f"Your {al.action.value} for {subject.code if subject else 'Class'} was recorded.",
                "time": al.timestamp.strftime("%I:%M %p"),
                "read": True,
                "link": "/student-dashboard"
            })

        if user.verification_status == VerificationStatus.VERIFIED:
            notifications.append({
                "id": "v-status",
                "icon": "fas fa-check-circle",
                "text": "Your account has been fully verified.",
                "time": "Account",
                "read": True,
                "link": "/student-profile"
            })

    return notifications
