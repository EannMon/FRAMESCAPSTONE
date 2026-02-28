"""
Department Head Router
Handles subject creation, course loading, faculty assignments, system logs, and reports.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import logging

from db.database import get_db
from core.errors import api_error
from models.subject import Subject
from models.class_ import Class
from models.user import User, UserRole
from models.device import Device
from models.audit_log import AuditLog
from models.attendance_log import AttendanceLog, AttendanceAction
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
def get_management_data(db: Session = Depends(get_db)):
    """
    Get all data needed for the Dept Management Page:
    - Courses (Subjects + Classes)
    - Faculty List
    - Available Rooms (from devices table)
    """
    
    # 1. Fetch all subjects with eager loaded classes and their faculties
    # This prevents the N+1 loop (querying classes per subject)
    subjects = db.query(Subject).options(
        joinedload(Subject.classes).joinedload(Class.faculty)
    ).all()
    
    courses_data = []
    
    for subject in subjects:
        # Avoid N+1 mapping since classes are eagerly loaded
        classes = subject.classes
        
        if not classes:
            courses_data.append({
                "subject_code": subject.code,
                "name": subject.title,
                "schedule_id": None,
                "assigned_faculty": None,
                "room_name": None,
                "schedule": None
            })
        else:
            for cls in classes:
                schedule_str = None
                if cls.day_of_week and cls.start_time and cls.end_time:
                    s_time = cls.start_time.strftime("%I:%M %p")
                    e_time = cls.end_time.strftime("%I:%M %p")
                    schedule_str = f"{cls.day_of_week} {s_time} - {e_time}"
                
                courses_data.append({
                    "subject_code": subject.code,
                    "name": subject.title,
                    "schedule_id": cls.id,
                    "assigned_faculty": cls.faculty.full_name if cls.faculty else None,
                    "room_name": cls.room if cls.room else None,
                    "schedule": schedule_str
                })
    
    # 3. Fetch Faculty (both FACULTY and HEAD roles)
    faculty = db.query(User).filter(User.role.in_([UserRole.FACULTY, UserRole.HEAD])).all()
    faculty_list = [{"user_id": f.id, "name": f.full_name, "email": f.email} for f in faculty]
    
    # 4. Rooms from devices table (real DB data)
    devices = db.query(Device).filter(Device.room.isnot(None)).all()
    rooms_set = set()
    rooms_list = []
    for device in devices:
        if device.room and device.room not in rooms_set:
            rooms_set.add(device.room)
            rooms_list.append({"room_name": device.room})
    
    # If no devices exist, return empty list (DB is source of truth)
    
    return {
        "courses": courses_data,
        "faculty": faculty_list,
        "rooms": rooms_list
    }

@router.post("/create-subject")
def create_subject(req: SubjectCreate, db: Session = Depends(get_db)):
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
    return {"message": "Subject created", "id": new_sub.id}

@router.post("/assign-faculty")
def assign_faculty(req: AssignFacultyRequest, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.code == req.subject_code).first()
    if not subject:
        raise api_error(404, "SUBJECT_NOT_FOUND", "Subject not found")

    faculty = db.query(User).filter(User.id == req.faculty_id, User.role.in_([UserRole.FACULTY, UserRole.HEAD])).first()
    if not faculty:
        raise api_error(404, "FACULTY_INVALID", "Faculty not found or not verified")

    if req.schedule_id:
        cls = db.query(Class).filter(Class.id == req.schedule_id).first()
        if cls:
            cls.faculty_id = faculty.id
            db.commit()
            return {"message": "Faculty assigned to existing class"}
    
    new_class = Class(
        subject_id=subject.id,
        faculty_id=faculty.id,
        section="TBA"
    )
    db.add(new_class)
    db.commit()
    return {"message": "New class created and faculty assigned"}

@router.post("/assign-room")
def assign_room(req: AssignRoomRequest, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.code == req.subject_code).first()
    if not subject:
        raise api_error(404, "SUBJECT_NOT_FOUND", "Subject not found")

    try:
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
    # TODO: Implement Student Schedule when Enrollment model is ready
    
    return schedule


# ============================================
# System Logs Endpoint (Real DB data)
# ============================================

@router.get("/system-logs")
def get_system_logs(
    level: Optional[str] = None,
    room: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get system logs from audit_logs and attendance_logs tables.
    Returns real DB data across all rooms.
    """
    results = []
    
    # --- 1. Audit Logs (system-level events) ---
    audit_query = db.query(AuditLog).order_by(desc(AuditLog.timestamp))
    
    if date_from:
        try:
            dt = datetime.strptime(date_from, "%Y-%m-%d")
            audit_query = audit_query.filter(AuditLog.timestamp >= dt)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            audit_query = audit_query.filter(AuditLog.timestamp < dt)
        except ValueError:
            pass
    
    audit_logs = audit_query.limit(limit).all()
    
    for log in audit_logs:
        log_level = "INFO"
        if "FAILED" in (log.action_type or "").upper() or "DELETE" in (log.action_type or "").upper() or "REJECT" in (log.action_type or "").upper():
            log_level = "ERROR"
        elif "UPDATE" in (log.action_type or "").upper() or "EXCEPTION" in (log.action_type or "").upper():
            log_level = "WARN"
        
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        user_display = f"{user.first_name} {user.last_name}" if user else "System"
        
        results.append({
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "N/A",
            "level": log_level,
            "service": log.target_table or "SystemService",
            "room": "—",
            "message": f"[{log.action_type}] by {user_display}" + (f" on {log.target_table}#{log.target_id}" if log.target_id else ""),
            "source": "audit"
        })
    
    # --- 2. Attendance Logs (room-level events) ---
    att_query = db.query(AttendanceLog).order_by(desc(AttendanceLog.timestamp))
    
    if date_from:
        try:
            dt = datetime.strptime(date_from, "%Y-%m-%d")
            att_query = att_query.filter(AttendanceLog.timestamp >= dt)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            att_query = att_query.filter(AttendanceLog.timestamp < dt)
        except ValueError:
            pass
    
    att_logs = att_query.limit(limit).all()
    
    for log in att_logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        cls = db.query(Class).filter(Class.id == log.class_id).first() if log.class_id else None
        user_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        room_name = cls.room if cls and cls.room else "N/A"
        
        log_level = "INFO"
        if log.is_late:
            log_level = "WARN"
        elif log.action == AttendanceAction.EXIT:
            log_level = "INFO"
        
        action_text = {
            AttendanceAction.ENTRY: "Entry",
            AttendanceAction.BREAK_OUT: "Break Out",
            AttendanceAction.BREAK_IN: "Break In",
            AttendanceAction.EXIT: "Exit"
        }.get(log.action, str(log.action))
        
        gesture_txt = f" (gesture: {log.gesture_detected})" if log.gesture_detected else ""
        confidence_txt = f" [conf: {log.confidence_score:.0%}]" if log.confidence_score else ""
        
        results.append({
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "N/A",
            "level": log_level,
            "service": "AttendanceService",
            "room": room_name,
            "message": f"{action_text}: {user_name}" + (" (LATE)" if log.is_late else "") + gesture_txt + confidence_txt,
            "source": "attendance"
        })
    
    # Sort all results by timestamp descending
    results.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Apply filters
    if level and level != "All Levels":
        results = [r for r in results if r["level"] == level]
    if room and room != "All Rooms":
        results = [r for r in results if r["room"] == room]
    if search:
        search_lower = search.lower()
        results = [r for r in results if 
                   search_lower in r["message"].lower() or 
                   search_lower in r["service"].lower() or
                   search_lower in r["timestamp"].lower() or
                   search_lower in r["room"].lower()]
    
    return results[:limit]


# ============================================
# Department Reports Endpoint (Real DB data)
# ============================================

@router.get("/reports/data")
def get_dept_report_data(
    report_type: str = "FACULTY_SUMMARY",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    room: Optional[str] = None,
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get report data for department head. Supports faculty oversight,
    facility analytics, and departmental strategy reports.
    All data comes directly from DB.
    """
    # Parse date filters
    dt_from = None
    dt_to = None
    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
        except ValueError:
            try:
                dt_from = datetime.strptime(date_from + "-01", "%Y-%m-%d")
            except ValueError:
                pass
    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            try:
                dt_to = datetime.strptime(date_to + "-01", "%Y-%m-%d")
                if dt_to.month == 12:
                    dt_to = dt_to.replace(year=dt_to.year + 1, month=1)
                else:
                    dt_to = dt_to.replace(month=dt_to.month + 1)
            except ValueError:
                pass
    
    # ----- FACULTY OVERSIGHT REPORTS -----
    if report_type in ["FACULTY_SUMMARY", "FACULTY_LATE", "FACULTY_CONSISTENCY"]:
        all_faculty = db.query(User).filter(User.role.in_([UserRole.FACULTY, UserRole.HEAD])).all()
        result = []
        
        for fac in all_faculty:
            query = db.query(AttendanceLog).filter(AttendanceLog.user_id == fac.id)
            if dt_from:
                query = query.filter(AttendanceLog.timestamp >= dt_from)
            if dt_to:
                query = query.filter(AttendanceLog.timestamp < dt_to)
            
            logs = query.all()
            total = len(logs)
            late_count = sum(1 for l in logs if l.is_late)
            entry_count = sum(1 for l in logs if l.action == AttendanceAction.ENTRY)
            
            if report_type == "FACULTY_LATE" and late_count == 0:
                continue
            
            classes_taught = db.query(Class).filter(Class.faculty_id == fac.id).count()
            
            result.append({
                "id": fac.tupm_id,
                "col1": fac.full_name,
                "col2": str(classes_taught),
                "status": "On Track" if late_count == 0 else f"{late_count} Late",
                "col3": f"{entry_count}/{total}" if total > 0 else "0/0",
                "remarks": f"Consistency: {round(((total - late_count) / max(total, 1)) * 100)}%" if report_type == "FACULTY_CONSISTENCY" else ("Punctual" if late_count == 0 else f"{late_count} late arrivals")
            })
        
        return result
    
    # ----- FACILITY & ROOM ANALYTICS -----
    elif report_type in ["ROOM_OCCUPANCY", "PEAK_USAGE", "ROOM_UTILIZATION", "OVERCROWDING"]:
        devices = db.query(Device).all()
        # Get all classes for rooms
        all_classes = db.query(Class).all()
        
        # Map rooms to classes
        room_class_map = {}
        for cls in all_classes:
            if cls.room:
                if cls.room not in room_class_map:
                    room_class_map[cls.room] = []
                room_class_map[cls.room].append(cls)
        
        result = []
        for device in devices:
            if room and room != "All Rooms" and device.room != room:
                continue
            
            # Get class IDs for this room
            room_classes = room_class_map.get(device.room, [])
            room_class_ids = [c.id for c in room_classes]
            
            # Count attendance logs for this room
            query = db.query(AttendanceLog).filter(AttendanceLog.class_id.in_(room_class_ids)) if room_class_ids else db.query(AttendanceLog).filter(False)
            if dt_from:
                query = query.filter(AttendanceLog.timestamp >= dt_from)
            if dt_to:
                query = query.filter(AttendanceLog.timestamp < dt_to)
            
            entry_count = query.filter(AttendanceLog.action == AttendanceAction.ENTRY).count() if room_class_ids else 0
            
            capacity = device.room_capacity or 40
            scheduled = len(room_classes)
            
            if report_type == "OVERCROWDING":
                # Only show rooms that have exceeded capacity at some point
                if entry_count <= capacity:
                    continue
            
            status_txt = "Normal"
            if entry_count > capacity:
                status_txt = "Overcrowded"
            elif entry_count > capacity * 0.8:
                status_txt = "Near Capacity"
            
            result.append({
                "id": device.device_name or device.room,
                "col1": device.room or "N/A",
                "col2": f"Capacity: {capacity}",
                "status": status_txt,
                "col3": f"{entry_count} entries",
                "remarks": f"{scheduled} classes scheduled" if report_type == "ROOM_UTILIZATION" else (f"Peak: {entry_count}" if report_type == "PEAK_USAGE" else f"Status: {device.status.value}")
            })
        
        return result
    
    # ----- DEPARTMENTAL STRATEGY -----
    elif report_type == "DEPT_ACTIVITY":
        # Cross-faculty and cross-course analytics
        all_subjects = db.query(Subject).all()
        result = []
        
        for subject in all_subjects:
            classes = db.query(Class).filter(Class.subject_id == subject.id).all()
            class_ids = [c.id for c in classes]
            
            if not class_ids:
                result.append({
                    "id": subject.code,
                    "col1": subject.title,
                    "col2": "0 sections",
                    "status": "No Classes",
                    "col3": "0 logs",
                    "remarks": "No activity"
                })
                continue
            
            query = db.query(AttendanceLog).filter(AttendanceLog.class_id.in_(class_ids))
            if dt_from:
                query = query.filter(AttendanceLog.timestamp >= dt_from)
            if dt_to:
                query = query.filter(AttendanceLog.timestamp < dt_to)
            
            total_logs = query.count()
            late_logs = query.filter(AttendanceLog.is_late == True).count()
            
            result.append({
                "id": subject.code,
                "col1": subject.title,
                "col2": f"{len(classes)} section(s)",
                "status": "Active" if total_logs > 0 else "No Data",
                "col3": f"{total_logs} logs",
                "remarks": f"{late_logs} late" if late_logs > 0 else "Good standing"
            })
        
        return result
    
    return []
