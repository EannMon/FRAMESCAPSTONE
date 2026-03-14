
# FRAMES Smart Attendance System

# Visual Reporting and Analytics Implementation Plan

## 1. Overview

The FRAMES Smart Attendance System records attendance events using facial recognition and gesture verification. These events are stored in the `attendance_logs` table and related relational tables such as `users`, `classes`, `devices`, `enrollments`, and `departments`.

Currently, the system produces reports primarily in **tabular and textual format**. While this is useful for documentation and exportable reports, large datasets are difficult to interpret without visual representation.

To improve usability and analytical value, this document proposes the implementation of a **Visual Reporting and Analytics Layer**.

The goal is to transform raw attendance logs into:

* Interactive charts
* Behavioral insights
* Attendance patterns
* Predictive indicators

This transforms the system from a **basic attendance tracker** into a **data-driven academic monitoring platform**.

---

# 2. Primary Data Source

Most analytics derive from the following table.

## attendance_logs

This table records every attendance interaction detected by the system.

Important fields include:

| Column           | Purpose                              |
| ---------------- | ------------------------------------ |
| user_id          | identifies the student or faculty    |
| class_id         | class associated with the attendance |
| device_id        | classroom device used                |
| action           | ENTRY, BREAK_OUT, BREAK_IN, EXIT     |
| verified_by      | FACE or FACE+GESTURE verification    |
| confidence_score | facial recognition accuracy          |
| timestamp        | exact event time                     |
| remarks          | optional notes                       |
| is_late          | indicates lateness                   |

Attendance flow example:

```
ENTRY
BREAK_OUT
BREAK_IN
EXIT
```

From these records we can compute:

* Attendance status
* Break duration
* Late arrivals
* Early exits
* participation consistency
* classroom occupancy

---

# 3. Analytics Architecture

The reporting system will have **three layers**.

## Layer 1 — Raw Reports

Traditional tabular reports exported to PDF.

Examples:

* Daily attendance table
* Absence list
* Late arrival list
* Break duration logs

These remain necessary for documentation.

---

## Layer 2 — Visual Reports

Graphical interpretation of the raw reports.

Examples:

* Pie charts
* Line graphs
* Heatmaps
* Bar charts
* histograms

These improve readability and trend detection.

---

## Layer 3 — Smart Insights

Derived metrics computed from attendance behavior.

Examples:

* Personal consistency score
* Punctuality index
* break abuse detection
* attendance risk prediction

These provide **decision-support analytics**.

---

# 4. Student Module Visual Reports

Students primarily need **self-monitoring insights**.

---

# 4.1 Attendance Distribution

## Purpose

Shows how often a student was present, late, or absent.

## SQL Query

```sql
SELECT
COUNT(*) FILTER (WHERE action='ENTRY' AND is_late=false) AS present,
COUNT(*) FILTER (WHERE action='ENTRY' AND is_late=true) AS late
FROM attendance_logs
WHERE user_id = $studentId;
```

Absences are calculated from scheduled classes minus entries.

## Visualization

Pie Chart.

## Python Implementation (Matplotlib)

```python
import matplotlib.pyplot as plt

labels = ['Present','Late','Absent']
values = [32,5,3]

plt.figure(figsize=(6,6))
plt.pie(values,labels=labels,autopct='%1.1f%%')
plt.title("Attendance Distribution")
plt.show()
```

## Insight

Students immediately see attendance health.

---

# 4.2 Weekly Attendance Trend

## Purpose

Shows improvement or decline across weeks.

## SQL

```sql
SELECT
DATE_TRUNC('week', timestamp) AS week,
COUNT(*) FILTER (WHERE action='ENTRY') AS attendance
FROM attendance_logs
WHERE user_id = $studentId
GROUP BY week
ORDER BY week;
```

## Visualization

Line Chart.

## Matplotlib Example

```python
weeks=['W1','W2','W3','W4']
attendance=[90,85,70,92]

plt.plot(weeks,attendance,marker='o')
plt.title("Weekly Attendance Trend")
plt.xlabel("Week")
plt.ylabel("Attendance %")
plt.show()
```

---

# 4.3 Lateness Pattern

## Purpose

Shows which weekday the student tends to arrive late.

## SQL

```sql
SELECT
EXTRACT(DOW FROM timestamp) AS weekday,
COUNT(*) AS late_count
FROM attendance_logs
WHERE user_id=$studentId
AND is_late=true
GROUP BY weekday
ORDER BY weekday;
```

## Visualization

Bar Chart.

---

# 4.4 Break Duration Behavior

Break duration is calculated using `BREAK_OUT` and `BREAK_IN`.

## SQL

```sql
SELECT
user_id,
timestamp AS break_out,
LEAD(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) AS break_in
FROM attendance_logs
WHERE action='BREAK_OUT';
```

Break duration:

```
break_in - break_out
```

## Visualization

Histogram showing:

* 0-5 minutes
* 5-10 minutes
* 10-15 minutes
* 15+ minutes

---

# 4.5 Personal Consistency Index

## Definition

Attendance reliability score.

Formula:

```
Consistency Score =
(Attendance Rate × 0.7)
+
(Punctuality Rate × 0.3)
```

Example:

```
Attendance Rate = 90%
Punctuality Rate = 80%

Score = 87
```

## Visualization

Gauge Chart.

Score interpretation:

| Score  | Meaning   |
| ------ | --------- |
| 90-100 | Excellent |
| 75-89  | Good      |
| 60-74  | At Risk   |
| <60    | Critical  |

---

# 5. Faculty Module Visual Reports

Faculty require **class-level behavioral insights**.

---

# 5.1 Class Attendance Trend

## SQL

```sql
SELECT
DATE(timestamp) AS session,
COUNT(*) FILTER (WHERE action='ENTRY') AS students_present
FROM attendance_logs
WHERE class_id=$classId
GROUP BY session
ORDER BY session;
```

## Visualization

Line Chart.

Shows how attendance changes per session.

---

# 5.2 Absence Heatmap

Displays absence frequency across days.

Example:

```
Mon Tue Wed Thu Fri
 3   5   2   1   0
```

## Python

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.heatmap(data)
plt.title("Class Absence Heatmap")
plt.show()
```

---

# 5.3 Student Punctuality Ranking

## SQL

```sql
SELECT
u.first_name,
u.last_name,
COUNT(*) FILTER (WHERE is_late=false) AS on_time_count
FROM attendance_logs a
JOIN users u ON a.user_id=u.id
WHERE class_id=$classId
GROUP BY u.id
ORDER BY on_time_count DESC;
```

## Visualization

Horizontal Bar Chart.

---

# 5.4 Early Exit Detection

Early exits are detected when `EXIT` occurs significantly before class end.

## SQL

```sql
SELECT
user_id,
timestamp
FROM attendance_logs
WHERE action='EXIT'
AND timestamp < (class_end_time - INTERVAL '10 minutes');
```

## Visualization

Stacked bar chart showing:

* stayed full class
* exited early

---

# 5.5 Break Abuse Detection

Calculate break duration.

Outliers represent abuse.

## Visualization

Box Plot.

Students outside normal range are flagged.

---

# 6. Department Head Reports

Department heads require **organizational analytics**.

---

# 6.1 Faculty Attendance Performance

## SQL

```sql
SELECT
u.first_name,
COUNT(*) FILTER (WHERE is_late=false) AS on_time_sessions
FROM attendance_logs a
JOIN classes c ON a.class_id=c.id
JOIN users u ON c.faculty_id=u.id
GROUP BY u.id;
```

## Visualization

Bar Chart.

---

# 6.2 Room Occupancy Trends

Derived from `attendance_logs` + `devices`.

## SQL

```sql
SELECT
room,
COUNT(*) AS occupants
FROM attendance_logs a
JOIN devices d ON a.device_id=d.id
WHERE action='ENTRY'
GROUP BY room;
```

## Visualization

Line chart or stacked bar.

---

# 6.3 Peak Usage Hours

## SQL

```sql
SELECT
EXTRACT(HOUR FROM timestamp) AS hour,
COUNT(*) AS entries
FROM attendance_logs
WHERE action='ENTRY'
GROUP BY hour
ORDER BY hour;
```

## Visualization

Time-of-day heatmap.

---

# 6.4 Room Utilization vs Schedule

Uses `classes` schedule vs actual attendance.

Detects unused classrooms.

Visualization:

Dual axis chart.

---

# 6.5 Overcrowding Alerts

Compare number of entries vs `devices.room_capacity`.

## SQL

```sql
SELECT
d.room,
COUNT(*) AS occupants,
d.room_capacity
FROM attendance_logs a
JOIN devices d ON a.device_id=d.id
WHERE action='ENTRY'
GROUP BY d.room,d.room_capacity
HAVING COUNT(*) > d.room_capacity;
```

Visualization:

Alert dashboard with red indicators.

---

# 7. Smart Insights Engine

Rule-based analytics generate automated insights.

Examples:

Student:

```
Your attendance decreased by 10% compared to last month.
You are most frequently late on Wednesdays.
```

Faculty:

```
5 students frequently exceed break limits.
Attendance dropped after midterms.
```

Department:

```
Room 302 exceeded capacity 4 times this week.
Faculty punctuality declined by 6%.
```

---

# 8. Dashboard Layout Recommendation

Student Dashboard

```
Attendance Distribution Pie
Weekly Trend Line Chart
Lateness Pattern Bar Chart
Consistency Score Gauge
```

Faculty Dashboard

```
Class Attendance Trend
Absence Heatmap
Student Punctuality Ranking
Break Behavior Analysis
```

Department Dashboard

```
Faculty Performance Chart
Room Utilization Graph
Peak Usage Heatmap
Department Activity Overview
```

---

# 9. Integration with Existing PDF Report System

Current system uses:

```
generateFramesPDF()
```

Charts can be embedded into PDFs.

Example:

```javascript
const chartImage = chartRef.current.toBase64Image();

doc.addImage(chartImage,'PNG',10,40,180,80);
```

This allows:

* Table data
* Graphical charts
* insights

in the same report.

---

# 10. Recommended Frontend Chart Libraries

For React integration.

Best options:

ChartJS
Recharts
Plotly.js
D3.js

Recommended:

```
React + ChartJS
```

because it integrates easily with canvas export.

---

# 11. Capstone Impact

Adding visual analytics improves:

User experience
decision-making
behavior analysis
system innovation

The system becomes:

```
Smart Attendance Analytics Platform
```

rather than simply an attendance recorder.

This strengthens the system's contribution to:

Academic monitoring
data-driven decision making
institutional management
------------------------
