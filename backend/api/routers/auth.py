"""
Auth Router - Login, Registration, and Token endpoints.
Issues JWT access + refresh tokens on login per FRAMES_SECURITY_RULES.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
import logging

from db.database import get_db
from core.errors import api_error
from core.limiter import limiter
from core.auth import create_access_token, create_refresh_token, verify_token
from models.user import User, UserRole, VerificationStatus
from models.facial_profile import FacialProfile
from schemas.user import (
    UserLogin, 
    UserRegister, 
    UserResponse, 
    LoginResponse,
    MessageResponse,
    ErrorResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email/TUPM ID and password.
    Returns user data on success.
    """
    # Find user by email OR TUPM ID
    user = db.query(User).filter(
        (User.email == credentials.email) | (User.tupm_id == credentials.email)
    ).first()
    
    if not user:
        raise api_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User not found"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_CREDENTIALS",
            message="Invalid email or password"
        )
    
    # Generate JWT tokens per FRAMES_SECURITY_RULES §1.1
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    logger.info("AUTH | login user=%d success=True", user.id)
    
    return LoginResponse(
        message="Login Successful",
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            middle_name=user.middle_name,
            role=user.role.value,
            tupm_id=user.tupm_id,
            department_id=user.department_id,
            program_id=user.program_id,
            face_registered=user.face_registered,
            verification_status=user.verification_status.value,
            year_level=user.year_level,
            section=user.section,
            created_at=user.created_at,
            last_active=user.last_active
        )
    )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user (Faculty/Head).
    Students are created via faculty COR upload.
    """
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise api_error(
            status_code=status.HTTP_409_CONFLICT,
            code="EMAIL_EXISTS",
            message="Email already exists"
        )
    
    # Check if TUPM ID already exists
    existing_tupm = db.query(User).filter(User.tupm_id == user_data.tupm_id).first()
    if existing_tupm:
        raise api_error(
            status_code=status.HTTP_409_CONFLICT,
            code="TUPM_ID_EXISTS",
            message="TUPM ID already exists"
        )
    
    # Hash password
    hashed_pw = hash_password(user_data.password)
    
    # Determine verification status (Admin = auto verified)
    verification = VerificationStatus.VERIFIED if user_data.role == UserRole.ADMIN else VerificationStatus.PENDING
    
    # Convert string role to enum
    role_enum = UserRole[user_data.role.upper()] if isinstance(user_data.role, str) else user_data.role
    
    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=hashed_pw,
        tupm_id=user_data.tupm_id,
        role=role_enum,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        middle_name=user_data.middle_name,
        department_id=user_data.department_id,
        program_id=user_data.program_id,
        verification_status=verification,
        face_registered=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info("AUTH | registered user=%d role=%s", new_user.id, new_user.role.value)
    
    return MessageResponse(message=f"Registration Successful! User ID: {new_user.id}")


@router.post("/validate-face")
@limiter.limit("5/minute")
def validate_face(request: Request, data: dict):
    """
    Validate if a face is present in the captured image.
    This is a placeholder - real face detection will be added in Phase 4.
    For now, just return valid=True to allow registration flow.
    """
    face_capture = data.get("faceCapture")
    
    if not face_capture:
        return {"valid": False, "message": "No image data received"}
    
    # TODO: Add actual face detection with TFLite in Phase 4
    # For now, just validate that we received base64 image data
    if face_capture.startswith("data:image"):
        return {"valid": True, "message": "Face detected successfully"}
    
    return {"valid": False, "message": "Invalid image format"}


# --- Registration Dropdown Data ---

class DepartmentRequest(BaseModel):
    name: str
    code: str


@router.post("/departments", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def find_or_create_department(
    request: Request,
    data: DepartmentRequest,
    db: Session = Depends(get_db),
):
    """
    Find an existing department by name (case-insensitive) or create a new one.
    Called during registration when no departments exist yet.
    Returns: {id, name, code}
    """
    from models.department import Department
    from sqlalchemy import func

    normalized_name = data.name.strip().upper()
    normalized_code = data.code.strip().upper()

    if not normalized_name or not normalized_code:
        raise api_error(400, "INVALID_INPUT", "Department name and code are required")

    # Case-insensitive lookup
    existing = db.query(Department).filter(
        func.upper(Department.name) == normalized_name
    ).first()

    if existing:
        logger.info("AUTH | department found id=%d name=%s", existing.id, existing.name)
        return {"id": existing.id, "name": existing.name, "code": existing.code}

    # Create new department
    new_dept = Department(name=normalized_name, code=normalized_code)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)

    logger.info("AUTH | department created id=%d name=%s", new_dept.id, new_dept.name)
    return {"id": new_dept.id, "name": new_dept.name, "code": new_dept.code}


@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """Return all departments for the registration form dropdown."""
    from models.department import Department
    departments = db.query(Department).order_by(Department.name).all()
    return [{"id": d.id, "name": d.name, "code": d.code} for d in departments]


@router.get("/programs")
def get_programs(db: Session = Depends(get_db)):
    """Return all programs for the registration form dropdown."""
    from models.program import Program
    programs = db.query(Program).order_by(Program.name).all()
    return [{"id": p.id, "name": p.name, "code": p.code, "department_id": p.department_id} for p in programs]


# --- Token Refresh ---

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_access_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """
    Issue a new access token using a valid refresh token.
    Per FRAMES_SECURITY_RULES §1.5 — refresh token endpoint.
    """
    payload = verify_token(body.refresh_token, expected_type="refresh")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="USER_NOT_FOUND",
            message="User no longer exists",
        )

    new_access_token = create_access_token(user)
    logger.info("AUTH | token refreshed user=%d", user.id)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }
