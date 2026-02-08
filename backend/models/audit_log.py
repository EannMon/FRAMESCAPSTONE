"""
Audit Log Model - Tracks all administrative actions for accountability
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who performed the action
    action_type = Column(String(50), nullable=False)                  # e.g., USER_CREATE, SCHEDULE_UPLOAD
    target_table = Column(String(50))                                 # Table affected
    target_id = Column(Integer)                                       # Record ID affected
    old_value = Column(JSON, nullable=True)                           # Previous state
    new_value = Column(JSON, nullable=True)                           # New state
    ip_address = Column(String(45))                                   # Request IP address
    user_agent = Column(String(255))                                  # Browser/client info
    timestamp = Column(DateTime, default=datetime.utcnow)
    
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
    
    # Authentication
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
