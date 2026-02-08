"""
Security Log Model - Tracks security events like unrecognized faces and spoof attempts
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, LargeBinary, Enum
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime
import enum


class SecurityEventType(enum.Enum):
    UNRECOGNIZED_FACE = "UNRECOGNIZED_FACE"
    GESTURE_FAILURE = "GESTURE_FAILURE"
    SPOOF_ATTEMPT = "SPOOF_ATTEMPT"
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"


class SecurityLog(Base):
    __tablename__ = "security_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    event_type = Column(Enum(SecurityEventType), nullable=False)
    embedding_data = Column(LargeBinary, nullable=True)  # Store unrecognized face embedding
    confidence_score = Column(Float, nullable=True)      # Partial match score if any
    room = Column(String(100))                           # Location
    details = Column(String(500))                        # Additional context
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    device = relationship("Device", backref="security_logs")
    
    def __repr__(self):
        return f"<SecurityLog(id={self.id}, event={self.event_type.value}, room='{self.room}')>"
