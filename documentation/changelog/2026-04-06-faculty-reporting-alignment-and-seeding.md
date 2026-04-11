# Faculty Reporting Alignment and Seeding Changelog

Date: 2026-04-06
Scope: Faculty personal records alignment with student reporting conventions, class-specific reporting stability, analytics source consistency, current-period default filters, Faculty A attendance seed pack
Status: Implemented (static checks passed in modified source files)

## 1. Executive Summary

This change set aligns Faculty reporting behavior with the Student reporting model while preserving Faculty-specific class analytics.

Core outcomes:

- Faculty Personal Records now use student-style report categories and semantics.
- Faculty report filters default to current department period settings (`A.Y.`, semester, semester start/end).
- Faculty report header now shows full academic year range (for example `A.Y. 2025-2026`) instead of year-only.
- Class-specific reports retain existing report catalog but now consistently feed analytics from full report rows.
- Report envelopes now include `visual_rows` (full non-paginated rows) for accurate trend/status analytics while table rows remain paginated.
- New seed pack added for `users.id = 96` to generate no-absence faculty attendance logs using department semester window.

## 2. Problem Context and Root Causes

### Issues observed

1. Faculty Personal Records dropdown and IDs were faculty-legacy style, not aligned with student report semantics.
2. `A.Y.` badge and semestral defaults did not consistently use the department's configured active period.
3. Semestral fallback still clipped 2nd semester end to May 31 in some paths.
4. Analytics visuals in report pages were tied to paginated row slices in some flows.

### Root causes

- UI report IDs and labels in Faculty module diverged from student report contract.
- Department period values (`active_academic_year`, `active_semester`, `semester_start_date`, `semester_end_date`) were only partially consumed.
- Envelope contract returned paginated rows only; visual pipelines needed full row scope.

## 3. File-Level Changes

### 3.1 Frontend: Faculty Reports UI and Filter Semantics

File: `frontend/src/components/FacultyDashboard/FacultyReportsPage.jsx`

#### Personal report alignment

- Replaced personal report options with student-style report IDs and names:
  - `DAILY_REPORT`
  - `WEEKLY_SUMMARY`
  - `MONTHLY_TRENDS`
  - `SEM_REPORT`
  - `LATE_REPORT`
  - `BREAK_LOG`
  - `ABSENT_LOG`
  - `CONSISTENCY`
- Preserved class-specific report set and category grouping.

#### Report ID mapping (frontend to backend)

- Added explicit mapping for personal report IDs to faculty backend handlers:
  - `DAILY_REPORT -> PERSONAL_DAILY`
  - `WEEKLY_SUMMARY -> PERSONAL_WEEKLY`
  - `MONTHLY_TRENDS -> PERSONAL_MONTHLY`
  - `SEM_REPORT -> PERSONAL_SEMESTER`
  - `LATE_REPORT -> INSTRUCTOR_DELAY`
  - `BREAK_LOG -> BREAK_LOG`
  - `ABSENT_LOG -> ABSENT_LOG`
  - `CONSISTENCY -> PERSONAL_CONSISTENCY`

#### Current period defaults and AY range display

- Added `academicYearLabel` state and now renders full range in badge:
  - `A.Y. 2025-2026` (not just `A.Y. 2025`)
- Added semester normalization from department string values.
- Added `departmentSemesterWindow` state and semestral date window now prefers department semester start/end.
- Corrected 2nd semester fallback end from `May 31` to `June 30`.

#### Filter behavior improvements

- Class reports default to first handled class if none selected.
- Personal reports allow either all taught subjects or a selected class filter.
- Subject/class dropdown text updated to `All Taught Subjects`.

#### Analytics source improvements

- Added `visualReportData` state.
- Status distribution and activity trend now compute from `visual_rows` when available.
- Generated records table still uses paginated `rows`.

#### Redundant fetch cleanup

- Removed immediate `fetchReportData()` inside `handleSelectReport`; the existing `useEffect` now handles fetch transitions cleanly.

### 3.2 Backend: Report Envelope Contract

File: `backend/services/report_service.py`

- Added `visual_rows` to report envelope responses:
  - `get_faculty_report_envelope(...)`
  - `get_dept_report_envelope(...)`
- `visual_rows` always carries full, unpaginated rows.
- Existing `rows` remains paginated and unchanged for generated-records table rendering.

Impact:

- Prevents visual undercount or trend distortion when `limit` pagination is active.
- Enables consistent metrics/insights rendering for class and personal report dashboards.

## 4. Faculty A Attendance Seeding

### New seed pack

Directory: `reporttesting/facultyreports/faculty_a_no_absence/`

Files:

- `001_seed_faculty_a_no_absence.sql`
- `900_monitor_faculty_a_seed.sql`
- `README.md`

### Seed constraints implemented

Target faculty:

- `users.id = 96`

Window source:

- Department semester dates from `departments` linked by `users.department_id`
- Fallback window: `2026-01-01` to `2026-06-30`

Behavior generated:

- ENTRY for every scheduled session date (no seeded absences)
- No seeded late entries (`is_late = FALSE` for ENTRY)
- Periodic break cycles (`BREAK_OUT`, `BREAK_IN`) for realism
- EXIT logs for session closure
- Idempotent `NOT EXISTS` insertion guards
- Seed tags in remarks: `[SEED-FACULTY-A-NO-ABSENCE]`

Eligibility logic:

- Seeds only classes with non-null `day_of_week`, `start_time`, `end_time`
- Restricts class set to faculty-owned classes in active semester/year context

Monitoring checks included:

- Count by action
- Late-entry count (expected `0` from seed)
- Coverage span by class (`first_seed_date`, `last_seed_date`, `entry_days`)

## 5. Behavioral Result Expectations

After applying this change and running seed scripts:

1. Faculty Personal Records dropdown mirrors student-style personal report structure.
2. Academic year badge shows full range from department settings.
3. Default semestral scope uses active department semester dates.
4. Class-specific report analytics should remain available and more stable under pagination.
5. Faculty A personal report windows should show full-session presence coverage with no seeded absences.

## 6. Validation Performed

Static problem checks reported no errors for:

- `frontend/src/components/FacultyDashboard/FacultyReportsPage.jsx`
- `backend/services/report_service.py`

## 7. Operational Notes

1. Restart backend after service changes.
2. Hard-refresh frontend after UI changes to avoid stale in-memory module state.
3. Run seed and monitor scripts in order from the seed README.
4. If old report labels persist in UI, clear browser cache/storage for local bundle invalidation.

## 8. Related Files Touched

- `frontend/src/components/FacultyDashboard/FacultyReportsPage.jsx`
- `backend/services/report_service.py`
- `reporttesting/facultyreports/faculty_a_no_absence/001_seed_faculty_a_no_absence.sql`
- `reporttesting/facultyreports/faculty_a_no_absence/900_monitor_faculty_a_seed.sql`
- `reporttesting/facultyreports/faculty_a_no_absence/README.md`

## 9. Conclusion

Faculty reporting now follows student-style personal reporting semantics while preserving faculty class-specific analysis behavior. The current-period default logic is now department-driven, and analytics are safer against pagination artifacts. Faculty A seed data is now reproducible and scoped to semester dates configured in the department record.
