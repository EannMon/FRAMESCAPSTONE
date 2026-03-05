-- ============================================================
-- FRAMES Database Migration Script
-- Date: March 4, 2026
-- Purpose: Align database with updated models per MUSTFIX tasks
-- 
-- Changes:
--   1. Create colleges table (MUSTFIX #10/17)
--   2. Add college_id FK to departments (MUSTFIX #10/17)
--   3. Add semester date fields to departments (MUSTFIX #33)
--   4. Add employee_id to users (MUSTFIX #11/18)
--   5. Make users.email nullable (students may not have TUP email initially, MUSTFIX #59)
--   6. Make users.tupm_id nullable (faculty/head use employee_id instead)
--   7. Remove devices.api_key (MUSTFIX #1 — data minimization)
--   8. Create notifications table (MUSTFIX #29/54/65/67)
--
-- INSTRUCTIONS:
--   Run this script in the SQL editor against the FRAMES PostgreSQL database.
--   Back up the database BEFORE running this migration.
-- ============================================================

-- Step 1: Create the colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Add college_id FK to departments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'departments' AND column_name = 'college_id'
    ) THEN
        ALTER TABLE departments ADD COLUMN college_id INTEGER REFERENCES colleges(id);
        CREATE INDEX IF NOT EXISTS ix_departments_college_id ON departments(college_id);
    END IF;
END $$;

-- Step 3: Add semester date fields to departments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'departments' AND column_name = 'semester_start_date'
    ) THEN
        ALTER TABLE departments ADD COLUMN semester_start_date DATE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'departments' AND column_name = 'semester_end_date'
    ) THEN
        ALTER TABLE departments ADD COLUMN semester_end_date DATE;
    END IF;
END $$;

-- Step 4: Add employee_id to users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- Step 5: Make users.email nullable (students without TUP email)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Step 6: Make users.tupm_id nullable (faculty/head use employee_id instead)
ALTER TABLE users ALTER COLUMN tupm_id DROP NOT NULL;

-- Step 7: Remove devices.api_key if it exists (data minimization)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'devices' AND column_name = 'api_key'
    ) THEN
        ALTER TABLE devices DROP COLUMN api_key;
    END IF;
END $$;

-- Step 8: Create the notificationtype enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationtype') THEN
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
            'GENERAL'
        );
    END IF;
END $$;

-- Step 9: Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notificationtype NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_notification_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS ix_notification_user_unread ON notifications(user_id, is_read, created_at);

-- Step 10: Seed default college (College of Science for TUP Manila)
INSERT INTO colleges (name, code)
VALUES ('College of Science', 'COS')
ON CONFLICT (name) DO NOTHING;

-- Step 11: Link existing departments to the default college (if applicable)
-- You may adjust this based on your existing departments
UPDATE departments
SET college_id = (SELECT id FROM colleges WHERE code = 'COS')
WHERE college_id IS NULL;

-- ============================================================
-- Migration complete. Verify by running:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'departments';
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'devices';
--   SELECT * FROM colleges;
--   SELECT * FROM notifications LIMIT 0;
-- ============================================================
