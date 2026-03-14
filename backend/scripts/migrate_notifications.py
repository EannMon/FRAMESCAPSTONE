import sys
import os

# Add backend to path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.append(backend_path)

from db.database import engine
from sqlalchemy import text

def migrate():
    print("Starting database migration (PostgreSQL)...")
    with engine.connect() as conn:
        try:
            print("Adding email_notifications_enabled column if not exists...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE"))
            
            print("Adding in_app_notifications_enabled column if not exists...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS in_app_notifications_enabled BOOLEAN DEFAULT TRUE"))
            
            conn.commit()
            print("Migration completed successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
