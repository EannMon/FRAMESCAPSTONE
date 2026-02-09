"""
Gesture Detection Test Script
Run this script to test gesture detection using your webcam.

Usage:
    cd backend
    .\venv\Scripts\activate
    python scripts/test_gesture_detection.py

Controls:
    q - Quit
    s - Save screenshot

Gestures to test:
    👌 OK Sign → BREAK_IN
    🖐️ Open Palm → BREAK_OUT
    👍 Thumbs Up → EXIT
"""
import sys
import os
import cv2
import numpy as np
import mediapipe as mp
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.gesture_detection import get_hands_detector, classify_gesture
from services.gesture_constants import GestureType, GESTURE_ACTION_MAP


# Colors (BGR)
COLOR_GREEN = (0, 255, 0)
COLOR_RED = (0, 0, 255)
COLOR_YELLOW = (0, 255, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_BLACK = (0, 0, 0)


def draw_text_with_background(image, text, position, color=COLOR_WHITE, bg_color=COLOR_BLACK, scale=0.7, thickness=2):
    """Draw text with a background rectangle for better visibility."""
    font = cv2.FONT_HERSHEY_SIMPLEX
    (text_width, text_height), baseline = cv2.getTextSize(text, font, scale, thickness)
    
    x, y = position
    padding = 5
    
    # Draw background rectangle
    cv2.rectangle(
        image,
        (x - padding, y - text_height - padding),
        (x + text_width + padding, y + baseline + padding),
        bg_color,
        -1
    )
    
    # Draw text
    cv2.putText(image, text, position, font, scale, color, thickness)


def draw_landmarks_manual(image, landmarks):
    """Draw hand landmarks and connections manually using OpenCV."""
    h, w, _ = image.shape
    
    # Define connections (pairs of landmark indices)
    connections = [
        (0, 1), (1, 2), (2, 3), (3, 4),         # Thumb
        (0, 5), (5, 6), (6, 7), (7, 8),         # Index
        (0, 9), (9, 10), (10, 11), (11, 12),    # Middle
        (0, 13), (13, 14), (14, 15), (15, 16),  # Ring
        (0, 17), (17, 18), (18, 19), (19, 20),  # Pinky
        (5, 9), (9, 13), (13, 17)               # Palm base
    ]
    
    # Convert normalized landmarks to pixel coordinates
    points = []
    for lm in landmarks:
        px = int(lm.x * w)
        py = int(lm.y * h)
        points.append((px, py))
    
    # Draw lines
    for start_idx, end_idx in connections:
        cv2.line(image, points[start_idx], points[end_idx], COLOR_WHITE, 2)
        
    # Draw points
    for i, point in enumerate(points):
        # Tips are larger
        radius = 6 if i in [4, 8, 12, 16, 20] else 3
        color = COLOR_GREEN if i in [4, 8, 12, 16, 20] else COLOR_RED
        cv2.circle(image, point, radius, color, -1)


def main():
    print("=" * 60)
    print("🖐️  FRAMES Gesture Detection Test")
    print("=" * 60)
    print("\nGestures to test:")
    print("  👌 OK Sign     → BREAK_IN")
    print("  🖐️ Open Palm   → BREAK_OUT")
    print("  👍 Thumbs Up   → EXIT")
    print("\nControls:")
    print("  q - Quit")
    print("  s - Save screenshot")
    print("=" * 60)
    
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Could not open webcam!")
        print("   Make sure your webcam is connected and not in use by another app.")
        return
    
    # Set resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    # Get detector from service
    detector = get_hands_detector()
    
    print("\n✅ Webcam opened! Show your hand gestures...")
    print("   Press 'q' to quit\n")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to read frame")
            break
        
        # Flip for mirror effect
        frame = cv2.flip(frame, 1)
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Detect hands
        detection_result = detector.detect(mp_image)
        
        # Default status
        gesture_text = "No hand detected"
        action_text = ""
        status_color = COLOR_YELLOW
        confidence_text = ""
        
        if detection_result.hand_landmarks:
            # Get first hand
            hand_landmarks_list = detection_result.hand_landmarks[0]
            
            # Draw landmarks
            draw_landmarks_manual(frame, hand_landmarks_list)
            
            # Wrap for classification
            class LandmarkWrapper:
                def __init__(self, landmarks):
                    self.landmark = landmarks
            
            wrapped_landmarks = LandmarkWrapper(hand_landmarks_list)
            
            # Classify gesture
            gesture, confidence = classify_gesture(wrapped_landmarks)
            
            if gesture != GestureType.UNKNOWN.value:
                gesture_text = f"Gesture: {gesture}"
                confidence_text = f"Confidence: {confidence:.0%}"
                
                # Get corresponding action
                try:
                    gesture_type = GestureType(gesture)
                    action = GESTURE_ACTION_MAP.get(gesture_type, "N/A")
                    action_text = f"Action: {action}"
                    status_color = COLOR_GREEN
                except ValueError:
                    pass
            else:
                gesture_text = "Unknown gesture"
                status_color = COLOR_RED
                confidence_text = f"Confidence: {confidence:.0%}"
        
        # Draw status box
        draw_text_with_background(frame, gesture_text, (20, 40), status_color)
        
        if action_text:
            draw_text_with_background(frame, action_text, (20, 80), COLOR_WHITE)
        
        if confidence_text:
            draw_text_with_background(frame, confidence_text, (20, 120), COLOR_WHITE)
        
        # Draw instructions
        draw_text_with_background(
            frame, 
            "Press 'q' to quit | 's' to save screenshot", 
            (20, frame.shape[0] - 20),
            COLOR_WHITE,
            scale=0.5
        )
        
        # Show frame
        cv2.imshow("FRAMES Gesture Test", frame)
        
        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            print("\n👋 Exiting...")
            break
        elif key == ord('s'):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"gesture_screenshot_{timestamp}.jpg"
            cv2.imwrite(filename, frame)
            print(f"📸 Screenshot saved: {filename}")
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    
    print("✅ Test complete!")


if __name__ == "__main__":
    main()
