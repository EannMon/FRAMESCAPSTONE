# FRAMES RPi Kiosk — Operations Guide & Field Notes

## Quick Start (Every Time)

SSH into the RPi, then run:

```bash
source ~/frames/backend/.venv/bin/activate
bash ~/frames/backend/rpi/start_kiosk_rpi.sh
```

That's it. The script kills old processes, loads the env, starts the frontend + kiosk server, and launches Chromium.

---

## Pull Latest Code from GitHub

Run this when you want to sync the latest fixes from the team:

```bash
cd ~/frames
git fetch origin && git reset --hard origin/main

# Recreate the /kiosk SPA route (wiped by git reset)
mkdir -p ~/frames/frontend/dist/kiosk
cp ~/frames/frontend/dist/index.html ~/frames/frontend/dist/kiosk/index.html

# Restart
source ~/frames/backend/.venv/bin/activate
bash ~/frames/backend/rpi/start_kiosk_rpi.sh
```

> ⚠️ After every `git reset --hard`, you must recreate `frontend/dist/kiosk/index.html`. The SPA fallback fix is in `start_kiosk_rpi.sh` but the `dist/` folder is not tracked in git.

---

## Stop the Kiosk

Press `Ctrl+C` in the SSH terminal running the script.

Or from any SSH session:
```bash
pkill -9 -f kiosk_server; pkill -9 -f "http.server"; pkill -9 chromium-browser; pkill -9 chromium
```

---

## RPi Configuration

File: `~/frames/backend/rpi/.env.rpi`

```env
FRAMES_PLATFORM=rpi
USE_PICAMERA2=0          # Force USB webcam (OpenCV) — do NOT set to 1
CAMERA_INDEX=0           # USB webcam appears as /dev/video0 when plugged in
BACKEND_URL=https://framescapstone.onrender.com
DEVICE_ID=1              # Must match the device ID in the FRAMES database
DEVICE_ROOM=Room328      # No spaces — bash will break if there's a space
LOG_LEVEL=INFO
```

> ⚠️ If you do `git reset --hard`, the `.env.rpi` gets reset to the template. Re-apply with:
> ```bash
> sed -i 's|http://your-backend-host:5000|https://framescapstone.onrender.com|' ~/frames/backend/rpi/.env.rpi
> ```

---

## Database Device Registration

The device **must** exist in the database for schedule resolution to work.

| Field | Value |
|-------|-------|
| id | 1 |
| device_name | RPI-328 |
| room | Room 328 |
| status | ACTIVE |

Register via Admin Panel → Camera Management → Add Camera.

---

## Findings from Field Testing (2026-03-07)

### ✅ Working
- Camera: USB webcam (Integrated Camera, 0c45:64ab) opens via OpenCV at 480×360 @ 15fps
- Face detection: MediaPipe BlazeFace gate works correctly
- Face recognition: InsightFace `buffalo_l` successfully recognizes enrolled faces
- Attendance logging: ENTRY/EXIT logged correctly to backend (`EMMANUEL LUNGAY` confirmed)
- Gesture detection: Working (peace sign, thumbs up, open palm)
- Offline fallback: When Render is unreachable, attendance is queued offline and retried
- Embedding cache: 3 faces loaded from `backend/rpi/data/embeddings_cache.json`
- WebSocket: Frontend receives real-time status updates
- Video feed: MJPEG stream served at `/video_feed`

### ⚠️ Known Slowness (Expected on RPi CPU)

| Metric | Observed | Notes |
|--------|----------|-------|
| InsightFace inference | ~3000–3500ms | buffalo_l on CPU — cannot be reduced without changing model |
| Model cold load | ~6000–7500ms | First load only; cached after first run |
| Frame rate (idle) | ~7.6 FPS | No face in frame — fast |
| Frame rate (recognition) | ~0.2–1.2 FPS | InsightFace running — slow but functional |
| Memory usage | ~972 MB | Within 2.5GB RPi budget |

### ⚠️ Render Backend Timeouts

Render free tier sleeps after inactivity. When asleep:
- Every schedule API call to `framescapstone.onrender.com` times out after 3 seconds
- The kiosk falls back to cached schedule automatically
- Attendance logging also times out → queued to `offline_attendance.json` → flushed when Render wakes up

**To pre-wake Render before a demo:** Open `https://framescapstone.onrender.com/docs` in a browser ~1 minute before starting the kiosk.

### ❌ Issues Encountered & Resolved

| Issue | Cause | Fix Applied |
|-------|-------|-------------|
| `OSError: Address already in use` on port 3000 | Old kiosk process still running | Cleanup step added to startup script |
| `Failed to open camera via OpenCV` | Previous crashed process held `/dev/video0` | Cleanup step + 5-retry loop with 2s gaps |
| `USE_PICAMERA2=0` ignored | `config.py` defaulted to `None` — `__post_init__` overrode env var | Fixed `config.py` to read env var at field level |
| `Could not import module "kiosk_server"` | Wrong uvicorn module path | Fixed to `rpi.kiosk_server:app` |
| `/kiosk` route returns 404 | Python `http.server` doesn't do SPA fallback | SPA-aware handler in startup script; `dist/kiosk/index.html` workaround |
| `BACKEND_URL` wrong | Template value `http://your-backend-host:5000` in `.env.rpi` | Set to `https://framescapstone.onrender.com` |
| `DEVICE_ROOM` bash parse error | Space in `Room 328` treated as shell command | Changed to `Room328` (no space) |
| Frame freezing ~15s | `API_TIMEOUT_SECONDS=15` blocked camera loop on Render slowness | Reduced to 3s with 60s backoff |
| `Device not registered` | Wrong Render URL (`frames-z2ik` vs `framescapstone`) | Corrected URL in `.env.rpi` |

---

## Performance Expectations

On RPi 4 with `buffalo_l` model (CPU only):

- **Idle (no face):** ~7 FPS, frames process in ~30–100ms
- **Active (face detected):** ~0.3 FPS, each recognition takes ~3000–3500ms
- **Warmup period:** First 3–4 recognitions after startup are slow (~18000ms) due to onnxruntime JIT compilation — this is normal
- **After warmup:** Stable ~3000–3500ms per recognition

The system is functional for an attendance kiosk where users stand in front of the camera for a few seconds. It is not suitable for high-speed or continuous stream recognition.

---

## Useful Diagnostic Commands

```bash
# Check if camera is connected
ls /dev/video*

# Check USB devices
lsusb

# Check kernel camera events (run immediately after plugging in)
dmesg | tail -20

# Check what's using port 3000 or 8000
sudo lsof -i :3000
sudo lsof -i :8000

# Check current .env.rpi
cat ~/frames/backend/rpi/.env.rpi

# Check embeddings cache
cat ~/frames/backend/rpi/data/embeddings_cache.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d)} embeddings:', list(d.keys()))"

# Check offline attendance queue
cat ~/frames/backend/rpi/data/offline_attendance.json
```
