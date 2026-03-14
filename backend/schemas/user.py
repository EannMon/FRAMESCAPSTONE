"""
User Pydantic Schemas - Request/Response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    HEAD = "HEAD"
    ADMIN = "ADMIN"


class VerificationStatus(str, Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"


# ============================================
# Request Schemas
# ============================================

class UserLogin(BaseModel):
    """Login request"""
    email: str
    password: str


class UserRegister(BaseModel):
    """Registration request for Faculty/Head.
    Faculty/Head use employee_id (numbers only) instead of TUPM ID.
    """
    email: EmailStr
    password: str
    tupm_id: Optional[str] = None
    employee_id: Optional[str] = None
    role: UserRole
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    department_id: Optional[int] = None
    program_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Profile update request — only essential editable fields"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    section: Optional[str] = None
    email: Optional[str] = None
    email_notifications_enabled: Optional[bool] = None
    in_app_notifications_enabled: Optional[bool] = None



class PasswordChange(BaseModel):
    """Password change request"""
    user_id: int
    new_password: str


class PasswordVerify(BaseModel):
    """Password verification request"""
    user_id: int
    password: str


# ============================================
# Response Schemas
# ============================================

class UserBase(BaseModel):
    """Base user info"""
    id: int
    email: Optional[str] = None
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    role: str
    tupm_id: Optional[str] = None
    employee_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """Full user response (no password) — data minimized per MUSTFIX #1"""
    department_id: Optional[int] = None
    program_id: Optional[int] = None
    department_name: Optional[str] = None
    program_name: Optional[str] = None
    college_name: Optional[str] = None
    face_registered: bool = False
    verification_status: str
    section: Optional[str] = None
    email_notifications_enabled: bool = True
    in_app_notifications_enabled: bool = True
    created_at: Optional[datetime] = None

    last_active: Optional[datetime] = None
    # Derived fields — computed from department settings, not stored on user
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login success response — includes JWT tokens per FRAMES_SECURITY_RULES §1.5"""
    message: str
    access_token: str = ""
    refresh_token: str = ""
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
