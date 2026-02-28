"""
Admin Dashboard Router - Summary stats, devices, system logs, user management
Split from admin.py to stay under the 300-line rule.
All endpoints share the /api/admin prefix (registered in main.py).
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timezone
import logging

from db.database import get_db
from models.user import User, VerificationStatus, UserRole
from models.device import Device
from models.attendance_log import AttendanceLog, AttendanceAction
from models.audit_log import AuditLog
from models.security_log import SecurityLog
from schemas.user import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================
# Dashboard Summary
# ============================================================

@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Aggregated stats for admin dashboard cards:
    user counts by role/status, device counts, attendance today.
    """
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # User counts grouped by role (single query)
    role_counts = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    total_users = sum(c for _, c in role_counts)
    users_by_role = {role.value: count for role, count in role_counts}

    new_today = (
        db.query(func.count(User.id))
        .filter(User.created_at >= today_start)
        .scalar()
    )
    pending_count = (
        db.query(func.count(User.id))
        .filter(User.verification_status == VerificationStatus.PENDING)
        .scalar()
    )

    # Device / camera status
    device_rows = (
        db.query(Device.status, func.count(Device.id))
        .group_by(Device.status)
        .all()
    )
    devices = {s.value: c for s, c in device_rows}
    total_devices = sum(devices.values())

    # Attendance today
    entries_today = (
        db.query(func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.timestamp >= today_start,
            AttendanceLog.action == AttendanceAction.ENTRY,
        )
        .scalar()
    )
    late_today = (
        db.query(func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.timestamp >= today_start,
            AttendanceLog.is_late == True,
        )
        .scalar()
    )

    logger.info(
        "Dashboard summary: %d users, %d devices, %d entries today",
        total_users, total_devices, entries_today,
    )

    return {
        "users": {
            "total": total_users,
            "byRole": users_by_role,
            "newToday": new_today,
            "pendingVerification": pending_count,
        },
        "devices": {
            "total": total_devices,
            "active": devices.get("ACTIVE", 0),
            "offline": devices.get("INACTIVE", 0),
            "maintenance": devices.get("MAINTENANCE", 0),
        },
        "attendance": {
            "entriesToday": entries_today,
            "lateToday": late_today,
        },
    }


# ============================================================
# Device / Room Status
# ============================================================

@router.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    """All registered devices with status and room info."""
    rows = db.query(Device).order_by(Device.room).all()

    result = []
    for d in rows:
        result.append({
            "id": d.id,
            "room": d.room,
            "deviceName": d.device_name,
            "ipAddress": d.ip_address,
            "status": d.status.value,
            "roomCapacity": d.room_capacity,
            "lastHeartbeat": (
                d.last_heartbeat.isoformat() if d.last_heartbeat else None
            ),
        })

    logger.info("Retrieved %d devices", len(result))
    return result


# ============================================================
# System Logs (Audit + Security combined)
# ============================================================

@router.get("/system-logs")
def get_system_logs(
    log_type: str = Query("all", regex="^(all|audit|security)$"),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Returns audit logs, security logs, or both — newest first.
    Each entry normalised to a common {id, timestamp, level, service, message}.
    """
    logs: list[dict] = []

    if log_type in ("all", "audit"):
        audit_rows = (
            db.query(AuditLog)
            .options(joinedload(AuditLog.user))
            .order_by(desc(AuditLog.timestamp))
            .offset(skip)
            .limit(limit)
            .all()
        )
        for row in audit_rows:
            user_label = row.user.email if row.user else f"user#{row.user_id}"
            logs.append({
                "id": f"audit-{row.id}",
                "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                "level": _audit_level(row.action_type),
                "service": "AuditService",
                "message": (
                    f"[{row.action_type}] by {user_label} "
                    f"on {row.target_table or 'N/A'} #{row.target_id or ''}"
                ),
                "source": "audit",
            })

    if log_type in ("all", "security"):
        sec_rows = (
            db.query(SecurityLog)
            .order_by(desc(SecurityLog.timestamp))
            .offset(skip)
            .limit(limit)
            .all()
        )
        for row in sec_rows:
            logs.append({
                "id": f"sec-{row.id}",
                "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                "level": _security_level(row.event_type.value),
                "service": "SecurityService",
                "message": (
                    f"[{row.event_type.value}] {row.details or ''} "
                    f"— room {row.room or 'N/A'}"
                ),
                "source": "security",
            })

    # Re-sort combined list by timestamp descending
    logs.sort(key=lambda x: x["timestamp"] or "", reverse=True)

    logger.info("System-logs: %d entries (type=%s)", len(logs), log_type)
    return logs


# ============================================================
# User Management (full list with department / program names)
# ============================================================

@router.get("/users", response_model=List[UserResponse])
def get_all_users_management(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Paginated user list for admin User Management page.
    Supports optional role filter and free-text search.
    """
    query = db.query(User).options(
        joinedload(User.department),
        joinedload(User.program),
    )

    if role:
        try:
            role_enum = UserRole(role.upper())
            query = query.filter(User.role == role_enum)
        except ValueError:
            pass  # ignore unknown role values

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
            | (User.email.ilike(pattern))
            | (User.tupm_id.ilike(pattern))
        )

    users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()

    result = []
    for u in users:
        result.append(UserResponse(
            id=u.id,
            email=u.email,
            first_name=u.first_name,
            last_name=u.last_name,
            middle_name=u.middle_name,
            role=u.role.value,
            tupm_id=u.tupm_id,
            department_id=u.department_id,
            program_id=u.program_id,
            department_name=u.department.name if u.department else None,
            program_name=u.program.name if u.program else None,
            face_registered=u.face_registered,
            verification_status=u.verification_status.value,
            year_level=u.year_level,
            section=u.section,
            contact_number=u.contact_number,
            birthday=u.birthday,
            home_address=u.home_address,
            current_term=u.current_term,
            academic_advisor=u.academic_advisor,
            gpa=u.gpa,
            created_at=u.created_at,
            last_active=u.last_active,
        ))

    logger.info("Admin user list: %d users (role=%s, search=%s)", len(result), role, search)
    return result


# ============================================================
# Helpers
# ============================================================

def _audit_level(action_type: str) -> str:
    """Map audit action types to log severity levels."""
    if action_type in ("LOGIN_FAILED", "USER_DELETE", "DEVICE_DELETE"):
        return "ERROR"
    if action_type in ("USER_REJECT", "SESSION_EXCEPTION_CREATE"):
        return "WARN"
    return "INFO"


def _security_level(event_value: str) -> str:
    """Map security event types to log severity levels."""
    if event_value in ("SPOOF_ATTEMPT", "UNAUTHORIZED_ACCESS"):
        return "ERROR"
    if event_value in ("UNRECOGNIZED_FACE", "GESTURE_FAILURE"):
        return "WARN"
    return "INFO"
