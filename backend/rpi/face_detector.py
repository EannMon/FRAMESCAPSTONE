"""
Face Detector using MediaPipe BlazeFace
Fast face localization for real-time processing on RPi.
"""
import cv2
import numpy as np
import mediapipe as mp
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class FaceDetector:
    """MediaPipe-based face detection for fast localization."""
    
    def __init__(self, min_confidence: float = 0.7, model_selection: int = 0):
        """
        Initialize face detector.
        
        Args:
            min_confidence: Minimum detection confidence (0.0-1.0)
            model_selection: 0=short-range (2m), 1=long-range (5m)
        """
        self.mp_face = mp.solutions.face_detection
        self.detector = self.mp_face.FaceDetection(
            model_selection=model_selection,
            min_detection_confidence=min_confidence
        )
        logger.info(f"✅ FaceDetector initialized (confidence={min_confidence})")
    
    def detect(self, frame_rgb: np.ndarray) -> List[Tuple[int, int, int, int, float]]:
        """
        Detect faces in RGB frame.
        
        Args:
            frame_rgb: RGB image (H, W, 3)
            
        Returns:
            List of (x, y, width, height, confidence) tuples
        """
        results = self.detector.process(frame_rgb)
        detections = []
        
        if results.detections:
            h, w = frame_rgb.shape[:2]
            for det in results.detections:
                bbox = det.location_data.relative_bounding_box
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                bw = int(bbox.width * w)
                bh = int(bbox.height * h)
                conf = det.score[0]
                
                # Ensure valid bounds
                x = max(0, x)
                y = max(0, y)
                bw = min(bw, w - x)
                bh = min(bh, h - y)
                
                if bw > 10 and bh > 10:  # Filter tiny detections
                    detections.append((x, y, bw, bh, conf))
        
        return detections
    
    def get_largest_face(self, frame_rgb: np.ndarray) -> Optional[Tuple[int, int, int, int, float]]:
        """Get the largest detected face (closest to camera)."""
        detections = self.detect(frame_rgb)
        if not detections:
            return None
        return max(detections, key=lambda d: d[2] * d[3])
    
    def crop_face(
        self, 
        frame_rgb: np.ndarray, 
        bbox: Tuple[int, int, int, int, float],
        target_size: Tuple[int, int] = (112, 112),
        margin: float = 0.3
    ) -> np.ndarray:
        """
        Crop and resize face region with margin.
        
        Args:
            frame_rgb: Source image
            bbox: (x, y, width, height, confidence)
            target_size: Output size (width, height)
            margin: Margin ratio to add around face
            
        Returns:
            Cropped and resized face image
        """
        x, y, w, h = bbox[:4]
        img_h, img_w = frame_rgb.shape[:2]
        
        # Add margin
        mx = int(w * margin)
        my = int(h * margin)
        x1 = max(0, x - mx)
        y1 = max(0, y - my)
        x2 = min(img_w, x + w + mx)
        y2 = min(img_h, y + h + my)
        
        face_crop = frame_rgb[y1:y2, x1:x2]
        
        if face_crop.size == 0:
            return np.zeros((*target_size, 3), dtype=np.uint8)
        
        face_resized = cv2.resize(face_crop, target_size)
        return face_resized
    
    def close(self):
        """Release resources."""
        self.detector.close()
