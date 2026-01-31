"""
AttendanceLog Model - Core table for attendance records
Supports ENTRY, BREAK_OUT, BREAK_IN, EXIT actions with gesture verification.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime
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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"))
    device_id = Column(Integer, ForeignKey("devices.id"))
    
    # Attendance Info
    action = Column(Enum(AttendanceAction), nullable=False)
    verified_by = Column(Enum(VerifiedBy))           # FACE for entry, FACE+GESTURE for breaks/exit
    
    # Recognition metadata
    confidence_score = Column(Float)                  # Face recognition confidence
    gesture_detected = Column(String(50))             # e.g., "PEACE_SIGN", "THUMBS_UP", "OPEN_PALM"
    
    # Timestamps
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # For audit/debugging
    remarks = Column(String(255))
    
    # Relationships
    user = relationship("User", back_populates="attendance_logs")
    class_ = relationship("Class", back_populates="attendance_logs")
    device = relationship("Device", back_populates="attendance_logs")
    
    def __repr__(self):
        return f"<AttendanceLog(id={self.id}, user_id={self.user_id}, action={self.action.value})>"
