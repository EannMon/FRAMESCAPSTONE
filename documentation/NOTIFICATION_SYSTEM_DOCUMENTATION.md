# FRAMES Notification System Documentation

## Overview
The FRAMES notification system provides role-based real-time alerts to keep all users informed about relevant system activities. Notifications are triggered based on user role and include actionable information with direct links to relevant features.

---

## Notification Types by Role

### 1. **Department Head Notifications**
Department Heads receive notifications about administrative matters and system audits.

#### Notification Types:
| Notification | Icon | Trigger | Link | Severity |
|--------------|------|---------|------|----------|
| **New User Registration** | `fa-user-clock` | When a faculty or staff account is pending verification | `/dept-head-dashboard` | High |
| **System Audit Alerts** | `fa-shield-alt` | When system actions (login, user operations, data changes) occur | `/dept-head-logs` | Medium |
| **Pending Verifications** | `fa-user-check` | New unverified faculty/staff accounts in department | `/dept-head-dashboard` | High |
| **System Activity Logs** | `fa-history` | Significant system events and changes | `/dept-head-logs` | Low |

**Frequency:** Real-time with polling every 60 seconds
**Limit:** Up to 10 notifications displayed (5 registrations + 5 audit alerts)

---

### 2. **Faculty Notifications**
Faculty members receive notifications about their classes, student attendance, and engagement.

#### Notification Types:
| Notification | Icon | Trigger | Link | Severity |
|--------------|------|---------|------|----------|
| **Student Check-in/Check-out** | `fa-user-check` | When a student marks attendance (present/late/absent) | `/faculty-attendance` | Medium |
| **Attendance Recording** | `fa-calendar-check` | Automated daily class attendance summaries | `/faculty-attendance` | Low |
| **Class Updates** | `fa-bell` | Changes to class schedule or enrollment | `/faculty-classes` | Medium |
| **Attendance Metrics** | `fa-chart-bar` | Weekly/monthly attendance summary reports | `/faculty-reports` | Low |

**Frequency:** Real-time with polling every 60 seconds
**Limit:** Up to 10 notifications (recent attendance events from all faculty classes)
**Scope:** Only shows data from classes taught by the logged-in faculty member

---

### 3. **Student Notifications**
Students receive notifications about their attendance, academic status, and schedule.

#### Notification Types:
| Notification | Icon | Trigger | Link | Severity |
|--------------|------|---------|------|----------|
| **Attendance Recorded** | `fa-calendar-check` | When attendance is marked (present/late/absent) | `/student-dashboard` | High |
| **Account Verification Status** | `fa-check-circle` | When account verification is complete | `/student-profile` | High |
| **Class Schedule Changes** | `fa-calendar-alt` | When a class schedule is updated | `/student-schedule` | Medium |
| **Attendance Summary** | `fa-chart-bar` | Daily/weekly attendance summary | `/student-attendance` | Low |
| **Late Warning** | `fa-clock` | When marked late multiple times | `/student-dashboard` | Medium |

**Frequency:** Real-time with polling every 60 seconds
**Limit:** Up to 10 notifications (recent personal attendance events)
**Scope:** Only shows data relevant to the student's enrolled classes

---

## Technical Implementation

### Backend Endpoint
```
GET /api/users/notifications/{user_id}
```

**Response Format:**
```json
{
  "notifications": [
    {
      "id": "unique-notification-id",
      "icon": "fas-icon-class",
      "text": "Human-readable notification message",
      "time": "HH:MM AM/PM or 'Pending'",
      "read": false,
      "link": "/route-to-relevant-page"
    }
  ]
}
```

### Frontend Display Components

#### Notification Bell Icon (Header)
- Shows unread notification count badge
- Click to open dropdown with 5 most recent notifications
- Link to full notification page (/notifications)
- Polls backend every 60 seconds for updates

#### Full Notification Page
- Filter: All / Unread
- Mark all as read option
- Persistent read state using localStorage
- Clickable notifications for quick navigation

### Data Persistence
- **Backend:** Notifications are calculated on-demand (no database storage)
- **Frontend:** Read status is persisted in localStorage per user
  - Key: `notif_read_{user_id}`
  - Value: JSON array of read notification IDs

---

## User Status Indicators

### Notification Badge Color Coding
- **Red (Unread):** New notifications requiring attention
- **Gray (Read):** Previously viewed notifications
- **Blue (System):** System-generated administrative alerts
- **Green (Success):** Completed actions or confirmations

### Read Status
- Notifications marked as read are visually distinguished but remain visible
- Users can filter to show only unread notifications
- Read status persists across page refreshes

---

## Best Practices & Usage

### For Department Heads
1. **Check regularly** for pending verifications to process accounts quickly
2. **Monitor audit logs** for security-sensitive actions  
3. Use notification gateway to navigate directly to relevant sections
4. Set up scheduled checks during office hours

### For Faculty
1. **Review attendance notifications** to track student engagement
2. **React to patterns** of student delays or absences
3. Use direct links to view complete class attendance records
4. Monitor class-specific alerts to stay informed

### For Students
1. **Confirm attendance** notifications are recorded correctly
2. **Track consistency score** changes through notifications
3. **Monitor account status** during initial verification period
4. **Note schedule changes** immediately when notified

---

## Advanced Features

### Notification Filtering
- Role-based access: Users only see relevant notifications
- Scope-based: Faculty see only their classes; Students see only their enrollments
- Time-based: Sorted by most recent first (with limit of 10)

### Notification Links
All notifications include contextual links to:
- Dashboard (quick overview)
- Specific feature pages (detailed view)
- Profile settings (account-related)
- Logs/Reports (administrative)

### Performance Optimization
- Eager loading prevents N+1 query problems
- Batch queries for related data
- 60-second polling interval balances responsiveness with server load
- Limited to 10 most recent notifications to reduce payload

---

## Troubleshooting

### Notifications not appearing?
- Check notification polling in Header component (interval: 60s)
- Verify user_id is correctly stored in localStorage
- Check browser console for API errors
- Clear localStorage if read-state becomes corrupted

### Incorrect notification text?
- Verify backend endpoint returns correct format
- Check user role is correctly authenticated
- Audit log entries may have truncated action types

### Performance issues?
- Reduce polling frequency if needed (adjust interval in Header)
- Ensure database indexes on user_id, class_id in relevant tables
- Monitor backend response times

---

## Future Enhancements

1. **Email Notifications:** Send important alerts via email
2. **SMS Alerts:** Critical notifications via phone (e.g., security alerts)
3. **Custom Preferences:** Allow users to set notification preferences
4. **Notification History:** Archive notifications for future reference
5. **Push Notifications:** Mobile app support for instant alerts
6. **Notification Templates:** Customizable message templates per role
7. **Scheduled Digests:** Weekly/monthly notification summaries

---

## Summary Table

| Role | Notification Count | Main Triggers | Primary Use |
|------|-------------------|---------------|-----------|
| **Department Head** | Up to 10 | User verifications, System audits | Administrative oversight |
| **Faculty** | Up to 10 | Student attendance, Class updates | Class management |
| **Student** | Up to 10 | Attendance recording, Account status | Personal tracking |

---

**Last Updated:** March 13, 2026  
**Documentation Version:** 1.0  
**System:** FRAMES (Facial Recognition Access and Monitoring Evaluation System)
