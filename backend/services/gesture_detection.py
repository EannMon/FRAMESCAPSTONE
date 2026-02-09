"""
Gesture Detection Service for FRAMES
Uses MediaPipe Hands to detect hand gestures for attendance verification.

Supported gestures:
- OK_SIGN (👌) → BREAK_IN
- OPEN_PALM (🖐️) → BREAK_OUT
- THUMBS_UP (👍) → EXIT
"""
import numpy as np
import cv2
import base64
from typing import Tuple, Optional, List
import os
import urllib.request
import logging
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

logger = logging.getLogger(__name__)

# Global MediaPipe instance (lazy-loaded)
_hands_detector = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'hand_landmarker.task')

def get_hands_detector():
    """
    Lazy-load MediaPipe Hands detector using the new Tasks API.
    Downloads the model file if missing.
    """
    global _hands_detector
    
    if _hands_detector is None:
        try:
            # Download model if missing
            if not os.path.exists(MODEL_PATH):
                print(f"⬇️ Downloading MediaPipe Hand Landmarker model to {MODEL_PATH}...")
                url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
                urllib.request.urlretrieve(url, MODEL_PATH)
                print("✅ Model downloaded successfully!")
            
            # Initialize HandLandmarker
            base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=1,
                min_hand_detection_confidence=0.7,
                min_hand_presence_confidence=0.5,
                min_tracking_confidence=0.5
            )
            _hands_detector = vision.HandLandmarker.create_from_options(options)
            logger.info("✅ MediaPipe HandLandmarker loaded successfully!")
            
        except Exception as e:
            logger.error(f"❌ Failed to load MediaPipe: {e}")
            raise
    
    return _hands_detector


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


def get_finger_states(hand_landmarks) -> dict:
    """
    Determine which fingers are extended based on landmark positions.
    
    MediaPipe hand landmarks:
    - Thumb: 1-4 (tip is 4)
    - Index: 5-8 (tip is 8)
    - Middle: 9-12 (tip is 12)
    - Ring: 13-16 (tip is 16)
    - Pinky: 17-20 (tip is 20)
    
    Returns dict: {finger_name: is_extended}
    """
    landmarks = hand_landmarks.landmark
    
    # For thumb: compare x position (because thumb points sideways)
    # Thumb is extended if tip (4) is further from palm than knuckle (2)
    thumb_extended = landmarks[4].x < landmarks[2].x  # Assuming right hand
    
    # For other fingers: compare y position (tip should be above pip joint)
    # Note: y increases downward in image coordinates
    index_extended = landmarks[8].y < landmarks[6].y
    middle_extended = landmarks[12].y < landmarks[10].y
    ring_extended = landmarks[16].y < landmarks[14].y
    pinky_extended = landmarks[20].y < landmarks[18].y
    
    return {
        "thumb": thumb_extended,
        "index": index_extended,
        "middle": middle_extended,
        "ring": ring_extended,
        "pinky": pinky_extended,
    }


def is_ok_sign(hand_landmarks) -> Tuple[bool, float]:
    """
    Detect OK sign (👌): thumb and index finger tips touching, other fingers extended.
    
    Returns: (is_ok_sign, confidence)
    """
    landmarks = hand_landmarks.landmark
    finger_states = get_finger_states(hand_landmarks)
    
    # Calculate distance between thumb tip (4) and index tip (8)
    thumb_tip = landmarks[4]
    index_tip = landmarks[8]
    
    distance = np.sqrt(
        (thumb_tip.x - index_tip.x) ** 2 +
        (thumb_tip.y - index_tip.y) ** 2 +
        (thumb_tip.z - index_tip.z) ** 2
    )
    
    # Check if thumb and index are close (forming circle)
    tips_touching = distance < 0.08  # Threshold for "touching"
    
    # Check if other fingers are extended
    other_fingers_extended = (
        finger_states["middle"] and
        finger_states["ring"] and
        finger_states["pinky"]
    )
    
    is_ok = tips_touching and other_fingers_extended
    
    # Confidence based on how close the tips are and finger positions
    confidence = 0.0
    if is_ok:
        # Closer tips = higher confidence
        confidence = max(0.7, 1.0 - (distance * 5))
    
    return is_ok, confidence


def is_open_palm(hand_landmarks) -> Tuple[bool, float]:
    """
    Detect open palm (🖐️): all 5 fingers extended.
    
    Returns: (is_open_palm, confidence)
    """
    finger_states = get_finger_states(hand_landmarks)
    
    # All fingers should be extended
    all_extended = all(finger_states.values())
    
    # Count extended fingers for confidence calculation
    extended_count = sum(finger_states.values())
    confidence = extended_count / 5.0 if all_extended else 0.0
    
    return all_extended, confidence


def is_thumbs_up(hand_landmarks) -> Tuple[bool, float]:
    """
    Detect thumbs up (👍): only thumb extended, all other fingers closed.
    
    Returns: (is_thumbs_up, confidence)
    """
    finger_states = get_finger_states(hand_landmarks)
    
    # Only thumb should be extended
    thumb_only = (
        finger_states["thumb"] and
        not finger_states["index"] and
        not finger_states["middle"] and
        not finger_states["ring"] and
        not finger_states["pinky"]
    )
    
    # Calculate confidence based on how definitively the gesture is formed
    confidence = 0.0
    if thumb_only:
        # Check thumb is clearly up (tip higher than base)
        landmarks = hand_landmarks.landmark
        thumb_tip_y = landmarks[4].y
        thumb_base_y = landmarks[2].y
        
        if thumb_tip_y < thumb_base_y:  # Thumb pointing up
            confidence = 0.9
        else:
            confidence = 0.75
    
    return thumb_only, confidence


def classify_gesture(hand_landmarks) -> Tuple[str, float]:
    """
    Classify the gesture shown by the hand.
    
    Returns: (gesture_type, confidence)
    """
    from services.gesture_constants import GestureType
    
    # Check each gesture type
    is_ok, ok_conf = is_ok_sign(hand_landmarks)
    is_palm, palm_conf = is_open_palm(hand_landmarks)
    is_thumbs, thumbs_conf = is_thumbs_up(hand_landmarks)
    
    # Return the gesture with highest confidence
    gestures = [
        (GestureType.OK_SIGN.value, ok_conf if is_ok else 0),
        (GestureType.OPEN_PALM.value, palm_conf if is_palm else 0),
        (GestureType.THUMBS_UP.value, thumbs_conf if is_thumbs else 0),
    ]
    
    best_gesture, best_conf = max(gestures, key=lambda x: x[1])
    
    if best_conf < 0.5:
        return GestureType.UNKNOWN.value, 0.0
    
    return best_gesture, best_conf


def detect_gesture(image: np.ndarray) -> Tuple[Optional[str], float]:
    """
    Detect gesture from an image.
    
    Args:
        image: BGR image (OpenCV format)
    
    Returns:
        (gesture_type, confidence) or (None, 0.0) if no hand detected
    """
    from services.gesture_constants import GestureType
    import mediapipe as mp
    
    # Get MediaPipe detector
    detector = get_hands_detector()
    
    # Convert BGR to RGB (MediaPipe uses RGB)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Create MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    
    # Process image
    detection_result = detector.detect(mp_image)
    
    # Check if hand was detected
    if not detection_result.hand_landmarks:
        return None, 0.0
    
    # Use the first detected hand
    # Note: New API returns list of lists of landmarks
    hand_landmarks_list = detection_result.hand_landmarks[0]
    
    # Wrap landmarks in an object that mimics the old API structure for compatibility
    # The logic functions expect an object with a .landmark attribute being a list
    class LandmarkWrapper:
        def __init__(self, landmarks):
            self.landmark = landmarks
            
    hand_landmarks = LandmarkWrapper(hand_landmarks_list)
    
    # Classify gesture
    gesture, confidence = classify_gesture(hand_landmarks)
    
    return gesture, confidence


def detect_gesture_from_base64(base64_image: str) -> Tuple[Optional[str], float]:
    """
    Detect gesture from a base64-encoded image.
    
    Args:
        base64_image: Base64 encoded image string
    
    Returns:
        (gesture_type, confidence) or (None, 0.0) if no hand detected
    """
    try:
        image = decode_base64_image(base64_image)
        return detect_gesture(image)
    except Exception as e:
        logger.error(f"Error detecting gesture: {e}")
        return None, 0.0


def validate_gesture_for_action(base64_image: str, expected_action: str) -> dict:
    """
    Validate if the detected gesture matches the expected action.
    
    Args:
        base64_image: Base64 encoded image
        expected_action: Expected action (BREAK_IN, BREAK_OUT, or EXIT)
    
    Returns:
        {
            "valid": bool,
            "detected_gesture": str or None,
            "expected_gesture": str,
            "confidence": float,
            "message": str
        }
    """
    from services.gesture_constants import (
        ACTION_GESTURE_MAP, 
        GestureType,
        GESTURE_CONFIDENCE_THRESHOLD,
        GESTURE_DESCRIPTIONS
    )
    
    # Get the expected gesture for this action
    expected_gesture = ACTION_GESTURE_MAP.get(expected_action)
    if expected_gesture is None:
        return {
            "valid": False,
            "detected_gesture": None,
            "expected_gesture": None,
            "confidence": 0.0,
            "message": f"Invalid action: {expected_action}"
        }
    
    # Detect gesture
    detected_gesture, confidence = detect_gesture_from_base64(base64_image)
    
    # Validate
    if detected_gesture is None:
        return {
            "valid": False,
            "detected_gesture": None,
            "expected_gesture": expected_gesture.value,
            "confidence": 0.0,
            "message": "No hand detected. Please show your hand clearly."
        }
    
    is_valid = (
        detected_gesture == expected_gesture.value and 
        confidence >= GESTURE_CONFIDENCE_THRESHOLD
    )
    
    if is_valid:
        message = f"✅ Gesture verified: {detected_gesture}"
    elif detected_gesture != expected_gesture.value:
        expected_desc = GESTURE_DESCRIPTIONS.get(expected_gesture, expected_gesture.value)
        message = f"❌ Wrong gesture. Please {expected_desc}"
    else:
        message = f"⚠️ Low confidence ({confidence:.0%}). Please show gesture more clearly."
    
    return {
        "valid": is_valid,
        "detected_gesture": detected_gesture,
        "expected_gesture": expected_gesture.value,
        "confidence": confidence,
        "message": message
    }
