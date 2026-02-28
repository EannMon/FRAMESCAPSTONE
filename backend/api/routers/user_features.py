"""
User Features Router - Notifications, support tickets, and settings endpoints.
Extracted from users.py to keep files under 300 lines.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
import logging

from db.database import get_db
from core.errors import api_error
from models.user import User, UserRole, VerificationStatus
from models.attendance_log import AttendanceLog
from models.audit_log import AuditLog
from models.class_ import Class
from models.subject import Subject
from models.support_ticket import SupportTicket
from models.user_setting import UserSetting
from schemas.user import (
    MessageResponse,
    SupportTicketCreate,
    SupportTicketResponse,
    UserSettingsResponse,
    UserSettingsUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================
# Notifications
# ============================================

@router.get("/notifications/{user_id}")
def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    """
    Unified notification endpoint for all roles.
    Returns role-specific notifications from real data.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    notifications = []

    if user.role == UserRole.HEAD:
        # Dept Head Notifications (Pending Verifications + Audit)
        pending = (
            db.query(User)
            .filter(User.verification_status == VerificationStatus.PENDING)
            .order_by(User.created_at.desc())
            .limit(5)
            .all()
        )
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
            if log.action_type in ["USER_VERIFY", "USER_REJECT"]:
                continue
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
            recent_logs = (
                db.query(AttendanceLog)
                .filter(AttendanceLog.class_id.in_(class_ids))
                .order_by(AttendanceLog.timestamp.desc())
                .limit(10)
                .all()
            )
            for al in recent_logs:
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
        personal_logs = (
            db.query(AttendanceLog)
            .filter(AttendanceLog.user_id == user_id)
            .order_by(AttendanceLog.timestamp.desc())
            .limit(10)
            .all()
        )
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


# ============================================
# Support Tickets
# ============================================

@router.post("/support-ticket", response_model=SupportTicketResponse)
def create_support_ticket(data: SupportTicketCreate, db: Session = Depends(get_db)):
    """
    Create a new support ticket from the Help & Support contact form.
    """
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )

    ticket = SupportTicket(
        user_id=data.user_id,
        subject=data.subject,
        message=data.message,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    logger.info("Support ticket #%d created by user %d", ticket.id, data.user_id)
    return SupportTicketResponse(
        id=ticket.id,
        user_id=ticket.user_id,
        subject=ticket.subject,
        message=ticket.message,
        status=ticket.status.value,
        created_at=ticket.created_at,
    )


# ============================================
# User Settings
# ============================================

@router.get("/settings/{user_id}", response_model=UserSettingsResponse)
def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    """
    Get user settings. Creates default settings if none exist yet.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )

    settings = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if not settings:
        # Auto-create default settings on first access
        settings = UserSetting(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return UserSettingsResponse.model_validate(settings)


@router.put("/settings/{user_id}", response_model=MessageResponse)
def update_user_settings(user_id: int, data: UserSettingsUpdate, db: Session = Depends(get_db)):
    """
    Update user settings. Creates the row if it doesn't exist yet.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )

    settings = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if not settings:
        settings = UserSetting(user_id=user_id)
        db.add(settings)

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(settings, key, value)

    db.commit()

    logger.info("Settings updated for user %d", user_id)
    return MessageResponse(message="Settings updated successfully")
