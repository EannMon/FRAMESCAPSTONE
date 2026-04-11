-- Monitoring script: Faculty A no-absence seed
-- Target: users.id = 96

-- 1) Count seeded rows by action
SELECT
    al.action::text AS action,
    COUNT(*) AS row_count
FROM attendance_logs al
WHERE al.user_id = 96
  AND al.remarks LIKE '[SEED-FACULTY-A-NO-ABSENCE]%'
GROUP BY al.action
ORDER BY al.action;

-- 2) Ensure no seeded late entries
SELECT
    COUNT(*) AS seeded_late_entries
FROM attendance_logs al
WHERE al.user_id = 96
  AND al.action::text = 'ENTRY'
  AND al.is_late = TRUE
  AND al.remarks LIKE '[SEED-FACULTY-A-NO-ABSENCE]%';

-- 3) Coverage window check by class
SELECT
    al.class_id,
    MIN(al.timestamp::date) AS first_seed_date,
    MAX(al.timestamp::date) AS last_seed_date,
    COUNT(DISTINCT al.timestamp::date) FILTER (WHERE al.action::text = 'ENTRY') AS entry_days
FROM attendance_logs al
WHERE al.user_id = 96
  AND al.remarks LIKE '[SEED-FACULTY-A-NO-ABSENCE]%'
GROUP BY al.class_id
ORDER BY al.class_id;
