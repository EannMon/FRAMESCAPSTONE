USE THESE ACCOUNTS:

1. head.santos@tup.edu.ph - santos - face registered by emman - faculty head
2. juan.garcia@tup.edu.ph - garcia - no face registered - faculty member
3. pedro.mendoza@tup.edu.ph - mendoza - no face registered - faculty member
4. elena.fernandez@tup.edu.ph - fernandez - no face registered - faculty member
5. for student access, access our discord since they are real data
6. elena.llana@tup.edu.ph - elenastudent - face registered - student

# FRAMES - Final Tech Stack

> **Last Updated**: February 1, 2026

---

## Edge / AI

| Component                     | Technology                            | Notes                           |
| ----------------------------- | ------------------------------------- | ------------------------------- |
| **Face Recognition (Pi)**     | MobileNetV2 + FaceNet → TFLite (INT8) | Real-time on Raspberry Pi       |
| **Face Enrollment (Backend)** | InsightFace (buffalo_l)               | High-quality enrollment via web |
| **Hand Gesture**              | MediaPipe Hands                       | Liveness detection              |
| **Camera**                    | Pi Camera                             | Raspberry Pi camera module      |

---

## Backend

| Component   | Technology                    |
| ----------- | ----------------------------- |
| Language    | Python 3.12                   |
| Framework   | FastAPI (async)               |
| ORM         | SQLAlchemy 2.x                |
| Database    | PostgreSQL (Aiven Cloud, SSL) |
| PDF Parsing | pdfplumber                    |

---

## Frontend

| Component   | Technology          |
| ----------- | ------------------- |
| Build Tool  | Vite 6.2            |
| Framework   | React 19.2 (JSX)    |
| HTTP Client | Axios               |
| Charts      | Chart.js / Recharts |
| Styling     | Bootstrap 5.3       |
| Dev Tooling | concurrently        |

---

## Device

| Component   | Specification        |
| ----------- | -------------------- |
| Edge Device | Raspberry Pi 4 (4GB) |
| Display     | Small kiosk screen   |
| Camera      | Pi Camera Module     |

---

## Two-Pipeline Architecture

### Pipeline 1: Enrollment (Backend)

```
Browser → Webcam → 10-20 Frames
                        ↓
                   InsightFace
                        ↓
                  512-d Embedding
                        ↓
                    PostgreSQL
```

### Pipeline 2: Recognition (Edge)

```
Pi Camera → TFLite FaceNet (INT8)
                    ↓
               128-d Embedding
                    ↓
             Compare with DB
                    ↓
             Log Attendance
```

---

## Security

- ✅ SSL/TLS database connection
- ✅ bcrypt password hashing
- ✅ Environment variables (.env)
- ✅ Pydantic input validation
- 🔄 JWT tokens (planned)
