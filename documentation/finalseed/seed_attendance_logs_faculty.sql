BEGIN;
SET search_path TO public;

-- Faculty seed (user_id = 97)
-- Uses actual class schedule: class_id=12, Monday, 18:00-20:00
-- Date range: 2026-01-19 to 2026-06-27
-- Absences are implicit (some Mondays intentionally skipped)

DELETE FROM attendance_logs
WHERE user_id = 97
  AND timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
  AND remarks LIKE '[FINALSEED_FACULTY]%';

CREATE TEMP TABLE tmp_faculty_days ON COMMIT DROP AS
WITH bounds AS (
  SELECT DATE '2026-01-19' AS start_date, DATE '2026-06-27' AS end_date
),
faculty_users AS (
  SELECT 97::int AS user_id
),
faculty_class AS (
  SELECT fu.user_id,
         COALESCE(
           (SELECT c.id FROM classes c WHERE c.faculty_id = fu.user_id ORDER BY c.id LIMIT 1),
           (SELECT c2.id FROM classes c2 ORDER BY c2.id LIMIT 1)
         ) AS class_id
  FROM faculty_users fu
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
  ((fu.user_id + EXTRACT(DAY FROM c.day)::int) % 7 = 0) AS is_late,
  ((fu.user_id + EXTRACT(DAY FROM c.day)::int) % 5 = 0) AS has_break,
  ((fu.user_id + EXTRACT(DAY FROM c.day)::int) % 9 = 0) AS early_exit,
  TIME '18:00' AS base_start,
  TIME '20:00' AS base_end
FROM faculty_users fu
JOIN faculty_class fc ON fc.user_id = fu.user_id
CROSS JOIN calendar c
WHERE EXTRACT(ISODOW FROM c.day) = 1
AND ((fu.user_id + EXTRACT(DOY FROM c.day)::int) % 10) NOT IN (0, 1);

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
