# Raspberry Pi Face Recognition Pipeline

## Overview

This module implements a **gesture-gated face recognition system** for Raspberry Pi attendance kiosks. It provides:

- **Face Detection** using MediaPipe BlazeFace
- **Face Recognition** using InsightFace (buffalo_sc model)
- **Gesture Detection** using MediaPipe Hands (peace sign confirmation)
- **Offline Support** with local embedding cache and attendance queue

---

## Prerequisites

### 1. Activate Virtual Environment

```bash
cd backend
.\venv\Scripts\activate  # Windows
# OR
source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies

```bash
pip install mediapipe insightface onnxruntime opencv-python requests
```

> **Note**: If you see `module 'mediapipe' has no attribute 'solutions'`, reinstall MediaPipe:
> ```bash
> pip uninstall mediapipe -y
> pip install mediapipe
> ```

---

## Quick Start

### Step 1: Export Enrolled Face Embeddings

This script extracts all enrolled face embeddings from your PostgreSQL database and saves them as a JSON file that kiosks can use offline.

```bash
cd backend
.\venv\Scripts\activate
python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json
```

**What it does:**
- Connects to your Aiven PostgreSQL database
- Queries the `facial_profiles` table for all 512-dimensional face embeddings
- Joins with `users` table to get names, emails, and TUPM IDs
- Saves everything to a JSON file (approximately 16KB per user)

**When to run:**
- After enrolling new users via the web frontend
- Before deploying or updating kiosk devices
- Whenever you want to sync the latest enrollments to kiosks

### Step 2: Test on Laptop (Optional)

Before deploying to Raspberry Pi, test the recognition pipeline on your laptop:

```bash
python rpi/test_laptop.py
```

**Controls:**
- Press `q` to quit
- Press `g` to test gesture detection

### Step 3: Run Kiosk (Production)

```bash
# Set your device ID (from the devices table in database)
set DEVICE_ID=1  # Windows
export DEVICE_ID=1  # Linux/Mac

python rpi/main_kiosk.py
```

**Command Line Options:**
```bash
python rpi/main_kiosk.py --device-id 1 --backend-url http://your-server:8000 --no-gesture
```

| Option | Description |
|--------|-------------|
| `--device-id` | Device ID from `devices` table |
| `--backend-url` | Your backend API URL |
| `--no-gesture` | Disable peace sign requirement |
| `--camera` | Camera index (0 = default) |

---

## File Structure

```
backend/
├── rpi/                          # Kiosk code (runs on RPi or laptop)
│   ├── config.py                 # Configuration settings
│   ├── face_detector.py          # MediaPipe face detection
│   ├── face_recognizer.py        # InsightFace embedding extraction
│   ├── gesture_detector.py       # Peace sign detection
│   ├── embedding_cache.py        # Local JSON cache for offline matching
│   ├── schedule_resolver.py      # Room-based class lookup
│   ├── attendance_logger.py      # Backend API + offline queue
│   ├── main_kiosk.py             # Main attendance loop
│   ├── test_laptop.py            # GUI test for development
│   └── data/
│       └── embeddings_cache.json # Exported face embeddings
│
├── api/routers/
│   └── kiosk.py                  # Backend API endpoints for kiosks
│
└── scripts/
    └── export_embeddings.py      # Database to JSON export script
```

---

## How It Works

### Recognition Flow

```
1. Camera captures frame
       ↓
2. InsightFace detects face and extracts 512-d embedding
       ↓
3. Embedding compared against cached enrollments (cosine similarity)
       ↓
4. If match found (≥40% similarity):
       ↓
5. Prompt for peace sign gesture (optional)
       ↓
6. Log attendance to backend API
       ↓
7. If network fails, queue locally for later sync
```

### Class Scheduling

Each Raspberry Pi kiosk is assigned to a **room** in the database. When the kiosk starts:

1. Queries backend: "What class is active in my room right now?"
2. Caches the weekly schedule locally for offline use
3. Only logs attendance when a class is in session

---

## Configuration

Edit `rpi/config.py` to customize:

```python
# Recognition threshold (0.0 to 1.0)
MATCH_THRESHOLD = 0.40  # Balanced: 40% similarity required

# Gesture settings
REQUIRE_GESTURE_FOR_ENTRY = True  # Require peace sign
GESTURE_TIMEOUT_SECONDS = 5.0     # Time to show gesture

# Cooldown (prevent duplicate scans)
COOLDOWN_SECONDS = 10
```

---

## Backend API Endpoints

The kiosk communicates with these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/kiosk/active-class?device_id=X` | GET | Get current class for this room |
| `/api/kiosk/schedule?device_id=X` | GET | Get weekly schedule for caching |
| `/api/kiosk/attendance/log` | POST | Log attendance record |
| `/api/kiosk/device/{id}` | GET | Get device info |
| `/api/kiosk/device/{id}/heartbeat` | POST | Update device status |

---

## Troubleshooting

### Error: `module 'mediapipe' has no attribute 'solutions'`

**Cause**: Corrupted or incomplete MediaPipe installation.

**Fix**:
```bash
pip uninstall mediapipe -y
pip install mediapipe
```

### Error: `No cache file found`

**Cause**: Embeddings haven't been exported yet.

**Fix**:
```bash
python scripts/export_embeddings.py
```

### Error: `DEVICE_ID required`

**Cause**: The kiosk doesn't know which device it is.

**Fix**:
```bash
set DEVICE_ID=1  # Windows
# OR pass via command line:
python rpi/main_kiosk.py --device-id 1
```

### Recognition Not Working

1. Check if user is enrolled (has face in database)
2. Verify embeddings are exported: `ls rpi/data/embeddings_cache.json`
3. Lower the threshold in `config.py`: `MATCH_THRESHOLD = 0.35`
4. Ensure good lighting on face

---

## Database Requirements

### devices table

Each kiosk must have a row in the `devices` table:

| Column | Example |
|--------|---------|
| `id` | 1 |
| `room` | "CL1" |
| `device_name` | "KIOSK-CL1" |
| `status` | "ACTIVE" |

### classes table

Classes must have `room` matching the device's room for automatic class detection.

---

## Deployment to Raspberry Pi

1. Copy the `backend/rpi/` folder to your RPi
2. Copy `backend/rpi/data/embeddings_cache.json` (the exported embeddings)
3. Install dependencies: `pip install mediapipe insightface onnxruntime opencv-python requests`
4. Set environment variables:
   ```bash
   export DEVICE_ID=1
   export BACKEND_URL=http://your-server:8000
   ```
5. Run: `python main_kiosk.py`

---

## Security Notes

- Embeddings are stored as JSON (not encrypted) - keep the cache file secure
- The kiosk does NOT store passwords or sensitive user data
- Attendance logs include confidence scores for audit purposes
- Gesture verification adds a layer of liveness detection
