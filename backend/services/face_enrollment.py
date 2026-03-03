"""
Face Enrollment Service
Uses InsightFace for high-quality embedding extraction during enrollment.
This runs on the backend (not Raspberry Pi).
"""
import numpy as np
import cv2
import base64
import time
from io import BytesIO
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Global model instance (loaded once)
_face_analyzer = None


def get_face_analyzer():
    """
    Lazy-load InsightFace model.
    Uses buffalo_l model for high accuracy.
    """
    global _face_analyzer
    
    if _face_analyzer is None:
        try:
            from insightface.app import FaceAnalysis
            
            logger.info("Loading InsightFace model (buffalo_l)...")
            start = time.perf_counter()
            _face_analyzer = FaceAnalysis(
                name='buffalo_l',
                providers=['CPUExecutionProvider']  # Use CPU for compatibility
            )
            _face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.info("InsightFace model loaded successfully in %.1fms", elapsed_ms)
            
        except ImportError:
            logger.error("InsightFace not installed. Run: pip install insightface onnxruntime")
            raise ImportError("InsightFace not installed")
        except Exception as e:
            logger.critical("Failed to load InsightFace model: %s", str(e))
            raise
    
    return _face_analyzer


def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode base64 image string to OpenCV format (BGR).
    Handles data URL prefix (data:image/jpeg;base64,...)
    """
    # Remove data URL prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    # Decode base64
    image_data = base64.b64decode(base64_string)
    
    # Convert to numpy array
    nparr = np.frombuffer(image_data, np.uint8)
    
    # Decode image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Failed to decode image")
    
    return image


def extract_embedding(image: np.ndarray) -> Tuple[Optional[np.ndarray], float]:
    """
    Extract face embedding from a single image.
    
    Returns:
        (embedding, quality_score) or (None, 0.0) if no face detected
    """
    analyzer = get_face_analyzer()
    
    # Detect faces — timed per FRAMES Observability Rules §3.1
    start = time.perf_counter()
    faces = analyzer.get(image)
    elapsed_ms = (time.perf_counter() - start) * 1000
    
    if elapsed_ms > 200:
        logger.warning("Slow face detection: %.1fms", elapsed_ms)
    else:
        logger.debug("Face detection: %.1fms, found %d faces", elapsed_ms, len(faces))
    
    if not faces:
        return None, 0.0
    
    # Use the largest face (closest to camera)
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    
    # Get embedding (512-d vector for InsightFace)
    embedding = face.normed_embedding
    
    # Calculate quality score based on detection score and face size
    det_score = float(face.det_score)
    bbox = face.bbox
    face_size = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
    image_size = image.shape[0] * image.shape[1]
    size_ratio = face_size / image_size
    
    # Quality = detection confidence * size factor (face should be >10% of image)
    quality = det_score * min(1.0, size_ratio * 5)
    
    return embedding, quality


def process_enrollment_frames(base64_frames: List[str]) -> Tuple[bytes, int, float]:
    """
    Process multiple frames for face enrollment.
    
    Args:
        base64_frames: List of base64-encoded images
    
    Returns:
        (averaged_embedding_bytes, num_valid_samples, average_quality)
    """
    embeddings = []
    qualities = []
    
    logger.info("Processing %d enrollment frames", len(base64_frames))
    pipeline_start = time.perf_counter()
    
    for i, frame_b64 in enumerate(base64_frames):
        try:
            # Decode image
            image = decode_base64_image(frame_b64)
            
            # Extract embedding
            embedding, quality = extract_embedding(image)
            
            if embedding is not None and quality > 0.5:  # Quality threshold
                embeddings.append(embedding)
                qualities.append(quality)
                logger.debug("Frame %d: quality=%.2f", i + 1, quality)
            else:
                logger.warning("Frame %d: low quality or no face detected", i + 1)
                
        except Exception as e:
            logger.error("Frame %d processing failed: %s", i + 1, str(e))
    
    if not embeddings:
        raise ValueError("No valid faces detected in any frame")
    
    # Average all embeddings
    avg_embedding = np.mean(embeddings, axis=0)
    
    # Normalize the averaged embedding
    avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)
    
    # Convert to bytes for storage
    embedding_bytes = avg_embedding.astype(np.float32).tobytes()
    
    avg_quality = float(np.mean(qualities))
    pipeline_ms = (time.perf_counter() - pipeline_start) * 1000
    
    logger.info(
        "Enrollment complete: %d valid frames, avg quality=%.2f, total=%.1fms",
        len(embeddings), avg_quality, pipeline_ms
    )
    
    return embedding_bytes, len(embeddings), avg_quality


def compare_embeddings(embedding1: bytes, embedding2: bytes) -> float:
    """
    Compare two embeddings using cosine similarity.
    
    Returns:
        Similarity score between 0 and 1 (higher = more similar)
    """
    # Convert from bytes to numpy arrays
    emb1 = np.frombuffer(embedding1, dtype=np.float32)
    emb2 = np.frombuffer(embedding2, dtype=np.float32)
    
    # Cosine similarity
    similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    
    return float(similarity)


# Threshold for considering two embeddings as belonging to the same person.
# This matches the recognition threshold used in enrollment/kiosk.
DUPLICATE_FACE_THRESHOLD = 0.6


def check_embedding_uniqueness(
    new_embedding_bytes: bytes,
    exclude_user_id: int,
    db,
) -> tuple:
    """
    Check if a face embedding is already enrolled under a different account.

    Performs batch cosine similarity against ALL existing facial profiles
    (excluding the enrolling user's own profile, if any) using numpy
    vectorized operations — O(n) where n is total enrolled users.

    Args:
        new_embedding_bytes: The new 512-d float32 embedding as raw bytes.
        exclude_user_id: The user currently enrolling (skip their own profile).
        db: SQLAlchemy session.

    Returns:
        (is_unique, matching_user_id, similarity)
            - is_unique: True if no duplicate found.
            - matching_user_id: The user_id of the closest match, or None.
            - similarity: The cosine similarity score of the closest match.
    """
    from models.facial_profile import FacialProfile

    start = time.perf_counter()

    # Fetch all existing profiles EXCEPT the enrolling user's own — single query
    profiles = (
        db.query(FacialProfile.user_id, FacialProfile.embedding)
        .filter(FacialProfile.user_id != exclude_user_id)
        .filter(FacialProfile.embedding.isnot(None))
        .all()
    )

    if not profiles:
        logger.debug("No existing profiles to compare against — face is unique")
        return True, None, 0.0

    # Build numpy matrix for batch comparison
    user_ids = []
    embeddings_list = []
    for profile in profiles:
        emb = np.frombuffer(profile.embedding, dtype=np.float32).copy()
        # Defensive normalization
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
            embeddings_list.append(emb)
            user_ids.append(profile.user_id)

    if not embeddings_list:
        return True, None, 0.0

    existing_matrix = np.stack(embeddings_list)  # (N, 512)

    # Prepare query embedding
    query = np.frombuffer(new_embedding_bytes, dtype=np.float32).copy()
    query_norm = np.linalg.norm(query)
    if query_norm > 0:
        query = query / query_norm

    # Batch cosine similarity via matrix–vector dot product — O(n)
    similarities = np.dot(existing_matrix, query)  # (N,)

    max_idx = int(np.argmax(similarities))
    max_similarity = float(similarities[max_idx])

    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "Duplicate face check: compared against %d profiles in %.1fms, "
        "max similarity=%.4f (threshold=%.2f)",
        len(user_ids), elapsed_ms, max_similarity, DUPLICATE_FACE_THRESHOLD,
    )

    if max_similarity >= DUPLICATE_FACE_THRESHOLD:
        logger.warning(
            "SECURITY | Duplicate face detected: new enrollment matches "
            "existing user_id=%d with similarity=%.4f",
            user_ids[max_idx], max_similarity,
        )
        return False, user_ids[max_idx], max_similarity

    return True, None, max_similarity
