from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not set")
    exit(1)

engine = create_engine(DATABASE_URL)

def run_migration():
    print("🚀 Starting User Table Migration - Removing Columns...")
    
    # Columns to remove from users table
    columns_to_drop = [
        "birthday",
        "contact_number",
        "home_address",
        "academic_advisor",
        "gpa",
        "emergency_contact_name",
        "emergency_contact_relationship",
        "emergency_contact_phone",
        "emergency_contact_address"
    ]
    
    with engine.connect() as conn:
        for col_name in columns_to_drop:
            try:
                # Check if column exists before dropping
                check_sql = text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='users' AND column_name=:col"
                )
                result = conn.execute(check_sql, {"col": col_name}).fetchone()
                
                if result:
                    print(f"🗑️  Dropping column: {col_name}")
                    alter_sql = text(f"ALTER TABLE users DROP COLUMN {col_name}")
                    conn.execute(alter_sql)
                    conn.commit()
                else:
                    print(f"ℹ️  Column {col_name} does not exist. Skipping.")
            except Exception as e:
                print(f"❌ Error dropping {col_name}: {e}")
                
    print("✅ Migration Complete! Removed columns from users table.")

if __name__ == "__main__":
    run_migration()
