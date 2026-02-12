"""
Laptop Test Script for Face Recognition Pipeline
Tests the full recognition flow using laptop webcam before RPi deployment.

Shows real-time debug info: similarity scores, top matches, gesture state.

Usage:
    python rpi/test_laptop.py          # Laptop mode (default)
    python rpi/test_laptop.py --rpi     # Simulate RPi mode (gated detection)
"""
import cv2
import sys
import os
import time
import argparse
import numpy as np

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rpi.config import KioskConfig
from rpi.face_detector import FaceDetector
from rpi.face_recognizer import FaceRecognizer
from rpi.gesture_detector import GestureDetector, Gesture
from rpi.embedding_cache import EmbeddingCache


def main():
    """Test face recognition on laptop before RPi deployment."""
    parser = argparse.ArgumentParser(description="FRAMES Recognition Pipeline Test")
    parser.add_argument("--rpi", action="store_true", help="Simulate RPi mode (gated detection, lower resolution)")
    args = parser.parse_args()
    
    # Force platform if --rpi flag is used
    if args.rpi:
        os.environ["FRAMES_PLATFORM"] = "rpi"
    
    print("\n" + "=" * 60)
    print("   FRAMES - Recognition Pipeline Test")
    print("=" * 60)
    
    config = KioskConfig()
    if args.rpi:
        # Override to rpi settings but keep camera resolution OK for laptop
        config.PLATFORM = "rpi"
        config.USE_GATED_DETECTION = True
        config.RECOGNITION_DET_SIZE = (320, 320)
        config.RECOGNITION_FRAME_SKIP = 1  # Keep every frame for laptop testing
    
    print(f"\n   Platform: {config.PLATFORM.upper()}")
    print(f"   Gated detection: {'ON' if config.USE_GATED_DETECTION else 'OFF'}")
    
    # Initialize components
    print(f"\n🔄 Loading face detector...")
    face_detector = FaceDetector(min_confidence=config.FACE_DET_CONFIDENCE)
    
    print(f"🔄 Loading face recognizer (InsightFace {config.INSIGHTFACE_MODEL})...")
    print(f"   Detection size: {config.RECOGNITION_DET_SIZE}")
    face_recognizer = FaceRecognizer(
        model_name=config.INSIGHTFACE_MODEL,
        det_size=config.RECOGNITION_DET_SIZE
    )
    
    print(f"🔄 Loading gesture detector (consecutive_frames={config.GESTURE_CONSECUTIVE_FRAMES})...")
    gesture_detector = GestureDetector(
        min_confidence=config.GESTURE_CONFIDENCE,
        consecutive_frames=config.GESTURE_CONSECUTIVE_FRAMES
    )
    
    print("📥 Loading embedding cache...")
    cache = EmbeddingCache()
    
    cache_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        config.EMBEDDINGS_CACHE_PATH
    )
    
    if os.path.exists(cache_path):
        cache.load_from_json(cache_path)
        print(f"✅ Loaded {cache.count} enrolled faces")
        # Show enrolled users
        for face in cache.faces:
            print(f"   - {face.name} ({face.email}) quality={face.quality:.2f}")
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
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.CAMERA_HEIGHT)
    
    print("\n" + "-" * 60)
    print("  LIVE TEST")
    print("  Controls:")
    print("    'q' = quit")
    print("    'd' = toggle debug (show top-3 matches)")
    print("    'g' = test gesture (8 second window)")
    print(f"  Match threshold: {config.MATCH_THRESHOLD}")
    print(f"  Model: {config.INSIGHTFACE_MODEL} @ {config.RECOGNITION_DET_SIZE}")
    print(f"  Gated: {'ON (MediaPipe gate → InsightFace)' if config.USE_GATED_DETECTION else 'OFF (InsightFace direct)'}")
    print("-" * 60)
    
    recognized_count = 0
    frame_count = 0
    last_match = None
    show_debug = True  # Show debug by default
    fps_timer = time.time()
    fps = 0.0
    gate_hits = 0  # Frames where MediaPipe found a face (gated mode)
    gate_misses = 0
    recognition_time_ms = 0.0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                continue
            
            frame_count += 1
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            display_frame = frame.copy()
            
            # Calculate FPS
            if frame_count % 10 == 0:
                fps = 10.0 / (time.time() - fps_timer)
                fps_timer = time.time()
            
            # Face recognition — gated or direct depending on config
            t_start = time.time()
            embedding = None
            det_score = 0.0
            bbox = None
            gate_status = ""
            
            if config.USE_GATED_DETECTION:
                # STAGE 1: Fast MediaPipe detection (gate)
                face_bbox = face_detector.get_largest_face(frame_rgb)
                if face_bbox is not None:
                    _, _, fw, fh, fconf = face_bbox
                    if fw >= config.MIN_FACE_SIZE_PX and fh >= config.MIN_FACE_SIZE_PX:
                        gate_hits += 1
                        gate_status = f"Gate: HIT ({fconf:.0%})"
                        # STAGE 2: InsightFace embedding
                        embedding, det_score, bbox = face_recognizer.get_embedding(frame_rgb)
                    else:
                        gate_misses += 1
                        gate_status = f"Gate: face too small ({fw}x{fh}px)"
                else:
                    gate_misses += 1
                    gate_status = "Gate: no face"
            else:
                # Direct mode
                embedding, det_score, bbox = face_recognizer.get_embedding(frame_rgb)
            
            recognition_time_ms = (time.time() - t_start) * 1000
            
            status_text = "No face detected"
            status_color = (128, 128, 128)
            
            if embedding is not None:
                match, confidence = cache.find_match(
                    embedding, 
                    threshold=config.MATCH_THRESHOLD
                )
                
                if match:
                    recognized_count += 1
                    last_match = match
                    status_text = f"MATCH: {match.name} ({confidence:.1%})"
                    status_color = (0, 255, 0)  # Green
                    
                    # Draw bounding box - green for match
                    if bbox is not None:
                        x1, y1, x2, y2 = bbox
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(display_frame, f"{match.name}", (x1, y1 - 30),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                        cv2.putText(display_frame, f"{confidence:.1%}", (x1, y1 - 8),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                else:
                    status_text = f"UNKNOWN (best: {confidence:.1%}, need: {config.MATCH_THRESHOLD:.0%})"
                    status_color = (0, 0, 255)  # Red
                    
                    if bbox is not None:
                        x1, y1, x2, y2 = bbox
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(display_frame, f"Unknown {confidence:.1%}", (x1, y1 - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                
                # Show top-3 matches in debug mode
                if show_debug:
                    top_matches = cache.find_top_matches(embedding, top_k=3)
                    y_offset = 120
                    cv2.putText(display_frame, "--- Top Matches ---", (10, y_offset),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                    for i, (face, score) in enumerate(top_matches):
                        y_offset += 22
                        color = (0, 255, 0) if score >= config.MATCH_THRESHOLD else (100, 100, 255)
                        text = f"  {i+1}. {face.name}: {score:.3f} ({score:.1%})"
                        cv2.putText(display_frame, text, (10, y_offset),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)
                    
                    # Show detection score
                    y_offset += 25
                    cv2.putText(display_frame, f"Det score: {det_score:.2f}", (10, y_offset),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
            
            # Gesture detection (runs every frame for smoothing)
            gesture, hand = gesture_detector.detect(frame_rgb)
            
            gesture_color = (128, 128, 128)
            if gesture == Gesture.PEACE_SIGN:
                gesture_text = "PEACE SIGN detected!"
                gesture_color = (0, 255, 0)
            elif gesture == Gesture.THUMBS_UP:
                gesture_text = "THUMBS UP detected!"
                gesture_color = (0, 255, 0)
            elif gesture == Gesture.OPEN_PALM:
                gesture_text = "OPEN PALM detected!"
                gesture_color = (0, 255, 0)
            else:
                gesture_text = "Gesture: none"
                if hand:
                    gesture_text = "Hand seen (no gesture)"
                    gesture_color = (0, 200, 255)
            
            if hand:
                gesture_detector.draw_landmarks(display_frame, hand)
            
            # Display overlay
            # Top bar - Face status
            cv2.putText(display_frame, status_text, (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
            
            # Gesture status
            cv2.putText(display_frame, gesture_text, (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, gesture_color, 2)
            
            # Bottom info bar
            h = display_frame.shape[0]
            info_y = h - 10
            mode_str = f"GATED ({config.RECOGNITION_DET_SIZE[0]})" if config.USE_GATED_DETECTION else "DIRECT"
            cv2.putText(display_frame, f"FPS: {fps:.0f} | {recognition_time_ms:.0f}ms | "
                       f"{config.INSIGHTFACE_MODEL} {mode_str} | Thr: {config.MATCH_THRESHOLD}", 
                       (10, info_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (128, 128, 128), 1)
            
            # Debug mode indicator
            if show_debug:
                debug_text = "[DEBUG ON - press 'd' to toggle]"
                if config.USE_GATED_DETECTION:
                    total_gate = gate_hits + gate_misses
                    gate_pct = (gate_hits / total_gate * 100) if total_gate > 0 else 0
                    debug_text += f"  |  Gate: {gate_hits}/{total_gate} ({gate_pct:.0f}%)"
                cv2.putText(display_frame, debug_text, (10, 90),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 0), 1)
                if gate_status and config.USE_GATED_DETECTION:
                    cv2.putText(display_frame, gate_status, (10, 105),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 0), 1)
            
            # Show frame
            cv2.imshow("FRAMES - Laptop Test", display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('d'):
                show_debug = not show_debug
                print(f"Debug mode: {'ON' if show_debug else 'OFF'}")
            elif key == ord('g'):
                print("\n✋ Testing gesture detection - show a gesture (8 seconds)...")
                gesture_detector.reset_buffer()
                start = time.time()
                detected_gesture = None
                while time.time() - start < 8:
                    ret, frame = cap.read()
                    if ret:
                        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        g, hand = gesture_detector.detect(frame_rgb)
                        
                        display = frame.copy()
                        remaining = 8 - (time.time() - start)
                        cv2.putText(display, f"Show gesture... ({remaining:.1f}s)", (10, 30),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                        cv2.putText(display, f"Detected: {g.value}", (10, 60),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, 
                                   (0, 255, 0) if g != Gesture.NONE else (128, 128, 128), 2)
                        
                        if hand:
                            gesture_detector.draw_landmarks(display, hand)
                        
                        cv2.imshow("FRAMES - Laptop Test", display)
                        cv2.waitKey(1)
                        
                        if g != Gesture.NONE:
                            print(f"✅ {g.value} detected!")
                            detected_gesture = g
                            break
                    time.sleep(0.03)
                if not detected_gesture:
                    print("⚠️ Gesture timeout - no gesture confirmed")
    
    except KeyboardInterrupt:
        pass
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        face_detector.close()
        gesture_detector.close()
    
    print("\n" + "=" * 60)
    print(f"   TEST COMPLETE")
    print(f"   Platform: {config.PLATFORM.upper()}")
    print(f"   Model: {config.INSIGHTFACE_MODEL} @ {config.RECOGNITION_DET_SIZE}")
    print(f"   Gated detection: {'ON' if config.USE_GATED_DETECTION else 'OFF'}")
    print(f"   Total frames: {frame_count}")
    print(f"   Recognized frames: {recognized_count}")
    if config.USE_GATED_DETECTION:
        total_gate = gate_hits + gate_misses
        print(f"   Gate hits: {gate_hits}/{total_gate}")
    if last_match:
        print(f"   Last match: {last_match.name}")
    print("=" * 60)


if __name__ == "__main__":
    main()
