"""
Migration Script: Add Security Logging, Audit Logging, and System Metrics Tables
Run this script once to create the new tables for FRAMES security and monitoring features.

Usage:
    cd backend
    python scripts/migrate_new_tables.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import engine, Base
from models import (
    SecurityLog, SecurityEventType,
    AuditLog, AuditActions,
    SystemMetric, MetricTypes,
    Device  # For room_capacity column
)
from sqlalchemy import text, inspect


def check_table_exists(table_name):
    """Check if a table already exists in the database."""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def check_column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def migrate():
    """Run the migration to create new tables and add columns."""
    print("=" * 60)
    print("FRAMES Database Migration - Security & Monitoring Tables")
    print("=" * 60)
    
    # Track what was created
    created = []
    skipped = []
    
    # 1. Create security_logs table
    if not check_table_exists('security_logs'):
        print("\n📋 Creating 'security_logs' table...")
        SecurityLog.__table__.create(engine)
        created.append('security_logs')
        print("   ✅ Created successfully!")
    else:
        skipped.append('security_logs')
        print("\n⏩ 'security_logs' table already exists, skipping.")
    
    # 2. Create audit_logs table
    if not check_table_exists('audit_logs'):
        print("\n📋 Creating 'audit_logs' table...")
        AuditLog.__table__.create(engine)
        created.append('audit_logs')
        print("   ✅ Created successfully!")
    else:
        skipped.append('audit_logs')
        print("\n⏩ 'audit_logs' table already exists, skipping.")
    
    # 3. Create system_metrics table
    if not check_table_exists('system_metrics'):
        print("\n📋 Creating 'system_metrics' table...")
        SystemMetric.__table__.create(engine)
        created.append('system_metrics')
        print("   ✅ Created successfully!")
    else:
        skipped.append('system_metrics')
        print("\n⏩ 'system_metrics' table already exists, skipping.")
    
    # 4. Add room_capacity column to devices table
    if check_table_exists('devices'):
        if not check_column_exists('devices', 'room_capacity'):
            print("\n🔧 Adding 'room_capacity' column to 'devices' table...")
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE devices ADD COLUMN room_capacity INTEGER DEFAULT 40"
                ))
                conn.commit()
            created.append('devices.room_capacity')
            print("   ✅ Column added successfully!")
        else:
            skipped.append('devices.room_capacity')
            print("\n⏩ 'devices.room_capacity' column already exists, skipping.")
    else:
        print("\n⚠️ 'devices' table not found. Run init_db.py first.")
    
    # 5. Add is_late column to attendance_logs table
    if check_table_exists('attendance_logs'):
        if not check_column_exists('attendance_logs', 'is_late'):
            print("\n🔧 Adding 'is_late' column to 'attendance_logs' table...")
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE attendance_logs ADD COLUMN is_late BOOLEAN DEFAULT FALSE"
                ))
                conn.commit()
            created.append('attendance_logs.is_late')
            print("   ✅ Column added successfully!")
        else:
            skipped.append('attendance_logs.is_late')
            print("\n⏩ 'attendance_logs.is_late' column already exists, skipping.")
    else:
        print("\n⚠️ 'attendance_logs' table not found. Run init_db.py first.")
    
    # Summary
    print("\n" + "=" * 60)
    print("Migration Complete!")
    print("=" * 60)
    
    if created:
        print(f"\n✅ Created ({len(created)}):")
        for item in created:
            print(f"   • {item}")
    
    if skipped:
        print(f"\n⏩ Skipped (already exist) ({len(skipped)}):")
        for item in skipped:
            print(f"   • {item}")
    
    print("\n🎉 Database is ready for security and monitoring features!")
    print("=" * 60)


if __name__ == "__main__":
    migrate()
