# Context Data Flow Diagram — FRAMES

```
                        ┌────────────────────┐
                        │                    │
       Personal info,   │                    │  Attendance confirmation,
       Facial frames,   │                    │  real-time status,
       Live kiosk scans │                    │  personal reports
    ┌──────────────────→│                    │──────────────────────┐
    │                   │                    │                      │
    │   ┌───────────┐   │                    │   ┌──────────────┐   │
    │   │  Student   │   │                    │   │   Student     │   │
    │   └───────────┘   │                    │   └──────────────┘   │
    │                   │                    │                      │
    │                   │      FRAMES        │                      │
    │   ┌───────────┐   │   Facial Recog.    │   ┌──────────────┐   │
    │   │  Faculty   │──→│   & Attendance     │──→│   Faculty     │   │
    │   └───────────┘   │   Monitoring       │   └──────────────┘   │
    │   Personal info,  │   System           │   Attendance confirm,│
    │   Facial frames,  │                    │   class reports,     │
    │   Live kiosk      │                    │   student summaries  │
    │   scans, Class    │                    │                      │
    │   schedules (PDF) │                    │                      │
    │                   │                    │                      │
    │   ┌───────────┐   │                    │   ┌──────────────┐   │
    │   │Department  │──→│                    │──→│ Department    │   │
    │   │Head        │   │                    │   │ Head          │   │
    │   └───────────┘   │                    │   └──────────────┘   │
    │   Login creds,    │                    │   Faculty reports,   │
    │   Admin requests  │                    │   dept-wide summary, │
    │                   │                    │   room utilization   │
    │                   │                    │                      │
    │   ┌───────────┐   │                    │   ┌──────────────┐   │
    │   │USB Webcam  │──→│                    │──→│ USB Webcam    │   │
    │   │+ RPi Kiosk │   │                    │   │ + RPi Kiosk   │   │
    │   └───────────┘   │                    │   └──────────────┘   │
    │   Facial frames,  │                    │   Processing status, │
    │   Gesture data    │                    │   Display updates    │
    │                   │                    │                      │
    │                   └────────────────────┘                      │
    │                                                               │
    └───────────────────────────────────────────────────────────────┘
```

## External Entities

| Entity | Description | Data Sent to FRAMES | Data Received from FRAMES |
|--------|-------------|---------------------|--------------------------|
| **Student** | Enrolled student in the class section | Personal info, facial webcam frames for enrollment, live face/gesture scans at kiosk | Attendance confirmation messages, real-time status indicators, personal attendance records |
| **Faculty** | Class instructor for the section | Personal info, facial frames, live kiosk scans, class schedules (PDF uploads) | Attendance confirmation, class-specific attendance reports, student attendance summaries |
| **Department Head** | Head of the Computer Studies Dept. | Login credentials, administrative requests (faculty verification, report queries) | Faculty compliance reports, department-wide attendance summaries, room utilization data |
| **USB Webcam + RPi Kiosk** | Hardware actor (camera + embedded device) | Captured facial video frames, hand gesture landmark data | Frame processing status, kiosk display updates, recognition results |

> **Note:** There is no separate Admin entity. System management functions are distributed between the Faculty and Department Head roles.
