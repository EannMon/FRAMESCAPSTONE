"""
SessionException Model - Tracks exceptions (cancellations, online mode) for specific class sessions
"""
from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime
import enum


class ExceptionType(str, enum.Enum):
    ONSITE = "onsite"       # Default - regular on-site class
    ONLINE = "online"       # Moved to online/synchronous
    CANCELLED = "cancelled" # Class cancelled
    HOLIDAY = "holiday"     # Holiday - not counted as absence


class SessionException(Base):
    __tablename__ = "session_exceptions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    session_date = Column(Date, nullable=False)
    exception_type = Column(SQLEnum(ExceptionType), default=ExceptionType.ONSITE)
    reason = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id"))  # Faculty who created this
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    class_ = relationship("Class", backref="session_exceptions")
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<SessionException(class_id={self.class_id}, date={self.session_date}, type={self.exception_type})>"
