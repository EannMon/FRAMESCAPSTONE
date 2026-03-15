BEGIN;
SET search_path TO public;

-- Department Head seed (user_id = 1)
-- Semester dates come from the department managed by the head account.
-- Class day/time are resolved from the head's assigned class in test data.
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
)
DELETE FROM attendance_logs
WHERE user_id = 1
  AND timestamp::date BETWEEN (SELECT start_date FROM bounds) AND (SELECT end_date FROM bounds)
  AND remarks LIKE '[FINALSEED_HEAD]%';

CREATE TEMP TABLE tmp_head_days ON COMMIT DROP AS
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
head_class AS (
  SELECT
    COALESCE(
      (SELECT c.id FROM classes c WHERE c.faculty_id = 1 ORDER BY c.id LIMIT 1),
      (SELECT c2.id FROM classes c2 ORDER BY c2.id LIMIT 1)
    ) AS class_id,
    COALESCE(
      (SELECT c.start_time FROM classes c WHERE c.faculty_id = 1 ORDER BY c.id LIMIT 1),
      TIME '08:00'
    ) AS base_start,
    COALESCE(
      (SELECT c.end_time FROM classes c WHERE c.faculty_id = 1 ORDER BY c.id LIMIT 1),
      TIME '10:00'
    ) AS base_end,
    COALESCE(
      (SELECT c.day_of_week FROM classes c WHERE c.faculty_id = 1 ORDER BY c.id LIMIT 1),
      'Monday'
    ) AS class_day
),
calendar AS (
  SELECT gs::date AS day
  FROM bounds b
  CROSS JOIN generate_series(b.start_date, b.end_date, INTERVAL '1 day') gs
)
SELECT
  c.day,
  hc.class_id,
  hc.base_start,
  hc.base_end,
  hc.class_day,
  ((EXTRACT(DAY FROM c.day)::int + 1) % 6 = 0) AS is_late,
  ((EXTRACT(DAY FROM c.day)::int + 3) % 4 = 0) AS has_break,
  ((EXTRACT(DAY FROM c.day)::int + 2) % 10 = 0) AS early_exit
FROM calendar c
CROSS JOIN head_class hc
WHERE EXTRACT(ISODOW FROM c.day) =
  CASE LOWER(hc.class_day)
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    WHEN 'sunday' THEN 7
    ELSE 1
  END
  AND (EXTRACT(WEEK FROM c.day)::int % 6) <> 0;

-- ENTRY
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  1,
  thd.class_id,
  1,
  'ENTRY',
  'FACE',
  ROUND((0.74 + ((EXTRACT(DAY FROM thd.day)::int % 16) / 100.0))::numeric, 3),
  NULL,
  CASE
    WHEN thd.is_late THEN thd.day::timestamp + thd.base_start + (((EXTRACT(DAY FROM thd.day)::int % 14) + 4)::text || ' minutes')::interval
    ELSE thd.day::timestamp + thd.base_start - (((EXTRACT(DAY FROM thd.day)::int % 6) + 1)::text || ' minutes')::interval
  END,
  CASE
    WHEN thd.is_late THEN '[FINALSEED_HEAD] [LATE by ' || ((EXTRACT(DAY FROM thd.day)::int % 14) + 4) || ' min]'
    ELSE '[FINALSEED_HEAD]'
  END,
  thd.is_late
FROM tmp_head_days thd;

-- BREAK_OUT
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  1,
  thd.class_id,
  1,
  'BREAK_OUT',
  'FACE+GESTURE',
  ROUND((0.72 + ((EXTRACT(DAY FROM thd.day)::int % 14) / 100.0))::numeric, 3),
  'PEACE_SIGN',
  thd.day::timestamp + thd.base_start + INTERVAL '55 minutes',
  '[FINALSEED_HEAD] Break Out',
  FALSE
FROM tmp_head_days thd
WHERE thd.has_break;

-- BREAK_IN
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  1,
  thd.class_id,
  1,
  'BREAK_IN',
  'FACE+GESTURE',
  ROUND((0.73 + ((EXTRACT(DAY FROM thd.day)::int % 14) / 100.0))::numeric, 3),
  'THUMBS_UP',
  thd.day::timestamp + thd.base_start + INTERVAL '1 hour 8 minutes',
  '[FINALSEED_HEAD] Break In',
  FALSE
FROM tmp_head_days thd
WHERE thd.has_break;

-- EXIT
INSERT INTO attendance_logs (
  user_id, class_id, device_id, action, verified_by,
  confidence_score, gesture_detected, timestamp, remarks, is_late
)
SELECT
  1,
  thd.class_id,
  1,
  'EXIT',
  'FACE+GESTURE',
  ROUND((0.75 + ((EXTRACT(DAY FROM thd.day)::int % 12) / 100.0))::numeric, 3),
  'OPEN_PALM',
  CASE
    WHEN thd.early_exit THEN thd.day::timestamp + thd.base_end - INTERVAL '16 minutes'
    ELSE thd.day::timestamp + thd.base_end + INTERVAL '3 minutes'
  END,
  CASE
    WHEN thd.early_exit THEN '[FINALSEED_HEAD] Early exit'
    ELSE '[FINALSEED_HEAD]'
  END,
  FALSE
FROM tmp_head_days thd;

COMMIT;
