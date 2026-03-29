"""
Report Service — Business logic for generating report data.
Queries attendance_logs, classes, users, enrollments to produce
tabular data in the shape { id, col1, col2, status, col3, remarks }
that the frontend report pages expect.
"""
import logging
import threading
import math
from collections import defaultdict
from copy import deepcopy
from datetime import datetime, date, time, timezone, timedelta
from datetime import datetime as dt
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_, or_, extract

from models.attendance_log import AttendanceLog, AttendanceAction
from models.class_ import Class
from models.department import Department
from models.user import User, UserRole
from models.enrollment import Enrollment
from models.subject import Subject
from models.device import Device
from models.session_exception import SessionException, ExceptionType
from services.report_metric_service import (
    build_student_summary_metrics,
    compute_student_session_count_reference,
    compute_student_core_metrics,
    resolve_student_scoped_class_ids,
)
from services.role_based_analytics_service import (
    generate_student_role_insights,
    generate_faculty_role_insights,
    generate_department_role_insights,
)

logger = logging.getLogger(__name__)


# Short-lived in-memory cache for repeated student report requests.
_STUDENT_REPORT_CACHE_TTL_SECONDS = 15
_STUDENT_REPORT_CACHE_MAX_ENTRIES = 256
_student_report_cache = {}
_student_report_cache_lock = threading.Lock()


def _normalize_room(room: str):
    if not room:
        return None
    # Convert 'Room 123' or 'room 123' to just '123'
    # Then lowercase and strip for consistent database comparison
    normalized = room.lower().replace("room", "").strip()
    return normalized or None


def _apply_room_filter(query, room_column, room: str):
    normalized = _normalize_room(room)
    if not normalized:
        return query
    # Check for direct match or numeric-only version in DB
    # Handles both '123' and 'Room 123' in the database records
    return query.filter(
        or_(
            func.lower(func.trim(room_column)) == normalized,
            func.lower(func.trim(room_column)) == f"room {normalized}"
        )
    )


def _department_faculty_ids(db: Session, dept_id: int):
    if not dept_id:
        return []
    rows = (
        db.query(User.id)
        .filter(
            User.department_id == dept_id,
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
        )
        .all()
    )
    return [row[0] for row in rows]


def _build_row_session_reference(rows, window_from: str, window_to: str):
    """
    Build session counts and activity references directly from the filtered report rows.
    Ensures that Session Count Reference and trends update every time the report filter changes.
    """
    total_rows = len(rows)
    # Define success tokens for consistent calculation across all report types
    success_tokens = [
        "present", "entered", "entry", "on time", "good", "excellent", 
        "active", "peak", "late", "normal", "high", "moderate"
    ]
    
    attended = 0
    late_count = 0
    for row in rows:
        status = str(row.get("status", "")).strip().lower()
        if any(token in status for token in success_tokens):
            attended += 1
        if "late" in status:
            late_count += 1

    report_window = {
        "attended": attended,
        "conducted": total_rows,
        "expected": total_rows,
        "late_count": late_count,
        "punctuality_rate": round(((attended - late_count) / max(attended, 1)) * 100, 1) if attended > 0 else 0,
        "date_from": window_from,
        "date_to": window_to,
    }

    return {
        "report_window": report_window,
        "whole_semester": {
            "attended": attended,
            "conducted": total_rows,
            "expected": total_rows,
            "semester_start_date": window_from,
            "semester_end_date": window_to,
        },
        "activity_trend": {
            "total_records": total_rows,
            "success_rate": round((attended / max(total_rows, 1)) * 100, 1),
            "is_stale": False,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    }


def _make_student_report_cache_key(
    user_id: int,
    report_code: str,
    date_from: datetime,
    date_to: datetime,
    class_scope: str,
    skip: int,
    limit: int,
) -> str:
    return "|".join(
        [
            str(user_id),
            report_code,
            date_from.isoformat() if date_from else "",
            date_to.isoformat() if date_to else "",
            class_scope,
            str(skip),
            str(limit),
        ]
    )


def _get_cached_student_report(cache_key: str):
    now_ts = datetime.now(timezone.utc).timestamp()
    with _student_report_cache_lock:
        item = _student_report_cache.get(cache_key)
        if not item:
            return None
        if now_ts - item["ts"] > _STUDENT_REPORT_CACHE_TTL_SECONDS:
            _student_report_cache.pop(cache_key, None)
            return None
        return deepcopy(item["value"])


def _set_cached_student_report(cache_key: str, value: dict):
    now_ts = datetime.now(timezone.utc).timestamp()
    with _student_report_cache_lock:
        # Opportunistic cleanup of expired items.
        expired_keys = [
            key
            for key, item in _student_report_cache.items()
            if now_ts - item["ts"] > _STUDENT_REPORT_CACHE_TTL_SECONDS
        ]
        for key in expired_keys:
            _student_report_cache.pop(key, None)

        if len(_student_report_cache) >= _STUDENT_REPORT_CACHE_MAX_ENTRIES:
            oldest_key = min(_student_report_cache, key=lambda key: _student_report_cache[key]["ts"])
            _student_report_cache.pop(oldest_key, None)

        _student_report_cache[cache_key] = {
            "ts": now_ts,
            "value": deepcopy(value),
        }


# ──────────────────────────────────────────────
# Faculty — Class-Specific Reports
# ──────────────────────────────────────────────

def _class_daily_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Daily attendance entries for a specific class within date range."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    seen = set()
    for log, user in logs:
        # Deduplication to catch same-day duplicate entries
        log_dt = log.timestamp.date() if (hasattr(log, 'timestamp') and log.timestamp) else None
        log_id_user = getattr(log, 'user_id', None)
        log_id_class = getattr(log, 'class_id', None)
        log_id_action = getattr(log, 'action', None)
        log_key = (log_id_user, log_id_class, log_dt, log_id_action)
        if log_key in seen: continue
        seen.add(log_key)
        i = len(rows) + 1
        # Aggressive deduplication by user, room, subject, and date
        cls = getattr(log, 'class_', None)
        raw_rm = getattr(cls, 'room', 'Unknown')
        rm = raw_rm.strip().lower() if raw_rm else "unknown"
        subj_id = getattr(cls, 'subject_id', None)
        log_dt = log.timestamp.date() if (hasattr(log, 'timestamp') and log.timestamp) else None
        
        # Unique key for (User + Room + Subject + Date + Action)
        log_key = (getattr(log, 'user_id', None), rm, subj_id, log_dt, getattr(log, 'action', None))
        if log_key in seen: continue
        seen.add(log_key)
        i = len(rows) + 1
        status = log.action.value if log.action else "UNKNOWN"
        if log.is_late and log.action == AttendanceAction.ENTRY:
            status = "LATE"
            
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": user.tupm_id or "—",
            "status": status,
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "",
        })
    return rows


def _class_absence_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Students enrolled but with no ENTRY log in date range — likely absent."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

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
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
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
                "status": "Absent",
                "col3": "No entry recorded",
                "remarks": "",
            })
    return rows


def _class_late_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Students who had late entries."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    seen = set()
    for i, (log, user) in enumerate(logs, 1):
        # Aggressive deduplication: User + Room + Subject + Date + Action
        cls = log.class_
        raw_rm = cls.room if cls else "Unknown"
        rm = raw_rm.strip().lower() if raw_rm else "unknown"
        subj_id = cls.subject_id if cls else None
        log_dt = log.timestamp.date() if log.timestamp else None
        
        # KEY: Collapse duplicates for SAME room/subject session on SAME day
        log_key = (user.id, rm, subj_id, log_dt, log.action)
        if log_key in seen: continue
        seen.add(log_key)
        
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": user.tupm_id or "—",
            "status": "Late",
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "", # Revert to actual remarks
        })
    return rows


def _class_semester_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Per-student semester summary: total entries, late count, attendance rate."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    enrolled = (
        db.query(Enrollment, User)
        .join(User, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == class_id)
        .all()
    )
    student_ids = [e.student_id for e, _ in enrolled]
    if not student_ids:
        return []

    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.user_id.in_(student_ids),
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .all()
    )

    # Aggressive deduplication: User + Room + Subject + Date + Action
    seen = set()
    cleaned_logs = []
    for log, user in logs:
        cls = log.class_
        raw_rm = cls.room if cls else "Unknown"
        rm = raw_rm.strip().lower() if raw_rm else "unknown"
        subj_id = cls.subject_id if cls else None
        log_dt = log.timestamp.date() if log.timestamp else None
        
        # KEY: Collapse duplicates for SAME room/subject session on SAME day
        log_key = (user.id, rm, subj_id, log_dt, log.action)
        if log_key in seen: continue
        seen.add(log_key)
        cleaned_logs.append((log, user))

    # Batch: count entries and late entries per student using deduplicated set
    entry_counts = defaultdict(int)
    late_counts = defaultdict(int)
    
    for log, user in cleaned_logs:
        if log.action == AttendanceAction.ENTRY:
            entry_counts[user.id] += 1
            if log.is_late:
                late_counts[user.id] += 1

    rows = []
    for i, (enrl, user) in enumerate(enrolled, 1):
        entries = entry_counts[user.id]
        lates = late_counts[user.id]
        on_time = entries - lates
        
        # Calculate Mock Score and Avg
        score = round((on_time / max(entries, 1)) * 100, 1) if entries > 0 else 0
        avg_offset = "+7.5 min" if lates > 0 else "0.0 min"
        
        status = "Good" if entries > 0 and lates == 0 else ("Warning" if lates > 2 else "Present")
        
        # Check for any 'not in class' remarks in logs for this student
        not_in_class_flag = False
        other_remarks = []
        for log, _ in cleaned_logs:
            if log.user_id == user.id:
                if log.remarks:
                    if "not in class" in log.remarks.lower():
                        not_in_class_flag = True
                    # Always include the full remark for context
                    other_remarks.append(log.remarks)

        final_remarks = ""
        if not_in_class_flag and not any("not in class" in r.lower() for r in other_remarks):
             # This case shouldn't happen with the logic above, but for safety:
             other_remarks.insert(0, "Not in Class")
             
        final_remarks = ", ".join(dict.fromkeys(other_remarks)) # deduplicate while preserving order

        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": user.tupm_id or "—",
            "status": status,
            "col3": f"Score: {score}/100 | Entries: {entries}",
            "remarks": final_remarks,
        })
    return rows


def _class_monthly_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Monthly aggregation — per-student attendance grouped by calendar month."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    enrolled = (
        db.query(Enrollment, User)
        .join(User, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == class_id)
        .all()
    )
    student_ids = [e.student_id for e, _ in enrolled]
    if not student_ids:
        return []

    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.user_id.in_(student_ids),
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .all()
    )

    # Aggressive deduplication: User + Room + Subject + Date + Action
    seen = set()
    cleaned_logs = []
    for log, user in logs:
        cls = log.class_
        raw_rm = cls.room if cls else "Unknown"
        rm = raw_rm.strip().lower() if raw_rm else "unknown"
        subj_id = cls.subject_id if cls else None
        log_dt = log.timestamp.date() if log.timestamp else None
        
        # KEY: Collapse duplicates for SAME room/subject session on SAME day
        log_key = (user.id, rm, subj_id, log_dt, log.action)
        if log_key in seen: continue
        seen.add(log_key)
        cleaned_logs.append((log, user))

    # Build lookup dicts keyed by (user_id, year, month)
    entry_lookup = defaultdict(int)
    late_lookup = defaultdict(int)
    all_months = set()

    for log, user in cleaned_logs:
        yr = log.timestamp.year
        mo = log.timestamp.month
        all_months.add((yr, mo))
        
        key = (user.id, yr, mo)
        entry_lookup[key] += 1
        if log.is_late:
            late_lookup[key] += 1

    # Sorted list of unique months
    sorted_months = sorted(list(all_months))
    if not sorted_months:
        return []

    MONTH_NAMES = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]

    rows = []
    row_id = 1
    for yr, mo in sorted_months:
        month_label = f"{MONTH_NAMES[mo]} {yr}"
        for enrl, user in enrolled:
            entries = entry_lookup.get((user.id, yr, mo), 0)
            if entries == 0:
                continue  # Skip students with no entries in this month
            lates = late_lookup.get((user.id, yr, mo), 0)
            on_time = entries - lates
            
            score = round((on_time / max(entries, 1)) * 100, 1) if entries > 0 else 0
            avg_offset = "+7.5 min" if lates > 0 else "0.0 min"
            
            status = "Good" if entries > 0 and lates == 0 else ("Warning" if lates > 2 else "Present")
            
            # Check for any 'not in class' remarks in logs for this student/month
            not_in_class_flag = False
            other_remarks = []
            for log, _ in cleaned_logs:
                if log.user_id == user.id:
                    yr_log = log.timestamp.year
                    mo_log = log.timestamp.month
                    if yr_log == yr and mo_log == mo and log.remarks:
                        if "not in class" in log.remarks.lower():
                            not_in_class_flag = True
                        other_remarks.append(log.remarks)

            final_remarks = ", ".join(dict.fromkeys(other_remarks)) if other_remarks else ""

            rows.append({
                "id": row_id,
                "col1": user.full_name,
                "col2": user.tupm_id or "—",
                "status": status,
                "col3": f"Score: {score}/100 | Entries: {entries}",
                "remarks": final_remarks,
            })
            row_id += 1
    return rows


def _break_duration_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Break analysis — pairs BREAK_OUT→BREAK_IN to compute duration per break."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action.in_([AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN]),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .order_by(AttendanceLog.user_id, AttendanceLog.timestamp)
        .all()
    )

    # Group by user and pair consecutive BREAK_OUT → BREAK_IN
    from itertools import groupby
    rows = []
    row_id = 1
    # Sort logs locally to ensure strictly chronological pairing per user
    log_list = sorted(list(logs), key=lambda x: (x[0].user_id, x[0].timestamp))
    
    for user_id, user_logs in groupby(log_list, key=lambda x: x[0].user_id):
        pending_out = None
        for log, user in user_logs:
            if log.action == AttendanceAction.BREAK_OUT:
                # If we already have a pending out, report it as 'No Return' before taking new one
                if pending_out:
                    po_log, po_user = pending_out
                    rows.append({
                        "id": row_id,
                        "col1": po_user.full_name,
                        "col2": po_user.tupm_id or "—",
                        "status": "No Return",
                        "col3": f"Left at {po_log.timestamp.strftime('%I:%M %p')}, did not return",
                        "remarks": "—",
                    })
                    row_id += 1
                pending_out = (log, user)
            elif log.action == AttendanceAction.BREAK_IN:
                if pending_out:
                    out_log, out_user = pending_out
                    duration_min = (log.timestamp - out_log.timestamp).total_seconds() / 60
                    status = "Extended" if duration_min > 15 else "Normal"
                    rows.append({
                        "id": row_id,
                        "col1": user.full_name,
                        "col2": user.tupm_id or "—",
                        "status": status,
                        "col3": f"{duration_min:.0f} min",
                        "remarks": f"Out: {out_log.timestamp.strftime('%I:%M %p')} → In: {log.timestamp.strftime('%I:%M %p')}",
                    })
                    row_id += 1
                    pending_out = None
                else:
                    # BREAK_IN with no preceding BREAK_OUT
                    rows.append({
                        "id": row_id,
                        "col1": user.full_name,
                        "col2": user.tupm_id or "—",
                        "status": "Incomplete",
                        "col3": "—",
                        "remarks": f"Returned at {log.timestamp.strftime('%I:%M %p')} (no record of leaving)",
                    })
                    row_id += 1
        
        # Unpaired BREAK_OUT at end of user's log stream
        if pending_out:
            out_log, out_user = pending_out
            rows.append({
                "id": row_id,
                "col1": out_user.full_name,
                "col2": out_user.tupm_id or "—",
                "status": "No Return",
                "col3": f"Left at {out_log.timestamp.strftime('%I:%M %p')}, did not return",
                "remarks": "—",
            })
            row_id += 1
    return rows


def _early_exits_report(db: Session, class_id: int, date_from: str, date_to: str):
    """EXIT logs for the class — could indicate early departure."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.EXIT,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    seen = set()
    for log, user in logs:
        # Deduplication based on date to catch rapid taps
        log_date = log.timestamp.date() if log.timestamp else None
        log_key = (log.user_id, log.class_id, log_date, log.action)
        if log_key in seen: continue
        seen.add(log_key)
        i = len(rows) + 1
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
    """Class participation consistency — per-student stability score (0-100)."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    enrolled = (
        db.query(Enrollment, User)
        .join(User, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == class_id)
        .all()
    )
    if not enrolled:
        return []

    student_ids = [e.student_id for e, _ in enrolled]

    # Get all ENTRY dates per student in one query
    entries = (
        db.query(
            AttendanceLog.user_id,
            func.date_trunc('day', AttendanceLog.timestamp).label('entry_date'),
        )
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.user_id.in_(student_ids),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .distinct()
        .all()
    )

    # Count distinct session dates for total possible
    total_sessions = len(set(
        r[0] for r in db.query(func.date_trunc('day', AttendanceLog.timestamp))
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .distinct()
        .all()
    ))
    if total_sessions == 0:
        total_sessions = 1

    # Count entries per student
    from collections import defaultdict
    student_entries = defaultdict(int)
    for user_id, _ in entries:
        student_entries[user_id] += 1

    # Get late counts
    late_counts = dict(
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.user_id.in_(student_ids),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id)
        .all()
    )

    rows = []
    for i, (enrl, user) in enumerate(enrolled, 1):
        attended = student_entries.get(user.id, 0)
        lates = late_counts.get(user.id, 0)
        attendance_rate = (attended / total_sessions) * 100
        punctuality_rate = ((attended - lates) / max(attended, 1)) * 100
        # Consistency score: weighted combo of attendance + punctuality
        score = round((attendance_rate * 0.7) + (punctuality_rate * 0.3), 1)
        score = max(0, min(100, score))

        if score >= 85:
            status = "Excellent"
        elif score >= 70:
            status = "Good"
        elif score >= 50:
            status = "Average"
        else:
            status = "At Risk"

        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": f"Score: {score}/100",
            "status": status,
            "col3": f"Attended: {attended}/{total_sessions} | Late: {lates}",
            "remarks": user.tupm_id or "—",
        })

    rows.sort(key=lambda r: float(r['col2'].split(': ')[1].split('/')[0]), reverse=True)
    for i, row in enumerate(rows, 1):
        row['id'] = i
    return rows


def _punctuality_index_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Punctuality index — ranks students by average arrival time vs class start."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls or not cls.start_time:
        return []

    enrolled = (
        db.query(Enrollment, User)
        .join(User, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == class_id)
        .all()
    )
    if not enrolled:
        return []

    student_ids = [e.student_id for e, _ in enrolled]

    # Get all ENTRY logs with timestamps
    entry_logs = (
        db.query(AttendanceLog.user_id, AttendanceLog.timestamp)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.user_id.in_(student_ids),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .all()
    )

    # Compute average arrival offset (minutes from class start_time)
    from collections import defaultdict
    offsets = defaultdict(list)
    class_start_minutes = cls.start_time.hour * 60 + cls.start_time.minute
    for user_id, ts in entry_logs:
        arrival_minutes = ts.hour * 60 + ts.minute
        offset = arrival_minutes - class_start_minutes
        offsets[user_id].append(offset)

    user_map = {u.id: u for _, u in enrolled}
    rows = []
    for user_id, offset_list in offsets.items():
        user = user_map.get(user_id)
        if not user:
            continue
        avg_offset = sum(offset_list) / len(offset_list)
        # Score: 100 - (avg_offset * 2), capped [0, 100]
        score = max(0, min(100, round(100 - (avg_offset * 2), 1)))
        entries = len(offset_list)
        rows.append({
            "id": 0,
            "col1": user.full_name,
            "col2": user.tupm_id or "—", # TUPM-ID column
            "status": "On Time" if avg_offset <= 0 else ("Slightly Late" if avg_offset <= 10 else "Late"),
            "col3": f"Avg: {avg_offset:+.1f} min", # Time column
            "remarks": f"Score: {score}/100 | Entries: {entries}", # Summary column
        })

    # Add students with no entries
    present_ids = set(offsets.keys())
    for enrl, user in enrolled:
        if user.id not in present_ids:
            rows.append({
                "id": 0,
                "col1": user.full_name,
                "col2": user.tupm_id or "—",
                "status": "Absent",
                "col3": "No entries",
                "remarks": "Score: 0/100 | Entries: 0",
            })

    # Sort by score descending (extract from remarks instead of col3)
    rows.sort(key=lambda r: float(r['remarks'].split('Score: ')[1].split('/')[0]), reverse=True)
    for i, row in enumerate(rows, 1):
        row['id'] = i
    return rows


def _unrecognized_logs_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Logs with low confidence scores — potential unrecognized individuals."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    CONFIDENCE_THRESHOLD = 0.5
    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.confidence_score < CONFIDENCE_THRESHOLD,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    rows = []
    seen = set()
    for log, user in logs:
        # Deduplication based on date to catch rapid taps
        log_date = log.timestamp.date() if log.timestamp else None
        log_key = (log.user_id, log.class_id, log_date, log.action)
        if log_key in seen: continue
        seen.add(log_key)
        i = len(rows) + 1
        rows.append({
            "id": i,
            "col1": user.full_name,
            "col2": f"Confidence: {log.confidence_score:.2f}" if log.confidence_score else "N/A",
            "status": "Low Confidence",
            "col3": log.timestamp.strftime("%Y-%m-%d %I:%M %p") if log.timestamp else "—",
            "remarks": f"{log.action.value} | {log.verified_by.value if log.verified_by else '—'}",
        })
    if not rows:
        rows.append({
            "id": 1,
            "col1": "No unrecognized logs",
            "col2": f"Threshold: {CONFIDENCE_THRESHOLD}",
            "status": "Clear",
            "col3": "—",
            "remarks": "All entries above confidence threshold",
        })
    return rows


def _attendance_inconsistency_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Students who have BREAK events but no ENTRY on the same day."""
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    dept_id = cls_obj.faculty.department_id if (cls_obj and cls_obj.faculty) else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    # Get all break events with their dates
    break_events = (
        db.query(
            AttendanceLog.user_id,
            func.date_trunc('day', AttendanceLog.timestamp).label('event_date'),
        )
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action.in_([AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN]),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .distinct()
        .all()
    )

    # Get all entry events with their dates
    entry_events = set(
        (r[0], r[1]) for r in db.query(
            AttendanceLog.user_id,
            func.date_trunc('day', AttendanceLog.timestamp).label('event_date'),
        )
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .distinct()
        .all()
    )

    # Find users with breaks but no entry on same day
    inconsistencies = []
    for user_id, event_date in break_events:
        if (user_id, event_date) not in entry_events:
            inconsistencies.append((user_id, event_date))

    if not inconsistencies:
        return [{
            "id": 1,
            "col1": "No inconsistencies found",
            "col2": "—",
            "status": "Clear",
            "col3": "—",
            "remarks": "All break events have corresponding ENTRY logs",
        }]

    # Fetch user names
    user_ids = list(set(uid for uid, _ in inconsistencies))
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    rows = []
    for i, (user_id, event_date) in enumerate(inconsistencies, 1):
        user = users.get(user_id)
        date_str = event_date.strftime("%Y-%m-%d") if event_date else "—"
        rows.append({
            "id": i,
            "col1": user.full_name if user else f"User {user_id}",
            "col2": date_str,
            "status": "Inconsistent",
            "col3": "Break logged, no ENTRY",
            "remarks": user.tupm_id if user else "—",
        })
    return rows


def _personal_consistency_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Personal consistency index — 0-100 score based on attendance regularity."""
    user_obj = db.query(User).filter(User.id == user_id).first()
    dept_id = user_obj.department_id if user_obj else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    classes = (
        db.query(Class)
        .options(joinedload(Class.subject))
        .filter(Class.faculty_id == user_id)
        .all()
    )
    if not classes:
        # For students, look up enrolled classes instead
        enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.student_id == user_id)
            .all()
        )
        if enrollments:
            class_ids = [e.class_id for e in enrollments]
            classes = (
                db.query(Class)
                .options(joinedload(Class.subject))
                .filter(Class.id.in_(class_ids))
                .all()
            )
    if not classes:
        return []

    class_ids = [c.id for c in classes]

    # Get attendance counts per class (deduplicated by Date/User/Class)
    entry_counts = dict(
        db.query(
            AttendanceLog.class_id,
            func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp))))
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .group_by(AttendanceLog.class_id)
        .all()
    )
    late_counts = dict(
        db.query(
            AttendanceLog.class_id,
            func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp))))
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .group_by(AttendanceLog.class_id)
        .all()
    )

    # Get total session counts per class (distinct days with any ENTRY)
    session_counts = dict(
        db.query(
            AttendanceLog.class_id,
            func.count(func.distinct(func.date_trunc('day', AttendanceLog.timestamp))),
        )
        .filter(
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .group_by(AttendanceLog.class_id)
        .all()
    )

    rows = []
    for i, cls in enumerate(classes, 1):
        entries = entry_counts.get(cls.id, 0)
        lates = late_counts.get(cls.id, 0)
        total_sessions = session_counts.get(cls.id, 1)
        # Cap entries at total_sessions to ensure 100% max attendance rate per subject
        capped_entries = min(entries, total_sessions)
        
        attendance_rate = (capped_entries / max(total_sessions, 1)) * 100
        punctuality_rate = ((entries - lates) / max(entries, 1)) * 100
        
        score = round((attendance_rate * 0.7) + (punctuality_rate * 0.3), 1)
        score = max(0, min(100, score))
        subj = cls.subject
        if score >= 85:
            status = "Excellent"
        elif score >= 70:
            status = "Good"
        elif score >= 50:
            status = "Average"
        else:
            status = "At Risk"
        rows.append({
            "id": i,
            "col1": f"{subj.code if subj else '—'} - {subj.title if subj else '—'}",
            "col2": cls.room or "—",
            "status": status,
            "col3": f"On-time: {entries - lates} | Late: {lates}",
            "remarks": f"Entries: {entries}",
        })
    return rows


# ──────────────────────────────────────────────
# Faculty — Personal Reports
# ──────────────────────────────────────────────

def _personal_attendance_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Faculty's own attendance logs within date range."""
    user = db.query(User).filter(User.id == user_id).first()
    dept = db.query(Department).filter(Department.id == user.department_id).first() if user else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    logs = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.class_).joinedload(Class.subject))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(500)
        .all()
    )
    return _build_student_rows(logs)


def _personal_semester_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Faculty semester summary — total entries, lates, by class."""
    user_obj = db.query(User).filter(User.id == user_id).first()
    dept_id = user_obj.department_id if user_obj else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

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
        db.query(
            AttendanceLog.class_id,
            func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp))))
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .group_by(AttendanceLog.class_id)
        .all()
    )
    late_counts = dict(
        db.query(
            AttendanceLog.class_id,
            func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp))))
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
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
            "col2": cls.room or "—",
            "status": "Good" if lates == 0 else "Warning",
            "col3": f"On-time: {entries - lates} | Late: {lates}",
            "remarks": f"Entries: {entries}",
        })
    return rows


def _instructor_delay_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Times the instructor arrived late."""
    user_obj = db.query(User).filter(User.id == user_id).first()
    dept_id = user_obj.department_id if user_obj else None
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    logs = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.class_).joinedload(Class.subject))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .order_by(AttendanceLog.timestamp.desc())
        .limit(200)
        .all()
    )
    rows = []
    seen = set()
    for log in logs:
        # Deduplicate: User + Class + Date
        log_dt = log.timestamp.date() if log.timestamp else None
        log_key = (log.user_id, log.class_id, log_dt)
        if log_key in seen: continue
        seen.add(log_key)

        subj = "—"
        if log.class_ and log.class_.subject:
            subj = log.class_.subject.code
            
        i = len(rows) + 1
        rows.append({
            "id": i,
            "col1": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "—",
            "col2": f"{subj} - {log.class_.room if log.class_ else 'Unknown'}",
            "status": "LATE",
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "Arrived Late",
        })
    return rows


# ──────────────────────────────────────────────
# DeptHead Reports
# ──────────────────────────────────────────────

def _faculty_summary_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Summary of all faculty attendance in the department."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    from models.user import VerificationStatus
    faculty = (
        db.query(User)
        .filter(
            User.department_id == dept_id,
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
            User.verification_status == VerificationStatus.VERIFIED,
        )
        .all()
    )
    if not faculty:
        return []

    faculty_ids = [f.id for f in faculty]
    entry_query = (
        db.query(AttendanceLog.user_id, func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp)))))
        .join(Class, AttendanceLog.class_id == Class.id)
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        entry_query = _apply_room_filter(
            entry_query,
            Class.room,
            room,
        )
    entry_counts = dict(entry_query.group_by(AttendanceLog.user_id).all())

    late_query = (
        db.query(AttendanceLog.user_id, func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp)))))
        .join(Class, AttendanceLog.class_id == Class.id)
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        late_query = _apply_room_filter(
            late_query,
            Class.room,
            room,
        )
    late_counts = dict(late_query.group_by(AttendanceLog.user_id).all())

    rows = []
    for i, fac in enumerate(faculty, 1):
        entries = entry_counts.get(fac.id, 0)
        lates = late_counts.get(fac.id, 0)
        status = "Good" if entries > 0 and lates == 0 else ("Warning" if lates > 3 else "Present")
        if entries == 0:
            status = "No Data"
            
        # Get all unique remarks for this faculty member in the date range
        all_remarks = db.query(AttendanceLog.remarks).join(Class, AttendanceLog.class_id == Class.id).filter(
            AttendanceLog.user_id == fac.id,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
            AttendanceLog.remarks != None,
            AttendanceLog.remarks != ""
        )
        if room:
            all_remarks = _apply_room_filter(all_remarks, Class.room, room)
        
        remarks_list = [r[0] for r in all_remarks.distinct().all()]
        final_remarks = ", ".join(remarks_list) if remarks_list else "—"

        rows.append({
            "id": i,
            "col1": fac.full_name,
            "col2": f"Entries: {entries}",
            "status": status,
            "col3": f"On-time: {entries - lates} | Late: {lates}",
            "remarks": final_remarks,
        })
    return rows


def _faculty_late_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Faculty late entries in department."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    query = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .join(Class, AttendanceLog.class_id == Class.id)
        .options(joinedload(AttendanceLog.class_).joinedload(Class.subject))
        .filter(
            User.department_id == dept_id,
            User.role == UserRole.FACULTY,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        query = _apply_room_filter(
            query,
            Class.room,
            room,
        )
    logs = query.order_by(AttendanceLog.timestamp.desc()).limit(500).all()

    rows = []
    seen = set()
    for log, user in logs:
        # Aggressive deduplication: User + Class + Date
        # A person can only be late ONCE per class per day
        log_dt = log.timestamp.date() if log.timestamp else None
        
        # KEY: Collapse duplicates for SAME user/class on SAME day
        log_key = (log.user_id, log.class_id, log_dt)
        if log_key in seen: continue
        seen.add(log_key)
        
        i = len(rows) + 1
        rows.append({
            "id": i,
            "col1": f"{user.first_name} {user.last_name}",
            "col2": f"{log.class_.subject.code} - {log.class_.room}",
            "status": "LATE",
            "col3": log.timestamp.strftime("%Y-%m-%d %I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "Arrived Late",
        })
    return rows
def _room_occupancy_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Room occupancy — entry count per room."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    query = (
        db.query(Class.room, func.count(AttendanceLog.id))
        .join(AttendanceLog, AttendanceLog.class_id == Class.id)
        .join(User, Class.faculty_id == User.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        query = _apply_room_filter(query, Class.room, room)
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
    """Room utilization — compares actual attendance against scheduled class sessions."""
    # Get scheduled classes per room
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today
    query = (
        db.query(Class)
        .join(User, Class.faculty_id == User.id)
        .filter(
            Class.faculty_id.isnot(None),
            User.department_id == dept_id,
        )
    )
    if room:
        query = _apply_room_filter(query, Class.room, room)
    classes = query.all()

    if not classes:
        return []

    # Calculate expected sessions per room in date range
    faculty_map = {u.id: u for u in db.query(User).filter(User.department_id == dept_id).all()}
    
    DAY_MAP = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2,
        "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6,
    }

    room_expected = {}
    room_class_count = {}
    for cls in classes:
        rm = cls.room or "Unknown"
        target_day = DAY_MAP.get(cls.day_of_week)
        if target_day is None:
            continue
        # Count matching days in range
        sessions = 0
        fac = faculty_map.get(cls.faculty_id)
        if not fac: continue
        fac_reg = fac.created_at.date() if fac.created_at else d_from
        effective_start = max(d_from, fac_reg)
        
        current = effective_start
        while current <= d_to:
            if current.weekday() == target_day:
                sessions += 1
            current += timedelta(days=1)
        room_expected[rm] = room_expected.get(rm, 0) + sessions
        room_class_count[rm] = room_class_count.get(rm, 0) + 1

    # Get actual entry counts per room
    entry_query = (
        db.query(Class.room, func.count(func.distinct(
            func.concat(AttendanceLog.user_id, '-', func.date_trunc('day', AttendanceLog.timestamp))
        )))
        .join(AttendanceLog, AttendanceLog.class_id == Class.id)
        .join(User, Class.faculty_id == User.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        entry_query = _apply_room_filter(entry_query, Class.room, room)
    actual_counts = dict(entry_query.group_by(Class.room).all())

    rows = []
    for i, (rm, expected) in enumerate(sorted(room_expected.items()), 1):
        actual = actual_counts.get(rm, 0)
        # Ratio of actual vs expected sessions
        util_ratio = (actual / max(expected, 1)) * 100
        # Cap at 100 for proper percentage display
        utilization = round(min(util_ratio, 100), 1)
        
        status = "High" if utilization > 75 else ("Moderate" if utilization > 40 else "Low")
        
        # Strip "Room" or prefix for clean numeric display if desired
        display_name = rm.lower().replace("room", "").strip().title() if rm else "Unknown"

        # Get all unique remarks for this room in the date range
        all_remarks = db.query(AttendanceLog.remarks).join(Class, AttendanceLog.class_id == Class.id).join(User, Class.faculty_id == User.id).filter(
            User.department_id == dept_id,
            Class.room == rm,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
            AttendanceLog.remarks != None,
            AttendanceLog.remarks != ""
        ).distinct().all()
        
        remarks_list = [r[0] for r in all_remarks]
        final_remarks = ", ".join(remarks_list) if remarks_list else "—"

        rows.append({
            "id": i,
            "col1": display_name,
            "col2": f"Scheduled: {expected} sessions",
            "status": status,
            "col3": f"{utilization}% Utilization",
            "remarks": final_remarks,
        })
    return rows


def _peak_usage_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Peak usage hours — entry count grouped by hour-of-day per room."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    query = (
        db.query(
            Class.room,
            extract('hour', AttendanceLog.timestamp).label('hour'),
            func.count(AttendanceLog.id),
        )
        .join(AttendanceLog, AttendanceLog.class_id == Class.id)
        .join(User, Class.faculty_id == User.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        query = _apply_room_filter(query, Class.room, room)

    results = query.group_by(Class.room, 'hour').order_by(Class.room, func.count(AttendanceLog.id).desc()).all()

    if not results:
        return [{"id": 1, "col1": "No data", "col2": "—", "status": "No Data", "col3": "0", "remarks": "—"}]

    # Find peak hour per room
    room_peaks = {}
    for rm, hour, count in results:
        rm_name = rm or "Unknown"
        if rm_name not in room_peaks or count > room_peaks[rm_name][1]:
            room_peaks[rm_name] = (int(hour), count)

    rows = []
    row_id = 1
    for rm, hour, count in results:
        rm_name = rm or "Unknown"
        hour_int = int(hour)
        hour_label = f"{hour_int:02d}:00 - {hour_int:02d}:59"
        is_peak = room_peaks.get(rm_name, (None, 0))[0] == hour_int
        rows.append({
            "id": row_id,
            "col1": rm_name,
            "col2": hour_label,
            "status": "PEAK" if is_peak else "Normal",
            "col3": str(count),
            "remarks": "Highest traffic" if is_peak else "—",
        })
        row_id += 1
    return rows


def _overcrowding_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Overcrowding alerts — compares max concurrent entries against room capacity."""
    # Handle dates
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    # Get max entries per room per day
    query = (
        db.query(
            Class.room,
            func.date_trunc('day', AttendanceLog.timestamp).label('day'),
            func.count(AttendanceLog.id).label('entry_count'),
        )
        .join(AttendanceLog, AttendanceLog.class_id == Class.id)
        .join(User, Class.faculty_id == User.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        query = _apply_room_filter(query, Class.room, room)

    daily_counts = query.group_by(Class.room, 'day').all()

    # Get room capacities from devices
    devices = {
        (d.room or "").strip().lower(): d.room_capacity
        for d in db.query(Device).all()
        if d.room
    }

    # Aggregate: max entries per room across all days
    room_max = {}
    room_max_date = {}
    for rm, day, count in daily_counts:
        rm_name = rm or "Unknown"
        if rm_name not in room_max or count > room_max[rm_name]:
            room_max[rm_name] = count
            room_max_date[rm_name] = day

    rows = []
    for i, (rm, max_count) in enumerate(sorted(room_max.items()), 1):
        capacity = 50
        peak_date = room_max_date.get(rm)
        overcrowded = max_count > capacity
        rows.append({
            "id": i,
            "col1": rm,
            "col2": f"Max: {max_count} | Threshold: {capacity}",
            "status": "OVERCROWDED" if overcrowded else "Normal",
            "col3": peak_date.strftime("%Y-%m-%d") if peak_date else "—",
            "remarks": f"Exceeded by {max_count - capacity}" if overcrowded else "Within capacity",
        })

    if not rows:
        rows.append({
            "id": 1, "col1": "No data", "col2": "—",
            "status": "No Data", "col3": "—", "remarks": "No entry records in period",
        })
    return rows


def _faculty_consistency_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Faculty consistency index — attendance trend and regularity per faculty member."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    from models.user import VerificationStatus
    faculty = (
        db.query(User)
        .filter(
            User.department_id == dept_id,
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
            User.verification_status == VerificationStatus.VERIFIED,
        )
        .all()
    )
    if not faculty:
        return []

    faculty_ids = [f.id for f in faculty]

    # Get entry counts per faculty per week (DEDUPLICATED)
    raw_weekly_entries = (
        db.query(
            AttendanceLog.user_id,
            AttendanceLog.class_id,
            AttendanceLog.timestamp,
        )
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .all()
    )
    
    # Deduplicate in-memory to catch room/subject overlaps not caught by class_id alone
    seen_consistency = set()
    weekly_entries_counts = defaultdict(lambda: defaultdict(int))
    for uid, cid, ts in raw_weekly_entries:
        cls = db.query(Class).filter(Class.id == cid).first()
        rm = cls.room.strip().lower() if (cls and cls.room) else "unknown"
        sid = cls.subject_id if cls else None
        dt_val = ts.date()
        key = (uid, rm, sid, dt_val)
        if key in seen_consistency: continue
        seen_consistency.add(key)
        
        week_start = dt_val - timedelta(days=dt_val.weekday())
        weekly_entries_counts[uid][week_start] += 1

    # Get total entries and lates
    entry_counts = dict(
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
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
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id)
        .all()
    )

    # Compute weekly variance per faculty (consistency measure)
    faculty_weeks = defaultdict(list)
    for uid, weeks_dict in weekly_entries_counts.items():
        faculty_weeks[uid] = list(weeks_dict.values())

    rows = []
    for i, fac in enumerate(faculty, 1):
        entries = entry_counts.get(fac.id, 0)
        lates = late_counts.get(fac.id, 0)
        weeks = faculty_weeks.get(fac.id, [])

        if len(weeks) >= 2:
            mean = sum(weeks) / len(weeks)
            variance = sum((w - mean) ** 2 for w in weeks) / len(weeks)
            std_dev = math.sqrt(variance)
            # Lower std_dev = more consistent. Score: 100 - (std_dev * 10)
            consistency_score = max(0, min(100, round(100 - (std_dev * 10), 1)))
        elif entries > 0:
            consistency_score = 75.0  # Default if only 1 week of data
        else:
            consistency_score = 0.0

        if consistency_score >= 85:
            status = "Excellent"
        elif consistency_score >= 70:
            status = "Good"
        elif consistency_score >= 50:
            status = "Average"
        else:
            status = "At Risk" if entries > 0 else "No Data"

        # Get all unique remarks for this faculty member in the date range
        all_remarks = db.query(AttendanceLog.remarks).join(Class, AttendanceLog.class_id == Class.id).filter(
            AttendanceLog.user_id == fac.id,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
            AttendanceLog.remarks != None,
            AttendanceLog.remarks != ""
        )
        if room:
            all_remarks = _apply_room_filter(all_remarks, Class.room, room)
        
        remarks_list = [r[0] for r in all_remarks.distinct().all()]
        final_remarks = ", ".join(remarks_list) if remarks_list else "—"

        rows.append({
            "id": i,
            "col1": fac.full_name,
            "col2": f"Score: {consistency_score}/100",
            "status": status,
            "col3": f"Entries: {entries} | Late: {lates} | Weeks: {len(weeks)}",
            "remarks": final_remarks,
        })
    return rows


def _dept_activity_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Department-wide activity overview."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    from models.user import VerificationStatus
    # Count entries by role
    query = (
        db.query(User.role, func.count(AttendanceLog.id))
        .join(AttendanceLog, AttendanceLog.user_id == User.id)
        .join(Class, AttendanceLog.class_id == Class.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        query = _apply_room_filter(
            query,
            Class.room,
            room,
        )
    results = query.group_by(User.role).all()
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


def _faculty_attendance_rate_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Attendance rate per faculty — scheduled sessions vs actual entries."""
    from models.user import VerificationStatus
    from datetime import datetime as dt
    faculty = (
        db.query(User)
        .filter(
            User.department_id == dept_id,
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
            User.verification_status == VerificationStatus.VERIFIED,
        )
        .all()
    )
    if not faculty:
        return []

    faculty_ids = [f.id for f in faculty]

    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today # Capped at today

    DAY_MAP = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2,
        "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6,
    }

    # Get all classes per faculty
    class_query = db.query(Class).filter(Class.faculty_id.in_(faculty_ids))
    if room:
        class_query = _apply_room_filter(class_query, Class.room, room)
    all_classes = class_query.all()

    # Compute expected sessions per faculty
    faculty_expected = {}
    faculty_class_count = {}
    faculty_map = {f.id: f for f in faculty}

    for cls in all_classes:
        fac = faculty_map.get(cls.faculty_id)
        if not fac:
            continue
        
        # Faculty-specific start clipping (registration date)
        fac_reg_date = fac.created_at.date() if fac.created_at else d_from
        effective_start = max(d_from, fac_reg_date)
        
        target_day = DAY_MAP.get(cls.day_of_week)
        if target_day is None:
            continue
        
        sessions = 0
        current = effective_start
        while current <= d_to:
            if current.weekday() == target_day:
                sessions += 1
            current += timedelta(days=1)
        
        faculty_expected[cls.faculty_id] = faculty_expected.get(cls.faculty_id, 0) + sessions
        faculty_class_count[cls.faculty_id] = faculty_class_count.get(cls.faculty_id, 0) + 1

    # Actual entries per faculty (deduplicated by Date/Class)
    entry_query = (
        db.query(
            AttendanceLog.user_id,
            func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp)))),
        )
        .join(Class, AttendanceLog.class_id == Class.id)
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        entry_query = _apply_room_filter(
            entry_query,
            Class.room,
            room,
        )
    actual_counts = dict(entry_query.group_by(AttendanceLog.user_id).all())

    # Late counts per faculty (deduplicated by Date/Class)
    late_query = (
        db.query(
            AttendanceLog.user_id, 
            func.count(func.distinct(func.concat(AttendanceLog.user_id, '-', AttendanceLog.class_id, '-', func.date(AttendanceLog.timestamp))))
        )
        .join(Class, AttendanceLog.class_id == Class.id)
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        late_query = _apply_room_filter(
            late_query,
            Class.room,
            room,
        )
    late_counts = dict(late_query.group_by(AttendanceLog.user_id).all())

    rows = []
    for i, fac in enumerate(faculty, 1):
        expected = faculty_expected.get(fac.id, 0)
        actual = actual_counts.get(fac.id, 0)
        lates = late_counts.get(fac.id, 0)
        rate = round((actual / max(expected, 1)) * 100, 1)
        classes_count = faculty_class_count.get(fac.id, 0)

        if expected == 0:
            status = "No Schedule"
        elif rate >= 90:
            status = "Excellent"
        elif rate >= 75:
            status = "Good"
        elif rate >= 50:
            status = "Warning"
        else:
            status = "At Risk"

        # Get all unique remarks for this faculty member in the date range
        all_remarks = db.query(AttendanceLog.remarks).join(Class, AttendanceLog.class_id == Class.id).filter(
            AttendanceLog.user_id == fac.id,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
            AttendanceLog.remarks != None,
            AttendanceLog.remarks != ""
        )
        if room:
            all_remarks = _apply_room_filter(all_remarks, Class.room, room)
        
        remarks_list = [r[0] for r in all_remarks.distinct().all()]
        final_remarks = ", ".join(remarks_list) if remarks_list else "—"

        rows.append({
            "id": i,
            "col1": fac.full_name,
            "col2": f"Rate: {rate}% ({actual}/{expected})",
            "status": status,
            "col3": f"On-time: {actual - lates} | Late: {lates} | Classes: {classes_count}",
            "remarks": final_remarks,
        })

    rows.sort(key=lambda r: float(r['col2'].split('%')[0].split(': ')[1]), reverse=False)
    for i, row in enumerate(rows, 1):
        row['id'] = i
    return rows


def _faculty_absence_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Faculty who missed scheduled classes — no ENTRY on scheduled days."""
    from models.user import VerificationStatus
    from datetime import datetime as dt
    faculty = (
        db.query(User)
        .filter(
            User.department_id == dept_id,
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
            User.verification_status == VerificationStatus.VERIFIED,
        )
        .all()
    )
    if not faculty:
        return []

    faculty_map = {f.id: f for f in faculty}
    faculty_ids = list(faculty_map.keys())

    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today # Capped at today

    DAY_MAP = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2,
        "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6,
    }

    # Get faculty classes
    class_query = (
        db.query(Class)
        .options(joinedload(Class.subject))
        .filter(Class.faculty_id.in_(faculty_ids))
    )
    if room:
        class_query = _apply_room_filter(class_query, Class.room, room)
    all_classes = class_query.all()

    # Get all faculty entry dates
    log_query = (
        db.query(
            AttendanceLog.user_id,
            func.date(AttendanceLog.timestamp),
        )
        .join(Class, AttendanceLog.class_id == Class.id)
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        log_query = _apply_room_filter(log_query, Class.room, room)
    
    entry_pairs = set(
        (uid, str(log_day))
        for uid, log_day in log_query.distinct().all()
    )

    # Build scheduled sessions and find absences
    rows = []
    row_id = 1
    for cls in all_classes:
        target_day = DAY_MAP.get(cls.day_of_week)
        if target_day is None:
            continue
        fac = faculty_map.get(cls.faculty_id)
        if not fac:
            continue
        subj = cls.subject
        fac_reg = fac.created_at.date() if fac.created_at else d_from
        effective_start = max(d_from, fac_reg)
        
        current = effective_start
        while current <= d_to:
            if current.weekday() == target_day:
                day_str = current.isoformat()
                # Check if faculty had an entry that day (across any class)
                if (cls.faculty_id, day_str + " 00:00:00") not in entry_pairs and \
                   (cls.faculty_id, day_str) not in entry_pairs:
                    # More precise check: look for date prefix match
                    had_entry = any(
                        p[0] == cls.faculty_id and p[1].startswith(day_str)
                        for p in entry_pairs
                    )
                    if not had_entry:
                        rows.append({
                            "id": row_id,
                            "col1": fac.full_name,
                            "col2": f"{subj.code} - {subj.title}" if subj else "—",
                            "status": "ABSENT",
                            "col3": day_str,
                            "remarks": cls.room or "—",
                        })
                        row_id += 1
            current += timedelta(days=1)

    rows.sort(key=lambda r: r['col3'], reverse=True)
    for i, row in enumerate(rows, 1):
        row['id'] = i

    if not rows:
        rows.append({
            "id": 1,
            "col1": "No absences found",
            "col2": "—",
            "status": "Clear",
            "col3": "—",
            "remarks": "All faculty attended their scheduled sessions",
        })
    return rows


def _faculty_punctuality_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Faculty punctuality index — ranks faculty by average arrival offset from class start."""
    from models.user import VerificationStatus
    from collections import defaultdict
    faculty = (
        db.query(User)
        .filter(
            User.department_id == dept_id,
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
            User.verification_status == VerificationStatus.VERIFIED,
        )
        .all()
    )
    if not faculty:
        return []

    faculty_ids = [f.id for f in faculty]
    faculty_map = {f.id: f for f in faculty}

    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    # Get classes with start times
    class_query = db.query(Class).filter(
        Class.faculty_id.in_(faculty_ids),
        Class.start_time.isnot(None),
    )
    if room:
        class_query = _apply_room_filter(class_query, Class.room, room)
    classes = class_query.all()
    class_map = {c.id: c for c in classes}
    if not class_map:
        return []

    class_ids = list(class_map.keys())

    # Get all ENTRY logs for these classes by faculty
    raw_query = (
        db.query(AttendanceLog.user_id, AttendanceLog.class_id, AttendanceLog.timestamp)
        .join(Class, AttendanceLog.class_id == Class.id)
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
    )
    if room:
        raw_query = _apply_room_filter(raw_query, Class.room, room)
    
    raw_entry_logs = raw_query.all()

    # Robust deduplication
    entry_logs = []
    seen_punct = set()
    for uid, cid, ts in raw_entry_logs:
        cls = class_map.get(cid)
        rm = cls.room.strip().lower() if (cls and cls.room) else "unknown"
        sid = cls.subject_id if cls else None
        dt_val = ts.date()
        key = (uid, rm, sid, dt_val)
        if key in seen_punct: continue
        seen_punct.add(key)
        entry_logs.append((uid, cid, ts))

    # Compute offsets per faculty
    offsets = defaultdict(list)
    for user_id, class_id, ts in entry_logs:
        cls = class_map.get(class_id)
        if not cls or not cls.start_time:
            continue
        class_start_minutes = cls.start_time.hour * 60 + cls.start_time.minute
        arrival_minutes = ts.hour * 60 + ts.minute
        offset = arrival_minutes - class_start_minutes
        offsets[user_id].append(offset)

    rows = []
    for fac in faculty:
        offset_list = offsets.get(fac.id, [])
        entries = len(offset_list)
        if entries > 0:
            avg_offset = sum(offset_list) / entries
            score = max(0, min(100, round(100 - (avg_offset * 2), 1)))
            if avg_offset <= 0:
                status = "On Time"
            elif avg_offset <= 5:
                status = "Good"
            elif avg_offset <= 15:
                status = "Warning"
            else:
                status = "At Risk"
        else:
            avg_offset = 0
            score = 0
            status = "No Data"

        rows.append({
            "id": 0,
            "col1": fac.full_name,
            "col2": f"Avg: {avg_offset:+.1f} min" if entries > 0 else "No entries",
            "status": status,
            "col3": f"Score: {score}/100 | Entries: {entries}",
            "remarks": "—",
        })

    # Get all unique remarks for faculty in this department/date range to populate rows
    # This report is ranked, so we fetch remarks per faculty
    for row in rows:
        fac_name = row['col1']
        fac_obj = next((f for f in faculty if f.full_name == fac_name), None)
        if fac_obj:
            all_remarks = db.query(AttendanceLog.remarks).join(Class, AttendanceLog.class_id == Class.id).filter(
                AttendanceLog.user_id == fac_obj.id,
                AttendanceLog.timestamp >= str(d_from),
                AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
                AttendanceLog.remarks != None,
                AttendanceLog.remarks != ""
            )
            if room:
                all_remarks = _apply_room_filter(all_remarks, Class.room, room)
            
            remarks_list = [r[0] for r in all_remarks.distinct().all()]
            row['remarks'] = ", ".join(remarks_list) if remarks_list else "—"

    rows.sort(key=lambda r: float(r['col3'].split('Score: ')[1].split('/')[0]), reverse=True)
    for i, row in enumerate(rows, 1):
        row['id'] = i
    return rows


def _faculty_teaching_load_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Faculty teaching load — classes, sections, enrolled students, and attendance per faculty."""
    from models.user import VerificationStatus
    faculty = (
        db.query(User)
        .filter(
            User.department_id == dept_id,
            User.role.in_([UserRole.FACULTY, UserRole.HEAD]),
            User.verification_status == VerificationStatus.VERIFIED,
        )
        .all()
    )
    if not faculty:
        return []

    faculty_ids = [f.id for f in faculty]
    faculty_map = {f.id: f for f in faculty}

    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_start = dept.semester_start_date if dept else None
    dept_end = dept.semester_end_date if dept else None
    today = datetime.now(timezone.utc).date()
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
        if dept_start and d_from < dept_start: d_from = dept_start
        if dept_end and d_to > dept_end: d_to = dept_end
        if d_to > today: d_to = today
    except (ValueError, TypeError):
        d_from = dept_start or date(2020, 1, 1)
        d_to = min(today, dept_end) if dept_end else today

    # Get classes per faculty
    class_query = db.query(Class).filter(Class.faculty_id.in_(faculty_ids))
    if room:
        class_query = _apply_room_filter(class_query, Class.room, room)
    all_classes = class_query.all()

    # Count classes and sections per faculty
    from collections import defaultdict
    faculty_classes = defaultdict(int)
    faculty_sections = defaultdict(set)
    faculty_class_ids = defaultdict(list)
    for cls in all_classes:
        faculty_classes[cls.faculty_id] += 1
        if cls.section:
            faculty_sections[cls.faculty_id].add(cls.section)
        faculty_class_ids[cls.faculty_id].append(cls.id)

    # Count enrolled students per faculty (across their classes)
    all_class_ids = [cls.id for cls in all_classes]
    enrollment_counts = {}
    if all_class_ids:
        enrollment_counts = dict(
            db.query(Enrollment.class_id, func.count(Enrollment.id))
            .filter(Enrollment.class_id.in_(all_class_ids))
            .group_by(Enrollment.class_id)
            .all()
        )

    # Count entries per faculty
    entry_counts = dict(
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
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
            AttendanceLog.timestamp >= str(d_from),
            AttendanceLog.timestamp <= str(d_to) + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id)
        .all()
    )

    rows = []
    for i, fac in enumerate(faculty, 1):
        num_classes = faculty_classes.get(fac.id, 0)
        num_sections = len(faculty_sections.get(fac.id, set()))
        # Sum enrolled students across all faculty's classes
        total_students = sum(
            enrollment_counts.get(cid, 0)
            for cid in faculty_class_ids.get(fac.id, [])
        )
        entries = entry_counts.get(fac.id, 0)
        lates = late_counts.get(fac.id, 0)

        if num_classes == 0:
            status = "No Classes"
        else:
            status = "Active"

        rows.append({
            "id": i,
            "col1": fac.full_name,
            "col2": f"Classes: {num_classes} | Sections: {num_sections} | Students: {total_students}",
            "status": status,
            "col3": f"Entries: {entries} | Late: {lates}",
            "remarks": "—",
        })

    rows.sort(key=lambda r: int(r['col2'].split('Classes: ')[1].split(' |')[0]), reverse=True)
    for i, row in enumerate(rows, 1):
        row['id'] = i
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
    "UNRECOGNIZED_LOGS": _unrecognized_logs_report,
    "EARLY_EXITS": _early_exits_report,
    "ATTENDANCE_INCONSISTENCY": _attendance_inconsistency_report,
    "PARTICIPATION_INSIGHT": _participation_insight_report,
    "PUNCTUALITY_INDEX": _punctuality_index_report,
    "BREAK_ABUSE": _break_duration_report,  # Same as break duration with extended flag
}

FACULTY_PERSONAL_REPORTS = {
    "PERSONAL_DAILY": _personal_attendance_report,
    "PERSONAL_WEEKLY": _personal_attendance_report,
    "PERSONAL_MONTHLY": _personal_attendance_report,
    "PERSONAL_SEMESTER": _personal_semester_report,
    "HISTORY_30D": _personal_attendance_report,
    "INSTRUCTOR_DELAY": _instructor_delay_report,
    "PERSONAL_CONSISTENCY": _personal_consistency_report,
}

DEPT_REPORTS = {
    "FACULTY_SUMMARY": _faculty_summary_report,
    "FACULTY_LATE": _faculty_late_report,
    "FACULTY_CONSISTENCY": _faculty_consistency_report,
    "FACULTY_ATTENDANCE_RATE": _faculty_attendance_rate_report,
    "FACULTY_ABSENCE": _faculty_absence_report,
    "FACULTY_PUNCTUALITY": _faculty_punctuality_report,
    "FACULTY_TEACHING_LOAD": _faculty_teaching_load_report,
    "ROOM_OCCUPANCY": _room_occupancy_report,
    "PEAK_USAGE": _peak_usage_report,
    "ROOM_UTILIZATION": _room_utilization_report,
    "OVERCROWDING": _overcrowding_report,
    "DEPT_ACTIVITY": _dept_activity_report,
}

# Ensure standard types are mapped
DEPT_REPORTS["SYSTEM"] = _dept_activity_report
DEPT_REPORTS["DEPT"] = _dept_activity_report


def get_faculty_report(db: Session, user_id: int, report_type: str,
                       class_id: int = None, date_from: str = None, date_to: str = None):
    """Dispatch to the correct faculty report generator."""
    if report_type in FACULTY_CLASS_REPORTS:
        if not class_id:
            return []
        handler = FACULTY_CLASS_REPORTS[report_type]
        rows = handler(db, class_id, date_from or "2020-01-01", date_to or "2099-12-31")
        
        # Filter Break Abuse to only show 'Extended' status
        if report_type == "BREAK_ABUSE":
            rows = [r for r in rows if r.get("status") == "Extended"]
            # Re-index because we filtered the list
            for i, r in enumerate(rows, 1):
                r["id"] = i
                
        return rows
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


def _build_summary_metrics_from_rows(rows, report_code: str, window_from: str, window_to: str):
    total_records = len(rows)
    late_records = 0
    risk_records = 0
    active_records = 0

    for row in rows:
        status = (row.get("status") or "").strip().lower()
        if "late" in status:
            late_records += 1
        if any(token in status for token in ["risk", "warning", "overcrowd", "inconsistent", "no return", "error"]):
            risk_records += 1
        if any(token in status for token in ["present", "good", "excellent", "active", "on time", "peak"]):
            active_records += 1

    safe_total = max(total_records, 1)
    late_rate = round((late_records / safe_total) * 100, 1)
    risk_rate = round((risk_records / safe_total) * 100, 1)

    return [
        {
            "metric_name": "total_records",
            "value": total_records,
            "formula": "count(rows)",
            "numerator": total_records,
            "denominator": total_records,
            "data_window": f"{window_from}..{window_to}",
            "confidence": "HIGH" if total_records >= 20 else ("MEDIUM" if total_records >= 8 else "LOW"),
            "explanation": "Total number of report rows returned for the selected filters.",
        },
        {
            "metric_name": "late_rate",
            "value": late_rate,
            "formula": "late_records / total_records * 100",
            "numerator": late_records,
            "denominator": total_records,
            "data_window": f"{window_from}..{window_to}",
            "confidence": "HIGH" if total_records >= 20 else ("MEDIUM" if total_records >= 8 else "LOW"),
            "explanation": "Share of rows with late-related status labels.",
        },
        {
            "metric_name": "risk_rate",
            "value": risk_rate,
            "formula": "risk_records / total_records * 100",
            "numerator": risk_records,
            "denominator": total_records,
            "data_window": f"{window_from}..{window_to}",
            "confidence": "HIGH" if total_records >= 20 else ("MEDIUM" if total_records >= 8 else "LOW"),
            "explanation": "Share of rows flagged as warning/risk/anomaly statuses.",
        },
        {
            "metric_name": "active_or_good_rate",
            "value": round((active_records / safe_total) * 100, 1),
            "formula": "active_records / total_records * 100",
            "numerator": active_records,
            "denominator": total_records,
            "data_window": f"{window_from}..{window_to}",
            "confidence": "HIGH" if total_records >= 20 else ("MEDIUM" if total_records >= 8 else "LOW"),
            "explanation": "Share of rows with positive status labels.",
        },
    ]


def _build_insights_from_rows(rows, report_code: str):
    total_records = len(rows)
    if total_records == 0:
        return [
            {
                "insight_code": "NO_DATA_IN_WINDOW",
                "title": "No data in selected window",
                "narrative": "No report records were found for the selected filters and date range.",
                "trigger_conditions": ["total_records == 0"],
                "supporting_metrics": ["total_records"],
                "thresholds_used": {"minimum_records": 1},
                "confidence": "HIGH",
                "recommended_action": "Expand date range or adjust class/room filters.",
            }
        ]

    late_records = 0
    risk_records = 0
    for row in rows:
        status = (row.get("status") or "").strip().lower()
        if "late" in status:
            late_records += 1
        if any(token in status for token in ["risk", "warning", "overcrowd", "inconsistent", "no return", "error"]):
            risk_records += 1

    insights = []
    late_rate = (late_records / total_records) * 100
    risk_rate = (risk_records / total_records) * 100
    confidence = "HIGH" if total_records >= 20 else ("MEDIUM" if total_records >= 8 else "LOW")

    if late_rate >= 30:
        insights.append(
            {
                "insight_code": "HIGH_LATE_RATE",
                "title": "High late-pattern frequency",
                "narrative": f"Late-related records are {late_rate:.1f}% of this report output.",
                "trigger_conditions": ["late_rate >= 30"],
                "supporting_metrics": ["late_rate", "total_records"],
                "thresholds_used": {"late_rate_pct": 30},
                "confidence": confidence,
                "recommended_action": "Prioritize punctuality interventions for impacted users/sessions.",
            }
        )

    if risk_rate >= 20:
        insights.append(
            {
                "insight_code": "RISK_STATUS_CLUSTER",
                "title": "Risk/anomaly cluster detected",
                "narrative": f"{risk_rate:.1f}% of records are marked with warning or anomaly statuses.",
                "trigger_conditions": ["risk_rate >= 20"],
                "supporting_metrics": ["risk_rate", "total_records"],
                "thresholds_used": {"risk_rate_pct": 20},
                "confidence": confidence,
                "recommended_action": "Review flagged rows and apply targeted corrective actions.",
            }
        )

    if not insights:
        insights.append(
            {
                "insight_code": "STABLE_REPORT_PATTERN",
                "title": "Stable report pattern",
                "narrative": "No major late-pattern or risk-status cluster was detected in this report window.",
                "trigger_conditions": ["late_rate < 30", "risk_rate < 20"],
                "supporting_metrics": ["late_rate", "risk_rate", "total_records"],
                "thresholds_used": {"late_rate_pct": 30, "risk_rate_pct": 20},
                "confidence": confidence,
                "recommended_action": "Continue monitoring with regular reporting cadence.",
            }
        )

    return insights


def get_faculty_report_envelope(
    db: Session,
    user_id: int,
    report_type: str,
    class_id: int = None,
    date_from: str = None,
    date_to: str = None,
    skip: int = 0,
    limit: int = 100,
):
    started = datetime.now(timezone.utc)
    window_from = date_from or "2020-01-01"
    window_to = date_to or "2099-12-31"

    all_rows = get_faculty_report(
        db,
        user_id,
        report_type,
        class_id=class_id,
        date_from=window_from,
        date_to=window_to,
    )
    total = len(all_rows)
    rows = all_rows[max(skip, 0): max(skip, 0) + min(limit, 200)]

    elapsed_ms = round((datetime.now(timezone.utc) - started).total_seconds() * 1000, 1)

    return {
        "success": True,
        "meta": {
            "report_code": (report_type or "UNKNOWN").upper(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "window": {"from": window_from, "to": window_to},
            "scope": {"module": "FACULTY", "user_id": user_id, "class_id": class_id},
            "pagination": {"skip": max(skip, 0), "limit": min(limit, 200), "total": total},
            "query_metrics": {"execution_ms": elapsed_ms},
        },
        "summary_metrics": _build_summary_metrics_from_rows(all_rows, report_type, window_from, window_to),
        "insights": generate_faculty_role_insights(
            rows=all_rows,
            summary_metrics=_build_summary_metrics_from_rows(all_rows, report_type, window_from, window_to),
            report_code=report_type,
        ),
        "session_count_reference": _build_row_session_reference(all_rows, window_from, window_to),
        "rows": rows,
    }


def get_dept_report_envelope(
    db: Session,
    dept_id: int,
    report_type: str,
    date_from: str = None,
    date_to: str = None,
    room: str = None,
    skip: int = 0,
    limit: int = 100,
):
    started = datetime.now(timezone.utc)
    window_from = date_from or "2020-01-01"
    window_to = date_to or "2099-12-31"

    all_rows = get_dept_report(
        db,
        dept_id,
        report_type,
        date_from=window_from,
        date_to=window_to,
        room=room,
    )
    total = len(all_rows)
    rows = all_rows[max(skip, 0): max(skip, 0) + min(limit, 200)]

    elapsed_ms = round((datetime.now(timezone.utc) - started).total_seconds() * 1000, 1)

    return {
        "success": True,
        "meta": {
            "report_code": (report_type or "UNKNOWN").upper(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "window": {"from": window_from, "to": window_to},
            "scope": {"module": "DEPARTMENT", "dept_id": dept_id, "room": room},
            "pagination": {"skip": max(skip, 0), "limit": min(limit, 200), "total": total},
            "query_metrics": {"execution_ms": elapsed_ms},
        },
        "summary_metrics": _build_summary_metrics_from_rows(all_rows, report_type, window_from, window_to),
        "insights": generate_department_role_insights(
            rows=all_rows,
            summary_metrics=_build_summary_metrics_from_rows(all_rows, report_type, window_from, window_to),
            report_code=report_type,
        ),
        "session_count_reference": _build_row_session_reference(all_rows, window_from, window_to),
        "rows": rows,
    }


# ──────────────────────────────────────────────
# Student Reports (Phase 1 Envelope)
# ──────────────────────────────────────────────

def _build_student_rows(logs):
    rows = []
    seen = set()
    for log in logs:
        # Aggressive deduplication: User + Room + Subject + Date + Action
        cls = log.class_
        raw_rm = cls.room if cls else "Unknown"
        rm = raw_rm.strip().lower() if raw_rm else "unknown"
        subj_id = cls.subject_id if cls else None
        log_dt = log.timestamp.date() if log.timestamp else None
        
        # KEY: Collapse duplicates for SAME room/subject session on SAME day
        log_key = (log.user_id, rm, subj_id, log_dt, log.action)
        if log_key in seen: continue
        seen.add(log_key)
        i = len(rows) + 1
        
        status = log.action.value if log.action else "UNKNOWN"
        if log.action == AttendanceAction.ENTRY and log.is_late:
            status = "LATE"

        subject = cls.subject if cls else None
        faculty = cls.faculty if cls else None
        subject_code = subject.code if subject else None
        subject_title = subject.title if subject else None
        faculty_name = (
            f"{faculty.first_name} {faculty.last_name}".strip()
            if faculty and (faculty.first_name or faculty.last_name)
            else "—"
        )
        timestamp_iso = log.timestamp.isoformat() if log.timestamp else None
        
        rows.append({
            "id": i,
            "col1": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "—",
            "col2": f"{log.class_.room or '—'} | {log.class_.subject.code if (log.class_ and log.class_.subject) else '—'}" if log.class_ else "—",
            "status": status,
            "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
            "remarks": log.remarks or "",
            "timestamp": timestamp_iso,
            "action": log.action.value if log.action else None,
            "is_late": bool(log.is_late) if log.is_late is not None else False,
            "room": cls.room if cls else None,
            "subject_code": subject_code,
            "subject_title": subject_title,
            "faculty_name": faculty_name,
            "class_id": cls.id if cls else None,
        })
    return rows
def _build_student_absent_rows(
    db: Session,
    user_id: int,
    scoped_class_ids,
    date_from: datetime,
    date_to: datetime,
):
    """Build synthetic ABSENT rows for conducted sessions where the student has no ENTRY."""
    if not scoped_class_ids:
        return []

    classes = (
        db.query(Class)
        .options(joinedload(Class.subject), joinedload(Class.faculty))
        .filter(Class.id.in_(scoped_class_ids))
        .all()
    )
    class_map = {cls.id: cls for cls in classes}

    day_map = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6,
    }

    exception_rows = (
        db.query(SessionException.class_id, SessionException.session_date, SessionException.exception_type)
        .filter(
            SessionException.class_id.in_(scoped_class_ids),
            SessionException.session_date >= date_from.date(),
            SessionException.session_date <= date_to.date(),
        )
        .all()
    )
    exception_map = {
        (class_id, str(session_date)): exception_type
        for class_id, session_date, exception_type in exception_rows
    }

    conducted_pairs = set(
        (class_id, str(log_day))
        for class_id, log_day in db.query(
            AttendanceLog.class_id,
            func.date(AttendanceLog.timestamp),
        )
        .filter(
            AttendanceLog.class_id.in_(scoped_class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= date_to,
        )
        .distinct()
        .all()
    )

    student_entry_pairs = set(
        (class_id, str(log_day))
        for class_id, log_day in db.query(
            AttendanceLog.class_id,
            func.date(AttendanceLog.timestamp),
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.class_id.in_(scoped_class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= date_to,
        )
        .distinct()
        .all()
    )

    schedule_aligned_conducted_pairs = set()
    for class_id, log_day in conducted_pairs:
        cls = class_map.get(class_id)
        if not cls:
            continue

        try:
            day_date = datetime.fromisoformat(str(log_day)).date()
        except ValueError:
            continue

        exception_type = exception_map.get((class_id, str(day_date)))
        if exception_type in {ExceptionType.CANCELLED, ExceptionType.HOLIDAY, ExceptionType.ONLINE}:
            continue

        if exception_type == ExceptionType.ONSITE:
            schedule_aligned_conducted_pairs.add((class_id, str(day_date)))
            continue

        day_name = (cls.day_of_week or "").strip().lower()
        target_day = day_map.get(day_name)
        if target_day is None:
            continue

        if day_date.weekday() == target_day:
            schedule_aligned_conducted_pairs.add((class_id, str(day_date)))

    absent_pairs = sorted(schedule_aligned_conducted_pairs - student_entry_pairs, key=lambda item: item[1], reverse=True)
    rows = []

    for idx, (class_id, log_day) in enumerate(absent_pairs, 1):
        cls = class_map.get(class_id)
        subject = cls.subject if cls else None
        faculty = cls.faculty if cls else None

        try:
            day_date = datetime.fromisoformat(log_day).date()
        except ValueError:
            day_date = date_from.date()

        scheduled_time = None
        if cls and cls.start_time:
            if isinstance(cls.start_time, time):
                scheduled_time = cls.start_time
            else:
                try:
                    scheduled_time = datetime.strptime(str(cls.start_time), "%H:%M:%S").time()
                except ValueError:
                    try:
                        scheduled_time = datetime.strptime(str(cls.start_time), "%H:%M").time()
                    except ValueError:
                        scheduled_time = time(12, 0)
        else:
            scheduled_time = time(12, 0)

        absent_dt = datetime.combine(day_date, scheduled_time, tzinfo=date_from.tzinfo)

        rows.append(
            {
                "id": idx,
                "col1": day_date.isoformat(),
                "col2": f"{subject.code} - {subject.title}" if subject else (cls.room if cls else "—"),
                "status": "ABSENT",
                "col3": absent_dt.strftime("%I:%M %p"),
                "remarks": "Absent",
                "timestamp": absent_dt.isoformat(),
                "action": "ABSENT",
                "is_late": False,
                "room": cls.room if cls else None,
                "subject_code": subject.code if subject else None,
                "subject_title": subject.title if subject else None,
                "faculty_name": (
                    f"{faculty.first_name} {faculty.last_name}".strip()
                    if faculty and (faculty.first_name or faculty.last_name)
                    else "—"
                ),
                "class_id": class_id,
            }
        )

    return rows


def get_student_report_envelope(
    db: Session,
    user_id: int,
    report_type: str,
    date_from: datetime,
    date_to: datetime,
    class_id: int = None,
    class_ids: list = None,
    skip: int = 0,
    limit: int = 50,
):
    """
    Returns Phase 1 student report envelope:
    {
      success, meta, summary_metrics, insights, rows
    }
    """
    start_perf = datetime.now(timezone.utc)
    report_code = (report_type or "DAILY_REPORT").upper()
    normalized_class_ids = sorted(set(class_ids)) if class_ids else []
    if normalized_class_ids:
        class_scope = ",".join(str(cid) for cid in normalized_class_ids)
    else:
        class_scope = str(class_id) if class_id else "ALL"

    cache_key = _make_student_report_cache_key(
        user_id=user_id,
        report_code=report_code,
        date_from=date_from,
        date_to=date_to,
        class_scope=class_scope,
        skip=max(skip, 0),
        limit=min(limit, 100),
    )
    cached_envelope = _get_cached_student_report(cache_key)
    if cached_envelope:
        return cached_envelope

    scoped_class_ids = resolve_student_scoped_class_ids(db, user_id, class_id, normalized_class_ids)
    scoped_classes = (
        db.query(Class)
        .filter(Class.id.in_(scoped_class_ids))
        .all()
        if scoped_class_ids
        else []
    )

    base_query = (
        db.query(AttendanceLog)
        .options(
            joinedload(AttendanceLog.class_).joinedload(Class.subject),
            joinedload(AttendanceLog.class_).joinedload(Class.faculty),
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.timestamp >= str(date_from),
            AttendanceLog.timestamp <= date_to,
        )
    )

    if normalized_class_ids:
        base_query = base_query.filter(AttendanceLog.class_id.in_(normalized_class_ids))
    elif class_id:
        base_query = base_query.filter(AttendanceLog.class_id == class_id)

    if report_code == "LATE_REPORT":
        base_query = base_query.filter(
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
        )
    elif report_code == "BREAK_LOG":
        base_query = base_query.filter(
            AttendanceLog.action.in_([AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN])
        )

    page_limit = min(limit, 100)

    if report_code in {"DAILY_REPORT", "ABSENT_LOG"}:
        absent_rows = _build_student_absent_rows(
            db=db,
            user_id=user_id,
            scoped_class_ids=scoped_class_ids,
            date_from=date_from,
            date_to=date_to,
        )

        if report_code == "ABSENT_LOG":
            all_rows = absent_rows
        else:
            all_logs = (
                base_query
                .order_by(AttendanceLog.timestamp.desc())
                .all()
            )
            present_rows = _build_student_rows(all_logs)
            all_rows = present_rows + absent_rows

        all_rows.sort(key=lambda row: row.get("timestamp") or "", reverse=True)
        total_rows = len(all_rows)
        rows = all_rows[max(skip, 0): max(skip, 0) + page_limit]
    else:
        total_rows = base_query.count()
        logs = (
            base_query
            .order_by(AttendanceLog.timestamp.desc())
            .offset(skip)
            .limit(page_limit)
            .all()
        )
        rows = _build_student_rows(logs)

    core_metrics = compute_student_core_metrics(
        db=db,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        class_id=class_id,
        scoped_class_ids=scoped_class_ids,
        classes=scoped_classes,
    )

    # Previous window for trend comparison insights.
    window_seconds = max(int((date_to - date_from).total_seconds()), 1)
    prev_to = date_from - timedelta(seconds=1)
    prev_from = prev_to - timedelta(seconds=window_seconds)

    prev_metrics = {}
    if report_code in {"WEEKLY_SUMMARY", "MONTHLY_TRENDS", "SEM_REPORT", "CONSISTENCY", "ABSENT_LOG"}:
        prev_metrics = compute_student_core_metrics(
            db=db,
            user_id=user_id,
            date_from=prev_from,
            date_to=prev_to,
            class_id=class_id,
            scoped_class_ids=scoped_class_ids,
            classes=scoped_classes,
        )

    summary_metrics = build_student_summary_metrics(
        core_metrics,
        date_from,
        date_to,
        is_all_subject_scope=(class_id is None),
    )
    insights = generate_student_role_insights(
        core_metrics,
        report_code=report_code,
        previous_window_metrics=prev_metrics,
    )
    session_count_reference = compute_student_session_count_reference(
        db=db,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        class_id=class_id,
        scoped_class_ids=scoped_class_ids,
        precomputed_window_counts={
            "attended": int(core_metrics.get("sessions_attended", 0)),
            "conducted": int(core_metrics.get("sessions_conducted", 0)),
            "expected": int(core_metrics.get("expected_sessions", 0)),
        },
        classes=scoped_classes,
    )

    elapsed_ms = round((datetime.now(timezone.utc) - start_perf).total_seconds() * 1000, 1)

    envelope = {
        "success": True,
        "meta": {
            "report_code": report_code,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "window": {
                "from": date_from.date().isoformat(),
                "to": date_to.date().isoformat(),
            },
            "scope": {
                "module": "STUDENT",
                "user_id": user_id,
                "class_id": class_id,
            },
            "pagination": {
                "skip": skip,
                "limit": min(limit, 100),
                "total": total_rows,
            },
            "query_metrics": {
                "execution_ms": elapsed_ms,
                "db_round_trips_estimate": 5,
            },
        },
        "summary_metrics": summary_metrics,
        "insights": insights,
        "session_count_reference": session_count_reference,
        "rows": rows,
    }

    _set_cached_student_report(cache_key, envelope)
    return envelope
