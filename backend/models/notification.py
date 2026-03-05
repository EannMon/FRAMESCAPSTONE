"""
Notification Model - Stores user notifications for attendance events,
system alerts, and other important messages.
Added per MUSTFIX tasks #29, #54, #65, #67.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone
import enum


class NotificationType(enum.Enum):
    ATTENDANCE_ENTRY = "ATTENDANCE_ENTRY"
    ATTENDANCE_BREAK = "ATTENDANCE_BREAK"
    ATTENDANCE_EXIT = "ATTENDANCE_EXIT"
    LATE_ALERT = "LATE_ALERT"
    ABSENT_CONSECUTIVE = "ABSENT_CONSECUTIVE"    # 3+ consecutive absences
    SESSION_EXCEPTION = "SESSION_EXCEPTION"       # Class cancelled/online
    VERIFICATION_APPROVED = "VERIFICATION_APPROVED"
    VERIFICATION_REJECTED = "VERIFICATION_REJECTED"
    SYSTEM_ALERT = "SYSTEM_ALERT"
    OVERCROWDING_ALERT = "OVERCROWDING_ALERT"    # Room exceeds capacity
    GENERAL = "GENERAL"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    notification_type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(String(500), nullable=False)

    is_read = Column(Boolean, default=False, index=True)

    # Optional references for navigation context
    reference_id = Column(Integer, nullable=True)        # e.g., attendance_log_id or class_id
    reference_type = Column(String(50), nullable=True)   # e.g., "attendance_log", "class"

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    __table_args__ = (
        Index("ix_notification_user_unread", "user_id", "is_read", "created_at"),
    )

    # Relationships
    user = relationship("User", backref="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.notification_type.value})>"
