"""
Users Router - Profile management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import bcrypt
import logging

from db.database import get_db
from core.errors import api_error
from models.user import User
from schemas.user import (
    UserResponse, 
    UserUpdate,
    PasswordChange,
    PasswordVerify,
    MessageResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/verify-password")
def verify_password(data: PasswordVerify, db: Session = Depends(get_db)):
    """
    Verify current password before allowing changes.
    """
    user = db.query(User).filter(User.id == data.user_id).first()
    
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )
    
    # Check password
    stored_hash = user.password_hash
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode('utf-8')
    
    if bcrypt.checkpw(data.password.encode('utf-8'), stored_hash):
        return {"valid": True}
    else:
        raise api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INCORRECT_PASSWORD",
            message="Incorrect password"
        )


@router.put("/change-password", response_model=MessageResponse)
def change_password(data: PasswordChange, db: Session = Depends(get_db)):
    """
    Change user password.
    Self-contained hashing to avoid circular imports.
    """
    try:
        logger.info("AUTH | change_password requested for user_id=%d", data.user_id)
        user = db.query(User).filter(User.id == data.user_id).first()
        
        if not user:
            logger.warning("AUTH | change_password failed: user_id=%d not found", data.user_id)
            raise api_error(
                status_code=status.HTTP_404_NOT_FOUND,
                code="USER_NOT_FOUND",
                message="User not found"
            )
        
        # Validation
        if len(data.new_password) < 8:
            logger.warning("AUTH | change_password failed: weak password for user_id=%d", data.user_id)
            raise api_error(400, "WEAK_PASSWORD", "Password must be at least 8 characters")

        # Direct bcrypt hashing
        pw_bytes = data.new_password.encode('utf-8')
        new_hash = bcrypt.hashpw(pw_bytes[:72], bcrypt.gensalt()).decode('utf-8')
        
        user.password_hash = new_hash
        db.commit()
        db.refresh(user)
        
        logger.info("AUTH | Password updated successfully for user_id=%d", data.user_id)
        return MessageResponse(message="Password updated successfully")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_trace = traceback.format_exc()
        logger.error("AUTH | Critical failure in change_password for user_id=%d: %s\n%s", data.user_id, str(e), error_trace)
        raise api_error(500, "INTERNAL_ERROR", f"Internal server error: {str(e)}")


@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Get user profile by ID.
    Returns all user data except password.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        role=user.role.value,
        tupm_id=user.tupm_id,
        employee_id=user.employee_id,
        department_id=user.department_id,
        program_id=user.program_id,
        department_name=user.department.name if user.department else None,
        program_name=user.program.name if user.program else None,
        college_name=user.department.college.name if user.department and user.department.college else None,
        face_registered=user.face_registered,
        verification_status=user.verification_status.value,
        section=user.section,
        academic_year=user.department.active_academic_year if user.department else None,
        semester=user.department.active_semester if user.department else None,
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
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )
    
    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(user, key, value)
    
    db.commit()
    
    logger.info("Updated user %d: %s %s", user_id, user.first_name, user.last_name)
    return MessageResponse(message="Profile updated successfully")

@router.get("/notifications/{user_id}")
def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    """
    Unified notification endpoint for all roles.
    Fixed N+1 query pattern per FRAMES_DEPLOYMENT_CONSTRAINTS §1.1.
    Uses eager loading and batch queries instead of loops.
    """
    from models.user import User, UserRole, VerificationStatus
    from models.attendance_log import AttendanceLog
    from models.audit_log import AuditLog
    from models.class_ import Class
    from models.subject import Subject
    from models.notification import Notification, NotificationType
    from sqlalchemy.orm import joinedload
    from datetime import datetime, timedelta

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    if user.in_app_notifications_enabled is False:
        return []

    notifications = []

    # 1. Fetch Real Stored Notifications from DB
    db_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )

    def get_notif_icon(ntype):
        icons = {
            NotificationType.ATTENDANCE_ENTRY: "fas fa-sign-in-alt",
            NotificationType.ATTENDANCE_BREAK: "fas fa-coffee",
            NotificationType.ATTENDANCE_EXIT: "fas fa-sign-out-alt",
            NotificationType.LATE_ALERT: "fas fa-clock",
            NotificationType.VERIFICATION_APPROVED: "fas fa-check-circle",
            NotificationType.VERIFICATION_REJECTED: "fas fa-times-circle",
            NotificationType.OVERCROWDING_ALERT: "fas fa-users-slash",
            NotificationType.SYSTEM_ALERT: "fas fa-exclamation-triangle",
            NotificationType.GENERAL: "fas fa-bell"
        }
        return icons.get(ntype, "fas fa-info-circle")

    for dn in db_notifications:
        # Construct link based on reference or type
        link = "/notifications"
        if dn.notification_type in [NotificationType.ATTENDANCE_ENTRY, NotificationType.ATTENDANCE_EXIT, NotificationType.LATE_ALERT]:
            link = "/faculty-attendance" if user.role == UserRole.FACULTY else "/student-dashboard"
        elif dn.notification_type == NotificationType.VERIFICATION_APPROVED:
            link = "/profile"
            
        notifications.append({
            "id": f"db-{dn.id}",
            "icon": get_notif_icon(dn.notification_type),
            "text": dn.message,
            "title": dn.title,
            "time": dn.created_at.strftime("%I:%M %p") if dn.created_at else "Just now",
            "timestamp": dn.created_at or datetime.now(),
            "read": dn.is_read,
            "link": link
        })

    # 2. Student Helpers (Welcome & Email Reminder)
    if user.role == UserRole.STUDENT:
        # A. Welcome Message (Persistent in DB)
        # Check if welcome notification already exists
        welcome_exists = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.notification_type == NotificationType.GENERAL,
            Notification.title == "Welcome to FRAMES"
        ).first()
        
        if not welcome_exists:
            try:
                new_notif = Notification(
                    user_id=user_id,
                    notification_type=NotificationType.GENERAL,
                    title="Welcome to FRAMES",
                    message="Welcome to the FRAMES application! We are glad to have you here.",
                    is_read=False
                )
                db.add(new_notif)
                db.commit()
                db.refresh(new_notif)
                
                notifications.insert(0, {
                    "id": f"db-{new_notif.id}",
                    "icon": get_notif_icon(NotificationType.GENERAL),
                    "text": new_notif.message,
                    "title": new_notif.title,
                    "time": "Just now",
                    "timestamp": datetime.now(),
                    "read": False,
                    "link": "/student-dashboard"
                })
            except Exception as e:
                db.rollback()
                logger.error("Failed to create welcome notification for user %d: %s", user_id, str(e))

        # B. Email Reminder (Virtual)
        if not user.email:
            notifications.append({
                "id": "v-email-reminder",
                "icon": "fas fa-envelope",
                "text": "Please update your email in your profile to receive alerts.",
                "title": "Email Missing",
                "time": "Reminder",
                "timestamp": datetime.now(),
                "read": False,
                "link": "/student-profile"
            })

    # Sort all by timestamp desc
    notifications.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
    
    # Remove timestamp before returning
    for n in notifications:
        if 'timestamp' in n:
            del n['timestamp']

    return notifications

class NotificationReadRequest(BaseModel):
    notification_id: Optional[str] = None  # e.g., "db-11"
    all: Optional[bool] = False

@router.post("/notifications/{user_id}/read")
def mark_notifications_read(user_id: int, request: NotificationReadRequest, db: Session = Depends(get_db)):
    """
    Mark a single or all notifications as read for a user in the DB.
    """
    from models.notification import Notification # Local import to avoid circulars if any
    
    if request.all:
        db.query(Notification).filter(Notification.user_id == user_id).update({Notification.is_read: True})
    elif request.notification_id:
        if request.notification_id.startswith("db-"):
            try:
                actual_id = int(request.notification_id.replace("db-", ""))
                db.query(Notification).filter(Notification.id == actual_id, Notification.user_id == user_id).update({Notification.is_read: True})
            except ValueError:
                pass # Invalid ID format
                
    db.commit()
    return {"message": "Notifications updated"}
