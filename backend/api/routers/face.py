"""
Face Router - Face enrollment and verification endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import logging

from db.database import get_db
from models.user import User
from models.facial_profile import FacialProfile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/face", tags=["Face"])


# ============================================
# Schemas
# ============================================

class EnrollmentRequest(BaseModel):
    user_id: int
    frames: List[str]  # List of base64-encoded images


class EnrollmentResponse(BaseModel):
    success: bool
    message: str
    num_samples: int
    quality_score: float


class FaceStatusResponse(BaseModel):
    user_id: int
    face_registered: bool
    num_samples: int = 0
    quality_score: float = 0.0
    model_version: str = ""


# ============================================
# Endpoints
# ============================================

@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_face(request: EnrollmentRequest, db: Session = Depends(get_db)):
    """
    Enroll a user's face using multiple webcam frames.
    Extracts embeddings using InsightFace and stores averaged result.
    """
    from services.face_enrollment import process_enrollment_frames
    from sqlalchemy import text
    
    # Validate user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate number of frames
    if len(request.frames) < 5:
        raise HTTPException(
            status_code=400, 
            detail="At least 5 frames required for enrollment"
        )
    
    if len(request.frames) > 30:
        raise HTTPException(
            status_code=400, 
            detail="Maximum 30 frames allowed"
        )
    
    logger.info(f"📸 Starting face enrollment for user {request.user_id}...")
    
    try:
        # Process frames and extract embeddings
        embedding_bytes, num_samples, avg_quality = process_enrollment_frames(request.frames)
        
        # Check if user already has a facial profile
        existing_profile = db.query(FacialProfile).filter(
            FacialProfile.user_id == request.user_id
        ).first()
        
        if existing_profile:
            # Use direct SQL UPDATE to avoid ORM overhead
            db.execute(text("""
                UPDATE facial_profiles 
                SET embedding = :embedding,
                    num_samples = :num_samples,
                    enrollment_quality = :quality,
                    model_version = :model_version,
                    updated_at = NOW()
                WHERE user_id = :user_id
            """), {
                'embedding': embedding_bytes,
                'num_samples': num_samples,
                'quality': avg_quality,
                'model_version': 'insightface_buffalo_l_v1',
                'user_id': request.user_id
            })
            logger.info(f"   📝 Updated existing facial profile")
        else:
            # Create new profile
            new_profile = FacialProfile(
                user_id=request.user_id,
                embedding=embedding_bytes,
                num_samples=num_samples,
                enrollment_quality=avg_quality,
                model_version="insightface_buffalo_l_v1"
            )
            db.add(new_profile)
            logger.info(f"   ✨ Created new facial profile")
        
        # Use direct SQL UPDATE for user.face_registered to avoid row recreation
        db.execute(text("""
            UPDATE users 
            SET face_registered = true 
            WHERE id = :user_id
        """), {'user_id': request.user_id})
        
        db.commit()
        
        logger.info(f"✅ Face enrollment complete for user {request.user_id}")
        
        return EnrollmentResponse(
            success=True,
            message="Face enrolled successfully",
            num_samples=num_samples,
            quality_score=avg_quality
        )
        
    except ValueError as e:
        logger.error(f"❌ Enrollment failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Enrollment error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


@router.get("/status/{user_id}", response_model=FaceStatusResponse)
def get_face_status(user_id: int, db: Session = Depends(get_db)):
    """
    Check if a user has completed face enrollment.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for facial profile
    profile = db.query(FacialProfile).filter(FacialProfile.user_id == user_id).first()
    
    if profile:
        return FaceStatusResponse(
            user_id=user_id,
            face_registered=True,
            num_samples=profile.num_samples or 0,
            quality_score=profile.enrollment_quality or 0.0,
            model_version=profile.model_version or ""
        )
    else:
        return FaceStatusResponse(
            user_id=user_id,
            face_registered=user.face_registered or False
        )
