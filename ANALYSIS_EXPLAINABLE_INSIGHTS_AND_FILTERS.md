# FRAMES Student Report Analysis: Explainable Insights, Personal Consistency Index & Filter Logic

## Executive Summary

This document provides complete analysis of:
1. **Explainable Insights** - How "Subject Comparison" and other insights are generated
2. **Personal Consistency Index Report** - Data sources and metrics
3. **AI Insights** button and prompt structure
4. **Subject-comparative analysis** algorithm
5. **Filter/scope discrepancies** between "All Enrolled Subjects" vs subject-specific filters

---

## 1. EXPLAINABLE INSIGHTS GENERATION

### 1.1 Where Insights are Generated

**Frontend Generation (Client-Side)**:
- File: [frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx](frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx#L434)
- Two insight sources:
  1. **Server-generated insights** (backend)
  2. **Client-generated comparative insight** (subject comparison)

**Backend Generation (Server-Side)**:
- File: [backend/services/role_based_analytics_service.py](backend/services/role_based_analytics_service.py#L55)
- Function: `generate_student_role_insights()`
- Called from: [backend/services/report_service.py](backend/services/report_service.py#L3306)

**Insight Service**:
- File: [backend/services/report_insight_service.py](backend/services/report_insight_service.py)
- Contains threshold-based insight rules (DEPRECATED - role_based_analytics_service replaced it)

---

## 2. SUBJECT COMPARISON INSIGHT ("Image 2, 3 suggestions")

### 2.1 Frontend Generation Algorithm

**Location**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L434-L504)

**Code Flow**:
```javascript
const comparativeInsight = useMemo(() => {
    const scoped = getReportScopedLogs(rawLogs);  // Apply subject/report filters
    if (!scoped.length) return null;

    const perSubject = {};
    scoped.forEach((log) => {
        const key = log.subject_code
            ? `${log.subject_code} - ${log.mapped_subject}`
            : (log.mapped_subject || 'Unscheduled');
        
        if (!perSubject[key]) {
            perSubject[key] = { total: 0, attended: 0, late: 0, absent: 0 };
        }
        
        perSubject[key].total += 1;
        const action = normalizeAttendanceAction(log);
        if (action === 'ENTRY') {
            perSubject[key].attended += 1;
            if (log.is_late) perSubject[key].late += 1;
        }
        if (action === 'ABSENT') perSubject[key].absent += 1;
    });

    // Calculate attendance score per subject
    const rows = Object.entries(perSubject).map(([subject, stats]) => ({
        subject,
        ...stats,
        score: stats.total > 0 ? (stats.attended / stats.total) * 100 : 0,
    }));

    if (rows.length < 2) return null;  // Only show if 2+ subjects

    rows.sort((a, b) => b.score - a.score);
    const best = rows[0];
    const weakest = rows[rows.length - 1];

    return {
        insight_code: `SUBJECT_COMPARISON_${selectedReportType}`,
        title: `Subject Comparison (${reportLabel})`,
        narrative: `Best performance is in ${best.subject} (${best.score.toFixed(1)}% attendance coverage) while the weakest is ${weakest.subject} (${weakest.score.toFixed(1)}%). Use this to prioritize intervention or coaching by subject.`,
        confidence: 'MEDIUM',
    };
}, [rawLogs, selectedReportType, selectedSubject, subjectClassMap]);
```

### 2.2 Subject Comparison Characteristics

| Aspect | Value |
|--------|-------|
| **Generated On** | Frontend (client-side) |
| **Data Source** | `rawLogs` fetched from server |
| **Visibility Trigger** | Only when 2+ subjects have data |
| **Metric Computed** | `(attended / total) * 100` per subject |
| **Sorting** | Best to worst by attendance score |
| **Confidence** | Hard-coded as `'MEDIUM'` |
| **Report Types Supported** | All (DAILY, WEEKLY, MONTHLY, SEM, LATE, BREAK, ABSENT, CONSISTENCY) |

### 2.3 Why Subject Comparison Shows as First Insight

**Ordering in Modal**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L698)
```javascript
const visibleInsights = comparativeInsight 
    ? [comparativeInsight, ...modelInsights]  // Prepend subject comparison
    : modelInsights;
```

**Model Insights** come from backend, subject comparison is client-generated and **prepended** to the list.

---

## 3. "VIEW AI INSIGHTS" BUTTON IMPLEMENTATION

### 3.1 Button Location and Trigger

**File**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L714)

**Button Code**:
```jsx
{visibleInsights.length > 0 && (
    <button 
        type="button" 
        className="insight-action-btn"
        onClick={() => setShowInsightsModal(true)}
    >
        <i className="fas fa-lightbulb" style={{ marginRight: '6px' }}></i> 
        View AI Insights
    </button>
)}
```

**Visibility Condition**: Button only shows when `visibleInsights.length > 0`

### 3.2 Modal Display

**Modal Structure**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L760-L780)

```jsx
{showInsightsModal && visibleInsights.length > 0 && (
    <div className="metric-modal-overlay" onClick={() => setShowInsightsModal(false)}>
        <div className="metric-modal-content insight-detailed-modal">
            <button className="modal-close-btn" onClick={() => setShowInsightsModal(false)}>×</button>
            <div className="metric-hover-title">Explainable Insights</div>
            <ul style={{ margin: '15px 0 0 0', paddingLeft: '18px' }}>
                {visibleInsights.map((insight) => (
                    <li key={insight.insight_code} style={{ marginBottom: '10px', fontSize: '0.9em', color: '#333' }}>
                        <strong>{insight.title}:</strong> {insight.narrative} 
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
                            Confidence: {insight.confidence}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
)}
```

### 3.3 AI Prompt (Current: Rule-Based, Not LLM-Driven)

**Current Implementation**: Insights are **NOT** generated by AI/LLM, but by deterministic rules:

**Backend Rule-Based Insights**: [role_based_analytics_service.py](backend/services/role_based_analytics_service.py#L55-L200)

```python
def generate_student_role_insights(
    metrics: Dict[str, float],
    report_code: Optional[str] = None,
    previous_window_metrics: Optional[Dict[str, float]] = None,
    scope_label: str = None,
) -> List[Dict]:
    insights: List[Dict] = []
    
    # ATTENDANCE RELIABILITY
    attendance_rate = float(metrics.get("real_time_attendance_rate", 0.0))
    reliability_band = "strong" if attendance_rate >= 95 else ("moderate" if attendance_rate >= 85 else "weak")
    missed_pct = max(0.0, 100.0 - attendance_rate)
    insights.append(_make_insight(
        "STUDENT_ATTENDANCE_RELIABILITY",
        f"Attendance Reliability Profile ({scope_label})",
        f"{scope_phrase}Attendance reliability is {reliability_band}...",
        ...
    ))
    
    # PUNCTUALITY PATTERN
    punctuality_state = "healthy" if late_frequency < 15 else ("watchlist" if late_frequency < 30 else "critical")
    insights.append(_make_insight(
        "STUDENT_PUNCTUALITY_PATTERN",
        f"Punctuality Habit Pattern ({scope_label})",
        f"{scope_phrase}Punctuality behavior is currently {punctuality_state}...",
        ...
    ))
    
    # CONSISTENCY SIGNAL
    consistency_state = "stable" if consistency >= 75 else ("fluctuating" if consistency >= 60 else "unstable")
    insights.append(_make_insight(
        "STUDENT_CONSISTENCY_SIGNAL",
        f"Consistency and Behavioral Stability ({scope_label})",
        ...
    ))
```

**⚠️ NOTE**: The button is labeled "View AI Insights" but currently uses rule-based generation. Future implementation could integrate with Claude API or OpenAI for true AI-driven insights.

---

## 4. PERSONAL CONSISTENCY INDEX REPORT

### 4.1 Report Definition

**File**: [report_service.py](backend/services/report_service.py#L1106)

```python
def _personal_consistency_report(db: Session, user_id: int, date_from: str, date_to: str):
    """Personal consistency index — 0-100 score based on attendance regularity."""
```

### 4.2 Data Sources and Calculation

| Metric | Source | Formula |
|--------|--------|---------|
| **Consistency Index** | Metric Service | `(real_time_attendance_rate * 0.7) + (punctuality_rate * 0.3)` |
| **Real-Time Attendance Rate** | Metric Service | `sessions_attended / sessions_conducted * 100` |
| **Punctuality Rate** | Metric Service | `on_time_entries / total_entries * 100` |
| **Sessions Conducted** | Distinct ENTRY logs | `COUNT(DISTINCT (class_id, date))` where action=ENTRY |
| **Sessions Attended** | Student's ENTRY logs | `COUNT(DISTINCT (class_id, date))` where user_id=current AND action=ENTRY |
| **Late Entries** | ENTRY logs | `WHERE is_late=TRUE` |
| **On-Time Entries** | ENTRY logs | `WHERE is_late=FALSE` |

**Calculation Function**: [report_metric_service.py](backend/services/report_metric_service.py#L305-L500)
```python
def compute_student_core_metrics(
    db: Session,
    user_id: int,
    date_from: datetime,
    date_to: datetime,
    class_id: Optional[int] = None,
    scoped_class_ids: Optional[List[int]] = None,
    classes: Optional[List[Class]] = None,
) -> Dict[str, float]:
    """
    Computes: 
    - sessions_attended, sessions_conducted, expected_sessions
    - late_entries, on_time_entries
    - late_frequency, punctuality_rate
    - consistency_index
    - early_exit_rate, break minutes, etc.
    """
```

### 4.3 How It Differs from Semestral Report

| Aspect | Personal Consistency Index | Semestral Report |
|--------|----------------------------|------------------|
| **Metric Focus** | Weighted stability score (70% attendance + 30% punctuality) | Raw attendance data (entries, lates, absents) |
| **Output Type** | Single 0-100 consistency score | Tabular rows with per-student summary |
| **Scope** | Can be subject-specific or all subjects | Can be subject-specific or all subjects |
| **Date Range** | Flexible (daily, weekly, monthly, semester) | Typically full semester |
| **Visual Display** | Single metric card with confidence level | List of students with status/score |
| **Analysis Type** | Behavioral stability insight | Factual attendance accounting |
| **Includes Absents** | Yes (synthetic ABSENT rows) | Yes (explicitly filtered) |
| **Trend Direction** | Compared with previous window | Not compared |

---

## 5. SUBJECT-COMPARATIVE ANALYSIS CODE

### 5.1 Main Comparative Logic

**Client-Side Subject Grouping**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L434-L504)

```javascript
// Step 1: Group logs by subject
const perSubject = {};
scoped.forEach((log) => {
    const key = log.subject_code ? `${log.subject_code} - ${log.mapped_subject}` : (log.mapped_subject || 'Unscheduled');
    if (!perSubject[key]) perSubject[key] = { total: 0, attended: 0, late: 0, absent: 0 };
});

// Step 2: Count attendance per subject
perSubject[key].total += 1;
if (action === 'ENTRY') {
    perSubject[key].attended += 1;
    if (log.is_late) perSubject[key].late += 1;
}

// Step 3: Calculate score
score = (attended / total) * 100

// Step 4: Find best and weakest
rows.sort((a, b) => b.score - a.score);
best = rows[0];
weakest = rows[rows.length - 1];
```

### 5.2 Subject Activity Breakdown

**Separate Visualization**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L350-360)

```javascript
const groupedSubjectActivity = useMemo(() => {
    const summary = {};
    
    rawLogs.forEach((log) => {
        const subjectKey = log.mapped_subject || 'Unscheduled';
        if (!summary[subjectKey]) {
            summary[subjectKey] = {
                ENTERED: 0, LATE: 0, ABSENT: 0, BREAK_OUT: 0, BREAK_IN: 0, EXITED: 0,
            };
        }
        // Count per subject
    });
    
    return Object.entries(summary).map(([subject, counts]) => ({ subject, ...counts }));
}, [rawLogs]);
```

---

## 6. FILTER/SCOPE LOGIC - THE DISCREPANCY

### 6.1 The Issue: "All Enrolled Subjects" vs Subject-Specific Filters

**Problem**: Metrics and insights differ when filtering to a specific subject vs "All Enrolled Subjects"

### 6.2 Frontend Filter Application

**File**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L310-320)

```javascript
const getReportScopedLogs = (logs) => {
    let scoped = [...logs];

    // CRITICAL: subject filter NOT applied to WEEKLY_SUMMARY
    if (selectedReportType !== 'WEEKLY_SUMMARY' && selectedSubject !== 'ALL') {
        const selectedClassIds = subjectClassMap[selectedSubject] || [];
        scoped = scoped.filter((log) => (
            selectedClassIds.map(Number).includes(Number(log.class_id)) 
            || log.mapped_subject === selectedSubject
        ));
    }
    // BREAK_LOG, LATE_REPORT, ABSENT_LOG filters...
    return scoped;
};
```

**⚠️ KEY ISSUE**: `getReportScopedLogs()` filters **AFTER** the server returns data.

### 6.3 Backend Class-ID Filtering

**File**: [report_service.py](backend/services/report_service.py#L3200-3220)

```python
if normalized_class_ids:
    base_query = base_query.filter(AttendanceLog.class_id.in_(normalized_class_ids))
elif class_id:
    base_query = base_query.filter(AttendanceLog.class_id == class_id)
# else: fetch ALL enrolled classes
```

**Backend sends**:
- `class_ids` parameter (multiple subjects): filters in database
- `class_id` parameter (single subject): filters in database
- No parameters (all subjects): **NO** class filter, returns all

### 6.4 Scope Label Determination

**File**: [report_service.py](backend/services/report_service.py#L3154-3166)

```python
# Determine scope label for contextual metrics/insights
if normalized_class_ids and len(normalized_class_ids) > 1:
    scope_label = "All Enrolled Subjects"
elif normalized_class_ids and len(normalized_class_ids) == 1:
    # Get subject code
    subj = db.query(Class, Subject).filter(Class.id == normalized_class_ids[0]).first()
    scope_label = subj[1].code if subj else f"Class {normalized_class_ids[0]}"
elif class_id:
    subj = db.query(Class, Subject).filter(Class.id == class_id).first()
    scope_label = subj[1].code
else:
    scope_label = "All Enrolled Subjects"

is_all_subject_scope = (not class_id) or (normalized_class_ids and len(normalized_class_ids) > 1)
```

### 6.5 How Backend Metrics Change with Filters

**Metric Calculation**: [report_metric_service.py](backend/services/report_metric_service.py#L305-500)

```python
def compute_student_core_metrics(
    db: Session,
    user_id: int,
    date_from: datetime,
    date_to: datetime,
    class_id: Optional[int] = None,
    scoped_class_ids: Optional[List[int]] = None,  # FILTERED list
    classes: Optional[List[Class]] = None,
):
    # KEY: All queries filter by scoped_class_ids
    if scoped_class_ids:
        # Query only logs for these classes
        logs = db.query(AttendanceLog).filter(
            AttendanceLog.user_id == user_id,
            AttendanceLog.class_id.in_(scoped_class_ids),  # ← FILTER APPLIED
        )
```

**Example**: 
- **All Subjects**: scoped_class_ids = [1, 2, 3, 4, 5] → metrics computed across all 5 classes
- **CPE101 Only**: scoped_class_ids = [1] → metrics computed only for class 1
  - Attendance rate might be 95% (class 1), but 75% overall

### 6.6 Insight Generation with Scope

**File**: [role_based_analytics_service.py](backend/services/role_based_analytics_service.py#L55-100)

```python
def generate_student_role_insights(
    metrics: Dict[str, float],  # Computed for scoped_class_ids
    report_code: Optional[str] = None,
    previous_window_metrics: Optional[Dict[str, float]] = None,
    scope_label: str = None,  # e.g., "CPE101" or "All Enrolled Subjects"
) -> List[Dict]:
    insights: List[Dict] = []
    scope_phrase = f"[{scope_label}] " if scope_label else ""
    
    # All insights include scope_label in title and narrative
    insights.append(_make_insight(
        "STUDENT_ATTENDANCE_RELIABILITY",
        f"Attendance Reliability Profile ({scope_label})" if scope_label else "...",
        f"{scope_phrase}Attendance reliability is {reliability_band}...",
```

### 6.7 Filter Discrepancy Summary

| Parameter | What It Does | Impact on Metrics | Impact on Insights |
|-----------|--------------|-------------------|-------------------|
| **No filter (ALL)** | Returns all enrolled classes | Metrics = overall average | Insights = system-wide assessment |
| **class_id=1** | Single class filter at DB level | Metrics = for class 1 only | Insights labeled "[ClassName]" |
| **class_ids=1,2,3** | Multiple class filter at DB level | Metrics = aggregate of 3 classes | Insights labeled "[ClassName]" (first) or "All Enrolled Subjects" |

---

## 7. FILTER LOGIC CODE LOCATIONS

### 7.1 Subject Filter Map (Frontend)

**File**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L85-110)

```javascript
useEffect(() => {
    // Build subject → class_id map from schedule
    const subjectToClass = {};
    processedSchedule.forEach(item => {
        if (item.subject_title && item.class_id) {
            if (!subjectToClass[item.subject_title]) {
                subjectToClass[item.subject_title] = [];
            }
            if (!subjectToClass[item.subject_title].includes(item.class_id)) {
                subjectToClass[item.subject_title].push(item.class_id);
            }
        }
    });
    setSubjectClassMap(subjectToClass);  // Used when filtering
}, [schedule]);
```

### 7.2 API Call with Filters

**File**: [AttendanceHistoryPage.jsx](AttendanceHistoryPage.jsx#L526-560)

```javascript
const res = await api.get(`/api/student/reports/data/${userId}`, {
    signal: controller.signal,
    params: {
        report_type: selectedReportType,
        date_from: dateFrom,
        date_to: dateTo,
        class_id:
            selectedReportType === 'WEEKLY_SUMMARY'
                ? undefined
                : (selectedSubject !== 'ALL' && scopedClassIds.length === 1 
                    ? scopedClassIds[0] 
                    : undefined),
        class_ids:
            selectedReportType === 'WEEKLY_SUMMARY'
                ? undefined
                : (selectedSubject !== 'ALL' && scopedClassIds.length > 1 
                    ? scopedClassIds.join(',') 
                    : undefined),
        limit: 250,
    },
});
```

**Key Observation**: `class_id` and `class_ids` **NOT sent** when:
- `selectedSubject === 'ALL'`
- `selectedReportType === 'WEEKLY_SUMMARY'` (always no class filter)

### 7.3 Backend Route Handler

**File**: [student.py](backend/api/routers/student.py#L614-670)

```python
@router.get("/reports/data/{user_id}")
def get_student_report_data(
    user_id: int,
    report_type: str,
    class_id: Optional[int] = None,
    class_ids: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Parse class_ids comma-separated string
    parsed_class_ids = None
    if class_ids:
        parsed_class_ids = [int(token.strip()) for token in class_ids.split(',') if token.strip()]
    
    # Call service with filters
    envelope = get_student_report_envelope(
        db=db,
        user_id=user_id,
        report_type=report_type,
        date_from=window_from,
        date_to=window_to,
        class_id=class_id,
        class_ids=parsed_class_ids,
        skip=max(skip, 0),
        limit=min(limit, 100),
    )
```

---

## 8. KEY FILES REFERENCE

| Component | File | Key Functions/Lines |
|-----------|------|-------------------|
| **Frontend Report** | [AttendanceHistoryPage.jsx](frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx) | Lines 434-504 (comparativeInsight), 526-560 (API call), 310-320 (getReportScopedLogs) |
| **Backend Report Envelope** | [report_service.py](backend/services/report_service.py) | Lines 3143-3330 (get_student_report_envelope) |
| **Backend Metrics** | [report_metric_service.py](backend/services/report_metric_service.py) | Lines 305-500 (compute_student_core_metrics) |
| **Backend Insights** | [role_based_analytics_service.py](backend/services/role_based_analytics_service.py) | Lines 55-200 (generate_student_role_insights) |
| **API Route** | [student.py](backend/api/routers/student.py) | Lines 614-670 (get_student_report_data) |
| **Legacy Insights** | [report_insight_service.py](backend/services/report_insight_service.py) | Lines 1-150 (generate_student_insights) - DEPRECATED |

---

## 9. INSIGHT CODE EXAMPLES

### Backend Insight: Attendance Reliability

**File**: [role_based_analytics_service.py](backend/services/role_based_analytics_service.py#L75-95)

```python
reliability_band = "strong" if attendance_rate >= 95 else ("moderate" if attendance_rate >= 85 else "weak")
missed_pct = max(0.0, 100.0 - attendance_rate)
insights.append(_make_insight(
    "STUDENT_ATTENDANCE_RELIABILITY",
    f"Attendance Reliability Profile ({scope_label})" if scope_label else "Attendance Reliability Profile",
    (
        f"{scope_phrase}Attendance reliability is {reliability_band} in this window. "
        f"At current behavior, {_to_behavior_ratio(missed_pct)} are being missed, which indicates "
        f"{'stable engagement' if attendance_rate >= 90 else 'visible continuity risk'} over scheduled participation."
    ),
    {
        "real_time_attendance_rate": attendance_rate,
        "sessions_attended": metrics.get("sessions_attended", 0),
        "sessions_conducted": metrics.get("sessions_conducted", 0),
    },
    f"This reflects whether the student can sustain regular participation without intervention. Scope: {scope_label or 'All Subjects'}.",
    confidence,
    confidence_msg,
))
```

### Confidence Calculation

**File**: [role_based_analytics_service.py](backend/services/role_based_analytics_service.py#L70-72)

```python
confidence = "HIGH" if session_count >= 20 and completeness >= 95 \
             else ("MEDIUM" if session_count >= 8 and completeness >= 85 \
             else "LOW")
```

**Thresholds**:
- **HIGH**: 20+ sessions AND 95%+ data completeness
- **MEDIUM**: 8+ sessions AND 85%+ data completeness
- **LOW**: < 8 sessions OR < 85% completeness

---

## 10. SUMMARY: EXPECTED INSIGHTS HIERARCHY

When viewing a report, insights appear in this order:

1. **Subject Comparison** (2+ subjects) - Frontend-generated, prepended first
2. **Attendance Reliability** - Backend-generated
3. **Punctuality Habit Pattern** - Backend-generated
4. **Consistency and Behavioral Stability** - Backend-generated
5. **Session Completion Behavior** - Backend-generated
6. **Break Discipline Signal** - Backend-generated
7. **Previous-Window Trend Direction** (if applicable) - Backend-generated, only for WEEKLY/MONTHLY/SEM/CONSISTENCY

---

## 11. FILTER SCOPE IMPACT TABLE

### How "All Enrolled Subjects" vs "Subject-Specific" Affects Each Insight

| Insight | "All Enrolled Subjects" | "CPE101 Only" | Difference |
|---------|------------------------|---------------|-----------|
| **Subject Comparison** | Shows all subjects | May only show CPE101 if < 2 subjects in scoped logs | N/A (hidden if < 2) |
| **Attendance Reliability** | Overall across all classes | For CPE101 only | Can vary significantly |
| **Punctuality** | Aggregate late_frequency | CPE101-specific late frequency | May differ by subject |
| **Consistency Index** | Weighted avg of all classes | Weighted avg of CPE101 | Often different |
| **Scope Label in Title** | "All Enrolled Subjects" | "CPE101" (subject code) | Affects narrative |

---

## APPENDIX: Future Enhancement Opportunities

1. **True AI Insights**: Integrate Claude API to generate insights from metrics
2. **Trend Visualization**: Add charts for consistency index over time
3. **Subject Recommendation**: AI-powered subject recommendations based on comparative analysis
4. **Intervention Alerts**: Automated alerts when consistency drops below threshold
5. **Predictive Analytics**: Forecast attendance based on historical patterns
