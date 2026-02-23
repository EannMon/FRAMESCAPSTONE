"""Fix verifiedby enum: rename FACE_GESTURE to FACE+GESTURE to match Python model."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check current values
    r = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'verifiedby')"))
    labels = [row[0] for row in r]
    print(f"Current enum values: {labels}")

    if 'FACE+GESTURE' in labels:
        print("Already has FACE+GESTURE — no fix needed.")
    elif 'FACE_GESTURE' in labels:
        # Rename the enum label from FACE_GESTURE to FACE+GESTURE
        conn.execute(text("ALTER TYPE verifiedby RENAME VALUE 'FACE_GESTURE' TO 'FACE+GESTURE'"))
        conn.commit()
        print("Renamed FACE_GESTURE → FACE+GESTURE")
    else:
        # Add it fresh
        conn.execute(text("ALTER TYPE verifiedby ADD VALUE 'FACE+GESTURE'"))
        conn.commit()
        print("Added FACE+GESTURE to enum")

    # Verify
    r = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'verifiedby')"))
    labels = [row[0] for row in r]
    print(f"Updated enum values: {labels}")
