# Use Case Diagram — FRAMES

## Actors

| Actor | Type | Description |
|-------|------|-------------|
| **Student** | Primary | Class member who uses the kiosk for attendance and views personal records |
| **Faculty** | Primary | Instructor who manages classes, uploads schedules, monitors attendance |
| **Department Head** | Primary | Extends Faculty with department-level oversight and faculty verification |
| **USB Webcam / RPi Kiosk** | Secondary (Hardware) | Provides face and gesture data, displays recognition results |

---

## Use Cases by Actor

### Student

| ID | Use Case | Description |
|----|----------|-------------|
| UC-S1 | Sign In | Log into the web application with auto-generated credentials |
| UC-S2 | Enroll Face | Capture 3–5 frames via browser webcam for embedding extraction |
| UC-S3 | Log Entry | Approach kiosk → face recognized → entry logged automatically (no gesture) |
| UC-S4 | Log Break-Out | Show peace sign (✌️) after face recognition to log break-out |
| UC-S5 | Log Break-In | Show thumbs-up (👍) after face recognition to log return from break |
| UC-S6 | Log Exit | Show open palm (✋) after face recognition to log exit |
| UC-S7 | View Personal Attendance | View personal attendance history and records on dashboard |
| UC-S8 | View Real-Time Status | See current status (present, on break, exited) on dashboard |

### Faculty

| ID | Use Case | Description |
|----|----------|-------------|
| UC-F1 | Register Account | Create faculty account (requires Department Head verification) |
| UC-F2 | Enroll Face | Same process as student face enrollment |
| UC-F3 | Upload Class Schedule | Upload PDF schedule → auto-creates student accounts and class sections |
| UC-F4 | Log Entry/Break/Exit | Same kiosk interaction as students |
| UC-F5 | View Class Attendance | View real-time and historical attendance for managed classes |
| UC-F6 | Generate Class Reports | Export class attendance as CSV or PDF |
| UC-F7 | View Student Details | View individual student attendance records and patterns |

### Department Head (extends Faculty)

| ID | Use Case | Description |
|----|----------|-------------|
| UC-DH1 | Verify Faculty Accounts | Approve or reject faculty registration requests |
| UC-DH2 | View Dept. Attendance | View aggregated department-wide attendance summary |
| UC-DH3 | View Faculty Reports | View faculty attendance and compliance reports |
| UC-DH4 | Generate Dept. Reports | Export department-level attendance reports (CSV/PDF) |

### USB Webcam / RPi Kiosk (Hardware Actor)

| ID | Use Case | Description |
|----|----------|-------------|
| UC-K1 | Capture Facial Frames | Continuously capture video frames via USB webcam |
| UC-K2 | Capture Gesture Data | Detect hand landmarks via MediaPipe Hands |
| UC-K3 | Display Recognition Results | Show "Welcome [Name]" or "Unrecognized" on kiosk screen |
| UC-K4 | Display Anomaly Alert | Flag unrecognized individuals not enrolled in current class |
| UC-K5 | Display Gesture Guide | Show gesture instructions for break/exit actions |

---

## Diagram (Text Representation)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRAMES System                                      │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│ S │  │  Sign In      │  │ Enroll Face  │  │ View Personal│                  │   │
│ t │  │  (UC-S1)      │  │ (UC-S2)      │  │ Attendance   │                  │   │
│ u ├─→│               │  │              │  │ (UC-S7)      │                  │   │
│ d │  └──────────────┘  └──────────────┘  └──────────────┘                  │   │
│ e │                                                                         │   │
│ n │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│ t │  │ Log Entry     │  │Log Break-Out │  │ Log Break-In │  │ Log Exit   │  │   │
│   ├─→│ (UC-S3)       │  │ (UC-S4)      │  │ (UC-S5)      │  │ (UC-S6)    │  │   │
│   │  │ Auto (no gest)│  │ ✌️ Peace Sign │  │ 👍 Thumbs-Up │  │ ✋ Open Palm│  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│   │                                                                         │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│ F │  │ Register      │  │ Upload Class │  │ View Class   │                  │   │
│ a │  │ Account       │  │ Schedule     │  │ Attendance   │                  │   │
│ c ├─→│ (UC-F1)       │  │ (UC-F3)      │  │ (UC-F5)      │                  │   │
│ u │  └──────────────┘  └──────────────┘  └──────────────┘                  │   │
│ l │                                                                         │   │
│ t │  ┌──────────────┐  ┌──────────────┐                                    │   │
│ y │  │ Generate      │  │ View Student │                                    │   │
│   ├─→│ Class Reports │  │ Details      │                                    │   │
│   │  │ (UC-F6)       │  │ (UC-F7)      │                                    │   │
│   │  └──────────────┘  └──────────────┘                                    │   │
│   │                                                                         │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│ D │  │ Verify Faculty│  │ View Dept.   │  │ View Faculty │                  │   │
│ H │  │ Accounts      │  │ Attendance   │  │ Reports      │                  │   │
│   ├─→│ (UC-DH1)      │  │ (UC-DH2)     │  │ (UC-DH3)     │                  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘                  │   │
│   │                                                                         │   │
│   │  ┌──────────────┐                                                      │   │
│   │  │ Generate Dept.│                                                      │   │
│   ├─→│ Reports       │                                                      │   │
│   │  │ (UC-DH4)      │                                                      │   │
│   │  └──────────────┘                                                      │   │
│   │                                                                         │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│ K │  │ Capture Face  │  │ Capture      │  │ Display      │  │ Anomaly    │  │   │
│ i │  │ Frames        │  │ Gesture Data │  │ Recognition  │  │ Alert      │  │   │
│ o ├─→│ (UC-K1)       │  │ (UC-K2)      │  │ (UC-K3)      │  │ (UC-K4)    │  │   │
│ s │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│ k │                                                                         │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| Department Head → Faculty | **«extends»** | Department Head inherits all Faculty use cases and adds department-level management |
| UC-S3/S4/S5/S6 → UC-K1 | **«includes»** | All kiosk attendance actions include facial frame capture |
| UC-S4/S5/S6 → UC-K2 | **«includes»** | Break/exit actions include gesture capture |
| UC-K3 → UC-S3/S4/S5/S6 | **«includes»** | All attendance actions include display of recognition results |
| UC-K4 → UC-K1 | **«includes»** | Anomaly detection requires facial frame capture |
