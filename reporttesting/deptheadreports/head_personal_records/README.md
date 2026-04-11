# Department Head Personal Records Seed Pack

Purpose: seed reproducible attendance logs for the department head account (`users.id = 1`) using classes `15, 20, 21` with these constraints:

- No absences (every scheduled session gets an `ENTRY`)
- Exactly 3 late entries for the whole seeded semester window
- Break events included (`BREAK_OUT` and `BREAK_IN`)
- Idempotent SQL (`NOT EXISTS` guards)

## Files

- `001_seed_head_personal_no_absence.sql`: main seed script
- `900_monitor_head_personal_seed.sql`: verification queries

## Run order (psql)

```sql
\i reporttesting/deptheadreports/head_personal_records/001_seed_head_personal_no_absence.sql
\i reporttesting/deptheadreports/head_personal_records/900_monitor_head_personal_seed.sql
```

## Notes

- Semester window comes from `departments.semester_start_date` and `departments.semester_end_date` of the target head's department.
- Fallback window is `2026-01-01` to `2026-06-30` when semester dates are missing.
- Seeded rows are tagged with `remarks LIKE '[SEED-DEPTHEAD-PERSONAL]%'`.
