# FRAMES Insights Generation Implementation Guide

**Purpose**: Generate deep, subject-comparative, actionable insights for weekly, monthly, and semestral reports.

**Target Files**: 
- `backend/services/role_based_analytics_service.py`  
- `frontend/src/components/StudentDashboard/AttendanceHistoryPage.jsx`
- Report metric service functions

---

## WEEK LY INSIGHTS (5 Levels)

### Level 1: Subject Comparison (Already Exists - Keep Intact)

```python
# Existing pattern to maintain
comparative_insight = {
    "title": "Subject Comparison",
    "description": "IT3 outperforms (100% vs 80% avg)",
    "subjects_involved": ["IT3", "IT4", "IT45"],
    "confidence": "HIGH"  # if session_count >= 20
}
```

### Level 2: Time-of-Day Pattern (NEW)

```python
def generate_time_of_day_insight(weekly_logs, classes_metadata):
    """
    Analyze attendance by time of day (morning vs afternoon)
    """
    morning_classes = []  # start_time < 12:00
    afternoon_classes = []  # start_time >= 12:00
    
    for time_period, classes in [("morning", morning_classes), ("afternoon", afternoon_classes)]:
        attendance_rate = calculate_attendance_for_classes(weekly_logs, classes)
        break_frequency = count_breaks_in_classes(weekly_logs, classes)
    
    if attendance_rate_morning > attendance_rate_afternoon:
        return {
            "type": "TIME_OF_DAY_PATTERN",
            "title": "Morning vs. Afternoon Performance",
            "insight": f"Morning classes: {attendance_rate_morning}% | Afternoon: {attendance_rate_afternoon}%",
            "finding": "Student performs better in morning sessions. Consider scheduling preferences.",
            "subjects_involved": [],  # List morning vs afternoon classes
            "confidence": "MEDIUM" if num_sessions >= 5 else "LOW"
        }
    
    return None  # Pattern not significant
```

### Level 3: Day-of-Week Correlation (NEW)

```python
def generate_day_of_week_insight(weekly_logs, classes_metadata):
    """
    Analyze attendance by day of week (Mon/Tue/Wed/Thu/Fri patterns)
    """
    attendance_by_day = {
        'Monday': {'attended': 0, 'expected': 0, 'late': 0},
        'Tuesday': {'attended': 0, 'expected': 0, 'late': 0},
        'Wednesday': {'attended': 0, 'expected': 0, 'late': 0},
        'Thursday': {'attended': 0, 'expected': 0, 'late': 0},
        'Friday': {'attended': 0, 'expected': 0, 'late': 0},
    }
    
    # Populate from weekly_logs
    for log in weekly_logs:
        day = log.timestamp.strftime('%A')
        attendance_by_day[day]['attended'] += 1 if log.action == 'ENTRY' else 0
        attendance_by_day[day]['expected'] += 1
        attendance_by_day[day]['late'] += 1 if log.is_late else 0
    
    # Find strongest and weakest days
    best_day = max(attendance_by_day, key=lambda d: attendance_by_day[d]['attended'] / max(1, attendance_by_day[d]['expected']))
    worst_day = min(attendance_by_day, key=lambda d: attendance_by_day[d]['attended'] / max(1, attendance_by_day[d]['expected']))
    
    if attendance_by_day[best_day]['expected'] > 0 and attendance_by_day[worst_day]['expected'] > 0:
        best_rate = attendance_by_day[best_day]['attended'] / attendance_by_day[best_day]['expected']
        worst_rate = attendance_by_day[worst_day]['attended'] / attendance_by_day[worst_day]['expected']
        
        if abs(best_rate - worst_rate) > 0.2:  # 20%+ difference significant
            return {
                "type": "DAY_OF_WEEK_CORRELATION",
                "title": "Day-of-Week Attendance Pattern",
                "insight": f"{best_day}: {best_rate*100:.0f}% vs {worst_day}: {worst_rate*100:.0f}%",
                "finding": f"Strongest on {best_day}; weakest on {worst_day}. " + 
                          (f"Possible {worst_day} schedule conflict or fatigue?" if worst_day in ['Monday', 'Friday'] else ""),
                "best_day": best_day,
                "worst_day": worst_day,
                "subjects_on_best_day": get_subjects_for_day(classes_metadata, best_day),
                "subjects_on_worst_day": get_subjects_for_day(classes_metadata, worst_day),
                "confidence": "HIGH" if sum(d['expected'] for d in attendance_by_day.values()) >= 4 else "MEDIUM"
            }
    
    return None
```

### Level 4: Micro-Trend Detection (NEW)

```python
def generate_micro_trend_insight(weekly_logs):
    """
    Detect if lateness, breaks, or absences are increasing/decreasing within the week
    """
    daily_summary = {}  # date -> {late_count, break_count, attended}
    
    for i, log in enumerate(sorted(weekly_logs, key=lambda l: l.timestamp)):
        date = log.timestamp.date()
        if date not in daily_summary:
            daily_summary[date] = {'late': 0, 'breaks': 0, 'attended': 0}
        
        if log.action == 'ENTRY' and log.is_late:
            daily_summary[date]['late'] += 1
        if log.action in ('BREAK_OUT', 'BREAK_IN'):
            daily_summary[date]['breaks'] += 1
        if log.action == 'ENTRY':
            daily_summary[date]['attended'] += 1
    
    # Check for trend
    early_week = list(daily_summary.values())[:3]
    late_week = list(daily_summary.values())[3:] if len(daily_summary) > 3 else []
    
    if early_week and late_week:
        early_late_avg = sum(d['late'] for d in early_week) / len(early_week)
        late_late_avg = sum(d['late'] for d in late_week) / len(late_week)
        
        if late_late_avg > early_late_avg * 1.5:  # 50% increase
            return {
                "type": "MICRO_TREND_DETECTION",
                "title": "Late Arrivals Increasing",
                "insight": f"Early week: {early_late_avg:.1f} lates/day → Late week: {late_late_avg:.1f}",
                "finding": "Lateness increasing as week progresses. Possible fatigue or schedule compression?",
                "trend": "INCREASING",
                "metric": "LATENESS",
                "confidence": "MEDIUM" if len(late_week) >= 2 else "LOW"
            }
    
    return None
```

### Level 5: Actionable Recommendation (NEW)

```python
def generate_actionable_recommendation(weekly_logs, subject_performance, class_metadata):
    """
    Synthesize data to provide specific, actionable recommendation
    """
    # Find best-performing subject
    best_subject = max(subject_performance, key=lambda s: subject_performance[s]['attendance_rate'])
    worst_subject = min(subject_performance, key=lambda s: subject_performance[s]['attendance_rate'])
    
    # Check if they share any schedule characteristics
    best_classes = get_classes_for_subject(class_metadata, best_subject)
    worst_classes = get_classes_for_subject(class_metadata, worst_subject)
    
    best_days = set(c.day_of_week for c in best_classes)
    worst_days = set(c.day_of_week for c in worst_classes)
    
    insights = []
    
    # Recommendation 1: Schedule conflict
    if best_days == worst_days and len(best_days) == 1:
        day = list(best_days)[0]
        inspiration = f"Perfect attendance in {best_subject} on {day}s! Apply same discipline to {worst_subject} on the same day."
        insights.append({
            "type": "SCHEDULE_CONFLICT",
            "title": "Schedule Alignment Opportunity",
            "insight": inspiration,
            "action": f"Investigate potential conflict in {worst_subject}. Both on {day}?",
            "confidence": "HIGH"
        })
    
    # Recommendation 2: Mimic success pattern
    if subject_performance[best_subject]['on_time_rate'] > 90:
        insights.append({
            "type": "SUCCESS_PATTERN",
            "title": "Learn from Success",
            "insight": f"Near-perfect punctuality in {best_subject}! What's different?",
            "action": f"Apply {best_subject}'s time management to other subjects",
            "confidence": "HIGH"
        })
    
    # Recommendation 3: Early warning
    if len(subject_performance[worst_subject]['absences']) > 0:
        insights.append({
            "type": "EARLY_WARNING",
            "title": "Absence Alert",
            "insight": f"Already 1 absence in {worst_subject} this week",
            "action": "Prioritize attendance going forward",
            "confidence": "HIGH" if len(weekly_logs) >= 4 else "MEDIUM"
        })
    
    # Return highest-confidence insight
    if insights:
        return max(insights, key=lambda i: i['confidence'])
    
    return None
```

---

## MONTHLY INSIGHTS (5 Levels)

### Level 1: Subject Ranking (NEW)

```python
def generate_monthly_subject_ranking(monthly_logs, classes_metadata):
    """
    Rank subjects by attendance rate
    """
    subject_metrics = {}  # subject_code -> {attended, expected, on_time, late, absences}
    
    for log in monthly_logs:
        subject_code = log.class_.subject.code
        if subject_code not in subject_metrics:
            subject_metrics[subject_code] = {
                'attended': 0, 'expected': 0, 'on_time': 0, 'late': 0, 'absences': 0
            }
        
        # Aggregate metrics
        if log.action == 'ENTRY':
            subject_metrics[subject_code]['attended'] += 1
            if log.is_late:
                subject_metrics[subject_code]['late'] += 1
            else:
                subject_metrics[subject_code]['on_time'] += 1
    
    # Calculate expected sessions per subject
    for subject_code in subject_metrics:
        expected = count_expected_sessions_for_month(classes_metadata, subject_code)
        subject_metrics[subject_code]['expected'] = expected
        subject_metrics[subject_code]['rate'] = subject_metrics[subject_code]['attended'] / expected
    
    # Sort and create ranking
    ranked = sorted(subject_metrics.items(), key=lambda x: x[1]['rate'], reverse=True)
    
    return {
        "type": "SUBJECT_RANKING",
        "title": "Monthly Subject Scorecard",
        "ranking": [
            {
                "rank": i+1,
                "subject": subject,
                "rating": "⭐" * (5 - i) if i < 3 else "⚠",  # Grade visualization
                "attendance_rate": metrics['rate'],
                "attended": metrics['attended'],
                "expected": metrics['expected'],
                "punctuality": metrics['on_time'] / metrics['attended'] if metrics['attended'] > 0 else 0
            }
            for i, (subject, metrics) in enumerate(ranked)
        ],
        "confidence": "HIGH" if len(monthly_logs) >= 20 else "MEDIUM"
    }
```

### Level 2: Trend Direction (NEW)

```python
def generate_monthly_trend_direction(week1_logs, week2_logs, week3_logs, week4_logs):
    """
    Detect if attendance is improving or declining month-by-week
    """
    weeks = [
        ('Week 1', week1_logs),
        ('Week 2', week2_logs),
        ('Week 3', week3_logs),
        ('Week 4', week4_logs),
    ]
    
    rates = []
    for week_name, logs in weeks:
        if logs:
            attended = sum(1 for l in logs if l.action == 'ENTRY')
            expected = len(set((l.class_id, l.timestamp.date()) for l in logs))
            rate = attended / expected if expected > 0 else 0
            rates.append((week_name, rate))
    
    if len(rates) >= 2:
        trend = "IMPROVING" if rates[-1][1] > rates[0][1] else \
                "DECLINING" if rates[-1][1] < rates[0][1] else \
                "STABLE"
        
        return {
            "type": "TREND_DIRECTION",
            "title": "Month Attendance Trend",
            "trend": trend,
            "direction": "📈" if trend == "IMPROVING" else "📉" if trend == "DECLINING" else "→",
            "weekly_breakdown": rates,
            "insight": f"Attendance {trend.lower()} throughout month. " + 
                      ("🎉 Building momentum" if trend == "IMPROVING" else 
                       "⚠️ Watch for decline" if trend == "DECLINING" else
                       "Maintaining consistency"),
            "confidence": "HIGH" if len(rates) >= 3 else "MEDIUM"
        }
    
    return None
```

### Level 3: Break Duration Insights (NEW)

```python
def generate_break_duration_insights(monthly_logs):
    """
    Analyze break patterns: frequency, duration, by subject
    """
    break_data = {
        'total_breaks': 0,
        'total_break_duration_min': 0,
        'by_subject': {},
        'longest_break': {'duration': 0, 'subject': '', 'date': None},
        'break_frequency': 0  # breaks per 10 sessions
    }
    
    entry_logs = [l for l in monthly_logs if l.action == 'ENTRY']
    total_sessions = len(entry_logs)
    
    for log in monthly_logs:
        if log.action == 'BREAK_OUT':
            break_data['total_breaks'] += 1
            subject = log.class_.subject.code
            if subject not in break_data['by_subject']:
                break_data['by_subject'][subject] = {'count': 0, 'duration': 0}
            break_data['by_subject'][subject]['count'] += 1
    
    # Estimate duration (simplified: assume BREAK_OUT followed by BREAK_IN ~15min apart)
    break_data['break_frequency'] = (break_data['total_breaks'] / max(1, total_sessions)) * 10
    
    insight = None
    if total_sessions >= 8:  # Need enough data
        if break_data['break_frequency'] > 3:  # More than 3 breaks per 10 sessions
            insight = {
                "type": "BREAK_FREQUENCY",
                "title": "Break Taking Pattern",
                "finding": f"Taking breaks frequently ({break_data['break_frequency']:.1f} per 10 sessions)",
                "interpretation": "Regular breaks suggest either: (1) longer class sessions, (2) high cognitive load, or (3) restlessness",
                "by_subject": break_data['by_subject'],
                "recommendation": "Check if CS courses (IT45, CC3) have higher break rates than others",
                "confidence": "MEDIUM" if total_sessions >= 15 else "LOW"
            }
    
    return insight
```

### Level 4: Lateness Root Cause (NEW)

```python
def generate_lateness_root_cause_insight(monthly_logs, classes_metadata):
    """
    Detect if lateness correlates with specific subjects or days
    """
    late_logs = [l for l in monthly_logs if l.action == 'ENTRY' and l.is_late]
    
    if not late_logs:
        return None
    
    lateness_by_subject = {}
    lateness_by_day = {}
    
    for log in late_logs:
        subject = log.class_.subject.code
        day = log.class_.day_of_week
        
        lateness_by_subject[subject] = lateness_by_subject.get(subject, 0) + 1
        lateness_by_day[day] = lateness_by_day.get(day, 0) + 1
    
    # Check for concentration
    total_lates = len(late_logs)
    
    # Find if lateness is concentrated in 1-2 subjects (e.g., 80%+ of lates)
    top_subjects = sorted(lateness_by_subject.items(), key=lambda x: x[1], reverse=True)[:2]
    concentration_percentage = sum(count for _, count in top_subjects) / total_lates * 100
    
    if concentration_percentage > 70:  # 70%+ of lates in 1-2 subjects
        return {
            "type": "LATENESS_CONCENTRATION",
            "title": "Chronic Lateness in Specific Subjects",
            "concentrated_in": [s[0] for s in top_subjects],
            "concentration_percentage": concentration_percentage,
            "insight": f"80% of lates in 2 subjects: {', '.join([s[0] for s in top_subjects])}",
            "hypothesis": "Schedule conflict or transportation issue?",
            "schedule_analysis": {
                "shared_days": get_common_days([c for c in classes_metadata if c.subject.code == s[0] for s in top_subjects]),
                "time_gap": "⚠️ Check if these classes overlap with other commitments"
            },
            "recommendation": "Investigate schedule collision. Both subjects on same days? Same time slots?",
            "confidence": "HIGH" if total_lates >= 10 else "MEDIUM"
        }
    
    return None
```

### Level 5: Predictive Alert (NEW)

```python
def generate_predictive_alert(monthly_data, semester_baseline):
    """
    Project current trajectory to end of semester
    """
    current_attendance_rate = monthly_data['attendance_rate']
    baseline_attendance_rate = semester_baseline['target_rate']  # e.g., 80%
    
    # Simple linear extrapolation
    if current_attendance_rate < baseline_attendance_rate * 0.8:
        projected_semester_rate = current_attendance_rate  # Simplified
        
        return {
            "type": "PREDICTIVE_ALERT",
            "title": "Semester Performance Projection",
            "current_rate": current_attendance_rate,
            "baseline_rate": baseline_attendance_rate,
            "projected_semester_rate": projected_semester_rate,
            "alert_level": "🔴 CRITICAL" if projected_semester_rate < 60 else 
                          "🟡 WARNING" if projected_semester_rate < 75 else 
                          "🟢 ON_TRACK",
            "insight": f"At current pace: {projected_semester_rate:.0f}% semester attendance. " +
                      "Target: 80%+",
            "recommendation": "Immediate intervention needed. Meet with advisor to identify barriers.",
            "confidence": "MEDIUM" if monthly_data['sessions_used'] >= 20 else "LOW"
        }
    
    return None
```

---

## SEMESTRAL INSIGHTS (4 Levels + Special)

### Include All Levels 1-4 from MONTHLY, PLUS:

### Level 5: Behavioral Classification (NEW)

```python
def classify_student_behavior(semester_metrics):
    """
    Classify student into behavioral type based on attendance + punctuality
    """
    attendance_rate = semester_metrics['attendance_rate']
    punctuality_rate = semester_metrics['punctuality_rate']
    consistency = semester_metrics['consistency_index']
    
    # Classification matrix
    if attendance_rate > 85 and punctuality_rate > 85:
        behavior_type = "EXEMPLARY"
        description = "Excellent in all dimensions"
        emoji = "⭐⭐⭐⭐⭐"
    elif attendance_rate > 75 and punctuality_rate > 75:
        behavior_type = "RELIABLE"
        description = "Dependable and consistent"
        emoji = "⭐⭐⭐⭐"
    elif attendance_rate > 75 and punctuality_rate < 75:
        behavior_type = "DEDICATED_BUT_TARDY"
        description = "Shows up but often late"
        emoji = "⭐⭐⭐ 🔔"
    elif attendance_rate < 75 and punctuality_rate > 75:
        behavior_type = "SELECTIVE_BUT_PUNCTUAL"
        description = "Skips sessions but on-time when present"
        emoji = "⭐⭐ 🎯"
    else:
        behavior_type = "NEEDS_SUPPORT"
        description = "Struggling with attendance and punctuality"
        emoji = "⚠️ 🆘"
    
    return {
        "type": "BEHAVIORAL_CLASSIFICATION",
        "behavior_type": behavior_type,
        "description": description,
        "emoji": emoji,
        "strengths": list_strengths(semester_metrics),
        "weaknesses": list_weaknesses(semester_metrics),
        "improvement_focus": recommend_focus_area(semester_metrics),
        "confidence": "HIGH" if semester_metrics['total_sessions'] >= 100 else "MEDIUM"
    }
```

---

## IMPLEMENTATION CHECKLIST

### Backend (Python)

- [ ] Create function `generate_weekly_insights()` with all 5 levels
- [ ] Create function `generate_monthly_insights()` with all 5 levels  
- [ ] Create function `generate_semestral_insights()` with all 5 levels
- [ ] Create helper function `calculate_attendance_rate(logs, classes)`
- [ ] Create helper function `get_classes_for_subject(metadata, subject_code)`
- [ ] Create helper function `get_subjects_for_day(metadata, day_of_week)`
- [ ] Create helper function `count_expected_sessions_for_period(metadata, subject, start_date, end_date)`
- [ ] Update `role_based_analytics_service.py` to call new insight generators
- [ ] Add business logic to filter by confidence level (HIGH/MEDIUM/LOW)

### Frontend (React)

- [ ] Update `AttendanceHistoryPage.jsx` to display multi-level insights
- [ ] Add subject highlighting (bold/color) in insight text
- [ ] Add insight type icons (📊 for comparison, ⏰ for time patterns, 📈 for trends, etc.)
- [ ] Add "confidence" badge next to insights (HIGH/MEDIUM/LOW)
- [ ] Create modal/panel for each insight with deeper detail
- [ ] Add visual indicators (emojis, badges) for behavioral type

### Testing

- [ ] Unit test each insight generator with Charlie sample data
- [ ] Verify April 1-7 weekly insights match expected patterns
- [ ] Verify month-by-week trend calculation
- [ ] Verify subject ranking accuracy
- [ ] Verify lateness concentration detection
- [ ] Integration test: all insights appear in UI correctly

---

## SUCCESS CRITERIA

When complete, weekly/monthly/semestral insights should provide:

✅ **Deep analysis** beyond just percentages  
✅ **Subject-specific comparative** insights  
✅ **Actionable recommendations** (not just observations)  
✅ **Predictive information** (trends, alerts)  
✅ **Behavioral classification** (understand student patterns)  
✅ **High confidence levels** with adequate data  

Example:
```
BEFORE: "Attendance: 62.5%"

AFTER:  "⚠️ Dedicated but Tardy
         You show up (80.5% attendance) but struggle with punctuality (72.1%).
         
         Problem Area: IT45 and CC3 show chronic lateness (28% late rate).
         Both are Monday/Wednesday classes - possible schedule conflict?
         
         Action: Advisor review for schedule adjustment.
         
         Confidence: HIGH (84 sessions analyzed)"
```

---

**Document Status**: ✅ Ready for implementation  
**Estimated Development Time**: 8-12 hours (all features)  
**Priority**: HIGH (blocks user acceptance of reports)
