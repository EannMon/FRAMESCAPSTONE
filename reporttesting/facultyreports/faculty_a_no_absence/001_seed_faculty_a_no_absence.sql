-- Faculty A No-Absence Seed
-- Target user: FACULTY A TEST DATA (users.id = 96)
-- Goal:
--   1) No absences from semester start to end (ENTRY for every scheduled session)
--   2) Use department semester window from departments table
--   3) Include break cycles for behavioral realism
--   4) Idempotent inserts

WITH target_faculty AS (
    SELECT id, department_id
    FROM users
    WHERE id = 96
),
semester_window AS (
    SELECT
        COALESCE(d.semester_start_date, DATE '2026-01-01') AS start_date,
        COALESCE(d.semester_end_date, DATE '2026-06-30') AS end_date,
        COALESCE(d.active_academic_year, '2025-2026') AS active_academic_year,
        COALESCE(d.active_semester, '2nd Semester') AS active_semester
    FROM target_faculty tf
    LEFT JOIN departments d ON d.id = tf.department_id
),
faculty_classes AS (
    SELECT
        c.id AS class_id,
        c.day_of_week,
        c.start_time,
        c.end_time,
        c.academic_year,
        c.semester
    FROM classes c
    CROSS JOIN semester_window sw
    WHERE c.faculty_id = 96
      AND c.day_of_week IS NOT NULL
      AND c.start_time IS NOT NULL
      AND c.end_time IS NOT NULL
      AND (c.academic_year IS NULL OR c.academic_year = sw.active_academic_year)
      AND (c.semester IS NULL OR c.semester = sw.active_semester)
),
calendar_days AS (
    SELECT d::date AS session_date
    FROM semester_window,
         generate_series(start_date, end_date, INTERVAL '1 day') AS g(d)
),
candidate_sessions AS (
    SELECT
        fc.class_id,
        fc.day_of_week,
        fc.start_time,
        fc.end_time,
        cd.session_date,
        (
            EXTRACT(HOUR FROM fc.start_time)::int * 60 +
            EXTRACT(MINUTE FROM fc.start_time)::int
        ) AS start_minutes,
        (
            EXTRACT(HOUR FROM fc.end_time)::int * 60 +
            EXTRACT(MINUTE FROM fc.end_time)::int
        ) AS end_minutes
    FROM faculty_classes fc
    JOIN calendar_days cd
      ON LOWER(TRIM(fc.day_of_week)) = LOWER(TRIM(TO_CHAR(cd.session_date, 'FMDay')))
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
        LEAST(16, GREATEST(6, sp.duration_minutes / 3))::int AS break_out_mins,
        LEAST(26, GREATEST(10, sp.duration_minutes / 2))::int AS break_in_mins
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
    96,
    se.class_id,
    1,
    'ENTRY'::public."attendanceaction",
    'FACE'::public."verifiedby",
    0.913,
    NULL,
    se.start_ts,
    '[SEED-FACULTY-A-NO-ABSENCE]',
    FALSE
FROM session_enriched se
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 96
      AND dup.class_id = se.class_id
      AND dup.action = 'ENTRY'
      AND dup."timestamp" = se.start_ts
)
UNION ALL
SELECT
    96,
    se.class_id,
    1,
    'BREAK_OUT'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.874,
    'PEACE_SIGN',
    se.start_ts + make_interval(mins => se.break_out_mins),
    '[SEED-FACULTY-A-NO-ABSENCE]',
    FALSE
FROM session_enriched se
WHERE se.global_session_idx % 4 = 0
  AND NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 96
      AND dup.class_id = se.class_id
      AND dup.action = 'BREAK_OUT'
      AND dup."timestamp" = se.start_ts + make_interval(mins => se.break_out_mins)
)
UNION ALL
SELECT
    96,
    se.class_id,
    1,
    'BREAK_IN'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.887,
    'THUMBS_UP',
    se.start_ts + make_interval(mins => se.break_in_mins),
    '[SEED-FACULTY-A-NO-ABSENCE]',
    FALSE
FROM session_enriched se
WHERE se.global_session_idx % 4 = 0
  AND NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 96
      AND dup.class_id = se.class_id
      AND dup.action = 'BREAK_IN'
      AND dup."timestamp" = se.start_ts + make_interval(mins => se.break_in_mins)
)
UNION ALL
SELECT
    96,
    se.class_id,
    1,
    'EXIT'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.896,
    'OPEN_PALM',
    se.end_ts,
    '[SEED-FACULTY-A-NO-ABSENCE]',
    FALSE
FROM session_enriched se
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 96
      AND dup.class_id = se.class_id
      AND dup.action = 'EXIT'
      AND dup."timestamp" = se.end_ts
);

-- Verification summary
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
WHERE al.user_id = 96
GROUP BY c.id, s.code, c.day_of_week
ORDER BY s.code, c.day_of_week, c.id;
