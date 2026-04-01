-- Alpha No-Absence Seed
-- Student: ALPHA SAMPLE TEST (user_id=147)
-- Goal: Generate attendance from semester start to end with:
--   - NO ABSENCES (every scheduled session gets an ENTRY)
--   - includes late, breaks, early exits, and auto-timeout exits
--
-- Notes:
-- 1) Uses student's enrolled classes from enrollments table.
-- 2) Uses department semester window from student's department.
-- 3) Idempotent inserts using NOT EXISTS.

WITH target_student AS (
    SELECT id, department_id
    FROM users
    WHERE id = 147
),
semester_window AS (
    SELECT
        COALESCE(d.semester_start_date, DATE '2026-01-01') AS start_date,
        COALESCE(d.semester_end_date, DATE '2026-06-30') AS end_date
    FROM target_student ts
    LEFT JOIN departments d ON d.id = ts.department_id
),
enrolled_classes AS (
    SELECT
        c.id AS class_id,
        c.day_of_week,
        c.start_time,
        c.end_time
    FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = 147
),
calendar_days AS (
    SELECT d::date AS session_date
    FROM semester_window,
         generate_series(start_date, end_date, INTERVAL '1 day') AS g(d)
),
candidate_sessions AS (
    SELECT
        ec.class_id,
        ec.day_of_week,
        ec.start_time,
        ec.end_time,
        cd.session_date,
        ROW_NUMBER() OVER (PARTITION BY ec.class_id ORDER BY cd.session_date) AS seq,
        (
            EXTRACT(HOUR FROM ec.start_time)::int * 60 +
            EXTRACT(MINUTE FROM ec.start_time)::int
        ) AS start_minutes,
        (
            EXTRACT(HOUR FROM ec.end_time)::int * 60 +
            EXTRACT(MINUTE FROM ec.end_time)::int
        ) AS end_minutes
    FROM enrolled_classes ec
    JOIN calendar_days cd
      ON LOWER(TRIM(ec.day_of_week)) = LOWER(TRIM(TO_CHAR(cd.session_date, 'FMDay')))
),
filtered_sessions AS (
    SELECT
        cs.*,
        CASE
            WHEN cs.end_minutes <= cs.start_minutes THEN (cs.end_minutes + 1440) - cs.start_minutes
            ELSE cs.end_minutes - cs.start_minutes
        END AS duration_minutes,
        (cs.session_date::timestamp + make_interval(mins => cs.start_minutes)) AS start_ts,
        (cs.session_date::timestamp + make_interval(mins => cs.end_minutes)) AS end_ts
    FROM candidate_sessions cs
),
session_plan AS (
    SELECT
        fs.*,
        CASE
            WHEN fs.seq % 6 = 1 THEN 'ON_TIME_FULL'
            WHEN fs.seq % 6 = 2 THEN 'LATE_FULL'
            WHEN fs.seq % 6 = 3 THEN 'MULTI_BREAK'
            WHEN fs.seq % 6 = 4 THEN 'EARLY_EXIT'
            WHEN fs.seq % 6 = 5 THEN 'AUTO_EXIT_CASE'
            ELSE 'ON_TIME_FULL'
        END AS scenario,
        LEAST(15, GREATEST(5, fs.duration_minutes / 5))::int AS late_mins,
        LEAST(14, GREATEST(5, fs.duration_minutes / 3))::int AS break_out_mins,
        LEAST(24, GREATEST(8, fs.duration_minutes / 2))::int AS break_in_mins,
        LEAST(18, GREATEST(6, fs.duration_minutes / 4))::int AS early_exit_mins
    FROM filtered_sessions fs
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
    147,
    sp.class_id,
    1,
    'ENTRY'::public."attendanceaction",
    'FACE'::public."verifiedby",
    0.862,
    NULL,
    CASE
        WHEN sp.scenario = 'LATE_FULL' THEN sp.start_ts + make_interval(mins => sp.late_mins)
        ELSE sp.start_ts
    END,
    '[SEED-ALPHA-NO-ABSENCE]',
    CASE WHEN sp.scenario = 'LATE_FULL' THEN TRUE ELSE FALSE END
FROM session_plan sp
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 147
      AND dup.class_id = sp.class_id
      AND dup.action = 'ENTRY'
      AND dup."timestamp" = CASE
          WHEN sp.scenario = 'LATE_FULL' THEN sp.start_ts + make_interval(mins => sp.late_mins)
          ELSE sp.start_ts
      END
)
UNION ALL
SELECT
    147,
    sp.class_id,
    1,
    'BREAK_OUT'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.814,
    'PEACE_SIGN',
    sp.start_ts + make_interval(mins => sp.break_out_mins),
    '[SEED-ALPHA-NO-ABSENCE]',
    FALSE
FROM session_plan sp
WHERE sp.scenario = 'MULTI_BREAK'
  AND NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 147
      AND dup.class_id = sp.class_id
      AND dup.action = 'BREAK_OUT'
      AND dup."timestamp" = sp.start_ts + make_interval(mins => sp.break_out_mins)
)
UNION ALL
SELECT
    147,
    sp.class_id,
    1,
    'BREAK_IN'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.826,
    'THUMBS_UP',
    sp.start_ts + make_interval(mins => sp.break_in_mins),
    '[SEED-ALPHA-NO-ABSENCE]',
    FALSE
FROM session_plan sp
WHERE sp.scenario = 'MULTI_BREAK'
  AND NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 147
      AND dup.class_id = sp.class_id
      AND dup.action = 'BREAK_IN'
      AND dup."timestamp" = sp.start_ts + make_interval(mins => sp.break_in_mins)
)
UNION ALL
SELECT
    147,
    sp.class_id,
    1,
    'EXIT'::public."attendanceaction",
    CASE WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN 'AUTO_TIMEOUT'::public."verifiedby" ELSE 'FACE+GESTURE'::public."verifiedby" END,
    CASE WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN 0.0 ELSE 0.881 END,
    CASE WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN NULL ELSE 'OPEN_PALM' END,
    CASE
        WHEN sp.scenario = 'EARLY_EXIT' THEN sp.end_ts - make_interval(mins => sp.early_exit_mins)
        ELSE sp.end_ts
    END,
    CASE
        WHEN sp.scenario = 'EARLY_EXIT' THEN '[SEED-ALPHA-NO-ABSENCE] Early exit'
        WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN '[SEED-ALPHA-NO-ABSENCE] [AUTO_EXIT]'
        ELSE '[SEED-ALPHA-NO-ABSENCE]'
    END,
    FALSE
FROM session_plan sp
WHERE NOT EXISTS (
    SELECT 1
    FROM attendance_logs dup
    WHERE dup.user_id = 147
      AND dup.class_id = sp.class_id
      AND dup.action = 'EXIT'
      AND dup."timestamp" = CASE
          WHEN sp.scenario = 'EARLY_EXIT' THEN sp.end_ts - make_interval(mins => sp.early_exit_mins)
          ELSE sp.end_ts
      END
);

-- Diagnostic summary (Alpha should have zero derived absences when compared against own expected vs attended)
SELECT
    c.id AS class_id,
    s.code AS subject_code,
    c.day_of_week,
    COUNT(*) FILTER (WHERE al.action::text = 'ENTRY') AS entries,
    COUNT(*) FILTER (WHERE al.action::text = 'ENTRY' AND al.is_late = TRUE) AS late_entries,
    COUNT(*) FILTER (WHERE al.action::text = 'BREAK_OUT') AS break_out,
    COUNT(*) FILTER (WHERE al.action::text = 'BREAK_IN') AS break_in,
    COUNT(*) FILTER (WHERE al.action::text = 'EXIT') AS exits,
    COUNT(*) FILTER (WHERE al.action::text = 'EXIT' AND al.verified_by::text = 'AUTO_TIMEOUT') AS auto_exits,
    COUNT(*) AS total_logs
FROM attendance_logs al
JOIN classes c ON c.id = al.class_id
JOIN subjects s ON s.id = c.subject_id
WHERE al.user_id = 147
GROUP BY c.id, s.code, c.day_of_week
ORDER BY s.code, c.day_of_week, c.id;
