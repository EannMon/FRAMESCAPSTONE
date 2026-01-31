"""
Department Model - Represents academic departments (e.g., College of Science)
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True)  # e.g., "COS" for College of Science
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="department")
    programs = relationship("Program", back_populates="department")
    
    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"
