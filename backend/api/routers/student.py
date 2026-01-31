"""
Student Router - Student-specific endpoints
Dashboard, schedule, attendance history
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from db.database import get_db
from models.user import User, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog

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


class StudentDashboard(BaseModel):
    attendance_rate: str
    enrolled_courses: int
    notifications: List[dict] = []
    recent_attendance: List[dict] = []


# ============================================
# Endpoints
# ============================================

@router.get("/dashboard/{user_id}", response_model=StudentDashboard)
def get_student_dashboard(user_id: int, db: Session = Depends(get_db)):
    """
    Get dashboard statistics for a student.
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
    
    # Get recent attendance
    recent_logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == user_id
    ).order_by(AttendanceLog.timestamp.desc()).limit(3).all()
    
    recent_attendance = []
    for log in recent_logs:
        cls = db.query(Class).filter(Class.id == log.class_id).first() if log.class_id else None
        subject = db.query(Subject).filter(Subject.id == cls.subject_id).first() if cls else None
        
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
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")
    
    # Get enrolled classes
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == user_id).all()
    
    schedule = []
    for enrollment in enrollments:
        cls = db.query(Class).filter(Class.id == enrollment.class_id).first()
        if cls:
            subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
            faculty = db.query(User).filter(User.id == cls.faculty_id).first()
            
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
def get_attendance_history(user_id: int, db: Session = Depends(get_db)):
    """
    Get full attendance history for a student.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")
    
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == user_id
    ).order_by(AttendanceLog.timestamp.desc()).all()
    
    result = []
    for log in logs:
        cls = db.query(Class).filter(Class.id == log.class_id).first() if log.class_id else None
        subject = db.query(Subject).filter(Subject.id == cls.subject_id).first() if cls else None
        
        result.append(AttendanceRecord(
            id=log.id,
            timestamp=log.timestamp,
            action=log.action.value,
            class_name=subject.title if subject else None,
            room=cls.room if cls else None,
            verified_by=log.verified_by.value if log.verified_by else None
        ))
    
    return result
