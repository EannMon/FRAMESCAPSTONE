# FRAMES Defense Changelog and Test Evidence

Date: 2026-03-29  
Prepared for: Capstone defense tracking, technical audit, and deployment readiness review

---

## 1) Purpose of This Document

This file records what was changed, why it was changed, how it was validated, and what still needs monitoring.  
It is intended to help the team explain end-to-end behavior during defense and support ongoing QA.

---

## 2) Scope of Work Covered

### A. Merge conflict resolution and preservation of both teammate changes
- Student report enhancements
- Department head and faculty report workflow compatibility
- Shared CSV/PDF generator compatibility

### B. Student report and attendance reliability checks
- Backend route contract validation
- Attendance state machine and report endpoints tests
- Late threshold logic verification for threshold = 0 (disabled late marking)

### C. Build and diagnostics checks
- Frontend production build
- Backend syntax and targeted test suites

---

## 3) High-Level Timeline (What Happened)

1. Detected unresolved merge markers in student dashboard chart and report generator.
2. Resolved conflicts while preserving both workstreams.
3. Built frontend and checked diagnostics.
4. Installed backend test dependencies and ran targeted tests.
5. Found test drift and logic contract mismatches (tests were outdated vs current backend).
6. Updated tests to current API contracts and stabilized fixtures.
7. Fixed late-threshold logic to fully support threshold = 0 as disabled late marking.
8. Added explicit regression test proving threshold=0 never marks ENTRY as late.
9. Re-ran test suites until passing.

---

## 4) Files Updated and Why

## 4.1 Merge conflict and frontend integration files

### frontend/src/components/StudentDashboard/StudentDashboardPage.jsx
What changed:
- Removed merge markers.
- Kept present count computation.
- Kept absent line computation using baseline strategy.

Why:
- Prevented broken file state.
- Preserved student analytics visualization improvements.

### frontend/src/utils/ReportGenerator.js
What changed:
- Removed merge markers.
- Combined enriched CSV sections with teammate CSV compatibility behavior.
- Preserved metadata, metrics, session references, status distribution, and insights export.
- Preserved CSV sanitization and UTF-8 BOM for Excel compatibility.

Why:
- Preserved both enhancement and compatibility requirements.

### frontend/src/components/DeptHeadDashboard/DeptHeadUserManagementPage.css
What changed:
- Fixed CSS property typos:
  - `fontWeight` -> `font-weight`
  - `marginTop` -> `margin-top`

Why:
- Reduced frontend build warnings.

---

## 4.2 Backend logic and test reliability files

### backend/api/routers/kiosk.py
What changed:
- Late threshold defaults/fallbacks aligned to 0 where appropriate.
- Late computation now only runs when threshold > 0.
- Late threshold update validation changed from 1..120 to 0..120.
- Added safer timestamp fallback initialization in attendance log flow.

Why:
- Enforces requirement: threshold=0 means late marking is disabled.
- Prevents accidental late-tagging when no threshold is intended.

### backend/api/routers/faculty.py
What changed:
- Late threshold update validation changed from 1..120 to 0..120.

Why:
- Faculty-facing threshold setting must allow explicit disable mode (0).

### backend/tests/conftest.py
What changed:
- Auth headers now created from JWT token factory directly, instead of repeated login calls.

Why:
- Prevented rate-limit failures during test setup.
- Improved test stability and speed.

### backend/tests/test_student_routes.py
What changed:
- Updated test paths to current API contract:
  - `/api/student/dashboard/{user_id}`
  - `/api/student/schedule/{user_id}`
  - `/api/student/history/{user_id}`
- Updated expected authorization behavior.

Why:
- Original tests used outdated endpoint paths.

### backend/tests/test_attendance_service.py
What changed:
- Updated model fields to match current schema (`Subject.title` instead of `name`).
- Updated endpoint call style for attendance state query params.
- Stabilized time-window setup for deterministic attendance-state assertions.
- Added new regression test:
  - `test_threshold_zero_disables_late_marking`

Why:
- Fixed failing tests caused by schema/API drift.
- Added proof for threshold=0 requirement.

---

## 5) Tests Executed and Results

## 5.1 Frontend validation
Command used:
- `npm run build` (from frontend)

Result:
- Build completed successfully.
- Non-blocking warnings remain (legacy CSS syntax/style locations and chunk size advisory).

Interpretation:
- App compiles and bundles for production.
- Warnings should be cleaned in polish phase but are not hard blockers.

## 5.2 Backend targeted tests
Commands used:
- `pytest tests/test_student_routes.py -q`
- `pytest tests/test_attendance_service.py -q`
- Combined run: `pytest tests/test_attendance_service.py tests/test_student_routes.py -q`

Final result:
- 15 passed, 0 failed
- Warnings present (Pydantic v2 deprecations, FastAPI lifespan deprecation)

Interpretation:
- Student report route behavior and attendance logic are currently passing targeted validation.
- Warning cleanup remains a technical debt item, not immediate functional breakage.

---

## 6) Late Threshold = 0 Verification (Critical Defense Point)

Requirement to prove:
- If professor sets late threshold to 0, student ENTRY should never be tagged late regardless of time.

Implementation proof:
- Kiosk late check now gated by `threshold > 0`.
- Faculty and kiosk threshold update validation now accepts `0`.

Test proof:
- Added regression test `test_threshold_zero_disables_late_marking`.
- Scenario:
  - class late threshold set to 0
  - ENTRY posted at a time that would normally be late
  - expected `is_late = false`
- Test passes.

Example scenario for defense demo:
1. Class starts 08:00, threshold = 0.
2. Student enters at 10:15.
3. System stores ENTRY as present, not late.
4. API response includes `is_late: false`.

---

## 7) End-to-End Report Flow (Student Perspective)

1. Student requests report data by report type and filters.
2. Backend validates ownership via JWT-linked identity.
3. Backend computes report envelope (rows + metrics + insights + references).
4. Frontend renders table/cards/charts.
5. Export pipeline generates PDF/CSV with enrichment data.
6. Same report utility remains reusable for faculty/dept head report modules.

Defense explanation angle:
- “We moved from raw table export to evidence-rich export with metrics, context, and insights, while preserving interoperability for faculty/dept head reports.”

---

## 8) Known Non-Blocking Risks and Monitoring Items

1. Frontend build warnings:
- CSS syntax style warnings in some legacy stylesheets.
- Large bundle chunk warning.

2. Backend deprecation warnings:
- Pydantic class config migration warnings.
- FastAPI `on_event` lifespan deprecation warning.

3. Recommendation:
- Track these in a separate hardening ticket before final deployment.

---

## 9) Defense-Ready Talking Points

1. Merge integrity:
- Conflict was resolved without dropping either student-report or dept/faculty-report enhancements.

2. Security and correctness:
- Student endpoints were validated with ownership-aware behavior in tests.

3. Data logic quality:
- Late threshold behavior now supports disable mode as designed (`0 = no late marking`).

4. QA maturity:
- Failures were not ignored; root causes were identified (API drift/rate limits/time windows), corrected, and re-validated.

5. Evidence quality:
- Test suite outputs show passing targeted core behavior (15 passing tests).

---

## 10) Quick Checklist for Next QA Pass

- [ ] Run full backend suite (all files under backend/tests)
- [ ] Remove remaining frontend CSS warnings
- [ ] Migrate Pydantic class config to ConfigDict
- [ ] Replace FastAPI deprecated startup event usage with lifespan handlers
- [ ] Execute cross-role report validation (Student, Faculty, Dept Head) with shared export utility
- [ ] Record before/after screenshots for defense slides

---

## 11) Commands Used (Audit Trail)

### Environment and dependencies
- `python -m pip install pytest pytest-cov httpx`

### Frontend validation
- `npm run build`

### Backend targeted tests
- `python -m pytest tests/test_student_routes.py -q`
- `python -m pytest tests/test_attendance_service.py -q`
- `python -m pytest tests/test_attendance_service.py tests/test_student_routes.py -q`

---

## 12) Conclusion

Current status:
- Merge conflicts resolved and integrated.
- Student report pipeline and related attendance logic validated with targeted tests.
- Critical requirement confirmed: late threshold `0` now behaves as disabled late marking.
- Project is ready to proceed into final polishing and report data logic refinement with a clear evidence baseline.
