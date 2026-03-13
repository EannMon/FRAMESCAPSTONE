"""
User Model - Represents all system users (Students, Faculty, Head, Admin)
Simplified from the original 35+ field table to essential fields only.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone
import enum


class UserRole(enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    HEAD = "HEAD"
    ADMIN = "ADMIN"


class VerificationStatus(enum.Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=True)     # Nullable for students without TUP email
    password_hash = Column(String(255), nullable=False)
    tupm_id = Column(String(50), unique=True, nullable=True)    # Students: "TUPM-21-1234", nullable for faculty/head
    employee_id = Column(String(50), unique=True, nullable=True) # Faculty/Head: numeric employee ID
    
    # Role & Status
    role = Column(Enum(UserRole), nullable=False, index=True)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, index=True)
    face_registered = Column(Boolean, default=False)
    
    # Personal Info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    
    # Academic Info (Foreign Keys)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), index=True)
    
    # For Students — year_level is derived from section (e.g., "BSIT-4A" → 4th Year)
    # current_term is derived from department's active_semester + active_academic_year
    section = Column(String(50))     # e.g., "BSIT-4A"

    # Notifications
    email_notifications_enabled = Column(Boolean, default=True)
    in_app_notifications_enabled = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    department = relationship("Department", back_populates="users")
    program = relationship("Program", back_populates="users")
    facial_profile = relationship("FacialProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    taught_classes = relationship("Class", back_populates="faculty")
    attendance_logs = relationship("AttendanceLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role={self.role.value})>"
    
    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
