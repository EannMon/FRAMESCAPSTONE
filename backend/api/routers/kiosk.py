"""
Kiosk Router - API endpoints for Raspberry Pi attendance kiosks
Provides active class lookup, schedule sync, and attendance logging.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, time as dt_time
import logging

from db.database import get_db
from models.device import Device
from models.class_ import Class
from models.subject import Subject
from models.user import User
from models.attendance_log import AttendanceLog
from models.enrollment import Enrollment

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/kiosk", tags=["Kiosk"])


# ============================================
# Schemas
# ============================================

class ActiveClassResponse(BaseModel):
    """Response for active class query."""
    has_active_class: bool
    active_class: Optional[dict] = None
    device_room: Optional[str] = None
    current_time: str


class ScheduleEntryResponse(BaseModel):
    """A single schedule entry."""
    class_id: int
    subject_code: str
    subject_title: str
    faculty_id: int
    faculty_name: str
    section: str
    day_of_week: str
    start_time: str
    end_time: str
    room: str
    semester: str
    academic_year: str


class ScheduleResponse(BaseModel):
    """Full schedule for a device's room."""
    device_id: int
    room: str
    schedule: List[ScheduleEntryResponse]


class AttendanceLogRequest(BaseModel):
    """Request to log attendance from kiosk."""
    user_id: int
    class_id: int
    device_id: int
    action: str  # ENTRY, EXIT, BREAK_OUT, BREAK_IN
    verified_by: str  # FACE, FACE+GESTURE
    confidence_score: float
    gesture_detected: Optional[str] = None
    timestamp: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceLogResponse(BaseModel):
    """Response after logging attendance."""
    success: bool
    log_id: int
    message: str


class EnrolledStudentsRequest(BaseModel):
    """Request for enrolled students in a class."""
    class_id: int


# ============================================
# Endpoints
# ============================================

@router.get("/active-class", response_model=ActiveClassResponse)
def get_active_class(device_id: int, db: Session = Depends(get_db)):
    """
    Get the currently active class for a device based on room and time.
    
    This is the primary endpoint kiosks use to determine which class
    is in session for attendance logging.
    """
    # Get device info
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if not device.room:
        raise HTTPException(status_code=400, detail="Device has no room assignment")
    
    now = datetime.now()
    current_day = now.strftime("%A")  # e.g., "Monday"
    current_time = now.time()
    
    # Find active class in this room
    active_class = None
    
    # Query classes in this room on current day
    classes = db.query(Class).filter(
        Class.room == device.room,
        Class.day_of_week == current_day
    ).all()
    
    for cls in classes:
        # Parse stored time strings
        try:
            start = cls.start_time
            end = cls.end_time
            
            # Handle time comparison
            if isinstance(start, str):
                start = datetime.strptime(start, "%H:%M:%S").time()
            if isinstance(end, str):
                end = datetime.strptime(end, "%H:%M:%S").time()
            
            if start <= current_time <= end:
                # Get subject and faculty info
                subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
                faculty = db.query(User).filter(User.id == cls.faculty_id).first()
                
                active_class = {
                    "class_id": cls.id,
                    "subject_code": subject.code if subject else "",
                    "subject_title": subject.title if subject else "",
                    "faculty_id": cls.faculty_id,
                    "faculty_name": f"{faculty.first_name} {faculty.last_name}" if faculty else "",
                    "section": cls.section or "",
                    "start_time": start.strftime("%H:%M:%S") if hasattr(start, 'strftime') else str(start),
                    "end_time": end.strftime("%H:%M:%S") if hasattr(end, 'strftime') else str(end),
                    "room": device.room
                }
                break
                
        except Exception as e:
            logger.error(f"Error parsing class times: {e}")
            continue
    
    return ActiveClassResponse(
        has_active_class=active_class is not None,
        active_class=active_class,
        device_room=device.room,
        current_time=now.isoformat()
    )


@router.get("/schedule", response_model=ScheduleResponse)
def get_device_schedule(device_id: int, db: Session = Depends(get_db)):
    """
    Get full weekly schedule for a device's room.
    Used by kiosks to cache schedule for offline operation.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if not device.room:
        raise HTTPException(status_code=400, detail="Device has no room assignment")
    
    # Get all classes in this room
    classes = db.query(Class).filter(Class.room == device.room).all()
    
    schedule_entries = []
    for cls in classes:
        subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
        faculty = db.query(User).filter(User.id == cls.faculty_id).first()
        
        # Format times
        start_time = cls.start_time
        end_time = cls.end_time
        if hasattr(start_time, 'strftime'):
            start_time = start_time.strftime("%H:%M:%S")
        if hasattr(end_time, 'strftime'):
            end_time = end_time.strftime("%H:%M:%S")
        
        schedule_entries.append(ScheduleEntryResponse(
            class_id=cls.id,
            subject_code=subject.code if subject else "",
            subject_title=subject.title if subject else "",
            faculty_id=cls.faculty_id,
            faculty_name=f"{faculty.first_name} {faculty.last_name}" if faculty else "",
            section=cls.section or "",
            day_of_week=cls.day_of_week or "",
            start_time=str(start_time),
            end_time=str(end_time),
            room=device.room,
            semester=cls.semester or "",
            academic_year=cls.academic_year or ""
        ))
    
    return ScheduleResponse(
        device_id=device_id,
        room=device.room,
        schedule=schedule_entries
    )


@router.post("/attendance/log", response_model=AttendanceLogResponse)
def log_attendance(request: AttendanceLogRequest, db: Session = Depends(get_db)):
    """
    Log attendance from kiosk device.
    
    This endpoint receives attendance records from Raspberry Pi kiosks
    after face/gesture verification.
    """
    # Validate user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate class exists
    class_ = db.query(Class).filter(Class.id == request.class_id).first()
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Validate device exists
    device = db.query(Device).filter(Device.id == request.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if student is enrolled in this class (for students)
    if user.role and user.role.value == "STUDENT":
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == request.user_id,
            Enrollment.class_id == request.class_id
        ).first()
        if not enrollment:
            logger.warning(f"Student {request.user_id} not enrolled in class {request.class_id}")
            # Allow logging but add remark
            request.remarks = (request.remarks or "") + " [NOT_ENROLLED]"
    
    # Parse timestamp
    timestamp = datetime.now()
    if request.timestamp:
        try:
            timestamp = datetime.fromisoformat(request.timestamp)
        except:
            pass
    
    # Create attendance log
    try:
        log = AttendanceLog(
            user_id=request.user_id,
            class_id=request.class_id,
            device_id=request.device_id,
            action=request.action,
            verified_by=request.verified_by,
            confidence_score=request.confidence_score,
            gesture_detected=request.gesture_detected,
            timestamp=timestamp,
            remarks=request.remarks
        )
        
        db.add(log)
        db.commit()
        db.refresh(log)
        
        logger.info(f"✅ Attendance logged: user={request.user_id}, class={request.class_id}, action={request.action}")
        
        return AttendanceLogResponse(
            success=True,
            log_id=log.id,
            message=f"Attendance recorded: {request.action}"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to log attendance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log attendance: {str(e)}")


@router.get("/device/{device_id}")
def get_device_info(device_id: int, db: Session = Depends(get_db)):
    """
    Get device information including room assignment.
    Used by kiosk on startup to verify configuration.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "device_id": device.id,
        "device_name": device.device_name,
        "room": device.room,
        "ip_address": device.ip_address,
        "status": device.status.value if device.status else None,
        "last_heartbeat": device.last_heartbeat.isoformat() if device.last_heartbeat else None
    }


@router.post("/device/{device_id}/heartbeat")
def device_heartbeat(device_id: int, db: Session = Depends(get_db)):
    """
    Update device heartbeat timestamp.
    Called periodically by kiosk to indicate it's online.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device.last_heartbeat = datetime.now()
    db.commit()
    
    return {"success": True, "message": "Heartbeat updated"}
