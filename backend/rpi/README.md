# FRAMES — Raspberry Pi Kiosk Setup Guide (kiosk_server.py)

## What Is This?

This is the **face recognition attendance kiosk** that runs on a Raspberry Pi in the classroom. It runs a **FastAPI streaming server** (`kiosk_server.py`) that:
- Streams live camera video via MJPEG at `/video_feed`
- Broadcasts recognition state via WebSocket at `/ws`
- Recognizes faces, prompts gestures, and logs attendance to the backend

Your React frontend connects to this server to display the kiosk UI.

---

## Quick Reference: Two Scenarios

| Scenario | What To Do | Jump To |
|----------|-----------|---------|
| **First time ever** — brand new RPi, no OS installed | Full setup from scratch | [PHASE 1: Flash OS](#phase-1-flash-raspberry-pi-os-do-this-on-your-laptop) |
| **Re-setup** — RPi already has OS + packages, you just need to redeploy code | Copy files + run | [RE-SETUP: Quick Redeploy](#re-setup-quick-redeploy-guide) |
| **Forgot IP / Can't SSH** | Find your Pi on the network | [Finding Your Pi's IP](#finding-your-pis-ip-address) |

---

## Terminology

| Term | What It Actually Is | Used For |
|------|-------------------|----------|
| **"Laptop"** | Your Windows dev machine | Development, coding, running the backend server, face enrollment |
| **"Kiosk" / "RPi"** | Raspberry Pi 4 + Camera V2 + 7" HDMI display | Classroom face recognition + gesture detection + attendance logging |

```
YOUR LAPTOP (development)              KIOSK (classroom)
┌──────────────────────┐               ┌──────────────────────┐
│  Windows PC          │               │  Raspberry Pi 4      │
│  - Run backend API   │               │  + Camera V2 (8MP)   │
│  - Run React frontend│   WiFi/LAN    │  + 7" HDMI display   │
│  - Enroll faces      │◄────────────►│                      │
│  - View dashboard    │               │  Runs kiosk_server.py│
│                      │               │  → Streams video     │
│  Backend: port 8000  │               │  → Recognizes faces  │
│  Frontend: port 5173 │               │  → WebSocket state   │
│                      │               │  → Logs attendance   │
│                      │               │  kiosk_server: :8000 │
└──────────────────────┘               └──────────────────────┘
```

---

## Your Known Info

| Detail | Value |
|--------|-------|
| RPi username | `emma` |
| RPi password | `12345` |
| RPi IP | `192.168.68.56` (as of 2026-02-28, may change) |
| Backend API port | `8000` (on your laptop) |
| Kiosk server port | `8000` (on the RPi) |

---

## Finding Your Pi's IP Address

Your RPi gets its IP from the WiFi router (DHCP), so it can change. Here's how to find it:

### Method 1: From the Pi Directly (if you have keyboard + display connected)
```bash
hostname -I
```
This prints something like `192.168.1.105`.

### Method 2: From Your Laptop (scan the network)

Open PowerShell on your laptop:

```powershell
# Option A: If you know your network range (e.g., 192.168.1.x)
# This pings every address and checks which ones respond
1..254 | ForEach-Object { $ip = "192.168.1.$_"; if (Test-Connection -ComputerName $ip -Count 1 -Quiet -TimeoutSeconds 1) { Write-Host "$ip is alive" } }
```

Or more targeted — check common ranges:
```powershell
# Try to connect via SSH to common IPs (whichever works is your Pi)
# Replace 192.168.1 with YOUR network prefix
ssh emma@192.168.1.100
# If "Connection refused" → wrong IP, try next
# If "Connection timed out" → wrong IP, try next
# If "password:" prompt → FOUND IT
```

### Method 3: Check Your Router's Admin Page
1. Open your browser → go to `192.168.1.1` or `192.168.0.1` (your router's admin page)
2. Log in (check the sticker on your router for credentials)
3. Look for "Connected Devices" or "DHCP Clients"
4. Find the device named `raspberrypi` — its IP is listed there

### Method 4: Use `arp` After Pinging
```powershell
# First, ping the broadcast address to populate the ARP table
ping 192.168.1.255
# Then check the ARP table for Raspberry Pi MAC addresses (start with b8:27:eb or dc:a6:32 or e4:5f:01)
arp -a
```

**Once you find the IP, write it down.** You'll need it throughout this guide. We'll call it `<PI_IP>` everywhere below.

---

## RE-SETUP: Quick Redeploy Guide

**Use this if your RPi already has the OS, Python, and packages installed** (you set it up before but forgot the details). This is the fast path.

### Step 1: SSH Into Your Pi

From your laptop's PowerShell:
```powershell
ssh emma@<PI_IP>
```
Password: `12345`

If you get a HOST KEY warning/error:
```powershell
# Clear old cached key first, then retry
ssh-keygen -R <PI_IP>
ssh emma@<PI_IP>
```

### Step 2: Find Your Existing Setup

Your packages might be in `~/frames`, `~/frames_env`, or somewhere else. Let's find out:
```bash
# Check common locations
ls ~/frames/ 2>/dev/null && echo "Found ~/frames/"
ls ~/frames_env/ 2>/dev/null && echo "Found ~/frames_env/"

# Search for venv directories (Python virtual environments)
find ~ -name "activate" -path "*/bin/activate" 2>/dev/null

# Search for our kiosk code
find ~ -name "kiosk_server.py" 2>/dev/null
find ~ -name "embeddings_cache.json" 2>/dev/null
```

This will tell you **exactly** where things are. Note the paths.

### Step 3: Activate the Virtual Environment

Based on what you found in Step 2:
```bash
# If venv is at ~/frames/venv:
source ~/frames/venv/bin/activate

# If venv is at ~/frames_env:
source ~/frames_env/bin/activate
```

The prompt should change to show `(venv)` or `(frames_env)`.

Verify packages are installed:
```bash
python -c "import cv2; import mediapipe; import insightface; import fastapi; import uvicorn; print('All packages OK')"
```

**If it says "All packages OK"** → skip to Step 5.

**If any import fails** → install the missing packages:
```bash
pip install -r ~/frames/rpi/requirements-rpi.txt
# Or if files are elsewhere, navigate there first
```

### Step 4: Copy Updated Code From Your Laptop

On **your laptop** (new PowerShell window, NOT the SSH session):
```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend

# Copy all kiosk code to the Pi
scp -r rpi emma@<PI_IP>:~/frames/

# Copy scripts (for export_embeddings.py)
scp -r scripts emma@<PI_IP>:~/frames/
```

Password: `12345`

**WATCH OUT:** `scp -r rpi` (no trailing backslash) copies the `rpi/` folder. If you use `rpi\`, it may create `rpi/rpi/` nested inside.

### Step 5: Export Fresh Embeddings (on your laptop)

On **your laptop** — make sure your backend is running first:
```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
.\venv\Scripts\activate
python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json
```

Then copy the fresh JSON to the Pi:
```powershell
scp rpi\data\embeddings_cache.json emma@<PI_IP>:~/frames/rpi/data/
```

### Step 6: Set Environment Variables and Run

Back in your **SSH session** on the Pi:
```bash
cd ~/frames
source ~/frames/venv/bin/activate  # or wherever your venv is

# Set required environment variables
export DEVICE_ID=1
export BACKEND_URL=http://<YOUR_LAPTOP_IP>:8000
export DEVICE_ROOM=CL1

# Run the kiosk server
python rpi/kiosk_server.py
```

**Replace `<YOUR_LAPTOP_IP>`** with your laptop's IP (run `ipconfig` on your laptop, find your WiFi IPv4 address).

You should see:
```
INFO | Kiosk server starting...
INFO | Loaded X embeddings from cache
INFO | Uvicorn running on http://0.0.0.0:8000
```

### Step 7: Verify It Works

From your laptop browser, go to:
```
http://<PI_IP>:8000/video_feed
```

You should see the live camera stream. If you see it → the kiosk is working.

Your React frontend can now connect to `http://<PI_IP>:8000/ws` for WebSocket state updates.

---

## PHASE 1: Flash Raspberry Pi OS (Do This on Your Laptop)

**Skip this if your RPi already has an OS installed.** This is only for a brand new setup.

### Step 1.1 — Download Raspberry Pi Imager

1. On your laptop, go to: **https://www.raspberrypi.com/software/**
2. Download and install "Raspberry Pi Imager" for Windows

### Step 1.2 — Flash the OS

1. Insert your microSD card into your laptop (via card reader)
2. Open **Raspberry Pi Imager**
3. **Choose Device** → Raspberry Pi 4
4. **Choose OS** → **Raspberry Pi OS (64-bit)** ← MUST be 64-bit
5. **Choose Storage** → your microSD card
6. Click the **gear icon (⚙️)** or **Edit Settings** BEFORE clicking Next:

   **General tab:**
   - ✅ Hostname: `raspberrypi`
   - ✅ Username: `emma`
   - ✅ Password: `12345`
   - ✅ WiFi SSID: (your WiFi network name)
   - ✅ WiFi Password: (your WiFi password)
   - ✅ Country: `PH`
   - ✅ Timezone: `Asia/Manila`

   **Services tab:**
   - ✅ Enable SSH → Use password authentication

7. Click **Save** → **Next** → **Yes** (apply settings) → **Yes** (erase card)
8. Wait 5-10 minutes for the flash to complete
9. Safely eject the SD card

---

## PHASE 2: Hardware Assembly

### Camera Connection (Pi Camera V2)

The camera connects via a **flat flex cable** to the **CSI port** on the Pi (between HDMI and Ethernet ports).

1. Gently pull UP the plastic clip on the CSI port (lifts ~2mm)
2. Insert the flex cable: **blue side faces Ethernet port**, **silver contacts face HDMI ports**
3. Push the plastic clip back DOWN to lock
4. Gently tug to confirm it's secure

### Display Connection (7" HDMI)

Two cables:
1. **HDMI cable** → Pi's **HDMI 0** (closest to USB-C power) to display
2. **USB cable** → any Pi USB port to display (provides touch + power)

> RPi4 has **micro-HDMI** ports. You likely need a micro-HDMI to full-HDMI adapter.

### Power On

1. Insert the flashed microSD card (bottom of Pi, contacts facing up)
2. Plug in USB-C power (5V/3A minimum)
3. Wait 1-2 minutes for first boot

---

## PHASE 3: First Boot + SSH Connection

### Step 3.1 — Wait for Boot

The 7" display should show the Raspberry Pi desktop after 1-2 minutes.

### Step 3.2 — Find the Pi's IP

On the Pi's terminal (click the terminal icon on the desktop taskbar):
```bash
hostname -I
```
Write down the IP address (e.g., `192.168.1.105`).

### Step 3.3 — SSH From Your Laptop

On your laptop's PowerShell:
```powershell
ssh emma@<PI_IP>
```

- First time it asks "Are you sure?" → type `yes`
- Password: `12345`
- You should see: `emma@raspberrypi:~ $`

### Step 3.4 — Verify Camera Works

```bash
libcamera-still -o test_photo.jpg
```

If it works → camera is connected correctly.
If it fails → power off, flip the camera cable, power on, try again.

### Step 3.5 — Verify Internet

```bash
ping google.com -c 3
```

Should show response times. If not → connect to WiFi via the desktop taskbar WiFi icon.

### Step 3.6 — Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

This takes 5-15 minutes. Let it finish.

---

## PHASE 4: Install Python Dependencies

### Step 4.1 — Install System Packages

```bash
sudo apt install -y python3-pip python3-venv python3-opencv python3-picamera2 libatlas-base-dev libopenblas-dev libhdf5-dev libjpeg-dev libpng-dev
```

### Step 4.2 — Create Project Folder + Virtual Environment

The `--system-site-packages` flag is **required** so `picamera2` and system OpenCV are accessible:
```bash
mkdir -p ~/frames/rpi/data
cd ~/frames
python3 -m venv --system-site-packages venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
```

### Step 4.3 — Install Python Packages

**DO NOT `pip install numpy` (without version) or `pip install opencv-python`.**
- numpy 2.x breaks picamera2
- pip's opencv-python crashes on `cv2.imshow` (no GTK)

Install in this order:
```bash
pip install numpy==1.26.4
pip install mediapipe==0.10.14
pip install requests
pip install onnxruntime>=1.16.0
pip install insightface>=0.7.3
pip install fastapi uvicorn[standard] python-multipart websockets
```

### Step 4.4 — Verify Everything

```bash
python -c "import cv2; print('OpenCV:', cv2.__version__)"
python -c "import mediapipe; print('MediaPipe OK')"
python -c "import onnxruntime; print('ONNX Runtime:', onnxruntime.__version__)"
python -c "import insightface; print('InsightFace OK')"
python -c "import numpy; print('NumPy:', numpy.__version__)"
python -c "from picamera2 import Picamera2; print('Picamera2 OK')"
python -c "import fastapi; import uvicorn; print('FastAPI + Uvicorn OK')"
```

All 7 should print without errors. NumPy should show **1.26.4**.

> You may see `GPU device discovery failed` — harmless (RPi4 has no discrete GPU).

---

## PHASE 5: Deploy Kiosk Code

### Step 5.1 — Copy Code From Laptop

On **your laptop** (PowerShell, NOT the SSH session):
```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend

# Copy kiosk package
scp -r rpi emma@<PI_IP>:~/frames/

# Copy scripts (for export_embeddings.py)
scp -r scripts emma@<PI_IP>:~/frames/
```

### Step 5.2 — Verify Files on Pi

In your SSH session:
```bash
ls ~/frames/rpi/
```

Expected:
```
__init__.py  attendance_logger.py  camera.py  config.py  data/
embedding_cache.py  face_detector.py  face_recognizer.py
gesture_detector.py  kiosk_server.py  liveness_challenge.py
main_kiosk.py  metrics_collector.py  requirements-rpi.txt
schedule_resolver.py  test_laptop.py
```

### Step 5.3 — Export and Copy Embeddings

On **your laptop** (make sure the backend server is running):
```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
.\venv\Scripts\activate
python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json
```

Then copy to Pi:
```powershell
scp rpi\data\embeddings_cache.json emma@<PI_IP>:~/frames/rpi/data/
```

### Step 5.4 — Verify Embeddings

In SSH:
```bash
python -c "import json; data=json.load(open('/home/emma/frames/rpi/data/embeddings_cache.json')); print(f'Loaded {len(data.get(\"embeddings\",[]))} enrolled faces')"
```

---

## PHASE 6: Register Device in Backend

Your kiosk needs a row in the `devices` table. Add this via your admin dashboard or directly in the database:

| Column | Value | Notes |
|--------|-------|-------|
| `id` | `1` | Unique device ID |
| `room` | `"CL1"` | Classroom room code |
| `device_name` | `"KIOSK-CL1"` | Friendly name |
| `status` | `"ACTIVE"` | Must be active |

---

## PHASE 7: Run the Kiosk Server

### Step 7.1 — Start Your Backend (on laptop)

```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
.\venv\Scripts\activate
python main.py
```

Find your laptop's IP:
```powershell
ipconfig
```
Look for your WiFi adapter's **IPv4 Address** (e.g., `192.168.1.100`).

### Step 7.2 — Start the Kiosk Server (on Pi via SSH)

```bash
cd ~/frames
source venv/bin/activate

# Set environment variables
export DEVICE_ID=1
export BACKEND_URL=http://<YOUR_LAPTOP_IP>:8000
export DEVICE_ROOM=CL1

# Run the streaming kiosk server
python rpi/kiosk_server.py
```

**What you should see:**
```
INFO     | FRAMES Kiosk Server initializing...
INFO     | Loaded XX embeddings from cache
INFO     | Uvicorn running on http://0.0.0.0:8000
```

The kiosk server is now running on **port 8000** of the Pi.

### Step 7.3 — Verify From Your Laptop

Open your browser:
```
http://<PI_IP>:8000/video_feed
```

You should see the live camera stream with face detection annotations.

Your React frontend can connect WebSocket to `ws://<PI_IP>:8000/ws` for real-time state updates.

> **First run downloads the InsightFace model** (~280MB). This is a one-time download that takes 2-5 minutes. It saves to `~/.insightface/models/buffalo_l/` and won't download again.

---

## PHASE 8: Auto-Start on Boot (Optional)

So the kiosk starts automatically when the Pi powers on:

### Step 8.1 — Create Startup Script

```bash
nano ~/frames/start_kiosk.sh
```

Paste:
```bash
#!/bin/bash
cd ~/frames
source venv/bin/activate
export DEVICE_ID=1
export BACKEND_URL=http://<YOUR_LAPTOP_IP>:8000
export DEVICE_ROOM=CL1
python rpi/kiosk_server.py
```

Save (Ctrl+O → Enter → Ctrl+X) and make executable:
```bash
chmod +x ~/frames/start_kiosk.sh
```

### Step 8.2 — Create Systemd Service

```bash
sudo nano /etc/systemd/system/frames-kiosk.service
```

Paste:
```ini
[Unit]
Description=FRAMES Kiosk Streaming Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=emma
WorkingDirectory=/home/emma/frames
ExecStart=/home/emma/frames/start_kiosk.sh
Restart=on-failure
RestartSec=10
Environment=DISPLAY=:0

[Install]
WantedBy=multi-user.target
```

Save and enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable frames-kiosk.service
```

### Service Commands

```bash
sudo systemctl start frames-kiosk     # Start now
sudo systemctl stop frames-kiosk      # Stop
sudo systemctl restart frames-kiosk   # Restart
sudo systemctl status frames-kiosk    # Check status
journalctl -u frames-kiosk -f         # View live logs
```

---

## How the Recognition Pipeline Works

```
Camera captures frame
       │
       ▼
Frame Skip: process every Nth frame (saves CPU)
       │
       ▼
Stage 1: MediaPipe BlazeFace (~30ms)
├── No face found? → Skip, back to camera (only ~30ms wasted)
└── Face found + big enough (>80px)?
       │
       ▼
Stage 2: InsightFace buffalo_l via ONNX Runtime (~200ms)
├── Extracts 512-d face embedding
├── Cosine similarity vs enrolled faces
├── Match ≥ 0.35? → Recognized!
└── Match < 0.35? → Unknown
       │
       ▼
Stage 3: Action Resolution
├── ENTRY → Face-only, logged immediately
└── BREAK_OUT / BREAK_IN / EXIT → Gesture required:
    ├── ✌️  Peace sign → BREAK_OUT
    ├── 👍  Thumbs up  → BREAK_IN
    └── 🖐  Open palm  → EXIT
       │
       ▼
Log attendance → POST to backend API → Dashboard updates
       └── If network fails → saved to offline queue, synced later
```

---

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DEVICE_ID` | **Yes** | `0` (fails) | This kiosk's device ID in the database |
| `BACKEND_URL` | **Yes** | `http://localhost:5000` | Your laptop's backend API URL |
| `DEVICE_ROOM` | Recommended | `None` | Room code (e.g., `CL1`) |
| `OMP_NUM_THREADS` | No | `4` (auto-set) | ONNX Runtime CPU threads |
| `FRAMES_PLATFORM` | No | Auto-detected | Force `RPI` or `LAPTOP` mode |

---

## Updating Enrolled Faces

After enrolling new faces on the web frontend, the kiosk **does not** auto-detect them. You must:

### 1. Re-export (on laptop)
```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
.\venv\Scripts\activate
python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json
```

### 2. Copy to Pi
```powershell
scp rpi\data\embeddings_cache.json emma@<PI_IP>:~/frames/rpi/data/
```

### 3. Restart the Kiosk
```bash
sudo systemctl restart frames-kiosk
# Or if running manually: Ctrl+C and re-run python rpi/kiosk_server.py
```

---

## Troubleshooting

### SSH Issues

| Problem | Fix |
|---------|-----|
| "Connection timed out" | Wrong IP — see [Finding Your Pi's IP](#finding-your-pis-ip-address) |
| "Connection refused" | SSH not enabled — run `sudo raspi-config` → Interface Options → SSH on Pi directly |
| "HOST KEY MISMATCH" | `ssh-keygen -R <OLD_IP>` on your laptop, then retry |
| "Permission denied" | Wrong password — it's `12345` (password doesn't show as you type) |

### Camera Issues

| Problem | Fix |
|---------|-----|
| Camera not detected | Cable might be backwards — blue side faces Ethernet port |
| Empty/black frames | Install `python3-picamera2`, recreate venv with `--system-site-packages` |
| `libcamera-still` fails | `sudo raspi-config` → Interface Options → Camera → Enable → reboot |

### Python / Package Errors

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | `pip install fastapi uvicorn[standard]` (venv must be active) |
| `numpy.dtype size changed` | Wrong NumPy version: `pip install numpy==1.26.4` |
| `cv2.imshow` crashes (GTK error) | `pip uninstall opencv-python opencv-python-headless -y` (use system OpenCV) |
| `No module named 'picamera2'` | `sudo apt install python3-picamera2` + venv needs `--system-site-packages` |
| InsightFace model download hangs | First run downloads ~280MB — be patient on slow WiFi |

### Kiosk Server Issues

| Problem | Fix |
|---------|-----|
| "DEVICE_ID required" | Set env: `export DEVICE_ID=1` before running |
| "Address already in use" (port 8000) | Another process is using port 8000: `sudo lsof -i :8000` then `kill <PID>` |
| Can't reach backend | Check `BACKEND_URL` uses your laptop's actual IP, not `localhost` |
| Video feed loads but no faces recognized | Check `embeddings_cache.json` isn't empty — re-export from laptop |
| Attendance not showing on dashboard | Verify backend is running on laptop + both devices on same WiFi |

### Harmless Warnings (Ignore These)

| Warning | Why | Impact |
|---------|-----|--------|
| `GPU device discovery failed` | ONNX checks for discrete GPU, RPi4 has none | None — uses CPU |
| `Error in cpuinfo: prctl(PR_SVE_GET_VL) failed` | MediaPipe checks for ARM SVE, RPi4 doesn't support it | None |
| `inference_feedback_manager.cc: single signature` | MediaPipe internal TFLite message | None |
| `WARN RPiSdn: Using legacy SDN tuning` | libcamera spatial denoise config | None |

---

## File Structure

```
~/frames/                              (on Raspberry Pi)
├── venv/                              # Python virtual environment
├── start_kiosk.sh                     # Auto-start script (Phase 8)
├── rpi/                               # Kiosk code
│   ├── kiosk_server.py               # ★ Main entry point — FastAPI streaming server
│   ├── config.py                      # Auto-detects RPi vs laptop, all settings
│   ├── camera.py                      # Camera (picamera2 on RPi, OpenCV on laptop)
│   ├── face_detector.py              # MediaPipe BlazeFace — fast face gate
│   ├── face_recognizer.py            # InsightFace buffalo_l — 512-d embeddings
│   ├── gesture_detector.py           # MediaPipe Hands — peace/thumbs/palm
│   ├── embedding_cache.py            # JSON cache loader + batch cosine matching
│   ├── schedule_resolver.py          # Room-based class schedule lookup (API)
│   ├── attendance_logger.py          # Backend API + offline queue
│   ├── metrics_collector.py          # Performance metrics
│   ├── liveness_challenge.py         # Finger-count challenge (available, not active)
│   ├── main_kiosk.py                 # Alternate: standalone OpenCV window (not used)
│   ├── test_laptop.py                # Debug/test script
│   ├── requirements-rpi.txt          # pip dependencies
│   └── data/
│       ├── embeddings_cache.json     # Exported face embeddings
│       ├── offline_attendance.json   # Queued when backend offline
│       └── schedule_cache.json       # Cached class schedule
│
└── scripts/
    └── export_embeddings.py           # DB → JSON embedding export
```

---

## API Endpoints (What the Kiosk Talks To)

### Kiosk Server Endpoints (on RPi, port 8000)

| Endpoint | Type | Purpose |
|----------|------|---------|
| `/video_feed` | GET (MJPEG) | Live annotated camera stream for React UI |
| `/ws` | WebSocket | Real-time recognition state (user, gesture, action) |

### Backend Endpoints (on laptop, port 8000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/kiosk/active-class?device_id=X` | GET | Current active class for this room |
| `/api/kiosk/schedule?device_id=X` | GET | Weekly schedule for this room |
| `/api/kiosk/attendance/log` | POST | Log an attendance event |
| `/api/kiosk/attendance-state` | GET | Get student's current attendance state |
| `/api/kiosk/device/{id}/heartbeat` | POST | Kiosk health heartbeat |

---

## Configuration Reference

All settings auto-detect RPi vs laptop. No manual changes needed:

| Setting | Laptop | RPi | Purpose |
|---------|:------:|:---:|---------|
| `RECOGNITION_DET_SIZE` | (640,640) | (160,160) | Smaller = faster detection |
| `USE_GATED_DETECTION` | OFF | ON | MediaPipe pre-filter |
| `RECOGNITION_FRAME_SKIP` | 1 | 5 | Reduce CPU by skipping frames |
| `CAMERA_WIDTH × HEIGHT` | 640×480 | 480×360 | Lower = less processing |
| `CAMERA_FPS` | 30 | 15 | Lower = less CPU |
| `USE_PICAMERA2` | OFF | ON | Pi Camera V2 support |
| `MATCH_THRESHOLD` | 0.35 | 0.35 | Cosine similarity threshold |
| `COOLDOWN_SECONDS` | 10 | 10 | Prevent duplicate scans |
| `OMP_NUM_THREADS` | 4 | 4 | ONNX Runtime CPU threads |

---

## Quick Command Cheat Sheet

```bash
# SSH in
ssh emma@<PI_IP>                       # password: 12345

# Navigate + activate
cd ~/frames; source venv/bin/activate

# Set env + run kiosk server
export DEVICE_ID=1 BACKEND_URL=http://<LAPTOP_IP>:8000 DEVICE_ROOM=CL1
python rpi/kiosk_server.py

# Service commands (if auto-start is set up)
sudo systemctl start frames-kiosk
sudo systemctl stop frames-kiosk
sudo systemctl restart frames-kiosk
sudo systemctl status frames-kiosk
journalctl -u frames-kiosk -f          # live logs

# Check what's running on port 8000
sudo lsof -i :8000

# Find Pi's IP
hostname -I

# Check disk/memory
df -h
free -h
```
