"""
Users Router - Profile management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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

    if not user.in_app_notifications_enabled:
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

    # 2. Dept Head Logic (Virtual Notifications)
    if user.role == UserRole.HEAD:
        pending = db.query(User).filter(
            User.verification_status == VerificationStatus.PENDING
        ).order_by(User.created_at.desc()).limit(5).all()
        for p in pending:
            notifications.append({
                "id": f"v-{p.id}",
                "icon": "fas fa-user-clock",
                "text": f"New Registration: {p.first_name} {p.last_name}",
                "time": "Pending",
                "timestamp": p.created_at or datetime.now(),
                "read": False,
                "link": "/dept-head-dashboard"
            })
            
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5).all()
        for log in logs:
            if log.action_type in ["USER_VERIFY", "USER_REJECT"]:
                continue
            notifications.append({
                "id": f"a-{log.id}",
                "icon": "fas fa-shield-alt",
                "text": f"System Alert: {log.action_type.replace('_', ' ')}",
                "time": log.timestamp.strftime("%I:%M %p"),
                "timestamp": log.timestamp,
                "read": True,
                "link": "/dept-head-logs"
            })

    elif user.role == UserRole.FACULTY:
        faculty_classes = db.query(Class).filter(Class.faculty_id == user_id).all()
        class_ids = [c.id for c in faculty_classes]
        if class_ids:
            recent_logs = (
                db.query(AttendanceLog)
                .options(joinedload(AttendanceLog.user), joinedload(AttendanceLog.class_).joinedload(Class.subject))
                .filter(AttendanceLog.class_id.in_(class_ids))
                .order_by(AttendanceLog.timestamp.desc())
                .limit(10)
                .all()
            )
            for al in recent_logs:
                notifications.append({
                    "id": f"att-{al.id}",
                    "icon": "fas fa-user-check",
                    "text": f"{al.user.first_name if al.user else 'User'} logged {al.action.value} in {al.class_.subject.code if al.class_ and al.class_.subject else 'Class'}",
                    "time": al.timestamp.strftime("%I:%M %p"),
                    "timestamp": al.timestamp,
                    "read": True,
                    "link": "/faculty-attendance"
                })

    elif user.role == UserRole.STUDENT:
        personal_logs = (
            db.query(AttendanceLog)
            .options(joinedload(AttendanceLog.class_).joinedload(Class.subject))
            .filter(AttendanceLog.user_id == user_id)
            .order_by(AttendanceLog.timestamp.desc())
            .limit(10)
            .all()
        )
        for al in personal_logs:
            notifications.append({
                "id": f"satt-{al.id}",
                "icon": "fas fa-calendar-check",
                "text": f"Your {al.action.value} for {al.class_.subject.code if al.class_ and al.class_.subject else 'Class'} was recorded.",
                "time": al.timestamp.strftime("%I:%M %p"),
                "timestamp": al.timestamp,
                "read": True,
                "link": "/student-dashboard"
            })

    # Sort all by timestamp desc
    notifications.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
    
    # Remove timestamp before returning
    for n in notifications:
        if 'timestamp' in n:
            del n['timestamp']

    return notifications
