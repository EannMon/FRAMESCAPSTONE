"""
Embedding Cache - Load and match enrolled face embeddings.
Supports loading from JSON file (exported from DB) with fast batch matching.
"""
import json
import numpy as np
import os
import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class EnrolledFace:
    """Represents an enrolled user's face data."""
    user_id: int
    name: str
    email: str
    tupm_id: str
    embedding: np.ndarray
    quality: float
    model_version: str = ""


class EmbeddingCache:
    """
    Manages enrolled face embeddings for fast matching.
    
    Supports:
    - Loading from JSON file (offline/cached)
    - Fast batch cosine similarity matching
    - Auto-refresh from backend API
    """
    
    def __init__(self):
        self.faces: List[EnrolledFace] = []
        self._embeddings_matrix: Optional[np.ndarray] = None
        self._last_loaded: Optional[datetime] = None
        self._cache_path: Optional[str] = None
    
    @property
    def count(self) -> int:
        """Number of enrolled faces in cache."""
        return len(self.faces)
    
    def load_from_json(self, json_path: str) -> bool:
        """
        Load embeddings from exported JSON file.
        
        Args:
            json_path: Path to embeddings_cache.json
            
        Returns:
            True if loaded successfully
        """
        if not os.path.exists(json_path):
            logger.warning(f"⚠️ Cache file not found: {json_path}")
            return False
        
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            self.faces = []
            for item in data.get('embeddings', []):
                emb = np.array(item['embedding'], dtype=np.float32)
                # Ensure normalized
                emb = emb / np.linalg.norm(emb)
                
                self.faces.append(EnrolledFace(
                    user_id=item['user_id'],
                    name=item['name'],
                    email=item['email'],
                    tupm_id=item.get('tupm_id', ''),
                    embedding=emb,
                    quality=item.get('quality', 0.0),
                    model_version=item.get('model_version', '')
                ))
            
            # Precompute matrix for fast batch comparison
            if self.faces:
                self._embeddings_matrix = np.vstack([f.embedding for f in self.faces])
            
            self._last_loaded = datetime.now()
            self._cache_path = json_path
            
            logger.info(f"✅ Loaded {len(self.faces)} embeddings from {json_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load embeddings: {e}")
            return False
    
    def load_from_bytes_dict(self, embeddings_data: List[Dict]) -> bool:
        """
        Load embeddings from database query results (bytes format).
        
        Args:
            embeddings_data: List of dicts with 'embedding' as bytes
            
        Returns:
            True if loaded successfully
        """
        try:
            self.faces = []
            for item in embeddings_data:
                if item.get('embedding'):
                    emb = np.frombuffer(item['embedding'], dtype=np.float32)
                    emb = emb / np.linalg.norm(emb)
                    
                    self.faces.append(EnrolledFace(
                        user_id=item['user_id'],
                        name=item['name'],
                        email=item['email'],
                        tupm_id=item.get('tupm_id', ''),
                        embedding=emb,
                        quality=item.get('quality', 0.0),
                        model_version=item.get('model_version', '')
                    ))
            
            if self.faces:
                self._embeddings_matrix = np.vstack([f.embedding for f in self.faces])
            
            self._last_loaded = datetime.now()
            logger.info(f"✅ Loaded {len(self.faces)} embeddings from database")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load embeddings from bytes: {e}")
            return False
    
    def find_match(
        self, 
        query_embedding: np.ndarray, 
        threshold: float = 0.40
    ) -> Tuple[Optional[EnrolledFace], float]:
        """
        Find best matching face using cosine similarity.
        
        Args:
            query_embedding: 512-d normalized embedding from recognition
            threshold: Minimum similarity to accept match
            
        Returns:
            (matched_face, similarity_score) or (None, best_score) if below threshold
        """
        if self._embeddings_matrix is None or len(self.faces) == 0:
            return None, 0.0
        
        # Ensure query is normalized
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        
        # Batch cosine similarity (fast matrix multiplication)
        similarities = np.dot(self._embeddings_matrix, query_embedding)
        
        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])
        
        if best_score >= threshold:
            return self.faces[best_idx], best_score
        
        return None, best_score
    
    def find_top_matches(
        self, 
        query_embedding: np.ndarray, 
        top_k: int = 3
    ) -> List[Tuple[EnrolledFace, float]]:
        """
        Find top-k matching faces (for debugging/analysis).
        
        Returns:
            List of (face, score) tuples sorted by score descending
        """
        if self._embeddings_matrix is None or len(self.faces) == 0:
            return []
        
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        similarities = np.dot(self._embeddings_matrix, query_embedding)
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append((self.faces[idx], float(similarities[idx])))
        
        return results
    
    def save_to_json(self, json_path: str) -> bool:
        """Save current cache to JSON file."""
        try:
            export_data = {
                "version": "1.0",
                "exported_at": datetime.now().isoformat(),
                "embedding_dim": 512,
                "embeddings": []
            }
            
            for face in self.faces:
                export_data["embeddings"].append({
                    "user_id": face.user_id,
                    "name": face.name,
                    "email": face.email,
                    "tupm_id": face.tupm_id,
                    "embedding": face.embedding.tolist(),
                    "quality": face.quality,
                    "model_version": face.model_version
                })
            
            os.makedirs(os.path.dirname(json_path), exist_ok=True)
            with open(json_path, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            logger.info(f"✅ Saved {len(self.faces)} embeddings to {json_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save cache: {e}")
            return False
    
    def get_user_by_id(self, user_id: int) -> Optional[EnrolledFace]:
        """Get enrolled face by user ID."""
        for face in self.faces:
            if face.user_id == user_id:
                return face
        return None
