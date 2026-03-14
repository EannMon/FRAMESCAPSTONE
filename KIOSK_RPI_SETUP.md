# FRAMES Kiosk — Raspberry Pi Setup Guide

Complete guide to setting up the FRAMES attendance kiosk on a Raspberry Pi 4, with camera feed on the left and status sidebar (time, gestures, check-ins) on the right.

---

## Prerequisites

| Item | Details |
|---|---|
| **Hardware** | Raspberry Pi 4 (4GB+ RAM recommended) |
| **Camera** | Pi Camera V2 (CSI) or USB webcam |
| **OS** | Raspberry Pi OS Bookworm 64-bit |
| **Python** | 3.11+ (comes with Bookworm) |
| **Network** | Wi-Fi or Ethernet (to reach backend API) |
| **Display** | HDMI monitor or touchscreen (for kiosk UI) |

---

## Step 1 — Install System Dependencies

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  python3-picamera2 python3-opencv python3-venv \
  libatlas-base-dev libopenblas-dev libhdf5-dev \
  chromium-browser
```

> [!IMPORTANT]
> **Do NOT `pip install opencv-python` or `pip install picamera2`.**  
> They must come from `apt` — pip versions lack GTK/libcamera support and will crash.

---

## Step 2 — Create Python Virtual Environment

```bash
# Create venv WITH system packages (for picamera2 + opencv)
python3 -m venv --system-site-packages ~/frames_env
source ~/frames_env/bin/activate
```

Add to `~/.bashrc` for auto-activation:
```bash
echo "source ~/frames_env/bin/activate" >> ~/.bashrc
```

---

## Step 3 — Clone Project & Install Dependencies

```bash
# Clone your repo (or copy files via SCP/USB)
git clone <your-repo-url> ~/FRAMESCAPSTONE
cd ~/FRAMESCAPSTONE/backend

# Install RPi-specific Python packages
pip install -r rpi/requirements-rpi.txt
```

> [!NOTE]
> First run of InsightFace will download the `buffalo_l` model (~280MB) to `~/.insightface/models/`. Make sure you have internet on first launch.

---

## Step 4 — Configure Environment

Create a `.env` file in the backend directory:

```bash
cd ~/FRAMESCAPSTONE/backend
nano .env
```

Paste this (adjust values for your setup):

```env
# Backend API URL — where the main Flask/FastAPI backend runs
# If backend runs on a SEPARATE laptop/server on the same network:
BACKEND_URL=http://<LAPTOP_IP>:5000

# If backend runs ON the Pi itself:
# BACKEND_URL=http://localhost:5000

# Device identity (must match a Device record in the database)
DEVICE_ID=1

# Force RPi platform detection (optional, auto-detected)
FRAMES_PLATFORM=rpi
```

> [!IMPORTANT]
> **`BACKEND_URL`** must point to where your FastAPI backend is running.  
> If the backend runs on your laptop, use your laptop's local IP (e.g., `http://192.168.1.100:5000`).  
> Find your laptop's IP with: `ipconfig` (Windows) or `ip addr` (Linux).

---

## Step 5 — Seed Test Data (for testing)

On whichever machine runs the backend (laptop or Pi):

```bash
cd ~/FRAMESCAPSTONE/backend
python scripts/seed_kiosk_test.py        # Seed test class for TODAY
python scripts/seed_kiosk_test.py --clean # Clean up test data later
```

This creates:
- A test class for **today's day** from 07:00 to 10:00 in room `CL1`
- A device with ID=1 assigned to room `CL1`
- Uses Pedro Mendoza as the faculty

---

## Step 6 — Verify Camera

Test that the Pi camera works:

```bash
# For Pi Camera V2 (CSI):
rpicam-hello -t 5000    # Should show a 5-second preview window

# For USB webcam:
python3 -c "import cv2; cap=cv2.VideoCapture(0); print('OK' if cap.isOpened() else 'FAIL'); cap.release()"
```

---

## Step 7 — Start the Kiosk Server

```bash
cd ~/FRAMESCAPSTONE/backend
source ~/frames_env/bin/activate

# Set env vars (or use .env file)
export DEVICE_ID=1
export BACKEND_URL=http://<LAPTOP_IP>:5000

# Start kiosk
python rpi/kiosk_server.py
```

You should see logs like:
```
INFO | Initializing Streaming Kiosk components...
INFO | Camera opened via picamera2 (480x360 @ 15fps)
INFO | Synced 1 schedule entries
INFO | Uvicorn running on http://0.0.0.0:8000
```

---

## Step 8 — Open the Kiosk UI

Open Chromium on the Pi and navigate to:

```
http://localhost:8000
```

### Kiosk UI Layout
```
┌─────────────────────────────┬──────────────────┐
│                             │  🕐 07:35:00     │
│                             │  Mar 4, 2026     │
│      📹 CAMERA FEED        ├──────────────────┤
│      (face recognition     │  📚 Subject/Room │
│       bounding boxes)       │  IT314 - CL1     │
│                             ├──────────────────┤
│                             │  🤟 Gestures     │
│                             │  ✌️ 👍 ✋        │
│                             ├──────────────────┤
│                             │  ✅ Check-ins    │
│                             │  Juan - 07:32    │
└─────────────────────────────┴──────────────────┘
```

### Fullscreen Kiosk Mode (auto-start Chromium):

```bash
# Launch Chromium in kiosk mode (fullscreen, no toolbar)
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble http://localhost:8000
```

---

## Step 9 — Auto-Start on Boot (optional)

Create a systemd service:

```bash
sudo nano /etc/systemd/system/frames-kiosk.service
```

Paste:

```ini
[Unit]
Description=FRAMES Kiosk Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/FRAMESCAPSTONE/backend
Environment="DEVICE_ID=1"
Environment="BACKEND_URL=http://<LAPTOP_IP>:5000"
Environment="FRAMES_PLATFORM=rpi"
ExecStart=/home/pi/frames_env/bin/python rpi/kiosk_server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable frames-kiosk
sudo systemctl start frames-kiosk

# Check status
sudo systemctl status frames-kiosk

# View logs
journalctl -u frames-kiosk -f
```

For auto-opening the UI in Chromium on boot, add to `/etc/xdg/lxsession/LXDE-pi/autostart`:

```bash
echo "@chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:8000" | \
  sudo tee -a /etc/xdg/lxsession/LXDE-pi/autostart
```

---

## RPi Performance Tuning

The kiosk auto-detects RPi and applies these optimizations (in `rpi/config.py`):

| Setting | RPi Value | Laptop Value | Why |
|---|---|---|---|
| `RECOGNITION_DET_SIZE` | `(160, 160)` | `(640, 640)` | Smaller = faster inference |
| `USE_GATED_DETECTION` | `True` | `False` | MediaPipe gate before InsightFace |
| `RECOGNITION_FRAME_SKIP` | `5` | `1` | Only process every 5th frame |
| `CAMERA_FPS` | `15` | `30` | Lower FPS = less CPU |
| `USE_PICAMERA2` | `True` | `False` | Pi Camera V2 needs picamera2 |

Expected performance on RPi4:
- **Camera loop**: ~30ms/frame (smooth video feed)
- **Face detection (MediaPipe gate)**: ~30ms
- **Face recognition (InsightFace)**: ~200-300ms (only when face detected)
- **Total per recognition**: ~250-350ms (~3-4 recognitions/sec)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `No active class scheduled` | Ensure backend is running + class exists for today's day and current time window |
| `Failed to open camera` | Check `rpicam-hello` works. If USB, try `CAMERA_INDEX=1` |
| `API request failed` | Check `BACKEND_URL` is reachable from Pi (`curl http://<IP>:5000/`) |
| Camera shows black frames | Wait 2-3s for Pi Camera warmup. Check ribbon cable is seated properly |
| `ModuleNotFoundError: picamera2` | You must install via `apt`, not pip. Re-create venv with `--system-site-packages` |
| InsightFace model download hangs | Ensure Pi has internet. Can manually download and place in `~/.insightface/models/buffalo_l/` |
| Kiosk UI shows "OFFLINE" | WebSocket can't connect. Ensure kiosk_server.py is running on port 8000 |

---

## Quick Command Reference

```bash
# Start backend (on laptop)
cd FRAMESCAPSTONE/backend
python main.py

# Start kiosk (on RPi)
cd FRAMESCAPSTONE/backend
DEVICE_ID=1 BACKEND_URL=http://<LAPTOP_IP>:5000 python rpi/kiosk_server.py

# Open kiosk UI
chromium-browser --kiosk http://localhost:8000

# Seed test data
python scripts/seed_kiosk_test.py
python scripts/seed_kiosk_test.py --clean

# Check if backend is reachable from RPi
curl http://<LAPTOP_IP>:5000/api/kiosk/active-class?device_id=1
```
