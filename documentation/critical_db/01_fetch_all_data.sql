-- FRAMES Critical DB Operation 01
-- Purpose: Read/verify current data in all main tables.
-- Usage (example psql):
--   \i 01_fetch_all_data.sql

BEGIN;

-- 🏫 Academic Structure
SELECT * FROM departments ORDER BY id;
SELECT * FROM programs ORDER BY id;
SELECT * FROM subjects ORDER BY id;

-- 👥 Users & Identity
SELECT * FROM users ORDER BY id;
SELECT * FROM facial_profiles ORDER BY id;

-- 📅 Class Scheduling
SELECT * FROM classes ORDER BY id;
SELECT * FROM enrollments ORDER BY id;
SELECT * FROM session_exceptions ORDER BY id;

-- ✅ Attendance Tracking
SELECT * FROM devices ORDER BY id;
SELECT * FROM attendance_logs ORDER BY id;

-- 🔒 Security & Monitoring
SELECT * FROM security_logs ORDER BY id;
SELECT * FROM audit_logs ORDER BY id;
SELECT * FROM system_metrics ORDER BY id;

COMMIT;

