/**
 * Static report type definitions for FacultyReportsPage.
 * Extracted to keep the main component under the 300-line limit.
 *
 * Each entry:
 *  - id     : unique key used for selection state
 *  - label  : human-readable title
 *  - desc   : description shown in the info box
 *  - type   : 'CLASS' (student logs) or 'PERSONAL' (faculty self logs)
 */
const reportOptions = [
    // --- CLASS SPECIFIC REPORTS ---
    { id: 'CLASS_MONTHLY', label: 'Monthly Attendance Trends (Class)', desc: 'Visual trend of improvement or decline; encourages reflection.', type: 'CLASS' },
    { id: 'CLASS_SEM', label: 'Semestral Report (Per Subject)', desc: 'Provides cumulative data per subject for academic reference.', type: 'CLASS' },
    { id: 'CLASS_OVERALL', label: 'Overall Semestral Summary', desc: 'Consolidates all subjects for holistic engagement assessment.', type: 'CLASS' },
    { id: 'CLASS_LATE', label: 'Late Arrival Report', desc: 'Monitors frequency and duration of lateness for punctuality.', type: 'CLASS' },
    { id: 'CLASS_CONSISTENCY', label: 'Personal Consistency Index (Student)', desc: 'AI-generated metric predicting absence trends based on attendance regularity.', type: 'CLASS' },
    { id: 'ABSENCE_SUM', label: 'Absence Summaries per Section', desc: 'Quantifies absences for easier grading and participation assessment.', type: 'CLASS' },
    { id: 'BREAK_DURATION', label: 'Break Duration Analysis', desc: 'Detects patterns of excessive or frequent breaks among students.', type: 'CLASS' },
    { id: 'PUNCTUALITY_INDEX', label: 'Punctuality Index per Section', desc: 'Ranks student punctuality using time-in differentials relative to scheduled start times.', type: 'CLASS' },
    { id: 'UNRECOGNIZED_LOGS', label: 'Unrecognized Individual Logs', desc: 'Lists unknown individuals detected by the camera, enhancing classroom security.', type: 'CLASS' },
    { id: 'EARLY_EXITS', label: 'Early Exits Report', desc: 'Identifies students leaving before class ends—useful for participation grading.', type: 'CLASS' },
    { id: 'BREAK_ABUSE', label: 'Break Abuse / Extended Break Report', desc: 'Detects students failing to return or exceeding break limits.', type: 'CLASS' },
    { id: 'MISSED_ATTENDANCE', label: 'Missed Attendance but Present in BreakLogs', desc: 'Catches inconsistencies where students skip logging attendance but use break features.', type: 'CLASS' },
    { id: 'PARTICIPATION_INSIGHT', label: 'Class Participation Consistency Insight', desc: 'AI-computed stability index showing class engagement trends across sessions.', type: 'CLASS' },

    // --- PERSONAL FACULTY REPORTS ---
    { id: 'PERSONAL_DAILY', label: 'Daily Attendance per Subject', desc: 'Tracks presence, lateness, and breaks for each class session.', type: 'PERSONAL' },
    { id: 'PERSONAL_WEEKLY', label: 'Weekly Attendance Summary', desc: 'Summarizes present/absent/late counts; promotes accountability.', type: 'PERSONAL' },
    { id: 'PERSONAL_MONTHLY', label: 'Monthly Attendance Trends (Self)', desc: 'Visual trend of improvement or decline; encourages reflection.', type: 'PERSONAL' },
    { id: 'PERSONAL_SEM', label: 'Semestral Report (Per Subject - Self)', desc: 'Provides cumulative data per subject for academic reference.', type: 'PERSONAL' },
    { id: 'PERSONAL_OVERALL', label: 'Overall Semestral Summary (Self)', desc: 'Consolidates all subjects for holistic engagement assessment.', type: 'PERSONAL' },
    { id: 'HISTORY_30D', label: 'Attendance History Log (30 Days)', desc: 'Maintains recent timestamps; balances data retention and privacy.', type: 'PERSONAL' },
    { id: 'INSTRUCTOR_DELAY', label: 'Personal Late Arrival Report (Instructor Delay)', desc: 'Monitors frequency and duration of lateness for punctuality.', type: 'PERSONAL' },
    { id: 'PERSONAL_CONSISTENCY', label: 'Personal Consistency Index', desc: 'AI-generated metric predicting absence trends based on attendance regularity.', type: 'PERSONAL' },
];

export default reportOptions;
