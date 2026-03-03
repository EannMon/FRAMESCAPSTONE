"""
Department Model - Represents academic departments (e.g., College of Science)
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone


class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True)  # e.g., "COS" for College of Science
    
    # Active academic period (set by Department Head)
    active_academic_year = Column(String(20), nullable=True)  # e.g., "2025-2026"
    active_semester = Column(String(50), nullable=True)        # e.g., "1st Semester"
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    users = relationship("User", back_populates="department")
    programs = relationship("Program", back_populates="department")
    
    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"
