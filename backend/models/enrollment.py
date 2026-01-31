"""
Enrollment Model - Junction table linking Students to Classes
This replaces the JSON 'enrolled_courses' field in the old User table.
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    # Ensure a student can only be enrolled once per class
    __table_args__ = (
        UniqueConstraint('class_id', 'student_id', name='unique_enrollment'),
    )
    
    # Relationships
    class_ = relationship("Class", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")
    
    def __repr__(self):
        return f"<Enrollment(id={self.id}, class_id={self.class_id}, student_id={self.student_id})>"
