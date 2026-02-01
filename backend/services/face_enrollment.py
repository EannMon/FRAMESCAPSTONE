"""
Face Enrollment Service
Uses InsightFace for high-quality embedding extraction during enrollment.
This runs on the backend (not Raspberry Pi).
"""
import numpy as np
import cv2
import base64
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
            
            logger.info("🔄 Loading InsightFace model (buffalo_l)...")
            _face_analyzer = FaceAnalysis(
                name='buffalo_l',
                providers=['CPUExecutionProvider']  # Use CPU for compatibility
            )
            _face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
            logger.info("✅ InsightFace model loaded successfully!")
            
        except ImportError:
            logger.error("❌ InsightFace not installed. Run: pip install insightface onnxruntime")
            raise ImportError("InsightFace not installed")
        except Exception as e:
            logger.error(f"❌ Failed to load InsightFace: {e}")
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
    
    # Detect faces
    faces = analyzer.get(image)
    
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
    
    logger.info(f"📸 Processing {len(base64_frames)} enrollment frames...")
    
    for i, frame_b64 in enumerate(base64_frames):
        try:
            # Decode image
            image = decode_base64_image(frame_b64)
            
            # Extract embedding
            embedding, quality = extract_embedding(image)
            
            if embedding is not None and quality > 0.5:  # Quality threshold
                embeddings.append(embedding)
                qualities.append(quality)
                logger.info(f"   ✓ Frame {i+1}: quality={quality:.2f}")
            else:
                logger.warning(f"   ⚠ Frame {i+1}: low quality or no face detected")
                
        except Exception as e:
            logger.error(f"   ❌ Frame {i+1}: {e}")
    
    if not embeddings:
        raise ValueError("No valid faces detected in any frame")
    
    # Average all embeddings
    avg_embedding = np.mean(embeddings, axis=0)
    
    # Normalize the averaged embedding
    avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)
    
    # Convert to bytes for storage
    embedding_bytes = avg_embedding.astype(np.float32).tobytes()
    
    avg_quality = float(np.mean(qualities))
    
    logger.info(f"✅ Enrollment complete: {len(embeddings)} valid frames, avg quality={avg_quality:.2f}")
    
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
