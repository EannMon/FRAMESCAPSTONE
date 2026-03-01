import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Calculate path to .env file
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Error: DATABASE_URL not found in .env file.")
    sys.exit(1)

print("Attempting connection to test WRITE access...")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Create a temporary table
        connection.execute(text("CREATE TABLE IF NOT EXISTS _test_write_access (id SERIAL PRIMARY KEY, val VARCHAR(50))"))
        # Insert a row
        connection.execute(text("INSERT INTO _test_write_access (val) VALUES ('test')"))
        connection.commit()
        # Delete the row and table
        connection.execute(text("DROP TABLE _test_write_access"))
        connection.commit()
        
        print("\n✅ Write Access Successful. The database is NOT read-only.")
except Exception as e:
    print(f"\n❌ Write Access Failed: {e}")
