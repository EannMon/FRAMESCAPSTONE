"""
Kiosk Router - API endpoints for Raspberry Pi / Laptop attendance kiosks
Provides active class lookup, schedule sync, attendance logging,
enrolled student verification, and late threshold management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, time as dt_time, timedelta
import logging

from db.database import get_db
from models.device import Device
from models.class_ import Class
from models.subject import Subject
from models.user import User
from models.attendance_log import AttendanceLog, AttendanceAction, VerifiedBy
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
    late_threshold_minutes: int = 15


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
    is_late: bool = False


class UserAttendanceStateResponse(BaseModel):
    """Current attendance state for a user in a class today."""
    user_id: int
    class_id: int
    has_entered: bool = False
    is_on_break: bool = False
    has_exited: bool = False
    last_action: Optional[str] = None
    allowed_actions: List[str] = []


class EnrolledUserInfo(BaseModel):
    """Info about a user enrolled in a class."""
    user_id: int
    name: str
    email: str
    tupm_id: str
    role: str
    section: Optional[str] = None


class ClassEnrolledResponse(BaseModel):
    """All enrolled users for a class (students + faculty)."""
    class_id: int
    subject_code: str
    faculty: Optional[EnrolledUserInfo] = None
    students: List[EnrolledUserInfo] = []
    total_enrolled: int = 0


class LateThresholdUpdate(BaseModel):
    """Request to update late threshold for a class."""
    late_threshold_minutes: int


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
    
    # Find active class in this room — single query with eager loading
    active_class = None

    # Query classes in this room on current day, eagerly load subject + faculty
    classes = (
        db.query(Class)
        .options(joinedload(Class.subject), joinedload(Class.faculty))
        .filter(
            Class.room == device.room,
            Class.day_of_week == current_day
        )
        .all()
    )

    for cls in classes:
        try:
            start = cls.start_time
            end = cls.end_time

            if isinstance(start, str):
                start = datetime.strptime(start, "%H:%M:%S").time()
            if isinstance(end, str):
                end = datetime.strptime(end, "%H:%M:%S").time()

            if start <= current_time <= end:
                # Access eagerly-loaded relationships — no extra queries
                subject = cls.subject
                faculty = cls.faculty

                active_class = {
                    "class_id": cls.id,
                    "subject_code": subject.code if subject else "",
                    "subject_title": subject.title if subject else "",
                    "faculty_id": cls.faculty_id,
                    "faculty_name": f"{faculty.first_name} {faculty.last_name}" if faculty else "",
                    "section": cls.section or "",
                    "start_time": start.strftime("%H:%M:%S") if hasattr(start, 'strftime') else str(start),
                    "end_time": end.strftime("%H:%M:%S") if hasattr(end, 'strftime') else str(end),
                    "room": device.room,
                    "late_threshold_minutes": cls.late_threshold_minutes or 15
                }
                break

        except Exception as e:
            logger.error("Error parsing class times: %s", e)
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
    
    # Get all classes in this room — single query with eager loading
    classes = (
        db.query(Class)
        .options(joinedload(Class.subject), joinedload(Class.faculty))
        .filter(Class.room == device.room)
        .all()
    )

    schedule_entries = []
    for cls in classes:
        # Access eagerly-loaded relationships — no extra queries
        subject = cls.subject
        faculty = cls.faculty
        
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
            academic_year=cls.academic_year or "",
            late_threshold_minutes=cls.late_threshold_minutes or 15
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
    Validates user, class, enrollment, and determines if late.
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

    # Determine if user belongs to this class (faculty or enrolled student)
    is_faculty = (class_.faculty_id == request.user_id)
    is_enrolled = False

    if not is_faculty:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == request.user_id,
            Enrollment.class_id == request.class_id
        ).first()
        is_enrolled = enrollment is not None

    if not is_faculty and not is_enrolled:
        # Recognized but not part of this class — still log with remark
        request.remarks = (request.remarks or "") + " [NOT_IN_CLASS]"
        logger.warning(
            f"⚠️ User {request.user_id} ({user.first_name} {user.last_name}) "
            f"recognized but NOT enrolled in class {request.class_id}"
        )

        # --- Server-side NOT_IN_CLASS duplicate guard ---
        # Only log ONE NOT_IN_CLASS per user per class per day
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        existing_nic = db.query(AttendanceLog).filter(
            AttendanceLog.user_id == request.user_id,
            AttendanceLog.class_id == request.class_id,
            AttendanceLog.remarks.like("%[NOT_IN_CLASS]%"),
            AttendanceLog.timestamp >= today_start,
            AttendanceLog.timestamp < today_end
        ).first()

        if existing_nic:
            logger.info(
                f"⏭️ Duplicate NOT_IN_CLASS skipped: user={request.user_id}, "
                f"class={request.class_id}"
            )
            return AttendanceLogResponse(
                success=True,
                log_id=existing_nic.id,
                message="NOT_IN_CLASS already logged today — duplicate skipped",
                is_late=False
            )

    # Parse timestamp
    timestamp = datetime.now()
    if request.timestamp:
        try:
            timestamp = datetime.fromisoformat(request.timestamp)
        except Exception:
            pass

    # --- Server-side duplicate ENTRY guard ---
    # Uses same walk-through logic as the state machine for consistency.
    # Block ENTRY only if user is currently in an active session (entered, not exited).
    is_not_in_class = not is_faculty and not is_enrolled
    if request.action == "ENTRY" and not is_not_in_class:
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        today_logs = db.query(AttendanceLog).filter(
            AttendanceLog.user_id == request.user_id,
            AttendanceLog.class_id == request.class_id,
            AttendanceLog.timestamp >= today_start,
            AttendanceLog.timestamp < today_end
        ).order_by(AttendanceLog.timestamp.asc()).all()

        # Walk logs to determine if user is in an active session
        in_active_session = False
        for log in today_logs:
            av = log.action.value if isinstance(log.action, AttendanceAction) else log.action
            if av == "ENTRY":
                in_active_session = True
            elif av == "EXIT":
                in_active_session = False

        if in_active_session:
            last_log = today_logs[-1] if today_logs else None
            last_action_val = last_log.action.value if last_log and isinstance(last_log.action, AttendanceAction) else (last_log.action if last_log else "ENTRY")
            logger.info(
                f"⏭️ Duplicate ENTRY skipped: user={request.user_id}, "
                f"class={request.class_id} (last action: {last_action_val})"
            )
            return AttendanceLogResponse(
                success=True,
                log_id=last_log.id if last_log else 0,
                message=f"Already in session (last action: {last_action_val}) — ENTRY skipped",
                is_late=last_log.is_late if last_log else False
            )

    # Determine if late (only for ENTRY action)
    is_late = False
    if request.action == "ENTRY" and class_.start_time:
        late_threshold = class_.late_threshold_minutes or 15
        start = class_.start_time
        if isinstance(start, str):
            start = datetime.strptime(start, "%H:%M:%S").time()

        class_start_dt = datetime.combine(timestamp.date(), start)
        late_cutoff = class_start_dt + timedelta(minutes=late_threshold)

        if timestamp > late_cutoff:
            is_late = True
            minutes_late = int((timestamp - class_start_dt).total_seconds() / 60)
            request.remarks = (request.remarks or "") + f" [LATE by {minutes_late} min]"

    # Create attendance log
    # Convert raw strings to proper enum members (kiosk sends .value strings)
    try:
        action_enum = AttendanceAction(request.action)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid action: {request.action}")

    verified_enum = None
    if request.verified_by:
        try:
            # Try by value first (e.g. "FACE+GESTURE")
            verified_enum = VerifiedBy(request.verified_by)
        except ValueError:
            # Fall back to name lookup (e.g. "FACE_GESTURE")
            try:
                verified_enum = VerifiedBy[request.verified_by]
            except KeyError:
                raise HTTPException(status_code=400, detail=f"Invalid verified_by: {request.verified_by}")

    try:
        log = AttendanceLog(
            user_id=request.user_id,
            class_id=request.class_id,
            device_id=request.device_id,
            action=action_enum,
            verified_by=verified_enum,
            confidence_score=request.confidence_score,
            gesture_detected=request.gesture_detected,
            is_late=is_late,
            timestamp=timestamp,
            remarks=request.remarks
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        action_label = request.action
        late_label = " (LATE)" if is_late else ""
        logger.info(
            f"✅ Attendance logged: user={request.user_id}, "
            f"class={request.class_id}, action={action_label}{late_label}"
        )

        return AttendanceLogResponse(
            success=True,
            log_id=log.id,
            message=f"Attendance recorded: {action_label}{late_label}",
            is_late=is_late
        )

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to log attendance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log attendance: {str(e)}")


@router.get("/class/{class_id}/enrolled", response_model=ClassEnrolledResponse)
def get_class_enrolled_users(class_id: int, db: Session = Depends(get_db)):
    """
    Get all enrolled students and the faculty for a class.
    Used by kiosk to verify if a recognized face belongs to this class.
    """
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()

    # Get faculty
    faculty_user = db.query(User).filter(User.id == cls.faculty_id).first()
    faculty_info = None
    if faculty_user:
        faculty_info = EnrolledUserInfo(
            user_id=faculty_user.id,
            name=f"{faculty_user.first_name} {faculty_user.last_name}",
            email=faculty_user.email,
            tupm_id=faculty_user.tupm_id or "",
            role=faculty_user.role.value if faculty_user.role else "FACULTY",
            section=None
        )

    # Get enrolled students — single JOIN query instead of N+1
    enrolled_students = (
        db.query(User)
        .join(Enrollment, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == class_id)
        .all()
    )
    students = []
    for student in enrolled_students:
        students.append(EnrolledUserInfo(
            user_id=student.id,
            name=f"{student.first_name} {student.last_name}",
            email=student.email,
            tupm_id=student.tupm_id or "",
            role=student.role.value if student.role else "STUDENT",
            section=student.section
        ))

    return ClassEnrolledResponse(
        class_id=class_id,
        subject_code=subject.code if subject else "",
        faculty=faculty_info,
        students=students,
        total_enrolled=len(students)
    )


@router.get("/attendance-state", response_model=UserAttendanceStateResponse)
def get_user_attendance_state(user_id: int, class_id: int, db: Session = Depends(get_db)):
    """
    Get the current attendance state for a user in a class today.
    Determines what actions are allowed next:
    - Not entered yet → ENTRY (face only)
    - Entered → BREAK_OUT or EXIT (gesture required)
    - On break → BREAK_IN (gesture required)
    - Exited → no more actions
    """
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == user_id,
        AttendanceLog.class_id == class_id,
        AttendanceLog.timestamp >= today_start,
        AttendanceLog.timestamp < today_end
    ).order_by(AttendanceLog.timestamp.asc()).all()

    has_entered = False
    is_on_break = False
    has_exited = False
    last_action = None

    # Walk through logs chronologically to get the TRUE current state.
    # After EXIT, a new ENTRY resets the cycle.
    # BREAK_OUT/BREAK_IN are ONLY valid when user has entered and NOT exited.
    for log in logs:
        action_val = log.action.value if isinstance(log.action, AttendanceAction) else log.action
        if action_val == "ENTRY":
            has_entered = True
            has_exited = False   # Reset exit — user re-entered
            is_on_break = False  # Reset break state on new entry
        elif action_val == "EXIT":
            has_exited = True
            is_on_break = False
        elif action_val == "BREAK_OUT" and has_entered and not has_exited:
            # Only count break if user is in an active session
            is_on_break = True
        elif action_val == "BREAK_IN" and has_entered and not has_exited:
            is_on_break = False

    if logs:
        last_action = logs[-1].action
        if isinstance(last_action, AttendanceAction):
            last_action = last_action.value

    # State machine: determine allowed actions
    # After EXIT, user can ENTRY again (new cycle within same session)
    allowed_actions = []
    if not has_entered or has_exited:
        allowed_actions.append("ENTRY")
    elif has_exited:
        pass  # Should not reach here due to above condition
    elif is_on_break:
        allowed_actions.append("BREAK_IN")
    else:
        allowed_actions.append("BREAK_OUT")
        allowed_actions.append("EXIT")

    return UserAttendanceStateResponse(
        user_id=user_id,
        class_id=class_id,
        has_entered=has_entered,
        is_on_break=is_on_break,
        has_exited=has_exited,
        last_action=last_action,
        allowed_actions=allowed_actions
    )


@router.put("/class/{class_id}/late-threshold")
def update_late_threshold(class_id: int, data: LateThresholdUpdate, db: Session = Depends(get_db)):
    """
    Update the late threshold for a class (faculty/head only).
    Called from the faculty/head dashboard.
    """
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    if data.late_threshold_minutes < 1 or data.late_threshold_minutes > 120:
        raise HTTPException(status_code=400, detail="Late threshold must be between 1 and 120 minutes")

    cls.late_threshold_minutes = data.late_threshold_minutes
    db.commit()

    logger.info(f"✅ Late threshold updated: class={class_id}, threshold={data.late_threshold_minutes} min")

    return {
        "success": True,
        "class_id": class_id,
        "late_threshold_minutes": data.late_threshold_minutes,
        "message": f"Late threshold set to {data.late_threshold_minutes} minutes"
    }


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
