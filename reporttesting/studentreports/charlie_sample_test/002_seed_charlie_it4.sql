-- Charlie Sample Test seed: IT4 (Subject ID 11, Class ID 18)
-- Seeds only attendance_logs table.
--
-- Existing data note (snapshot: databasedatafornow0329.txt):
--   - For Charlie (user_id=149), class_id=18 currently has 0 logs.
--   - Charlie has existing logs in class_id=24 (ENTRY=1, BREAK_OUT=1), not part of IT4.
--
-- Status pattern applied to generated sessions (rotating by session sequence):
--   seq%8=1 ON_TIME_FULL      -> ENTRY + EXIT
--   seq%8=2 LATE_FULL         -> ENTRY(is_late=true) + EXIT
--   seq%8=3 EARLY_EXIT        -> ENTRY + EXIT(early)
--   seq%8=4 MULTI_BREAK       -> ENTRY + BREAK_OUT + BREAK_IN + EXIT
--   seq%8=5 AUTO_EXIT_CASE    -> ENTRY + EXIT(AUTO_TIMEOUT)
--   seq%8=6 ABSENT_SIMULATION -> no logs inserted (used to drive absent counts)
--   seq%8=7 LATE_WITH_BREAK   -> ENTRY(is_late=true) + BREAK_OUT + BREAK_IN + EXIT
--   seq%8=0 ON_TIME_FULL      -> ENTRY + EXIT
--
-- Quick weekly verification (run manually after seeding):
-- SELECT date_trunc('week', "timestamp")::date AS week_start, action, is_late, COUNT(*)
-- FROM attendance_logs
-- WHERE user_id=149 AND class_id=18
-- GROUP BY 1,2,3
-- ORDER BY 1,2,3;
--
-- Full verification query (exact counts + context):
-- SELECT
--   u.id AS student_id,
--   CONCAT(u.first_name, ' ', u.last_name) AS student_name,
--   c.id AS class_id,
--   s.code AS subject_code,
--   s.title AS subject_title,
--   CONCAT(f.first_name, ' ', f.last_name) AS professor_name,
--   c.day_of_week,
--   c.start_time,
--   c.end_time,
--   c.room,
--   COUNT(*) FILTER (WHERE al.action::text = 'ENTRY') AS entries,
--   COUNT(*) FILTER (WHERE al.action::text = 'ENTRY' AND al.is_late = true) AS late_entries,
--   COUNT(*) FILTER (WHERE al.action::text = 'BREAK_OUT') AS break_out,
--   COUNT(*) FILTER (WHERE al.action::text = 'BREAK_IN') AS break_in,
--   COUNT(*) FILTER (WHERE al.action::text = 'EXIT') AS exits,
--   COUNT(*) FILTER (WHERE al.action::text = 'EXIT' AND al.verified_by::text = 'AUTO_TIMEOUT') AS auto_exits,
--   COUNT(*) FILTER (WHERE al.action::text = 'ABSENT') AS absents,
--   COUNT(*) AS total_logs
-- FROM attendance_logs al
-- JOIN users u ON u.id = al.user_id
-- JOIN classes c ON c.id = al.class_id
-- JOIN subjects s ON s.id = c.subject_id
-- LEFT JOIN users f ON f.id = c.faculty_id
-- WHERE al.user_id = 149
--   AND al.class_id = 18
-- GROUP BY u.id, u.first_name, u.last_name, c.id, s.code, s.title, f.first_name, f.last_name, c.day_of_week, c.start_time, c.end_time, c.room
-- ORDER BY s.code, c.day_of_week, c.start_time;

WITH semester_window AS (
    SELECT
        COALESCE(semester_start_date, DATE '2026-01-01') AS start_date,
    COALESCE(semester_end_date, DATE '2026-06-30') AS end_date
    FROM departments
    WHERE id = 1
),
calendar_days AS (
    SELECT d::date AS session_date
    FROM semester_window,
         generate_series(start_date, end_date, INTERVAL '1 day') AS g(d)
),
candidate_sessions AS (
    SELECT
        c.id AS class_id,
        c.subject_id,
        c.start_time,
        c.end_time,
        cd.session_date
    FROM classes c
    JOIN calendar_days cd
      ON LOWER(TRIM(c.day_of_week)) = LOWER(TRIM(TO_CHAR(cd.session_date, 'FMDay')))
    WHERE c.id = 18
      AND c.subject_id = 11
      AND c.section = 'BSIT-3A-M'
      AND c.academic_year = '2025-2026'
      AND c.semester = '2nd Semester'
),
filtered_sessions AS (
    SELECT
        cs.*,
        ROW_NUMBER() OVER (ORDER BY cs.session_date, cs.class_id) AS seq,
        (cs.session_date + cs.start_time)::timestamp AS start_ts,
        (cs.session_date + cs.end_time)::timestamp AS end_ts,
        GREATEST(10, EXTRACT(EPOCH FROM ((cs.session_date + cs.end_time)::timestamp - (cs.session_date + cs.start_time)::timestamp)) / 60)::int AS duration_minutes
  FROM candidate_sessions cs
),
session_plan AS (
    SELECT
        fs.*,
        CASE
            WHEN fs.seq % 8 = 1 THEN 'ON_TIME_FULL'
            WHEN fs.seq % 8 = 2 THEN 'LATE_FULL'
            WHEN fs.seq % 8 = 3 THEN 'EARLY_EXIT'
            WHEN fs.seq % 8 = 4 THEN 'MULTI_BREAK'
            WHEN fs.seq % 8 = 5 THEN 'AUTO_EXIT_CASE'
            WHEN fs.seq % 8 = 6 THEN 'ABSENT_SIMULATION'
            WHEN fs.seq % 8 = 7 THEN 'LATE_WITH_BREAK'
            ELSE 'ON_TIME_FULL'
        END AS scenario,
        LEAST(20, GREATEST(5, fs.duration_minutes / 4))::int AS early_exit_mins,
        LEAST(15, GREATEST(5, fs.duration_minutes / 3))::int AS break_out_mins,
        LEAST(25, GREATEST(8, fs.duration_minutes / 2))::int AS break_in_mins,
        LEAST(15, GREATEST(6, fs.duration_minutes / 5))::int AS late_mins
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
    149,
    sp.class_id,
    1,
    'ENTRY'::public."attendanceaction",
    'FACE'::public."verifiedby",
    0.842,
    NULL,
    CASE WHEN sp.scenario IN ('LATE_FULL', 'LATE_WITH_BREAK')
         THEN sp.start_ts + make_interval(mins => sp.late_mins)
         ELSE sp.start_ts END,
    '[SEED-CHARLIE-REPORTS]',
    CASE WHEN sp.scenario IN ('LATE_FULL', 'LATE_WITH_BREAK') THEN TRUE ELSE FALSE END
FROM session_plan sp
WHERE sp.scenario <> 'ABSENT_SIMULATION'
  AND NOT EXISTS (
    SELECT 1 FROM attendance_logs dup
    WHERE dup.user_id = 149
      AND dup.class_id = sp.class_id
      AND dup.action = 'ENTRY'
      AND dup."timestamp" = CASE WHEN sp.scenario IN ('LATE_FULL', 'LATE_WITH_BREAK')
                              THEN sp.start_ts + make_interval(mins => sp.late_mins)
                              ELSE sp.start_ts END
)
UNION ALL
SELECT
    149,
    sp.class_id,
    1,
    'BREAK_OUT'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.812,
    'PEACE_SIGN',
    sp.start_ts + make_interval(mins => sp.break_out_mins),
    '[SEED-CHARLIE-REPORTS]',
    FALSE
FROM session_plan sp
WHERE sp.scenario IN ('MULTI_BREAK', 'LATE_WITH_BREAK')
  AND NOT EXISTS (
    SELECT 1 FROM attendance_logs dup
    WHERE dup.user_id = 149
      AND dup.class_id = sp.class_id
      AND dup.action = 'BREAK_OUT'
      AND dup."timestamp" = sp.start_ts + make_interval(mins => sp.break_out_mins)
)
UNION ALL
SELECT
    149,
    sp.class_id,
    1,
    'BREAK_IN'::public."attendanceaction",
    'FACE+GESTURE'::public."verifiedby",
    0.821,
    'THUMBS_UP',
    sp.start_ts + make_interval(mins => sp.break_in_mins),
    '[SEED-CHARLIE-REPORTS]',
    FALSE
FROM session_plan sp
WHERE sp.scenario IN ('MULTI_BREAK', 'LATE_WITH_BREAK')
  AND NOT EXISTS (
    SELECT 1 FROM attendance_logs dup
    WHERE dup.user_id = 149
      AND dup.class_id = sp.class_id
      AND dup.action = 'BREAK_IN'
      AND dup."timestamp" = sp.start_ts + make_interval(mins => sp.break_in_mins)
)
UNION ALL
SELECT
    149,
    sp.class_id,
    1,
    'EXIT'::public."attendanceaction",
    CASE WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN 'AUTO_TIMEOUT'::public."verifiedby" ELSE 'FACE+GESTURE'::public."verifiedby" END,
    CASE WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN 0.0 ELSE 0.878 END,
    CASE WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN NULL ELSE 'OPEN_PALM' END,
    CASE WHEN sp.scenario = 'EARLY_EXIT'
         THEN sp.end_ts - make_interval(mins => sp.early_exit_mins)
         ELSE sp.end_ts END,
    CASE WHEN sp.scenario = 'EARLY_EXIT' THEN '[SEED-CHARLIE-REPORTS] Early exit'
         WHEN sp.scenario = 'AUTO_EXIT_CASE' THEN '[SEED-CHARLIE-REPORTS] [AUTO_EXIT] System auto-exit simulation'
         ELSE '[SEED-CHARLIE-REPORTS]' END,
    FALSE
FROM session_plan sp
WHERE sp.scenario <> 'ABSENT_SIMULATION'
  AND NOT EXISTS (
    SELECT 1 FROM attendance_logs dup
    WHERE dup.user_id = 149
      AND dup.class_id = sp.class_id
      AND dup.action = 'EXIT'
      AND dup."timestamp" = CASE WHEN sp.scenario = 'EARLY_EXIT'
                              THEN sp.end_ts - make_interval(mins => sp.early_exit_mins)
                              ELSE sp.end_ts END
);

-- ======================
-- DIAGNOSTIC: Verify seeded sessions for Charlie IT4 (user_id=149, class_id=18)
-- ======================
SELECT
  al.user_id,
  al.class_id,
  s.code AS subject_code,
  al.action,
  al.is_late,
  al."timestamp",
  al.verified_by,
  al.remarks
FROM attendance_logs al
JOIN classes c ON c.id = al.class_id
JOIN subjects s ON s.id = c.subject_id
WHERE al.user_id = 149
  AND al.class_id = 18
  AND al."timestamp" >= (SELECT COALESCE(semester_start_date, DATE '2026-01-01') FROM departments WHERE id=1)
ORDER BY al.class_id, al."timestamp", al.action;
