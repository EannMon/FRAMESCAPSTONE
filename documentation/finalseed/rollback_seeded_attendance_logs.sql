BEGIN;
SET search_path TO public;

-- Rollback for finalseed attendance logs (head, faculty, students)
-- Date range is derived from department semester settings managed by head user_id=1.

WITH bounds AS (
  SELECT
    COALESCE(
      (SELECT d.semester_start_date FROM users u JOIN departments d ON d.id = u.department_id WHERE u.id = 1 LIMIT 1),
      DATE '2026-01-19'
    ) AS start_date,
    COALESCE(
      (SELECT d.semester_end_date FROM users u JOIN departments d ON d.id = u.department_id WHERE u.id = 1 LIMIT 1),
      DATE '2026-06-27'
    ) AS end_date
),
target_students AS (
  SELECT DISTINCT u.id AS user_id
  FROM users u
  JOIN enrollments e ON e.student_id = u.id
  WHERE u.role = 'STUDENT'
    AND u.department_id = (SELECT department_id FROM users WHERE id = 1 LIMIT 1)
)
DELETE FROM attendance_logs
WHERE timestamp::date BETWEEN (SELECT start_date FROM bounds) AND (SELECT end_date FROM bounds)
  AND (
    (user_id = 1 AND remarks LIKE '[FINALSEED_HEAD]%')
    OR (user_id = 97 AND remarks LIKE '[FINALSEED_FACULTY]%')
    OR (
      user_id IN (SELECT user_id FROM target_students)
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
