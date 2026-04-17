"""
Audit Log Model - Tracks all administrative actions for accountability
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    target_table = Column(String(50))
    target_id = Column(Integer)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    user = relationship("User", backref="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action_type}', user_id={self.user_id})>"


# Common audit action types
class AuditActions:
    # User management
    USER_CREATE = "USER_CREATE"
    USER_UPDATE = "USER_UPDATE"
    USER_DELETE = "USER_DELETE"
    USER_VERIFY = "USER_VERIFY"
    USER_REJECT = "USER_REJECT"
    
    # Face enrollment
    FACE_ENROLL = "FACE_ENROLL"
    FACE_UPDATE = "FACE_UPDATE"
    
    # Schedule management
    SCHEDULE_UPLOAD = "SCHEDULE_UPLOAD"
    CLASS_CREATE = "CLASS_CREATE"
    CLASS_UPDATE = "CLASS_UPDATE"
    CLASS_DELETE = "CLASS_DELETE"
    
    # Session exceptions
    SESSION_EXCEPTION_CREATE = "SESSION_EXCEPTION_CREATE"
    
    # Device management
    DEVICE_CREATE = "DEVICE_CREATE"
    DEVICE_UPDATE = "DEVICE_UPDATE"
    DEVICE_DELETE = "DEVICE_DELETE"
    
    # Data export
    EXPORT_ATTENDANCE = "EXPORT_ATTENDANCE"
    EXPORT_REPORT = "EXPORT_REPORT"
    
    # Department Head Management
    ACADEMIC_YEAR_UPDATE = "ACADEMIC_YEAR_UPDATE"
    SUBJECT_CREATE = "SUBJECT_CREATE"
    SUBJECT_DELETE = "SUBJECT_DELETE"
    FACULTY_ASSIGN = "FACULTY_ASSIGN"
    ROOM_ASSIGN = "ROOM_ASSIGN"
    PROGRAM_CREATE = "PROGRAM_CREATE"
    PROGRAM_DELETE = "PROGRAM_DELETE"
    
    # Enrollment Management
    STUDENT_ENROLL = "STUDENT_ENROLL"
    STUDENT_UNENROLL = "STUDENT_UNENROLL"
    
    # Authentication
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"

    # Attendance time edits (Faculty / Dept Head)
    ATTENDANCE_TIME_EDIT = "ATTENDANCE_TIME_EDIT"
