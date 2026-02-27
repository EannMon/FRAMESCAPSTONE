"""
Gesture Constants for FRAMES
Defines the 3 supported gestures and their corresponding attendance actions.
Entry requires no gesture (face only).
"""
import enum


class GestureType(enum.Enum):
    """Supported hand gestures for attendance verification."""
    PEACE_SIGN = "PEACE_SIGN"   # ✌️ Index + middle extended → BREAK OUT
    THUMBS_UP = "THUMBS_UP"     # 👍 Only thumb extended → BREAK IN
    OPEN_PALM = "OPEN_PALM"     # ✋ All 5 fingers extended → EXIT
    OK_SIGN = "OK_SIGN"         # 👌 (legacy, not used for attendance)
    UNKNOWN = "UNKNOWN"         # Gesture not recognized


# Maps each gesture to its corresponding attendance action
# ✌️ break (out), 👍 break (in), ✋ exit. No gesture needed for entry.
GESTURE_ACTION_MAP = {
    GestureType.PEACE_SIGN: "BREAK_OUT",
    GestureType.THUMBS_UP: "BREAK_IN",
    GestureType.OPEN_PALM: "EXIT",
}

# Reverse map: action -> required gesture
ACTION_GESTURE_MAP = {v: k for k, v in GESTURE_ACTION_MAP.items()}

# Minimum confidence required to accept a gesture
GESTURE_CONFIDENCE_THRESHOLD = 0.7

# Human-readable descriptions for UI
GESTURE_DESCRIPTIONS = {
    GestureType.PEACE_SIGN: "Peace sign (✌️) - break out",
    GestureType.THUMBS_UP: "Thumbs up (👍) - break in",
    GestureType.OPEN_PALM: "Open palm (✋) - exit",
    GestureType.OK_SIGN: "OK sign (👌) - legacy",
}
