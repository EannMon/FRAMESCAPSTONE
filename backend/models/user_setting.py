"""
UserSetting Model - Persists per-user preferences (notifications, theme, language).
"""
from sqlalchemy import Column, Integer, Boolean, String, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base


class UserSetting(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    push_notifications = Column(Boolean, default=True)
    theme = Column(String(50), default="system")
    language = Column(String(20), default="en")

    user = relationship("User")

    def __repr__(self):
        return f"<UserSetting(id={self.id}, user_id={self.user_id}, theme='{self.theme}')>"
