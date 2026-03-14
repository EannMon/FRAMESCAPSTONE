-- Optional runner for psql
-- Usage:
--   psql "$DATABASE_URL" -f documentation/finalseed/seed_attendance_logs_all.sql

\i documentation/finalseed/seed_attendance_logs_head.sql
\i documentation/finalseed/seed_attendance_logs_faculty.sql
\i documentation/finalseed/seed_attendance_logs_students.sql
