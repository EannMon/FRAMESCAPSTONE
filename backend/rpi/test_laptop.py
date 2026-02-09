"""
Laptop Test Script for Face Recognition Pipeline
Tests the full recognition flow using laptop webcam before RPi deployment.
"""
import cv2
import sys
import os
import time

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rpi.config import KioskConfig
from rpi.face_detector import FaceDetector
from rpi.face_recognizer import FaceRecognizer
from rpi.gesture_detector import GestureDetector, Gesture
from rpi.embedding_cache import EmbeddingCache


def main():
    """Test face recognition on laptop before RPi deployment."""
    print("\n" + "=" * 60)
    print("   FRAMES - Laptop Recognition Test")
    print("=" * 60)
    
    config = KioskConfig()
    
    # Initialize components
    print("\n🔄 Loading face detector...")
    face_detector = FaceDetector(min_confidence=config.FACE_DET_CONFIDENCE)
    
    print("🔄 Loading face recognizer (InsightFace)...")
    face_recognizer = FaceRecognizer(
        model_name=config.INSIGHTFACE_MODEL,
        det_size=config.RECOGNITION_DET_SIZE
    )
    
    print("🔄 Loading gesture detector...")
    gesture_detector = GestureDetector(min_confidence=config.GESTURE_CONFIDENCE)
    
    print("📥 Loading embedding cache...")
    cache = EmbeddingCache()
    
    cache_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        config.EMBEDDINGS_CACHE_PATH
    )
    
    if os.path.exists(cache_path):
        cache.load_from_json(cache_path)
        print(f"✅ Loaded {cache.count} enrolled faces")
    else:
        print(f"⚠️ No cache found at {cache_path}")
        print("   Run: python scripts/export_embeddings.py first")
        return
    
    if cache.count == 0:
        print("❌ No enrolled faces in cache!")
        return
    
    # Open webcam
    print("\n📷 Opening webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Failed to open webcam!")
        return
    
    print("\n" + "-" * 60)
    print("  LIVE TEST - Press 'q' to quit, 'g' for gesture test")
    print("-" * 60)
    
    recognized_count = 0
    frame_count = 0
    last_match = None
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                continue
            
            frame_count += 1
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            display_frame = frame.copy()
            
            # Face recognition
            embedding, det_score, bbox = face_recognizer.get_embedding(frame_rgb)
            
            status_text = "No face"
            status_color = (128, 128, 128)
            
            if embedding is not None:
                match, confidence = cache.find_match(
                    embedding, 
                    threshold=config.MATCH_THRESHOLD
                )
                
                if match:
                    recognized_count += 1
                    last_match = match
                    status_text = f"{match.name}: {confidence:.0%}"
                    status_color = (0, 255, 0)  # Green
                    
                    # Draw bounding box
                    if bbox is not None:
                        x1, y1, x2, y2 = bbox
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(display_frame, status_text, (x1, y1 - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                else:
                    status_text = f"Unknown ({confidence:.0%})"
                    status_color = (0, 165, 255)  # Orange
                    
                    if bbox is not None:
                        x1, y1, x2, y2 = bbox
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
            
            # Gesture detection
            gesture, hand = gesture_detector.detect(frame_rgb)
            gesture_text = gesture.value
            
            if gesture != Gesture.NONE:
                gesture_text = f"✋ {gesture.value}"
                if hand:
                    gesture_detector.draw_landmarks(display_frame, hand)
            
            # Display info
            cv2.putText(display_frame, status_text, (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2)
            cv2.putText(display_frame, gesture_text, (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            cv2.putText(display_frame, f"Frame: {frame_count}", (10, display_frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (128, 128, 128), 1)
            
            # Show frame
            cv2.imshow("FRAMES - Laptop Test", display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('g'):
                print("\n✋ Testing gesture detection - show peace sign...")
                start = time.time()
                detected = False
                while time.time() - start < 5:
                    ret, frame = cap.read()
                    if ret:
                        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        g, _ = gesture_detector.detect(frame_rgb)
                        if g == Gesture.PEACE_SIGN:
                            print("✅ Peace sign detected!")
                            detected = True
                            break
                    time.sleep(0.05)
                if not detected:
                    print("⚠️ Gesture timeout")
    
    except KeyboardInterrupt:
        pass
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        face_detector.close()
        gesture_detector.close()
    
    print("\n" + "=" * 60)
    print(f"   TEST COMPLETE")
    print(f"   Recognized: {recognized_count} frames")
    if last_match:
        print(f"   Last match: {last_match.name}")
    print("=" * 60)


if __name__ == "__main__":
    main()
