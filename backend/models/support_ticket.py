"""
SupportTicket Model - Stores contact/support form submissions from Help & Support page.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone
import enum


class TicketStatus(enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")

    def __repr__(self):
        return f"<SupportTicket(id={self.id}, user_id={self.user_id}, subject='{self.subject}')>"
