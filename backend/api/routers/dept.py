"""
Department Head Router
Handles subject creation, course loading, and faculty assignments.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel

from db.database import get_db
from models.subject import Subject
from models.class_ import Class
from models.user import User, UserRole

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
    - Available Rooms (Mock for now)
    """
    
    # 1. Fetch all subjects
    subjects = db.query(Subject).all()
    
    # 2. Build course list
    # We want to show ALL subjects. If a subject has a class, show class info.
    # If a subject has multiple classes (sections), show them all.
    # If a subject has NO class, show it with "Unassigned".
    
    courses_data = []
    
    for subject in subjects:
        # Check if classes exist for this subject
        classes = db.query(Class).filter(Class.subject_id == subject.id).options(joinedload(Class.faculty)).all()
        
        if not classes:
            # No class created yet -> Show as unassigned
            courses_data.append({
                "subject_code": subject.code,
                "name": subject.title,
                "schedule_id": None, # No class ID yet
                "assigned_faculty": None,
                "room_name": None,
                "schedule": None
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
                    "subject_code": subject.code,
                    "name": subject.title,
                    "schedule_id": cls.id,
                    "assigned_faculty": cls.faculty.full_name if cls.faculty else None,
                    "room_name": cls.room,
                    "schedule": schedule_str
                })
    
    # 3. Fetch Faculty
    faculty = db.query(User).filter(User.role == UserRole.FACULTY).all()
    faculty_list = [{"user_id": f.id, "name": f.full_name, "email": f.email} for f in faculty]
    
    # 4. Mock Rooms (could be a DB table later)
    rooms_list = [
        {"room_name": "CL1 (Computer Lab 1)"},
        {"room_name": "CL2 (Computer Lab 2)"},
        {"room_name": "CL3 (Mac Lab)"},
        {"room_name": "Lecture Hall A"},
        {"room_name": "Room 301"},
        {"room_name": "Room 302"},
    ]
    
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
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
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
    # Find Subject
    subject = db.query(Subject).filter(Subject.code == req.subject_code).first()
    if not subject:
        raise HTTPException(404, "Subject not found")

    # Verify Faculty
    faculty = db.query(User).filter(User.id == req.faculty_id, User.role == UserRole.FACULTY).first()
    if not faculty:
        raise HTTPException(404, "Faculty not found")

    # Check if we are updating an existing class or creating a new one
    if req.schedule_id:
        cls = db.query(Class).filter(Class.id == req.schedule_id).first()
        if cls:
            cls.faculty_id = faculty.id
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
        raise HTTPException(404, "Subject not found")

    # Time parsing
    try:
        # Expected format: "09:00 AM"
        start_t = datetime.strptime(req.start_time, "%I:%M %p").time()
        end_t = datetime.strptime(req.end_time, "%I:%M %p").time()
    except ValueError:
        raise HTTPException(400, "Invalid time format. Use HH:MM AM/PM")

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
    raise HTTPException(400, "Please assign a faculty member first before assigning a room.")

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    """
    Get dynamic notifications for the Department Head:
    1. Pending user verifications
    2. Recent audit logs (filtered for relevance)
    """
    from models.user import User, VerificationStatus
    from models.audit_log import AuditLog
    from datetime import datetime, timedelta

    notifications = []

    # 1. Fetch Pending Users
    pending_users = db.query(User).filter(User.verification_status == VerificationStatus.PENDING).order_by(User.created_at.desc()).all()
    for user in pending_users:
        notifications.append({
            "id": f"verify-{user.id}",
            "type": "VERIFICATION",
            "icon": "fas fa-user-clock",
            "text": f"Pending verification: {user.first_name} {user.last_name}",
            "time": "Recent", # Could calculate time ago
            "read": False,
            "link": "/dept-head-dashboard" # Dashboard has the review list
        })

    # 2. Fetch Recent Audit Logs (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    logs = db.query(AuditLog).filter(AuditLog.timestamp >= yesterday).order_by(AuditLog.timestamp.desc()).limit(10).all()
    
    for log in logs:
        # Skip verification logs to avoid redundancy if they are already in the list
        if log.action_type in ["USER_VERIFY", "USER_REJECT"]:
            continue
            
        notifications.append({
            "id": f"audit-{log.id}",
            "type": "AUDIT",
            "icon": "fas fa-history",
            "text": f"Action: {log.action_type.replace('_', ' ')}",
            "time": log.timestamp.strftime("%I:%M %p"),
            "read": True,
            "link": "/dept-head-logs"
        })

    return notifications
