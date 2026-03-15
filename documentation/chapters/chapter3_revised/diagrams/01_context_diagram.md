# Figure 3.1 Context Diagram

```mermaid
flowchart LR
    student[Student]
    faculty[Faculty]
    head[Department Head]
    kiosk[Kiosk Node\nRaspberry Pi 4B + Webcam]
    system[FRAMES System\nFastAPI + PostgreSQL + React Dashboard]

    student -->|face enrollment + attendance interactions| kiosk
    kiosk -->|recognized events + logs| system
    system -->|attendance status + history| student

    faculty -->|schedule data + class operations| system
    system -->|class attendance views + reports| faculty

    head -->|department monitoring requests| system
    system -->|faculty/class summaries + reports| head

    kiosk -->|anomaly events + attendance state transitions| system
```

## Explanation

The context diagram shows FRAMES as a central system connected to three operational user roles (student, faculty, department head) and one kiosk node for attendance capture.
