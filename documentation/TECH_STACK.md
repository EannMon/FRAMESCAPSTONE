# FRAMES - Final Tech Stack

> **Last Updated**: February 15, 2026

---

## Edge / AI (Raspberry Pi Kiosk)

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| **Face Detection (Gate)** | MediaPipe BlazeFace | via mediapipe 0.10.x | Fast pre-filter (~30ms on RPi4), only triggers InsightFace when face found |
| **Face Recognition** | InsightFace (buffalo_l, ResNet-50 + ArcFace) | insightface 0.7.3+ | **Same model as enrollment** — 512-d normalized embeddings, ONNX Runtime |
| **Inference Engine** | ONNX Runtime | 1.24.1 | Runs InsightFace buffalo_l on ARM64 CPU |
| **Hand Gesture** | MediaPipe Hands | via mediapipe 0.10.x | Distance-ratio finger extension + 3-frame temporal smoothing |
| **Camera Library** | picamera2 (libcamera stack) | system package | Required on Bookworm — OpenCV cannot read Pi Camera V2 via CSI |
| **Camera Fallback** | OpenCV VideoCapture | 4.6.x (system) | Used on laptop; auto-detected via `camera.py` wrapper |

---

## Backend (Laptop / Server)

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Python | 3.11 (RPi) / 3.12 (laptop) |
| Framework | FastAPI (async) | latest |
| ORM | SQLAlchemy | 2.x |
| Database | PostgreSQL | Aiven Cloud, SSL |
| Face Enrollment | InsightFace (buffalo_l) | 0.7.3+ |
| PDF Parsing | pdfplumber | latest |
| Password Hashing | bcrypt | latest |

---

## Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Build Tool | Vite | 6.2 |
| Framework | React (JSX) | 19.2 |
| HTTP Client | Axios | latest |
| Charts | Chart.js / Recharts | latest |
| Styling | Bootstrap | 5.3 |

---

## Hardware (Kiosk)

| Component | Specification |
|-----------|---------------|
| Edge Device | Raspberry Pi 4 Model B (4GB RAM) |
| OS | Raspberry Pi OS Bookworm 64-bit (aarch64) |
| Display | 7" HDMI IPS (1024x600, USB touch, ROHS) |
| Camera | RPi Camera V2 (8MP, Sony IMX219) |
| Camera Cable | 150mm flex cable (CSI connector) |
| Connectivity | WiFi (campus network) |

---

## Raspberry Pi Python Dependencies

| Package | Version | Source | Why |
|---------|---------|--------|-----|
| **numpy** | **1.26.4** | pip | Must be this version — 1.24 too old for scipy, 2.x breaks picamera2/simplejpeg ABI |
| **mediapipe** | 0.10.x | pip | Face detection gate + hand gesture detection |
| **onnxruntime** | 1.24.1 | pip | Runs InsightFace ONNX models on ARM64 CPU |
| **insightface** | 0.7.3+ | pip | buffalo_l model for face embedding extraction |
| **requests** | latest | pip | HTTP client for backend API calls |
| **picamera2** | system | apt (`python3-picamera2`) | Pi Camera V2 on Bookworm (libcamera stack) |
| **opencv** | 4.6.x (system) | apt (`python3-opencv`) | Image processing + GUI display (has GTK support) |

> **WARNING: Do NOT `pip install numpy` (gets 2.x) or `pip install opencv-python` (no GTK).** See RPi README Phase 4.5 for details.

---

## Single-Model Architecture

**CRITICAL:** Both enrollment and recognition use the **same model** (InsightFace buffalo_l, ResNet-50 + ArcFace). This is required because different models produce embeddings in **incompatible vector spaces** — even if both output 512 dimensions.

### Pipeline 1: Enrollment (Backend / Laptop)

```
Browser → Webcam → 10-20 Frames
                        ↓
              InsightFace buffalo_l
              (ResNet-50 + ArcFace)
              det_size: (640, 640)
                        ↓
              512-d Normalized Embedding
                        ↓
                    PostgreSQL
```

### Pipeline 2: Recognition (Raspberry Pi Kiosk)

```
Pi Camera V2 (via picamera2)
                        ↓
              MediaPipe BlazeFace (~30ms)
              ├── No face? → skip (saves CPU)
              └── Face found?
                        ↓
              InsightFace buffalo_l
              (ResNet-50 + ArcFace)
              det_size: (320, 320)
              ONNX Runtime (~200ms)
                        ↓
              512-d Normalized Embedding
                        ↓
              Cosine Similarity vs Cache
              threshold ≥ 0.35 → Match!
                        ↓
              Gesture Confirmation
              (MediaPipe Hands, 3 frames)
                        ↓
              POST to Backend API
              → Dashboard updates real-time
```

---

## Security

- ✅ SSL/TLS database connection (Aiven)
- ✅ bcrypt password hashing
- ✅ Environment variables (.env)
- ✅ Pydantic input validation
- ✅ Gesture verification (prevents walk-by false detections)
- ✅ Attendance confidence scores for audit
- ✅ Offline queue with sync (network resilience)
