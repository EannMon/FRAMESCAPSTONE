"""
Migration to update PostgreSQL ENUM type for ticket status.
Changes the ticketstatus enum from (OPEN, IN_PROGRESS, RESOLVED, CLOSED) 
to (SUBMITTED, REPLIED) and migrates existing data.
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.database import SessionLocal, engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_enum():
    """Migrate the ticketstatus enum and update data."""
    db = SessionLocal()
    
    try:
        logger.info("Starting enum migration...")
        
        # Step 1: Create new enum type (if it doesn't exist)
        logger.info("Step 1: Checking enum type...")
        result = db.execute(text("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'support_tickets'
            )
        """)).scalar()
        
        if not result:
            logger.warning("support_tickets table doesn't exist, cannot migrate...")
            return
        
        # Step 2: Convert column to VARCHAR to allow value changes
        logger.info("Step 2: Converting status column to VARCHAR temporarily...")
        try:
            db.execute(text("""
                ALTER TABLE support_tickets 
                ALTER COLUMN status TYPE VARCHAR;
            """))
            db.commit()
            logger.info("✓ Converted status column to VARCHAR")
        except Exception as e:
            logger.info(f"Column already VARCHAR or error: {e}")
            db.rollback()
        
        # Step 3: Map old status values to new ones
        logger.info("Step 3: Updating ticket status values...")
        status_mapping = [
            ('OPEN', 'SUBMITTED'),
            ('IN_PROGRESS', 'SUBMITTED'),
            ('RESOLVED', 'REPLIED'),
            ('CLOSED', 'REPLIED')
        ]
        
        for old_status, new_status in status_mapping:
            db.execute(text(f"""
                UPDATE support_tickets 
                SET status = '{new_status}'
                WHERE status = '{old_status}'
            """))
            db.commit()
            logger.info(f"  → Migrated {old_status} → {new_status}")
        
        logger.info("✓ Updated ticket status values")
        
        # Step 4: Drop old enum type
        logger.info("Step 4: Dropping old ticketstatus enum...")
        try:
            db.execute(text("""
                DROP TYPE IF EXISTS ticketstatus CASCADE;
            """))
            db.commit()
            logger.info("✓ Dropped old ticketstatus enum")
        except Exception as e:
            logger.warning(f"Could not drop enum: {e}")
            db.rollback()
        
        # Step 5: Create new enum type
        logger.info("Step 5: Creating new ENUM type...")
        db.execute(text("""
            CREATE TYPE ticketstatus AS ENUM ('SUBMITTED', 'REPLIED');
        """))
        db.commit()
        logger.info("✓ Created new ticketstatus enum with values (SUBMITTED, REPLIED)")
        
        # Step 6: Convert column back to enum
        logger.info("Step 6: Converting column back to ENUM...")
        db.execute(text("""
            ALTER TABLE support_tickets 
            ALTER COLUMN status TYPE ticketstatus USING status::ticketstatus;
        """))
        db.commit()
        logger.info("✓ Converted status column back to ENUM")
        
        # Step 7: Verify
        logger.info("Step 7: Verifying migration...")
        result = db.execute(text("""
            SELECT COUNT(*) FROM support_tickets;
        """)).scalar()
        logger.info(f"✓ Total tickets in database: {result}")
        
        submitted_count = db.execute(text("""
            SELECT COUNT(*) FROM support_tickets WHERE status = 'SUBMITTED';
        """)).scalar()
        
        replied_count = db.execute(text("""
            SELECT COUNT(*) FROM support_tickets WHERE status = 'REPLIED';
        """)).scalar()
        
        logger.info(f"  - SUBMITTED: {submitted_count}")
        logger.info(f"  - REPLIED: {replied_count}")
        logger.info("\n✓ Migration complete!")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("TICKET STATUS ENUM MIGRATION")
    logger.info("=" * 60)
    migrate_enum()
