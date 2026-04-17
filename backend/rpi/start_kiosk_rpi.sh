#!/usr/bin/env bash
# =============================================================
# FRAMES Kiosk Startup Script — Raspberry Pi + USB Webcam
# =============================================================
# Usage (from repo root on the RPi):
#   chmod +x backend/rpi/start_kiosk_rpi.sh
#   bash backend/rpi/start_kiosk_rpi.sh
# =============================================================

# NOTE: Do NOT use "set -e" — background processes and wait-loops
# return non-zero on signals which would kill the script prematurely.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== FRAMES Kiosk Startup ==="
echo "    Platform:  Raspberry Pi (USB webcam)"
echo "    Repo root: $REPO_ROOT"

# ── Helper: kill whatever process holds a TCP port ───────────
# Uses ss (iproute2, always installed) with lsof/fuser as fallbacks.
kill_port() {
    local PORT=$1
    # Method 1: ss — parses 'pid=NNNN' from socket owner info
    local PIDS
    PIDS=$(ss -tlnp "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+')
    for pid in $PIDS; do kill -9 "$pid" 2>/dev/null || true; done
    # Method 2: lsof fallback
    PIDS=$(lsof -ti:"$PORT" 2>/dev/null)
    for pid in $PIDS; do kill -9 "$pid" 2>/dev/null || true; done
    # Method 3: fuser fallback (psmisc package — may not be installed)
    fuser -k "${PORT}/tcp" 2>/dev/null || true
}

# ── 0. Kill any leftover processes from a previous run ───────
echo "[cleanup] Stopping any previous kiosk processes..."
pkill -9 -f "rpi.kiosk_server" 2>/dev/null || true
pkill -9 -f "kiosk_server"     2>/dev/null || true
pkill -f  "SPAHandler"         2>/dev/null || true
pkill -f  "http.server"        2>/dev/null || true
pkill -9 chromium-browser      2>/dev/null || true
pkill -9 chromium              2>/dev/null || true
# Force-release ports and camera device regardless of process name
kill_port 8000
kill_port 3000
fuser -k /dev/video0 2>/dev/null || true
sleep 3   # Give kernel time to release /dev/video0 and TCP sockets
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

# ── 5. Launch Kiosk Server (background, isolated process group) ──
# setsid gives the kiosk its own process group so Chromium GPU crashes
# cannot propagate signals (SIGTERM/SIGHUP) to the kiosk server.
echo "[kiosk] Starting kiosk_server.py on port 8000..."
cd "$REPO_ROOT/backend"
setsid python -m rpi.kiosk_server &
KIOSK_PID=$!
echo "[kiosk] PID: $KIOSK_PID"

# Give the server 4 seconds to start before opening browser
sleep 4

# ── 6. Disable screen blanking and DPMS (display power saving) ───────
# Without this the RPi will blank/power-off the screen after ~10 min of
# inactivity (no mouse/keyboard) — killing the kiosk display between scans.
#   xset s off      → disables the X screensaver timer entirely
#   xset s noblank  → tells the screensaver NOT to blank the video output
#   xset -dpms      → disables DPMS (Energy Star) monitor power-off
echo "[display] Disabling screensaver and DPMS..."
DISPLAY=:0 xset s off         2>/dev/null || true
DISPLAY=:0 xset s noblank     2>/dev/null || true
DISPLAY=:0 xset -dpms         2>/dev/null || true
echo "[display] Screen will stay on indefinitely."

# ── 6b. Background keepalive — belt-and-suspenders ───────────────────
# Some LXDE power managers or Wayfire compositors ignore xset and implement
# their own idle timer. This loop nudges the X pointer by 0px every 4 minutes
# so the session never becomes "idle" to any component.
# xdotool is already installed (see setup guide apt dependencies).
(while true; do
    sleep 240
    DISPLAY=:0 xdotool mousemove_relative -- 0 0 2>/dev/null || true
done) &
KEEPALIVE_PID=$!
echo "[display] Keepalive loop PID: $KEEPALIVE_PID"

# ── 7. Launch Chromium in kiosk mode on the Pi's display ─────
# DISPLAY=:0 sends the window to the HDMI screen even when invoked over SSH.
# --kiosk removes the browser chrome (URL bar, tabs) for a full-screen look.
# --no-sandbox is needed on RPi OS for Chromium to run as a non-root user.
# --noerrdialogs and --disable-infobars suppress crash/update popups.
# --disable-gpu* flags prevent GPU compositor vsync crashes on RPi 4's VideoCore VI.
KIOSK_URL="http://localhost:3000/kiosk"

echo "[browser] Launching Chromium kiosk → $KIOSK_URL"
DISPLAY=:0 chromium-browser \
    --kiosk \
    --no-sandbox \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --window-size=800,480 \
    --force-device-scale-factor=1 \
    --high-dpi-support=1 \
    --check-for-update-interval=604800 \
    --disable-features=Translate \
    --disable-gpu \
    --disable-gpu-vsync \
    --num-raster-threads=2 \
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

# ── 8. Wait and clean up on exit ─────────────────────────────
cleanup() {
    echo ""
    echo "Stopping all kiosk processes..."
    kill $KIOSK_PID $BROWSER_PID ${FRONTEND_PID:-} ${KEEPALIVE_PID:-} 2>/dev/null
    # Also kill any orphaned children in the kiosk's process group
    kill -- -$KIOSK_PID 2>/dev/null || true
    pkill -9 chromium-browser 2>/dev/null || true
    pkill -9 chromium         2>/dev/null || true
    echo "Stopped."
    exit 0
}
trap cleanup INT TERM

# Wait for kiosk server — if it dies, restart it automatically
while true; do
    wait $KIOSK_PID 2>/dev/null
    EXIT_CODE=$?
    # Exit code 0 = clean shutdown (Ctrl+C / SIGTERM) — stop everything
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[kiosk] Clean shutdown (exit 0). Stopping."
        cleanup
        break
    fi
    # Non-zero = crash — restart the kiosk server
    echo "[kiosk] ⚠ Kiosk server exited with code $EXIT_CODE — restarting in 5s..."
    # Kill the old process group (setsid gave it a new pgid == its own pid)
    kill -- -$KIOSK_PID 2>/dev/null || true
    pkill -9 -f "rpi.kiosk_server" 2>/dev/null || true
    pkill -9 -f "uvicorn" 2>/dev/null || true
    # Wait for port 8000 to be freed, then force-kill anything still holding it
    sleep 3
    kill_port 8000
    sleep 2   # Give kernel time to fully release the socket
    cd "$REPO_ROOT/backend"
    setsid python -m rpi.kiosk_server &
    KIOSK_PID=$!
    echo "[kiosk] Restarted with PID: $KIOSK_PID"
done
