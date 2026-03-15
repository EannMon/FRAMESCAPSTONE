# Top-Level Data Flow Diagram — FRAMES

```
┌──────────┐                                                         ┌──────────────────┐
│ Student  │───Personal info────────→┌─────────────────────┐←───────│  Faculty          │
│          │                         │ 1.0 User Registration│        │  (+ schedules PDF)│
│          │←──Account credentials───│ & Enrollment         │────────│                   │
└────┬─────┘                         └──────────┬──────────┘        └────────┬──────────┘
     │                                          │                            │
     │                             User data    │                            │
     │                                  ↓       │                            │
     │                          ┌──────────────┐│                            │
     │                          │ D1: Users DB ││                            │
     │                          └──────┬───────┘│                            │
     │                                 │        │                            │
     │ Facial frames (browser webcam)  │        │   Facial frames            │
     │─────────────────────────────→┌──┴────────┴──────────┐←────────────────┘
     │                              │ 2.0 Face Enrollment  │
     │                              │ (Server-Side)        │
     │                              │ InsightFace buffalo_sc│
     │                              │ det_size: (640,640)  │
     │                              └──────────┬───────────┘
     │                                         │
     │                          512-d embedding│(averaged, L2-normalized)
     │                                         ↓
     │                          ┌──────────────────────────┐
     │                          │ D2: Facial Profiles DB   │
     │                          │ (embedding, model_ver,   │
     │                          │  quality_score)          │
     │                          └──────────┬───────────────┘
     │                                     │
     │                          Cached embeddings
     │                                     ↓
┌────┴─────────┐               ┌───────────────────────────┐
│ USB Webcam   │──Frames──────→│ 3.0 Facial Recognition   │
│ + RPi Kiosk  │               │ (Edge / Raspberry Pi)    │
│              │               │ MediaPipe BlazeFace gate  │
│              │               │ InsightFace buffalo_sc   │
│              │               │ ONNX Runtime, ARM64      │
│              │               │ det_size: (320,320)      │
│              │               │ Cosine similarity ≥ 0.30 │
│              │               └──────────┬────────────────┘
│              │                          │
│              │               Match result (user_id, confidence)
│              │                          ↓
│              │               ┌───────────────────────────┐
│              │──Gesture──────→│ 4.0 Gesture Recognition  │
│              │  landmarks    │ MediaPipe Hands           │
│              │               │ 3-frame debounce          │
│              │               │ Static: ✌️ 👍 ✋          │
│              │←──Display─────│                            │
│              │  updates      └──────────┬────────────────┘
└──────────────┘                          │
                               Verified face + gesture
                                          ↓
                               ┌───────────────────────────┐
                               │ 5.0 Attendance Logging    │
                               │ POST /api/kiosk/attendance│
                               │ Action: ENTRY/BREAK_OUT/  │
                               │         BREAK_IN/EXIT     │
                               │ + confidence, verified_by │
                               └──────────┬────────────────┘
                                          │
                                          ↓
                               ┌──────────────────────────┐
                               │ D4: Attendance Logs DB   │
                               └──────────┬───────────────┘
                                          │
                                          ↓
                               ┌───────────────────────────┐
                               │ 6.0 Report Generation    │
                               │ & Dashboards             │
                               │ React + Chart.js/Recharts│
┌──────────────┐               │ Real-time via WebSocket  │        ┌─────────────────┐
│ Student      │←──Personal────│ CSV/PDF export           │───Dept→│ Department Head │
│              │   records     │                           │  reports│                 │
└──────────────┘               └───────────────────────────┘        └─────────────────┘
                                          │
                               ┌──────────┴───────────────┐
                               │ Faculty                  │
                               │←──Class reports,         │
                               │   student summaries      │
                               └──────────────────────────┘
```

## Process Descriptions

| Process | Description | Input | Output |
|---------|------------|-------|--------|
| **1.0 User Registration** | Account creation and management. Faculty uploads class schedules (PDF) which auto-creates student accounts. Department Head verifies faculty accounts. | Personal info, schedule PDFs, verification requests | User accounts, generated credentials |
| **2.0 Face Enrollment** | Server-side face embedding extraction. Browser webcam captures 3–5 frames. InsightFace `buffalo_sc` extracts 512-d embeddings, averaged and L2-normalized. Duplicate check prevents fraud. | Webcam frames (base64) | 512-d embedding stored in `facial_profiles` |
| **3.0 Facial Recognition** | Edge-side recognition on RPi. MediaPipe BlazeFace gates InsightFace. `buffalo_sc` via ONNX Runtime extracts embedding. Cosine similarity matching against cached embeddings. | USB webcam frames | Match result (user_id, confidence score) |
| **4.0 Gesture Recognition** | Static hand gesture detection via MediaPipe Hands. 3-frame temporal smoothing. Maps gestures to attendance actions. | Hand landmark data | Confirmed gesture (BREAK_OUT/BREAK_IN/EXIT) |
| **5.0 Attendance Logging** | Records validated face+gesture events via backend API. Stores action type, timestamp, confidence, device info. | Verified recognition + gesture | Attendance log entry in database |
| **6.0 Report Generation** | Aggregates attendance data into role-specific reports and dashboards. Real-time status via WebSocket. CSV/PDF export. | Attendance log data | Personal/class/department reports, visualizations |

## Data Stores

| ID | Store | Description |
|----|-------|-------------|
| **D1** | Users Database | User profiles (email, name, role, department, face_registered flag), password hashes |
| **D2** | Facial Profiles | 512-d face embeddings (2,048 bytes), model version (`insightface_buffalo_sc_v1`), enrollment quality |
| **D3** | Classes & Schedules | Subjects, class sections, room assignments, day/time schedules, student enrollments |
| **D4** | Attendance Logs | Timestamped events: user_id, class_id, device_id, action, verified_by, confidence_score |
| **D5** | Device Registry | Kiosk devices with assigned rooms and status |
