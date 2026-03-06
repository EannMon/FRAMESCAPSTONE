"""
InsightFace buffalo_l model setup and verification.
Run this ONCE before starting the kiosk:
    python setup_insightface.py

This script:
1. Shows what model files are present
2. Deletes any incomplete model folder  
3. Downloads buffalo_l fresh
4. Verifies the model loads correctly
"""
import os
import sys
import shutil
import glob
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
MODEL_NAME = "buffalo_l"
INSIGHTFACE_ROOT = Path.home() / ".insightface"
MODEL_DIR = INSIGHTFACE_ROOT / "models" / MODEL_NAME

print("\n" + "=" * 60)
print("  InsightFace buffalo_l Setup & Verification")
print("=" * 60)

# ── Show what's currently installed ──────────────────────────────────────────
print(f"\n📁 Model dir: {MODEL_DIR}")
if MODEL_DIR.exists():
    onnx_files = list(MODEL_DIR.glob("*.onnx"))
    print(f"   Found {len(onnx_files)} .onnx files:")
    for f in onnx_files:
        size_mb = f.stat().st_size / (1024 * 1024)
        print(f"     • {f.name}  ({size_mb:.1f} MB)")
    if len(onnx_files) < 2:
        print("\n   ⚠️  INCOMPLETE — buffalo_l needs at least 3 .onnx files")
        print("   Deleting incomplete folder for fresh download...")
        shutil.rmtree(str(MODEL_DIR))
        print("   ✅ Deleted.")
    else:
        print(f"\n   Files look complete ({len(onnx_files)} found).")
else:
    print("   (No model folder found — will download)")

# ── insightface version ───────────────────────────────────────────────────────
print("\n🔍 Checking InsightFace version...")
try:
    import importlib.metadata
    ver = importlib.metadata.version("insightface")
    print(f"   InsightFace version: {ver}")
except Exception:
    print("   (could not determine version)")

# ── Force download ────────────────────────────────────────────────────────────
print(f"\n⬇️  Downloading/verifying buffalo_l model...")
print("   This may take 1-3 minutes on first run...\n")

try:
    from insightface.app import FaceAnalysis
    # Use the same call as kiosk_server does, with explicit root
    app = FaceAnalysis(name=MODEL_NAME, root=str(INSIGHTFACE_ROOT))
    print(f"\n   Found {len(app.models)} models:")
    for task, model in app.models.items():
        print(f"     • {task}: {getattr(model, 'model_file', '?')}")

    # Verify 'detection' is present
    if 'detection' not in app.models:
        print("\n   ❌ Still no 'detection' model after download!")
        print("   Model tasks found:", list(app.models.keys()))
        print("\n   Trying with allowed_modules=['detection', 'recognition']...")
        app2 = FaceAnalysis(
            name=MODEL_NAME,
            root=str(INSIGHTFACE_ROOT),
            allowed_modules=['detection', 'recognition']
        )
        print(f"   Models after filter: {list(app2.models.keys())}")
        if 'detection' not in app2.models:
            print("\n   ❌ CRITICAL: buffalo_l has no detection model at all.")
            print("   Check the ONNX files — det_10g.onnx may be missing.")
            sys.exit(1)
    
    # Prepare for CPU inference
    print("\n🔧 Preparing model for CPU inference (det_size=640x640)...")
    try:
        app.prepare(ctx_id=-1, det_size=(640, 640))
    except TypeError:
        app.prepare(ctx_id=-1)
    print("   ✅ Model prepared successfully!")

    # Quick test with a blank frame
    import numpy as np
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    faces = app.get(blank)
    print(f"   ✅ Inference test passed (detected {len(faces)} faces in blank frame — expected 0)")

    print("\n" + "=" * 60)
    print("  ✅ buffalo_l model is ready! You can now run:")
    print("     $env:DEVICE_ID='1'")
    print("     $env:BACKEND_URL='http://localhost:5000'")
    print("     .\\venv\\Scripts\\python.exe run_kiosk.py")
    print("=" * 60 + "\n")

except AssertionError as e:
    print(f"\n   ❌ Model assertion failed: {e}")
    # List what's in the directory now
    print("\n   Current model directory contents:")
    if MODEL_DIR.exists():
        for f in MODEL_DIR.iterdir():
            size_mb = f.stat().st_size / (1024*1024)
            print(f"     • {f.name}  ({size_mb:.1f} MB)")
    else:
        print("   (empty)")
    print("\n   ❌ Please manually download buffalo_l:")
    print("   1. Go to: https://github.com/deepinsight/insightface/releases")
    print(f"   2. Download buffalo_l.zip")
    print(f"   3. Extract to: {MODEL_DIR}")
    sys.exit(1)

except Exception as e:
    import traceback
    print(f"\n   ❌ Unexpected error: {e}")
    traceback.print_exc()
    sys.exit(1)
