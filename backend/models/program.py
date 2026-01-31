"""
Program Model - Represents academic programs (e.g., BS Information Technology)
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class Program(Base):
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20))  # e.g., "BSIT", "BSCS"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="programs")
    users = relationship("User", back_populates="program")
    
    def __repr__(self):
        return f"<Program(id={self.id}, name='{self.name}')>"
