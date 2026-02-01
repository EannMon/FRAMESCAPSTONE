"""
FacialProfile Model - Stores face embeddings separately from User table
This enables efficient face recognition queries and model versioning.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary, DateTime, Float
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class FacialProfile(Base):
    __tablename__ = "facial_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Face embedding (512-d InsightFace vector = 2048 bytes when stored as float32)
    embedding = Column(LargeBinary)
    
    # Model version for future upgrades
    # Enrollment: "insightface_buffalo_l_v1"
    # Edge: "facenet_tflite_int8_v1"
    model_version = Column(String(50), default="insightface_buffalo_l_v1")
    
    # Enrollment metadata
    num_samples = Column(Integer, default=0)  # How many frames used for enrollment
    enrollment_quality = Column(Float, default=0.0)  # Average face quality score (0-1)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="facial_profile")
    
    def __repr__(self):
        return f"<FacialProfile(id={self.id}, user_id={self.user_id}, model='{self.model_version}', samples={self.num_samples})>"

