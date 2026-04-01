# Beta Example Fake - Student Report Seed Pack

Purpose: seed reproducible student-report attendance data for Beta Example Fake (`users.id = 178`) using only the `attendance_logs` table.

Student reference:
- Name: Beta Example Fake
- User ID: 178
- TUPM ID: TUPM-23-0003
- Section: BSIT-3A-M
- Department: COMPUTER STUDIES (id=1)
- Academic Year / Semester: 2025-2026 / 2nd Semester

Semester window source:
- Pulled dynamically from `departments.semester_start_date` and `departments.semester_end_date` for `departments.id = 1`.
- Uses full semester boundaries directly (future dates inside semester are included for manual validation).

Duplicate and overlap protections included in every SQL file:
1. Skip any session date where Beta already has any attendance log.
2. Skip exact duplicate timestamps (`ENTRY`/`EXIT`) if migration is re-run.

Files (one subject per migration):
- `001_seed_beta_it3.sql`   : Subject `IT3` (`classes.id = 16`)
- `002_seed_beta_it4.sql`   : Subject `IT4` (`classes.id = 18`)
- `003_seed_beta_it36.sql`  : Subject `IT36` (`classes.id = 19`)
- `004_seed_beta_it45.sql`  : Subject `IT45` (`classes.id IN (20,21)`)
- `005_seed_beta_cc3.sql`   : Subject `CC3` (`classes.id IN (22,23)`)
- `900_monitor_beta_report_seed_status.sql` : Read-only monitoring queries (coverage, totals, seeded rows)

Execution order:
1. 001
2. 002
3. 003
4. 004
5. 005

Example run (psql):
```sql
\i reporttesting/studentreports/beta_example_fake/001_seed_beta_it3.sql
\i reporttesting/studentreports/beta_example_fake/002_seed_beta_it4.sql
\i reporttesting/studentreports/beta_example_fake/003_seed_beta_it36.sql
\i reporttesting/studentreports/beta_example_fake/004_seed_beta_it45.sql
\i reporttesting/studentreports/beta_example_fake/005_seed_beta_cc3.sql
```

Verification query example:
```sql
SELECT
  class_id,
  DATE("timestamp") AS session_date,
  COUNT(*) AS log_count,
  SUM(CASE WHEN action = 'ENTRY' THEN 1 ELSE 0 END) AS entries,
  SUM(CASE WHEN action = 'EXIT' THEN 1 ELSE 0 END) AS exits
FROM attendance_logs
WHERE user_id = 178
  AND remarks LIKE '[SEED-BETA-REPORTS]%'
GROUP BY class_id, DATE("timestamp")
ORDER BY session_date, class_id;
```
