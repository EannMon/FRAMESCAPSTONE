BEGIN;
SET search_path TO public;

-- Student seed (BSIT-2B-M)
-- Uses actual class schedule:
--   class_id=12, Monday, 18:00-20:00
--   class_id=11, Wednesday, 18:00-20:00
-- Date range: 2026-01-19 to 2026-06-27
-- Absences are implicit (some class days intentionally skipped)

DELETE FROM attendance_logs
WHERE user_id IN (
  SELECT id FROM users WHERE role = 'STUDENT' AND id BETWEEN 98 AND 146
)
AND timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
AND remarks LIKE '[FINALSEED_STUDENT]%';

CREATE TEMP TABLE tmp_student_days ON COMMIT DROP AS
WITH bounds AS (
  SELECT DATE '2026-01-19' AS start_date, DATE '2026-06-27' AS end_date
),
students AS (
  SELECT
    u.id AS user_id
  FROM users u
  WHERE u.role = 'STUDENT'
    AND u.id BETWEEN 98 AND 146
    AND COALESCE(u.section, '') = 'BSIT-2B-M'
),
section_classes AS (
  SELECT
    c.id AS class_id,
    c.day_of_week,
    c.start_time,
    c.end_time
  FROM classes c
  WHERE c.section = 'BSIT-2B-M'
    AND c.id IN (11, 12)
    AND c.day_of_week IN ('Monday', 'Wednesday')
),
calendar AS (
  SELECT gs::date AS day
  FROM bounds b
  CROSS JOIN generate_series(b.start_date, b.end_date, INTERVAL '1 day') gs
)
SELECT
  s.user_id,
  sc.class_id,
  c.day,
  COALESCE(sc.start_time, TIME '18:00') AS base_start,
  COALESCE(sc.end_time, TIME '20:00') AS base_end,
  ((s.user_id + EXTRACT(DAY FROM c.day)::int) % 8 = 0) AS is_late,
  ((s.user_id + EXTRACT(DAY FROM c.day)::int) % 6 = 0) AS has_break,
  ((s.user_id + EXTRACT(DAY FROM c.day)::int) % 13 = 0) AS early_exit
FROM students s
JOIN calendar c ON TRUE
JOIN section_classes sc ON (
  (EXTRACT(ISODOW FROM c.day) = 1 AND sc.day_of_week = 'Monday')
  OR (EXTRACT(ISODOW FROM c.day) = 3 AND sc.day_of_week = 'Wednesday')
)
WHERE EXTRACT(ISODOW FROM c.day) IN (1, 3)
  AND ((s.user_id + EXTRACT(DOY FROM c.day)::int) % 10) NOT IN (0, 1);

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
  tsd.day::timestamp + tsd.base_start + INTERVAL '55 minutes',
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
  tsd.day::timestamp + tsd.base_start + INTERVAL '1 hour 8 minutes',
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
    WHEN tsd.early_exit THEN tsd.day::timestamp + tsd.base_end - INTERVAL '18 minutes'
    ELSE tsd.day::timestamp + tsd.base_end + INTERVAL '3 minutes'
  END,
  CASE
    WHEN tsd.early_exit THEN '[FINALSEED_STUDENT] Early exit'
    ELSE '[FINALSEED_STUDENT]'
  END,
  FALSE
FROM tmp_student_days tsd;

COMMIT;
