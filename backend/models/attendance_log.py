"""
AttendanceLog Model - Core table for attendance records
Supports ENTRY, BREAK_OUT, BREAK_IN, EXIT actions with gesture verification.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Float, Boolean, Index
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone
import enum

class AttendanceAction(enum.Enum):
    ENTRY = "ENTRY"
    BREAK_OUT = "BREAK_OUT"
    BREAK_IN = "BREAK_IN"
    EXIT = "EXIT"

class VerifiedBy(enum.Enum):
    FACE = "FACE"
    FACE_GESTURE = "FACE+GESTURE"

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), index=True)
    
    # Attendance Info
    # values_callable ensures SQLAlchemy uses enum .value (not .name) for DB storage
    # This matters for VerifiedBy where name=FACE_GESTURE but DB value=FACE+GESTURE
    action = Column(Enum(AttendanceAction, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    verified_by = Column(Enum(VerifiedBy, values_callable=lambda x: [e.value for e in x]))  # FACE or FACE+GESTURE
    is_late = Column(Boolean, default=False, index=True)         # For faster late arrival queries
    
    # Recognition metadata
    confidence_score = Column(Float)                  # Face recognition confidence
    gesture_detected = Column(String(50))             # e.g., "PEACE_SIGN", "THUMBS_UP", "OPEN_PALM"
    
    # Timestamps
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # For audit/debugging
    remarks = Column(String(255))
    
    # Relationships
    user = relationship("User", back_populates="attendance_logs")
    class_ = relationship("Class", back_populates="attendance_logs")
    device = relationship("Device", back_populates="attendance_logs")
    
    # Composite index for the most common query pattern
    __table_args__ = (
        Index('ix_attendance_user_class_timestamp', 'user_id', 'class_id', 'timestamp'),
    )

    def __repr__(self):
        return f"<AttendanceLog(id={self.id}, user_id={self.user_id}, action={self.action.value})>"
