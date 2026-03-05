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
        ))
    
    logger.info("Retrieved %d users for verification list (skip=%d, limit=%d)", len(result), skip, limit)
    return result


from pydantic import BaseModel
import requests
import os

class VerificationRequest(BaseModel):
    user_id: int
    verification_status: str = None # Optional, for logging or extended logic

def send_approval_email(email: str, first_name: str, role: str):
    """Send an approval notification email using SendGrid v3 API"""
    api_key = os.getenv("SENDGRID_API_KEY")
    sender = os.getenv("SENDGRID_SENDER", "framessys01@gmail.com")
    
    if not api_key:
        logger.error("SENDGRID_API_KEY not set in environment variables")
        return
    
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    role_display = "Department Head" if role == "HEAD" else role.capitalize()
    
    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">FRAMES</h1>
            <p style="color: #94A3B8; margin: 8px 0 0 0; font-size: 13px;">Facial Recognition Attendance & Monitoring System</p>
        </div>
        <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #0F172A; margin: 0 0 16px 0; font-size: 22px;">Account Approved &#x2705;</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Hello <strong>{first_name}</strong>,
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Your <strong>{role_display}</strong> account on the FRAMES system has been approved by your Department Head. 
                You can now log in and access your dashboard.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="http://localhost:3000" style="background: #0F172A; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                    Log In to FRAMES
                </a>
            </div>
            <p style="color: #64748B; font-size: 13px; line-height: 1.6;">
                If you did not create this account, please contact the system administrator.
            </p>
        </div>
        <div style="background: #F8FAFC; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
                FRAMES &copy; 2026 — Technological University of the Philippines - Manila
            </p>
        </div>
    </div>
    """
    
    payload = {
        "personalizations": [
            {
                "to": [{"email": email}],
                "subject": "Your FRAMES Account has been Approved \u2705"
            }
        ],
        "from": {
            "email": sender,
            "name": "FRAMES System"
        },
        "content": [
            {
                "type": "text/html",
                "value": html_content
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code not in (200, 202):
            logger.error("Failed to send approval email to %s: %s", email, response.text)
        else:
            logger.info("Approval email sent to %s", email)
    except Exception as e:
        logger.error("Error sending approval email to %s: %s", email, str(e))

@router.post("/verification/approve", response_model=MessageResponse)
def approve_user(req: VerificationRequest, db: Session = Depends(get_db)):
    """
    Approve a user's verification status.
    Sends an approval notification email via SendGrid.
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
    
    # Send approval email to the user
    send_approval_email(user.email, user.first_name, user.role.value)
    
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


@router.get("/system-logs")
def get_system_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action_type: str = Query(None, description="Filter by action type"),
    db: Session = Depends(get_db)
):
    """
    Retrieve audit logs for system logs page.
    Returns recent audit trail entries with user info.
    """
    from models.audit_log import AuditLog
    from sqlalchemy.orm import joinedload

    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    if action_type:
        query = query.filter(AuditLog.action_type == action_type)

    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    result = []
    for log in logs:
        # Map action types to service names and log levels for frontend display
        service = _action_to_service(log.action_type)
        level = _action_to_level(log.action_type)

        user_name = ""
        if log.user:
            user_name = f"{log.user.first_name} {log.user.last_name}"

        result.append({
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "level": level,
            "service": service,
            "action_type": log.action_type,
            "message": _build_log_message(log, user_name),
            "user_name": user_name,
            "target_table": log.target_table,
            "target_id": log.target_id,
            "ip_address": log.ip_address,
        })

    return {"items": result, "total": total, "skip": skip, "limit": limit}


def _action_to_service(action_type: str) -> str:
    """Map audit action types to display service names."""
    mapping = {
        "USER_CREATE": "AuthService", "USER_UPDATE": "AuthService",
        "USER_DELETE": "AuthService", "USER_VERIFY": "AuthService",
        "USER_REJECT": "AuthService",
        "FACE_ENROLL": "RecognitionEngine", "FACE_UPDATE": "RecognitionEngine",
        "SCHEDULE_UPLOAD": "ScheduleService",
        "CLASS_CREATE": "ScheduleService", "CLASS_UPDATE": "ScheduleService",
        "CLASS_DELETE": "ScheduleService",
        "DEVICE_CREATE": "DeviceService", "DEVICE_UPDATE": "DeviceService",
        "DEVICE_DELETE": "DeviceService",
        "EXPORT_ATTENDANCE": "ReportService", "EXPORT_REPORT": "ReportService",
        "SESSION_EXCEPTION_CREATE": "ScheduleService",
    }
    return mapping.get(action_type, "System")


def _action_to_level(action_type: str) -> str:
    """Map audit action types to log severity levels."""
    error_actions = {"USER_DELETE", "USER_REJECT"}
    warn_actions = {"SESSION_EXCEPTION_CREATE", "DEVICE_DELETE"}
    if action_type in error_actions:
        return "WARN"
    if action_type in warn_actions:
        return "WARN"
    return "INFO"


def _build_log_message(log, user_name: str) -> str:
    """Build a human-readable message from an audit log entry."""
    action = log.action_type or "UNKNOWN"
    target = log.target_table or ""
    target_id = log.target_id or ""

    templates = {
        "USER_CREATE": f"New user registered: {user_name or target_id}",
        "USER_VERIFY": f"User '{user_name}' verification approved (ID: {target_id})",
        "USER_REJECT": f"User '{user_name}' verification rejected (ID: {target_id})",
        "USER_DELETE": f"User '{user_name}' deleted (ID: {target_id})",
        "FACE_ENROLL": f"Face enrolled for user '{user_name}' (ID: {target_id})",
        "SCHEDULE_UPLOAD": f"Schedule uploaded by '{user_name}'",
        "CLASS_CREATE": f"Class created (ID: {target_id}) by '{user_name}'",
        "CLASS_UPDATE": f"Class updated (ID: {target_id}) by '{user_name}'",
        "DEVICE_CREATE": f"Device registered (ID: {target_id}) by '{user_name}'",
        "DEVICE_UPDATE": f"Device updated (ID: {target_id}) by '{user_name}'",
        "DEVICE_DELETE": f"Device removed (ID: {target_id}) by '{user_name}'",
        "EXPORT_ATTENDANCE": f"Attendance data exported by '{user_name}'",
        "EXPORT_REPORT": f"Report generated by '{user_name}'",
    }
    return templates.get(action, f"{action} on {target} (ID: {target_id}) by '{user_name}'")
