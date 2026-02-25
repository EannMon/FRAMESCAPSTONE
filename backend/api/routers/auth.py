"""
Auth Router - Login and Registration endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import bcrypt
import logging

from db.database import get_db
from core.errors import api_error
from main import limiter
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
    
    logger.info("Login Successful for: %s %s", user.first_name, user.last_name)
    
    return LoginResponse(
        message="Login Successful",
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
    
    logger.info("Registered: %s %s (ID: %d)", new_user.first_name, new_user.last_name, new_user.id)
    
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

