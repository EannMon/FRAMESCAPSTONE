# FRAMES Kiosk — Chromium 7" LCD Setup via SSH
*Raspberry Pi 4 · USB Webcam · SSH user: `frames@raspberrypi`*

---

## Prerequisites (do these on your laptop first)

| What | Why |
|---|---|
| RPi is on the same network as your laptop | SSH requires network access |
| RPi OS Bookworm 64-bit is installed | Required for Python 3.11 + libcamera |
| ICON USB 720p webcam plugged into RPi USB 3.0 | The blue port |
| 7" Chromium LCD connected via HDMI/DSI | Connected before boot |
| FRAMES repo cloned on the RPi at `~/frames/` | `git clone https://github.com/EannMon/FRAMESCAPSTONE.git frames` |

---

## Step 1 — Connect to the RPi Over SSH

From your Windows laptop terminal (PowerShell or Git Bash):

```bash
ssh frames@raspberrypi
# If that doesn't resolve, use the IP directly:
ssh frames@<rpi_ip_address>
```

To find the RPi's IP from your laptop:
```bash
# On Windows PowerShell:
arp -a | findstr "b8-27\|dc-a6\|e4-5f\|d8-3a"
# Or log into your router and look for "raspberrypi" in DHCP clients
```

Accept the fingerprint prompt the first time (`yes`), then enter the password for the `frames` account.

---

## Step 2 — Install System Packages

Run these **once** after a fresh OS install. Skip if already done.

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  python3-picamera2 \
  python3-opencv \
  python3-venv \
  libatlas-base-dev \
  libopenblas-dev \
  libhdf5-dev \
  chromium-browser \
  xdotool \
  unclutter
```

> **`python3-opencv` must come from `apt`, not pip.** The pip version lacks GTK support and will crash when trying to display anything on the screen.

---

## Step 3 — Configure Git Identity (One-Time)

The `frames` account on a fresh RPi has no git identity. Set it once:

```bash
git config --global user.email "frames@raspberrypi.local"
git config --global user.name "FRAMES Kiosk"
git config --global pull.rebase false
```

## Step 4 — Clone / Update the Repo

```bash
# First time — only if ~/frames does NOT already exist:
cd ~
git clone https://github.com/EannMon/FRAMESCAPSTONE.git frames
cd ~/frames
```

If `~/frames` already exists, update it. The RPi is a deployment machine — always take the remote version exactly:

```bash
cd ~/frames
git fetch origin
git reset --hard origin/main
```

> **Never use `git pull` on the RPi.** If the RPi has local cache files that changed (embeddings, schedule JSON), `git pull` will hit merge conflicts. `git reset --hard origin/main` avoids this entirely by discarding local changes.

---

## Step 5 — Create the Python Virtual Environment

```bash
cd ~/frames

# --system-site-packages exposes apt-installed picamera2 and opencv inside the venv
python3 -m venv backend/.venv --system-site-packages

# Activate
source backend/.venv/bin/activate

# Install RPi-specific dependencies (order matters — numpy first)
pip install -r backend/rpi/requirements-rpi.txt
```

This will download InsightFace's `buffalo_l` model (~280 MB) the first time it runs. If it doesn't auto-download, trigger it manually:

```bash
python3 -c "import insightface; insightface.app.FaceAnalysis(name='buffalo_sc').prepare(ctx_id=-1)"
```

---

## Step 6 — Configure the `.env.rpi` File

```bash
cd ~/frames/backend/rpi

# The file is already in the repo — just edit it directly:
nano .env.rpi
```

Fill in these values:

```env
# Force USB webcam — skip picamera2
USE_PICAMERA2=0
CAMERA_INDEX=0          # 0 = /dev/video0 (first USB webcam)

FRAMES_PLATFORM=rpi

# Your Render backend URL (no trailing slash)
BACKEND_URL=https://frames-backend.onrender.com

# Assigned device ID from the FRAMES database
DEVICE_ID=1
DEVICE_ROOM=MH-301      # Match what's configured in the FRAMES admin panel

LOG_LEVEL=INFO
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

To verify the webcam is on `/dev/video0`:
```bash
ls /dev/video*
# Should show: /dev/video0
```

---

## Step 7 — Build the Frontend (Do This on Your Laptop)

The RPi doesn't have Node.js. Build the React frontend on your Windows laptop:

```powershell
# On your laptop in PowerShell:
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\frontend

# Create a .env.production with the kiosk URL pointing to the RPi
# (only needed if the kiosk page uses VITE_KIOSK_URL)
# For local kiosk use, the default localhost:8000 fallback works fine.

npm run build
# Output goes to frontend/dist/
```

Then copy `dist/` to the RPi:

```powershell
# From your laptop PowerShell (replace <rpi_ip>):
scp -r frontend/dist frames@raspberrypi:~/frames/frontend/dist
```

Or if you use the same Git repo on both machines, just `git pull` on the RPi and rebuild there if Node.js is installed:
```bash
# Only if Node.js is installed on RPi (optional):
cd ~/frames/frontend
npm ci
npm run build
```

---

## Step 8 — Test the Camera Before Launching

SSH into the RPi and run a quick camera check:

```bash
source ~/frames/backend/.venv/bin/activate
python3 -c "
import cv2
cap = cv2.VideoCapture(0)
print('Camera opened:', cap.isOpened())
print('Resolution:', cap.get(3), 'x', cap.get(4))
cap.release()
"
# Should print: Camera opened: True  and  640.0 x 480.0
```

If it prints `False`, try `CAMERA_INDEX=1` in `.env.rpi`.

---

## Step 9 — Run the Kiosk (Manual Launch)

```bash
cd ~/frames
chmod +x backend/rpi/start_kiosk_rpi.sh
bash backend/rpi/start_kiosk_rpi.sh
```

This script will:
1. Load `.env.rpi`
2. Activate the venv
3. Start a Python HTTP server on port 3000 serving `frontend/dist/`
4. Start `kiosk_server.py` (FastAPI + face recognition) on port 8000
5. Launch Chromium in **full-screen kiosk mode** on the connected 7" display pointing to `http://localhost:3000/kiosk`

> The Chromium window appears on the **physical display** even though you ran the command over SSH, because the script uses `DISPLAY=:0`.

To stop everything: press `Ctrl+C` in the SSH terminal.

---

## Step 10 — Auto-Start on Boot (Systemd)

To make the kiosk start automatically when the RPi powers on:

```bash
sudo nano /etc/systemd/system/frames-kiosk.service
```

Paste:

```ini
[Unit]
Description=FRAMES Kiosk Service
After=network-online.target
Wants=network-online.target
After=graphical.target

[Service]
Type=simple
User=frames
WorkingDirectory=/home/frames/frames
ExecStart=/bin/bash /home/frames/frames/backend/rpi/start_kiosk_rpi.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/frames/.Xauthority

[Install]
WantedBy=graphical.target
```

Save (`Ctrl+O`, Enter, `Ctrl+X`), then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable frames-kiosk.service
sudo systemctl start frames-kiosk.service

# Check status:
sudo systemctl status frames-kiosk.service

# View live logs:
sudo journalctl -u frames-kiosk.service -f
```

---

## Step 11 — Verify Everything is Working

After the script starts, check these from your SSH session:

```bash
# Is kiosk_server.py responding?
curl http://localhost:8000/api/kiosk/health
# Should return: {"status":"ok"} or similar

# Is the frontend being served?
curl -I http://localhost:3000
# Should return: HTTP/1.0 200 OK

# Is the camera feed accessible?
curl -I http://localhost:8000/video_feed
# Should return: HTTP/1.1 200 OK  (MJPEG stream)
```

On the 7" display you should see the FRAMES kiosk UI in full-screen mode with the live camera feed.

---

## Troubleshooting

### Chromium doesn't open / blank screen
```bash
# Check if X11 is running
DISPLAY=:0 xdpyinfo | head -5

# Check if Chromium can find the display
DISPLAY=:0 chromium-browser --version

# Kill any stuck Chromium instances
pkill -f chromium
```

### Camera shows black screen or won't open
```bash
# Check camera devices
ls /dev/video*
v4l2-ctl --list-devices

# Try a different index in .env.rpi:
CAMERA_INDEX=1

# Test with ffplay (if installed):
ffplay /dev/video0
```

### "No display named :0" error
```bash
# The RPi needs to be booted into desktop mode, not console-only mode.
# Enable auto-login to desktop:
sudo raspi-config
# → System Options → Boot / Auto Login → Desktop Autologin
```

### InsightFace / ONNX errors on startup
```bash
# Manually trigger model download (one-time):
source ~/frames/backend/.venv/bin/activate
python3 -c "
import insightface
app = insightface.app.FaceAnalysis(name='buffalo_sc')
app.prepare(ctx_id=-1)
print('Model ready')
"
```

### Kiosk server crashes immediately
```bash
# Check logs
sudo journalctl -u frames-kiosk.service -n 50

# Or run manually to see errors:
source ~/frames/backend/.venv/bin/activate
cd ~/frames/backend
python -m rpi.kiosk_server
```

### Frontend shows "Cannot connect to kiosk server"
The kiosk page connects via WebSocket to `localhost:8000`. Verify kiosk_server is running:
```bash
ps aux | grep kiosk_server
# Also verify the port:
ss -tlnp | grep 8000
```

---

## Quick Reference — Daily Commands

```bash
# SSH in
ssh frames@raspberrypi

# Start kiosk manually
cd ~/frames && bash backend/rpi/start_kiosk_rpi.sh

# Check systemd service
sudo systemctl status frames-kiosk

# View live logs
sudo journalctl -u frames-kiosk -f

# Restart service after code update (never use git pull — use reset)
git fetch origin && git reset --hard origin/main && sudo systemctl restart frames-kiosk

# Stop service
sudo systemctl stop frames-kiosk

# Edit config
nano ~/frames/backend/rpi/.env.rpi
```

---

## Network Architecture (for reference)

```
[Your Laptop]
    │
    ├── SSH → frames@raspberrypi (port 22)
    │
    └── (Render Cloud)
           │
           └── FRAMES Backend API (FastAPI)
                    │
                    └── Aiven PostgreSQL

[Raspberry Pi 4]
    ├── kiosk_server.py (port 8000) — face recognition, gesture, WebSocket
    ├── Python HTTP server (port 3000) — serves pre-built React frontend
    ├── ICON USB 720p Webcam (/dev/video0)
    └── 7" Chromium LCD Display (HDMI)
             │
             └── Chromium --kiosk → http://localhost:3000/kiosk
                   ├── Video stream:   http://localhost:8000/video_feed
                   └── WebSocket:      ws://localhost:8000/ws/status
```
