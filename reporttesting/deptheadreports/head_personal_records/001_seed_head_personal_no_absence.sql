-- Department Head Personal Records Seed
-- Target user: HEAD TEST DEPARTMENT (users.id = 1)
-- Scope classes: 15, 20, 21 (department head's own taught classes)
-- Window: department semester range (fallback: 2026-01-01 .. 2026-06-30)
-- Goal:
--   1) Every scheduled session has an ENTRY (no absences)
--   2) Exactly 3 late ENTRY logs across the full semester window
--   3) Includes BREAK_OUT/BREAK_IN cycles
--   4) Idempotent inserts (safe to re-run)

WITH target_head AS (
    SELECT id, department_id
    FROM users
    WHERE id = 1
),
semester_window AS (
    SELECT
        COALESCE(d.semester_start_date, DATE '2026-01-01') AS start_date,
        COALESCE(d.semester_end_date, DATE '2026-06-30') AS end_date
    FROM target_head th
    LEFT JOIN departments d ON d.id = th.department_id
),
target_classes AS (
    SELECT
        c.id AS class_id,
        c.day_of_week,
        c.start_time,
        c.end_time,
        c.semester,
        c.academic_year
    FROM classes c
    WHERE c.faculty_id = 1
      AND c.id IN (15, 20, 21)
),
calendar_days AS (
    SELECT d::date AS session_date
    FROM semester_window,
         generate_series(start_date, end_date, INTERVAL '1 day') AS g(d)
),
candidate_sessions AS (
    SELECT
        tc.class_id,
        tc.day_of_week,
        tc.start_time,
        tc.end_time,
        tc.semester,
        tc.academic_year,
        cd.session_date,
        (
            EXTRACT(HOUR FROM tc.start_time)::int * 60 +
            EXTRACT(MINUTE FROM tc.start_time)::int
        ) AS start_minutes,
        (
            EXTRACT(HOUR FROM tc.end_time)::int * 60 +
            EXTRACT(MINUTE FROM tc.end_time)::int
        ) AS end_minutes
    FROM target_classes tc
    JOIN calendar_days cd
      ON LOWER(TRIM(tc.day_of_week)) = LOWER(TRIM(TO_CHAR(cd.session_date, 'FMDay')))
),
session_plan AS (
    SELECT
        cs.*,
        CASE
            WHEN cs.end_minutes <= cs.start_minutes THEN (cs.end_minutes + 1440) - cs.start_minutes
            ELSE cs.end_minutes - cs.start_minutes
        END AS duration_minutes,
        (cs.session_date::timestamp + make_interval(mins => cs.start_minutes)) AS start_ts,
        (cs.session_date::timestamp + make_interval(mins => cs.end_minutes)) AS end_ts,
        ROW_NUMBER() OVER (ORDER BY cs.session_date, cs.class_id) AS global_session_idx
    FROM candidate_sessions cs
),
session_enriched AS (
    SELECT
        sp.*,
        CASE
            WHEN sp.global_session_idx IN (8, 22, 36) THEN TRUE
            ELSE FALSE
        END AS is_late_entry,
        LEAST(10, GREATEST(5, sp.duration_minutes / 5))::int AS late_mins,
        LEAST(18, GREATEST(6, sp.duration_minutes / 3))::int AS break_out_mins,
        LEAST(28, GREATEST(10, sp.duration_minutes / 2))::int AS break_in_mins
    FROM session_plan sp
)
INSERT INTO attendance_logs (
    user_id,
    class_id,
    device_id,
    action,
    verified_by,
    confidence_score,
    gesture_detected,
    "timestamp",
    remarks,
    is_late
)
SELECT
    1,
    se.class_id,
    1,
    'ENTRY'::public."attendanceaction",
    'FACE'::public."verifiedby",
    0.901,
    NULL,
    CASE
        WHEN se.is_late_entry THEN se.start_ts + make_interval(mins => se.late_mins)
        ELSE se.start_ts
    END,
    '[SEED-DEPTHEAD-PERSONAL]',
    se.is_late_entry
FROM session_enriched se
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 1
      AND dup.class_id = se.class_id
      AND dup.action = 'ENTRY'
      AND dup."timestamp" = CASE
          WHEN se.is_late_entry THEN se.start_ts + make_interval(mins => se.late_mins)
          ELSE se.start_ts
      END
)
UNION ALL
SELECT
    1,
    se.class_id,
    1,
    'BREAK_OUT'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.873,
    'PEACE_SIGN',
    se.start_ts + make_interval(mins => se.break_out_mins),
    '[SEED-DEPTHEAD-PERSONAL]',
    FALSE
FROM session_enriched se
WHERE se.global_session_idx % 3 = 0
  AND NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 1
      AND dup.class_id = se.class_id
      AND dup.action = 'BREAK_OUT'
      AND dup."timestamp" = se.start_ts + make_interval(mins => se.break_out_mins)
)
UNION ALL
SELECT
    1,
    se.class_id,
    1,
    'BREAK_IN'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.882,
    'THUMBS_UP',
    se.start_ts + make_interval(mins => se.break_in_mins),
    '[SEED-DEPTHEAD-PERSONAL]',
    FALSE
FROM session_enriched se
WHERE se.global_session_idx % 3 = 0
  AND NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 1
      AND dup.class_id = se.class_id
      AND dup.action = 'BREAK_IN'
      AND dup."timestamp" = se.start_ts + make_interval(mins => se.break_in_mins)
)
UNION ALL
SELECT
    1,
    se.class_id,
    1,
    'EXIT'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.894,
    'OPEN_PALM',
    se.end_ts,
    '[SEED-DEPTHEAD-PERSONAL]',
    FALSE
FROM session_enriched se
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 1
      AND dup.class_id = se.class_id
      AND dup.action = 'EXIT'
      AND dup."timestamp" = se.end_ts
);

-- Quick verification snapshot (expected: 3 late entries, 0 ABSENT logs from seed)
SELECT
    c.id AS class_id,
    s.code AS subject_code,
    c.day_of_week,
    COUNT(*) FILTER (WHERE al.action::text = 'ENTRY') AS entries,
    COUNT(*) FILTER (WHERE al.action::text = 'ENTRY' AND al.is_late = TRUE) AS late_entries,
    COUNT(*) FILTER (WHERE al.action::text = 'BREAK_OUT') AS break_out,
    COUNT(*) FILTER (WHERE al.action::text = 'BREAK_IN') AS break_in,
    COUNT(*) FILTER (WHERE al.action::text = 'EXIT') AS exits,
    COUNT(*) AS total_logs
FROM attendance_logs al
JOIN classes c ON c.id = al.class_id
JOIN subjects s ON s.id = c.subject_id
WHERE al.user_id = 1
  AND c.id IN (15, 20, 21)
GROUP BY c.id, s.code, c.day_of_week
ORDER BY s.code, c.day_of_week, c.id;
