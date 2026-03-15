"""
Kiosk Router - API endpoints for Raspberry Pi / Laptop attendance kiosks
Provides active class lookup, schedule sync, attendance logging,
enrolled student verification, and late threshold management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
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
from core.errors import api_error
from core.limiter import limiter

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
    is_early_entry: bool = False  # True if within early entry window but before official start


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
    email: Optional[str] = None
    tupm_id: Optional[str] = ""
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
def get_active_class(device_id: int, db: Session = Depends(get_db), x_device_key: Optional[str] = Header(None)):
    """
    Get the currently active class for a device based on room and time.
    
    This is the primary endpoint kiosks use to determine which class
    is in session for attendance logging.
    """
    # Get device info
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")
    
    if not device.room:
        raise api_error(400, "NO_ROOM_ASSIGNED", "Device has no room assignment")
    
    # TODO: Add device authentication when api_key column is added to Device model
    # if not device.api_key or device.api_key != x_device_key:
    #     raise api_error(401, "UNAUTHORIZED_DEVICE", "Invalid or missing X-Device-Key")
    
    now = datetime.now()
    current_day = now.strftime("%A")  # e.g., "Monday"
    current_time = now.time()
    
    # Find active class in this room — single query with eager loading
    active_class = None

    # Query classes in this room on current day, eagerly load subject + faculty
    normalized_room = device.room.strip().lower()

    classes = (
        db.query(Class)
        .options(joinedload(Class.subject), joinedload(Class.faculty))
        .filter(
            func.lower(func.trim(Class.room)) == normalized_room,
            Class.day_of_week == current_day
        )
        .all()
    )

    # Early entry window: allow recognition N minutes before class starts
    early_entry_minutes = 10
    is_early_entry = False

    for cls in classes:
        try:
            start = cls.start_time
            end = cls.end_time

            if isinstance(start, str):
                start = datetime.strptime(start, "%H:%M:%S").time()
            if isinstance(end, str):
                end = datetime.strptime(end, "%H:%M:%S").time()

            # Compute early start time (N minutes before official start)
            start_dt = datetime.combine(now.date(), start)
            early_start = (start_dt - timedelta(minutes=early_entry_minutes)).time()

            if early_start <= current_time <= end:
                # Access eagerly-loaded relationships — no extra queries
                subject = cls.subject
                faculty = cls.faculty

                # Flag whether we're in the early window (before official start)
                is_early_entry = current_time < start

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
        current_time=now.isoformat(),
        is_early_entry=is_early_entry
    )


@router.get("/schedule", response_model=ScheduleResponse)
def get_device_schedule(device_id: int, db: Session = Depends(get_db), x_device_key: Optional[str] = Header(None)):
    """
    Get full weekly schedule for a device's room.
    Used by kiosks to cache schedule for offline operation.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")
    
    if not device.room:
        raise api_error(400, "NO_ROOM_ASSIGNED", "Device has no room assignment")
    
    # TODO: Add device authentication when api_key column is added to Device model
    # if not device.api_key or device.api_key != x_device_key:
    #     raise api_error(401, "UNAUTHORIZED_DEVICE", "Invalid or missing X-Device-Key")
    
    # Get all classes in this room — single query with eager loading
    normalized_room = device.room.strip().lower()

    classes = (
        db.query(Class)
        .options(joinedload(Class.subject), joinedload(Class.faculty))
        .filter(func.lower(func.trim(Class.room)) == normalized_room)
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
@limiter.limit("6/minute")
def log_attendance(request: Request, body: AttendanceLogRequest, db: Session = Depends(get_db), x_device_key: Optional[str] = Header(None)):
    """
    Log attendance from kiosk device.
    Validates user, class, enrollment, and determines if late.
    """
    # Validate user exists
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    # Validate class exists
    class_ = db.query(Class).filter(Class.id == body.class_id).first()
    if not class_:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")

    # Validate device exists
    device = db.query(Device).filter(Device.id == body.device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")

    # TODO: Add device authentication when api_key column is added to Device model
    # if not device.api_key or device.api_key != x_device_key:
    #     raise api_error(401, "UNAUTHORIZED_DEVICE", "Invalid or missing X-Device-Key")

    # Determine if user belongs to this class (faculty or enrolled student)
    is_faculty = (class_.faculty_id == body.user_id)
    is_enrolled = False

    if not is_faculty:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == body.user_id,
            Enrollment.class_id == body.class_id
        ).first()
        is_enrolled = enrollment is not None

    if not is_faculty and not is_enrolled:
        # Recognized but not part of this class — still log with remark
        body.remarks = (body.remarks or "") + " [NOT_IN_CLASS]"
        logger.warning(
            "ATTENDANCE | user=%d (%s %s) recognized but NOT enrolled in class=%d",
            body.user_id, user.first_name, user.last_name, body.class_id
        )

        # --- Server-side NOT_IN_CLASS duplicate guard ---
        # Only log ONE NOT_IN_CLASS per user per class per day
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        existing_nic = db.query(AttendanceLog).filter(
            AttendanceLog.user_id == body.user_id,
            AttendanceLog.class_id == body.class_id,
            AttendanceLog.remarks.like("%[NOT_IN_CLASS]%"),
            AttendanceLog.timestamp >= today_start,
            AttendanceLog.timestamp < today_end
        ).first()

        if existing_nic:
            logger.info(
                "ATTENDANCE | duplicate NOT_IN_CLASS skipped: user=%d class=%d",
                body.user_id, body.class_id
            )
            return AttendanceLogResponse(
                success=True,
                log_id=existing_nic.id,
                message="NOT_IN_CLASS already logged today — duplicate skipped",
                is_late=False
            )

    if body.timestamp is not None:
        try:
            timestamp = datetime.fromisoformat(body.timestamp)
        except Exception:
            pass

    # --- Server-side duplicate ENTRY guard ---
    # Uses same walk-through logic as the state machine for consistency.
    # Block ENTRY only if user is currently in an active session (entered, not exited).
    is_not_in_class = not is_faculty and not is_enrolled
    if body.action == "ENTRY" and not is_not_in_class:
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        today_logs = db.query(AttendanceLog).filter(
            AttendanceLog.user_id == body.user_id,
            AttendanceLog.class_id == body.class_id,
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
                "ATTENDANCE | duplicate ENTRY skipped: user=%d class=%d last_action=%s",
                body.user_id, body.class_id, last_action_val
            )
            return AttendanceLogResponse(
                success=True,
                log_id=last_log.id if last_log else 0,
                message=f"Already in session (last action: {last_action_val}) — ENTRY skipped",
                is_late=last_log.is_late if last_log else False
            )

    # Determine if late (only for ENTRY action)
    is_late = False
    if body.action == "ENTRY" and class_.start_time:
        late_threshold = class_.late_threshold_minutes or 15
        start = class_.start_time
        if isinstance(start, str):
            start = datetime.strptime(start, "%H:%M:%S").time()

        class_start_dt = datetime.combine(timestamp.date(), start)
        late_cutoff = class_start_dt + timedelta(minutes=late_threshold)

        if timestamp > late_cutoff:
            is_late = True
            minutes_late = int((timestamp - class_start_dt).total_seconds() / 60)
            body.remarks = (body.remarks or "") + f" [LATE by {minutes_late} min]"

    # Create attendance log
    # Convert raw strings to proper enum members (kiosk sends .value strings)
    try:
        action_enum = AttendanceAction(body.action)
    except ValueError:
        raise api_error(400, "INVALID_ACTION", f"Invalid action: {body.action}")

    verified_enum = None
    if body.verified_by:
        try:
            # Try by value first (e.g. "FACE+GESTURE")
            verified_enum = VerifiedBy(body.verified_by)
        except ValueError:
            # Fall back to name lookup (e.g. "FACE_GESTURE")
            try:
                verified_enum = VerifiedBy[body.verified_by]
            except KeyError:
                raise api_error(400, "INVALID_VERIFICATION", f"Invalid verified_by: {body.verified_by}")

    try:
        log = AttendanceLog(
            user_id=body.user_id,
            class_id=body.class_id,
            device_id=body.device_id,
            action=action_enum,
            verified_by=verified_enum,
            confidence_score=body.confidence_score,
            gesture_detected=body.gesture_detected,
            is_late=is_late,
            timestamp=timestamp,
            remarks=body.remarks
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        action_label = body.action
        late_label = " (LATE)" if is_late else ""
        logger.info(
            "ATTENDANCE | logged: user=%d class=%d action=%s%s",
            body.user_id, body.class_id, action_label, late_label
        )

        # Overcrowding check: after ENTRY, count present users in this room
        if action_enum == AttendanceAction.ENTRY and device and device.room_capacity:
            _check_overcrowding(db, class_, device, timestamp)

        return AttendanceLogResponse(
            success=True,
            log_id=log.id,
            message=f"Attendance recorded: {action_label}{late_label}",
            is_late=is_late
        )

    except Exception as e:
        db.rollback()
        logger.exception("ATTENDANCE | failed to log: user=%d class=%d", body.user_id, body.class_id)
        raise api_error(500, "INTERNAL_ERROR", "An unexpected error occurred while logging attendance")


class AutoExitRequest(BaseModel):
    """Request to trigger auto-exit for a class."""
    class_id: int
    device_id: int


class AutoExitResponse(BaseModel):
    """Response after auto-exit processing."""
    success: bool
    auto_exited_count: int
    message: str


@router.post("/attendance/auto-exit", response_model=AutoExitResponse)
def auto_exit_class(body: AutoExitRequest, db: Session = Depends(get_db)):
    """
    Auto-exit all users who are still present in a class.
    Called by the kiosk when the class end_time is reached.
    Bulk-inserts EXIT logs with verified_by=AUTO_TIMEOUT.
    """
    class_ = db.query(Class).filter(Class.id == body.class_id).first()
    if not class_:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")

    device = db.query(Device).filter(Device.id == body.device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")

    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    # Get all attendance logs for this class today
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.class_id == body.class_id,
        AttendanceLog.timestamp >= today_start,
        AttendanceLog.timestamp < today_end
    ).order_by(AttendanceLog.timestamp.asc()).all()

    # Walk logs per user to find who is still present (entered but not exited)
    user_states = {}  # user_id -> last relevant action
    for log in logs:
        action_val = log.action.value if isinstance(log.action, AttendanceAction) else log.action
        uid = log.user_id
        if action_val == "ENTRY":
            user_states[uid] = "PRESENT"
        elif action_val == "EXIT":
            user_states[uid] = "EXITED"
        elif action_val == "BREAK_OUT":
            if user_states.get(uid) == "PRESENT":
                user_states[uid] = "ON_BREAK"
        elif action_val == "BREAK_IN":
            if user_states.get(uid) == "ON_BREAK":
                user_states[uid] = "PRESENT"

    # Find users still present or on break (not exited)
    users_to_exit = [
        uid for uid, state in user_states.items()
        if state in ("PRESENT", "ON_BREAK")
    ]

    if not users_to_exit:
        return AutoExitResponse(
            success=True,
            auto_exited_count=0,
            message="No users needed auto-exit"
        )

    # Bulk insert EXIT logs
    auto_exit_count = 0
    try:
        for uid in users_to_exit:
            log = AttendanceLog(
                user_id=uid,
                class_id=body.class_id,
                device_id=body.device_id,
                action=AttendanceAction.EXIT,
                verified_by=VerifiedBy.AUTO_TIMEOUT,
                confidence_score=0.0,
                is_late=False,
                timestamp=now,
                remarks="[AUTO_EXIT] System auto-exit at class end time"
            )
            db.add(log)
            auto_exit_count += 1

        db.commit()
        logger.info(
            "AUTO_EXIT | class=%d: auto-exited %d users",
            body.class_id, auto_exit_count
        )

        return AutoExitResponse(
            success=True,
            auto_exited_count=auto_exit_count,
            message=f"Auto-exited {auto_exit_count} users"
        )

    except Exception as e:
        db.rollback()
        logger.exception("AUTO_EXIT | failed for class=%d", body.class_id)
        raise api_error(500, "INTERNAL_ERROR", "Failed to process auto-exit")


@router.get("/class/{class_id}/enrolled", response_model=ClassEnrolledResponse)
def get_class_enrolled_users(class_id: int, db: Session = Depends(get_db)):
    """
    Get all enrolled students and the faculty for a class.
    Used by kiosk to verify if a recognized face belongs to this class.
    """
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")

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
    # After EXIT, the session is CLOSED — no re-entry allowed.
    # If a user accidentally exits, an admin/faculty must manually adjust the record.
    # This prevents confusing data with multiple ENTRY/EXIT cycles per class session.
    allowed_actions = []
    if not has_entered:
        allowed_actions.append("ENTRY")
    elif has_exited:
        # Session is done — no more actions allowed for this class today.
        # Re-entry after exit is intentionally blocked.
        pass
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
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")

    if data.late_threshold_minutes < 1 or data.late_threshold_minutes > 120:
        raise api_error(400, "INVALID_THRESHOLD", "Late threshold must be between 1 and 120 minutes")

    cls.late_threshold_minutes = data.late_threshold_minutes
    db.commit()

    logger.info("SCHEDULE | late threshold updated: class=%d threshold=%d min", class_id, data.late_threshold_minutes)

    return {
        "success": True,
        "class_id": class_id,
        "late_threshold_minutes": data.late_threshold_minutes,
        "message": f"Late threshold set to {data.late_threshold_minutes} minutes"
    }


@router.get("/device/{device_id}")
def get_device_info(device_id: int, db: Session = Depends(get_db), x_device_key: Optional[str] = Header(None)):
    """
    Get device information including room assignment.
    Used by kiosk on startup to verify configuration.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")
    
    # TODO: Add device authentication when api_key column is added to Device model
    # if not device.api_key or device.api_key != x_device_key:
    #     raise api_error(401, "UNAUTHORIZED_DEVICE", "Invalid or missing X-Device-Key")
    
    return {
        "device_id": device.id,
        "device_name": device.device_name,
        "room": device.room,
        "ip_address": device.ip_address,
        "status": device.status.value if device.status else None,
        "last_heartbeat": device.last_heartbeat.isoformat() if device.last_heartbeat else None
    }


@router.get("/embeddings")
def download_embeddings(db: Session = Depends(get_db)):
    """
    Download all enrolled face embeddings as JSON.
    Used by RPi kiosk on startup to populate its local embeddings_cache.json
    without requiring direct database access on the device.
    """
    from models.facial_profile import FacialProfile
    import numpy as np

    profiles = (
        db.query(FacialProfile, User)
        .join(User, FacialProfile.user_id == User.id)
        .filter(FacialProfile.embedding.isnot(None))
        .all()
    )

    embeddings = []
    for profile, user in profiles:
        try:
            emb_array = np.frombuffer(profile.embedding, dtype=np.float32)
            if len(emb_array) != 512:
                continue
            embeddings.append({
                "user_id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "tupm_id": user.tupm_id or "",
                "role": user.role.value if user.role else "",
                "section": user.section or "",
                "embedding": emb_array.tolist(),
                "quality": profile.enrollment_quality or 0.0,
                "model_version": profile.model_version or "",
                "enrolled_at": profile.created_at.isoformat() if profile.created_at else None,
            })
        except Exception:
            continue

    return {
        "version": "1.0",
        "exported_at": datetime.now().isoformat(),
        "model": "insightface_buffalo_sc_v1",
        "embedding_dim": 512,
        "count": len(embeddings),
        "embeddings": embeddings,
    }


@router.post("/device/{device_id}/heartbeat")
def device_heartbeat(device_id: int, db: Session = Depends(get_db), x_device_key: Optional[str] = Header(None)):
    """
    Update device heartbeat timestamp.
    Called periodically by kiosk to indicate it's online.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")
    
    # TODO: Add device authentication when api_key column is added to Device model
    # if not device.api_key or device.api_key != x_device_key:
    #     raise api_error(401, "UNAUTHORIZED_DEVICE", "Invalid or missing X-Device-Key")
    
    device.last_heartbeat = datetime.now()
    db.commit()
    
    return {"success": True, "message": "Heartbeat updated"}


def _check_overcrowding(db: Session, class_obj, device, timestamp):
    """
    After an ENTRY, count currently-present users in the room.
    If present_count > device.room_capacity, create overcrowding notifications
    for the faculty of the class and the department head.
    Only sends one alert per room per day to avoid spamming.
    """
    try:
        from models.notification import Notification, NotificationType
        from models.user import UserRole

        room = class_obj.room
        capacity = device.room_capacity or 50

        # Count present users: latest log per user today in this room must be ENTRY or BREAK_IN
        today_start = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        # Get all classes in this room today
        room_classes = db.query(Class).filter(Class.room == room).all()
        room_class_ids = [c.id for c in room_classes]

        if not room_class_ids:
            return

        logs = (
            db.query(AttendanceLog)
            .filter(
                AttendanceLog.class_id.in_(room_class_ids),
                AttendanceLog.timestamp >= today_start,
                AttendanceLog.timestamp < today_end,
            )
            .order_by(AttendanceLog.timestamp.desc())
            .all()
        )

        # Determine latest action per user in this room
        latest_by_user = {}
        for log in logs:
            if log.user_id not in latest_by_user:
                latest_by_user[log.user_id] = log

        present_count = sum(
            1 for log in latest_by_user.values()
            if log.action in (AttendanceAction.ENTRY, AttendanceAction.BREAK_IN)
        )

        if present_count <= capacity:
            return

        # Check if we already sent an overcrowding alert for this room today
        existing_alert = db.query(Notification).filter(
            Notification.notification_type == NotificationType.OVERCROWDING_ALERT,
            Notification.reference_type == "room",
            Notification.title.like(f"%{room}%"),
            Notification.created_at >= today_start,
            Notification.created_at < today_end,
        ).first()

        if existing_alert:
            return  # Already alerted today for this room

        alert_title = f"Overcrowding Alert: {room}"
        alert_message = (
            f"Room {room} has {present_count} occupants, "
            f"exceeding its capacity of {capacity}."
        )

        # Notify the faculty teaching this class
        if class_obj.faculty_id:
            db.add(Notification(
                user_id=class_obj.faculty_id,
                notification_type=NotificationType.OVERCROWDING_ALERT,
                title=alert_title,
                message=alert_message,
                reference_id=class_obj.id,
                reference_type="room",
            ))

        # Notify department head(s) of the faculty's department
        faculty_user = db.query(User).filter(User.id == class_obj.faculty_id).first()
        if faculty_user and faculty_user.department_id:
            dept_heads = db.query(User).filter(
                User.department_id == faculty_user.department_id,
                User.role == UserRole.HEAD,
            ).all()
            for head in dept_heads:
                if head.id != class_obj.faculty_id:  # Avoid duplicate if head is also the teacher
                    db.add(Notification(
                        user_id=head.id,
                        notification_type=NotificationType.OVERCROWDING_ALERT,
                        title=alert_title,
                        message=alert_message,
                        reference_id=class_obj.id,
                        reference_type="room",
                    ))

        db.commit()
        logger.warning(
            "OVERCROWDING | room=%s present=%d capacity=%d class=%d",
            room, present_count, capacity, class_obj.id
        )

    except Exception as e:
        logger.error("Failed to check overcrowding: %s", str(e))
        # Non-critical — don't disrupt attendance logging
