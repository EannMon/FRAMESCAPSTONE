-- ================================================================
-- FRAMES Database Migration Script
-- ================================================================
-- Purpose: Brings the live PostgreSQL database in sync with the
--          current SQLAlchemy models after all MUSTANALYZEPT2 changes.
--
-- Generated: 2025
-- Applies to: Aiven PostgreSQL (frames_db)
--
-- IMPORTANT:
--   1. Run this inside a transaction (BEGIN / COMMIT).
--   2. Back up the database BEFORE running.
--   3. Run statements in order — there are FK dependencies.
--   4. This script is IDEMPOTENT where possible (IF NOT EXISTS).
-- ================================================================

BEGIN;

-- ============================================================
-- 1. CREATE NEW ENUM TYPES
-- ============================================================

-- NotificationType enum (for notifications table)
DO $$ BEGIN
    CREATE TYPE notificationtype AS ENUM (
        'ATTENDANCE_ENTRY',
        'ATTENDANCE_BREAK',
        'ATTENDANCE_EXIT',
        'LATE_ALERT',
        'ABSENT_CONSECUTIVE',
        'SESSION_EXCEPTION',
        'VERIFICATION_APPROVED',
        'VERIFICATION_REJECTED',
        'SYSTEM_ALERT',
        'OVERCROWDING_ALERT',
        'GENERAL'
    );
EXCEPTION WHEN duplicate_object THEN
    -- If enum already exists, ensure OVERCROWDING_ALERT value is present
    BEGIN
        ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'OVERCROWDING_ALERT';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- TicketStatus enum (for support_tickets table)
DO $$ BEGIN
    CREATE TYPE ticketstatus AS ENUM (
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 2. CREATE NEW TABLES (order matters for FK dependencies)
-- ============================================================

-- 2a. colleges table (must exist before departments.college_id FK)
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- 2b. notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notificationtype NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_notification_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS ix_notification_user_unread ON notifications(user_id, is_read, created_at);

-- 2c. support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ticketstatus DEFAULT 'OPEN',
    evidence_files TEXT,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS ix_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS ix_support_tickets_status ON support_tickets(status);


-- ============================================================
-- 3. ALTER EXISTING TABLES — departments (add new columns)
-- ============================================================

-- Add college_id FK (nullable, references colleges)
ALTER TABLE departments ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id);
CREATE INDEX IF NOT EXISTS ix_departments_college_id ON departments(college_id);

-- Add academic year/semester settings
ALTER TABLE departments ADD COLUMN IF NOT EXISTS active_academic_year VARCHAR(20);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS active_semester VARCHAR(50);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS semester_start_date DATE;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS semester_end_date DATE;


-- ============================================================
-- 4. ALTER EXISTING TABLES — users
-- ============================================================

-- 4a. Add employee_id column (for faculty/head identification)
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE;

-- 4b. Drop unused columns (all had NULL values in production)
-- Using DO block for safety — column may already be dropped
DO $$ BEGIN
    ALTER TABLE users DROP COLUMN IF EXISTS contact_number;
    ALTER TABLE users DROP COLUMN IF EXISTS birthday;
    ALTER TABLE users DROP COLUMN IF EXISTS home_address;
    ALTER TABLE users DROP COLUMN IF EXISTS year_level;
    ALTER TABLE users DROP COLUMN IF EXISTS current_term;
    ALTER TABLE users DROP COLUMN IF EXISTS academic_advisor;
    ALTER TABLE users DROP COLUMN IF EXISTS gpa;
    ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_name;
    ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_relationship;
    ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_phone;
    ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_address;
END $$;


-- ============================================================
-- 5. ALTER EXISTING TABLES — devices (update default only)
-- ============================================================

-- Change room_capacity default from 40 to 50 for new devices
ALTER TABLE devices ALTER COLUMN room_capacity SET DEFAULT 50;


-- ============================================================
-- 6. ALTER EXISTING TABLES — classes (update default only)
-- ============================================================

-- Change late_threshold_minutes default from 15 to 0 for new classes
ALTER TABLE classes ALTER COLUMN late_threshold_minutes SET DEFAULT 0;


-- ============================================================
-- 7. ADD INDEXES to audit_logs (table already exists but may lack indexes)
-- ============================================================

CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_timestamp ON audit_logs(timestamp);


-- ============================================================
-- 8. VERIFY existing indexes on high-traffic tables
--    (These should already exist from initial creation, but ensure)
-- ============================================================

-- attendance_logs indexes
CREATE INDEX IF NOT EXISTS ix_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS ix_attendance_logs_class_id ON attendance_logs(class_id);
CREATE INDEX IF NOT EXISTS ix_attendance_logs_device_id ON attendance_logs(device_id);
CREATE INDEX IF NOT EXISTS ix_attendance_logs_timestamp ON attendance_logs(timestamp);
CREATE INDEX IF NOT EXISTS ix_attendance_logs_action ON attendance_logs(action);
CREATE INDEX IF NOT EXISTS ix_attendance_logs_is_late ON attendance_logs(is_late);
CREATE INDEX IF NOT EXISTS ix_attendance_user_class_timestamp ON attendance_logs(user_id, class_id, timestamp);

-- classes indexes
CREATE INDEX IF NOT EXISTS ix_classes_subject_id ON classes(subject_id);
CREATE INDEX IF NOT EXISTS ix_classes_faculty_id ON classes(faculty_id);
CREATE INDEX IF NOT EXISTS ix_classes_room ON classes(room);
CREATE INDEX IF NOT EXISTS ix_classes_day_of_week ON classes(day_of_week);

-- users indexes
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);
CREATE INDEX IF NOT EXISTS ix_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS ix_users_department_id ON users(department_id);

-- enrollments indexes
CREATE INDEX IF NOT EXISTS ix_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS ix_enrollments_class_id ON enrollments(class_id);

-- devices indexes
CREATE INDEX IF NOT EXISTS ix_devices_room ON devices(room);


-- ============================================================
-- DONE
-- ============================================================

COMMIT;

-- ================================================================
-- VERIFICATION QUERIES (run after migration to confirm)
-- ================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'departments' ORDER BY ordinal_position;
-- SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'notifications';
