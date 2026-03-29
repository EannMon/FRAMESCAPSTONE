"""
Report Service — Business logic for generating report data.
Queries attendance_logs, classes, users, enrollments to produce
tabular data in the shape { id, col1, col2, status, col3, remarks }
that the frontend report pages expect.
"""
import logging
import threading
from copy import deepcopy
from datetime import datetime, date, time, timezone, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, and_, extract

from models.attendance_log import AttendanceLog, AttendanceAction
from models.class_ import Class
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
    normalized = room.strip().lower()
    return normalized or None


def _apply_room_filter(query, room_column, room: str):
    normalized = _normalize_room(room)
    if not normalized:
        return query
    return query.filter(func.lower(func.trim(room_column)) == normalized)


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
    total_rows = len(rows)
    attended = 0
    for row in rows:
        status = str(row.get("status", "")).strip().lower()
        if any(token in status for token in ["present", "entered", "entry", "on time", "good", "excellent", "active", "peak", "late"]):
            attended += 1

    report_window = {
        "attended": attended,
        "conducted": total_rows,
        "expected": total_rows,
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
    }


def _make_student_report_cache_key(
    user_id: int,
    report_code: str,
    date_from: datetime,
    date_to: datetime,
    class_id: int,
    skip: int,
    limit: int,
) -> str:
    return "|".join(
        [
            str(user_id),
            report_code,
            date_from.isoformat() if date_from else "",
            date_to.isoformat() if date_to else "",
            str(class_id) if class_id else "ALL",
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
    """Break analysis — pairs BREAK_OUT→BREAK_IN to compute duration per break."""
    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action.in_([AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN]),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .order_by(AttendanceLog.user_id, AttendanceLog.timestamp)
        .all()
    )

    # Group by user and pair consecutive BREAK_OUT → BREAK_IN
    from itertools import groupby
    rows = []
    row_id = 1
    for user_id, user_logs in groupby(logs, key=lambda x: x[0].user_id):
        pending_out = None
        for log, user in user_logs:
            if log.action == AttendanceAction.BREAK_OUT:
                pending_out = (log, user)
            elif log.action == AttendanceAction.BREAK_IN and pending_out:
                out_log, out_user = pending_out
                duration_min = (log.timestamp - out_log.timestamp).total_seconds() / 60
                status = "Extended" if duration_min > 15 else "Normal"
                rows.append({
                    "id": row_id,
                    "col1": user.full_name,
                    "col2": out_log.timestamp.strftime("%Y-%m-%d %I:%M %p"),
                    "status": status,
                    "col3": f"{duration_min:.0f} min",
                    "remarks": f"Out: {out_log.timestamp.strftime('%I:%M %p')} → In: {log.timestamp.strftime('%I:%M %p')}",
                })
                row_id += 1
                pending_out = None
        # Unpaired BREAK_OUT (never returned)
        if pending_out:
            out_log, out_user = pending_out
            rows.append({
                "id": row_id,
                "col1": out_user.full_name,
                "col2": out_log.timestamp.strftime("%Y-%m-%d %I:%M %p"),
                "status": "No Return",
                "col3": "—",
                "remarks": f"Left at {out_log.timestamp.strftime('%I:%M %p')}, did not return",
            })
            row_id += 1
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
    """Class participation consistency — per-student stability score (0-100)."""
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
            "col2": f"Avg: {avg_offset:+.1f} min",
            "status": "On Time" if avg_offset <= 0 else ("Slightly Late" if avg_offset <= 10 else "Late"),
            "col3": f"Score: {score}/100 | Entries: {entries}",
            "remarks": user.tupm_id or "—",
        })

    # Add students with no entries
    present_ids = set(offsets.keys())
    for e, user in enrolled:
        if user.id not in present_ids:
            rows.append({
                "id": 0,
                "col1": user.full_name,
                "col2": "No entries",
                "status": "Absent",
                "col3": "Score: 0/100 | Entries: 0",
                "remarks": user.tupm_id or "—",
            })

    # Sort by score descending (extract from col3)
    rows.sort(key=lambda r: float(r['col3'].split('Score: ')[1].split('/')[0]), reverse=True)
    for i, row in enumerate(rows, 1):
        row['id'] = i
    return rows


def _unrecognized_logs_report(db: Session, class_id: int, date_from: str, date_to: str):
    """Logs with low confidence scores — potential unrecognized individuals."""
    CONFIDENCE_THRESHOLD = 0.5
    logs = (
        db.query(AttendanceLog, User)
        .join(User, AttendanceLog.user_id == User.id)
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.confidence_score < CONFIDENCE_THRESHOLD,
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
    # Get all break events with their dates
    break_events = (
        db.query(
            AttendanceLog.user_id,
            func.date_trunc('day', AttendanceLog.timestamp).label('event_date'),
        )
        .filter(
            AttendanceLog.class_id == class_id,
            AttendanceLog.action.in_([AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN]),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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

    # Get attendance counts per class
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

    # Get total session counts per class (distinct days with any ENTRY)
    session_counts = dict(
        db.query(
            AttendanceLog.class_id,
            func.count(func.distinct(func.date_trunc('day', AttendanceLog.timestamp))),
        )
        .filter(
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
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
        total_sessions = session_counts.get(cls.id, 1)
        attendance_rate = (entries / max(total_sessions, 1)) * 100
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
            "col1": f"{subj.code} - {subj.title}" if subj else "—",
            "col2": f"Score: {score}/100",
            "status": status,
            "col3": f"Attended: {entries}/{total_sessions} | Late: {lates}",
            "remarks": cls.room or "—",
        })
    return rows


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
    entry_query = (
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        entry_query = _apply_room_filter(
            entry_query.join(Class, AttendanceLog.class_id == Class.id),
            Class.room,
            room,
        )
    entry_counts = dict(entry_query.group_by(AttendanceLog.user_id).all())

    late_query = (
        db.query(AttendanceLog.user_id, func.count(AttendanceLog.id))
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.is_late == True,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        late_query = _apply_room_filter(
            late_query.join(Class, AttendanceLog.class_id == Class.id),
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
        query = _apply_room_filter(
            query.join(Class, AttendanceLog.class_id == Class.id),
            Class.room,
            room,
        )
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
        .join(User, Class.faculty_id == User.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
    from datetime import datetime as dt
    try:
        d_from = dt.strptime(date_from, "%Y-%m-%d").date()
        d_to = dt.strptime(date_to, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        d_from = date(2020, 1, 1)
        d_to = date(2099, 12, 31)

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
        current = d_from
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        entry_query = _apply_room_filter(entry_query, Class.room, room)
    actual_counts = dict(entry_query.group_by(Class.room).all())

    rows = []
    for i, (rm, expected) in enumerate(sorted(room_expected.items()), 1):
        actual = actual_counts.get(rm, 0)
        utilization = round((actual / max(expected, 1)) * 100, 1)
        status = "High" if utilization > 75 else ("Moderate" if utilization > 40 else "Low")
        rows.append({
            "id": i,
            "col1": rm,
            "col2": f"Scheduled: {expected} sessions",
            "status": status,
            "col3": f"Actual: {actual} | Util: {utilization}%",
            "remarks": f"{room_class_count.get(rm, 0)} classes in room",
        })
    return rows


def _peak_usage_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Peak usage hours — entry count grouped by hour-of-day per room."""
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
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
        capacity = devices.get((rm or "").strip().lower(), 50)
        peak_date = room_max_date.get(rm)
        overcrowded = max_count > capacity
        rows.append({
            "id": i,
            "col1": rm,
            "col2": f"Max: {max_count} | Capacity: {capacity}",
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

    # Get entry counts per faculty per week
    weekly_entries = (
        db.query(
            AttendanceLog.user_id,
            func.date_trunc('week', AttendanceLog.timestamp).label('week'),
            func.count(AttendanceLog.id),
        )
        .filter(
            AttendanceLog.user_id.in_(faculty_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
        .group_by(AttendanceLog.user_id, 'week')
        .all()
    )

    # Get total entries and lates
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

    # Compute weekly variance per faculty (consistency measure)
    from collections import defaultdict
    import math
    faculty_weeks = defaultdict(list)
    for uid, week, count in weekly_entries:
        faculty_weeks[uid].append(count)

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

        rows.append({
            "id": i,
            "col1": fac.full_name,
            "col2": f"Score: {consistency_score}/100",
            "status": status,
            "col3": f"Entries: {entries} | Late: {lates} | Weeks: {len(weeks)}",
            "remarks": fac.email or "—",
        })
    return rows


def _dept_activity_report(db: Session, dept_id: int, date_from: str, date_to: str, room: str = None):
    """Department-wide activity overview."""
    from models.user import VerificationStatus
    # Count entries by role
    query = (
        db.query(User.role, func.count(AttendanceLog.id))
        .join(AttendanceLog, AttendanceLog.user_id == User.id)
        .filter(
            User.department_id == dept_id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        query = _apply_room_filter(
            query.join(Class, AttendanceLog.class_id == Class.id),
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
    "ROOM_OCCUPANCY": _room_occupancy_report,
    "PEAK_USAGE": _peak_usage_report,
    "ROOM_UTILIZATION": _room_utilization_report,
    "OVERCROWDING": _overcrowding_report,
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
    for idx, log in enumerate(logs, 1):
        cls = log.class_
        subject = cls.subject if cls else None
        faculty = cls.faculty if cls else None

        status = log.action.value if log.action else "UNKNOWN"
        if log.action == AttendanceAction.ENTRY and log.is_late:
            status = "LATE"

        if log.remarks:
            remark_text = log.remarks
        elif log.action == AttendanceAction.ENTRY:
            remark_text = "Late" if log.is_late else "On Time"
        elif log.action == AttendanceAction.BREAK_OUT:
            remark_text = "On Break"
        elif log.action == AttendanceAction.BREAK_IN:
            remark_text = "Returned From Break"
        elif log.action == AttendanceAction.EXIT:
            remark_text = "Session Exit"
        else:
            remark_text = "—"

        rows.append(
            {
                "id": idx,
                "col1": log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "—",
                "col2": f"{subject.code} - {subject.title}" if subject else (cls.room if cls else "—"),
                "status": status,
                "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "—",
                "remarks": remark_text,
                # Raw fields for frontend charting/visualization.
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "action": log.action.value if log.action else None,
                "is_late": bool(log.is_late),
                "room": cls.room if cls else None,
                "subject_code": subject.code if subject else None,
                "subject_title": subject.title if subject else None,
                "faculty_name": (
                    f"{faculty.first_name} {faculty.last_name}".strip()
                    if faculty and (faculty.first_name or faculty.last_name)
                    else "—"
                ),
                "class_id": log.class_id,
            }
        )
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
            AttendanceLog.timestamp >= date_from,
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
            AttendanceLog.timestamp >= date_from,
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
    cache_key = _make_student_report_cache_key(
        user_id=user_id,
        report_code=report_code,
        date_from=date_from,
        date_to=date_to,
        class_id=class_id,
        skip=max(skip, 0),
        limit=min(limit, 100),
    )
    cached_envelope = _get_cached_student_report(cache_key)
    if cached_envelope:
        return cached_envelope

    scoped_class_ids = resolve_student_scoped_class_ids(db, user_id, class_id)
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
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to,
        )
    )

    if class_id:
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
