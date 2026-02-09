"""
Gesture Constants for FRAMES
Defines the 3 supported gestures and their corresponding attendance actions.
"""
import enum


class GestureType(enum.Enum):
    """Supported hand gestures for attendance verification."""
    OK_SIGN = "OK_SIGN"         # 👌 Thumb + index finger circle
    OPEN_PALM = "OPEN_PALM"     # 🖐️ All 5 fingers extended
    THUMBS_UP = "THUMBS_UP"     # 👍 Only thumb extended
    UNKNOWN = "UNKNOWN"         # Gesture not recognized


# Maps each gesture to its corresponding attendance action
GESTURE_ACTION_MAP = {
    GestureType.OK_SIGN: "BREAK_IN",
    GestureType.OPEN_PALM: "BREAK_OUT",
    GestureType.THUMBS_UP: "EXIT",
}

# Reverse map: action -> required gesture
ACTION_GESTURE_MAP = {v: k for k, v in GESTURE_ACTION_MAP.items()}

# Minimum confidence required to accept a gesture
GESTURE_CONFIDENCE_THRESHOLD = 0.7

# Human-readable descriptions for UI
GESTURE_DESCRIPTIONS = {
    GestureType.OK_SIGN: "Make an OK sign (👌) - thumb and index finger touching",
    GestureType.OPEN_PALM: "Show your open palm (🖐️) - all fingers extended",
    GestureType.THUMBS_UP: "Give a thumbs up (👍) - only thumb extended",
}
