import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Calculate path to .env file (one level up from scripts/)
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
env_path = os.path.join(backend_dir, ".env")

# Load environment variables
print(f"Loading .env from: {env_path}")
loaded = load_dotenv(dotenv_path=env_path)

if not loaded:
    print("⚠️  Warning: .env file not found or empty.")

# Get DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Error: DATABASE_URL not found in .env file.")
    print("Please check your .env file in the backend directory.")
    sys.exit(1)

print("Attempting connection...")

try:
    # Create engine (PostgreSQL + psycopg2)
    # Aiven usually requires SSL, which is handled by the sslmode in the URL or default behaviour
    engine = create_engine(DATABASE_URL)

    # Test connection
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("\nConnection Successful")
        
except Exception as e:
    print(f"\n❌ Connection Failed: {e}")