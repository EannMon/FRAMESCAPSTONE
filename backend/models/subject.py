"""
Subject Model - Represents academic subjects/courses
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)  # e.g., "CS101", "IT302"
    title = Column(String(255), nullable=False)  # e.g., "Introduction to Computing"
    units = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    classes = relationship("Class", back_populates="subject")
    
    def __repr__(self):
        return f"<Subject(id={self.id}, code='{self.code}', title='{self.title}')>"
