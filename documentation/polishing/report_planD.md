Below is a **dashboard blueprint `.md` file** that visually explains **what appears on each screen for Student, Faculty, and Department Head**.

This is extremely useful for **capstone defense** because panelists often ask:

* *“What exactly does the dashboard show?”*
* *“How does the user interpret the analytics?”*
* *“Where do the reports appear in the interface?”*

This file answers those questions.

You can save it as:

```text
frames_analytics_dashboard_blueprint.md
```

---

# FRAMES Smart Attendance System

# Analytics Dashboard Blueprint

## 1. Overview

The FRAMES Smart Attendance System provides role-based dashboards that transform attendance data into actionable insights. Each user type views a dashboard tailored to their responsibilities:

* **Student Dashboard** – personal attendance awareness and behavioral reflection
* **Faculty Dashboard** – class monitoring and student participation evaluation
* **Department Head Dashboard** – departmental oversight and operational analytics

The dashboards combine:

* real-time attendance metrics
* trend visualizations
* automated insights
* predictive indicators

---

# 2. Student Dashboard

## Purpose

The student dashboard helps students monitor their attendance behavior and understand patterns that may affect academic standing.

The dashboard promotes **self-awareness, accountability, and engagement**.

---

## Dashboard Layout

### Top Section – Personal Attendance Overview

Displays summary metrics.

Widgets:

* **Attendance Rate**
* **Punctuality Rate**
* **Consistency Index**
* **Projected Final Attendance**

Example display:

```
Attendance Rate: 92%
Punctuality Rate: 88%
Consistency Index: 90 (Highly Consistent)
Projected Semester Attendance: 94%
```

Insight panel example:

> "Your attendance improved by 8% compared to last month."

---

### Weekly Attendance Trend Chart

Chart type: **Line Chart**

Shows attendance percentage across recent weeks.

Example interpretation:

* upward trend = improving behavior
* downward trend = potential disengagement

Example AI insight:

> "Attendance dropped during midterm week."

---

### Subject Attendance Distribution

Chart type: **Bar Chart**

Displays attendance rate per subject.

Example:

```
Database Systems – 96%
Networking – 90%
Operating Systems – 87%
Software Engineering – 93%
```

Insight:

> "Your lowest attendance occurs in Operating Systems."

---

### Recent Attendance Log

Shows **last 30 days of attendance activity**.

Columns:

* Date
* Subject
* Status
* Time In
* Late Minutes
* Break Duration

Purpose:

Helps students review detailed attendance history.

---

### Break Behavior Panel

Chart type: **Histogram**

Displays break duration patterns.

Insight example:

> "Average break duration increased by 3 minutes this week."

---

### AI Insight Panel

Displays automatically generated behavioral insights.

Examples:

```
You frequently arrive late on Wednesday classes.
Your attendance consistency score is classified as Highly Stable.
Your attendance trend suggests low absence risk.
```

---

# 3. Faculty Dashboard

## Purpose

The faculty dashboard supports instructors in monitoring class attendance, identifying disengaged students, and maintaining classroom discipline.

---

## Dashboard Layout

### Class Attendance Summary

Displays current class metrics.

Widgets:

* Average class attendance rate
* Total students present today
* Late arrivals today
* Early exits today

Example:

```
Attendance Rate: 89%
Students Present: 34 / 40
Late Arrivals: 5
Early Exits: 2
```

---

### Daily Attendance Table

Table showing student attendance for today's class.

Columns:

* Student Name
* Time In
* Late Minutes
* Break Duration
* Exit Time
* Status

Purpose:

Allows instructors to immediately identify attendance irregularities.

---

### Monthly Class Attendance Trend

Chart type: **Line Chart**

Displays class attendance percentage over the month.

Insight example:

> "Attendance declined after midterm examinations."

---

### Student Punctuality Ranking

Chart type: **Leaderboard**

Ranks students based on punctuality index.

Example:

```
1. Maria Santos – 98%
2. John Cruz – 96%
3. Daniel Reyes – 95%
```

Purpose:

Encourages punctual behavior.

---

### Absence Monitoring Panel

Displays students with highest absence frequency.

Example:

```
Student: A. Ramirez
Absences: 4
Risk Level: Medium
```

Insight:

> "Three students have exceeded the recommended absence threshold."

---

### Break Behavior Analysis

Chart type: **Bar Chart**

Displays break duration per student.

Purpose:

Detect excessive break usage.

Example insight:

> "Two students exceeded the maximum break duration three times this week."

---

### Early Exit Alerts

Displays students leaving before class end.

Example:

```
Student: J. Lim
Exit Time: 10:32 AM
Class End Time: 11:00 AM
```

Insight:

> "Early exits occurred in 15% of sessions this month."

---

### Unrecognized Individual Detection

Displays unidentified individuals detected by the system.

Columns:

* Timestamp
* Location
* Snapshot reference

Purpose:

Enhances classroom security.

---

# 4. Department Head Dashboard

## Purpose

The department head dashboard provides strategic analytics across courses, faculty members, and classrooms.

It supports **academic planning, monitoring, and policy decisions**.

---

## Dashboard Layout

### Department Attendance Overview

Widgets:

* Average department attendance
* Faculty punctuality rate
* Total active classes today
* Total students present today

Example:

```
Department Attendance Rate: 91%
Faculty Punctuality Rate: 93%
Active Classes Today: 24
Total Students Present: 812
```

---

### Faculty Performance Dashboard

Chart type: **Bar Chart**

Displays instructor punctuality rates.

Example:

```
Prof. Garcia – 97%
Prof. Ramos – 94%
Prof. Cruz – 88%
```

Insight:

> "Faculty punctuality improved by 4% compared to last semester."

---

### Room Utilization Chart

Chart type: **Heatmap**

Displays classroom usage throughout the day.

Purpose:

Identify underutilized rooms.

Insight example:

> "Rooms 301 and 302 remain unused during afternoon sessions."

---

### Peak Attendance Hours

Chart type: **Time-based line chart**

Displays busiest times across the department.

Example insight:

> "Highest attendance occurs between 9:00 AM and 11:00 AM."

---

### Overcrowding Alerts

Displays rooms exceeding capacity.

Example:

```
Room 204
Capacity: 40
Detected Occupants: 52
```

Purpose:

Ensure safety compliance.

---

### Cross-Course Attendance Comparison

Chart type: **Bar chart**

Compares attendance rates across subjects.

Insight:

> "First-year courses show higher attendance than third-year courses."

---

### Department Activity Summary

Displays high-level analytics.

Examples:

```
Most punctual faculty member: Prof. Santos
Highest attendance course: Database Systems
Most frequent absence day: Friday
```

---

# 5. Predictive Analytics Panels

Predictive analytics appear across all dashboards.

Examples:

### Absence Risk Prediction

```
Student Risk Level: Medium
Reason: declining attendance trend
Recommended Action: faculty intervention
```

---

### Attendance Projection

```
Current Attendance Rate: 90%
Projected Final Attendance: 93%
```

---

### Behavioral Pattern Detection

Examples:

```
Student frequently absent on Monday classes.
Break duration increased during afternoon sessions.
Late arrivals occur mostly during 8 AM classes.
```

---

# 6. Smart Alert System

Automated alerts help users react to important events.

Examples:

### Student Alerts

```
Attendance dropped below 80%.
Three consecutive late arrivals detected.
```

---

### Faculty Alerts

```
Five students absent in today's class.
Break abuse detected for two students.
```

---

### Department Alerts

```
Room occupancy exceeded capacity.
Faculty punctuality decreased by 5% this month.
```

---

# 7. Benefits of the Dashboard Architecture

The FRAMES dashboard architecture enables:

* real-time attendance awareness
* early detection of behavioral problems
* improved classroom discipline
* faculty performance monitoring
* department-level strategic planning

Through integrated analytics dashboards, the system transforms raw attendance logs into **clear visual insights that support data-driven academic management**.

