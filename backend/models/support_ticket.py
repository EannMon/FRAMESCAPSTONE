"""
SupportTicket Model - Help desk tickets submitted by users.
Supports subject, message, status tracking, and evidence file attachments.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Index
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
    status = Column(
        Enum(TicketStatus, values_callable=lambda x: [e.value for e in x]),
        default=TicketStatus.OPEN,
        nullable=True,
    )

    # Evidence file paths (stored as comma-separated relative paths)
    # e.g. "tickets/42/evidence1.jpg,tickets/42/evidence2.pdf"
    evidence_files = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", backref="support_tickets")

    __table_args__ = (
        Index("ix_support_tickets_status", "status"),
    )

    def __repr__(self):
        return f"<SupportTicket(id={self.id}, user_id={self.user_id}, status={self.status})>"
