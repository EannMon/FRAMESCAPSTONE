"""
Student Router - Student-specific endpoints
Dashboard, schedule, attendance history, live status
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import logging

from db.database import get_db
from core.errors import api_error
from core.auth import get_current_user
from models.user import User, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction
from services.report_service import get_student_report_envelope

logger = logging.getLogger(__name__)
router = APIRouter()


def _verify_ownership(current_user, user_id: int):
    """
    Verify the authenticated user owns the requested resource.
    Raises 401 if not authenticated, 403 if accessing another user's data.
    """
    if current_user is None:
        raise api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="NOT_AUTHENTICATED",
            message="Authentication required",
        )
    if current_user.id != user_id:
        logger.warning(
            "AUTHZ | user=%d attempted to access user=%d data",
            current_user.id, user_id,
        )
        raise api_error(
            status_code=status.HTTP_403_FORBIDDEN,
            code="OWNERSHIP_VIOLATION",
            message="You can only access your own data",
        )

_DAY_ORDER = {
    "monday": 1,
    "tuesday": 2,
    "wednesday": 3,
    "thursday": 4,
    "friday": 5,
    "saturday": 6,
    "sunday": 7,
}


def _parse_report_window(report_type: str, date_from: Optional[str], date_to: Optional[str]):
    """Parse/resolve report date window with sensible defaults per report type."""
    now = datetime.now(timezone.utc)
    report_code = (report_type or "DAILY_REPORT").upper()

    def _parse_iso_day(value: Optional[str], end_of_day: bool = False) -> Optional[datetime]:
        if not value:
            return None
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        if end_of_day:
            return parsed.replace(hour=23, minute=59, second=59, microsecond=999999)
        return parsed.replace(hour=0, minute=0, second=0, microsecond=0)

    parsed_from = _parse_iso_day(date_from)
    parsed_to = _parse_iso_day(date_to, end_of_day=True)

    if parsed_from and parsed_to:
        return parsed_from, parsed_to

    if report_code in {"DAILY_REPORT", "LATE_REPORT", "BREAK_LOG"}:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        return parsed_from or start, parsed_to or end

    if report_code == "WEEKLY_SUMMARY":
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        start = (end - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        return parsed_from or start, parsed_to or end

    if report_code == "MONTHLY_TRENDS":
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        start = (end.replace(day=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return parsed_from or start, parsed_to or end

    if report_code in {"HISTORY_30D", "CONSISTENCY", "ABSENT_LOG"}:
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        start = (end - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        return parsed_from or start, parsed_to or end

    # Semestral / overall default window fallback.
    end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    start = (end - timedelta(days=120)).replace(hour=0, minute=0, second=0, microsecond=0)
    return parsed_from or start, parsed_to or end


# ============================================
# Pydantic Schemas for Student
# ============================================

class ScheduleItem(BaseModel):
    class_id: int
    subject_code: Optional[str] = None
    subject_title: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None
    faculty_name: Optional[str] = None
    section: Optional[str] = None


class AttendanceRecord(BaseModel):
    id: int
    timestamp: datetime
    action: str
    class_name: Optional[str] = None
    room: Optional[str] = None
    verified_by: Optional[str] = None


class LiveStatusResponse(BaseModel):
    """Real-time attendance status for the student dashboard."""
    status: str          # PRESENT, BREAK, EXITED, IDLE
    status_color: str    # green, amber, grey
    status_text: str     # Human-readable status
    room: Optional[str] = None
    subject_code: Optional[str] = None
    subject_title: Optional[str] = None
    last_action: Optional[str] = None
    last_timestamp: Optional[str] = None


class StudentDashboard(BaseModel):
    attendance_rate: str
    enrolled_courses: int
    notifications: List[dict] = []
    recent_attendance: List[dict] = []


class StudentMetricsResponse(BaseModel):
    """Attendance and punctuality metrics with tier classification."""
    attendance_rate: float          # Percentage 0-100
    punctuality_rate: float         # Percentage 0-100
    attendance_tier: str            # Compliant / Acceptable / Warning / Probation
    punctuality_tier: str           # Compliant / Acceptable / Warning / Probation
    attendance_tier_color: str      # Color code for UI
    punctuality_tier_color: str     # Color code for UI
    sessions_attended: int          # Total sessions the student entered
    total_sessions: int             # Total sessions available (class actually happened)
    on_time_arrivals: int           # ENTRY logs where is_late = False
    late_arrivals: int              # ENTRY logs where is_late = True


def _classify_tier(rate: float) -> tuple:
    """
    Classify a percentage rate into a performance tier.
    Returns (tier_name, tier_color).
    
    Tiers:
        ≥95% → Compliant (#2E7D32 green)
        85–94% → Acceptable (#1565C0 blue)
        75–84% → Warning (#F9A825 amber)
        <75% → Probation (#C62828 red)
    """
    if rate >= 95:
        return "Compliant", "#2E7D32"
    elif rate >= 85:
        return "Acceptable", "#1565C0"
    elif rate >= 75:
        return "Warning", "#F9A825"
    else:
        return "Probation", "#C62828"


# ============================================
# Endpoints
# ============================================

@router.get("/live-status/{user_id}", response_model=LiveStatusResponse)
def get_live_status(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _verify_ownership(current_user, user_id)
    """
    Get real-time attendance status for a student.
    Returns current state (PRESENT/BREAK/EXITED/IDLE) with room and class info.
    Used by the student dashboard for the live status indicator.
    
    Single query with joinedload — no N+1.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    # Get today's date range
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Single query: latest attendance log today with class + subject eagerly loaded
    latest_log = (
        db.query(AttendanceLog)
        .options(
            joinedload(AttendanceLog.class_).joinedload(Class.subject)
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.timestamp >= today_start,
        )
        .order_by(AttendanceLog.timestamp.desc())
        .first()
    )

    # No attendance today — IDLE
    if not latest_log:
        return LiveStatusResponse(
            status="IDLE",
            status_color="grey",
            status_text="No activity today",
        )

    action = latest_log.action
    cls = latest_log.class_
    subject = cls.subject if cls else None

    # Map action → live status
    status_map = {
        AttendanceAction.ENTRY: ("PRESENT", "green", "In class"),
        AttendanceAction.BREAK_IN: ("PRESENT", "green", "Returned from break"),
        AttendanceAction.BREAK_OUT: ("BREAK", "amber", "On break"),
        AttendanceAction.EXIT: ("EXITED", "grey", "Exited class"),
    }
    status_info = status_map.get(action, ("IDLE", "grey", "Unknown"))

    return LiveStatusResponse(
        status=status_info[0],
        status_color=status_info[1],
        status_text=status_info[2],
        room=cls.room if cls else None,
        subject_code=subject.code if subject else None,
        subject_title=subject.title if subject else None,
        last_action=action.value,
        last_timestamp=str(latest_log.timestamp),
    )


@router.get("/metrics/{user_id}", response_model=StudentMetricsResponse)
def get_student_metrics(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _verify_ownership(current_user, user_id)
    """
    Calculate Attendance Rate and Punctuality Rate for a student.
    
    Attendance Rate = (sessions attended / total available sessions) * 100
    Punctuality Rate = (on-time arrivals / total attended sessions) * 100
    
    "Sessions attended" = distinct (class_id, date) where the student has an ENTRY log.
    "Total sessions" = distinct (class_id, date) for all enrolled classes where
                       any student logged attendance (class actually took place).
    
    Uses batch queries — no N+1. Max 3 DB round-trips.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    # 1. Get enrolled class IDs (single query)
    enrolled_class_ids = [
        cid for (cid,) in
        db.query(Enrollment.class_id)
        .filter(Enrollment.student_id == user_id)
        .all()
    ]

    if not enrolled_class_ids:
        att_tier, att_color = _classify_tier(0)
        punc_tier, punc_color = _classify_tier(0)
        return StudentMetricsResponse(
            attendance_rate=0.0,
            punctuality_rate=0.0,
            attendance_tier=att_tier,
            punctuality_tier=punc_tier,
            attendance_tier_color=att_color,
            punctuality_tier_color=punc_color,
            sessions_attended=0,
            total_sessions=0,
            on_time_arrivals=0,
            late_arrivals=0,
        )

    # 2. Count total sessions that actually happened for enrolled classes.
    #    A "session" = distinct (class_id, date) with at least one ENTRY log by any student.
    total_sessions = (
        db.query(
            func.count(
                func.distinct(
                    func.concat(
                        AttendanceLog.class_id,
                        '_',
                        func.date(AttendanceLog.timestamp)
                    )
                )
            )
        )
        .filter(
            AttendanceLog.class_id.in_(enrolled_class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
        )
        .scalar()
    ) or 0

    # 3. Count this student's attended sessions + punctuality stats.
    #    Sessions attended = distinct (class_id, date) with ENTRY by THIS student.
    student_entry_logs = (
        db.query(
            AttendanceLog.class_id,
            func.date(AttendanceLog.timestamp).label('log_date'),
            AttendanceLog.is_late,
        )
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.class_id.in_(enrolled_class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
        )
        .all()
    )

    # Deduplicate by (class_id, date) — keep the first entry per session
    seen_sessions = set()
    on_time_count = 0
    late_count = 0
    for class_id, log_date, is_late in student_entry_logs:
        session_key = (class_id, str(log_date))
        if session_key in seen_sessions:
            continue
        seen_sessions.add(session_key)
        if is_late:
            late_count += 1
        else:
            on_time_count += 1

    sessions_attended = len(seen_sessions)

    # Calculate rates
    attendance_rate = (sessions_attended / total_sessions * 100) if total_sessions > 0 else 0.0
    punctuality_rate = (on_time_count / sessions_attended * 100) if sessions_attended > 0 else 0.0

    # Round to 1 decimal
    attendance_rate = round(attendance_rate, 1)
    punctuality_rate = round(punctuality_rate, 1)

    att_tier, att_color = _classify_tier(attendance_rate)
    punc_tier, punc_color = _classify_tier(punctuality_rate)

    logger.info(
        "METRICS | student=%d attendance=%.1f%% (%s) punctuality=%.1f%% (%s)",
        user_id, attendance_rate, att_tier, punctuality_rate, punc_tier,
    )

    return StudentMetricsResponse(
        attendance_rate=attendance_rate,
        punctuality_rate=punctuality_rate,
        attendance_tier=att_tier,
        punctuality_tier=punc_tier,
        attendance_tier_color=att_color,
        punctuality_tier_color=punc_color,
        sessions_attended=sessions_attended,
        total_sessions=total_sessions,
        on_time_arrivals=on_time_count,
        late_arrivals=late_count,
    )


@router.get("/dashboard/{user_id}", response_model=StudentDashboard)
def get_student_dashboard(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _verify_ownership(current_user, user_id)
    """
    Get dashboard statistics for a student.
    Uses eager loading to avoid N+1 queries.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
    # Relaxed verification check: check if value or string matches "Verified"
    is_verified = False
    if hasattr(user.verification_status, 'value'):
        is_verified = user.verification_status.value == "Verified"
    else:
        is_verified = str(user.verification_status) == "Verified"

    if not is_verified:
        logger.warning("DASHBOARD | student=%d not verified (status=%s)", user_id, user.verification_status)
        return StudentDashboard(
            attendance_rate="0%",
            enrolled_courses=0,
            notifications=[{"message": "Account pending admin approval", "icon": "fa-user-lock"}],
            recent_attendance=[]
        )
    
    # Count enrolled courses by unique subject code (same code across multiple class slots counts as one course).
    enrolled_class_ids = [
        cid for (cid,) in
        db.query(Enrollment.class_id)
        .filter(Enrollment.student_id == user_id)
        .all()
    ]

    unique_subject_codes = [
        code for (code,) in
        db.query(func.distinct(Subject.code))
        .select_from(Enrollment)
        .join(Class, Class.id == Enrollment.class_id)
        .join(Subject, Subject.id == Class.subject_id)
        .filter(Enrollment.student_id == user_id)
        .all()
        if code
    ]
    enrolled_count = len(unique_subject_codes)

    # Calculate real attendance rate using session-based logic
    if enrolled_class_ids:
        total_sessions = (
            db.query(
                func.count(
                    func.distinct(
                        func.concat(
                            AttendanceLog.class_id, '_',
                            func.date(AttendanceLog.timestamp)
                        )
                    )
                )
            )
            .filter(
                AttendanceLog.class_id.in_(enrolled_class_ids),
                AttendanceLog.action == AttendanceAction.ENTRY,
            )
            .scalar()
        ) or 0

        sessions_attended = (
            db.query(
                func.count(
                    func.distinct(
                        func.concat(
                            AttendanceLog.class_id, '_',
                            func.date(AttendanceLog.timestamp)
                        )
                    )
                )
            )
            .filter(
                AttendanceLog.user_id == user_id,
                AttendanceLog.class_id.in_(enrolled_class_ids),
                AttendanceLog.action == AttendanceAction.ENTRY,
            )
            .scalar()
        ) or 0

        rate = round(sessions_attended / total_sessions * 100, 1) if total_sessions > 0 else 0.0
        attendance_rate = f"{rate}%"
        logger.info("DASHBOARD | student=%d sessions=%d/%d rate=%s", user_id, sessions_attended, total_sessions, attendance_rate)
    else:
        attendance_rate = "0%"
        logger.info("DASHBOARD | student=%d NOT_ENROLLED", user_id)
    
    # Get recent attendance — eager load Class + Subject in one query (no N+1)
    recent_logs = (
        db.query(AttendanceLog)
        .options(
            joinedload(AttendanceLog.class_).joinedload(Class.subject)
        )
        .filter(AttendanceLog.user_id == user_id)
        .order_by(AttendanceLog.timestamp.desc())
        .limit(3)
        .all()
    )
    
    recent_attendance = []
    for log in recent_logs:
        cls = log.class_
        subject = cls.subject if cls else None
        recent_attendance.append({
            "timestamp": str(log.timestamp),
            "course_name": subject.title if subject else "Unknown",
            "room": cls.room if cls else "Unknown"
        })
    
    return StudentDashboard(
        attendance_rate=attendance_rate,
        enrolled_courses=enrolled_count,
        notifications=[],
        recent_attendance=recent_attendance
    )


@router.get("/schedule/{user_id}", response_model=List[ScheduleItem])
def get_student_schedule(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _verify_ownership(current_user, user_id)
    """
    Get class schedule for a student based on enrollments.
    Uses eager loading to avoid N+1 queries.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise api_error(403, "NOT_VERIFIED", "Account not verified")
    
    # Single query: enrollments → class → subject + faculty via JOINs
    enrollments = (
        db.query(Enrollment)
        .options(
            joinedload(Enrollment.class_).joinedload(Class.subject),
            joinedload(Enrollment.class_).joinedload(Class.faculty),
        )
        .filter(Enrollment.student_id == user_id)
        .all()
    )
    
    schedule = []
    for enrollment in enrollments:
        cls = enrollment.class_
        if cls:
            subject = cls.subject
            faculty = cls.faculty
            schedule.append(ScheduleItem(
                class_id=cls.id,
                subject_code=subject.code if subject else None,
                subject_title=subject.title if subject else None,
                day_of_week=cls.day_of_week,
                start_time=str(cls.start_time) if cls.start_time else None,
                end_time=str(cls.end_time) if cls.end_time else None,
                room=cls.room,
                faculty_name=f"{faculty.first_name} {faculty.last_name}" if faculty else None,
                section=cls.section,
            ))
    
    schedule.sort(
        key=lambda item: (
            _DAY_ORDER.get((item.day_of_week or "").lower(), 99),
            item.start_time or "99:99:99",
            item.subject_code or "",
        )
    )

    return schedule


@router.get("/history/{user_id}", response_model=List[AttendanceRecord])
def get_attendance_history(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _verify_ownership(current_user, user_id)
    """
    Get paginated attendance history for a student.
    Uses eager loading — no N+1 queries.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise api_error(403, "NOT_VERIFIED", "Account not verified")
    
    # Cap limit to prevent abuse (Rule 1.2)
    limit = min(limit, 100)
    
    # Single query with eager loading for class + subject
    logs = (
        db.query(AttendanceLog)
        .options(
            joinedload(AttendanceLog.class_).joinedload(Class.subject)
        )
        .filter(AttendanceLog.user_id == user_id)
        .order_by(AttendanceLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    total = db.query(func.count(AttendanceLog.id)).filter(
        AttendanceLog.user_id == user_id
    ).scalar()
    
    result = []
    for log in logs:
        cls = log.class_
        subject = cls.subject if cls else None
        result.append(AttendanceRecord(
            id=log.id,
            timestamp=log.timestamp,
            action=log.action.value,
            class_name=subject.title if subject else None,
            room=cls.room if cls else None,
            verified_by=log.verified_by.value if log.verified_by else None
        ))
    
    return result


@router.get("/reports/data/{user_id}")
def get_student_report_data(
    user_id: int,
    report_type: str,
    class_id: Optional[int] = None,
    class_ids: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _verify_ownership(current_user, user_id)
    """
    Phase 1 server-driven student report endpoint.
    Returns rows plus summary metrics and explainable insights.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    if user.verification_status != VerificationStatus.VERIFIED:
        raise api_error(403, "NOT_VERIFIED", "Account not verified")

    window_from, window_to = _parse_report_window(report_type, date_from, date_to)

    parsed_class_ids = None
    if class_ids:
        parsed_class_ids = []
        for token in class_ids.split(','):
            token = token.strip()
            if not token:
                continue
            try:
                parsed_class_ids.append(int(token))
            except ValueError:
                continue
        if not parsed_class_ids:
            parsed_class_ids = None

    envelope = get_student_report_envelope(
        db=db,
        user_id=user_id,
        report_type=report_type,
        date_from=window_from,
        date_to=window_to,
        class_id=class_id,
        class_ids=parsed_class_ids,
        skip=max(skip, 0),
        limit=min(limit, 100),
    )

    logger.info(
        "Student report %s for user %d: rows=%d insights=%d",
        report_type,
        user_id,
        len(envelope.get("rows", [])),
        len(envelope.get("insights", [])),
    )
    return envelope
