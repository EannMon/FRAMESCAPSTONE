"""
Report Service — Business logic for generating report data.
Queries attendance_logs, classes, users, enrollments to produce
tabular data in the shape { id, col1, col2, status, col3, remarks }
that the frontend report pages expect.
"""
import logging
from datetime import datetime, date, time, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_, extract

from models.attendance_log import AttendanceLog, AttendanceAction
from models.class_ import Class
from models.user import User, UserRole
from models.enrollment import Enrollment
from models.subject import Subject
from models.device import Device

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Faculty — Class-Specific Reports
# ──────────────────────────────────────────────

def _class_daily_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Daily attendance entries for a specific class within date range."""
    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    for i, (log, user) in enumerate(logs, 1):
        status = log.action.value if log.action else "UNKNOWN"
        if log.is_late and log.action == AttendanceAction.ENTRY:
            status = "LATE"
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": user.tupm_id or "—",
            "status": status,
            "col3": log.timestamp.strftime("%Y-%m-%d %I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "—",
        })
    return rows


def _class_absence_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Students enrolled but with no ENTRY log in date range — likely absent."""
    enrolled = (
        db.query(Enrollment, User)
        .join(User, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == class_id)
        .all()
    )
    student_ids_with_entry = set(
        r[0] for r in db.query(AttendanceLog.user_id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .distinct()
        .all()
    )
    rows = []
    for i, (enrl, user) in enumerate(enrolled, 1):
        if user.id not in student_ids_with_entry:
            rows.append({
                "id": i,
                "col1": user.full_name,
                "col2": user.tupm_id or "—",
                "status": "ABSENT",
                "col3": "No entry recorded",
                "remarks": f"Enrolled but no attendance in range",
            })
    return rows


def _class_late_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Students who had late entries."""
    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    for i, (log, user) in enumerate(logs, 1):
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": user.tupm_id or "—",
            "status": "LATE",
            "col3": log.timestamp.strftime("%Y-%m-%d %I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "—",
        })
    return rows


def _class_semester_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Per-student semester summary: total entries, late count, attendance rate."""
    enrolled = (
        db.query(Enrollment, User)
        .join(User, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == class_id)
        .all()
    )
    student_ids = [e.student_id for e, _ in enrolled]
    if not student_ids:
        return []

    # Batch: count entries and late entries per student
    entry_counts = dict(
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.user_id.in_(student_ids),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id)
        .all()
    )
    late_counts = dict(
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.user_id.in_(student_ids),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id)
        .all()
    )

    rows = []
    for i, (enrl, user) in enumerate(enrolled, 1):
        entries = entry_counts.get(user.id, 0)
        lates = late_counts.get(user.id, 0)
        on_time = entries - lates
        status = "Good" if entries > 0 and lates == 0 else ("Warning" if lates > 2 else "Present")
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": f"Entries: {entries}",
            "status": status,
            "col3": f"On-time: {on_time} | Late: {lates}",
            "remarks": user.tupm_id or "—",
        })
    return rows


def _class_monthly_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Monthly aggregation — same as semester but labeled monthly."""
    return _class_semester_report(db, class_id, date_from, date_to)


def _break_duration_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Break out/in logs for the class."""
    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action.in_([AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN]),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    for i, (log, user) in enumerate(logs, 1):
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": user.tupm_id or "—",
            "status": log.action.value,
            "col3": log.timestamp.strftime("%Y-%m-%d %I:%M %p") if log.timestamp else "—",
            "remarks": "Break activity",
        })
    return rows


def _early_exits_report(db: Session, class_id: int, date_from: str, date_to: str):
    """EXIT logs for the class — could indicate early departure."""
    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.EXIT,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    for i, (log, user) in enumerate(logs, 1):
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": user.tupm_id or "—",
            "status": "EXIT",
            "col3": log.timestamp.strftime("%Y-%m-%d %I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "Early exit",
        })
    return rows


def _participation_insight_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Participation summary — entries per student."""
    return _class_semester_report(db, class_id, date_from, date_to)


# ──────────────────────────────────────────────
# Faculty — Personal Reports
# ──────────────────────────────────────────────

def _personal_attendance_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Faculty's own attendance logs within date range."""
    logs = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.class_).joinedload(Class.subject))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    for i, log in enumerate(logs, 1):
        subject_name = "—"
        room = "—"
        if log.class_ and log.class_.subject:
            subject_name = f"{log.class_.subject.code} - {log.class_.subject.title}"
            room = log.class_.room or "—"
        status = log.action.value if log.action else "UNKNOWN"
        if log.is_late and log.action == AttendanceAction.ENTRY:
            status = "LATE"
        rows.append({
            "id": i,
            "col1": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "—",
            "col2": f"{subject_name} ({room})",
            "status": status,
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "—",
        })
    return rows


def _personal_semester_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Faculty semester summary — total entries, lates, by class."""
    classes = (
        db.query(Class)
        .options(joinedload(Class.subject))
        .filter(Class.faculty_id == user_id)
        .all()
    )
    if not classes:
        return []

    class_ids = [c.id for c in classes]
    entry_counts = dict(
        db.query(AttendanceLog.class_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(AttendanceLog.class_id)
        .all()
    )
    late_counts = dict(
        db.query(AttendanceLog.class_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(AttendanceLog.class_id)
        .all()
    )

    rows = []
    for i, cls in enumerate(classes, 1):
        entries = entry_counts.get(cls.id, 0)
        lates = late_counts.get(cls.id, 0)
        subj = cls.subject
        rows.append({
            "id": i,
            "col1": f"{subj.code} - {subj.title}" if subj else "—",
            "col2": f"Entries: {entries}",
            "status": "Good" if lates == 0 else "Warning",
            "col3": f"On-time: {entries - lates} | Late: {lates}",
            "remarks": cls.room or "—",
        })
    return rows


def _instructor_delay_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Times the instructor arrived late."""
    logs = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.class_).joinedload(Class.subject))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(200)
        .all()
    )
    rows = []
    for i, log in enumerate(logs, 1):
        subj = "—"
        if log.class_ and log.class_.subject:
            subj = log.class_.subject.code
        rows.append({
            "id": i,
            "col1": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "—",
            "col2": subj,
            "status": "LATE",
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "Late arrival",
        })
    return rows


# ──────────────────────────────────────────────
# DeptHead Reports
# ──────────────────────────────────────────────

def _faculty_summary_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Summary of all faculty attendance in the department."""
    from models.user import VerificationStatus
    faculty = (
        db.query(User)
        .filter(
            User.department_id == dept_id,
            User.role == UserRole.FACULTY,
            User.verification_status == VerificationStatus.VERIFIED,
        )
        .all()
    )
    if not faculty:
        return []

    faculty_ids = [f.id for f in faculty]
    entry_counts = dict(
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id)
        .all()
    )
    late_counts = dict(
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id)
        .all()
    )

    rows = []
    for i, fac in enumerate(faculty, 1):
        entries = entry_counts.get(fac.id, 0)
        lates = late_counts.get(fac.id, 0)
        status = "Good" if entries > 0 and lates == 0 else ("Warning" if lates > 3 else "Present")
        if entries == 0:
            status = "No Data"
        rows.append({
            "id": i,
            "col1": fac.full_name,
            "col2": f"Entries: {entries}",
            "status": status,
            "col3": f"On-time: {entries - lates} | Late: {lates}",
            "remarks": fac.email or "—",
        })
    return rows


def _faculty_late_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Faculty late entries in department."""
    from models.user import VerificationStatus
    query = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            User.department_id == dept_id,
            User.role == UserRole.FACULTY,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        query = query.join(Class, AttendanceLog.class_id == Class.id).filter(Class.room == room)
    logs = query.order_by(AttendanceLog.timestamp.desc()).limit(500).all()

    rows = []
    for i, (log, user) in enumerate(logs, 1):
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "—",
            "status": "LATE",
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "—",
        })
    return rows


def _room_occupancy_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Room occupancy — entry count per room."""
    query = (
        db.query(Class.room, func.count(AttendanceLog.id))
        .join(AttendanceLog, AttendanceLog.class_id == Class.id)
        .filter(
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        query = query.filter(Class.room == room)
    results = query.group_by(Class.room).all()

    rows = []
    for i, (room_name, count) in enumerate(results, 1):
        rows.append({
            "id": i,
            "col1": room_name or "Unknown",
            "col2": f"{count} entries",
            "status": "Active" if count > 0 else "No Data",
            "col3": str(count),
            "remarks": "Total entries in period",
        })
    return rows


def _room_utilization_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Room utilization — classes per room."""
    return _room_occupancy_report(db, dept_id, date_from, date_to, room)


def _dept_activity_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Department-wide activity overview."""
    from models.user import VerificationStatus
    # Count entries by role
    results = (
        db.query(User.role, func.count(AttendanceLog.id))
        .join(AttendanceLog, AttendanceLog.user_id == User.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(User.role)
        .all()
    )
    rows = []
    for i, (role, count) in enumerate(results, 1):
        rows.append({
            "id": i,
            "col1": role.value if hasattr(role, 'value') else str(role),
            "col2": f"{count} entries",
            "status": "Active",
            "col3": str(count),
            "remarks": "Total entries by role",
        })
    if not rows:
        rows.append({
            "id": 1,
            "col1": "Department",
            "col2": "No activity",
            "status": "No Data",
            "col3": "0",
            "remarks": "No attendance records in date range",
        })
    return rows


# ──────────────────────────────────────────────
# Dispatcher Functions
# ──────────────────────────────────────────────

FACULTY_CLASS_REPORTS = {
    "CLASS_DAILY": _class_daily_report,
    "CLASS_MONTHLY": _class_monthly_report,
    "CLASS_SEMESTER": _class_semester_report,
    "CLASS_ABSENCE": _class_absence_report,
    "CLASS_LATE": _class_late_report,
    "BREAK_DURATION": _break_duration_report,
    "UNRECOGNIZED_LOGS": _class_daily_report,  # Reuse daily with all actions
    "EARLY_EXITS": _early_exits_report,
    "ATTENDANCE_INCONSISTENCY": _class_daily_report,
    "PARTICIPATION_INSIGHT": _participation_insight_report,
}

FACULTY_PERSONAL_REPORTS = {
    "PERSONAL_DAILY": _personal_attendance_report,
    "PERSONAL_WEEKLY": _personal_attendance_report,
    "PERSONAL_MONTHLY": _personal_attendance_report,
    "PERSONAL_SEMESTER": _personal_semester_report,
    "HISTORY_30D": _personal_attendance_report,
    "INSTRUCTOR_DELAY": _instructor_delay_report,
    "PERSONAL_CONSISTENCY": _personal_semester_report,
}

DEPT_REPORTS = {
    "FACULTY_SUMMARY": _faculty_summary_report,
    "FACULTY_LATE": _faculty_late_report,
    "FACULTY_CONSISTENCY": _faculty_summary_report,
    "ROOM_OCCUPANCY": _room_occupancy_report,
    "PEAK_USAGE": _room_occupancy_report,
    "ROOM_UTILIZATION": _room_utilization_report,
    "OVERCROWDING": _room_occupancy_report,
    "DEPT_ACTIVITY": _dept_activity_report,
}


def get_faculty_report(db: Session, user_id: int, report_type: str,
                       class_id: int = None, date_from: str = None, date_to: str = None):
    """Dispatch to the correct faculty report generator."""
    if report_type in FACULTY_CLASS_REPORTS:
        if not class_id:
            return []
        handler = FACULTY_CLASS_REPORTS[report_type]
        return handler(db, class_id, date_from or "2020-01-01", date_to or "2099-12-31")
    elif report_type in FACULTY_PERSONAL_REPORTS:
        handler = FACULTY_PERSONAL_REPORTS[report_type]
        return handler(db, user_id, date_from or "2020-01-01", date_to or "2099-12-31")
    else:
        logger.warning("Unknown faculty report type: %s", report_type)
        return []


def get_dept_report(db: Session, dept_id: int, report_type: str,
                    date_from: str = None, date_to: str = None, room: str = None):
    """Dispatch to the correct department report generator."""
    handler = DEPT_REPORTS.get(report_type)
    if not handler:
        logger.warning("Unknown dept report type: %s", report_type)
        return []
    return handler(db, dept_id, date_from or "2020-01-01", date_to or "2099-12-31", room)
