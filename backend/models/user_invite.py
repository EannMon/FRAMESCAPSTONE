"""
UserInvite Model - Tracks faculty invitations via email.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from db.database import Base
from datetime import datetime, timezone, timedelta
import enum

class UserInvite(Base):
    __tablename__ = "user_invites"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    role = Column(String(50), default="FACULTY")
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<UserInvite(id={self.id}, email='{self.email}', used={self.used})>"
