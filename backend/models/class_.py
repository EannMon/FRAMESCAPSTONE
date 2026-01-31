"""
Class Model - Represents scheduled classes (a subject taught by a faculty at a specific time/room)
Named class_ to avoid conflict with Python's 'class' keyword.
"""
from sqlalchemy import Column, Integer, String, Time, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Schedule
    room = Column(String(100))           # e.g., "CL1", "Lab 201"
    day_of_week = Column(String(20))     # e.g., "Monday", "Tuesday"
    start_time = Column(Time)
    end_time = Column(Time)
    section = Column(String(50))         # e.g., "BSIT-4A"
    
    # Semester info
    semester = Column(String(50))        # e.g., "1st Semester"
    academic_year = Column(String(20))   # e.g., "2025-2026"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    subject = relationship("Subject", back_populates="classes")
    faculty = relationship("User", back_populates="taught_classes")
    enrollments = relationship("Enrollment", back_populates="class_", cascade="all, delete-orphan")
    attendance_logs = relationship("AttendanceLog", back_populates="class_", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Class(id={self.id}, subject_id={self.subject_id}, section='{self.section}')>"
