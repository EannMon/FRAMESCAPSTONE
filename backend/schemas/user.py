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
    """Registration request for Faculty/Head"""
    email: EmailStr
    password: str
    tupm_id: str
    role: UserRole
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    department_id: Optional[int] = None
    program_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Profile update request"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    year_level: Optional[str] = None
    section: Optional[str] = None


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
    email: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    role: str
    tupm_id: str
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """Full user response (no password)"""
    department_id: Optional[int] = None
    program_id: Optional[int] = None
    face_registered: bool = False
    verification_status: str
    year_level: Optional[str] = None
    section: Optional[str] = None
    created_at: Optional[datetime] = None
    last_active: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login success response"""
    message: str
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
