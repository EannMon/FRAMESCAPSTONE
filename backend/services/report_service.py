"""
Report Service — Business logic for generating report data.
Queries attendance_logs, classes, users, enrollments to produce
tabular data in the shape { id, col1, col2, status, col3, remarks }
that the frontend report pages expect.
"""
import logging
from datetime import datetime, date, time, timezone, timedelta
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
    """Room utilization — compares actual attendance against scheduled class sessions."""
    # Get scheduled classes per room
    query = db.query(Class).filter(Class.faculty_id.isnot(None))
    if room:
        query = query.filter(Class.room == room)
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
        .filter(
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        entry_query = entry_query.filter(Class.room == room)
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
        .filter(
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        query = query.filter(Class.room == room)

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
        .filter(
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to + " 23:59:59",
        )
    )
    if room:
        query = query.filter(Class.room == room)

    daily_counts = query.group_by(Class.room, 'day').all()

    # Get room capacities from devices
    devices = {d.room: d.room_capacity for d in db.query(Device).all()}

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
        capacity = devices.get(rm, 50)
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
