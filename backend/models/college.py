"""
College Model - Represents academic colleges (e.g., College of Science)
Colleges contain departments. Added per MUSTFIX task #10/17.
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone


class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False)   # e.g., "College of Science"
    code = Column(String(20), unique=True)                    # e.g., "COS"

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    departments = relationship("Department", back_populates="college")

    def __repr__(self):
        return f"<College(id={self.id}, name='{self.name}', code='{self.code}')>"
