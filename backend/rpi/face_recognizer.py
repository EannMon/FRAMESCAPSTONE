"""
Face Recognizer using InsightFace buffalo_sc
Extracts 512-d embeddings compatible with server enrollment (buffalo_l).
"""
import numpy as np
import cv2
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Global model instance (lazy loaded)
_face_analyzer = None


def get_face_analyzer(model_name: str = "buffalo_sc", det_size: Tuple[int, int] = (320, 320)):
    """
    Lazy-load InsightFace model.
    
    buffalo_sc = smaller, faster version suitable for RPi
    Produces same 512-d embeddings as buffalo_l used in enrollment.
    """
    global _face_analyzer
    
    if _face_analyzer is None:
        try:
            from insightface.app import FaceAnalysis
            
            logger.info(f"🔄 Loading InsightFace model ({model_name})...")
            _face_analyzer = FaceAnalysis(
                name=model_name,
                providers=['CPUExecutionProvider']
            )
            _face_analyzer.prepare(ctx_id=-1, det_size=det_size)
            logger.info(f"✅ InsightFace model loaded successfully!")
            
        except ImportError:
            logger.error("❌ InsightFace not installed. Run: pip install insightface onnxruntime")
            raise ImportError("InsightFace not installed")
        except Exception as e:
            logger.error(f"❌ Failed to load InsightFace: {e}")
            raise
    
    return _face_analyzer


class FaceRecognizer:
    """Face embedding extraction using InsightFace."""
    
    def __init__(self, model_name: str = "buffalo_sc", det_size: Tuple[int, int] = (320, 320)):
        """
        Initialize recognizer with InsightFace model.
        
        Args:
            model_name: InsightFace model name (buffalo_sc for RPi, buffalo_l for server)
            det_size: Detection input size (smaller = faster)
        """
        self.model_name = model_name
        self.det_size = det_size
        self.analyzer = None
        self._initialized = False
    
    def initialize(self):
        """Lazy initialization of the model."""
        if not self._initialized:
            self.analyzer = get_face_analyzer(self.model_name, self.det_size)
            self._initialized = True
    
    def get_embedding(self, frame_rgb: np.ndarray) -> Tuple[Optional[np.ndarray], float, Optional[np.ndarray]]:
        """
        Extract face embedding from frame.
        
        Args:
            frame_rgb: RGB image containing a face
            
        Returns:
            (embedding, detection_score, bounding_box) or (None, 0.0, None) if no face
        """
        self.initialize()
        
        # InsightFace expects BGR
        frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
        
        faces = self.analyzer.get(frame_bgr)
        
        if not faces:
            return None, 0.0, None
        
        # Use largest face
        face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        
        # Get normalized embedding (512-d)
        embedding = face.normed_embedding
        det_score = float(face.det_score)
        bbox = face.bbox.astype(int)
        
        return embedding, det_score, bbox
    
    def get_embedding_from_crop(self, face_crop_rgb: np.ndarray) -> Tuple[Optional[np.ndarray], float]:
        """
        Extract embedding from a pre-cropped face image.
        
        Note: InsightFace works better on full frames, but this can be used
        for pre-processed crops if needed.
        
        Args:
            face_crop_rgb: RGB face crop (ideally 112x112 or similar)
            
        Returns:
            (embedding, quality_score) or (None, 0.0) if extraction fails
        """
        self.initialize()
        
        # Pad small crops to give InsightFace more context
        h, w = face_crop_rgb.shape[:2]
        if h < 112 or w < 112:
            # Create padded image
            pad_h = max(0, 112 - h) // 2
            pad_w = max(0, 112 - w) // 2
            padded = np.zeros((max(h, 112), max(w, 112), 3), dtype=np.uint8)
            padded[pad_h:pad_h+h, pad_w:pad_w+w] = face_crop_rgb
            face_crop_rgb = padded
        
        frame_bgr = cv2.cvtColor(face_crop_rgb, cv2.COLOR_RGB2BGR)
        faces = self.analyzer.get(frame_bgr)
        
        if not faces:
            return None, 0.0
        
        face = faces[0]
        return face.normed_embedding, float(face.det_score)
    
    def compare_embeddings(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            emb1, emb2: 512-d normalized embeddings
            
        Returns:
            Similarity score (0.0 to 1.0, higher = more similar)
        """
        # Both should already be normalized, but ensure it
        emb1 = emb1 / np.linalg.norm(emb1)
        emb2 = emb2 / np.linalg.norm(emb2)
        return float(np.dot(emb1, emb2))
