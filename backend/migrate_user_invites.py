from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not set")
    exit(1)

engine = create_engine(DATABASE_URL)

def run_migration():
    print("🚀 Starting User Invites Table Migration...")
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS user_invites (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(500) UNIQUE NOT NULL,
        department_id INTEGER NOT NULL,
        role VARCHAR(50) DEFAULT 'FACULTY',
        expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_department
            FOREIGN KEY(department_id) 
            REFERENCES departments(id)
            ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS ix_user_invites_email ON user_invites (email);
    """
    
    with engine.connect() as conn:
        try:
            print("⏳ Initializing user_invites table...")
            # We explicitly execute and commit the raw SQL for the new table
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✅ Migration Complete: user_invites table successfully created/verified!")
        except Exception as e:
            print(f"❌ Error creating user_invites table: {e}")

if __name__ == "__main__":
    run_migration()
