-- Monitoring script for Charlie Sample Test report seeds
-- User ID: 149
-- Uses only read queries.

-- 1) Quick totals
SELECT
    COUNT(*) AS total_logs,
    SUM(CASE WHEN action = 'ENTRY' THEN 1 ELSE 0 END) AS entry_logs,
    SUM(CASE WHEN action = 'EXIT' THEN 1 ELSE 0 END) AS exit_logs,
    SUM(CASE WHEN is_late THEN 1 ELSE 0 END) AS late_logs
FROM attendance_logs
WHERE user_id = 149;

-- 2) Seeded rows only (tagged)
SELECT
    class_id,
    DATE("timestamp") AS session_date,
    MIN("timestamp") AS first_log_time,
    MAX("timestamp") AS last_log_time,
    COUNT(*) AS logs_on_day,
    SUM(CASE WHEN action = 'ENTRY' THEN 1 ELSE 0 END) AS entries,
    SUM(CASE WHEN action = 'EXIT' THEN 1 ELSE 0 END) AS exits
FROM attendance_logs
WHERE user_id = 149
    AND remarks LIKE '[SEED-CHARLIE-REPORTS]%'
GROUP BY class_id, DATE("timestamp")
ORDER BY session_date, class_id;

-- 3) All logs in report classes for semester window
WITH semester_window AS (
    SELECT
        COALESCE(semester_start_date, DATE '2026-01-01') AS start_date,
        COALESCE(semester_end_date, DATE '2026-06-30') AS end_date
    FROM departments
    WHERE id = 1
)
SELECT
    al.class_id,
    DATE(al."timestamp") AS session_date,
    al.action,
    al.verified_by,
    al.confidence_score,
    al.remarks,
    al.is_late
FROM attendance_logs al
JOIN semester_window sw ON DATE(al."timestamp") BETWEEN sw.start_date AND sw.end_date
WHERE al.user_id = 149
  AND al.class_id IN (16,18,19,20,21,22,23)
ORDER BY session_date, class_id, al."timestamp";

-- 4) Coverage view: expected class days vs any Charlie attendance on that date
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
expected_sessions AS (
    SELECT
        c.id AS class_id,
        c.subject_id,
        c.day_of_week,
        cd.session_date
    FROM classes c
    JOIN calendar_days cd
      ON LOWER(TRIM(c.day_of_week)) = LOWER(TRIM(TO_CHAR(cd.session_date, 'FMDay')))
    WHERE c.id IN (16,18,19,20,21,22,23)
),
attendance_days AS (
    SELECT DISTINCT DATE("timestamp") AS attended_date
    FROM attendance_logs
    WHERE user_id = 149
)
SELECT
    es.class_id,
    es.subject_id,
    es.day_of_week,
    es.session_date,
    CASE WHEN ad.attended_date IS NULL THEN 'MISSING' ELSE 'HAS_ATTENDANCE' END AS status
FROM expected_sessions es
LEFT JOIN attendance_days ad
  ON ad.attended_date = es.session_date
ORDER BY es.session_date, es.class_id;
