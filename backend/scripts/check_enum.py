"""Check PostgreSQL enum values for verifiedby."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    r = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'verifiedby')"))
    labels = [row[0] for row in r]
    print(f"verifiedby enum values: {labels}")
