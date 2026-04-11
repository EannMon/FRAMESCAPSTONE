-- Monitoring script: Department head personal report seed
-- Target: users.id = 1, classes.id IN (15,20,21)

-- 1) Total seeded rows by action
SELECT
    al.action::text AS action,
    COUNT(*) AS row_count
FROM attendance_logs al
WHERE al.user_id = 1
  AND al.class_id IN (15, 20, 21)
  AND al.remarks LIKE '[SEED-DEPTHEAD-PERSONAL]%'
GROUP BY al.action
ORDER BY al.action;

-- 2) Confirm late entry count is exactly 3
SELECT
    COUNT(*) AS late_entry_count
FROM attendance_logs al
WHERE al.user_id = 1
  AND al.class_id IN (15, 20, 21)
  AND al.action::text = 'ENTRY'
  AND al.is_late = TRUE
  AND al.remarks LIKE '[SEED-DEPTHEAD-PERSONAL]%';

-- 3) Date span coverage by class
SELECT
    al.class_id,
    MIN(al.timestamp::date) AS first_seed_date,
    MAX(al.timestamp::date) AS last_seed_date,
    COUNT(DISTINCT al.timestamp::date) FILTER (WHERE al.action::text = 'ENTRY') AS entry_days
FROM attendance_logs al
WHERE al.user_id = 1
  AND al.class_id IN (15, 20, 21)
  AND al.remarks LIKE '[SEED-DEPTHEAD-PERSONAL]%'
GROUP BY al.class_id
ORDER BY al.class_id;
