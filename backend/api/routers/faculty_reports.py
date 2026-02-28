"""
Faculty Reports Router — Endpoints that power the FacultyReportsPage.

Provides two data feeds:
  1. Class-level student attendance logs (for class monitoring reports)
  2. Personal faculty attendance logs (for self-tracking reports)

Both support date-range and status filtering.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
import logging

from db.database import get_db
from core.errors import api_error
from models.user import User, UserRole, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/reports/class-logs/{user_id}")
def get_class_attendance_logs(
    user_id: int,
    class_id: Optional[int] = Query(None, description="Filter by specific class"),
    date_from: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    section: Optional[str] = Query(None, description="Filter by section"),
    status: Optional[str] = Query(None, description="Filter: Present, Late, Absent, All"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Get student attendance logs for all classes taught by this faculty.
    Returns data shaped for the FacultyReportsPage table (class monitoring view).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    # Get all classes taught by this faculty
    classes_query = db.query(Class).options(joinedload(Class.subject)).filter(Class.faculty_id == user_id)
    if class_id:
        classes_query = classes_query.filter(Class.id == class_id)
    classes = classes_query.all()

    if not classes:
        return []

    class_ids = [c.id for c in classes]
    class_map = {c.id: c for c in classes}

    # Build attendance log query — only ENTRY actions represent attendance
    log_query = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.user))
        .filter(
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
        )
    )

    # Date range filtering
    if date_from:
        try:
            start = datetime.strptime(date_from, "%Y-%m-%d").date()
            log_query = log_query.filter(func.date(AttendanceLog.timestamp) >= start)
        except ValueError:
            pass
    if date_to:
        try:
            end = datetime.strptime(date_to, "%Y-%m-%d").date()
            log_query = log_query.filter(func.date(AttendanceLog.timestamp) <= end)
        except ValueError:
            pass

    # If no date range specified, default to last 30 days
    if not date_from and not date_to:
        thirty_days_ago = date.today() - timedelta(days=30)
        log_query = log_query.filter(func.date(AttendanceLog.timestamp) >= thirty_days_ago)

    log_query = log_query.order_by(AttendanceLog.timestamp.desc())
    logs = log_query.offset(skip).limit(limit).all()

    # Also get enrolled students who are ABSENT (no log today / in range)
    # We'll include present students from logs first
    results = []
    for log in logs:
        student = log.user
        cls = class_map.get(log.class_id)
        subject = cls.subject if cls else None

        student_status = "Late" if log.is_late else "Present"

        # Apply status filter
        if status and status != "All":
            if status == "Present" and student_status != "Present":
                continue
            if status == "Late" and student_status != "Late":
                continue
            if status == "Issues" and student_status not in ("Late", "Absent"):
                continue

        # Apply section filter
        student_section = student.section if student else None
        if section and section != "All" and student_section != section:
            continue

        results.append({
            "id": log.id,
            "col1": f"{student.last_name}, {student.first_name}" if student else "Unknown",
            "col2": student_section or (cls.section if cls else "N/A"),
            "status": student_status,
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "--:--",
            "remarks": log.remarks or ("On Time" if not log.is_late else "Late Arrival"),
            "date": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else None,
            "subjectCode": subject.code if subject else None,
        })

    return results


@router.get("/reports/personal-logs/{user_id}")
def get_personal_attendance_logs(
    user_id: int,
    date_from: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    status: Optional[str] = Query(None, description="Filter: On Time, Late, All"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Get the faculty member's own attendance logs.
    Returns data shaped for the FacultyReportsPage table (personal view).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    # Query this faculty's own attendance entries
    log_query = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.class_))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
        )
    )

    # Date range filtering
    if date_from:
        try:
            start = datetime.strptime(date_from, "%Y-%m-%d").date()
            log_query = log_query.filter(func.date(AttendanceLog.timestamp) >= start)
        except ValueError:
            pass
    if date_to:
        try:
            end = datetime.strptime(date_to, "%Y-%m-%d").date()
            log_query = log_query.filter(func.date(AttendanceLog.timestamp) <= end)
        except ValueError:
            pass

    # Default to last 30 days when no range supplied
    if not date_from and not date_to:
        thirty_days_ago = date.today() - timedelta(days=30)
        log_query = log_query.filter(func.date(AttendanceLog.timestamp) >= thirty_days_ago)

    log_query = log_query.order_by(AttendanceLog.timestamp.desc())
    logs = log_query.offset(skip).limit(limit).all()

    # We need subject info — preload the classes' subjects
    class_ids = list({log.class_id for log in logs if log.class_id})
    subject_map = {}
    if class_ids:
        cls_rows = db.query(Class).options(joinedload(Class.subject)).filter(Class.id.in_(class_ids)).all()
        for c in cls_rows:
            subject_map[c.id] = c

    results = []
    for log in logs:
        log_status = "Late" if log.is_late else "On Time"

        # Apply status filter
        if status and status != "All":
            if status == "On Time" and log_status != "On Time":
                continue
            if status == "Late" and log_status != "Late":
                continue
            if status == "Issues" and log_status not in ("Late",):
                continue

        cls = subject_map.get(log.class_id)
        subject = cls.subject if cls else None
        room = cls.room if cls else None

        results.append({
            "id": log.id,
            "col1": log.timestamp.strftime("%b %d, %Y") if log.timestamp else "N/A",
            "col2": f"{subject.code} ({room or 'N/A'})" if subject else "N/A",
            "status": log_status,
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "--:--",
            "remarks": log.remarks or ("Regular Class" if not log.is_late else "Instructor Delay"),
            "date": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else None,
        })

    return results


@router.get("/reports/subjects/{user_id}")
def get_faculty_subjects(user_id: int, db: Session = Depends(get_db)):
    """
    Get the list of subjects taught by a faculty member.
    Used to populate the subject filter dropdown in FacultyReportsPage.
    """
    classes = (
        db.query(Class)
        .options(joinedload(Class.subject))
        .filter(Class.faculty_id == user_id)
        .all()
    )

    # Deduplicate by subject code
    seen = set()
    subjects = []
    for cls in classes:
        subj = cls.subject
        if subj and subj.code not in seen:
            seen.add(subj.code)
            subjects.append({
                "code": subj.code,
                "title": subj.title,
                "class_id": cls.id,
                "section": cls.section,
            })

    return subjects
