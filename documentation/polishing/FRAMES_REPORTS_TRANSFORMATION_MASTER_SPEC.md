# FRAMES Reports Transformation Master Specification

## 1. Objective

Transform the reporting feature for Student, Faculty, and Department Head into a complete analytics system that is:

- detailed: each report has explicit formulas, derivation logic, and data lineage
- smart: insight generation is rule-driven, explainable, and measurable
- effective: insights support real academic interventions
- efficient: query patterns avoid N+1, use indexes, and stay within API performance budgets

This document is the implementation-ready source of truth for:

- report catalog and definitions
- metric dictionary
- insight derivation rules and confidence thresholds
- API contracts and backend architecture
- frontend analytics UX flow
- observability, testing, and rollout plan

## 2. Audit Summary (What Exists Today)

### 2.1 Confirmed data sources in current schema

From current schema and models, analytics can reliably use:

- attendance_logs
- users
- classes
- enrollments
- devices
- subjects
- departments
- programs
- security_logs
- session_exceptions

### 2.2 Existing backend report implementation

Current report generation logic is centralized in backend/services/report_service.py with dispatchers for:

- faculty class-specific reports
- faculty personal reports
- department reports

Current transport endpoints:

- /api/faculty/reports/data/{user_id}
- /api/dept/reports/data

Student analytics is currently split across student endpoints and heavy client-side derivation.

### 2.3 Existing frontend implementation state

- Faculty reports: dedicated page with report type selector and server-fetched rows
- Department Head reports: dedicated page with mixed endpoint use
- Student reports: AttendanceHistoryPage performs most analytics derivation client-side from raw logs

### 2.4 Critical gaps identified

1. No canonical metric definitions across modules
2. Some report logic is row-list only (no aggregated metric package)
3. Insight explanations are not standardized ("why this insight was produced")
4. Student insights are mostly frontend-computed and not centrally auditable
5. No formal data quality/confidence scoring for insights
6. No dedicated sessions table; "session conducted" must be derived from attendance activity and class schedule
7. Several currently proposed docs refer to non-existing tables (for example break_logs and sessions)

## 3. Design Principles for the New Reporting System

1. Single source of truth metrics
2. Explainable insights with derivation metadata
3. No N+1 query patterns, maximum 3 round-trips per report endpoint
4. Pagination for all record-list payloads
5. Role-scoped access and department scoping by authenticated identity
6. Separate operational logs from analytics aggregates
7. Response contract must carry both data and explanation

## 4. Canonical Analytics Data Model

## 4.1 Derived entities (logical)

These are not necessarily new tables; they can start as SQL CTEs/views:

- class_session_fact
  - class_id
  - session_date
  - scheduled_start
  - scheduled_end
  - session_status (ONSITE, ONLINE, CANCELLED, HOLIDAY)
  - is_conducted

- attendance_session_fact
  - user_id
  - class_id
  - session_date
  - has_entry
  - has_exit
  - is_late
  - entry_time
  - exit_time
  - break_total_minutes
  - has_break_without_entry

- room_occupancy_fact
  - room
  - date_hour
  - entries_count
  - estimated_peak_occupancy
  - capacity
  - is_over_capacity

## 4.2 Session derivation rule (core)

Because there is no physical sessions table, define conducted sessions as:

- base session candidates from class schedule day_of_week inside requested date range
- exclude session_exceptions of CANCELLED and HOLIDAY
- include ONLINE sessions only when configured for attendance inclusion policy
- mark is_conducted true when either:
  - at least one ENTRY exists for class_id and session_date, or
  - faculty explicitly confirms class conducted (future enhancement)

This supports two attendance baselines:

- Real-Time Attendance Rate = sessions_attended / sessions_conducted
- Semester Progress Attendance = sessions_attended / expected_sessions

## 5. Metric Dictionary (Standard Across All Modules)

For every metric returned, include:

- metric_name
- value
- formula
- numerator
- denominator
- data_window
- confidence
- explanation

### 5.1 Core attendance metrics

1. sessions_attended
- definition: distinct class-session dates where user has ENTRY
- formula: count distinct (class_id, session_date) where has_entry=true

2. sessions_conducted
- definition: class sessions that actually occurred per derivation rule

3. expected_sessions
- definition: scheduled sessions in date window excluding CANCELLED and HOLIDAY

4. real_time_attendance_rate
- formula: sessions_attended / sessions_conducted * 100
- use when judging current behavior

5. semester_progress_attendance_rate
- formula: sessions_attended / expected_sessions * 100
- use when judging trajectory against full term expectation

6. punctuality_rate
- formula: on_time_entries / total_entries * 100

7. late_frequency
- formula: late_entries / total_entries * 100

8. early_exit_rate
- formula: early_exits / total_exits * 100

9. break_compliance_rate
- formula: compliant_breaks / total_breaks * 100

10. consistency_index
- formula: real_time_attendance_rate * 0.7 + punctuality_rate * 0.3

### 5.2 Reliability and confidence metrics

1. data_completeness_score
- formula: non_null_required_fields / total_required_fields * 100

2. insight_confidence
- heuristic:
  - High: >= 20 sessions in window and completeness >= 95%
  - Medium: 8-19 sessions or completeness 85-94%
  - Low: < 8 sessions or completeness < 85%

## 6. Explainable Insight Engine

Every generated insight must return an explanation block:

- insight_code
- title
- narrative
- trigger_conditions
- supporting_metrics
- thresholds_used
- confidence
- recommended_action

### 6.1 Standard insight rules

1. ATTENDANCE_DECLINE_WEEK_OVER_WEEK
- trigger: weekly_attendance_rate decreased by >= 10 percentage points
- why: indicates disengagement trend
- action: notify student + faculty check-in

2. CHRONIC_LATENESS_PATTERN
- trigger: late_frequency >= 30% and late_count >= 3 within 4 weeks
- why: sustained punctuality issue
- action: punctuality intervention

3. BREAK_ABUSE_RISK
- trigger: break_duration > configured limit in >= 3 sessions
- why: attendance integrity and participation concern
- action: faculty review break policy compliance

4. EARLY_EXIT_RISK
- trigger: early_exit_rate >= 20% with >= 3 exits
- why: likely incomplete session participation
- action: session engagement follow-up

5. LOW_CONSISTENCY_RISK
- trigger: consistency_index < 60
- why: high probability of continued attendance instability
- action: risk flag and advisor referral

## 7. Report Catalog and Derivation Specs

Each report below includes objective, input data, required metrics, insight logic, and compute notes.

## 7.1 Student Module

### A. Daily Attendance per Subject

- objective: session-level accountability for current day
- inputs: attendance_logs, classes, subjects, enrollments
- metrics:
  - today_entries
  - today_late_count
  - today_break_total_minutes
  - today_exit_status
- insight examples:
  - "Late by X minutes compared to scheduled start"
  - "Break exceeded recommended threshold"
- efficiency notes:
  - one joined query over logs for user_id + date + enrolled class_ids

### B. Weekly Attendance Summary

- objective: summarize weekly behavior
- metrics:
  - weekly_sessions_conducted
  - weekly_sessions_attended
  - weekly_real_time_attendance_rate
  - weekly_punctuality_rate
- insights:
  - week-over-week change percent
  - best/worst weekday attendance

### C. Monthly Attendance Trends

- objective: month trend and drift detection
- metrics:
  - monthly_attendance_rate
  - monthly_late_frequency
  - monthly_consistency_index
- insights:
  - up/down trend with slope explanation

### D. Semestral Report Per Subject

- objective: subject-level cumulative performance
- metrics:
  - subject_sessions_attended
  - subject_sessions_conducted
  - subject_expected_sessions
  - subject_real_time_attendance_rate
  - subject_progress_attendance_rate
  - subject_punctuality_rate
- insights:
  - subject risk ranking and reasons

### E. Overall Semestral Summary

- objective: holistic status across all enrolled subjects
- metrics:
  - weighted attendance rates across subjects
  - global consistency index
  - projected final attendance
- projection:
  - projected_attended = real_time_attendance_rate * expected_sessions / 100

### F. Attendance History Log (30 Days)

- objective: auditable chronological history
- metrics:
  - record_count
  - present_count
  - late_count
  - break_out_count
  - exit_count
- constraints:
  - paginated list + summary header metrics

### G. Personal Late Arrival Report

- objective: punctuality diagnosis
- metrics:
  - late_count
  - average_late_minutes
  - late_day_distribution
- insights:
  - recurring late weekday detection

### H. Break Duration Log

- objective: break behavior accountability
- metrics:
  - total_break_minutes
  - average_break_minutes
  - extended_break_count
- derivation:
  - pair BREAK_OUT to next BREAK_IN by user and session date

### I. Personal Consistency Index

- objective: risk-aware personal behavior score
- metrics:
  - consistency_index
  - confidence
  - trend_delta
- insight:
  - risk tier with direct threshold explanation

## 7.2 Faculty Module - Personal Attendance Reports

Use same personal metric logic as student, scoped to faculty user_id and assigned classes.

Reports required:

- Daily Attendance per Subject
- Weekly Attendance Summary
- Monthly Attendance Trends
- Semestral Report (Per Subject)
- Overall Semestral Summary
- Attendance History Log (30 Days)
- Personal Late Arrival Report (Instructor Start Delay)
- Personal Consistency Index

Additional derivation for instructor delay:

- instructor_delay_minutes = faculty_entry_time - class_start_time

## 7.3 Faculty Module - Class-Specific Reports

### A. Daily Attendance per Subject (Class)

- metrics:
  - enrolled_count
  - present_count
  - absent_count
  - late_count
  - attendance_rate
- formula:
  - attendance_rate = present_count / enrolled_count * 100

### B. Monthly Attendance Trends (Class)

- metrics:
  - daily_present_counts
  - monthly_class_attendance_rate
  - late_trend

### C. Semestral Report (Per Subject)

- metrics per student:
  - sessions_attended
  - sessions_conducted
  - attendance_rate
  - punctuality_rate
  - consistency_index

### D. Overall Semestral Summary

- objective: class-wide aggregate health
- metrics:
  - class_average_attendance_rate
  - class_average_punctuality_rate
  - class_risk_distribution

### E. Late Arrival Report

- metrics:
  - late_count_per_student
  - mean_late_minutes
  - late_rate

### F. Personal Consistency Index (per student in class)

- metrics:
  - consistency_index_per_student
  - rank_percentile

### G. Absence Summaries per Section

- metrics:
  - absence_count_per_student
  - section_absence_rate

### H. Break Duration Analysis

- metrics:
  - break_minutes_per_student
  - extended_break_incidents

### I. Punctuality Index per Section

- formula:
  - punctuality_index = max(0, 100 - 2 * average_late_minutes)

### J. Unrecognized Individual Logs

- source:
  - security_logs (preferred)
  - fallback: attendance_logs where confidence_score below threshold
- metrics:
  - low_confidence_events
  - spoof_attempt_count

### K. Early Exits Report

- formula:
  - early_exit if EXIT timestamp < class_end_time - grace_minutes

### L. Break Abuse / Extended Break Report

- trigger:
  - break_minutes > configured_break_limit
- metrics:
  - violation_count, max_break_minutes

### M. Missed Attendance but Present in Break Logs

- trigger:
  - BREAK_OUT or BREAK_IN exists for session_date but no ENTRY

### N. Class Participation Consistency Insight through Attendance

- metrics:
  - class_consistency_distribution
  - high-risk student list

## 7.4 Department Head Module

Department Head includes personal + class-specific + faculty-specific reporting.

### Faculty-Specific Reports

1. Faculty Attendance Summary
- metrics: attendance and punctuality by faculty

2. Faculty Late Arrival Report
- metrics: late frequency, mean delay, trend

3. Room Occupancy Trends
- source: attendance_logs joined with classes and devices
- metrics: entries per room over time

4. Peak Usage Hours
- metrics: hourly entry distribution, per-room peaks

5. Room Utilization vs Schedule
- metrics:
  - expected_room_sessions
  - actual_room_sessions
  - utilization_rate

6. Overcrowding Alerts Report
- formula:
  - is_overcrowded when estimated_peak_occupancy > room_capacity

7. Department Activity Summary through Attendance
- metrics:
  - role-based attendance totals
  - course-level participation index

8. Faculty Consistency Index
- metrics:
  - faculty consistency score and volatility

## 7.5 Visual and Chart Specification Per Report

This section is mandatory for implementation. Every report must define at least one primary visual and one fallback visual.

Legend:

- Primary visual: the default chart to display
- Fallback visual: used when sample size is too small or sparse
- Insight overlay: annotations, thresholds, markers, or badges drawn on top of chart data

### 7.5.1 Student Module Visuals

1. Daily Attendance per Subject
- primary visual: Session timeline strip (ENTRY, BREAK_OUT, BREAK_IN, EXIT on time axis)
- fallback visual: Event table grouped by session date
- insight overlay: late marker (minutes), extended break marker, early-exit marker

2. Weekly Attendance Summary
- primary visual: Grouped bar chart by weekday (present, late, absent)
- fallback visual: compact KPI cards (attended, conducted, attendance rate)
- insight overlay: week-over-week delta badge and best/worst day callout

3. Monthly Attendance Trends
- primary visual: Dual-line chart (attendance rate, punctuality rate)
- fallback visual: monthly summary cards
- insight overlay: trend slope arrow, warning threshold lines at 75% and 85%

4. Semestral Report (Per Subject)
- primary visual: Horizontal bar chart per subject (real-time rate and progress rate)
- fallback visual: ranked subject table with sparklines
- insight overlay: risk color bands (critical, warning, acceptable, compliant)

5. Overall Semestral Summary
- primary visual: Radar chart across core dimensions (attendance, punctuality, consistency, break compliance)
- fallback visual: weighted score cards
- insight overlay: projected final attendance gauge and risk tier badge

6. Attendance History Log (30 Days)
- primary visual: Calendar heatmap of attendance events
- fallback visual: chronological timeline list
- insight overlay: highlighted anomaly days (no-entry-with-break, repeated late)

7. Personal Late Arrival Report
- primary visual: Weekday lateness bar chart with average late minutes line
- fallback visual: late incident table sorted by delay
- insight overlay: recurring-day flag if late count threshold is hit

8. Break Duration Log
- primary visual: Break duration histogram with bins (0-5, 6-10, 11-15, 16+)
- fallback visual: box plot summary (min, Q1, median, Q3, max)
- insight overlay: configured break limit vertical line

9. Personal Consistency Index
- primary visual: Gauge chart (0-100)
- fallback visual: score card + 4-week sparkline
- insight overlay: confidence badge and tier definition tooltip

### 7.5.2 Faculty Module - Personal Visuals

All personal faculty reports mirror Student personal visuals with faculty wording.

Additional visual for Instructor Start Delay:

- primary visual: Delay distribution bar chart (on-time, 1-5 min, 6-10 min, 11+)
- fallback visual: delay incident table
- insight overlay: average delay and variance annotations

### 7.5.3 Faculty Module - Class-Specific Visuals

1. Daily Attendance per Subject (Class)
- primary visual: Stacked bar (present, late, absent) for selected session date
- fallback visual: seating-style attendance matrix by student
- insight overlay: attendance target line

2. Monthly Attendance Trends (Class)
- primary visual: Line chart for daily attendance rate across month
- fallback visual: weekly aggregate bars
- insight overlay: sudden drop annotation when delta >= threshold

3. Semestral Report (Per Subject)
- primary visual: Student ranking horizontal bars by consistency index
- fallback visual: sortable performance table
- insight overlay: top-risk quintile highlighting

4. Overall Semestral Summary
- primary visual: Distribution chart of class risk tiers
- fallback visual: KPI summary cards
- insight overlay: intervention-needed count badge

5. Late Arrival Report
- primary visual: Pareto chart of late arrivals per student
- fallback visual: top late students table
- insight overlay: cumulative contribution line

6. Personal Consistency Index (per student in class)
- primary visual: Score strip/heatmap by student
- fallback visual: percentile-ranked table
- insight overlay: percentile and confidence badge per row

7. Absence Summaries per Section
- primary visual: Section absence heatmap by week
- fallback visual: section comparison bars
- insight overlay: threshold breach alerts

8. Break Duration Analysis
- primary visual: Box plot per student or per week
- fallback visual: histogram of class break durations
- insight overlay: outlier points labeled

9. Punctuality Index per Section
- primary visual: Ranked horizontal bar chart (index score)
- fallback visual: sortable index table
- insight overlay: benchmark line (for example index 85)

10. Unrecognized Individual Logs
- primary visual: Event trend line + confidence scatter
- fallback visual: incident table with confidence and timestamp
- insight overlay: low-confidence threshold line

11. Early Exits Report
- primary visual: Stacked bars (normal exits vs early exits) by session date
- fallback visual: early-exit incidents table
- insight overlay: early-exit rate badge

12. Break Abuse / Extended Break Report
- primary visual: Violation frequency bars by student
- fallback visual: violation log table
- insight overlay: rule threshold and repeat-offender flag

13. Missed Attendance but Present in Break Logs
- primary visual: anomaly count trend line
- fallback visual: anomaly case table
- insight overlay: severity tag (single, repeated, persistent)

14. Class Participation Consistency Insight
- primary visual: Multi-metric radar per class or section snapshot
- fallback visual: risk-segment donut chart
- insight overlay: dominant weakness annotation

### 7.5.4 Department Head Module Visuals

1. Faculty Attendance Summary
- primary visual: Faculty comparison grouped bars (attendance and punctuality)
- fallback visual: leaderboard table
- insight overlay: departmental average line

2. Faculty Late Arrival Report
- primary visual: Faculty lateness trend lines
- fallback visual: rank table by mean delay
- insight overlay: chronic lateness badge

3. Room Occupancy Trends
- primary visual: Time-series lines per selected room
- fallback visual: occupancy bars by room
- insight overlay: room capacity reference lines

4. Peak Usage Hours
- primary visual: Hour-of-day heatmap (room x hour)
- fallback visual: top peak-hour list
- insight overlay: peak-hour labels

5. Room Utilization vs Schedule
- primary visual: Side-by-side bars (expected sessions vs actual sessions)
- fallback visual: utilization percentage table
- insight overlay: underutilization and overutilization markers

6. Overcrowding Alerts Report
- primary visual: Alert timeline with severity colors
- fallback visual: overcrowding incident table
- insight overlay: exceed-by count and safety severity

7. Department Activity Summary through Attendance
- primary visual: Role-split stacked area or stacked bars over time
- fallback visual: activity KPIs
- insight overlay: shift in role contribution annotations

8. Faculty Consistency Index
- primary visual: Faculty score distribution histogram
- fallback visual: consistency score ranking table
- insight overlay: variance warning labels

### 7.5.5 Visual Implementation Standards

1. All charts must support desktop and mobile breakpoints.
2. All charts must include empty-state and low-sample-state handling.
3. All thresholds used in insights must be visibly rendered on chart overlays.
4. Color semantics must be consistent:
- green: compliant/good
- amber: warning
- red: risk/critical
- blue: neutral context
5. Every chart card must include:
- title
- metric window (date range)
- data confidence badge
- "why this insight" expandable text
6. Export behavior:
- PDF includes chart snapshots + insight rationale
- CSV includes raw rows + summary metrics (chart data tables)

## 8. API Contract Upgrade (Required)

## 8.1 New response envelope for report endpoints

{
  "success": true,
  "meta": {
    "report_code": "CLASS_SEMESTER",
    "generated_at": "ISO8601",
    "window": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
    "scope": { "module": "FACULTY", "class_id": 12 },
    "query_metrics": { "db_round_trips": 3, "execution_ms": 84 }
  },
  "summary_metrics": [
    {
      "metric_name": "class_average_attendance_rate",
      "value": 88.2,
      "formula": "avg(student_sessions_attended / student_sessions_conducted * 100)",
      "numerator": 0,
      "denominator": 0,
      "data_window": "2026-01-01..2026-03-01",
      "confidence": "HIGH",
      "explanation": "Average across enrolled students with >= 3 conducted sessions"
    }
  ],
  "insights": [
    {
      "insight_code": "ATTENDANCE_DECLINE_WEEK_OVER_WEEK",
      "title": "Weekly attendance is declining",
      "narrative": "Attendance dropped by 12 percentage points compared to prior week.",
      "trigger_conditions": ["delta <= -10"],
      "supporting_metrics": ["weekly_attendance_rate_current", "weekly_attendance_rate_previous"],
      "thresholds_used": { "decline_threshold": 10 },
      "confidence": "MEDIUM",
      "recommended_action": "Trigger class intervention notice"
    }
  ],
  "rows": []
}

## 8.2 Backward compatibility

Phase 1 keeps existing row shape while adding optional sections:

- summary_metrics
- insights
- meta

## 9. Backend Transformation Plan

## 9.1 Service architecture

Create analytics-focused services:

- backend/services/report_metric_service.py
- backend/services/report_insight_service.py
- backend/services/report_query_service.py

Responsibilities:

- report_query_service: raw + aggregated query builders (no business scoring)
- report_metric_service: formula and threshold computation
- report_insight_service: explainable rule engine

## 9.2 Query efficiency rules

- no db.query() inside loops
- use grouped aggregates and batch IN queries
- use existing indexes on attendance_logs and related FKs
- endpoint target: < 100ms for summary, < 250ms with paginated rows

## 9.3 Data quality guards

- discard malformed event sequences when pairing breaks, but log anomaly count
- keep anomaly_count metric in response meta

## 9.4 Security and scope

- all user-scoped reports derive identity from authenticated token
- department head scope restricted to own department_id
- class reports must validate ownership or authorized oversight role

## 10. Frontend Transformation Plan

## 10.1 Student

Move computation-heavy insight generation from AttendanceHistoryPage into backend summary/insight API.

Frontend keeps only:

- filters
- rendering
- export
- lightweight local formatting

## 10.2 Faculty and Department Head

Upgrade report pages to display three synchronized layers:

1. Summary Metrics strip
2. Explainable Insights panel
3. Detail Table

## 10.3 Visual encoding standards

- metric cards include value, denominator context, and confidence badge
- insight cards include explicit "Why" section
- risk tiers use consistent thresholds and color legend

## 10.4 PDF/CSV export upgrades

Include:

- metric definitions section
- insight rationale section
- filters and generation metadata

## 11. Observability and Monitoring for Reports

Per request log:

- report_code
- user_id / role / department_id
- db_round_trips
- execution_ms
- rows_returned
- insight_count
- anomaly_count

Alert thresholds:

- execution_ms > 500 warning
- execution_ms > 1000 error
- db_round_trips > 3 warning

## 12. Testing Strategy

## 12.1 Unit tests

- metric formulas and edge cases
- insight trigger correctness
- confidence scoring correctness

## 12.2 Integration tests

- endpoint response envelope consistency
- role-based access checks
- pagination behavior

## 12.3 Data integrity tests

- break pairing correctness
- early exit detection correctness
- conducted session derivation with session_exceptions

## 12.4 Performance tests

- seeded dataset with realistic scale
- verify P95 response times per report type

## 13. Phased Rollout Plan

### Phase 0: Baseline and contracts (1 week)

- define canonical metric dictionary
- add new response envelope fields while preserving current rows

### Phase 1: Student module upgrade (1-2 weeks)

- backend metrics and insights for all student report types
- frontend Student report page switches to server-driven analytics

### Phase 2: Faculty module upgrade (1-2 weeks)

- class and personal reports with explainable insights
- break abuse and inconsistency logic hardened

### Phase 3: Department head upgrade (1-2 weeks)

- faculty oversight and room analytics with utilization and capacity intelligence

### Phase 4: Hardening (1 week)

- performance tuning
- observability dashboards
- final acceptance testing

## 14. Acceptance Criteria

A report is considered complete only if all are true:

1. returns rows plus summary_metrics plus insights
2. each insight has trigger_conditions and supporting_metrics
3. all formulas are documented and exposed in API response
4. endpoint respects role scope and pagination
5. no N+1 queries and <= 3 DB round-trips target
6. tests include formula correctness and role authorization
7. export includes metric and insight rationale blocks

## 15. Immediate Next Implementation Tasks

1. Introduce response envelope in current report endpoints
2. Implement report_metric_service with canonical formulas
3. Implement report_insight_service with first five standard rules
4. Migrate Student report logic from client-side derivation to backend
5. Add per-report execution telemetry logging

---

This specification is intentionally strict so every report becomes auditable, explainable, and scalable for FRAMES deployment.