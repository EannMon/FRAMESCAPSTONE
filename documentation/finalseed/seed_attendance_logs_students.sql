BEGIN;
SET search_path TO public;

-- Student seed based on current test data.
-- Semester dates come from the department managed by head user_id=1.
-- Student population is resolved by enrollments within that department.
-- Absences are implicit (some class days intentionally skipped).

WITH bounds AS (
  SELECT
    COALESCE(
      (SELECT d.semester_start_date FROM users u JOIN departments d ON d.id = u.department_id WHERE u.id = 1 LIMIT 1),
      DATE '2026-01-19'
    ) AS start_date,
    COALESCE(
      (SELECT d.semester_end_date FROM users u JOIN departments d ON d.id = u.department_id WHERE u.id = 1 LIMIT 1),
      DATE '2026-06-27'
    ) AS end_date
),
target_students AS (
  SELECT DISTINCT u.id AS user_id
  FROM users u
  JOIN enrollments e ON e.student_id = u.id
  WHERE u.role = 'STUDENT'
    AND u.department_id = (SELECT department_id FROM users WHERE id = 1 LIMIT 1)
)
DELETE FROM attendance_logs
WHERE user_id IN (SELECT user_id FROM target_students)
AND timestamp::date BETWEEN (SELECT start_date FROM bounds) AND (SELECT end_date FROM bounds)
AND remarks LIKE '[FINALSEED_STUDENT]%';

CREATE TEMP TABLE tmp_student_days ON COMMIT DROP AS
WITH bounds AS (
  SELECT
    COALESCE(
      (SELECT d.semester_start_date FROM users u JOIN departments d ON d.id = u.department_id WHERE u.id = 1 LIMIT 1),
      DATE '2026-01-19'
    ) AS start_date,
    COALESCE(
      (SELECT d.semester_end_date FROM users u JOIN departments d ON d.id = u.department_id WHERE u.id = 1 LIMIT 1),
      DATE '2026-06-27'
    ) AS end_date
),
students AS (
  SELECT DISTINCT
    u.id AS user_id,
    e.class_id,
    COALESCE(c.start_time, TIME '07:30') AS base_start,
    COALESCE(c.end_time, TIME '11:30') AS base_end,
    COALESCE(c.day_of_week, 'Monday') AS class_day
  FROM users u
  JOIN enrollments e ON e.student_id = u.id
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE u.role = 'STUDENT'
    AND u.department_id = (SELECT department_id FROM users WHERE id = 1 LIMIT 1)
),
calendar AS (
  SELECT gs::date AS day
  FROM bounds b
  CROSS JOIN generate_series(b.start_date, b.end_date, INTERVAL '1 day') gs
)
SELECT
  s.user_id,
  s.class_id,
  c.day,
  s.base_start,
  s.base_end,
  s.class_day,
  ((s.user_id + s.class_id + EXTRACT(DAY FROM c.day)::int) % 8 = 0) AS is_late,
  ((s.user_id + s.class_id + EXTRACT(DAY FROM c.day)::int) % 6 = 0) AS has_break,
  ((s.user_id + s.class_id + EXTRACT(DAY FROM c.day)::int) % 13 = 0) AS early_exit
FROM students s
CROSS JOIN calendar c
WHERE EXTRACT(ISODOW FROM c.day) =
  CASE LOWER(s.class_day)
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    WHEN 'sunday' THEN 7
    ELSE 1
  END
  AND ((s.user_id + s.class_id + EXTRACT(DOY FROM c.day)::int) % 10) NOT IN (0, 1);

-- ENTRY
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tsd.user_id,
  tsd.class_id,
  1,
  'ENTRY',
  'FACE',
  ROUND((0.68 + ((EXTRACT(DAY FROM tsd.day)::int % 20) / 100.0))::numeric, 3),
  NULL,
  CASE
    WHEN tsd.is_late THEN tsd.day::timestamp + tsd.base_start + (((EXTRACT(DAY FROM tsd.day)::int % 20) + 3)::text || ' minutes')::interval
    ELSE tsd.day::timestamp + tsd.base_start - (((EXTRACT(DAY FROM tsd.day)::int % 6) + 1)::text || ' minutes')::interval
  END,
  CASE
    WHEN tsd.is_late THEN '[FINALSEED_STUDENT] [LATE by ' || ((EXTRACT(DAY FROM tsd.day)::int % 20) + 3) || ' min]'
    ELSE '[FINALSEED_STUDENT]'
  END,
  tsd.is_late
FROM tmp_student_days tsd;

-- BREAK_OUT
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tsd.user_id,
  tsd.class_id,
  1,
  'BREAK_OUT',
  'FACE+GESTURE',
  ROUND((0.66 + ((EXTRACT(DAY FROM tsd.day)::int % 15) / 100.0))::numeric, 3),
  'PEACE_SIGN',
  tsd.day::timestamp + tsd.base_start + INTERVAL '50 minutes',
  '[FINALSEED_STUDENT] Break Out',
  FALSE
FROM tmp_student_days tsd
WHERE tsd.has_break;

-- BREAK_IN
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tsd.user_id,
  tsd.class_id,
  1,
  'BREAK_IN',
  'FACE+GESTURE',
  ROUND((0.67 + ((EXTRACT(DAY FROM tsd.day)::int % 15) / 100.0))::numeric, 3),
  'THUMBS_UP',
  tsd.day::timestamp + tsd.base_start + INTERVAL '1 hour 2 minutes',
  '[FINALSEED_STUDENT] Break In',
  FALSE
FROM tmp_student_days tsd
WHERE tsd.has_break;

-- EXIT
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tsd.user_id,
  tsd.class_id,
  1,
  'EXIT',
  'FACE+GESTURE',
  ROUND((0.69 + ((EXTRACT(DAY FROM tsd.day)::int % 14) / 100.0))::numeric, 3),
  'OPEN_PALM',
  CASE
    WHEN tsd.early_exit THEN tsd.day::timestamp + tsd.base_end - INTERVAL '14 minutes'
    ELSE tsd.day::timestamp + tsd.base_end + INTERVAL '3 minutes'
  END,
  CASE
    WHEN tsd.early_exit THEN '[FINALSEED_STUDENT] Early exit'
    ELSE '[FINALSEED_STUDENT]'
  END,
  FALSE
FROM tmp_student_days tsd;

COMMIT;
