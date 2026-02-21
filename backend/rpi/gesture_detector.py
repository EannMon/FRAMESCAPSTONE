"""
Gesture Detector using MediaPipe Hands
Detects peace sign (V-sign), thumbs up, and open palm for attendance confirmation.

Uses distance-based finger extension checks (angle-invariant) and temporal
smoothing to provide stable gesture recognition regardless of hand orientation.
"""
import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, Tuple, List
from enum import Enum
from collections import deque
import logging
import math

logger = logging.getLogger(__name__)


class Gesture(Enum):
    """Supported gestures for attendance verification."""
    NONE = "NONE"
    PEACE_SIGN = "PEACE_SIGN"
    THUMBS_UP = "THUMBS_UP"
    OPEN_PALM = "OPEN_PALM"


class GestureDetector:
    """
    MediaPipe Hands gesture detection for attendance confirmation.
    
    Improvements over simple y-comparison:
    - Distance-based finger extension (works at any hand angle)
    - Temporal smoothing (requires N consecutive frames)
    - Handedness-aware thumb detection
    - Lenient ring/pinky check for peace sign
    """
    
    def __init__(self, min_confidence: float = 0.5, consecutive_frames: int = 3):
        """
        Initialize gesture detector.
        
        Args:
            min_confidence: Minimum detection confidence (lower = more detections)
            consecutive_frames: Require gesture for N consecutive frames before confirming
        """
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=min_confidence,
            min_tracking_confidence=0.4  # Lower for better tracking continuity
        )
        self.mp_draw = mp.solutions.drawing_utils
        
        # Temporal smoothing buffer
        self._consecutive_frames = consecutive_frames
        self._gesture_buffer: deque = deque(maxlen=max(consecutive_frames * 2, 8))
        
        logger.info(f"✅ GestureDetector initialized (confidence={min_confidence}, "
                     f"consecutive={consecutive_frames})")
    
    def _dist(self, a, b) -> float:
        """Euclidean distance between two landmarks."""
        return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2 + (a.z - b.z)**2)
    
    def _is_finger_extended(self, landmarks, tip: int, dip: int, pip: int, mcp: int) -> bool:
        """
        Check if finger is extended using distance ratios (angle-invariant).
        
        A finger is extended if the tip-to-MCP distance is significantly 
        greater than the PIP-to-MCP distance. This works regardless of 
        hand rotation/angle.
        
        Finger landmark indices:
            Index:  tip=8,  dip=7,  pip=6,  mcp=5
            Middle: tip=12, dip=11, pip=10, mcp=9
            Ring:   tip=16, dip=15, pip=14, mcp=13
            Pinky:  tip=20, dip=19, pip=18, mcp=17
        """
        tip_to_mcp = self._dist(landmarks[tip], landmarks[mcp])
        pip_to_mcp = self._dist(landmarks[pip], landmarks[mcp])
        
        # Extended finger: tip is far from MCP relative to PIP-MCP distance
        # Curl factor: if tip_to_mcp / pip_to_mcp > threshold, finger is extended
        if pip_to_mcp < 1e-6:
            return False
        
        ratio = tip_to_mcp / pip_to_mcp
        return ratio > 1.5  # Extended if tip is 1.5x further than PIP from MCP
    
    def _is_finger_curled(self, landmarks, tip: int, dip: int, pip: int, mcp: int) -> bool:
        """
        Check if finger is curled (not extended).
        More lenient threshold — a finger is curled if it's clearly NOT straight.
        """
        tip_to_mcp = self._dist(landmarks[tip], landmarks[mcp])
        pip_to_mcp = self._dist(landmarks[pip], landmarks[mcp])
        
        if pip_to_mcp < 1e-6:
            return True
        
        ratio = tip_to_mcp / pip_to_mcp
        # Raised from 1.7 → 1.8 to avoid grey zone between extended (1.5) and curled
        # This makes peace sign detection more reliable since ring/pinky
        # often hover in a semi-curled state
        return ratio < 1.8
    
    def _is_thumb_extended(self, landmarks, handedness: str = "Right") -> bool:
        """
        Check if thumb is extended using distance from thumb tip to palm center.
        
        Thumb: tip=4, ip=3, mcp=2, cmc=1
        Wrist: 0, Index MCP: 5, Pinky MCP: 17
        """
        # Distance from thumb tip to pinky MCP (across palm)
        thumb_tip_to_pinky_mcp = self._dist(landmarks[4], landmarks[17])
        # Distance from thumb CMC to pinky MCP (palm width reference)
        palm_width = self._dist(landmarks[2], landmarks[17])
        
        if palm_width < 1e-6:
            return False
        
        # Thumb extended if tip is far from pinky side of palm
        return thumb_tip_to_pinky_mcp / palm_width > 1.2
    
    def detect(self, frame_rgb: np.ndarray) -> Tuple[Gesture, Optional[object]]:
        """
        Detect gesture in frame with temporal smoothing.
        
        Args:
            frame_rgb: RGB image
            
        Returns:
            (gesture_type, hand_landmarks) or (NONE, None)
        """
        results = self.hands.process(frame_rgb)
        
        if not results.multi_hand_landmarks:
            self._gesture_buffer.append(Gesture.NONE)
            return Gesture.NONE, None
        
        hand = results.multi_hand_landmarks[0]
        landmarks = hand.landmark
        
        # Determine handedness
        handedness = "Right"
        if results.multi_handedness:
            handedness = results.multi_handedness[0].classification[0].label
        
        # Detect raw gesture for this frame
        raw_gesture = self._classify_gesture(landmarks, handedness)
        self._gesture_buffer.append(raw_gesture)
        
        # Apply temporal smoothing: require N consecutive same gestures
        smoothed = self._get_smoothed_gesture()
        
        return smoothed, hand
    
    def _classify_gesture(self, landmarks, handedness: str) -> Gesture:
        """Classify gesture from landmarks for a single frame."""
        # Check finger states using distance-ratio method
        index_up = self._is_finger_extended(landmarks, 8, 7, 6, 5)
        middle_up = self._is_finger_extended(landmarks, 12, 11, 10, 9)
        ring_up = self._is_finger_extended(landmarks, 16, 15, 14, 13)
        pinky_up = self._is_finger_extended(landmarks, 20, 19, 18, 17)
        thumb_up = self._is_thumb_extended(landmarks, handedness)

        ring_curled = self._is_finger_curled(landmarks, 16, 15, 14, 13)
        pinky_curled = self._is_finger_curled(landmarks, 20, 19, 18, 17)
        index_curled = self._is_finger_curled(landmarks, 8, 7, 6, 5)
        middle_curled = self._is_finger_curled(landmarks, 12, 11, 10, 9)

        # ---- PEACE SIGN ----
        # Primary: index + middle UP, ring + pinky curled (thumb irrelevant)
        # Fallback: if ring/pinky are in the grey zone, check that index+middle
        # tips are significantly further from wrist than ring+pinky tips
        if index_up and middle_up and not ring_up and not pinky_up:
            return Gesture.PEACE_SIGN

        if index_up and middle_up and ring_curled and pinky_curled:
            return Gesture.PEACE_SIGN

        # ---- OPEN PALM ----
        # All 4 fingers up (thumb can be relaxed)
        if index_up and middle_up and ring_up and pinky_up:
            return Gesture.OPEN_PALM

        # ---- THUMBS UP ----
        # Thumb UP, all other fingers DOWN
        if thumb_up and index_curled and middle_curled and ring_curled and pinky_curled:
            return Gesture.THUMBS_UP

        return Gesture.NONE
    
    def _get_smoothed_gesture(self) -> Gesture:
        """
        Get temporally smoothed gesture.
        Requires N consecutive frames of the same non-NONE gesture.
        """
        if len(self._gesture_buffer) < self._consecutive_frames:
            return Gesture.NONE
        
        # Check last N frames
        recent = list(self._gesture_buffer)[-self._consecutive_frames:]
        
        # All must be the same non-NONE gesture
        if all(g == recent[0] and g != Gesture.NONE for g in recent):
            return recent[0]
        
        return Gesture.NONE
    
    def detect_peace_sign(self, frame_rgb: np.ndarray) -> bool:
        """Quick check for peace sign only."""
        gesture, _ = self.detect(frame_rgb)
        return gesture == Gesture.PEACE_SIGN
    
    def reset_buffer(self):
        """Clear the temporal smoothing buffer."""
        self._gesture_buffer.clear()
    
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
