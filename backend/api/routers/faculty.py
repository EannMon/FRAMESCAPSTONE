"""
Faculty Router - Faculty-specific endpoints
Schedule, dashboard, class management, COR upload
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
import logging

from db.database import get_db
from core.errors import api_error
from core.limiter import limiter
from models.user import User, UserRole, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction
from models.session_exception import SessionException, ExceptionType
from models.device import Device, DeviceStatus
from models.department import Department
from models.device import Device, DeviceStatus
from models.department import Department

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Pydantic Schemas for Faculty
# ============================================

class ClassResponse(BaseModel):
    id: int
    subject_code: Optional[str] = None
    subject_title: Optional[str] = None
    section: Optional[str] = None
    room: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    total_students: int = 0
    present_count: int = 0
    rate: int = 0
    status: str = "upcoming"
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_classes: int
    total_students: int
    todays_classes: int
    average_attendance: float


class SubjectCreate(BaseModel):
    code: str
    title: str
    units: int = 3


class StudentEntry(BaseModel):
    tupm_id: str
    name: str


class CourseEntry(BaseModel):
    subject_code: str
    subject_name: str
    section: str
    day: str
    start_time: str
    end_time: str
    venue: str = "Room 324"
    units: int = 2
    enrolled_students: List[StudentEntry] = []


class ConfirmScheduleRequest(BaseModel):
    faculty_id: int
    semester: str
    academic_year: str
    courses: List[CourseEntry]


class AddStudentRequest(BaseModel):
    student_id: int


# ============================================
# Endpoints
# ============================================

@router.get("/schedule/{user_id}", response_model=List[ClassResponse])
def get_faculty_schedule(user_id: int, db: Session = Depends(get_db)):
    """
    Get all classes taught by a faculty member.
    Includes attendance stats for each class.
    """
    # Check user exists and is verified
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise api_error(403, "NOT_VERIFIED", "Account not verified")
    
    # Get classes taught by this faculty (Eager load Subject to avoid N+1)
    from sqlalchemy.orm import joinedload
    classes = db.query(Class).options(joinedload(Class.subject)).filter(Class.faculty_id == user_id).all()
    
    if not classes:
        return []
        
    class_ids = [c.id for c in classes]
    
    # Batch Query 1: Total enrolled students per class
    enrollment_counts = dict(
        db.query(Enrollment.class_id, func.count(Enrollment.id))
        .filter(Enrollment.class_id.in_(class_ids))
        .group_by(Enrollment.class_id)
        .all()
    )
    
    # Batch Query 2: Total present today per class
    present_counts = dict(
        db.query(AttendanceLog.class_id, func.count(AttendanceLog.user_id.distinct()))
        .filter(
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY,
            func.date(AttendanceLog.timestamp) == func.current_date()
        )
        .group_by(AttendanceLog.class_id)
        .all()
    )
    
    today = datetime.now().strftime('%A')
    result = []
    
    for cls in classes:
        subject = cls.subject
        total_students = enrollment_counts.get(cls.id, 0)
        present_count = present_counts.get(cls.id, 0)
        
        # Calculate rate
        rate = round((present_count / total_students * 100)) if total_students > 0 else 0
        
        # Determine status
        status = "upcoming"
        if cls.day_of_week == today:
            if present_count > 0:
                status = "ongoing"
            if present_count == total_students and total_students > 0:
                status = "completed"
        
        result.append(ClassResponse(
            id=cls.id,
            subject_code=subject.code if subject else None,
            subject_title=subject.title if subject else None,
            section=cls.section,
            room=cls.room,
            day_of_week=cls.day_of_week,
            start_time=str(cls.start_time) if cls.start_time else None,
            end_time=str(cls.end_time) if cls.end_time else None,
            total_students=total_students,
            present_count=present_count,
            rate=rate,
            status=status,
            semester=cls.semester,
            academic_year=cls.academic_year
        ))
    
    return result


@router.get("/dashboard-stats/{user_id}", response_model=DashboardStats)
def get_faculty_dashboard_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get dashboard statistics for a faculty member.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise api_error(403, "NOT_VERIFIED", "Account not verified")
    
    today = datetime.now().strftime('%A')
    
    # Total classes
    total_classes = db.query(Class).filter(Class.faculty_id == user_id).count()
    
    # Today's classes
    todays_classes = db.query(Class).filter(
        Class.faculty_id == user_id,
        Class.day_of_week == today
    ).count()
    
    # Total unique students across all classes
    class_ids = [c.id for c in db.query(Class).filter(Class.faculty_id == user_id).all()]
    total_students = db.query(Enrollment).filter(
        Enrollment.class_id.in_(class_ids)
    ).distinct(Enrollment.student_id).count() if class_ids else 0
    
    # Average attendance (simplified calculation)
    average_attendance = 85.0  # TODO: Calculate from actual logs
    
    return DashboardStats(
        total_classes=total_classes,
        total_students=total_students,
        todays_classes=todays_classes,
        average_attendance=average_attendance
    )


@router.post("/subjects", response_model=dict)
def create_subject(subject_data: SubjectCreate, db: Session = Depends(get_db)):
    """
    Create a new subject.
    """
    # Check if subject code already exists
    existing = db.query(Subject).filter(Subject.code == subject_data.code).first()
    if existing:
        raise api_error(409, "SUBJECT_EXISTS", "Subject code already exists")
    
    new_subject = Subject(
        code=subject_data.code,
        title=subject_data.title,
        units=subject_data.units
    )
    
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    logger.info("Created subject: %s - %s", new_subject.code, new_subject.title)
    return {"message": "Subject created", "id": new_subject.id}


@router.get("/class/{class_id}")
def get_class_details(class_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific class.
    Includes enrolled students and attendance logs.
    """
    from sqlalchemy.orm import joinedload
    cls = db.query(Class).options(joinedload(Class.subject)).filter(Class.id == class_id).first()
    if not cls:
        raise api_error(status_code=404, code="CLASS_NOT_FOUND", message="Class not found")
    
    subject = cls.subject
    
    # Get enrolled students via eager loading
    enrollments = db.query(Enrollment).options(joinedload(Enrollment.student)).filter(Enrollment.class_id == class_id).all()
    students = []
    for enrollment in enrollments:
        student = enrollment.student
        if student:
            students.append({
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "tupm_id": student.tupm_id,
                "section": student.section
            })
    
    return {
        "id": cls.id,
        "subject_code": subject.code if subject else None,
        "subject_title": subject.title if subject else None,
        "section": cls.section,
        "room": cls.room,
        "day_of_week": cls.day_of_week,
        "start_time": str(cls.start_time) if cls.start_time else None,
        "end_time": str(cls.end_time) if cls.end_time else None,
        "students": students,
        "total_students": len(students)
    }


@router.get("/upload-history/{user_id}")
def get_upload_history(user_id: int, db: Session = Depends(get_db)):
    """
    Get the history of COR/schedule uploads for a faculty member.
    This is a placeholder - actual file storage is not implemented yet.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
    # Return empty list for now - file upload tracking will be added in future phase
    return []


@router.post("/upload-schedule", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def upload_schedule(
    request: Request,
    file: UploadFile = File(...),
    faculty_id: Optional[int] = Form(None),
    semester: Optional[str] = Form("1st Semester"),
    academic_year: Optional[str] = Form("2025-2026"),
    db: Session = Depends(get_db)
):
    """
    Upload a COR/Schedule PDF to create classes and enrollments.
    Uses pdfplumber to parse the PDF and extract course/student data.
    """
    from services.pdf_parser import parse_schedule_pdf
    import bcrypt
    
    if not file.filename.endswith('.pdf'):
        raise api_error(400, "INVALID_FILE_TYPE", "Only PDF files are accepted")
    
    # Read file content
    content = await file.read()
    
    logger.info("Received schedule upload: %s (%d bytes)", file.filename, len(content))
    
    try:
        # Parse PDF
        parsed_data = parse_schedule_pdf(content, faculty_id)
        
        if not parsed_data:
            raise api_error(400, "PARSE_FAILED", "Could not parse PDF")
        
        created_schedules = []
        updated_schedules = []
        created_students = []
        enrolled_count = 0
        
        # Use semester/year from form if provided, else from PDF parser
        current_semester = semester or parsed_data.get('semester', '1st Semester')
        current_academic_year = academic_year or parsed_data.get('academic_year', '2025-2026')

        # ── Validate semester/academic_year against department settings ──
        # This ensures uploads match the dept head's configured semester.
        # TO REVERT FOR TESTING: Comment out the block below (from "if faculty_id"
        # to the "raise api_error" line) to allow any semester/academic_year.
        if faculty_id:
            faculty_user = db.query(User).filter(User.id == faculty_id).first()
            if faculty_user and faculty_user.department_id:
                dept = db.query(Department).filter(Department.id == faculty_user.department_id).first()
                if dept:
                    if dept.active_academic_year and current_academic_year != dept.active_academic_year:
                        raise api_error(
                            400, "AY_MISMATCH",
                            f"Academic year '{current_academic_year}' does not match the department setting "
                            f"'{dept.active_academic_year}'. Please contact your department head."
                        )
                    if dept.active_semester and current_semester != dept.active_semester:
                        raise api_error(
                            400, "SEMESTER_MISMATCH",
                            f"Semester '{current_semester}' does not match the department setting "
                            f"'{dept.active_semester}'. Please contact your department head."
                        )
        
        for course_data in parsed_data['courses']:
            # Create/Get Subject
            subject = db.query(Subject).filter(Subject.code == course_data['subject_code']).first()
            if not subject:
                subject = Subject(
                    code=course_data['subject_code'],
                    title=course_data['subject_name'],
                    units=course_data.get('units', 3)
                )
                db.add(subject)
                db.commit()
                db.refresh(subject)
            
            # Parse time strings to time objects
            start_time = None
            end_time = None
            if course_data['start_time'] != 'TBA':
                try:
                    from datetime import datetime as dt
                    start_time = dt.strptime(course_data['start_time'], '%I:%M%p').time()
                except:
                    try:
                        start_time = dt.strptime(course_data['start_time'], '%I:%M %p').time()
                    except:
                        pass
            if course_data['end_time'] != 'TBA':
                try:
                    from datetime import datetime as dt
                    end_time = dt.strptime(course_data['end_time'], '%I:%M%p').time()
                except:
                    try:
                        end_time = dt.strptime(course_data['end_time'], '%I:%M %p').time()
                    except:
                        pass
            
            # Check if Class ALREADY EXISTS
            # Unique identification: Subject + Section + Day + Semester + Academic Year
            existing_class = db.query(Class).filter(
                Class.subject_id == subject.id,
                Class.section == course_data['section'],
                Class.day_of_week == course_data['day'],
                Class.semester == current_semester,
                Class.academic_year == current_academic_year
            ).first()
            
            if existing_class:
                # ── Ownership Check ──
                # If the class already exists but belongs to a DIFFERENT faculty member, block the update.
                if faculty_id and existing_class.faculty_id and existing_class.faculty_id != faculty_id:
                    other_faculty = db.query(User).filter(User.id == existing_class.faculty_id).first()
                    faculty_name = f"{other_faculty.first_name} {other_faculty.last_name}" if other_faculty else "another faculty"
                    raise api_error(
                        409, "CLASS_ALREADY_CLAIMED",
                        f"Class '{subject.code} - {course_data['section']}' is already uploaded by {faculty_name}. "
                        "You cannot upload or modify a schedule owned by another faculty member."
                    )

                # Update existing class
                existing_class.start_time = start_time
                existing_class.end_time = end_time
                existing_class.room = course_data.get('venue', 'Room 324')
                if faculty_id:
                    existing_class.faculty_id = faculty_id
                
                db.commit()
                db.refresh(existing_class)
                updated_schedules.append(existing_class.id)
                current_class = existing_class
                logger.info("Updated class: %s - %s (%s)", subject.code, course_data['section'], course_data['day'])
            else:
                # Create new Class
                new_class = Class(
                    subject_id=subject.id,
                    faculty_id=faculty_id,
                    room=course_data.get('venue', 'Room 324'),
                    day_of_week=course_data['day'],
                    start_time=start_time,
                    end_time=end_time,
                    section=course_data['section'],
                    semester=current_semester,
                    academic_year=current_academic_year
                )
                db.add(new_class)
                db.commit()
                db.refresh(new_class)
                created_schedules.append(new_class.id)
                current_class = new_class
                logger.info("Created class: %s - %s (%s)", subject.code, course_data['section'], course_data['day'])
            
            # Create/Update Student Accounts and Enrollments
            # Get current enrollments for this class to avoid duplicates
            existing_enrollments = {
                e.student_id for e in db.query(Enrollment).filter(Enrollment.class_id == current_class.id).all()
            }
            
            # Get faculty's department to assign to students
            faculty_dept_id = None
            if faculty_id:
                faculty_user = db.query(User).filter(User.id == faculty_id).first()
                if faculty_user:
                    faculty_dept_id = faculty_user.department_id
            
            for student_data in course_data.get('enrolled_students', []):
                tupm_id = student_data['tupm_id']
                
                # Check if student user exists
                student_user = db.query(User).filter(User.tupm_id == tupm_id).first()
                
                if not student_user:
                    # Create new student account
                    name_parts = student_data['name'].split(',')
                    last_name = name_parts[0].strip() if len(name_parts) > 0 else "Student"
                    first_name = name_parts[1].strip() if len(name_parts) > 1 else "TUP"
                    
                    # Default password = surname (lowercase)
                    default_password = last_name.lower()
                    hashed_pw = bcrypt.hashpw(default_password.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')
                    
                    student_user = User(
                        email=None,  # Students set their own email via profile
                        password_hash=hashed_pw,
                        role=UserRole.STUDENT,
                        tupm_id=tupm_id,
                        first_name=first_name,
                        last_name=last_name,
                        section=course_data['section'],
                        verification_status=VerificationStatus.VERIFIED,
                        face_registered=False,
                        department_id=faculty_dept_id
                    )
                    db.add(student_user)
                    db.commit()
                    db.refresh(student_user)
                    
                    created_students.append(tupm_id)
                    logger.debug("Created student: %s", tupm_id)
                
                # Check if already enrolled in THIS class instance
                if student_user.id not in existing_enrollments:
                    enrollment = Enrollment(
                        class_id=current_class.id,
                        student_id=student_user.id
                    )
                    db.add(enrollment)
                    existing_enrollments.add(student_user.id) # Add to set to prevent double enrollment in *this* loop if duplicates exist in list
                    enrolled_count += 1
            
            db.commit()
        
        return {
            "message": "Schedule uploaded and processed successfully!",
            "filename": file.filename,
            "schedules_created": len(created_schedules),
            "schedules_updated": len(updated_schedules),
            "students_created": len(created_students),
            "enrollments_added": enrolled_count,
            "details": {
                "created_schedules": created_schedules,
                "updated_schedules": updated_schedules,
                "created_students": created_students
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Upload Error: %s", str(e), exc_info=True)
        db.rollback()
        raise api_error(500, "INTERNAL_ERROR", "An internal error occurred during processing.")


# ============================================
# Two-Step Upload: Parse Preview + Confirm
# ============================================

@router.post("/parse-schedule")
@limiter.limit("10/minute")
async def parse_schedule_preview(
    request: Request,
    file: UploadFile = File(...),
    faculty_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Step 1: Parse a COR/Schedule PDF and return the extracted data as JSON.
    Does NOT save anything to the database.
    Faculty reviews the preview and can modify the student list before confirming.
    """
    from services.pdf_parser import parse_schedule_pdf
    
    if not file.filename.endswith('.pdf'):
        raise api_error(400, "INVALID_FILE_TYPE", "Only PDF files are accepted")
    
    content = await file.read()
    logger.info("Parse-only schedule upload: %s (%d bytes)", file.filename, len(content))
    
    try:
        parsed_data = parse_schedule_pdf(content, faculty_id)
        
        if not parsed_data:
            raise api_error(400, "PARSE_FAILED", "Could not parse PDF. Please check the file format.")
        
        # Get active semester/academic year from faculty's existing classes
        active_semester = None
        active_academic_year = None
        if faculty_id:
            existing_class = db.query(Class).filter(Class.faculty_id == faculty_id).order_by(Class.created_at.desc()).first()
            if existing_class:
                active_semester = existing_class.semester
                active_academic_year = existing_class.academic_year
        
        return {
            "success": True,
            "filename": file.filename,
            "semester": active_semester or parsed_data.get('semester', '1st Semester'),
            "academic_year": active_academic_year or parsed_data.get('academic_year', '2025-2026'),
            "courses": parsed_data.get('courses', [])
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Parse Error for file %s", file.filename)
        raise api_error(500, "PARSE_ERROR", "Failed to parse PDF. Please check the file format.")


@router.post("/confirm-schedule", status_code=status.HTTP_201_CREATED)
def confirm_schedule(
    data: ConfirmScheduleRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2: Save the previewed (and possibly edited) schedule data to the database.
    Creates subjects, classes, student accounts, and enrollments.
    """
    import bcrypt

    # ── Validate semester/academic_year against department settings ──
    # This ensures uploads match the dept head's configured semester.
    # TO REVERT FOR TESTING: Comment out the block below (from "if data.faculty_id"
    # to the "raise api_error" line) to allow any semester/academic_year to be uploaded.
    if data.faculty_id:
        faculty_user = db.query(User).filter(User.id == data.faculty_id).first()
        if faculty_user and faculty_user.department_id:
            dept = db.query(Department).filter(Department.id == faculty_user.department_id).first()
            if dept:
                if dept.active_academic_year and data.academic_year != dept.active_academic_year:
                    raise api_error(
                        400, "AY_MISMATCH",
                        f"Academic year '{data.academic_year}' does not match the department setting "
                        f"'{dept.active_academic_year}'. Please contact your department head."
                    )
                if dept.active_semester and data.semester != dept.active_semester:
                    raise api_error(
                        400, "SEMESTER_MISMATCH",
                        f"Semester '{data.semester}' does not match the department setting "
                        f"'{dept.active_semester}'. Please contact your department head."
                    )

    created_schedules = []
    updated_schedules = []
    created_students = []
    enrolled_count = 0
    
    try:
        for course_data in data.courses:
            # Create/Get Subject
            subject = db.query(Subject).filter(Subject.code == course_data.subject_code).first()
            if not subject:
                subject = Subject(
                    code=course_data.subject_code,
                    title=course_data.subject_name,
                    units=course_data.units
                )
                db.add(subject)
                db.commit()
                db.refresh(subject)
            
            # Parse time strings to time objects
            start_time = None
            end_time = None
            if course_data.start_time != 'TBA':
                try:
                    from datetime import datetime as dt
                    start_time = dt.strptime(course_data.start_time, '%I:%M%p').time()
                except:
                    try:
                        start_time = dt.strptime(course_data.start_time, '%I:%M %p').time()
                    except:
                        pass
            if course_data.end_time != 'TBA':
                try:
                    from datetime import datetime as dt
                    end_time = dt.strptime(course_data.end_time, '%I:%M%p').time()
                except:
                    try:
                        end_time = dt.strptime(course_data.end_time, '%I:%M %p').time()
                    except:
                        pass
            
            # Check if Class ALREADY EXISTS
            existing_class = db.query(Class).filter(
                Class.subject_id == subject.id,
                Class.section == course_data.section,
                Class.day_of_week == course_data.day,
                Class.semester == data.semester,
                Class.academic_year == data.academic_year
            ).first()
            
            if existing_class:
                # ── Ownership Check ──
                if data.faculty_id and existing_class.faculty_id and existing_class.faculty_id != data.faculty_id:
                    other_faculty = db.query(User).filter(User.id == existing_class.faculty_id).first()
                    faculty_name = f"{other_faculty.first_name} {other_faculty.last_name}" if other_faculty else "another faculty"
                    raise api_error(
                        409, "CLASS_ALREADY_CLAIMED",
                        f"Class '{subject.code} - {course_data.section}' is already owned by {faculty_name}."
                    )

                existing_class.start_time = start_time
                existing_class.end_time = end_time
                existing_class.room = course_data.venue
                existing_class.faculty_id = data.faculty_id
                db.commit()
                db.refresh(existing_class)
                updated_schedules.append(existing_class.id)
                current_class = existing_class
            else:
                new_class = Class(
                    subject_id=subject.id,
                    faculty_id=data.faculty_id,
                    room=course_data.venue,
                    day_of_week=course_data.day,
                    start_time=start_time,
                    end_time=end_time,
                    section=course_data.section,
                    semester=data.semester,
                    academic_year=data.academic_year
                )
                db.add(new_class)
                db.commit()
                db.refresh(new_class)
                created_schedules.append(new_class.id)
                current_class = new_class
            
            # Create/Update Student Accounts and Enrollments
            existing_enrollments = {
                e.student_id for e in db.query(Enrollment).filter(Enrollment.class_id == current_class.id).all()
            }
            
            # Get faculty's department to assign to students
            faculty_dept_id = None
            if data.faculty_id:
                faculty_user = db.query(User).filter(User.id == data.faculty_id).first()
                if faculty_user:
                    faculty_dept_id = faculty_user.department_id
            
            for student_data in course_data.enrolled_students:
                tupm_id = student_data.tupm_id
                student_user = db.query(User).filter(User.tupm_id == tupm_id).first()
                
                if not student_user:
                    name_parts = student_data.name.split(',')
                    last_name = name_parts[0].strip() if len(name_parts) > 0 else "Student"
                    first_name = name_parts[1].strip() if len(name_parts) > 1 else "TUP"
                    
                    default_password = last_name.lower()
                    hashed_pw = bcrypt.hashpw(default_password.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')
                    
                    student_user = User(
                        email=None,  # Students set their own email via profile
                        password_hash=hashed_pw,
                        role=UserRole.STUDENT,
                        tupm_id=tupm_id,
                        first_name=first_name,
                        last_name=last_name,
                        section=course_data.section,
                        verification_status=VerificationStatus.VERIFIED,
                        face_registered=False,
                        department_id=faculty_dept_id
                    )
                    db.add(student_user)
                    db.commit()
                    db.refresh(student_user)
                    created_students.append(tupm_id)
                
                if student_user.id not in existing_enrollments:
                    enrollment = Enrollment(
                        class_id=current_class.id,
                        student_id=student_user.id
                    )
                    db.add(enrollment)
                    existing_enrollments.add(student_user.id)
                    enrolled_count += 1
            
            db.commit()
        
        return {
            "message": "Schedule confirmed and saved successfully!",
            "schedules_created": len(created_schedules),
            "schedules_updated": len(updated_schedules),
            "students_created": len(created_students),
            "enrollments_added": enrolled_count
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Confirm Schedule Error: %s", str(e), exc_info=True)
        db.rollback()
        raise api_error(500, "INTERNAL_ERROR", "An internal error occurred while saving schedule.")


# ============================================
# Student Management (Add/Remove from Class)
# ============================================

@router.get("/search-students")
def search_students(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Search for verified students by name or TUPM ID."""
    search_term = f"%{q}%"
    students = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.verification_status == VerificationStatus.VERIFIED,
        (
            User.first_name.ilike(search_term) |
            User.last_name.ilike(search_term) |
            User.tupm_id.ilike(search_term)
        )
    ).limit(20).all()
    
    return [
        {
            "id": s.id,
            "tupm_id": s.tupm_id,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "section": s.section
        }
        for s in students
    ]


@router.post("/class/{class_id}/add-student")
def add_student_to_class(
    class_id: int,
    data: AddStudentRequest,
    db: Session = Depends(get_db)
):
    """Add a student to a class enrollment."""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")
    
    student = db.query(User).filter(User.id == data.student_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise api_error(404, "STUDENT_NOT_FOUND", "Student not found")
    
    # Check duplicate
    existing = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.student_id == data.student_id
    ).first()
    if existing:
        raise api_error(409, "ALREADY_ENROLLED", "Student is already enrolled in this class")
    
    enrollment = Enrollment(class_id=class_id, student_id=data.student_id)
    db.add(enrollment)
    db.commit()
    
    return {
        "message": "Student added successfully",
        "student": {
            "id": student.id,
            "tupm_id": student.tupm_id,
            "first_name": student.first_name,
            "last_name": student.last_name
        }
    }


@router.delete("/class/{class_id}/remove-student/{student_id}")
def remove_student_from_class(
    class_id: int,
    student_id: int,
    db: Session = Depends(get_db)
):
    """Remove a student from a class enrollment."""
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.student_id == student_id
    ).first()
    
    if not enrollment:
        raise api_error(404, "ENROLLMENT_NOT_FOUND", "Student is not enrolled in this class")
    
    db.delete(enrollment)
    db.commit()
    
    return {"message": "Student removed from class successfully"}


@router.get("/class-details/{schedule_id}")
def get_class_details_by_schedule_id(
    schedule_id: int,
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD). Defaults to today."),
    db: Session = Depends(get_db)
):
    """
    Get class details including student attendance list.
    Returns ENTRY (Time In) and EXIT (Time Out) per student,
    with proper status derivation from the attendance state machine.
    """
    from sqlalchemy.orm import joinedload
    from datetime import date as date_type

    cls = db.query(Class).options(joinedload(Class.subject)).filter(Class.id == schedule_id).first()
    if not cls:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")

    # Determine target date
    if date:
        try:
            target_date = date_type.fromisoformat(date)
        except ValueError:
            raise api_error(400, "INVALID_DATE", "Date must be YYYY-MM-DD format")
    else:
        target_date = None  # Will use DB's current_date()

    # Get enrolled students via eager loading
    enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.student)
    ).filter(Enrollment.class_id == schedule_id).all()

    if not enrollments:
        return []

    student_ids = [e.student_id for e in enrollments]

    # Batch Query: Get ALL attendance logs for enrolled students in this class on target date
    date_filter = (
        func.date(AttendanceLog.timestamp) == target_date
        if target_date
        else func.date(AttendanceLog.timestamp) == func.current_date()
    )
    all_logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id.in_(student_ids),
        AttendanceLog.class_id == schedule_id,
        date_filter
    ).order_by(AttendanceLog.timestamp.asc()).all()

    # Group logs by user_id — keep all actions for state derivation
    from collections import defaultdict
    logs_by_user = defaultdict(list)
    for log in all_logs:
        logs_by_user[log.user_id].append(log)

    students = []
    for enrollment in enrollments:
        student = enrollment.student
        if not student:
            continue

        user_logs = logs_by_user.get(student.id, [])
        entry_log = None
        exit_log = None
        last_action = None
        is_late = False

        for log in user_logs:
            if log.action == AttendanceAction.ENTRY and entry_log is None:
                entry_log = log
                is_late = log.is_late or False
            elif log.action == AttendanceAction.EXIT:
                exit_log = log
            last_action = log.action

        # Derive status from last action in the state machine
        if last_action is None:
            status = "Absent"
        elif last_action == AttendanceAction.ENTRY or last_action == AttendanceAction.BREAK_IN:
            status = "Late" if is_late else "Present"
        elif last_action == AttendanceAction.BREAK_OUT:
            status = "On Break"
        elif last_action == AttendanceAction.EXIT:
            status = "Left" if is_late else "Present"
        else:
            status = "Present"

        # Determine remarks
        remarks = ""
        if entry_log and entry_log.remarks:
            remarks = entry_log.remarks
        elif is_late:
            remarks = "Late"

        students.append({
            "user_id": student.id,
            "firstName": student.first_name,
            "lastName": student.last_name,
            "tupm_id": student.tupm_id,
            "timeIn": entry_log.timestamp.strftime("%I:%M %p") if entry_log else "---",
            "timeOut": exit_log.timestamp.strftime("%I:%M %p") if exit_log else "---",
            "status": status,
            "is_late": is_late,
            "remarks": remarks,
            "entry_log_id": entry_log.id if entry_log else None,
            "exit_log_id": exit_log.id if exit_log else None,
        })

    return students


# ============================================
# Attendance Edit Endpoint
# ============================================

class AttendanceEditRequest(BaseModel):
    """Schema for editing an attendance record's time."""
    new_time: str  # "HH:MM" 24-hour format
    remarks: Optional[str] = None


@router.put("/attendance/{log_id}")
def update_attendance_time(
    log_id: int,
    data: AttendanceEditRequest,
    db: Session = Depends(get_db)
):
    """
    Update an attendance log's timestamp (time portion only).
    Auto-recomputes is_late based on the class's start_time and late_threshold_minutes.
    Only faculty who own the class can edit.
    """
    from datetime import time as time_type, timedelta

    log = db.query(AttendanceLog).filter(AttendanceLog.id == log_id).first()
    if not log:
        raise api_error(404, "LOG_NOT_FOUND", "Attendance log not found")

    # Validate the class exists and get schedule
    cls = db.query(Class).filter(Class.id == log.class_id).first()
    if not cls:
        raise api_error(404, "CLASS_NOT_FOUND", "Associated class not found")

    # Parse new time
    try:
        parts = data.new_time.strip().split(":")
        new_hour, new_minute = int(parts[0]), int(parts[1])
        new_time = time_type(new_hour, new_minute)
    except (ValueError, IndexError):
        raise api_error(400, "INVALID_TIME", "Time must be in HH:MM format (24-hour)")

    # Update timestamp — keep original date, replace time
    original_date = log.timestamp.date()
    new_timestamp = datetime.combine(original_date, new_time)
    if log.timestamp.tzinfo:
        new_timestamp = new_timestamp.replace(tzinfo=log.timestamp.tzinfo)
    log.timestamp = new_timestamp

    # Auto-recompute is_late for ENTRY logs
    if log.action == AttendanceAction.ENTRY and cls.start_time:
        try:
            class_start = datetime.strptime(cls.start_time, "%H:%M").time()
            threshold = cls.late_threshold_minutes or 0
            from datetime import timedelta as td
            grace_limit = (datetime.combine(original_date, class_start) + td(minutes=threshold)).time()
            log.is_late = new_time > grace_limit
        except (ValueError, TypeError):
            logger.warning("Could not parse class start_time '%s' for late computation", cls.start_time)

    # Update remarks if provided
    if data.remarks is not None:
        log.remarks = data.remarks

    db.commit()
    db.refresh(log)

    logger.info(
        "ATTENDANCE | edited log_id=%d user_id=%d new_time=%s is_late=%s",
        log.id, log.user_id, data.new_time, log.is_late
    )

    return {
        "success": True,
        "log_id": log.id,
        "new_timestamp": log.timestamp.strftime("%I:%M %p"),
        "is_late": log.is_late,
    }


# ============================================
# Session Exception Endpoints
# ============================================

class SessionExceptionCreate(BaseModel):
    class_id: int
    session_dates: List[str]  # List of date strings "YYYY-MM-DD"
    exception_type: str       # "online", "cancelled", "onsite", "holiday"
    reason: Optional[str] = None


class SessionExceptionResponse(BaseModel):
    id: int
    class_id: int
    session_date: str
    exception_type: str
    reason: Optional[str]
    created_at: Optional[str]
    
    class Config:
        from_attributes = True


@router.post("/session-exceptions")
def create_session_exceptions(
    data: SessionExceptionCreate,
    db: Session = Depends(get_db)
):
    """
    Create session exceptions for one or more dates.
    Used when a class is cancelled, moved online, etc.
    """
    class_obj = db.query(Class).filter(Class.id == data.class_id).first()
    if not class_obj:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")
    
    # Map string to enum
    type_map = {
        "online": ExceptionType.ONLINE,
        "cancelled": ExceptionType.CANCELLED,
        "onsite": ExceptionType.ONSITE,
        "holiday": ExceptionType.HOLIDAY
    }
    exception_type = type_map.get(data.exception_type.lower(), ExceptionType.ONSITE)
    
    created_count = 0
    for date_str in data.session_dates:
        try:
            session_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            continue
        
        # Check if exception already exists for this date
        existing = db.query(SessionException).filter(
            SessionException.class_id == data.class_id,
            SessionException.session_date == session_date
        ).first()
        
        if existing:
            # Update existing
            existing.exception_type = exception_type
            existing.reason = data.reason
        else:
            # Create new
            new_exception = SessionException(
                class_id=data.class_id,
                session_date=session_date,
                exception_type=exception_type,
                reason=data.reason
            )
            db.add(new_exception)
            created_count += 1
    
    db.commit()
    return {"message": f"Created/updated {len(data.session_dates)} session exception(s)"}


@router.get("/session-exceptions/{class_id}", response_model=List[SessionExceptionResponse])
def get_session_exceptions(class_id: int, db: Session = Depends(get_db)):
    """Get all session exceptions for a class"""
    exceptions = db.query(SessionException).filter(
        SessionException.class_id == class_id
    ).all()
    
    return [
        SessionExceptionResponse(
            id=e.id,
            class_id=e.class_id,
            session_date=str(e.session_date),
            exception_type=e.exception_type.value,
            reason=e.reason,
            created_at=str(e.created_at) if e.created_at else None
        )
        for e in exceptions
    ]


@router.get("/session-exceptions-by-faculty/{faculty_id}")
def get_all_session_exceptions_for_faculty(
    faculty_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all session exceptions for all classes taught by a faculty.
    Useful for generating the calendar view with cancelled/online sessions marked.
    """
    # Get all class IDs for this faculty
    class_ids = [c.id for c in db.query(Class).filter(Class.faculty_id == faculty_id).all()]
    
    if not class_ids:
        return []
    
    query = db.query(SessionException).filter(SessionException.class_id.in_(class_ids))
    
    # Optional date filtering
    if month and year:
        from sqlalchemy import extract
        query = query.filter(
            extract('month', SessionException.session_date) == month,
            extract('year', SessionException.session_date) == year
        )
    
    query = query.offset(skip).limit(limit)
    exceptions = query.all()
    
    return [
        {
            "id": e.id,
            "class_id": e.class_id,
            "session_date": str(e.session_date),
            "exception_type": e.exception_type.value,
            "reason": e.reason
        }
        for e in exceptions
    ]


# ============================================
# Late Threshold Management
# ============================================

class LateThresholdUpdate(BaseModel):
    late_threshold_minutes: int


@router.put("/class/{class_id}/late-threshold")
def update_class_late_threshold(
    class_id: int,
    data: LateThresholdUpdate,
    db: Session = Depends(get_db)
):
    """
    Update the late threshold (minutes after start_time) for a class.
    Only the faculty who teaches this class (or HEAD of the department) can update.
    """
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")

    if data.late_threshold_minutes < 1 or data.late_threshold_minutes > 120:
        raise api_error(
            status_code=400,
            code="INVALID_THRESHOLD",
            message="Late threshold must be between 1 and 120 minutes"
        )

    cls.late_threshold_minutes = data.late_threshold_minutes
    db.commit()

    return {
        "success": True,
        "class_id": class_id,
        "late_threshold_minutes": data.late_threshold_minutes,
        "message": f"Late threshold set to {data.late_threshold_minutes} minutes"
    }


@router.get("/class/{class_id}/late-threshold")
def get_class_late_threshold(class_id: int, db: Session = Depends(get_db)):
    """Get the current late threshold for a class."""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")

    return {
        "class_id": class_id,
        "late_threshold_minutes": cls.late_threshold_minutes or 15
    }


# ============================================
# Live Room Status Endpoints
# ============================================

def _build_room_status(db: Session, classes, today_start):
    """
    Build live room status data for a set of classes.
    Returns list of room dicts with present/on_break student lists.
    Uses batch queries — no N+1.
    """
    from sqlalchemy.orm import joinedload

    if not classes:
        return []

    class_ids = [c.id for c in classes]

    # Batch query: all today's attendance logs for these classes
    logs = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.user))
        .filter(
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.timestamp >= today_start,
        )
        .order_by(AttendanceLog.timestamp.desc())
        .all()
    )

    # Group by (class_id, user_id) — keep only the latest log per user per class
    latest_by_user = {}
    for log in logs:
        key = (log.class_id, log.user_id)
        if key not in latest_by_user:
            latest_by_user[key] = log

    # Build a room -> capacity map from devices for overcrowding detection
    room_names = set(cls.room for cls in classes if cls.room)
    device_capacities = {}
    if room_names:
        capacity_rows = (
            db.query(Device.room, Device.room_capacity)
            .filter(Device.room.in_(room_names), Device.room_capacity.isnot(None))
            .all()
        )
        for room, cap in capacity_rows:
            device_capacities[room] = cap

    # Build room data per class
    rooms = []
    for cls in classes:
        subject = cls.subject
        faculty = cls.faculty

        present = []
        on_break = []

        for (cid, uid), log in latest_by_user.items():
            if cid != cls.id:
                continue
            user = log.user
            name = f"{user.first_name} {user.last_name}" if user else "Unknown"
            if log.action in (AttendanceAction.ENTRY, AttendanceAction.BREAK_IN):
                present.append({"name": name, "id": uid})
            elif log.action == AttendanceAction.BREAK_OUT:
                on_break.append({"name": name, "id": uid})
            # EXIT = no longer in room, skip

        room_capacity = device_capacities.get(cls.room, 50)
        present_count = len(present)

        rooms.append({
            "room": cls.room or "N/A",
            "class_id": cls.id,
            "subject_code": subject.code if subject else "N/A",
            "subject_title": subject.title if subject else "",
            "faculty_name": f"{faculty.first_name} {faculty.last_name}" if faculty else "N/A",
            "start_time": str(cls.start_time) if cls.start_time else None,
            "end_time": str(cls.end_time) if cls.end_time else None,
            "present": present,
            "on_break": on_break,
            "present_count": present_count,
            "break_count": len(on_break),
            "room_capacity": room_capacity,
            "is_overcrowded": present_count > room_capacity,
        })

    return rooms


@router.get("/live-room-status/{user_id}")
def get_live_room_status(user_id: int, db: Session = Depends(get_db)):
    """
    Get live room status for all classrooms a faculty member teaches.
    Returns dot-representation data: present students and on-break students per room.
    Only shows classes scheduled for today.
    """
    from sqlalchemy.orm import joinedload

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    today = datetime.now().strftime('%A')
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Get today's classes for this faculty with subject and faculty eagerly loaded
    classes = (
        db.query(Class)
        .options(joinedload(Class.subject), joinedload(Class.faculty))
        .filter(Class.faculty_id == user_id, Class.day_of_week == today)
        .all()
    )

    # Only include classes in rooms that have an active device (camera installed)
    device_rooms = set(
        r[0] for r in db.query(Device.room)
        .filter(Device.status == DeviceStatus.ACTIVE)
        .distinct()
        .all()
    )
    classes_with_device = [c for c in classes if c.room in device_rooms]

    rooms = _build_room_status(db, classes_with_device, today_start)
    return {"rooms": rooms}


@router.get("/live-room-status-dept/{dept_id}")
def get_live_room_status_dept(dept_id: int, db: Session = Depends(get_db)):
    """
    Get live room status for ALL classrooms in a department.
    Used by dept heads to monitor all rooms with active schedules + cameras.
    """
    from sqlalchemy.orm import joinedload

    today = datetime.now().strftime('%A')
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Get all today's classes for faculty in this department
    dept_faculty_ids = [
        uid for (uid,) in db.query(User.id)
        .filter(User.department_id == dept_id, User.role.in_([UserRole.FACULTY, UserRole.HEAD]))
        .all()
    ]

    if not dept_faculty_ids:
        return {"rooms": []}

    classes = (
        db.query(Class)
        .options(joinedload(Class.subject), joinedload(Class.faculty))
        .filter(Class.faculty_id.in_(dept_faculty_ids), Class.day_of_week == today)
        .all()
    )

    # Only include rooms that have an active device
    device_rooms = set(
        r[0] for r in db.query(Device.room)
        .filter(Device.status == DeviceStatus.ACTIVE)
        .distinct()
        .all()
    )
    classes_with_device = [c for c in classes if c.room in device_rooms]

    rooms = _build_room_status(db, classes_with_device, today_start)
    return {"rooms": rooms}


@router.get("/personal-live-status/{user_id}")
def get_personal_live_status(user_id: int, db: Session = Depends(get_db)):
    """
    Get personal live status for any user (faculty, dept head, etc).
    Returns current state (PRESENT/BREAK/EXITED/IDLE) with room and class info.
    Reusable endpoint similar to student live-status.
    """
    from sqlalchemy.orm import joinedload

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Get the latest attendance log today
    latest_log = (
        db.query(AttendanceLog)
        .options(joinedload(AttendanceLog.class_).joinedload(Class.subject))
        .filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.timestamp >= today_start,
        )
        .order_by(AttendanceLog.timestamp.desc())
        .first()
    )

    if not latest_log:
        return {
            "status": "IDLE",
            "status_color": "grey",
            "status_text": "No activity today",
            "room": None,
            "subject_code": None,
            "subject_title": None,
            "last_action": None,
            "last_timestamp": None,
        }

    action = latest_log.action
    cls = latest_log.class_
    subject = cls.subject if cls else None

    status_map = {
        AttendanceAction.ENTRY: ("PRESENT", "#2E7D32", "Currently in class"),
        AttendanceAction.BREAK_IN: ("PRESENT", "#2E7D32", "Returned from break"),
        AttendanceAction.BREAK_OUT: ("BREAK", "#F9A825", "On break"),
        AttendanceAction.EXIT: ("EXITED", "grey", "Exited class"),
    }
    info = status_map.get(action, ("IDLE", "grey", "Unknown"))

    return {
        "status": info[0],
        "status_color": info[1],
        "status_text": info[2],
        "room": cls.room if cls else None,
        "subject_code": subject.code if subject else None,
        "subject_title": subject.title if subject else None,
        "last_action": action.value,
        "last_timestamp": str(latest_log.timestamp),
    }
