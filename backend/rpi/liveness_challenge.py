"""
Liveness Challenge Generator for FRAMES anti-spoofing.

Generates randomized finger-count challenges for ENTRY verification.
The kiosk displays "Show N fingers" where N is random (1-5).
An attacker cannot pre-prepare a photo for every possible count.

Why finger counting instead of fixed gestures:
    - 3 fixed gestures → attacker needs only 3 photos
    - 5 possible finger counts → attacker needs 5 photos AND must predict which
    - Combined with per-scan randomization, casual photo attacks become impractical

Limitations (for defense documentation):
    - Video of all finger counts could bypass (sophisticated attack)
    - True liveness requires IR/depth hardware (out of scope)
    - This is the strongest SOFTWARE-ONLY anti-spoofing on a single RGB camera

Per FRAMES_OBSERVABILITY_RULES §7.1: %-formatting only in logger calls.
"""
import logging
import random

logger = logging.getLogger(__name__)

# Challenge parameters
FINGER_COUNT_MIN = 1
FINGER_COUNT_MAX = 5

# Require this many consecutive frames showing the correct count
# before confirming — prevents false positives from flickering detections
CONSECUTIVE_FRAMES_REQUIRED = 3


def generate_entry_challenge() -> dict:
    """
    Generate a random finger count challenge for ENTRY liveness.

    Returns:
        dict with:
            target_count (int): Number of fingers the user must show (1-5).
            display_text (str): Human-readable prompt for the kiosk screen.
    """
    target = random.randint(FINGER_COUNT_MIN, FINGER_COUNT_MAX)
    display_text = "Show %d finger%s" % (target, "s" if target > 1 else "")

    logger.info("LIVENESS | Generated challenge: %s", display_text)
    return {
        "target_count": target,
        "display_text": display_text,
    }
