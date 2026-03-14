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
            static_image_mode=False,  # Video mode — fast tracking (~50ms vs ~2000ms)
            max_num_hands=1,
            min_detection_confidence=min_confidence,
            min_tracking_confidence=0.3
        )
        self.mp_draw = mp.solutions.drawing_utils
        
        # Temporal smoothing buffer
        self._consecutive_frames = consecutive_frames
        self._gesture_buffer: deque = deque(maxlen=max(consecutive_frames * 2, 8))
        
        # Diagnostic counters (reset on each gesture session via reset_buffer)
        self._diag_frames = 0
        self._diag_hand_found = 0
        self._diag_gesture_found = 0
        
        logger.info("GestureDetector initialized (confidence=%.2f, "
                     "consecutive=%d, static_image_mode=False)",
                     min_confidence, consecutive_frames)
    
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
        return ratio > 1.3  # Extended if tip is 1.3x further than PIP from MCP
    
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
        return ratio < 2.0  # Curled if ratio below 2.0 (lenient)
    
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
        self._diag_frames += 1
        
        if not results.multi_hand_landmarks:
            self._gesture_buffer.append(Gesture.NONE)
            # Log diagnostics every 10 frames so we can see what's happening
            if self._diag_frames % 10 == 0:
                logger.info("GESTURE_DIAG | frames=%d hand_found=%d gesture_found=%d (no hand this frame)",
                            self._diag_frames, self._diag_hand_found, self._diag_gesture_found)
            return Gesture.NONE, None
        
        self._diag_hand_found += 1
        hand = results.multi_hand_landmarks[0]
        landmarks = hand.landmark
        
        # Determine handedness
        handedness = "Right"
        if results.multi_handedness:
            handedness = results.multi_handedness[0].classification[0].label
        
        # Detect raw gesture for this frame
        raw_gesture = self._classify_gesture(landmarks, handedness)
        self._gesture_buffer.append(raw_gesture)
        
        if raw_gesture != Gesture.NONE:
            self._diag_gesture_found += 1
        
        logger.info("GESTURE_DIAG | hand_found! raw=%s hand=%s (frames=%d found=%d gestures=%d)",
                    raw_gesture.value, handedness,
                    self._diag_frames, self._diag_hand_found, self._diag_gesture_found)
        
        # Apply temporal smoothing: require N out of last M frames
        smoothed = self._get_smoothed_gesture()
        
        return smoothed, hand
    
    def _finger_ratio(self, landmarks, tip: int, pip: int, mcp: int) -> float:
        """Get the tip-to-mcp / pip-to-mcp ratio for a finger."""
        tip_to_mcp = self._dist(landmarks[tip], landmarks[mcp])
        pip_to_mcp = self._dist(landmarks[pip], landmarks[mcp])
        if pip_to_mcp < 1e-6:
            return 0.0
        return tip_to_mcp / pip_to_mcp

    def _classify_gesture(self, landmarks, handedness: str) -> Gesture:
        """Classify gesture from landmarks for a single frame."""
        # Get raw extension ratios for all fingers
        idx_ratio = self._finger_ratio(landmarks, 8, 6, 5)
        mid_ratio = self._finger_ratio(landmarks, 12, 10, 9)
        ring_ratio = self._finger_ratio(landmarks, 16, 14, 13)
        pinky_ratio = self._finger_ratio(landmarks, 20, 18, 17)
        thumb_up = self._is_thumb_extended(landmarks, handedness)

        # Boolean states using thresholds
        index_up = idx_ratio > 1.3
        middle_up = mid_ratio > 1.3
        ring_up = ring_ratio > 1.3
        pinky_up = pinky_ratio > 1.3

        index_curled = idx_ratio < 1.5
        middle_curled = mid_ratio < 1.5
        ring_curled = ring_ratio < 1.5
        pinky_curled = pinky_ratio < 1.5

        logger.debug("FINGERS | idx=%.2f mid=%.2f ring=%.2f pinky=%.2f thumb=%s",
                     idx_ratio, mid_ratio, ring_ratio, pinky_ratio, thumb_up)

        # ---- PEACE SIGN ----
        # Index + middle must be clearly more extended than ring + pinky.
        # Uses relative comparison so lowered thresholds don't cause
        # a peace sign to be mis-detected as open palm.
        if index_up and middle_up:
            avg_up = (idx_ratio + mid_ratio) / 2
            avg_down = (ring_ratio + pinky_ratio) / 2
            # The two raised fingers should be at least 15% more extended
            if avg_up > avg_down * 1.15:
                return Gesture.PEACE_SIGN

        # ---- OPEN PALM ----
        # All 4 fingers clearly extended (thumb can be relaxed)
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
        Requires N non-NONE matching gestures out of the last M frames.
        This tolerates MediaPipe dropping hand detection on some frames,
        which previously caused consecutive-frame checks to always fail.
        """
        if len(self._gesture_buffer) < self._consecutive_frames:
            return Gesture.NONE
        
        # Look at a wider window (last M frames) and count occurrences
        window = list(self._gesture_buffer)  # up to maxlen (8)
        
        # Count each non-NONE gesture in the window
        counts = {}
        for g in window:
            if g != Gesture.NONE:
                counts[g] = counts.get(g, 0) + 1
        
        # Find the most common gesture that meets the threshold
        for gesture, count in counts.items():
            if count >= self._consecutive_frames:
                logger.debug("GESTURE | smoothed=%s (count=%d/%d in window)", gesture.value, count, len(window))
                return gesture
        
        return Gesture.NONE
    
    def count_fingers(self, frame_rgb: np.ndarray) -> Tuple[Optional[int], Optional[object]]:
        """
        Count extended fingers in frame.

        Uses the same distance-based extension checks as gesture detection
        for angle-invariant finger counting. Does NOT apply temporal
        smoothing — the caller is responsible for consecutive-frame logic.

        Returns:
            (count, hand_landmarks) where count is 0-5,
            or (None, None) if no hand detected.
        """
        results = self.hands.process(frame_rgb)

        if not results.multi_hand_landmarks:
            return None, None

        hand = results.multi_hand_landmarks[0]
        landmarks = hand.landmark

        handedness = "Right"
        if results.multi_handedness:
            handedness = results.multi_handedness[0].classification[0].label

        count = 0
        if self._is_thumb_extended(landmarks, handedness):
            count += 1
        if self._is_finger_extended(landmarks, 8, 7, 6, 5):    # Index
            count += 1
        if self._is_finger_extended(landmarks, 12, 11, 10, 9):  # Middle
            count += 1
        if self._is_finger_extended(landmarks, 16, 15, 14, 13):  # Ring
            count += 1
        if self._is_finger_extended(landmarks, 20, 19, 18, 17):  # Pinky
            count += 1

        return count, hand

    def detect_peace_sign(self, frame_rgb: np.ndarray) -> bool:
        """Quick check for peace sign only."""
        gesture, _ = self.detect(frame_rgb)
        return gesture == Gesture.PEACE_SIGN
    
    def reset_buffer(self):
        """Clear the temporal smoothing buffer and reset diagnostics."""
        self._gesture_buffer.clear()
        self._diag_frames = 0
        self._diag_hand_found = 0
        self._diag_gesture_found = 0
    
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
