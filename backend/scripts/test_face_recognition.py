"""
Face Verification Test Script (No GUI)
Tests if enrolled face embeddings can recognize you via webcam.
Works without display - prints results to console and saves screenshots.

Usage:
    cd backend
    python scripts/test_face_recognition.py
"""
import sys
import os
import time
import numpy as np

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2
from sqlalchemy import text
from db.database import SessionLocal
from models.facial_profile import FacialProfile
from models.user import User


def load_all_embeddings(db):
    """Load all enrolled face embeddings from database."""
    profiles = db.query(FacialProfile).all()
    
    embeddings_data = []
    for profile in profiles:
        user = db.query(User).filter(User.id == profile.user_id).first()
        if user and profile.embedding:
            embedding = np.frombuffer(profile.embedding, dtype=np.float32)
            embeddings_data.append({
                'user_id': user.id,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'embedding': embedding,
                'quality': profile.enrollment_quality or 0
            })
    
    return embeddings_data


def cosine_similarity(emb1, emb2):
    """Calculate cosine similarity between two embeddings."""
    return float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2)))


def find_best_match(query_embedding, embeddings_data, threshold=0.5):
    """Find the best matching user for a query embedding."""
    best_match = None
    best_score = -1
    
    for data in embeddings_data:
        score = cosine_similarity(query_embedding, data['embedding'])
        if score > best_score:
            best_score = score
            best_match = data
    
    if best_score >= threshold:
        return best_match, best_score
    return None, best_score


def main():
    print("\n" + "="*60)
    print("   FACE RECOGNITION TEST (Console Mode)")
    print("="*60)
    
    # Connect to database
    print("\n📡 Connecting to database...")
    db = SessionLocal()
    
    try:
        # Load embeddings
        print("📥 Loading enrolled face embeddings...")
        embeddings_data = load_all_embeddings(db)
        
        if not embeddings_data:
            print("\n❌ No face embeddings found in database!")
            print("   Please enroll at least one user first.")
            return
        
        print(f"\n✅ Loaded {len(embeddings_data)} enrolled faces:")
        for data in embeddings_data:
            print(f"   • {data['name']} ({data['email']}) - Quality: {data['quality']:.1%}")
        
        # Initialize InsightFace
        print("\n🔄 Loading InsightFace model...")
        try:
            from insightface.app import FaceAnalysis
            
            face_analyzer = FaceAnalysis(
                name='buffalo_l',
                providers=['CPUExecutionProvider']
            )
            face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
            print("✅ InsightFace loaded!")
        except ImportError:
            print("❌ InsightFace not installed. Run: pip install insightface onnxruntime")
            return
        
        # Open webcam
        print("\n📷 Opening webcam...")
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Failed to open webcam!")
            return
        
        print("\n" + "-"*60)
        print("  LIVE RECOGNITION - Testing 10 frames, saving screenshots")
        print("-"*60)
        
        # Create output folder
        output_folder = os.path.join(os.path.dirname(__file__), 'recognition_results')
        os.makedirs(output_folder, exist_ok=True)
        
        recognized_count = 0
        total_frames = 10
        
        for frame_idx in range(total_frames):
            time.sleep(0.5)  # Wait between frames
            
            ret, frame = cap.read()
            if not ret:
                print(f"   ⚠️ Frame {frame_idx+1}: Failed to capture")
                continue
            
            # Detect faces
            faces = face_analyzer.get(frame)
            
            if not faces:
                print(f"   ⚠️ Frame {frame_idx+1}: No face detected")
                continue
            
            # Use largest face
            face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
            query_embedding = face.normed_embedding
            
            # Find match
            match, score = find_best_match(query_embedding, embeddings_data)
            
            # Draw on frame
            x1, y1, x2, y2 = face.bbox.astype(int)
            
            if match:
                recognized_count += 1
                color = (0, 255, 0)  # Green
                label = f"{match['name']} ({score:.0%})"
                print(f"   ✅ Frame {frame_idx+1}: {match['name']} - {score:.1%}")
            else:
                color = (0, 165, 255)  # Orange
                label = f"Unknown ({score:.0%})"
                print(f"   ❓ Frame {frame_idx+1}: Unknown - {score:.1%}")
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Save screenshot
            filename = os.path.join(output_folder, f'frame_{frame_idx+1}.jpg')
            cv2.imwrite(filename, frame)
        
        cap.release()
        
        # Summary
        print("\n" + "="*60)
        print(f"   RESULTS: {recognized_count}/{total_frames} frames recognized")
        print(f"   Screenshots saved to: {output_folder}")
        print("="*60)
        
        if recognized_count > 5:
            print("\n✅ PASSED - Face recognition is working!")
        elif recognized_count > 0:
            print("\n⚠️ PARTIAL - Some frames recognized. Check lighting/angle.")
        else:
            print("\n❌ FAILED - No frames recognized. May need to re-enroll.")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
