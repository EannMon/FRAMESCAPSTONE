"""
FacialProfile Model - Stores face embeddings separately from User table
This enables efficient face recognition queries and model versioning.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class FacialProfile(Base):
    __tablename__ = "facial_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Face embedding (128-d FaceNet vector = 512 bytes when stored as float32)
    embedding = Column(LargeBinary)
    
    # Model version for future upgrades (e.g., "facenet_int8", "mobilenet_v2")
    model_version = Column(String(50), default="facenet_int8")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="facial_profile")
    
    def __repr__(self):
        return f"<FacialProfile(id={self.id}, user_id={self.user_id}, model='{self.model_version}')>"
