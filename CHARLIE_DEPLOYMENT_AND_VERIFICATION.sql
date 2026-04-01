-- ============================================================================
-- CHARLIE SAMPLE TEST DEPLOYMENT & VERIFICATION GUIDE
-- ============================================================================
-- Purpose: Deploy all Charlie seed files and verify data integrity
-- 
-- Execution order:
--   1. Clean existing Charlie data (OPTIONAL if fresh DB)
--   2. Deploy seeds in this order:
--      a. 001_seed_charlie_it3.sql    (IT3 - 52 sessions)
--      b. 002_seed_charlie_it4.sql    (IT4 - 26 sessions)
--      c. 003_seed_charlie_it36.sql   (IT36 - 26 sessions)
--      d. 004_seed_charlie_it45.sql   (IT45 - 52 sessions)
--      e. 005_seed_charlie_cc3.sql    (CC3 - 52 sessions)
--   3. Run verification queries (below)
--   4. Compare results with expected values

-- ============================================================================
-- PART A: CLEAN EXISTING DATA (Optional - only if fresh deployment)
-- ============================================================================

-- DELETE FROM attendance_logs
-- WHERE user_id = 149
--   AND class_id NOT IN (24);  -- Preserve class_id=24 (existing)

-- ============================================================================
-- PART B: DEPLOY SEED FILES
-- ============================================================================
-- Run these in separate psql sessions or wrapped in transactions:
-- 
-- psql -h <host> -U <user> -d <database> -f 001_seed_charlie_it3.sql
-- psql -h <host> -U <user> -d <database> -f 002_seed_charlie_it4.sql
-- psql -h <host> -U <user> -d <database> -f 003_seed_charlie_it36.sql
-- psql -h <host> -U <user> -d <database> -f 004_seed_charlie_it45.sql
-- psql -h <host> -U <user> -d <database> -f 005_seed_charlie_cc3.sql

-- ============================================================================
-- PART C: VERIFICATION QUERIES
-- ============================================================================

-- ============================================================================
-- QUERY 1: Expected Sessions Calculation (VERIFY: should match below)
-- ============================================================================

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
expected_sessions_per_class AS (
    SELECT 
        c.id AS class_id,
        s.code AS subject_code,
        c.day_of_week,
        COUNT(*) AS expected_sessions
    FROM classes c
    JOIN subjects s ON s.id = c.subject_id
    JOIN calendar_days cd 
        ON LOWER(TRIM(c.day_of_week)) = LOWER(TRIM(TO_CHAR(cd.session_date, 'FMDay')))
    WHERE c.id IN (15, 16, 17, 18, 19, 20, 21, 22, 23)  -- All Charlie's classes
    GROUP BY c.id, s.code, c.day_of_week
    ORDER BY s.code, c.day_of_week
)
SELECT 
    subject_code,
    class_id,
    day_of_week,
    expected_sessions,
    CASE 
        WHEN LOWER(TRIM(day_of_week)) IN ('monday', 'tuesday', 'friday') AND expected_sessions = 26 THEN '✓ PASS'
        WHEN LOWER(TRIM(day_of_week)) = 'wednesday' AND expected_sessions = 25 THEN '✓ PASS'
        ELSE '❌ FAIL'
    END AS validation
FROM expected_sessions_per_class;

-- EXPECTED OUTPUT:
-- subject_code | class_id | day_of_week | expected_sessions | validation
-- ─────────────┼──────────┼─────────────┼───────────────────┼────────────
-- IT3          | 15       | Monday      | 26                | ✓ PASS
-- IT3          | 16       | Tuesday     | 26                | ✓ PASS
-- IT4          | 17       | Friday      | 26                | ✓ PASS
-- IT36         | 18       | Monday      | 26                | ✓ PASS
-- IT45         | 20       | Monday      | 26                | ✓ PASS
-- IT45         | 21       | Wednesday   | 25                | ✓ PASS
-- CC3          | 22       | Wednesday   | 25                | ✓ PASS
-- CC3          | 23       | Tuesday     | 26                | ✓ PASS

-- ============================================================================
-- QUERY 2: Actual Seeded Attendance Count (Per Class)
-- ============================================================================

SELECT
    u.id AS student_id,
    u.last_name || ', ' || u.first_name AS student_name,
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
JOIN users u ON u.id = al.user_id
JOIN classes c ON c.id = al.class_id
JOIN subjects s ON s.id = c.subject_id
WHERE al.user_id = 149  -- Charlie
  AND al.class_id IN (15, 16, 17, 18, 19, 20, 21, 22, 23)
GROUP BY u.id, u.last_name, u.first_name, c.id, s.code, c.day_of_week
ORDER BY s.code, c.day_of_week, c.id;

-- ============================================================================
-- QUERY 3: Session Count Reference (Report Window vs. Whole Semester)
-- ============================================================================

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
expected_sessions_all AS (
    SELECT c.id AS class_id, COUNT(*) AS expected_sessions
    FROM classes c
    JOIN calendar_days cd
        ON LOWER(TRIM(c.day_of_week)) = LOWER(TRIM(TO_CHAR(cd.session_date, 'FMDay')))
    WHERE c.id IN (15, 16, 17, 18, 19, 20, 21, 22, 23)
    GROUP BY c.id
),
conducted_sessions_all AS (
    -- Conducted = distinct (class_id, date) with ANY ENTRY
    SELECT c.id AS class_id, COUNT(DISTINCT DATE(al."timestamp")) AS conducted_sessions
    FROM classes c
    LEFT JOIN attendance_logs al ON al.class_id = c.id AND al.action::text = 'ENTRY'
    WHERE c.id IN (15, 16, 17, 18, 19, 20, 21, 22, 23)
    GROUP BY c.id
),
attended_sessions_all AS (
    -- Attended = distinct (class_id, date) where THIS STUDENT has ENTRY
    SELECT c.id AS class_id, COUNT(DISTINCT DATE(al."timestamp")) AS attended_sessions
    FROM classes c
    LEFT JOIN attendance_logs al 
        ON al.class_id = c.id 
        AND al.user_id = 149  -- Charlie
        AND al.action::text = 'ENTRY'
    WHERE c.id IN (15, 16, 17, 18, 19, 20, 21, 22, 23)
    GROUP BY c.id
)
SELECT 
    'Whole Semester' AS period,
    COALESCE(SUM(e.expected_sessions), 0) AS total_expected,
    COALESCE(SUM(c.conducted_sessions), 0) AS total_conducted,
    COALESCE(SUM(a.attended_sessions), 0) AS total_attended,
    COALESCE(SUM(e.expected_sessions), 0) - COALESCE(SUM(a.attended_sessions), 0) AS derived_absences
FROM expected_sessions_all e
FULL OUTER JOIN conducted_sessions_all c ON e.class_id = c.class_id
FULL OUTER JOIN attended_sessions_all a ON e.class_id = a.class_id;

-- EXPECTED OUTPUT:
-- period           | total_expected | total_conducted | total_attended | derived_absences
-- ─────────────────┼────────────────┼─────────────────┼────────────────┼──────────────────
-- Whole Semester   | 206            | ~160-190        | ~150-185       | ~20-56

-- ============================================================================
-- QUERY 4: Per-Subject Summary (For Insights Generation)
-- ============================================================================

SELECT
    s.code AS subject_code,
    s.title AS subject_title,
    COUNT(DISTINCT c.id) AS num_classes,
    SUM(CASE 
        WHEN LOWER(TRIM(c.day_of_week)) IN ('monday', 'tuesday', 'friday') THEN 26
        WHEN LOWER(TRIM(c.day_of_week)) = 'wednesday' THEN 25
        ELSE 0
    END) AS expected_sessions,
    COUNT(DISTINCT al.user_id, DATE(al."timestamp")) FILTER (WHERE al.action::text = 'ENTRY') AS conducted_sessions,
    COUNT(DISTINCT DATE(al."timestamp")) FILTER (WHERE al.user_id = 149 AND al.action::text = 'ENTRY') AS attended_sessions,
    COUNT(*) FILTER (WHERE al.user_id = 149 AND al.action::text = 'ENTRY' AND al.is_late = FALSE) AS on_time,
    COUNT(*) FILTER (WHERE al.user_id = 149 AND al.action::text = 'ENTRY' AND al.is_late = TRUE) AS late,
    COUNT(*) FILTER (WHERE al.user_id = 149 AND al.action::text = 'BREAK_OUT') AS breaks_taken
FROM subjects s
JOIN classes c ON c.subject_id = s.id
LEFT JOIN attendance_logs al ON al.class_id = c.id
WHERE c.id IN (15, 16, 17, 18, 19, 20, 21, 22, 23)
GROUP BY s.id, s.code, s.title
ORDER BY s.code;

-- EXPECTED OUTPUT:
-- subject_code | subject_title | num_classes | expected_sessions | conducted_sessions | attended_sessions | on_time | late | breaks_taken
-- ─────────────┼───────────────┼─────────────┼───────────────────┼────────────────────┼───────────────────┼─────────┼──────┼──────────────
-- IT3          | Test Subject A| 2           | 52                | 45-52              | 38-50             | 32-44   | 6-12 | 0-8
-- IT4          | Test Subject B| 1           | 26                | 20-26              | 18-24             | 18-20   | 0-6  | 2-4
-- IT36         | Test Subject C| 1           | 26                | 15-26              | 12-20             | 10-18   | 2-6  | 1-3
-- IT45         | Test Subject D| 2           | 52                | 40-52              | 35-48             | 25-40   | 10-15| 3-8
-- CC3          | Test Subject E| 2           | 52                | 40-52              | 35-48             | 25-40   | 10-15| 4-10

-- ============================================================================
-- QUERY 5: Weekly Report Test (Week of April 1-7, 2026)
-- ============================================================================

SELECT
    s.code AS subject_code,
    c.day_of_week,
    COUNT(DISTINCT DATE(al."timestamp")) FILTER (WHERE al.action::text = 'ENTRY') AS conducted,
    COUNT(DISTINCT DATE(al."timestamp")) FILTER (WHERE al.user_id = 149 AND al.action::text = 'ENTRY') AS attended,
    COUNT(*) FILTER (WHERE al.user_id = 149 AND al.action::text = 'ENTRY' AND al.is_late = FALSE) AS on_time,
    COUNT(*) FILTER (WHERE al.user_id = 149 AND al.action::text = 'ENTRY' AND al.is_late = TRUE) AS late,
    COUNT(*) FILTER (WHERE al.user_id = 149 AND al.action::text = 'BREAK_OUT') AS breaks
FROM classes c
JOIN subjects s ON s.id = c.subject_id
LEFT JOIN attendance_logs al 
    ON al.class_id = c.id 
    AND DATE(al."timestamp") BETWEEN '2026-04-01' AND '2026-04-07'
WHERE c.id IN (15, 16, 17, 18, 19, 20, 21, 22, 23)
GROUP BY s.code, c.day_of_week
ORDER BY s.code, c.day_of_week;

-- EXPECTED OUTPUT (April 1-7):
-- subject_code | day_of_week | conducted | attended | on_time | late | breaks
-- ─────────────┼─────────────┼───────────┼──────────┼─────────┼──────┼─────
-- IT3          | Monday      | 1         | 1        | 1       | 0    | 0
-- IT3          | Tuesday     | 1         | 1        | 1       | 0    | 0
-- IT4          | Friday      | 1         | 1        | 0       | 1    | 1
-- IT36         | Monday      | 0-1       | 0-1      | 0-1     | 0    | 0
-- IT45         | Monday      | 1         | 1        | 1       | 0    | 0
-- IT45         | Wednesday   | 1         | 0        | 0       | 0    | 0    (absent)
-- CC3          | Tuesday     | 1         | 1        | 1       | 0    | 0
-- CC3          | Wednesday   | 1         | 1        | 0       | 1    | 1

-- APRIL 1-7 SUMMARY:
-- Expected: 8 sessions (Mon:3, Tue:2, Wed:2, Fri:1)
-- Conducted: 7-8 sessions
-- Attended: 6-7 sessions
-- Absences: 1-2 (likely IT36 or IT45 Wed)

-- ============================================================================
-- FINAL VALIDATION CHECKLIST
-- ============================================================================
-- Run this checklist after all queries:

/*
✓ VALIDATION CHECKLIST:

□ Query 1: All expected_sessions match targets
  - IT3: 52 (26 Mon + 26 Tue)
  - IT4: 26 (26 Fri)
  - IT36: 26 (26 Mon)
  - IT45: 52 (26 Mon + 26 Wed)
  - CC3: 52 (26 Tue + 26 Wed)

□ Query 2: Total attendance entries across all classes
  - IT3: ~45-52 entries
  - IT4: ~20-26 entries
  - IT36: ~15-26 entries
  - IT45: ~40-52 entries
  - CC3: ~40-52 entries
  - TOTAL: ~160-208 entries (matches expected or slightly less due to absences)

□ Query 3: Session count reference looks reasonable
    - expected_sessions: 206
  - conducted_sessions: 180+ (at least 87%)
  - attended_sessions: 170+ (at least 82%)
  - derived_absences: 18-40 (~10-20% absence rate)

□ Query 4: Subject summary shows variation (expected mix)
  - All subjects should show some on_time, late, breaks
  - On-time % should vary by subject (IT4 highest, IT45 lowest)

□ Query 5: April 1-7 weekly data shows realistic distribution
  - 8 expected sessions
  - 6-7 attended
  - 1-2 absences
  - Mix of on-time and late arrivals

□ No duplicate timestamps (should be unique per class per date)

*/

-- ============================================================================
-- DIAGNOSTIC: Seed File Execution Quality Check
-- ============================================================================

-- This query shows the distribution of attendance patterns
-- If seed executed correctly, should see roughly 1/8th of entries for each pattern

SELECT
    sum(CASE WHEN al.is_late = FALSE AND al.action::text = 'EXIT' THEN 1 ELSE 0 END) AS on_time_full,
    sum(CASE WHEN al.is_late = TRUE AND al.action::text = 'EXIT' THEN 1 ELSE 0 END) AS late_full,
    sum(CASE WHEN al.action::text = 'EXIT' AND al.early = TRUE THEN 1 ELSE 0 END) AS early_exit,
    sum(CASE WHEN al.action::text = 'BREAK_OUT' THEN 1 ELSE 0 END) AS multi_break,
    sum(CASE WHEN al.verified_by::text = 'AUTO_TIMEOUT' THEN 1 ELSE 0 END) AS auto_timeout,
    count(*) FILTER (WHERE al.action::text = 'ENTRY') AS total_entries
FROM attendance_logs al
WHERE al.user_id = 149
  AND al.class_id IN (15, 16, 17, 18, 19, 20, 21, 22, 23);

-- EXPECTED OUTPUT (roughly distributed):
-- on_time_full | late_full | early_exit | multi_break | auto_timeout | total_entries
-- ─────────────┼───────────┼────────────┼─────────────┼──────────────┼───────────────
--      20-30   |   20-30   |   15-25    |   15-25     |   15-25      |    170-200

-- If severely skewed (e.g., 50 on_time vs 5 late), seed file may have failed.

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================
