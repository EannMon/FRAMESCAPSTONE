BEGIN;
SET search_path TO public;

-- Faculty seed (all faculty in head-managed department)
-- Semester dates come from the department managed by head user_id=1.
-- Class day/time are resolved from each assigned faculty class.
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
faculty_users AS (
  SELECT u.id AS user_id
  FROM users u
  WHERE u.role = 'FACULTY'
    AND u.department_id = (SELECT department_id FROM users WHERE id = 1 LIMIT 1)
)
DELETE FROM attendance_logs
WHERE user_id IN (SELECT user_id FROM faculty_users)
  AND timestamp::date BETWEEN (SELECT start_date FROM bounds) AND (SELECT end_date FROM bounds)
  AND remarks LIKE '[FINALSEED_FACULTY]%';

CREATE TEMP TABLE tmp_faculty_days ON COMMIT DROP AS
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
faculty_users AS (
  SELECT u.id AS user_id
  FROM users u
  WHERE u.role = 'FACULTY'
    AND u.department_id = (SELECT department_id FROM users WHERE id = 1 LIMIT 1)
),
faculty_classes AS (
  SELECT
    fu.user_id,
    c.id AS class_id,
    COALESCE(c.start_time, TIME '08:00') AS base_start,
    COALESCE(c.end_time, TIME '10:00') AS base_end,
    COALESCE(c.day_of_week, 'Monday') AS class_day
  FROM faculty_users fu
  JOIN classes c ON c.faculty_id = fu.user_id
),
calendar AS (
  SELECT gs::date AS day
  FROM bounds b
  CROSS JOIN generate_series(b.start_date, b.end_date, INTERVAL '1 day') gs
)
SELECT
  fu.user_id,
  fc.class_id,
  c.day,
  ((fu.user_id + fc.class_id + EXTRACT(DAY FROM c.day)::int) % 7 = 0) AS is_late,
  ((fu.user_id + fc.class_id + EXTRACT(DAY FROM c.day)::int) % 5 = 0) AS has_break,
  ((fu.user_id + fc.class_id + EXTRACT(DAY FROM c.day)::int) % 9 = 0) AS early_exit,
  fc.base_start,
  fc.base_end,
  fc.class_day
FROM faculty_users fu
JOIN faculty_classes fc ON fc.user_id = fu.user_id
CROSS JOIN calendar c
WHERE EXTRACT(ISODOW FROM c.day) =
  CASE LOWER(fc.class_day)
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    WHEN 'sunday' THEN 7
    ELSE 1
  END
AND ((fu.user_id + fc.class_id + EXTRACT(DOY FROM c.day)::int) % 10) NOT IN (0, 1);

-- ENTRY
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tfd.user_id,
  tfd.class_id,
  1,
  'ENTRY',
  'FACE',
  ROUND((0.76 + ((EXTRACT(DAY FROM tfd.day)::int % 12) / 100.0))::numeric, 3),
  NULL,
  CASE
    WHEN tfd.is_late THEN tfd.day::timestamp + tfd.base_start + (((EXTRACT(DAY FROM tfd.day)::int % 18) + 4)::text || ' minutes')::interval
    ELSE tfd.day::timestamp + tfd.base_start - (((EXTRACT(DAY FROM tfd.day)::int % 6) + 1)::text || ' minutes')::interval
  END,
  CASE
    WHEN tfd.is_late THEN '[FINALSEED_FACULTY] [LATE by ' || ((EXTRACT(DAY FROM tfd.day)::int % 18) + 4) || ' min]'
    ELSE '[FINALSEED_FACULTY]'
  END,
  tfd.is_late
FROM tmp_faculty_days tfd;

-- BREAK_OUT
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tfd.user_id,
  tfd.class_id,
  1,
  'BREAK_OUT',
  'FACE+GESTURE',
  ROUND((0.72 + ((EXTRACT(DAY FROM tfd.day)::int % 10) / 100.0))::numeric, 3),
  'PEACE_SIGN',
  tfd.day::timestamp + tfd.base_start + INTERVAL '1 hour 20 minutes',
  '[FINALSEED_FACULTY] Break Out',
  FALSE
FROM tmp_faculty_days tfd
WHERE tfd.has_break;

-- BREAK_IN
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tfd.user_id,
  tfd.class_id,
  1,
  'BREAK_IN',
  'FACE+GESTURE',
  ROUND((0.73 + ((EXTRACT(DAY FROM tfd.day)::int % 10) / 100.0))::numeric, 3),
  'THUMBS_UP',
  tfd.day::timestamp + tfd.base_start + INTERVAL '1 hour 30 minutes',
  '[FINALSEED_FACULTY] Break In',
  FALSE
FROM tmp_faculty_days tfd
WHERE tfd.has_break;

-- EXIT
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  tfd.user_id,
  tfd.class_id,
  1,
  'EXIT',
  'FACE+GESTURE',
  ROUND((0.77 + ((EXTRACT(DAY FROM tfd.day)::int % 9) / 100.0))::numeric, 3),
  'OPEN_PALM',
  CASE
    WHEN tfd.early_exit THEN tfd.day::timestamp + tfd.base_end - INTERVAL '20 minutes'
    ELSE tfd.day::timestamp + tfd.base_end + INTERVAL '4 minutes'
  END,
  CASE
    WHEN tfd.early_exit THEN '[FINALSEED_FACULTY] Early exit'
    ELSE '[FINALSEED_FACULTY]'
  END,
  FALSE
FROM tmp_faculty_days tfd;

COMMIT;
