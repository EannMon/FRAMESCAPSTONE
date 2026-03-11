#!/usr/bin/env bash
# =============================================================
# FRAMES Kiosk Startup Script — Raspberry Pi + USB Webcam
# =============================================================
# Usage (from repo root on the RPi):
#   chmod +x backend/rpi/start_kiosk_rpi.sh
#   bash backend/rpi/start_kiosk_rpi.sh
# =============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== FRAMES Kiosk Startup ==="
echo "    Platform:  Raspberry Pi (USB webcam)"
echo "    Repo root: $REPO_ROOT"

# ── 0. Kill any leftover processes from a previous run ───────
# This releases the camera (/dev/video0) and frees port 3000/8000
# before we try to start fresh.  Always safe to run.
echo "[cleanup] Stopping any previous kiosk processes..."
pkill -f "rpi.kiosk_server" 2>/dev/null || true
pkill -f "kiosk_server"     2>/dev/null || true
pkill -f "SPAHandler"       2>/dev/null || true
pkill -f "http.server"      2>/dev/null || true
pkill -9 chromium-browser   2>/dev/null || true
pkill -9 chromium           2>/dev/null || true
sleep 2   # Give kernel time to release /dev/video0 and TCP sockets
echo "[cleanup] Done."

# ── 1. Load environment variables ────────────────────────────
ENV_FILE="$SCRIPT_DIR/.env.rpi"
if [ -f "$ENV_FILE" ]; then
    echo "[env] Loading $ENV_FILE"
    # Export each non-comment line
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
else
    echo "[env] WARNING: $ENV_FILE not found — using defaults."
    echo "             Copy backend/rpi/.env.rpi and fill in BACKEND_URL / DEVICE_ID."
fi

# Explicitly force USB webcam mode (override any picamera2 attempt)
export USE_PICAMERA2=0
export FRAMES_PLATFORM="${FRAMES_PLATFORM:-rpi}"

echo "[env] USE_PICAMERA2    = $USE_PICAMERA2"
echo "[env] FRAMES_PLATFORM  = $FRAMES_PLATFORM"
echo "[env] BACKEND_URL      = ${BACKEND_URL:-NOT SET}"
echo "[env] DEVICE_ID        = ${DEVICE_ID:-NOT SET}"
echo "[env] DEVICE_ROOM      = ${DEVICE_ROOM:-NOT SET}"

# ── 2. Activate Python venv ───────────────────────────────────
VENV_PATH="$REPO_ROOT/backend/.venv"
if [ -d "$VENV_PATH" ]; then
    echo "[venv] Activating $VENV_PATH"
    # shellcheck disable=SC1091
    source "$VENV_PATH/bin/activate"
else
    echo "[venv] WARNING: No .venv at $VENV_PATH"
    echo "       Run: python3 -m venv backend/.venv --system-site-packages"
    echo "       Then: pip install -r backend/rpi/requirements-rpi.txt"
fi

# ── 3. Wake up the backend (Render free tier cold starts in 30-60s) ──
# The kiosk cannot sync its schedule or embeddings until the backend responds.
# We wait up to 90 seconds, pinging /api/health every 10s.
echo "[api] Waking up backend: ${BACKEND_URL:-NOT SET}"
BACKEND_AWAKE=false
for attempt in 1 2 3 4 5 6 7 8 9; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 10 \
        "${BACKEND_URL:-http://localhost:5000}/api/health" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "[api] Backend is responding ✅ (attempt $attempt)"
        BACKEND_AWAKE=true
        break
    fi
    echo "[api] Attempt $attempt: HTTP $HTTP_STATUS — waiting 10s..."
    sleep 10
done
if [ "$BACKEND_AWAKE" = "false" ]; then
    echo "[api] WARNING: Backend did not respond after 90s — kiosk will use cached schedule/embeddings."
fi

# ── 4. Export face embeddings from backend ───────────────────
echo "[cache] Downloading face embeddings from backend API..."
python "$REPO_ROOT/backend/scripts/export_embeddings.py" \
    --output "$REPO_ROOT/backend/rpi/data/embeddings_cache.json" \
    --backend-url "${BACKEND_URL:-http://localhost:5000}" \
    || echo "[cache] WARNING: Export failed — using existing cache"

# ── 5. Serve the pre-built React frontend on port 3000 ───────
# Build on your laptop first:  cd frontend && npm run build
# Then copy the dist/ folder to the RPi (scp or git pull).
FRONTEND_DIST="$REPO_ROOT/frontend/dist"
if [ -d "$FRONTEND_DIST" ]; then
    echo "[frontend] Serving pre-built frontend from $FRONTEND_DIST on port 3000..."
    # Use a SPA-aware server: unknown paths fall back to index.html (required for React Router)
    python3 -c "
import http.server, os, sys
os.chdir('$FRONTEND_DIST')
class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = '/index.html'
        super().do_GET()
    def log_message(self, fmt, *args):
        pass  # Silence per-request logs
server = http.server.HTTPServer(('0.0.0.0', 3000), SPAHandler)
server.serve_forever()
" &
    FRONTEND_PID=$!
    echo "[frontend] PID: $FRONTEND_PID"
    cd "$REPO_ROOT"
else
    echo "[frontend] WARNING: $FRONTEND_DIST not found."
    echo "           Build first on your laptop:  cd frontend && npm run build"
    echo "           Then sync to RPi:            rsync -av frontend/dist/ pi@<pi-ip>:~/frames/frontend/dist/"
    FRONTEND_PID=""
fi

# ── 5. Launch Kiosk Server (background) ──────────────────────
echo "[kiosk] Starting kiosk_server.py on port 8000..."
cd "$REPO_ROOT/backend"
python -m rpi.kiosk_server &
KIOSK_PID=$!
echo "[kiosk] PID: $KIOSK_PID"

# Give the server 4 seconds to start before opening browser
sleep 4

# ── 5. Launch Chromium in kiosk mode on the Pi's display ─────
# DISPLAY=:0 sends the window to the HDMI screen even when invoked over SSH.
# --kiosk removes the browser chrome (URL bar, tabs) for a full-screen look.
# --no-sandbox is needed on RPi OS for Chromium to run as a non-root user.
# --noerrdialogs and --disable-infobars suppress crash/update popups.
KIOSK_URL="http://localhost:3000/kiosk"

echo "[browser] Launching Chromium kiosk → $KIOSK_URL"
DISPLAY=:0 chromium-browser \
    --kiosk \
    --no-sandbox \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --check-for-update-interval=604800 \
    "$KIOSK_URL" &
BROWSER_PID=$!
echo "[browser] PID: $BROWSER_PID"

echo ""
echo "=== Kiosk running ==="
echo "    Kiosk server:  http://localhost:8000"
echo "    Frontend URL:  $KIOSK_URL"
echo "    Video stream:  http://localhost:8000/video_feed"
echo "    WebSocket:     ws://localhost:8000/ws/status"
echo ""
echo "    Press Ctrl+C to stop everything."
echo ""

# ── 7. Wait and clean up on exit ─────────────────────────────
trap "echo 'Stopping...'; kill $KIOSK_PID $BROWSER_PID ${FRONTEND_PID:-} 2>/dev/null; exit 0" INT TERM
wait $KIOSK_PID
