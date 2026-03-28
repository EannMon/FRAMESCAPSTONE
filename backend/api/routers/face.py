"""
Face Router - Face enrollment and verification endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import logging

from db.database import get_db
from core.errors import api_error
from core.limiter import limiter
from models.user import User
from models.facial_profile import FacialProfile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/face", tags=["Face"])

MINIMUM_ENROLLMENT_QUALITY = 0.75
MINIMUM_VALID_SAMPLES = 5


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


def _map_enrollment_value_error(error: ValueError) -> tuple:
    """Map internal enrollment ValueError text to a stable API error contract."""
    normalized = str(error).lower()

    if "no valid faces" in normalized or "no face" in normalized:
        return (
            400,
            "NO_FACE_DETECTED",
            "No clear face was detected in the captured frames. Please face the camera directly and improve lighting.",
        )

    if "decode image" in normalized:
        return (
            400,
            "INVALID_IMAGE_DATA",
            "Captured image data is invalid. Please retake your photos and try again.",
        )

    return (
        400,
        "ENROLLMENT_VALIDATION_FAILED",
        "Face enrollment validation failed. Please retake with better lighting and keep your face centered.",
    )


# ============================================
# Endpoints
# ============================================

@router.post("/enroll", response_model=EnrollmentResponse)
@limiter.limit("3/minute")
async def enroll_face(request: Request, body: EnrollmentRequest, db: Session = Depends(get_db)):
    """
    Enroll a user's face using multiple webcam frames.
    Extracts embeddings using InsightFace, checks for duplicate faces
    across all existing profiles, and stores the averaged result.
    """
    from services.face_enrollment import (
        process_enrollment_frames,
        check_embedding_uniqueness,
        DUPLICATE_FACE_THRESHOLD,
    )
    from sqlalchemy import text
    
    # Validate user exists
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
    # Validate number of frames
    if len(body.frames) < 5:
        raise api_error(400, "INSUFFICIENT_FRAMES", "At least 5 frames required for enrollment")
    
    if len(body.frames) > 30:
        raise api_error(400, "TOO_MANY_FRAMES", "Maximum 30 frames allowed")
    
    logger.info("Starting face enrollment for user %d", body.user_id)
    
    try:
        # Process frames and extract embeddings
        embedding_bytes, num_samples, avg_quality = process_enrollment_frames(body.frames)
        
        if num_samples < MINIMUM_VALID_SAMPLES:
            logger.warning(
                "Enrollment rejected for user %d: only %d valid frames (min=%d)",
                body.user_id,
                num_samples,
                MINIMUM_VALID_SAMPLES,
            )
            raise api_error(
                400,
                "INSUFFICIENT_QUALITY_FRAMES",
                "Not enough high-quality frames were captured. Please retake with better lighting and keep your face centered.",
                {"valid_frames": num_samples, "minimum_required": MINIMUM_VALID_SAMPLES},
            )

        # Reject enrollment if average quality is below threshold.
        # Backend enforcement ensures no low-quality embedding can be stored
        # even if frontend checks are bypassed.
        if avg_quality <= MINIMUM_ENROLLMENT_QUALITY:
            logger.warning(
                "Enrollment rejected for user %d: quality=%.4f below threshold=%.2f",
                body.user_id, avg_quality, MINIMUM_ENROLLMENT_QUALITY,
            )
            raise api_error(
                400,
                "QUALITY_TOO_LOW",
                f"Enrollment quality ({avg_quality * 100:.2f}%) must be above {MINIMUM_ENROLLMENT_QUALITY * 100:.2f}%. "
                "Please retry in better lighting with your face clearly visible.",
                {
                    "quality_score": round(avg_quality, 4),
                    "minimum_required": MINIMUM_ENROLLMENT_QUALITY,
                    "hint": "Use brighter lighting, keep your full face visible, and avoid motion blur.",
                },
            )

        # ── Duplicate face check ──────────────────────────────────
        # Compare the new embedding against ALL existing profiles
        # (excluding this user's own) to prevent the same person
        # from enrolling under multiple accounts.
        is_unique, matching_user_id, similarity = check_embedding_uniqueness(
            embedding_bytes, body.user_id, db
        )
        
        if not is_unique:
            logger.warning(
                "SECURITY | Duplicate face enrollment blocked: user=%d "
                "matches existing user_id=%d (similarity=%.4f)",
                body.user_id, matching_user_id, similarity,
            )
            raise api_error(
                409,
                "DUPLICATE_FACE",
                "This face is already registered under another account. "
                "Please contact administration if you believe this is an error.",
                {
                    "similarity": round(similarity, 4),
                    "threshold": DUPLICATE_FACE_THRESHOLD,
                },
            )
        
        # Check if user already has a facial profile
        existing_profile = db.query(FacialProfile).filter(
            FacialProfile.user_id == body.user_id
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
                'model_version': 'insightface_buffalo_sc_v1',
                'user_id': body.user_id
            })
            logger.info("Updated existing facial profile for user %d", body.user_id)
        else:
            # Create new profile
            new_profile = FacialProfile(
                user_id=body.user_id,
                embedding=embedding_bytes,
                num_samples=num_samples,
                enrollment_quality=avg_quality,
                model_version="insightface_buffalo_sc_v1"
            )
            db.add(new_profile)
            logger.info("Created new facial profile for user %d", body.user_id)
        
        # Use direct SQL UPDATE for user.face_registered to avoid row recreation
        db.execute(text("""
            UPDATE users 
            SET face_registered = true 
            WHERE id = :user_id
        """), {'user_id': body.user_id})
        
        db.commit()
        
        logger.info("Face enrollment complete for user %d", body.user_id)
        
        return EnrollmentResponse(
            success=True,
            message="Face enrolled successfully",
            num_samples=num_samples,
            quality_score=avg_quality
        )
        
    except HTTPException:
        # Re-raise HTTP errors (including our DUPLICATE_FACE error) as-is
        db.rollback()
        raise
    except ValueError as e:
        db.rollback()
        status_code, error_code, message = _map_enrollment_value_error(e)
        logger.warning(
            "Enrollment validation failed for user %d: code=%s reason=%s",
            body.user_id,
            error_code,
            str(e),
        )
        raise api_error(status_code, error_code, message)
    except Exception as e:
        logger.exception("Unexpected enrollment error for user %d", body.user_id)
        db.rollback()
        raise api_error(500, "INTERNAL_ERROR", "An unexpected error occurred during enrollment")


@router.get("/status/{user_id}", response_model=FaceStatusResponse)
def get_face_status(user_id: int, db: Session = Depends(get_db)):
    """
    Check if a user has completed face enrollment.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")
    
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
