"""
Faculty Router - Faculty-specific endpoints
Schedule, dashboard, class management, COR upload
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from db.database import get_db
from models.user import User, UserRole, VerificationStatus
from models.class_ import Class
from models.subject import Subject
from models.enrollment import Enrollment
from models.attendance_log import AttendanceLog, AttendanceAction
from models.session_exception import SessionException, ExceptionType

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
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")
    
    # Get classes taught by this faculty
    classes = db.query(Class).filter(Class.faculty_id == user_id).all()
    
    today = datetime.now().strftime('%A')
    result = []
    
    for cls in classes:
        # Get subject info
        subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
        
        # Count enrolled students
        total_students = db.query(Enrollment).filter(Enrollment.class_id == cls.id).count()
        
        # Count present today
        present_count = db.query(AttendanceLog).filter(
            AttendanceLog.class_id == cls.id,
            AttendanceLog.action == AttendanceAction.ENTRY,
            func.date(AttendanceLog.timestamp) == func.current_date()
        ).distinct(AttendanceLog.user_id).count()
        
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
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")
    
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
        raise HTTPException(status_code=409, detail="Subject code already exists")
    
    new_subject = Subject(
        code=subject_data.code,
        title=subject_data.title,
        units=subject_data.units
    )
    
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    print(f"✅ Created subject: {new_subject.code} - {new_subject.title}")
    return {"message": "Subject created", "id": new_subject.id}


@router.get("/class/{class_id}")
def get_class_details(class_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific class.
    Includes enrolled students and attendance logs.
    """
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
    
    # Get enrolled students
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == class_id).all()
    students = []
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
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
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return empty list for now - file upload tracking will be added in future phase
    return []


@router.post("/upload-schedule", status_code=status.HTTP_201_CREATED)
async def upload_schedule(
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
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    # Read file content
    content = await file.read()
    
    print(f"📤 Received schedule upload: {file.filename} ({len(content)} bytes)")
    
    try:
        # Parse PDF
        parsed_data = parse_schedule_pdf(content, faculty_id)
        
        if not parsed_data:
            raise HTTPException(status_code=400, detail="Could not parse PDF")
        
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
                print(f"   🔄 Updated class: {subject.code} - {course_data['section']} ({course_data['day']})")
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
                print(f"   ✅ Created class: {subject.code} - {course_data['section']} ({course_data['day']})")
            
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
                    print(f"      Created student: {tupm_id}")
                
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
        print(f"❌ Upload Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/class-details/{schedule_id}")
def get_class_details_by_schedule_id(schedule_id: int, db: Session = Depends(get_db)):
    """
    Get class details including student attendance list.
    Alias for /class/{class_id} to match frontend expectations.
    """
    cls = db.query(Class).filter(Class.id == schedule_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    subject = db.query(Subject).filter(Subject.id == cls.subject_id).first()
    
    # Get enrolled students with today's attendance
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == schedule_id).all()
    students = []
    
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        if student:
            # Check if student has attendance log for today
            today_log = db.query(AttendanceLog).filter(
                AttendanceLog.user_id == student.id,
                AttendanceLog.class_id == schedule_id,
                func.date(AttendanceLog.timestamp) == func.current_date()
            ).first()
            
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
        raise HTTPException(status_code=404, detail="Class not found")
    
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
