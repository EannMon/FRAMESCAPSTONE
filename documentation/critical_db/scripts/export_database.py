#!/usr/bin/env python3
"""
FRAMES Database Exporter
Exports all database data to SQL file for backup purposes

Usage:
    python export_database.py

Requirements:
    - psycopg2-binary
    - Environment variables for database connection
"""

import os
import sys
from datetime import datetime
from typing import Optional, List, Dict, Any
import psycopg2
from psycopg2.extras import DictCursor
import json

# Auto-load backend/.env so DATABASE_URL is available when running this script directly
# Walks up from this file's location until it finds a folder containing backend/.env
def _load_backend_env():
    current = os.path.dirname(os.path.abspath(__file__))
    for _ in range(6):  # max 6 levels up
        candidate = os.path.join(current, 'backend', '.env')
        if os.path.exists(candidate):
            from dotenv import load_dotenv
            load_dotenv(candidate)
            print(f"✅ Loaded env from: {candidate}")
            return
        current = os.path.dirname(current)
    print("⚠️  Could not find backend/.env — DATABASE_URL must be set manually")

_load_backend_env()

class DatabaseExporter:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        if not self.db_url:
            print("❌ DATABASE_URL environment variable not set")
            sys.exit(1)
        
        self.conn = None
        self.output_file = None
        
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            print("✅ Connected to database")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            sys.exit(1)
    
    # Export order respects FK dependencies so INSERT statements are always valid.
    # Parent tables first, child tables last.
    TABLE_EXPORT_ORDER = [
        # ── Tier 0: no foreign keys ──────────────────────────────
        'departments',
        'programs',        # → departments
        'subjects',
        # ── Tier 1: depend only on Tier 0 ───────────────────────
        'users',           # → departments, programs
        'devices',
        # ── Tier 2: depend on Tier 1 ────────────────────────────
        'facial_profiles', # → users
        'classes',         # → subjects, users
        'audit_logs',      # → users
        'support_tickets', # → users
        'user_settings',   # → users
        'system_metrics',
        'security_logs',   # → users, devices
        # ── Tier 3: depend on Tier 2 ────────────────────────────
        'enrollments',     # → users, classes
        'session_exceptions', # → users, classes
        # ── Tier 4: deepest dependencies ────────────────────────
        'attendance_logs', # → users, classes, devices
    ]

    def get_all_tables(self) -> List[str]:
        """
        Return tables in FK-dependency order (parents before children).
        Any tables in the DB not in TABLE_EXPORT_ORDER are appended at the end.
        """
        query = """
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        ORDER BY tablename;
        """
        with self.conn.cursor(cursor_factory=DictCursor) as cursor:
            cursor.execute(query)
            db_tables = {row['tablename'] for row in cursor.fetchall()}

        # Start with known-ordered tables that actually exist in the DB
        ordered = [t for t in self.TABLE_EXPORT_ORDER if t in db_tables]

        # Append any tables present in DB but not in our ordered list
        known = set(self.TABLE_EXPORT_ORDER)
        extras = sorted(db_tables - known)
        if extras:
            print(f"⚠️  Tables not in export order list (appended at end): {extras}")
        ordered.extend(extras)

        return ordered
    
    def get_table_columns(self, table_name: str) -> List[Dict[str, Any]]:
        """Get column information for a table"""
        query = """
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = %s 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
        """
        
        with self.conn.cursor(cursor_factory=DictCursor) as cursor:
            cursor.execute(query, (table_name,))
            return [dict(row) for row in cursor.fetchall()]
    
    def get_table_data(self, table_name: str) -> List[Dict[str, Any]]:
        """Get all data from a table"""
        query = f"SELECT * FROM {table_name} ORDER BY id;"
        
        try:
            with self.conn.cursor(cursor_factory=DictCursor) as cursor:
                cursor.execute(query)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"⚠️  Warning: Could not fetch data from {table_name}: {e}")
            return []
    
    def escape_sql_value(self, value: Any, column_info: Dict[str, Any]) -> str:
        """Escape a value for SQL insertion"""
        if value is None:
            return "NULL"
        
        data_type = column_info['data_type']
        
        # Handle different data types
        if data_type in ['integer', 'bigint', 'smallint', 'serial', 'bigserial']:
            return str(int(value))
        elif data_type in ['numeric', 'decimal', 'real', 'double precision']:
            return str(float(value))
        elif data_type == 'boolean':
            return 'TRUE' if value else 'FALSE'
        elif data_type == 'bytea':
            # Handle binary data (like facial embeddings)
            if isinstance(value, bytes):
                return f"'{value.hex()}'::bytea"
            else:
                return "NULL::bytea"
        elif data_type == 'json':
            # Handle JSON data
            if isinstance(value, (dict, list)):
                return f"'{json.dumps(value).replace(chr(39), chr(39)+chr(39))}'::json"
            else:
                return f"'{str(value).replace(chr(39), chr(39)+chr(39))}'::json"
        elif data_type == 'timestamp without time zone' or data_type == 'timestamp':
            # Handle timestamps
            if isinstance(value, datetime):
                return f"'{value.strftime('%Y-%m-%d %H:%M:%S')}'"
            else:
                return f"'{value}'"
        elif data_type == 'date':
            # Handle dates
            if isinstance(value, datetime):
                return f"'{value.strftime('%Y-%m-%d')}'"
            else:
                return f"'{value}'"
        elif data_type == 'time without time zone' or data_type == 'time':
            # Handle time
            return f"'{value}'"
        else:
            # Handle text types (varchar, text, etc.)
            return f"'{str(value).replace(chr(39), chr(39)+chr(39))}'"
    
    def generate_insert_sql(self, table_name: str, data: List[Dict[str, Any]], 
                           columns: List[Dict[str, Any]]) -> str:
        """Generate INSERT statements for table data"""
        if not data:
            return f"-- No data found in {table_name}\n\n"
        
        sql_lines = [f"-- Data for {table_name}"]
        sql_lines.append(f"-- {len(data)} records")
        sql_lines.append("")
        
        # Get column names
        column_names = [col['column_name'] for col in columns]
        
        for row in data:
            values = []
            for i, col_name in enumerate(column_names):
                if col_name in row:
                    value = self.escape_sql_value(row[col_name], columns[i])
                else:
                    value = "NULL"
                values.append(value)
            
            values_str = ", ".join(values)
            columns_str = ", ".join(column_names)
            
            sql_lines.append(f"INSERT INTO {table_name} ({columns_str})")
            sql_lines.append(f"VALUES ({values_str});")
            sql_lines.append("")
        
        sql_lines.append("")
        return "\n".join(sql_lines)
    
    def export_database(self, output_filename: Optional[str] = None):
        """Export all database data to SQL file"""
        if not output_filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"frames_database_export_{timestamp}.sql"
        
        try:
            with open(output_filename, 'w', encoding='utf-8') as f:
                self.output_file = f
                
                # Write header
                f.write("-- FRAMES Database Export\n")
                f.write(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("-- Purpose: Complete database backup for restoration\n")
                f.write("-- Usage: psql -d your_database -f this_file.sql\n")
                f.write("\n")
                f.write("BEGIN;\n")
                f.write("-- Disable foreign key checks temporarily\n")
                f.write("SET session_replication_role = replica;\n")
                f.write("\n")
                
                # Get all tables
                tables = self.get_all_tables()
                print(f"📋 Found {len(tables)} tables: {', '.join(tables)}")
                
                total_records = 0
                
                # Export each table
                for table_name in tables:
                    print(f"📤 Exporting {table_name}...")
                    
                    # Get table structure
                    columns = self.get_table_columns(table_name)
                    
                    # Get table data
                    data = self.get_table_data(table_name)
                    
                    # Generate SQL
                    sql = self.generate_insert_sql(table_name, data, columns)
                    f.write(sql)
                    
                    total_records += len(data)
                    print(f"   ✅ {len(data)} records exported")
                
                # Write footer
                f.write("-- Re-enable foreign key checks\n")
                f.write("SET session_replication_role = DEFAULT;\n")
                f.write("\n")
                f.write("COMMIT;\n")
                f.write("\n")
                f.write("-- Export completed successfully\n")
                f.write(f"-- Total records exported: {total_records}\n")
                
            print(f"✅ Database exported successfully to: {output_filename}")
            print(f"📊 Total records exported: {total_records}")
            
        except Exception as e:
            print(f"❌ Failed to export database: {e}")
            if os.path.exists(output_filename):
                os.remove(output_filename)
            sys.exit(1)
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("🔌 Database connection closed")

def main():
    print("🚀 Starting FRAMES Database Export...")
    
    exporter = DatabaseExporter()
    
    try:
        exporter.connect()
        exporter.export_database()
    finally:
        exporter.close()

if __name__ == "__main__":
    main()
