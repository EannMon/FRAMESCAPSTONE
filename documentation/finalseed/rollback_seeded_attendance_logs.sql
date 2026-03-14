BEGIN;
SET search_path TO public;

-- Rollback for finalseed attendance logs (head, faculty, students)
-- Date range scope: 2026-01-19 to 2026-06-27

DELETE FROM attendance_logs
WHERE timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
  AND (
    (user_id = 1 AND remarks LIKE '[FINALSEED_HEAD]%')
    OR (user_id = 97 AND remarks LIKE '[FINALSEED_FACULTY]%')
    OR (
      user_id IN (SELECT id FROM users WHERE role = 'STUDENT' AND id BETWEEN 98 AND 146)
      AND remarks LIKE '[FINALSEED_STUDENT]%'
    )
  );

COMMIT;

-- Optional verification:
-- SELECT COUNT(*)
-- FROM attendance_logs
-- WHERE timestamp::date BETWEEN DATE '2026-01-19' AND DATE '2026-06-27'
--   AND (
--     remarks LIKE '[FINALSEED_HEAD]%'
--     OR remarks LIKE '[FINALSEED_FACULTY]%'
--     OR remarks LIKE '[FINALSEED_STUDENT]%'
--   );
