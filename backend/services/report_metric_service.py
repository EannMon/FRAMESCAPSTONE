"""
Report Metric Service
Computes canonical report metrics used by Student, Faculty, and Department reports.
Phase 1 focuses on student metrics with explainable formulas.
"""

from datetime import date, datetime, time, timedelta, timezone
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from models.attendance_log import AttendanceAction, AttendanceLog
from models.class_ import Class
from models.department import Department
from models.user import User
from models.enrollment import Enrollment
from models.session_exception import ExceptionType, SessionException


def _day_name_to_index(day_name: Optional[str]) -> Optional[int]:
    mapping = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6,
    }
    if not day_name:
        return None
    return mapping.get(day_name.strip().lower())


def _iter_dates(start_date: date, end_date: date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


def _to_date_key(class_id: int, day_value) -> Tuple[int, str]:
    return class_id, str(day_value)


def _compute_expected_sessions(
    classes: List[Class],
    exceptions: List[SessionException],
    start_date: date,
    end_date: date,
) -> int:
    cancelled_or_holiday: Set[Tuple[int, str]] = set()
    for ex in exceptions:
        if ex.exception_type in {ExceptionType.CANCELLED, ExceptionType.HOLIDAY}:
            cancelled_or_holiday.add((ex.class_id, str(ex.session_date)))

    expected = 0
    for cls in classes:
        target_day = _day_name_to_index(cls.day_of_week)
        if target_day is None:
            continue

        for d in _iter_dates(start_date, end_date):
            if d.weekday() != target_day:
                continue
            if (cls.id, str(d)) in cancelled_or_holiday:
                continue
            expected += 1

    return expected


def _pair_breaks_and_compute(user_logs: List[AttendanceLog], limit_minutes: int = 15) -> Tuple[float, int]:
    total_break_minutes = 0.0
    extended_break_count = 0

    # Pair by (class_id, date)
    pending_break_out: Dict[Tuple[Optional[int], str], datetime] = {}

    for log in user_logs:
        if not log.timestamp:
            continue

        key = (log.class_id, str(log.timestamp.date()))
        if log.action == AttendanceAction.BREAK_OUT:
            pending_break_out[key] = log.timestamp
        elif log.action == AttendanceAction.BREAK_IN:
            out_ts = pending_break_out.pop(key, None)
            if out_ts:
                minutes = (log.timestamp - out_ts).total_seconds() / 60.0
                if minutes > 0:
                    total_break_minutes += minutes
                    if minutes > limit_minutes:
                        extended_break_count += 1

    return round(total_break_minutes, 1), extended_break_count


def _resolve_scoped_class_ids(db: Session, user_id: int, class_id: Optional[int]) -> List[int]:
    enrolled_class_ids = [
        cid
        for (cid,) in db.query(Enrollment.class_id).filter(Enrollment.student_id == user_id).all()
    ]
    if class_id:
        return [class_id] if class_id in enrolled_class_ids else []
    return enrolled_class_ids


def resolve_student_scoped_class_ids(db: Session, user_id: int, class_id: Optional[int] = None) -> List[int]:
    """Public wrapper for report service orchestration to avoid duplicate enrollment queries."""
    return _resolve_scoped_class_ids(db, user_id, class_id)


def _compute_counts_for_range(
    db: Session,
    user_id: int,
    scoped_class_ids: List[int],
    range_start: datetime,
    range_end: datetime,
    expected_end_date: Optional[date] = None,
    classes: Optional[List[Class]] = None,
) -> Dict[str, int]:
    if not scoped_class_ids:
        return {"attended": 0, "conducted": 0, "expected": 0}

    class_list = classes if classes is not None else (
        db.query(Class)
        .filter(Class.id.in_(scoped_class_ids))
        .all()
    )

    expected_end = expected_end_date or range_end.date()
    exceptions = (
        db.query(SessionException)
        .filter(
            SessionException.class_id.in_(scoped_class_ids),
            SessionException.session_date >= range_start.date(),
            SessionException.session_date <= expected_end,
        )
        .all()
    )

    expected_sessions = _compute_expected_sessions(
        class_list,
        exceptions,
        range_start.date(),
        expected_end,
    )

    conducted_pairs = set(
        _to_date_key(cid, log_date)
        for cid, log_date in db.query(
            AttendanceLog.class_id,
            func.date(AttendanceLog.timestamp),
        )
        .filter(
            AttendanceLog.class_id.in_(scoped_class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= range_start,
            AttendanceLog.timestamp <= range_end,
        )
        .distinct()
        .all()
    )

    attended_pairs = set(
        _to_date_key(cid, log_date)
        for cid, log_date in db.query(
            AttendanceLog.class_id,
            func.date(AttendanceLog.timestamp),
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.class_id.in_(scoped_class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= range_start,
            AttendanceLog.timestamp <= range_end,
        )
        .distinct()
        .all()
    )

    return {
        "attended": len(attended_pairs),
        "conducted": len(conducted_pairs),
        "expected": expected_sessions,
    }


def compute_student_session_count_reference(
    db: Session,
    user_id: int,
    date_from: datetime,
    date_to: datetime,
    class_id: Optional[int] = None,
    scoped_class_ids: Optional[List[int]] = None,
    precomputed_window_counts: Optional[Dict[str, int]] = None,
    classes: Optional[List[Class]] = None,
) -> Dict:
    resolved_class_ids = scoped_class_ids if scoped_class_ids is not None else _resolve_scoped_class_ids(db, user_id, class_id)
    class_list = classes if classes is not None else (
        db.query(Class)
        .filter(Class.id.in_(resolved_class_ids))
        .all()
    )

    window_counts = precomputed_window_counts or _compute_counts_for_range(
        db=db,
        user_id=user_id,
        scoped_class_ids=resolved_class_ids,
        range_start=date_from,
        range_end=date_to,
        classes=class_list,
    )

    user = (
        db.query(User)
        .options(joinedload(User.department))
        .filter(User.id == user_id)
        .first()
    )

    department = user.department if user else None
    semester_start_date = department.semester_start_date if department and department.semester_start_date else None
    semester_end_date = department.semester_end_date if department and department.semester_end_date else None

    # Fallback: derive semester boundaries from the departments of faculty handling
    # the student's scoped classes when the student department dates are missing.
    if (not semester_start_date or not semester_end_date) and resolved_class_ids:
        faculty_dept_dates = (
            db.query(Department.semester_start_date, Department.semester_end_date)
            .join(User, User.department_id == Department.id)
            .join(Class, Class.faculty_id == User.id)
            .filter(
                Class.id.in_(resolved_class_ids),
                Department.semester_start_date.isnot(None),
                Department.semester_end_date.isnot(None),
            )
            .order_by(Department.id.asc())
            .first()
        )
        if faculty_dept_dates:
            semester_start_date = semester_start_date or faculty_dept_dates[0]
            semester_end_date = semester_end_date or faculty_dept_dates[1]

    if not semester_start_date:
        semester_start_date = date_from.date()
    if not semester_end_date:
        semester_end_date = date_to.date()

    today = datetime.now(timezone.utc).date()
    conducted_cutoff_date = min(semester_end_date, today)

    tz = date_from.tzinfo
    sem_start_dt = datetime.combine(semester_start_date, time.min, tzinfo=tz)
    sem_conducted_end_dt = datetime.combine(conducted_cutoff_date, time.max, tzinfo=tz)

    semester_counts = _compute_counts_for_range(
        db=db,
        user_id=user_id,
        scoped_class_ids=resolved_class_ids,
        range_start=sem_start_dt,
        range_end=sem_conducted_end_dt,
        expected_end_date=semester_end_date,
        classes=class_list,
    )

    return {
        "report_window": {
            "attended": window_counts["attended"],
            "conducted": window_counts["conducted"],
            "expected": window_counts["expected"],
        },
        "whole_semester": {
            "semester_start_date": semester_start_date.isoformat(),
            "semester_end_date": semester_end_date.isoformat(),
            "attended": semester_counts["attended"],
            "conducted": semester_counts["conducted"],
            "expected": semester_counts["expected"],
        },
    }


def compute_student_core_metrics(
    db: Session,
    user_id: int,
    date_from: datetime,
    date_to: datetime,
    class_id: Optional[int] = None,
    scoped_class_ids: Optional[List[int]] = None,
    classes: Optional[List[Class]] = None,
) -> Dict[str, float]:
    """
    Computes student metrics for a date window.

    Returned keys are raw counters and rates to support both summary metrics and insights.
    """
    # 1) Scope classes to enrolled classes (or a specific class).
    resolved_class_ids = scoped_class_ids if scoped_class_ids is not None else _resolve_scoped_class_ids(db, user_id, class_id)

    if not resolved_class_ids:
        return {
            "sessions_attended": 0,
            "sessions_conducted": 0,
            "expected_sessions": 0,
            "total_entries": 0,
            "on_time_entries": 0,
            "late_entries": 0,
            "late_frequency": 0.0,
            "punctuality_rate": 0.0,
            "real_time_attendance_rate": 0.0,
            "semester_progress_attendance_rate": 0.0,
            "early_exits": 0,
            "total_exits": 0,
            "early_exit_rate": 0.0,
            "total_break_minutes": 0.0,
            "average_break_minutes": 0.0,
            "extended_break_count": 0,
            "break_compliance_rate": 100.0,
            "consistency_index": 0.0,
            "data_completeness_score": 0.0,
            "session_count_for_confidence": 0,
        }

    # 2) Fetch class metadata in one query.
    class_list = classes if classes is not None else (
        db.query(Class)
        .filter(Class.id.in_(resolved_class_ids))
        .all()
    )

    # 3) Session exceptions in range.
    exceptions = (
        db.query(SessionException)
        .filter(
            SessionException.class_id.in_(resolved_class_ids),
            SessionException.session_date >= date_from.date(),
            SessionException.session_date <= date_to.date(),
        )
        .all()
    )

    expected_sessions = _compute_expected_sessions(class_list, exceptions, date_from.date(), date_to.date())

    # 4) Conducted sessions: distinct (class_id, date) with at least one ENTRY by anyone.
    conducted_pairs = set(
        _to_date_key(cid, log_date)
        for cid, log_date in db.query(
            AttendanceLog.class_id,
            func.date(AttendanceLog.timestamp),
        )
        .filter(
            AttendanceLog.class_id.in_(resolved_class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to,
        )
        .distinct()
        .all()
    )
    sessions_conducted = len(conducted_pairs)

    # 5) Student ENTRY sessions + late/on-time counts.
    student_entry_rows = db.query(
        AttendanceLog.class_id,
        func.date(AttendanceLog.timestamp),
        AttendanceLog.is_late,
    ).filter(
        AttendanceLog.user_id == user_id,
        AttendanceLog.class_id.in_(resolved_class_ids),
        AttendanceLog.action == AttendanceAction.ENTRY,
        AttendanceLog.timestamp >= date_from,
        AttendanceLog.timestamp <= date_to,
    ).all()

    attended_pairs = set()
    late_entries = 0
    on_time_entries = 0
    for cid, log_date, is_late in student_entry_rows:
        key = _to_date_key(cid, log_date)
        if key in attended_pairs:
            continue
        attended_pairs.add(key)
        if is_late:
            late_entries += 1
        else:
            on_time_entries += 1

    sessions_attended = len(attended_pairs)
    total_entries = sessions_attended

    # 6) User logs for break/exits and completeness checks.
    user_logs = (
        db.query(AttendanceLog)
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.class_id.in_(resolved_class_ids),
            AttendanceLog.timestamp >= date_from,
            AttendanceLog.timestamp <= date_to,
        )
        .order_by(AttendanceLog.timestamp.asc())
        .all()
    )

    total_break_minutes, extended_break_count = _pair_breaks_and_compute(user_logs)

    # Exit metrics.
    total_exits = 0
    early_exits = 0
    class_end_by_id = {cls.id: cls.end_time for cls in class_list}
    early_exit_grace = 10

    for log in user_logs:
        if log.action != AttendanceAction.EXIT or not log.timestamp:
            continue
        total_exits += 1
        class_end = class_end_by_id.get(log.class_id)
        if not class_end:
            continue

        exit_minutes = log.timestamp.hour * 60 + log.timestamp.minute
        class_end_minutes = class_end.hour * 60 + class_end.minute
        if exit_minutes < (class_end_minutes - early_exit_grace):
            early_exits += 1

    # 7) Rates.
    real_time_attendance_rate = (
        round((sessions_attended / sessions_conducted) * 100, 1)
        if sessions_conducted > 0
        else 0.0
    )
    semester_progress_attendance_rate = (
        round((sessions_attended / expected_sessions) * 100, 1)
        if expected_sessions > 0
        else 0.0
    )
    punctuality_rate = (
        round((on_time_entries / total_entries) * 100, 1)
        if total_entries > 0
        else 0.0
    )
    late_frequency = (
        round((late_entries / total_entries) * 100, 1)
        if total_entries > 0
        else 0.0
    )
    early_exit_rate = (
        round((early_exits / total_exits) * 100, 1)
        if total_exits > 0
        else 0.0
    )

    total_break_events = len([l for l in user_logs if l.action in {AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN}])
    paired_breaks = total_break_events // 2 if total_break_events >= 2 else 0
    average_break_minutes = round(total_break_minutes / paired_breaks, 1) if paired_breaks > 0 else 0.0
    break_compliance_rate = (
        round(((paired_breaks - extended_break_count) / paired_breaks) * 100, 1)
        if paired_breaks > 0
        else 100.0
    )

    consistency_index = round((real_time_attendance_rate * 0.7) + (punctuality_rate * 0.3), 1)

    # 8) Data completeness.
    required_fields = 0
    non_null_required = 0
    for log in user_logs:
        # Required for analytics reliability.
        required_fields += 3
        if log.timestamp is not None:
            non_null_required += 1
        if log.action is not None:
            non_null_required += 1
        if log.class_id is not None:
            non_null_required += 1

    data_completeness_score = (
        round((non_null_required / required_fields) * 100, 1)
        if required_fields > 0
        else 0.0
    )

    return {
        "sessions_attended": sessions_attended,
        "sessions_conducted": sessions_conducted,
        "expected_sessions": expected_sessions,
        "total_entries": total_entries,
        "on_time_entries": on_time_entries,
        "late_entries": late_entries,
        "late_frequency": late_frequency,
        "punctuality_rate": punctuality_rate,
        "real_time_attendance_rate": real_time_attendance_rate,
        "semester_progress_attendance_rate": semester_progress_attendance_rate,
        "early_exits": early_exits,
        "total_exits": total_exits,
        "early_exit_rate": early_exit_rate,
        "total_break_minutes": total_break_minutes,
        "average_break_minutes": average_break_minutes,
        "extended_break_count": extended_break_count,
        "break_compliance_rate": break_compliance_rate,
        "consistency_index": consistency_index,
        "data_completeness_score": data_completeness_score,
        "session_count_for_confidence": sessions_conducted,
    }


def compute_confidence_label(session_count: int, completeness_score: float) -> str:
    if session_count >= 20 and completeness_score >= 95:
        return "HIGH"
    if session_count >= 8 and completeness_score >= 85:
        return "MEDIUM"
    return "LOW"


def build_student_summary_metrics(metrics: Dict[str, float], date_from: datetime, date_to: datetime) -> List[Dict]:
    confidence = compute_confidence_label(
        int(metrics.get("session_count_for_confidence", 0)),
        float(metrics.get("data_completeness_score", 0.0)),
    )

    window = f"{date_from.date()}..{date_to.date()}"

    return [
        {
            "metric_name": "real_time_attendance_rate",
            "value": metrics["real_time_attendance_rate"],
            "formula": "sessions_attended / sessions_conducted * 100",
            "numerator": metrics["sessions_attended"],
            "denominator": metrics["sessions_conducted"],
            "data_window": window,
            "confidence": confidence,
            "explanation": "Measures attendance against sessions that actually occurred.",
        },
        {
            "metric_name": "semester_progress_attendance_rate",
            "value": metrics["semester_progress_attendance_rate"],
            "formula": "sessions_attended / expected_sessions * 100",
            "numerator": metrics["sessions_attended"],
            "denominator": metrics["expected_sessions"],
            "data_window": window,
            "confidence": confidence,
            "explanation": "Measures progress against full schedule expectation.",
        },
        {
            "metric_name": "punctuality_rate",
            "value": metrics["punctuality_rate"],
            "formula": "on_time_entries / total_entries * 100",
            "numerator": metrics["on_time_entries"],
            "denominator": metrics["total_entries"],
            "data_window": window,
            "confidence": confidence,
            "explanation": "Share of attended sessions where the student was on time.",
        },
        {
            "metric_name": "consistency_index",
            "value": metrics["consistency_index"],
            "formula": "real_time_attendance_rate * 0.7 + punctuality_rate * 0.3",
            "numerator": 0,
            "denominator": 0,
            "data_window": window,
            "confidence": confidence,
            "explanation": "Weighted behavior stability score combining attendance and punctuality.",
        },
    ]
