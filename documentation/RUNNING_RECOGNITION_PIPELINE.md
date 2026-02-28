# FRAMES Recognition Pipeline — Complete Running Guide

> **Purpose:** Step-by-step instructions for running the FRAMES face recognition attendance system **with UI** (OpenCV window) and **without UI** (headless via SSH) on both Laptop and Raspberry Pi.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Dependencies](#2-prerequisites--dependencies)
3. [One-Time Setup (Before First Run)](#3-one-time-setup-before-first-run)
4. [Running WITH UI (OpenCV Window)](#4-running-with-ui-opencv-window)
5. [Running WITHOUT UI (Headless / SSH)](#5-running-without-ui-headless--ssh)
6. [Running the Test Script](#6-running-the-test-script)
7. [SSH Setup & Connection](#7-ssh-setup--connection)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Configuration Reference](#9-configuration-reference)
10. [Troubleshooting](#10-troubleshooting)
11. [Quick Reference Cheat Sheet](#11-quick-reference-cheat-sheet)

---

## 1. Architecture Overview

FRAMES has **two kiosk entry points** — choose based on whether you have a physical display or are running headless over SSH.

| Mode | Script | Display Required? | How You See the Feed |
|------|--------|-------------------|---------------------|
| **UI Mode** | `rpi/main_kiosk.py` | Yes (monitor or `DISPLAY=:0` via SSH) | OpenCV window on the attached display |
| **Headless/Streaming Mode** | `rpi/kiosk_server.py` | **No** | Browser at `http://<IP>:8000/video_feed` |
| **Test Mode** | `rpi/test_laptop.py` | Yes | OpenCV window with debug overlay |

### Recognition Pipeline Flow

```
Camera Frame
    │
    ▼
[Frame Skip — every Nth frame on RPi]
    │
    ▼
┌─────────────────────────────────────┐
│ Gated Detection (RPi only)          │
│ MediaPipe BlazeFace (~30ms)         │
│   └─ Face found & > 80px? ─── No ──┼──► Skip InsightFace (save CPU)
│                              Yes    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ InsightFace buffalo_l               │
│ Extract 512-d embedding             │
│ (~50ms laptop / ~200ms RPi)         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ Cosine Similarity vs Cache (<1ms)   │
│ Match threshold ≥ 0.35              │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ Attendance State Machine            │
│ ENTRY (face only)                   │
│ BREAK_OUT (face + ✌️ peace)          │
│ BREAK_IN  (face + 👍 thumbs up)     │
│ EXIT      (face + 🖐 open palm)     │
└──────────────┬──────────────────────┘
               ▼
  POST /api/kiosk/attendance/log
  (offline queue if network fails)
```

---

## 2. Prerequisites & Dependencies

### 2.1 Laptop (Windows/Linux/macOS)

**Python:** 3.10+ (3.11 recommended)

**Install dependencies:**

```powershell
# From project root
cd backend
pip install -r requirements.txt
```

The main backend `requirements.txt` already contains everything needed for laptop mode. Key packages:
- `opencv-python` — camera + display
- `mediapipe` — face detection gate + gesture detection
- `insightface` — face recognition (buffalo_l model)
- `onnxruntime` — ONNX inference engine
- `numpy` — embedding math
- `requests` — backend API calls

> **First run note:** InsightFace will automatically download the `buffalo_l` model (~280MB) to `~/.insightface/models/` on first use. This only happens once.

### 2.2 Raspberry Pi 4 (Bookworm 64-bit)

**Critical: Do NOT install OpenCV or NumPy via pip on RPi!**

```bash
# Step 1 — System packages (apt)
sudo apt update
sudo apt install -y \
    python3-picamera2 python3-opencv python3-venv \
    libatlas-base-dev libopenblas-dev libhdf5-dev

# Step 2 — Create venv WITH system packages
python3 -m venv --system-site-packages ~/frames_env
source ~/frames_env/bin/activate

# Step 3 — pip install RPi-specific requirements
cd ~/frames/backend
pip install -r rpi/requirements-rpi.txt
```

**Why `--system-site-packages`?**
- `picamera2` (Pi Camera V2 on Bookworm's libcamera stack) only works from apt
- `python3-opencv` from apt has GTK support for `cv2.imshow()` — pip's `opencv-python` does NOT
- The venv flag makes these system packages visible inside the virtual environment

**Why `numpy==1.26.4` specifically?**
- NumPy 2.x breaks picamera2's C ABI (SimplePEG compatibility issue)
- NumPy 1.24.x (system default) is too old for insightface/scipy
- 1.26.4 is the sweet spot

---

## 3. One-Time Setup (Before First Run)

These steps only need to be done **once** before your first recognition run.

### 3.1 Start the Backend Server

The recognition pipeline needs the backend API running:

```powershell
# Terminal 1 — Backend
cd backend
python main.py
# Runs on http://localhost:5000
```

### 3.2 Register Your Device

The kiosk needs a `DEVICE_ID` — register your laptop (or RPi) as a device:

```powershell
cd backend

# Default: registers as room "306"
python scripts/setup_laptop_device.py

# Custom room:
python scripts/setup_laptop_device.py --room "Lab 201"

# Custom name:
python scripts/setup_laptop_device.py --name "MyKiosk"
```

**Output will show your DEVICE_ID — save this number!** Example:

```
✅ Created new device:
   Device ID:   1
   Device Name: LAPTOP-DESKTOP-ABC-306
   Room:        306

   Set environment: DEVICE_ID=1
```

### 3.3 Enroll Faces

Users must have enrolled their face via the web app (`/face-enrollment`) before recognition works. This stores their 512-d embedding in the database.

### 3.4 Export Embeddings to JSON Cache

The kiosk uses a local JSON file for fast offline matching instead of querying the DB per face:

```powershell
cd backend
python scripts/export_embeddings.py
```

This creates `backend/rpi/data/embeddings_cache.json` containing all enrolled faces.

> **Tip:** Re-run this script whenever new users enroll their faces.

### 3.5 Set Environment Variables

**Windows (PowerShell — current session):**
```powershell
$env:DEVICE_ID = "1"
$env:BACKEND_URL = "http://localhost:5000"
```

**Windows (Permanent via System):**
```powershell
[System.Environment]::SetEnvironmentVariable("DEVICE_ID", "1", "User")
[System.Environment]::SetEnvironmentVariable("BACKEND_URL", "http://localhost:5000", "User")
```

**Linux / RPi (bash):**
```bash
export DEVICE_ID=1
export BACKEND_URL=http://localhost:5000
```

**Linux / RPi (permanent — add to `~/.bashrc`):**
```bash
echo 'export DEVICE_ID=1' >> ~/.bashrc
echo 'export BACKEND_URL=http://192.168.1.100:5000' >> ~/.bashrc
source ~/.bashrc
```

---

## 4. Running WITH UI (OpenCV Window)

**UI mode** opens an OpenCV window showing the live camera feed with bounding boxes, name labels, and gesture prompts. This requires a display (monitor, HDMI screen, or 7" RPi display).

### 4.1 On Laptop (Directly)

```powershell
# Make sure backend is running in another terminal!
cd backend

# Option A: Environment variables
$env:DEVICE_ID = "1"
python rpi/main_kiosk.py

# Option B: CLI arguments
python rpi/main_kiosk.py --device-id 1 --backend-url http://localhost:5000

# Option C: CLI with specific camera
`python rpi/main_kiosk.py --device-id 1 --camera 0
```

**What you'll see:**
- An OpenCV window titled **"FRAMES Attendance Kiosk"**
- Green bounding box + name label when a face is recognized
- Red bounding box for unknown faces
- Gesture prompts after first recognition (ENTRY is face-only)
- Press `q` to quit

### 4.2 On Raspberry Pi (with Display Attached)

Directly on the Pi (keyboard + monitor plugged in):

```bash
# Activate venv
source ~/frames_env/bin/activate
cd ~/frames/backend

# Set device info
export DEVICE_ID=1
export BACKEND_URL=http://192.168.1.100:5000  # Your laptop's IP running backend

# Run
python rpi/main_kiosk.py
```

### 4.3 On RPi via SSH (Route UI to Pi's Display)

When you SSH into the Pi but want the OpenCV window to appear on the Pi's attached 7" screen:

```bash
# SSH into RPi
ssh pi@192.168.1.50

# Activate venv
source ~/frames_env/bin/activate
cd ~/frames/backend

# CRITICAL: Set DISPLAY to route window to the Pi's physical screen
export DISPLAY=:0
export DEVICE_ID=1
export BACKEND_URL=http://192.168.1.100:5000

# Run — window appears on Pi's screen, not your SSH terminal
DISPLAY=:0 python rpi/main_kiosk.py
```

> **Why `DISPLAY=:0`?** SSH sessions don't have a display server by default. `DISPLAY=:0` tells OpenCV to use the Pi's local X11 display (the connected monitor/screen). Without this, `cv2.imshow()` will crash with "cannot connect to display."

---

## 5. Running WITHOUT UI (Headless / SSH)

**Headless mode** runs a FastAPI web server that streams the camera feed as MJPEG over HTTP. No display, no OpenCV window. Perfect for SSH access from your laptop.

### 5.1 Start the Streaming Kiosk Server

```bash
# SSH into RPi (or run on laptop)
ssh pi@192.168.1.50

# Activate venv
source ~/frames_env/bin/activate
cd ~/frames/backend

# Set environment
export DEVICE_ID=1
export BACKEND_URL=http://192.168.1.100:5000

# Option A: Run directly
python rpi/kiosk_server.py

# Option B: Run via uvicorn (more control)
uvicorn rpi.kiosk_server:app --host 0.0.0.0 --port 8000
```

**No `DISPLAY=:0` needed!** This mode doesn't use `cv2.imshow()` at all.

### 5.2 View the Live Feed (From Your Laptop)

Once the streaming server is running, open a browser on your laptop:

| What | URL |
|------|-----|
| **Live MJPEG video feed** | `http://<PI_IP>:8000/video_feed` |
| **Real-time status (WebSocket)** | `ws://<PI_IP>:8000/ws/status` |

For laptop testing:
- Video: `http://localhost:8000/video_feed`
- WebSocket: `ws://localhost:8000/ws/status`

**MJPEG feed** shows the camera with bounding boxes and recognition overlays — just like the UI mode but rendered in your browser.

**WebSocket** broadcasts JSON state updates for integration with the React frontend:

```json
{
    "recognized_user": "Juan Cruz",
    "user_id": 42,
    "confidence": 0.65,
    "gesture_needed": "PEACE_SIGN",
    "active_class": "CPE101 Section A",
    "mode": "WAITING_GESTURE"
}
```

### 5.3 Embed in HTML (Optional)

```html
<!-- View the live feed in any webpage -->
<img src="http://192.168.1.50:8000/video_feed" width="640" height="480" />
```

### 5.4 Headless on Laptop Too

You don't need an RPi — headless mode works on any machine:

```powershell
cd backend
$env:DEVICE_ID = "1"
python rpi/kiosk_server.py
# Open http://localhost:8000/video_feed in browser
```

---

## 6. Running the Test Script

`test_laptop.py` is a lightweight debug tool for verifying recognition quality before deploying the full kiosk.

### 6.1 Basic Usage

```powershell
cd backend

# Laptop mode (InsightFace direct, full resolution)
python rpi/test_laptop.py

# Simulate RPi mode (gated detection, lower det_size)
python rpi/test_laptop.py --rpi
```

### 6.2 Interactive Controls

| Key | Action |
|-----|--------|
| `q` | Quit |
| `d` | Toggle debug overlay (top-3 matches, detection scores) |
| `g` | Enter gesture test mode — 8-second window to show a gesture |

### 6.3 What It Shows

- **Green box + name:** Recognized face with confidence %
- **Red box + "Unknown":** Face detected but no match in cache
- **Debug overlay:** Top-3 matching users with similarity scores, gate hit/miss stats
- **Bottom bar:** FPS, recognition time (ms), model info, threshold

### 6.4 Requirements

- Embedding cache must exist at `backend/rpi/data/embeddings_cache.json`
- Does NOT need the backend server running (offline only, no attendance logging)
- Does NOT need a `DEVICE_ID`

---

## 7. SSH Setup & Connection

### 7.1 Enable SSH on Raspberry Pi

```bash
# On the Pi (via keyboard+monitor, or Raspberry Pi Imager settings)
sudo systemctl enable ssh
sudo systemctl start ssh

# Find Pi's IP address
hostname -I
```

### 7.2 Connect from Laptop

**Windows (PowerShell or Windows Terminal):**
```powershell
ssh pi@192.168.1.50
# Default password: raspberry (change this!)
```

**With SSH key (recommended):**
```powershell
# Generate key (once)
ssh-keygen -t ed25519

# Copy to Pi
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh pi@192.168.1.50 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Now login is passwordless
ssh pi@192.168.1.50
```

### 7.3 Transfer Code to RPi

```powershell
# From your laptop, copy the backend folder to RPi
scp -r .\backend\ pi@192.168.1.50:~/frames/backend/
```

Or use `rsync` for incremental updates:
```bash
rsync -avz --exclude '__pycache__' --exclude '.env' backend/ pi@192.168.1.50:~/frames/backend/
```

### 7.4 The `DISPLAY=:0` Rule

| What you're running | SSH command |
|---------------------|------------|
| **UI mode** (`main_kiosk.py`) | `DISPLAY=:0 python rpi/main_kiosk.py` |
| **Test script** (`test_laptop.py`) | `DISPLAY=:0 python rpi/test_laptop.py` |
| **Headless mode** (`kiosk_server.py`) | `python rpi/kiosk_server.py` (no DISPLAY needed) |

### 7.5 Systemd Auto-Start (Production RPi)

Create a service so the kiosk starts on boot:

```bash
sudo nano /etc/systemd/system/frames-kiosk.service
```

```ini
[Unit]
Description=FRAMES Attendance Kiosk
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/frames/backend
Environment=DISPLAY=:0
Environment=DEVICE_ID=1
Environment=BACKEND_URL=http://192.168.1.100:5000
ExecStart=/home/pi/frames_env/bin/python rpi/main_kiosk.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable frames-kiosk
sudo systemctl start frames-kiosk

# Check status
sudo systemctl status frames-kiosk

# View logs
journalctl -u frames-kiosk -f
```

For headless mode, change `ExecStart` and remove the `Environment=DISPLAY=:0` line:
```ini
ExecStart=/home/pi/frames_env/bin/python rpi/kiosk_server.py
```

---

## 8. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEVICE_ID` | **Yes** | — | Integer. Device row ID from `devices` table. Get via `setup_laptop_device.py` |
| `BACKEND_URL` | No | `http://localhost:5000` | Backend API URL. Set to laptop IP when running on RPi |
| `DEVICE_ROOM` | No | From DB | Override room assignment |
| `FRAMES_PLATFORM` | No | Auto-detected | Force `"rpi"` or `"laptop"` (overrides CPU architecture detection) |

### Setting All at Once

**PowerShell (Windows laptop):**
```powershell
$env:DEVICE_ID = "1"
$env:BACKEND_URL = "http://localhost:5000"
$env:FRAMES_PLATFORM = "laptop"
```

**Bash (RPi / Linux):**
```bash
export DEVICE_ID=1 BACKEND_URL=http://192.168.1.100:5000 FRAMES_PLATFORM=rpi
```

---

## 9. Configuration Reference

All tuning lives in `backend/rpi/config.py` → `KioskConfig` dataclass. Platform-specific defaults are auto-applied.

### Camera Settings

| Setting | Laptop | RPi | Notes |
|---------|--------|-----|-------|
| `CAMERA_INDEX` | 0 | 0 | 0 = default USB webcam. Change if multiple cameras |
| `CAMERA_WIDTH` | 640 | 480 | Lower on RPi for speed |
| `CAMERA_HEIGHT` | 480 | 360 | |
| `CAMERA_FPS` | 30 | 15 | |
| `USE_PICAMERA2` | False | True | Pi Camera V2 on Bookworm requires picamera2 |

### Recognition Settings

| Setting | Laptop | RPi | Notes |
|---------|--------|-----|-------|
| `INSIGHTFACE_MODEL` | `buffalo_l` | `buffalo_l` | **Must match enrollment model** |
| `RECOGNITION_DET_SIZE` | (640,640) | (320,320) | Smaller = faster but less accurate detection |
| `USE_GATED_DETECTION` | False | True | MediaPipe gate before InsightFace |
| `RECOGNITION_FRAME_SKIP` | 1 | 5 | Process every Nth frame (1 = every frame) |
| `MATCH_THRESHOLD` | 0.35 | 0.35 | Cosine similarity cutoff. Lower = more lenient |
| `MIN_FACE_SIZE_PX` | 80 | 80 | Ignore faces smaller than this |

### Gesture Settings

| Setting | Default | Notes |
|---------|---------|-------|
| `GESTURE_CONFIDENCE` | 0.5 | MediaPipe hand detection confidence |
| `GESTURE_CONSECUTIVE_FRAMES` | 3 | Must see gesture for N frames to confirm |
| `GESTURE_TIMEOUT_SECONDS` | 8.0 | Time to show gesture before timeout |
| `REQUIRE_GESTURE_FOR_ENTRY` | False | ENTRY is face-only (no gesture needed) |
| `REQUIRE_GESTURE_FOR_EXIT` | True | Break/exit require gestures |

### Attendance / Timing

| Setting | Default | Notes |
|---------|---------|-------|
| `COOLDOWN_SECONDS` | 10 | Prevent duplicate scans within this window |
| `LATE_THRESHOLD_MINUTES` | 15 | Mark ENTRY as late after this many minutes past class start |
| `CACHE_REFRESH_MINUTES` | 30 | Re-sync embeddings from file every N minutes |

### Gesture-to-Action Mapping

| Gesture | Hand Sign | Attendance Action |
|---------|-----------|-------------------|
| — (face only) | Just show your face | **ENTRY** |
| ✌️ Peace Sign | Two fingers up | **BREAK_OUT** |
| 👍 Thumbs Up | Thumb extended up | **BREAK_IN** |
| 🖐 Open Palm | All five fingers spread | **EXIT** |

---

## 10. Troubleshooting

### "DEVICE_ID not set!"

```
ERROR | DEVICE_ID not set! Set via environment variable.
```

**Fix:** Set the environment variable or use CLI args:
```powershell
$env:DEVICE_ID = "1"
# or
python rpi/main_kiosk.py --device-id 1
```

If you don't have a device ID yet, register one:
```powershell
cd backend
python scripts/setup_laptop_device.py
```

---

### "No cache found" / "No enrolled faces in cache!"

```
⚠️ No cache found at rpi/data/embeddings_cache.json
```

**Fix:** Export embeddings from the database:
```powershell
cd backend
python scripts/export_embeddings.py
```

Make sure at least one user has enrolled their face via the web app first.

---

### "Failed to open camera!"

```
❌ Failed to open camera!
```

**Laptop fixes:**
- Check no other app is using the camera (close Zoom, Teams, etc.)
- Try a different camera index: `python rpi/main_kiosk.py --camera 1`
- On Windows, make sure camera privacy settings allow Python

**RPi fixes:**
- Pi Camera: `sudo apt install python3-picamera2`
- Verify camera: `libcamera-hello --timeout 2000`
- USB webcam: `ls /dev/video*` — should show `/dev/video0`
- Make sure venv was created with `--system-site-packages`

---

### "cannot connect to display" (SSH)

```
error: (-2:Unspecified error) The function is not implemented. Rebuild the library with GTK+ support
```
or
```
cannot open display
```

**Fix:** You're running UI mode via SSH without routing to the display.

Option A — Route to Pi's display:
```bash
export DISPLAY=:0
python rpi/main_kiosk.py
```

Option B — Use headless mode instead (recommended for SSH):
```bash
python rpi/kiosk_server.py
# View at http://<PI_IP>:8000/video_feed
```

---

### "Everyone shows as Unknown"

**Root cause:** Enrollment and recognition are using different InsightFace models.

**Fix:** Both enrollment (web app) and recognition (kiosk) MUST use `buffalo_l`. Verify:
- `config.INSIGHTFACE_MODEL` is `"buffalo_l"` (check `rpi/config.py`)
- Face enrollment on the web app used the same model
- Re-export embeddings after confirming: `python scripts/export_embeddings.py`

---

### Slow Recognition on RPi (< 2 FPS)

**Expected:** 3-4 FPS during active recognition on RPi4.

**If slower:**
1. Ensure gated detection is ON: `config.USE_GATED_DETECTION = True`
2. Increase frame skip: `config.RECOGNITION_FRAME_SKIP = 8`
3. Lower det_size: `config.RECOGNITION_DET_SIZE = (256, 256)`
4. Ensure nothing else is running: `htop`

---

### Backend API Unreachable from RPi

```
WARNING | API request failed: ConnectionError
```

**Fix:**
1. Check backend is running on laptop: `http://localhost:5000/api/health`
2. Find your laptop's local IP: `ipconfig` (Windows) or `hostname -I` (Linux)
3. Set correct URL on RPi: `export BACKEND_URL=http://192.168.1.100:5000`
4. Make sure laptop's firewall allows port 5000 inbound
5. Verify both devices are on the same network/WiFi

**Windows Firewall (allow port 5000):**
```powershell
New-NetFirewallRule -DisplayName "FRAMES Backend" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

---

### Gesture Not Detected

- Hold your hand steady, close to the camera (within 1 meter)
- Ensure good lighting on your hand
- Gesture must be held for 3 consecutive frames (~0.5 seconds)
- Use the test mode: press `g` in `test_laptop.py` for an 8-second gesture test
- Lower `GESTURE_CONFIDENCE` to 0.4 if detection is inconsistent

---

### Offline Mode / Attendance Not Logging

When the backend is unreachable, attendance is queued to `rpi/data/offline_attendance.json`. It auto-flushes when connectivity returns. You'll see:

```
WARNING | OFFLINE | Queued attendance for user 42 (queue size: 3)
INFO    | OFFLINE | Flushed 3 queued records to backend
```

---

## 11. Quick Reference Cheat Sheet

### Scenario A: Laptop Development (With UI)

```powershell
# Terminal 1 — Backend
cd backend
python main.py

# Terminal 2 — Kiosk
cd backend
$env:DEVICE_ID = "1"
python rpi/main_kiosk.py
```

### Scenario B: Laptop Development (Headless)

```powershell
# Terminal 1 — Backend
cd backend
python main.py

# Terminal 2 — Streaming Kiosk
cd backend
$env:DEVICE_ID = "1"
python rpi/kiosk_server.py

# Terminal 3 (or browser) — View feed
# Open: http://localhost:8000/video_feed
```

### Scenario C: RPi via SSH (Headless — Recommended)

```bash
# On your laptop: start backend
cd backend && python main.py

# SSH into RPi
ssh pi@192.168.1.50

# On RPi:
source ~/frames_env/bin/activate
cd ~/frames/backend
export DEVICE_ID=1
export BACKEND_URL=http://192.168.1.100:5000  # Laptop IP
python rpi/kiosk_server.py

# On your laptop browser:
# http://192.168.1.50:8000/video_feed
```

### Scenario D: RPi via SSH (UI on Pi's Screen)

```bash
# SSH into RPi
ssh pi@192.168.1.50

# On RPi:
source ~/frames_env/bin/activate
cd ~/frames/backend
export DEVICE_ID=1
export BACKEND_URL=http://192.168.1.100:5000
DISPLAY=:0 python rpi/main_kiosk.py

# OpenCV window appears on Pi's 7" display (not SSH terminal)
```

### Scenario E: Quick Recognition Test (No Backend Needed)

```powershell
cd backend
python rpi/test_laptop.py        # Laptop mode
python rpi/test_laptop.py --rpi  # Simulate RPi mode
```

### One-Liner Quick Start (Laptop)

```powershell
cd backend; $env:DEVICE_ID="1"; python rpi/main_kiosk.py
```

---

## File Reference

| File | Purpose |
|------|---------|
| `backend/rpi/main_kiosk.py` | **UI mode** — full kiosk with OpenCV window |
| `backend/rpi/kiosk_server.py` | **Headless mode** — FastAPI + MJPEG + WebSocket |
| `backend/rpi/test_laptop.py` | **Test mode** — debug recognition quality |
| `backend/rpi/config.py` | All configuration settings (auto-detects platform) |
| `backend/rpi/camera.py` | Camera abstraction (picamera2 / OpenCV fallback) |
| `backend/rpi/face_detector.py` | MediaPipe BlazeFace (fast gate) |
| `backend/rpi/face_recognizer.py` | InsightFace buffalo_l (embedding extraction) |
| `backend/rpi/gesture_detector.py` | MediaPipe Hands (peace/thumbs/palm detection) |
| `backend/rpi/embedding_cache.py` | In-memory embedding store + cosine similarity |
| `backend/rpi/schedule_resolver.py` | Fetches active class from backend API |
| `backend/rpi/attendance_logger.py` | POSTs attendance + offline queue |
| `backend/rpi/metrics_collector.py` | Performance metrics logging |
| `backend/rpi/data/embeddings_cache.json` | Exported face embeddings for offline matching |
| `backend/rpi/data/schedule_cache.json` | Cached class schedule |
| `backend/rpi/data/offline_attendance.json` | Queued attendance records (network failures) |
| `backend/scripts/setup_laptop_device.py` | Register device in DB (get DEVICE_ID) |
| `backend/scripts/export_embeddings.py` | Export facial embeddings to JSON cache |
| `backend/rpi/requirements-rpi.txt` | RPi-specific pip dependencies |

---

> **Last updated:** February 27, 2026
