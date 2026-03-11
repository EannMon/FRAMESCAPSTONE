"""
Export Embeddings Script
Exports enrolled face embeddings from PostgreSQL to JSON for kiosk devices.

Supports two modes:
  - Direct DB mode (default, for backend server): reads from PostgreSQL via sqlalchemy
  - API mode (for RPi/kiosk): downloads from /api/kiosk/embeddings endpoint
"""
import sys
import os
import json
import numpy as np
from datetime import datetime


def export_embeddings_via_api(output_path: str, backend_url: str, verbose: bool = True) -> bool:
    """
    Export embeddings by downloading from the backend API.
    Used on RPi where direct DB access (sqlalchemy) is not available.
    """
    import requests

    url = f"{backend_url.rstrip('/')}/api/kiosk/embeddings"
    try:
        if verbose:
            print(f"📡 Fetching embeddings from {url} ...")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()

        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        count = data.get("count", len(data.get("embeddings", [])))
        if verbose:
            print(f"✅ Downloaded {count} embeddings → {output_path}")
        return True
    except Exception as e:
        if verbose:
            print(f"❌ API export failed: {e}")
        return False


def export_embeddings(output_path: str, verbose: bool = True, backend_url: str = None) -> bool:
    """
    Export all enrolled face embeddings to JSON file.

    When backend_url is provided (e.g. on RPi), downloads from the backend API
    instead of connecting to the database directly.

    Args:
        output_path: Path to save JSON file
        verbose: Print progress messages
        backend_url: If set, use API mode instead of direct DB

    Returns:
        True if export successful
    """
    if backend_url:
        return export_embeddings_via_api(output_path, backend_url, verbose)

    # --- Direct DB mode (requires sqlalchemy, runs on the backend server) ---

    # Add parent directory for imports
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    from db.database import SessionLocal
    from models.facial_profile import FacialProfile
    from models.user import User

    if verbose:
        print("\n" + "=" * 60)
        print("   FRAMES Embedding Export")
        print("=" * 60)

    db = SessionLocal()

    try:
        if verbose:
            print("\n📡 Connecting to database...")
        
        # Query all facial profiles with user info
        profiles = db.query(FacialProfile).all()
        
        if verbose:
            print(f"📥 Found {len(profiles)} facial profiles")
        
        export_data = {
            "version": "1.0",
            "exported_at": datetime.now().isoformat(),
            "model": "insightface_buffalo_sc_v1",
            "embedding_dim": 512,
            "embeddings": []
        }
        
        exported_count = 0
        skipped_count = 0
        
        for profile in profiles:
            user = db.query(User).filter(User.id == profile.user_id).first()
            
            if not user:
                if verbose:
                    print(f"   ⚠️ Skipping profile {profile.id}: User not found")
                skipped_count += 1
                continue
            
            if not profile.embedding:
                if verbose:
                    print(f"   ⚠️ Skipping {user.first_name} {user.last_name}: No embedding")
                skipped_count += 1
                continue
            
            # Convert bytes to list for JSON serialization
            try:
                emb_array = np.frombuffer(profile.embedding, dtype=np.float32)
                
                if len(emb_array) != 512:
                    if verbose:
                        print(f"   ⚠️ Skipping {user.first_name}: Invalid embedding dim ({len(emb_array)})")
                    skipped_count += 1
                    continue
                
                export_data["embeddings"].append({
                    "user_id": user.id,
                    "name": f"{user.first_name} {user.last_name}",
                    "email": user.email,
                    "tupm_id": user.tupm_id or "",
                    "role": user.role.value if user.role else "",
                    "section": user.section or "",
                    "embedding": emb_array.tolist(),
                    "quality": profile.enrollment_quality or 0.0,
                    "model_version": profile.model_version or "",
                    "enrolled_at": profile.created_at.isoformat() if profile.created_at else None
                })
                
                exported_count += 1
                
                if verbose:
                    print(f"   ✓ {user.first_name} {user.last_name} ({user.email})")
                
            except Exception as e:
                if verbose:
                    print(f"   ❌ Error processing {user.first_name}: {e}")
                skipped_count += 1
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        
        # Write JSON file
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        if verbose:
            print("\n" + "-" * 60)
            print(f"✅ Export complete!")
            print(f"   Exported: {exported_count} embeddings")
            print(f"   Skipped:  {skipped_count}")
            print(f"   Output:   {output_path}")
            print(f"   Size:     {os.path.getsize(output_path) / 1024:.1f} KB")
            print("-" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Export face embeddings from database to JSON for kiosk devices"
    )
    parser.add_argument(
        "-o", "--output",
        default="rpi/data/embeddings_cache.json",
        help="Output JSON file path (default: rpi/data/embeddings_cache.json)"
    )
    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Suppress progress output"
    )
    parser.add_argument(
        "--backend-url",
        default=None,
        help="If set, download from backend API instead of direct DB (for RPi use)"
    )

    args = parser.parse_args()

    success = export_embeddings(args.output, verbose=not args.quiet, backend_url=args.backend_url)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
