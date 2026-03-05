"""
Department Model - Represents academic departments (e.g., Computer Studies Department)
Departments belong to Colleges (e.g., College of Science).
"""
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)   # e.g., "Computer Studies Department"
    code = Column(String(20), unique=True)                    # e.g., "CSD"

    # Parent college (added per MUSTFIX task #10/17)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True, index=True)

    # Active academic period (set by Department Head)
    active_academic_year = Column(String(20), nullable=True)  # e.g., "2025-2026"
    active_semester = Column(String(50), nullable=True)       # e.g., "1st Semester"

    # Semester date range (set by Department Head per MUSTFIX task #33)
    semester_start_date = Column(Date, nullable=True)
    semester_end_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    college = relationship("College", back_populates="departments")
    users = relationship("User", back_populates="department")
    programs = relationship("Program", back_populates="department")

    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"
