-- Validation report for finalseed attendance logs
-- Scope: 2026-01-19 to 2026-06-27

SET search_path TO public;

-- 1) High-level counts by seed tag
SELECT
  CASE
    WHEN remarks LIKE '[FINALSEED_HEAD]%' THEN 'HEAD'
    WHEN remarks LIKE '[FINALSEED_FACULTY]%' THEN 'FACULTY'
    WHEN remarks LIKE '[FINALSEED_STUDENT]%' THEN 'STUDENT'
    ELSE 'OTHER'
  END AS seed_group,
  COUNT(*) AS total_logs,
  SUM(CASE WHEN action = 'ENTRY' THEN 1 ELSE 0 END) AS entry_logs,
  SUM(CASE WHEN action = 'BREAK_OUT' THEN 1 ELSE 0 END) AS break_out_logs,
  SUM(CASE WHEN action = 'BREAK_IN' THEN 1 ELSE 0 END) AS break_in_logs,
  SUM(CASE WHEN action = 'EXIT' THEN 1 ELSE 0 END) AS exit_logs,
  SUM(CASE WHEN is_late THEN 1 ELSE 0 END) AS late_logs,
  SUM(CASE WHEN remarks ILIKE '%Early exit%' THEN 1 ELSE 0 END) AS early_exit_logs
FROM attendance_logs
WHERE timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
  AND (
    remarks LIKE '[FINALSEED_HEAD]%'
    OR remarks LIKE '[FINALSEED_FACULTY]%'
    OR remarks LIKE '[FINALSEED_STUDENT]%'
  )
GROUP BY 1
ORDER BY 1;

-- 2) Per-user summary with role
SELECT
  u.id AS user_id,
  u.role,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  COUNT(*) AS total_logs,
  SUM(CASE WHEN al.action = 'ENTRY' THEN 1 ELSE 0 END) AS entries,
  SUM(CASE WHEN al.is_late THEN 1 ELSE 0 END) AS late_entries,
  SUM(CASE WHEN al.action = 'BREAK_OUT' THEN 1 ELSE 0 END) AS break_outs,
  SUM(CASE WHEN al.action = 'BREAK_IN' THEN 1 ELSE 0 END) AS break_ins,
  SUM(CASE WHEN al.action = 'EXIT' THEN 1 ELSE 0 END) AS exits,
  SUM(CASE WHEN al.remarks ILIKE '%Early exit%' THEN 1 ELSE 0 END) AS early_exits
FROM attendance_logs al
JOIN users u ON u.id = al.user_id
WHERE al.timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
  AND (
    al.remarks LIKE '[FINALSEED_HEAD]%'
    OR al.remarks LIKE '[FINALSEED_FACULTY]%'
    OR al.remarks LIKE '[FINALSEED_STUDENT]%'
  )
GROUP BY u.id, u.role, u.first_name, u.last_name
ORDER BY u.role, u.id;

-- 3) Distinct attendance days by user (shows implicit absences via lower day counts)
SELECT
  al.user_id,
  u.role,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  COUNT(DISTINCT al.timestamp::date) AS attended_days,
  MIN(al.timestamp::date) AS first_day,
  MAX(al.timestamp::date) AS last_day
FROM attendance_logs al
JOIN users u ON u.id = al.user_id
WHERE al.timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
  AND (
    al.remarks LIKE '[FINALSEED_HEAD]%'
    OR al.remarks LIKE '[FINALSEED_FACULTY]%'
    OR al.remarks LIKE '[FINALSEED_STUDENT]%'
  )
GROUP BY al.user_id, u.role, u.first_name, u.last_name
ORDER BY u.role, attended_days ASC, al.user_id;

-- 4) Quick late leaderboard
SELECT
  al.user_id,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  u.role,
  SUM(CASE WHEN al.is_late THEN 1 ELSE 0 END) AS late_count
FROM attendance_logs al
JOIN users u ON u.id = al.user_id
WHERE al.timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
  AND (
    al.remarks LIKE '[FINALSEED_HEAD]%'
    OR al.remarks LIKE '[FINALSEED_FACULTY]%'
    OR al.remarks LIKE '[FINALSEED_STUDENT]%'
  )
GROUP BY al.user_id, u.first_name, u.last_name, u.role
ORDER BY late_count DESC, al.user_id
LIMIT 20;
