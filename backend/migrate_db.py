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
    print("🚀 Starting User Table Migration...")
    
    # List of new columns to add
    # (Column Name, Type)
    new_columns = [
        ("contact_number", "VARCHAR(20)"),
        ("birthday", "TIMESTAMP"),
        ("home_address", "VARCHAR(500)"),
        ("current_term", "VARCHAR(50)"),
        ("academic_advisor", "VARCHAR(100)"),
        ("gpa", "VARCHAR(10)"),
        ("emergency_contact_name", "VARCHAR(100)"),
        ("emergency_contact_relationship", "VARCHAR(50)"),
        ("emergency_contact_phone", "VARCHAR(20)"),
        ("emergency_contact_address", "VARCHAR(255)")
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in new_columns:
            try:
                # Check if column exists
                check_sql = text(f"SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='{col_name}'")
                result = conn.execute(check_sql).fetchone()
                
                if not result:
                    print(f"➕ Adding column: {col_name} ({col_type})")
                    alter_sql = text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                    conn.execute(alter_sql)
                    conn.commit()
                else:
                    print(f"ℹ️ Column {col_name} already exists. Skipping.")
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
                
    print("✅ Migration Complete!")

if __name__ == "__main__":
    run_migration()
