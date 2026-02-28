/**
 * Configuration and utility functions for AttendanceHistoryPage.
 * Extracted to keep the main component under the 300-line limit.
 */

// --- Report Type Configuration ---
export const reportTypes = [
    { id: 'DAILY_REPORT', label: 'Daily Attendance per Subject', desc: 'Tracks presence, lateness, and breaks for each class session.' },
    { id: 'WEEKLY_SUMMARY', label: 'Weekly Attendance Summary', desc: 'Summarizes present/absent/late counts; promotes accountability.' },
    { id: 'SEM_REPORT', label: 'Semestral Report (Per Subject)', desc: 'Provides cumulative data per subject for academic reference.' },
    { id: 'OVERALL_SEM', label: 'Overall Semestral Summary', desc: 'Consolidates all subjects for holistic engagement assessment.' },
    { id: 'HISTORY_30D', label: 'Attendance History Log (30 Days)', desc: 'Maintains recent timestamps; balances data retention and privacy.' },
    { id: 'LATE_REPORT', label: 'Personal Late Arrival Report', desc: 'Monitors frequency and duration of lateness for punctuality.' },
    { id: 'BREAK_LOG', label: 'Break Duration Log', desc: 'Shows total break time to encourage responsible behavior.' },
    { id: 'CONSISTENCY', label: 'Personal Consistency Index', desc: 'AI-generated metric predicting absence trends.' }
];

// --- Time Parsing Utility ---
export const parseTimeStr = (timeStr) => {
    if (!timeStr) return 0;
    try {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    } catch {
        return 0;
    }
};

/**
 * Filters raw attendance logs by selected report type, subject,
 * date, semester, and academic year. Returns sorted (desc) results.
 */
export function getFilteredData({ rawLogs, selectedSubject, filterDate, selectedReportType, academicYear, selectedSemester }) {
    let filtered = [...rawLogs];

    // 1. Subject Filter
    if (selectedSubject !== 'ALL') {
        filtered = filtered.filter(l => l.mapped_subject === selectedSubject);
    }

    // 2. Report Type Logic
    const selectedDate = new Date(filterDate);
    selectedDate.setHours(0, 0, 0, 0);

    switch (selectedReportType) {
        case 'DAILY_REPORT':
        case 'LATE_REPORT':
        case 'BREAK_LOG':
            filtered = filtered.filter(l => {
                const logDate = new Date(l.timestamp);
                return logDate.toDateString() === selectedDate.toDateString();
            });
            break;
        case 'WEEKLY_SUMMARY': {
            const weekEnd = new Date(selectedDate);
            weekEnd.setDate(weekEnd.getDate() + 6);
            filtered = filtered.filter(l => {
                const d = new Date(l.timestamp);
                return d >= selectedDate && d <= weekEnd;
            });
            break;
        }
        case 'HISTORY_30D': {
            const last30 = new Date(selectedDate);
            last30.setHours(0, 0, 0, 0);
            last30.setDate(last30.getDate() - 30);
            const rangeEnd = new Date(selectedDate);
            rangeEnd.setHours(23, 59, 59, 999);
            filtered = filtered.filter(l => {
                const d = new Date(l.timestamp);
                return d >= last30 && d <= rangeEnd;
            });
            break;
        }
        case 'SEM_REPORT': {
            const year = parseInt(academicYear);
            let semStart, semEnd;
            if (selectedSemester === '1ST') {
                semStart = new Date(year, 7, 1);
                semEnd = new Date(year, 11, 31);
            } else if (selectedSemester === '2ND') {
                semStart = new Date(year + 1, 0, 1);
                semEnd = new Date(year + 1, 4, 31);
            } else {
                semStart = new Date(year + 1, 5, 1);
                semEnd = new Date(year + 1, 6, 31);
            }
            filtered = filtered.filter(l => {
                const d = new Date(l.timestamp);
                return d >= semStart && d <= semEnd;
            });
            break;
        }
        case 'OVERALL_SEM': {
            const acYear = parseInt(academicYear);
            const acStart = new Date(acYear, 7, 1);
            const acEnd = new Date(acYear + 1, 6, 31);
            filtered = filtered.filter(l => {
                const d = new Date(l.timestamp);
                return d >= acStart && d <= acEnd;
            });
            break;
        }
        default:
            break;
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Generates a human-readable date range string for report headers.
 */
export function getDateRangeString({ filterDate, selectedReportType, academicYear, selectedSemester }) {
    const d = new Date(filterDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    switch (selectedReportType) {
        case 'DAILY_REPORT':
        case 'LATE_REPORT':
        case 'BREAK_LOG':
            return d.toLocaleDateString('en-US', options);
        case 'WEEKLY_SUMMARY': {
            const weekEnd = new Date(d);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${d.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
        }
        case 'HISTORY_30D': {
            const last30 = new Date(d);
            last30.setDate(last30.getDate() - 30);
            return `${last30.toLocaleDateString('en-US', options)} - ${d.toLocaleDateString('en-US', options)}`;
        }
        case 'SEM_REPORT':
            return `${selectedSemester === '1ST' ? '1st' : (selectedSemester === '2ND' ? '2nd' : 'Summer')} Semester ${academicYear}-${parseInt(academicYear) + 1}`;
        case 'OVERALL_SEM':
            return `Academic Year ${academicYear}-${parseInt(academicYear) + 1}`;
        default:
            return d.toLocaleDateString('en-US', options);
    }
}
