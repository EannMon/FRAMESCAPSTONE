"""
Reports & System Logs Router
Provides report data endpoints for faculty and department head dashboards,
plus system log access for department heads.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from db.database import get_db
from core.errors import api_error
from models.user import User, UserRole
from models.attendance_log import AttendanceLog
from models.class_ import Class
from models.device import Device
from services.report_service import get_faculty_report, get_dept_report

logger = logging.getLogger(__name__)

router = APIRouter()


# ──────────────────────────────────────────────
# Faculty Report Data
# ──────────────────────────────────────────────

@router.get("/faculty/reports/data/{user_id}")
def faculty_report_data(
    user_id: int,
    report_type: str = Query(...),
    class_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Generate report data for faculty dashboards.
    Returns list of rows with shape { id, col1, col2, status, col3, remarks }.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    rows = get_faculty_report(
        db, user_id, report_type,
        class_id=class_id, date_from=date_from, date_to=date_to
    )
    logger.info("Faculty report %s for user %d: %d rows", report_type, user_id, len(rows))
    return rows


# ──────────────────────────────────────────────
# Department Head Report Data
# ──────────────────────────────────────────────

@router.get("/dept/reports/data")
def dept_report_data(
    report_type: str = Query(...),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    dept_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Generate report data for department head dashboards.
    Returns list of rows with shape { id, col1, col2, status, col3, remarks }.
    """
    rows = get_dept_report(
        db, dept_id or 0, report_type,
        date_from=date_from, date_to=date_to, room=room
    )
    logger.info("Dept report %s: %d rows", report_type, len(rows))
    return rows


# ──────────────────────────────────────────────
# System Logs (for Department Head)
# ──────────────────────────────────────────────

@router.get("/dept/system-logs")
def get_system_logs(
    level: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    System logs derived from attendance logs and device heartbeats.
    Returns entries with shape { level, message, service, room, source, timestamp }.
    """
    limit = min(limit, 500)

    # Build from attendance logs — these are the real system events
    query = (
        db.query(AttendanceLog)
        .options(
            joinedload(AttendanceLog.user),
            joinedload(AttendanceLog.class_),
            joinedload(AttendanceLog.device),
        )
    )

    if date_from:
        query = query.filter(AttendanceLog.timestamp >= date_from)
    if date_to:
        query = query.filter(AttendanceLog.timestamp <= date_to + " 23:59:59")
    if room:
        query = query.join(Class, AttendanceLog.class_id == Class.id).filter(Class.room == room)

    logs = query.order_by(desc(AttendanceLog.timestamp)).offset(skip).limit(limit).all()

    entries = []
    for log in logs:
        # Determine log level from event type
        log_level = "INFO"
        if log.is_late:
            log_level = "WARN"
        if log.confidence_score and log.confidence_score < 0.5:
            log_level = "ERROR"

        user_name = log.user.full_name if log.user else "Unknown"
        room_name = log.class_.room if log.class_ else "—"
        device_name = log.device.device_name if log.device else "System"
        action = log.action.value if log.action else "UNKNOWN"

        message = f"{user_name} — {action}"
        if log.is_late:
            message += " (LATE)"

        entry = {
            "level": log_level,
            "message": message,
            "service": "attendance",
            "room": room_name,
            "source": device_name,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }

        # Apply filters
        if level and entry["level"] != level.upper():
            continue
        if search and search.lower() not in entry["message"].lower():
            continue

        entries.append(entry)

    # Also add device heartbeat events
    devices = db.query(Device).all()
    for device in devices:
        if device.last_heartbeat:
            entry = {
                "level": "INFO",
                "message": f"Device heartbeat — {device.device_name or device.room}",
                "service": "device",
                "room": device.room or "—",
                "source": device.device_name or f"Device #{device.id}",
                "timestamp": device.last_heartbeat.isoformat(),
            }
            if level and entry["level"] != level.upper():
                continue
            if search and search.lower() not in entry["message"].lower():
                continue
            if room and entry["room"] != room:
                continue
            entries.append(entry)

    # Sort all entries by timestamp descending
    entries.sort(key=lambda e: e.get("timestamp") or "", reverse=True)

    logger.info("System logs query returned %d entries", len(entries))
    return entries
