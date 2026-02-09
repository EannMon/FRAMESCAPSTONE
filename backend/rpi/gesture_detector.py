"""
Gesture Detector using MediaPipe Hands
Detects peace sign (V-sign) for attendance confirmation.
"""
import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, Tuple, List
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Gesture(Enum):
    """Supported gestures for attendance verification."""
    NONE = "NONE"
    PEACE_SIGN = "PEACE_SIGN"
    THUMBS_UP = "THUMBS_UP"
    OPEN_PALM = "OPEN_PALM"


class GestureDetector:
    """MediaPipe Hands gesture detection for attendance confirmation."""
    
    def __init__(self, min_confidence: float = 0.7):
        """
        Initialize gesture detector.
        
        Args:
            min_confidence: Minimum detection confidence
        """
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=min_confidence,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils
        logger.info(f"✅ GestureDetector initialized (confidence={min_confidence})")
    
    def detect(self, frame_rgb: np.ndarray) -> Tuple[Gesture, Optional[List]]:
        """
        Detect gesture in frame.
        
        Args:
            frame_rgb: RGB image
            
        Returns:
            (gesture_type, hand_landmarks) or (NONE, None)
        """
        results = self.hands.process(frame_rgb)
        
        if not results.multi_hand_landmarks:
            return Gesture.NONE, None
        
        hand = results.multi_hand_landmarks[0]
        landmarks = hand.landmark
        
        # Check for peace sign
        if self._is_peace_sign(landmarks):
            return Gesture.PEACE_SIGN, hand
        
        # Check for thumbs up
        if self._is_thumbs_up(landmarks):
            return Gesture.THUMBS_UP, hand
        
        # Check for open palm
        if self._is_open_palm(landmarks):
            return Gesture.OPEN_PALM, hand
        
        return Gesture.NONE, hand
    
    def _is_finger_up(self, landmarks, tip_idx: int, pip_idx: int) -> bool:
        """Check if a finger is extended (tip above pip joint)."""
        return landmarks[tip_idx].y < landmarks[pip_idx].y
    
    def _is_thumb_up(self, landmarks) -> bool:
        """Check if thumb is extended (for right hand, x comparison)."""
        # Thumb tip (4) should be to the left of thumb IP (3) for right hand
        # This is simplified - in production, check handedness
        return landmarks[4].x < landmarks[3].x or landmarks[4].y < landmarks[2].y
    
    def _is_peace_sign(self, landmarks) -> bool:
        """
        Peace sign: index + middle UP, ring + pinky DOWN.
        
        Finger indices:
        - Index: tip=8, pip=6
        - Middle: tip=12, pip=10
        - Ring: tip=16, pip=14
        - Pinky: tip=20, pip=18
        """
        index_up = self._is_finger_up(landmarks, 8, 6)
        middle_up = self._is_finger_up(landmarks, 12, 10)
        ring_down = not self._is_finger_up(landmarks, 16, 14)
        pinky_down = not self._is_finger_up(landmarks, 20, 18)
        
        return index_up and middle_up and ring_down and pinky_down
    
    def _is_thumbs_up(self, landmarks) -> bool:
        """Thumbs up: thumb UP, all other fingers DOWN."""
        thumb_up = self._is_thumb_up(landmarks)
        index_down = not self._is_finger_up(landmarks, 8, 6)
        middle_down = not self._is_finger_up(landmarks, 12, 10)
        ring_down = not self._is_finger_up(landmarks, 16, 14)
        pinky_down = not self._is_finger_up(landmarks, 20, 18)
        
        return thumb_up and index_down and middle_down and ring_down and pinky_down
    
    def _is_open_palm(self, landmarks) -> bool:
        """Open palm: all five fingers UP."""
        thumb_up = self._is_thumb_up(landmarks)
        index_up = self._is_finger_up(landmarks, 8, 6)
        middle_up = self._is_finger_up(landmarks, 12, 10)
        ring_up = self._is_finger_up(landmarks, 16, 14)
        pinky_up = self._is_finger_up(landmarks, 20, 18)
        
        return thumb_up and index_up and middle_up and ring_up and pinky_up
    
    def detect_peace_sign(self, frame_rgb: np.ndarray) -> bool:
        """Quick check for peace sign only."""
        gesture, _ = self.detect(frame_rgb)
        return gesture == Gesture.PEACE_SIGN
    
    def draw_landmarks(self, frame_bgr: np.ndarray, hand_landmarks) -> np.ndarray:
        """Draw hand landmarks on frame for visualization."""
        if hand_landmarks:
            self.mp_draw.draw_landmarks(
                frame_bgr,
                hand_landmarks,
                self.mp_hands.HAND_CONNECTIONS
            )
        return frame_bgr
    
    def close(self):
        """Release resources."""
        self.hands.close()
