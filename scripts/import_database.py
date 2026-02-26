#!/usr/bin/env python3
"""
FRAMES Database Importer
Imports database data from exported SQL file

Usage:
    python import_database.py <sql_file>

Requirements:
    - psycopg2-binary
    - Environment variables for database connection
"""

import os
import sys
from datetime import datetime
import psycopg2
from psycopg2.extras import DictCursor

class DatabaseImporter:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        if not self.db_url:
            print("❌ DATABASE_URL environment variable not set")
            sys.exit(1)
        
        self.conn = None
        
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            print("✅ Connected to database")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            sys.exit(1)
    
    def check_table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the database"""
        query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        );
        """
        
        with self.conn.cursor() as cursor:
            cursor.execute(query, (table_name,))
            return cursor.fetchone()[0]
    
    def clear_table_data(self, table_name: str):
        """Clear all data from a table while preserving structure"""
        try:
            with self.conn.cursor() as cursor:
                # Clear the table
                cursor.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE;")
                print(f"🧹 Cleared data from {table_name}")
                
        except Exception as e:
            self.conn.rollback()
            print(f"⚠️  Warning: Could not clear {table_name}: {e}")

    def clear_tables(self, tables):
        """Clear all data from all tables while preserving structure"""
        if not tables:
            return
        try:
            with self.conn.cursor() as cursor:
                table_list = ", ".join(tables)
                cursor.execute(f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE;")
            self.conn.commit()
            print("🧹 Cleared existing data")
        except Exception as e:
            self.conn.rollback()
            print(f"⚠️  Warning: Could not clear existing data: {e}")
    
    def execute_sql_file(self, sql_file: str):
        """Execute SQL commands from file"""
        if not os.path.exists(sql_file):
            print(f"❌ SQL file not found: {sql_file}")
            sys.exit(1)
        
        try:
            with open(sql_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            print(f"📖 Reading SQL file: {sql_file}")
            
            # Split content into individual statements
            statements = self.split_sql_statements(sql_content)
            
            print(f"📝 Found {len(statements)} SQL statements")
            
            executed_count = 0
            error_count = 0
            
            with self.conn.cursor() as cursor:
                for i, statement in enumerate(statements, 1):
                    if not statement.strip() or statement.strip().startswith('--'):
                        continue
                    
                    try:
                        cursor.execute("SAVEPOINT sp_import")
                        cursor.execute(statement)
                        cursor.execute("RELEASE SAVEPOINT sp_import")
                        executed_count += 1
                        
                        # Progress indicator for large imports
                        if i % 100 == 0:
                            print(f"   📊 Executed {executed_count} statements...")
                            
                    except Exception as e:
                        error_count += 1
                        try:
                            cursor.execute("ROLLBACK TO SAVEPOINT sp_import")
                            cursor.execute("RELEASE SAVEPOINT sp_import")
                        except Exception:
                            self.conn.rollback()
                            cursor = self.conn.cursor()
                        print(f"⚠️  Error in statement {i}: {e}")
                        print(f"   Statement: {statement[:100]}...")
                        # Continue with other statements
                
                self.conn.commit()
            
            print(f"✅ SQL execution completed")
            print(f"   📊 Successfully executed: {executed_count} statements")
            if error_count > 0:
                print(f"   ⚠️  Errors encountered: {error_count} statements")
            
        except Exception as e:
            print(f"❌ Failed to execute SQL file: {e}")
            self.conn.rollback()
            sys.exit(1)
    
    def split_sql_statements(self, sql_content: str) -> list:
        """Split SQL content into individual statements"""
        # Remove comments and split on semicolons
        lines = sql_content.split('\n')
        statements = []
        current_statement = ""
        
        for line in lines:
            # Skip comment lines
            if line.strip().startswith('--'):
                continue
            
            current_statement += line + '\n'
            
            # If line ends with semicolon, it's a complete statement
            if line.strip().endswith(';'):
                statements.append(current_statement.strip())
                current_statement = ""
        
        # Add any remaining statement
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        return statements
    
    def verify_import(self):
        """Verify that data was imported correctly"""
        print("🔍 Verifying import...")
        
        # Get list of tables
        query = """
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        ORDER BY tablename;
        """
        
        with self.conn.cursor(cursor_factory=DictCursor) as cursor:
            cursor.execute(query)
            tables = [row['tablename'] for row in cursor.fetchall()]
        
        total_records = 0
        
        for table_name in tables:
            try:
                with self.conn.cursor() as cursor:
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
                    count = cursor.fetchone()[0]
                    total_records += count
                    
                    if count > 0:
                        print(f"   📋 {table_name}: {count:,} records")
                    
            except Exception as e:
                print(f"   ⚠️  Could not verify {table_name}: {e}")
        
        print(f"✅ Import verification completed")
        print(f"   📊 Total records in database: {total_records:,}")
    
    def import_database(self, sql_file: str, clear_existing: bool = True):
        """Import database from SQL file"""
        print(f"🚀 Starting database import from: {sql_file}")
        
        if clear_existing:
            print("🧹 Clearing existing data...")
            # Get list of tables to clear
            query = """
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'pg_%'
            ORDER BY tablename;
            """
            
            with self.conn.cursor(cursor_factory=DictCursor) as cursor:
                cursor.execute(query)
                tables = [row['tablename'] for row in cursor.fetchall()]

            self.clear_tables(tables)
        
        print("📥 Importing data...")
        self.execute_sql_file(sql_file)
        
        print("🔍 Verifying import...")
        self.verify_import()
        
        print("✅ Database import completed successfully!")
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("🔌 Database connection closed")

def main():
    if len(sys.argv) != 2:
        print("Usage: python import_database.py <sql_file>")
        print("Example: python import_database.py frames_database_export_20260226_173000.sql")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    
    print("🚀 Starting FRAMES Database Import...")
    
    importer = DatabaseImporter()
    
    try:
        importer.connect()
        
        # Ask user if they want to clear existing data
        clear_data = input("🧹 Clear existing data before import? (y/N): ").strip().lower()
        clear_existing = clear_data in ['y', 'yes']
        
        importer.import_database(sql_file, clear_existing)
        
    except KeyboardInterrupt:
        print("\n❌ Import cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Import failed: {e}")
        sys.exit(1)
    finally:
        importer.close()

if __name__ == "__main__":
    main()
