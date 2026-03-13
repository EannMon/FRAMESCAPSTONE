"""
Department Head Router
Handles subject creation, course loading, and faculty assignments.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
import logging

from db.database import get_db
from core.errors import api_error
from models.subject import Subject
from models.class_ import Class
from models.user import User, UserRole
from models.department import Department
from models.device import Device
from models.enrollment import Enrollment

logger = logging.getLogger(__name__)

router = APIRouter()

# --- Schemas (Inline for now, can move to schemas/ later) ---

class SubjectCreate(BaseModel):
    code: str
    name: str # maps to title in DB
    units: int

class AssignFacultyRequest(BaseModel):
    schedule_id: Optional[int] = None # class.id
    subject_code: str
    faculty_id: int

class AssignRoomRequest(BaseModel):
    schedule_id: Optional[int] = None
    subject_code: str
    room_name: str
    day: str
    start_time: str # "09:00 AM" format from frontend
    end_time: str

# --- Endpoints ---

@router.get("/management-data")
def get_management_data(
    academic_year: Optional[str] = Query(None),
    semester: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Get all data needed for the Dept Management Page:
    - Courses (Subjects + Classes), optionally filtered by AY/semester
    - Faculty List
    - Available Rooms
    """
    
    # 1. Fetch all subjects with eager loaded classes and their faculties
    # This prevents the N+1 loop (querying classes per subject)
    subjects = db.query(Subject).options(
        joinedload(Subject.classes).joinedload(Class.faculty)
    ).all()

    # Batch query: enrollment count per class_id (prevents N+1)
    all_class_ids = [
        cls.id for subj in subjects for cls in subj.classes
    ]
    enrollment_counts = {}
    if all_class_ids:
        enrollment_counts = dict(
            db.query(Enrollment.class_id, func.count(Enrollment.id))
            .filter(Enrollment.class_id.in_(all_class_ids))
            .group_by(Enrollment.class_id)
            .all()
        )
    
    courses_data = []
    
    for subject in subjects:
        # Avoid N+1 mapping since classes are eagerly loaded
        classes = subject.classes

        # Filter classes by academic year and semester if provided
        if academic_year or semester:
            filtered = []
            for c in classes:
                if academic_year and c.academic_year and c.academic_year != academic_year:
                    continue
                if semester and c.semester and c.semester != semester:
                    continue
                filtered.append(c)
            classes = filtered
        
        if not classes:
            # No class created yet -> Show as unassigned
            courses_data.append({
                "subject_id": subject.id,
                "subject_code": subject.code,
                "name": subject.title,
                "schedule_id": None, 
                "assigned_faculty": None,
                "room_name": None,
                "schedule": None,
                "enrolled_count": 0
            })
        else:
            # Show each class section
            for cls in classes:
                # Format schedule string
                schedule_str = "TBA"
                if cls.day_of_week and cls.start_time and cls.end_time:
                    # Convert time objects to string if needed, or rely on frontend format
                    # backend stores as Time object.
                    s_time = cls.start_time.strftime("%I:%M %p")
                    e_time = cls.end_time.strftime("%I:%M %p")
                    schedule_str = f"{cls.day_of_week} {s_time} - {e_time}"
                
                courses_data.append({
                    "subject_id": subject.id,
                    "subject_code": subject.code,
                    "name": subject.title,
                    "schedule_id": cls.id,
                    "section": cls.section,
                    "assigned_faculty": cls.faculty.full_name if cls.faculty else None,
                    "room_name": cls.room,
                    "schedule": schedule_str,
                    "enrolled_count": enrollment_counts.get(cls.id, 0)
                })
    
    # 3. Fetch Faculty (Only VERIFIED)
    from models.user import VerificationStatus
    faculty = db.query(User).filter(
        User.role == UserRole.FACULTY,
        User.verification_status == VerificationStatus.VERIFIED
    ).all()
    faculty_list = [{"user_id": f.id, "name": f.full_name, "email": f.email} for f in faculty]
    
    # 4. Rooms from DB — union of rooms from classes + devices
    class_rooms = set(
        r[0] for r in db.query(Class.room).filter(Class.room.isnot(None), Class.room != "").distinct().all()
    )
    device_rooms = set(
        r[0] for r in db.query(Device.room).filter(Device.room.isnot(None), Device.room != "").distinct().all()
    )
    all_rooms = sorted(class_rooms | device_rooms)
    # Always include an "Online" option
    if "Online" not in all_rooms:
        all_rooms.append("Online")
    rooms_list = [{"room_name": r} for r in all_rooms]
    
    return {
        "courses": courses_data,
        "faculty": faculty_list,
        "rooms": rooms_list
    }

@router.post("/create-subject")
def create_subject(req: SubjectCreate, db: Session = Depends(get_db)):
    # Check if exists
    existing = db.query(Subject).filter(Subject.code == req.code).first()
    if existing:
        raise api_error(
            status_code=400,
            code="SUBJECT_EXISTS",
            message="Subject code already exists"
        )
    
    new_sub = Subject(
        code=req.code,
        title=req.name,
        units=req.units
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    # Log Audit Entry (Task: Full Activity Tracking)
    from models.audit_log import AuditLog, AuditActions
    from datetime import datetime, timezone
    audit_entry = AuditLog(
        user_id=req.user_id,
        action_type=AuditActions.SUBJECT_CREATE,
        target_table="subjects",
        target_id=new_sub.id,
        new_value={"code": new_sub.code, "title": new_sub.title},
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_entry)
    db.commit()

    return {"message": "Subject created", "id": new_sub.id}


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    """Delete a subject and its associated classes."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise api_error(404, "SUBJECT_NOT_FOUND", "Subject not found")

    # Delete associated classes first
    db.query(Class).filter(Class.subject_id == subject_id).delete()
    db.delete(subject)
    db.commit()

    # Log Audit Entry (Task: Full Activity Tracking)
    from models.audit_log import AuditLog, AuditActions
    from datetime import datetime, timezone
    audit_entry = AuditLog(
        user_id=None, # System-level delete
        action_type=AuditActions.SUBJECT_DELETE,
        target_table="subjects",
        target_id=subject_id,
        new_value={"code": subject.code},
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_entry)
    db.commit()

    logger.info("Deleted subject %d (%s)", subject_id, subject.code)
    return {"message": f"Subject {subject.code} deleted"}


@router.post("/assign-faculty")
def assign_faculty(req: AssignFacultyRequest, db: Session = Depends(get_db)):
    # Find Subject
    subject = db.query(Subject).filter(Subject.code == req.subject_code).first()
    if not subject:
        raise api_error(404, "SUBJECT_NOT_FOUND", "Subject not found")

    # Verify Faculty
    from models.user import VerificationStatus
    faculty = db.query(User).filter(
        User.id == req.faculty_id, 
        User.role == UserRole.FACULTY,
        User.verification_status == VerificationStatus.VERIFIED
    ).first()
    if not faculty:
        raise api_error(404, "FACULTY_INVALID", "Faculty not found or not verified")

    # Check if we are updating an existing class or creating a new one
    if req.schedule_id:
        cls = db.query(Class).filter(Class.id == req.schedule_id).first()
        if cls:
            cls.faculty_id = faculty.id
            db.commit()

            # Log Audit Entry (Task: Full Activity Tracking)
            from models.audit_log import AuditLog, AuditActions
            from datetime import datetime, timezone
            audit_entry = AuditLog(
                user_id=None,
                action_type=AuditActions.FACULTY_ASSIGN,
                target_table="classes",
                target_id=cls.id,
                new_value={"faculty_id": faculty.id, "subject_code": subject.code},
                timestamp=datetime.now(timezone.utc)
            )
            db.add(audit_entry)
            db.commit()

            return {"message": "Faculty assigned to existing class"}
    
    # Create new class if no ID or ID n/a
    new_class = Class(
        subject_id=subject.id,
        faculty_id=faculty.id,
        section="TBA" # Default section
    )
    db.add(new_class)
    db.commit()
    return {"message": "New class created and faculty assigned"}

@router.post("/assign-room")
def assign_room(req: AssignRoomRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    
    # Find Subject
    subject = db.query(Subject).filter(Subject.code == req.subject_code).first()
    if not subject:
        raise api_error(404, "SUBJECT_NOT_FOUND", "Subject not found")

    # Time parsing
    try:
        # Expected format: "09:00 AM"
        start_t = datetime.strptime(req.start_time, "%I:%M %p").time()
        end_t = datetime.strptime(req.end_time, "%I:%M %p").time()
    except ValueError:
        raise api_error(400, "INVALID_TIME", "Invalid time format. Use HH:MM AM/PM")

    if req.schedule_id:
        cls = db.query(Class).filter(Class.id == req.schedule_id).first()
        if cls:
            cls.room = req.room_name
            cls.day_of_week = req.day
            cls.start_time = start_t
            cls.end_time = end_t
            db.commit()
            return {"message": "Room assigned to existing class"}
            
    # Workaround: Check if there's any faculty, or assign to a default "TBA" placeholder if needed.
    # OR: The user flow "Assign Room" might fail if no faculty assigned yet.
    # Let's try to find if there is an existing class for this subject with no room.
    
    # For now, if no schedule_id, we can't create a class without faculty.
    # We will raise error if no class exists.
    raise api_error(400, "NO_FACULTY", "Please assign a faculty member first before assigning a room.")

@router.get("/user-schedule/{user_id}")
def get_user_schedule(user_id: int, db: Session = Depends(get_db)):
    """
    Fetch schedule for a specific user (Faculty or Student).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
        
    schedule = []
    
    # 1. If Faculty, get classes they teach
    if user.role == UserRole.FACULTY:
        classes = db.query(Class).filter(Class.faculty_id == user.id).options(joinedload(Class.subject)).all()
        for cls in classes:
            s_time = cls.start_time.strftime("%I:%M %p") if cls.start_time else "TBA"
            e_time = cls.end_time.strftime("%I:%M %p") if cls.end_time else "TBA"
            day = cls.day_of_week if cls.day_of_week else "TBA"
            
            schedule.append({
                "subject_code": cls.subject.code,
                "subject_name": cls.subject.title,
                "day": day,
                "time": f"{s_time} - {e_time}" if s_time != "TBA" else "TBA",
                "room": cls.room or "TBA",
                "section": cls.section or "TBA"
            })
            
    # 2. If Student, get classes they are enrolled in 
    # (Assuming Enrollment model exists, otherwise return empty for now)
    # TODO: Implement Student Schedule when Enrollment model is ready
    
    return schedule


# --- Academic Year Settings ---

class AcademicYearUpdate(BaseModel):
    user_id: int
    academic_year: str
    semester: str
    semester_start_date: Optional[str] = None  # ISO date string "YYYY-MM-DD"
    semester_end_date: Optional[str] = None    # ISO date string "YYYY-MM-DD"

@router.get("/academic-year")
def get_academic_year(dept_id: int = Query(...), db: Session = Depends(get_db)):
    """Get the active academic year for a department."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise api_error(404, "DEPT_NOT_FOUND", "Department not found")
    return {
        "academic_year": dept.active_academic_year or None,
        "semester": dept.active_semester or None,
        "semester_start_date": dept.semester_start_date.isoformat() if dept.semester_start_date else None,
        "semester_end_date": dept.semester_end_date.isoformat() if dept.semester_end_date else None,
    }

@router.put("/academic-year")
def update_academic_year(req: AcademicYearUpdate, db: Session = Depends(get_db)):
    """Update the active academic year for the dept head's department."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    if not user.department_id:
        raise api_error(400, "NO_DEPARTMENT", "User has no department assigned")
    
    dept = db.query(Department).filter(Department.id == user.department_id).first()
    if not dept:
        raise api_error(404, "DEPT_NOT_FOUND", "Department not found")
    
    dept.active_academic_year = req.academic_year
    dept.active_semester = req.semester
    
    # Save semester date range if provided
    if req.semester_start_date:
        from datetime import date as date_type
        try:
            dept.semester_start_date = date_type.fromisoformat(req.semester_start_date)
        except ValueError:
            logger.warning("Invalid semester_start_date format: %s", req.semester_start_date)
    if req.semester_end_date:
        from datetime import date as date_type
        try:
            dept.semester_end_date = date_type.fromisoformat(req.semester_end_date)
        except ValueError:
            logger.warning("Invalid semester_end_date format: %s", req.semester_end_date)
    
    db.commit()
    
    # Log Audit Entry (Task: Full Activity Tracking)
    from models.audit_log import AuditLog, AuditActions
    from datetime import datetime, timezone
    audit_entry = AuditLog(
        user_id=req.user_id,
        action_type=AuditActions.ACADEMIC_YEAR_UPDATE,
        target_table="departments",
        target_id=dept.id,
        new_value={"academic_year": req.academic_year, "semester": req.semester},
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_entry)
    db.commit()
    
    logger.info("Academic year updated to %s %s for department %s", req.academic_year, req.semester, dept.name)
    return {"message": "Academic year updated", "academic_year": req.academic_year, "semester": req.semester}


# --- Program Management ---

class ProgramCreate(BaseModel):
    name: str
    code: str
    dept_id: int


@router.get("/programs")
def list_programs(dept_id: int = Query(...), db: Session = Depends(get_db)):
    """List all programs for a department."""
    from models.program import Program
    programs = db.query(Program).filter(
        Program.department_id == dept_id
    ).order_by(Program.name).all()
    return [{"id": p.id, "name": p.name, "code": p.code} for p in programs]


@router.post("/programs", status_code=status.HTTP_201_CREATED)
def create_program(req: ProgramCreate, db: Session = Depends(get_db)):
    """Create a new program under a department."""
    from models.program import Program
    from sqlalchemy import func

    normalized_name = req.name.strip().upper()
    normalized_code = req.code.strip().upper()

    if not normalized_name or not normalized_code:
        raise api_error(400, "INVALID_INPUT", "Program name and code are required")

    # Check for duplicate name or code within this department
    existing = db.query(Program).filter(
        Program.department_id == req.dept_id,
        (func.upper(Program.name) == normalized_name) | (func.upper(Program.code) == normalized_code)
    ).first()
    if existing:
        raise api_error(409, "PROGRAM_EXISTS", "A program with that name or code already exists in this department")

    new_prog = Program(name=normalized_name, code=normalized_code, department_id=req.dept_id)
    db.add(new_prog)
    db.commit()
    db.refresh(new_prog)

    logger.info("DEPT | program created: %s (%s) dept=%d", new_prog.name, new_prog.code, req.dept_id)
    return {"id": new_prog.id, "name": new_prog.name, "code": new_prog.code}


@router.delete("/programs/{program_id}")
def delete_program(program_id: int, db: Session = Depends(get_db)):
    """
    Delete a program.
    Blocked if any users are currently assigned to it.
    """
    from models.program import Program

    prog = db.query(Program).filter(Program.id == program_id).first()
    if not prog:
        raise api_error(404, "PROGRAM_NOT_FOUND", "Program not found")

    user_count = db.query(User).filter(User.program_id == program_id).count()
    if user_count > 0:
        raise api_error(
            409, "PROGRAM_IN_USE",
            f"Cannot delete: {user_count} user(s) are currently assigned to '{prog.name}'"
        )

    name = prog.name
    db.delete(prog)
    db.commit()
    logger.info("DEPT | program deleted: %s (id=%d)", name, program_id)
    return {"message": f"Program '{name}' deleted successfully"}


# --- Dept-Scoped User List ---

@router.get("/users")
def get_dept_users(dept_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Get all users belonging to a department.
    Used by Dept Head User Management page — shows only their department's members.
    """
    from models.department import Department as Dept

    users = (
        db.query(User)
        .outerjoin(Dept, User.department_id == Dept.id)
        .filter(User.department_id == dept_id)
        .order_by(User.created_at.desc())
        .all()
    )

    result = []
    for u in users:
        result.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "tupm_id": u.tupm_id,
            "role": u.role.value if hasattr(u.role, "value") else u.role,
            "verification_status": (
                u.verification_status.value
                if hasattr(u.verification_status, "value")
                else u.verification_status
            ),
            "face_registered": bool(u.face_registered),
            "department_id": u.department_id,
            "department_name": u.department.name if u.department else None,
            "program_id": u.program_id,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_active": u.last_active.isoformat() if u.last_active else None,
        })

    logger.info("DEPT | user list fetched: dept_id=%d count=%d", dept_id, len(result))
    return result


# ──────────────────────────────────────────────
# Camera / Device Management
# ──────────────────────────────────────────────

class DeviceCreateRequest(BaseModel):
    device_name: str
    room: str
    ip_address: Optional[str] = None
    room_capacity: Optional[int] = 40

class DeviceUpdateRequest(BaseModel):
    device_name: Optional[str] = None
    room: Optional[str] = None
    ip_address: Optional[str] = None
    room_capacity: Optional[int] = None
    status: Optional[str] = None


@router.get("/devices")
def list_devices(db: Session = Depends(get_db)):
    """List all registered camera devices."""
    devices = db.query(Device).order_by(Device.id).all()
    return [
        {
            "id": d.id,
            "device_name": d.device_name,
            "room": d.room,
            "ip_address": d.ip_address,
            "status": d.status.value if hasattr(d.status, "value") else str(d.status),
            "room_capacity": d.room_capacity,
            "last_heartbeat": d.last_heartbeat.isoformat() if d.last_heartbeat else None,
        }
        for d in devices
    ]


@router.post("/devices")
def create_device(req: DeviceCreateRequest, db: Session = Depends(get_db)):
    """Register a new camera device for a room."""
    from models.device import DeviceStatus
    device = Device(
        device_name=req.device_name,
        room=req.room,
        ip_address=req.ip_address,
        room_capacity=req.room_capacity or 40,
        status=DeviceStatus.ACTIVE,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    logger.info("DEVICE | created device %d for room %s", device.id, device.room)
    return {"message": "Device registered", "id": device.id}


@router.put("/devices/{device_id}")
def update_device(device_id: int, req: DeviceUpdateRequest, db: Session = Depends(get_db)):
    """Update a camera device's settings."""
    from models.device import DeviceStatus
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")

    if req.device_name is not None:
        device.device_name = req.device_name
    if req.room is not None:
        device.room = req.room
    if req.ip_address is not None:
        device.ip_address = req.ip_address
    if req.room_capacity is not None:
        device.room_capacity = req.room_capacity
    if req.status is not None:
        try:
            device.status = DeviceStatus(req.status)
        except ValueError:
            raise api_error(400, "INVALID_STATUS", f"Invalid status: {req.status}")

    db.commit()
    logger.info("DEVICE | updated device %d", device_id)
    return {"message": "Device updated"}


@router.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    """Remove a camera device."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise api_error(404, "DEVICE_NOT_FOUND", "Device not found")
    db.delete(device)
    db.commit()
    logger.info("DEVICE | deleted device %d", device_id)
    return {"message": "Device deleted"}


@router.get("/system-logs")
def get_dept_system_logs(
    level: Optional[str] = Query(None, description="Filter by log level (INFO, WARN, ERROR)"),
    room: Optional[str] = Query(None, description="Filter by room name (best-effort)"),
    search: Optional[str] = Query(None, description="Full-text search across message, service, user"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """
    Retrieve audit logs for the Department Head System Logs page.
    Reads from the audit_logs table and returns a flat list of formatted log entries.
    Supports filtering by level, date range, and keyword search.
    """
    from models.audit_log import AuditLog
    from api.routers.admin import _action_to_service, _action_to_level, _build_log_message
    from datetime import datetime

    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    # Date range filters
    if date_from:
        try:
            df = datetime.fromisoformat(date_from)
            query = query.filter(AuditLog.timestamp >= df)
        except ValueError:
            pass

    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            dt = dt.replace(hour=23, minute=59, second=59)
            query = query.filter(AuditLog.timestamp <= dt)
        except ValueError:
            pass

    logs = query.order_by(AuditLog.timestamp.desc()).limit(300).all()

    result = []
    for log in logs:
        service = _action_to_service(log.action_type)
        log_level = _action_to_level(log.action_type)

        user_name = ""
        if log.user:
            user_name = f"{log.user.first_name} {log.user.last_name}"

        message = _build_log_message(log, user_name)

        # Apply level filter (done in Python after building the level)
        if level and log_level != level:
            continue

        # Apply keyword search across message, service, action type, and user name
        if search:
            search_lower = search.lower()
            haystack = f"{message} {service} {log.action_type or ''} {user_name}".lower()
            if search_lower not in haystack:
                continue

        result.append({
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "level": log_level,
            "service": service,
            "action_type": log.action_type,
            "message": message,
            "user_name": user_name,
            "room": None,
            "source": log.ip_address or "",
        })

    return result
