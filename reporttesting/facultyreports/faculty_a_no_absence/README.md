# Faculty A No-Absence Seed Pack

Target user: `users.id = 96` (FACULTY A TEST DATA)

## Objective

Generate personal attendance logs for all eligible handled classes from the department semester window with:

- No absences (ENTRY exists for each scheduled session date)
- No seeded late entries
- Included break cycle realism (`BREAK_OUT` and `BREAK_IN` on periodic sessions)
- Idempotent behavior (`NOT EXISTS` guards)

## Semester Window Source

- `departments.semester_start_date`
- `departments.semester_end_date`

Fallback defaults:

- Start: `2026-01-01`
- End: `2026-06-30`

## Run Order

```sql
\i reporttesting/facultyreports/faculty_a_no_absence/001_seed_faculty_a_no_absence.sql
\i reporttesting/facultyreports/faculty_a_no_absence/900_monitor_faculty_a_seed.sql
```

## Notes

- Only classes with valid `day_of_week`, `start_time`, and `end_time` are seeded.
- Rows are tagged with `remarks LIKE '[SEED-FACULTY-A-NO-ABSENCE]%'` for safe audit/cleanup.
