# Student Reporting and Insights Overhaul Changelog

Date: 2026-04-02
Scope: Student dashboard trends, student report windows, semestral consistency, scoped filtering, report-specific insights, seed/verification SQL alignment
Status: Implemented and validated (static checks passed)

## 1. Executive Summary

This change set was a full end-to-end correction of the student reporting pipeline, from data generation assumptions to backend scope computation to frontend visualization behavior.

Primary outcomes:
- Report windows and semester windows are now aligned with department semester dates (Jan 01 to Jun 30 for current dataset).
- Semestral visual summaries now use full-scope rows instead of paginated table rows.
- Subject filtering behavior is consistent across weekly, monthly, and semestral report types.
- Absent, late, and break reports now have report-specific insights rather than generic mixed narratives.
- Personal consistency report layout was revised as requested (visual summary placement, generated records removal, performance metrics removal).
- Student dashboard trend chart now shows proper period context and no longer collapses to June-only in seeded semester data scenarios.

## 2. Problem Timeline and Root Causes

### Initial issues detected
1. Expected session validation logic in SQL was incorrect for per-class weekday counts.
2. Frontend semestral windows still used hardcoded dates that ended 2nd semester at May 31.
3. Report visuals and summary cards were computed from paginated rows in some paths, producing inconsistent totals.
4. Weekly subject filtering had bypass logic that forced all-subject behavior.
5. Insights panel blended generic comparative narratives into report types that should be specialized.
6. Student dashboard trend chart used recent history or inferred absent values rather than robust semester-scoped report rows.

### Core root causes
- Mixed date-window sources (hardcoded frontend windows vs backend semester dates).
- Row-source mismatch (table rows with pagination vs visualization rows without pagination).
- Artificial absent inference in dashboard trend chart.
- Scope/filter bypass logic in frontend and legacy assumptions in SQL verification scripts.

## 3. Detailed File-Level Changes

## 3.1 Backend service changes

### backend/services/report_service.py
- Refactored student envelope scoping:
  - Resolved enrolled classes and scoped classes up front.
  - Correctly derived is_all_subject_scope using scoped set equality with enrolled set.
  - Added scope_label metadata logic with subject codes and class-count fallback.
- Fixed base query timestamp filter type consistency:
  - Uses datetime comparisons directly.
- Standardized class filtering:
  - Uses resolved scoped class IDs only.
  - Empty scope forces no-result filter.
- Expanded absent-row simulation usage:
  - Included all major report types where status distribution/activity trend requires absent context.
- Added visual_rows field in API response:
  - visual_rows carries full non-paginated rows for analytics/visualization.
  - rows remains paginated for generated-records table.

Impact:
- Eliminated visual/report metric distortion caused by paginated data slices.
- Improved consistency between all-subject and subject-filtered semestral views.

### backend/services/report_metric_service.py
- Session-count reference calculations improved:
  - Removed truncation of whole semester conducted/attended at current date.
  - Whole semester now evaluates through semester_end_date.
- Preserved expected-session calculation across full configured semester range.

Impact:
- Prevents impossible state where whole semester counts are smaller than report-window counts when seeded data exists for full term.

### backend/services/role_based_analytics_service.py
- Added scope-aware narrative titles and text for core student insights.
- Introduced report-specific early-return insight sets for:
  - LATE_REPORT
  - BREAK_LOG
  - ABSENT_LOG
- Report-specific insights now isolate the relevant behavior dimensions and avoid generic overlap.

Impact:
- Insight content is now aligned with selected report intent.

## 3.2 Backend API router changes

### backend/api/routers/student.py
- Existing parse/window path was preserved.
- Envelope integration now benefits from corrected backend service scoping and counting behavior.

Impact:
- No endpoint contract break; behavior improved through service-layer fixes.

## 3.3 Frontend report page changes

### frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx

#### Date-window and semester alignment
- Added department semester window fetch via /api/dept/academic-year.
- Added robust parser for semester code and academic year start.
- Updated getSemesterWindow to prefer department semester_start_date and semester_end_date when active semester/year matches selection.
- Corrected fallback 2nd semester end date from May 31 to Jun 30.

#### Scope and filtering behavior
- Removed weekly subject force-reset to All.
- Enabled subject filter interaction for weekly summary.
- Ensured class_id/class_ids are sent consistently for weekly summary as well.

#### Data source consistency
- Changed report analytics source to payload.visual_rows when available.
- Kept paginated payload.rows for table rendering only.

#### Visual summary and period clarity
- Added explicit period label in visual trend card:
  - Period: YYYY-MM-DD to YYYY-MM-DD
- Maintained grouped-by-subject display while preserving zero-value bars.

#### Insights behavior
- For report types LATE_REPORT, BREAK_LOG, ABSENT_LOG:
  - Insights panel now prefers report-specific deep insights plus backend report-specific insights.
  - Excludes generic comparative mix for these report types.
- Added deep frontend insight generation for report-specific analysis dimensions:
  - Per-subject ranking
  - Cross-subject gap
  - Temporal day/month trend
  - Behavioral cluster patterns
  - Break-return compliance gap
  - Actionable recommendation

#### Personal consistency layout changes
- Visual Summary moved above Behavioral Consistency Profile in consistency report.
- Removed Generated Records section for consistency report.
- Removed Performance Metrics panel for consistency report.

Impact:
- Report page now presents semestral and consistency outputs in the requested structure.
- Subject/all-scope inconsistencies are reduced by using full visual data and consistent windows.

## 3.4 Frontend dashboard trend changes

### frontend/src/components/StudentDashboard/StudentDashboardPage.jsx
- AttendanceTrendChart now receives semesterWindow.
- Dashboard fetch flow now attempts to load semester window from department academic-year endpoint.
- Added fallback semester window logic if endpoint data is unavailable.
- Dashboard semestral chart now fetches student SEM_REPORT rows directly and prefers full visual_rows.
- Removed fake absent baseline logic based on max-present.
- Added explicit period labels:
  - Weekly period range
  - Monthly period range
  - Semestral period range

Impact:
- Dashboard trend chart now uses semester-scoped data and clearer period context.
- Prevents June-only artifact caused by limited source rows.

## 3.5 SQL and seeding assets

### CHARLIE_DEPLOYMENT_AND_VERIFICATION.sql
- Corrected expected session assumptions:
  - Monday/Tuesday/Friday = 26
  - Wednesday = 25
- Updated whole-semester expected total from 208 to 206.
- Corrected query sections and checklist comments accordingly.

### reporttesting/studentreports/charlie_sample_test/*.sql
- Removed over-blocking day-level skip that prevented class-level seeding on same date.
- Added diagnostics per subject seed script.
- Updated README notes for duplicate protection behavior.

### reporttesting/studentreports/alpha_no_absence_test/001_seed_alpha_no_absence.sql
- Added no-absence seed for Alpha (user_id 147):
  - Always inserts ENTRY for scheduled sessions.
  - Retains realistic variety: late, break, early-exit, auto-timeout.
  - Uses idempotent insert guards.

Impact:
- Verification and seed behavior now match real semester calendar and intended simulation models.

## 4. Functional Behavior After Changes

### Semestral report
- Uses Jan 01 to Jun 30 when department semester dates are configured accordingly.
- Report window expected sessions now align with semester expected sessions in full-semester views.
- Visual summaries should no longer be undercounted by pagination artifacts.

### Subject filtering
- Subject filter behavior is now consistent in weekly and semestral contexts.
- Subject-specific visual counts are computed from full visual rows in selected window.

### Report-specific insights
- Absent logs: concentration, contribution, temporal spike, risk windows.
- Late logs: subject late-rate ranking, day concentration, trend direction, action guidance.
- Break logs: break-cycle concentration, day patterns, return-compliance gaps, action guidance.

### Personal consistency index page
- No performance metric cards.
- Visual summary appears before behavioral profile.
- Generated records table is hidden.

### Student dashboard trend graph
- Uses semester report rows when available.
- Shows explicit period range.
- No synthetic absent inflation.

## 5. Validation and Safety Checks

Static validation completed with no errors in modified files:
- frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx
- frontend/src/components/StudentDashboard/StudentDashboardPage.jsx
- backend/services/report_service.py
- backend/services/report_metric_service.py
- backend/services/role_based_analytics_service.py

Operational reminder:
- Restart backend after service-layer changes.
- Hard refresh frontend to bypass in-memory report cache during retesting.

## 6. Remaining Caveats and Notes

- If department academic-year endpoint returns no semester dates, fallback window rules are used.
- If seeded data includes future dates, whole-semester counts now include those dates through semester_end_date by design.
- Generated-record table remains paginated intentionally; analytics and visual summary use full visual_rows.

## 7. Recommended Regression Checks

1. Semestral report, all subjects:
- Confirm report window and whole semester expected both show 206.
- Confirm visual status totals reflect full scope.

2. Semestral report, Test Subject A:
- Verify counts remain internally consistent and do not exceed all-subject totals in logically impossible ways.

3. Consistency report:
- Confirm no Performance Metrics section.
- Confirm Visual Summary is above Behavioral Consistency Profile.
- Confirm no Generated Records table.

4. Late/Absent/Break reports:
- Confirm unique insights are shown and are report-specific.

5. Student dashboard trend chart:
- Confirm semestral period text is shown.
- Confirm data appears across relevant semester months when present in backend rows.

## 8. Files Most Relevant to this Overhaul

- backend/services/report_service.py
- backend/services/report_metric_service.py
- backend/services/role_based_analytics_service.py
- backend/api/routers/student.py
- frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx
- frontend/src/components/StudentDashboard/StudentDashboardPage.jsx
- CHARLIE_DEPLOYMENT_AND_VERIFICATION.sql
- reporttesting/studentreports/alpha_no_absence_test/001_seed_alpha_no_absence.sql
- reporttesting/studentreports/charlie_sample_test/001_seed_charlie_it3.sql
- reporttesting/studentreports/charlie_sample_test/002_seed_charlie_it4.sql
- reporttesting/studentreports/charlie_sample_test/003_seed_charlie_it36.sql
- reporttesting/studentreports/charlie_sample_test/004_seed_charlie_it45.sql
- reporttesting/studentreports/charlie_sample_test/005_seed_charlie_cc3.sql
- reporttesting/studentreports/charlie_sample_test/README.md

## 9. Conclusion

This overhaul moved the student reporting flow from mixed assumptions to a consistent data contract:
- one authoritative semester window source,
- one authoritative visualization row source,
- report-specific insight semantics,
- and requested UI structure updates.

The result is a more reliable and analytically coherent reporting experience for seeded semester datasets and real runtime data.
