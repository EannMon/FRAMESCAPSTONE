-- FRAMES Critical DB Operation 02
-- Purpose: Erase ALL data from all FRAMES tables while keeping the schema.
--          This also resets all serial IDs back to 1.
-- WARNING: This is destructive. Make sure you have a backup before running.
--
-- Usage (example psql):
--   \i 02_wipe_all_data.sql

BEGIN;

-- Order does not matter when using CASCADE, but we list all tables explicitly
TRUNCATE TABLE
    attendance_logs,
    session_exceptions,
    security_logs,
    system_metrics,
    audit_logs,
    enrollments,
    classes,
    subjects,
    devices,
    facial_profiles,
    users,
    programs,
    departments
RESTART IDENTITY CASCADE;

COMMIT;

