"""Debug script to diagnose .env loading issue."""
import os
import sys
from pathlib import Path

print(f"Python: {sys.executable}")
print(f"CWD: {os.getcwd()}")

# Check the path that database.py would compute
db_file = Path(__file__).resolve().parent / "db" / "database.py"
env_via_db = Path(db_file.parent.parent) / ".env"
print(f"\nPath database.py would use: {env_via_db}")
print(f"  Exists: {env_via_db.exists()}")

# Direct .env path from main
env_direct = Path(__file__).resolve().parent / ".env"
print(f"\nPath main.py would use: {env_direct}")
print(f"  Exists: {env_direct.exists()}")

# Read .env file raw bytes to check encoding
if env_direct.exists():
    raw = env_direct.read_bytes()
    print(f"\n.env raw first 100 bytes: {raw[:100]}")
    print(f".env size: {len(raw)} bytes")
    
    # Try to parse manually
    print("\nManual parse of .env:")
    for i, line in enumerate(env_direct.read_text(encoding='utf-8-sig').splitlines()):
        print(f"  Line {i+1}: {repr(line)}")

# Try dotenv
try:
    from dotenv import load_dotenv
    result = load_dotenv(dotenv_path=env_direct, verbose=True)
    print(f"\nload_dotenv result: {result}")
    print(f"DATABASE_URL after load: {repr(os.getenv('DATABASE_URL', 'NOT SET'))[:80]}")
except ImportError as e:
    print(f"\ndotenv ImportError: {e}")
