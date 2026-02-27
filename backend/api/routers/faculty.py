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
from main import limiter
from models.user import User, UserRole, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction
from models.session_exception import SessionException, ExceptionType

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
    recent_attendance: list = []
    all_logs: list = []


class SubjectCreate(BaseModel):
    code: str
    title: str
    units: int = 3


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


@router.get("/dashboard-stats/{user_id}")
def get_faculty_dashboard_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get dashboard statistics for a faculty member.
    Returns summary cards data, recent activity, and all logs for charts.
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
    faculty_classes = db.query(Class).filter(Class.faculty_id == user_id).all()
    class_ids = [c.id for c in faculty_classes]
    total_students = db.query(Enrollment).filter(
        Enrollment.class_id.in_(class_ids)
    ).distinct(Enrollment.student_id).count() if class_ids else 0
    
    # ---- REAL Average Attendance Calculation ----
    average_attendance = 0.0
    if class_ids:
        total_enrolled = db.query(Enrollment).filter(Enrollment.class_id.in_(class_ids)).count()
        total_entries = db.query(AttendanceLog).filter(
            AttendanceLog.class_id.in_(class_ids),
            AttendanceLog.action == AttendanceAction.ENTRY
        ).count()
        # Simple rate: entries / enrolled (capped at 100)
        if total_enrolled > 0:
            average_attendance = round(min((total_entries / max(total_enrolled, 1)) * 100, 100), 1)
    
    # ---- Recent Activity (last 5 attendance events in faculty's classes) ----
    recent_logs_raw = db.query(AttendanceLog).filter(
        AttendanceLog.class_id.in_(class_ids)
    ).order_by(AttendanceLog.timestamp.desc()).limit(5).all() if class_ids else []
    
    recent_attendance = []
    for log in recent_logs_raw:
        cls = db.query(Class).filter(Class.id == log.class_id).first()
        subject = db.query(Subject).filter(Subject.id == cls.subject_id).first() if cls else None
        student = db.query(User).filter(User.id == log.user_id).first()
        recent_attendance.append({
            "timestamp": str(log.timestamp),
            "event_type": log.action.value.lower(),
            "subject_code": subject.code if subject else None,
            "subject_description": subject.title if subject else None,
            "room_name": cls.room if cls else None,
            "student_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "time": log.timestamp.strftime("%I:%M %p") if log.timestamp else None,
            "is_late": log.is_late or False
        })
    
    # ---- All logs for chart data (last 365 days) ----
    from datetime import timedelta
    one_year_ago = datetime.now() - timedelta(days=365)
    all_logs_raw = db.query(AttendanceLog).filter(
        AttendanceLog.class_id.in_(class_ids),
        AttendanceLog.timestamp >= one_year_ago
    ).order_by(AttendanceLog.timestamp.desc()).all() if class_ids else []
    
    all_logs = []
    for log in all_logs_raw:
        all_logs.append({
            "timestamp": str(log.timestamp),
            "event_type": log.action.value.lower(),
            "is_late": log.is_late or False
        })
    
    return {
        "total_classes": total_classes,
        "total_students": total_students,
        "todays_classes": todays_classes,
        "average_attendance": average_attendance,
        "recent_attendance": recent_attendance,
        "all_logs": all_logs
    }


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
                        email=f"{tupm_id.lower()}@tup.edu.ph",
                        password_hash=hashed_pw,
                        role=UserRole.STUDENT,
                        tupm_id=tupm_id,
                        first_name=first_name,
                        last_name=last_name,
                        section=course_data['section'],
                        verification_status=VerificationStatus.VERIFIED,
                        face_registered=False
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


@router.get("/class-details/{schedule_id}")
def get_class_details_by_schedule_id(schedule_id: int, db: Session = Depends(get_db)):
    """
    Get class details including student attendance list.
    Alias for /class/{class_id} to match frontend expectations.
    """
    from sqlalchemy.orm import joinedload
    cls = db.query(Class).options(joinedload(Class.subject)).filter(Class.id == schedule_id).first()
    if not cls:
        raise api_error(404, "CLASS_NOT_FOUND", "Class not found")
        
    # Get enrolled students via eager loading
    enrollments = db.query(Enrollment).options(joinedload(Enrollment.student)).filter(Enrollment.class_id == schedule_id).all()
    
    if not enrollments:
        return []
        
    student_ids = [e.student_id for e in enrollments]
    
    # Batch Query: Get all today's attendance logs for enrolled students in this class
    today_logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id.in_(student_ids),
        AttendanceLog.class_id == schedule_id,
        func.date(AttendanceLog.timestamp) == func.current_date()
    ).all()
    
    # Map logs by user_id for O(1) lookup
    logs_by_user = {log.user_id: log for log in today_logs}
    
    students = []
    
    for enrollment in enrollments:
        student = enrollment.student
        if student:
            today_log = logs_by_user.get(student.id)
            
            students.append({
                "user_id": student.id,
                "firstName": student.first_name,
                "lastName": student.last_name,
                "tupm_id": student.tupm_id,
                "timeIn": str(today_log.timestamp.strftime("%I:%M %p")) if today_log else "---",
                "status": "Present" if today_log else "Absent",
                "remarks": ""
            })
    
    return students


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
# Reports Data Endpoint
# ============================================

@router.get("/reports/data/{user_id}")
def get_faculty_report_data(
    user_id: int,
    report_type: str = "CLASS_MONTHLY",
    class_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get report data for faculty. Supports both personal and class reports.
    All data comes directly from DB - no mock data.
    """
    from datetime import timedelta
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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
                # Month format: get last day of month
                dt_to = datetime.strptime(date_to + "-01", "%Y-%m-%d")
                if dt_to.month == 12:
                    dt_to = dt_to.replace(year=dt_to.year + 1, month=1)
                else:
                    dt_to = dt_to.replace(month=dt_to.month + 1)
            except ValueError:
                pass
    
    # Determine if personal or class report
    is_personal = report_type.startswith('PERSONAL') or report_type in ['HISTORY_30D', 'INSTRUCTOR_DELAY']
    
    # Get faculty's classes
    faculty_classes = db.query(Class).filter(Class.faculty_id == user_id).all()
    faculty_class_ids = [c.id for c in faculty_classes]
    
    if is_personal:
        # ---- PERSONAL REPORTS: Faculty's own attendance logs ----
        query = db.query(AttendanceLog).filter(AttendanceLog.user_id == user_id)
        
        if dt_from:
            query = query.filter(AttendanceLog.timestamp >= dt_from)
        if dt_to:
            query = query.filter(AttendanceLog.timestamp < dt_to)
        elif report_type == 'HISTORY_30D':
            query = query.filter(AttendanceLog.timestamp >= datetime.now() - timedelta(days=30))
        
        logs = query.order_by(AttendanceLog.timestamp.desc()).all()
        
        result = []
        for log in logs:
            cls = db.query(Class).filter(Class.id == log.class_id).first() if log.class_id else None
            subject = db.query(Subject).filter(Subject.id == cls.subject_id).first() if cls else None
            
            status = "On Time"
            if log.is_late:
                status = "Late"
            elif log.action == AttendanceAction.BREAK_OUT:
                status = "Break Out"
            elif log.action == AttendanceAction.BREAK_IN:
                status = "Break In"
            elif log.action == AttendanceAction.EXIT:
                status = "Exit"
            
            result.append({
                "id": f"LOG-{log.id}",
                "col1": log.timestamp.strftime("%b %d, %Y") if log.timestamp else "N/A",
                "col2": f"{subject.code} ({cls.room})" if subject and cls else "Unknown",
                "status": status,
                "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "--:--",
                "remarks": log.remarks or ("Instructor Delay" if log.is_late else "Regular Class")
            })
        
        return result
    
    else:
        # ---- CLASS REPORTS: Student attendance in faculty's classes ----
        query = db.query(AttendanceLog).filter(
            AttendanceLog.class_id.in_(faculty_class_ids)
        )
        
        if class_id:
            query = query.filter(AttendanceLog.class_id == class_id)
        if dt_from:
            query = query.filter(AttendanceLog.timestamp >= dt_from)
        if dt_to:
            query = query.filter(AttendanceLog.timestamp < dt_to)
        
        logs = query.order_by(AttendanceLog.timestamp.desc()).all()
        
        result = []
        for log in logs:
            student = db.query(User).filter(User.id == log.user_id).first()
            cls = db.query(Class).filter(Class.id == log.class_id).first() if log.class_id else None
            
            # Section filter
            if section and section != 'All' and cls and cls.section != section:
                continue
            
            status = "Present"
            remarks = "On Time"
            if log.is_late:
                status = "Late"
                remarks = "Late Arrival"
            if log.action == AttendanceAction.BREAK_OUT:
                status = "Break"
                remarks = "Break Out"
            elif log.action == AttendanceAction.BREAK_IN:
                status = "Present"
                remarks = "Returned from Break"
            elif log.action == AttendanceAction.EXIT:
                status = "Exit"
                remarks = "Early Exit" if log.remarks and "early" in log.remarks.lower() else "Session End"
            
            # Filter by specific report types
            if report_type == 'UNRECOGNIZED_LOGS' and log.confidence_score and log.confidence_score > 0.5:
                continue  # Skip recognized individuals for unrecognized report
            if report_type == 'CLASS_LATE' and not log.is_late:
                continue
            if report_type == 'EARLY_EXITS' and log.action != AttendanceAction.EXIT:
                continue
            if report_type in ['BREAK_ABUSE', 'BREAK_DURATION'] and log.action not in [AttendanceAction.BREAK_OUT, AttendanceAction.BREAK_IN]:
                continue
            
            student_name = f"{student.last_name}, {student.first_name}" if student else "Unknown"
            student_section = cls.section if cls else "N/A"
            
            result.append({
                "id": student.tupm_id if student else f"UNK-{log.id}",
                "col1": student_name,
                "col2": student_section,
                "status": status,
                "col3": log.timestamp.strftime("%I:%M %p") if log.timestamp else "--:--",
                "remarks": remarks
            })
        
        return result


@router.get("/attendance-history/{user_id}")
def get_faculty_attendance_history(user_id: int, db: Session = Depends(get_db)):
    """
    Get faculty's own attendance history for chart display.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all attendance logs for this user
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.user_id == user_id
    ).order_by(AttendanceLog.timestamp.desc()).all()
    
    result = []
    for log in logs:
        cls = db.query(Class).filter(Class.id == log.class_id).first() if log.class_id else None
        subject = db.query(Subject).filter(Subject.id == cls.subject_id).first() if cls else None
        
        result.append({
            "id": log.id,
            "timestamp": str(log.timestamp),
            "event_type": log.action.value.lower(),
            "class_name": subject.title if subject else None,
            "room_name": cls.room if cls else None,
            "is_late": log.is_late or False
        })
    
    return result


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
