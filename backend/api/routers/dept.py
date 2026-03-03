"""
Department Head Router
Handles subject creation, course loading, and faculty assignments.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
import logging

from db.database import get_db
from core.errors import api_error
from models.subject import Subject
from models.class_ import Class
from models.user import User, UserRole
from models.department import Department

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
    - Available Rooms (Mock for now)
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
            # No class created yet -> Show as unassigned
            courses_data.append({
                "subject_code": subject.code,
                "name": subject.title,
                "schedule_id": None, 
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
    
    # 3. Fetch Faculty (Only VERIFIED)
    from models.user import VerificationStatus
    faculty = db.query(User).filter(
        User.role == UserRole.FACULTY,
        User.verification_status == VerificationStatus.VERIFIED
    ).all()
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

@router.get("/academic-year")
def get_academic_year(dept_id: int = Query(...), db: Session = Depends(get_db)):
    """Get the active academic year for a department."""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise api_error(404, "DEPT_NOT_FOUND", "Department not found")
    return {
        "academic_year": dept.active_academic_year or None,
        "semester": dept.active_semester or None
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
    db.commit()
    
    logger.info("Academic year updated to %s %s for department %s", req.academic_year, req.semester, dept.name)
    return {"message": "Academic year updated", "academic_year": req.academic_year, "semester": req.semester}
