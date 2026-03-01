import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Checking tables in public schema and their owners...")
        result = conn.execute(text("SELECT tablename, tableowner FROM pg_tables WHERE schemaname='public'"))
        for row in result:
            print(f"Table: {row[0]}, Owner: {row[1]}")
            
        print("\nChecking current user...")
        res_user = conn.execute(text("SELECT current_user"))
        print(f"Current User: {res_user.fetchone()[0]}")
        
except Exception as e:
    print(f"Error: {e}")
