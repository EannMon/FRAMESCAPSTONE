"""
Student Router - Student-specific endpoints
Dashboard, schedule, attendance history, live status
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging

from db.database import get_db
from models.user import User, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction

logger = logging.getLogger(__name__)
router = APIRouter()


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


# ============================================
# Endpoints
# ============================================

@router.get("/live-status/{user_id}", response_model=LiveStatusResponse)
def get_live_status(user_id: int, db: Session = Depends(get_db)):
    """
    Get real-time attendance status for a student.
    Returns current state (PRESENT/BREAK/EXITED/IDLE) with room and class info.
    Used by the student dashboard for the live status indicator.
    
    Single query with joinedload — no N+1.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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


@router.get("/dashboard/{user_id}", response_model=StudentDashboard)
def get_student_dashboard(user_id: int, db: Session = Depends(get_db)):
    """
    Get dashboard statistics for a student.
    Uses eager loading to avoid N+1 queries.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        return StudentDashboard(
            attendance_rate="N/A",
            enrolled_courses=0,
            notifications=[{"message": "Account pending admin approval", "icon": "fa-user-lock"}],
            recent_attendance=[]
        )
    
    # Count enrolled courses
    enrolled_count = db.query(Enrollment).filter(Enrollment.student_id == user_id).count()
    
    # Count attendance records
    total_attendance = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == user_id
    ).count()
    
    # Calculate attendance rate (simplified)
    attendance_rate = f"{min(total_attendance * 10, 100)}%"
    
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
def get_student_schedule(user_id: int, db: Session = Depends(get_db)):
    """
    Get class schedule for a student based on enrollments.
    Uses eager loading to avoid N+1 queries.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")
    
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
                faculty_name=f"{faculty.first_name} {faculty.last_name}" if faculty else None
            ))
    
    return schedule


@router.get("/history/{user_id}", response_model=List[AttendanceRecord])
def get_attendance_history(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Get paginated attendance history for a student.
    Uses eager loading — no N+1 queries.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")
    
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
