# FRAMES Next Testing Runbook

This runbook is for your next test cycle so laptop testing, kiosk testing, code updates, and new face enrollments are predictable.

## 1) What To Run On Laptop

### A. Full kiosk pipeline on laptop (camera + kiosk server)

Use this when testing recognition behavior, gesture flow, and attendance logging.

```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
.\venv\Scripts\Activate.ps1
$env:FRAMES_PLATFORM="laptop"
$env:USE_PICAMERA2="0"
$env:CAMERA_INDEX="0"
$env:BACKEND_URL="https://framescapstone.onrender.com"
$env:DEVICE_ID="1"
python run_kiosk.py
```

Expected:
- Kiosk server on port 8000
- Smooth recognition on laptop camera

If camera fails, retry with:

```powershell
$env:CAMERA_INDEX="1"
python run_kiosk.py
```

### B. Frontend + local backend web app dev

Use this when testing UI/API pages (not camera kiosk behavior).

```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\frontend
npm run dev
```

## 2) What To Run On Raspberry Pi Kiosk

Your startup script is [backend/rpi/start_kiosk_rpi.sh](backend/rpi/start_kiosk_rpi.sh), and systemd unit uses that script.

### A. Manual kiosk start (SSH)

```bash
cd ~/frames
bash backend/rpi/start_kiosk_rpi.sh
```

Note: `chmod +x` is only needed once per file permission setup, not every run.

### B. Systemd-managed kiosk (recommended for deployment)

```bash
sudo systemctl daemon-reload
sudo systemctl enable frames-kiosk.service
sudo systemctl restart frames-kiosk.service
sudo systemctl status frames-kiosk.service
sudo journalctl -u frames-kiosk.service -f
```

## 3) When Code Is Updated

Do this on the Raspberry Pi after backend/kiosk code changes are pushed:

```bash
cd ~/frames
git fetch origin
git reset --hard origin/main
sudo systemctl restart frames-kiosk.service
```

Then verify:

```bash
curl http://localhost:8000/health
curl -I http://localhost:3000
curl -I http://localhost:8000/video_feed
```

## 4) When New Facial Embeddings Are Added

### Safe rule for testing day
Always restart kiosk service after enrollment batch is complete.

```bash
sudo systemctl restart frames-kiosk.service
```

Reason:
- The kiosk refreshes cache periodically, but restart guarantees latest embeddings are pulled and loaded before scanning.

### Quick API confirmation from laptop

```powershell
curl.exe -sS "https://framescapstone.onrender.com/api/kiosk/embeddings"
```

Check returned `count` and recent `enrolled_at` timestamps.

## 4.1) New Session Window Behavior (Important)

Attendance state is evaluated per class session window (not entire day).

Meaning:
- If a user EXITed an earlier run (example: 18:05), they can still ENTRY again in a later schedule window (example: 21:40) for the same class ID.
- The kiosk should no longer be blocked by earlier same-day logs outside the current session window.

Expected kiosk message behavior:
- If user already exited in the current session window: `Session Closed`.
- If user is simply in cooldown: `cooldown`.

## 5) Why You Saw Old Time (2 PM still visible at 4 PM)

Most likely causes:
- Kiosk UI process stayed alive with stale browser state.
- Backend/kiosk process did not fully reset after previous run.
- Display/browser process was still attached and not refreshed.

### Operational fix
Use service restart, not just unplug/replug assumptions:

```bash
sudo systemctl restart frames-kiosk.service
```

Then confirm the service start time changed:

```bash
sudo systemctl status frames-kiosk.service
```

## 6) Why RPi Feels Delayed vs Laptop

This is expected to some degree due to RPi CPU limits and current kiosk settings in [backend/rpi/config.py](backend/rpi/config.py):
- Frame skipping is enabled on RPi.
- Gated detection is enabled.
- Minimum face size is enforced.
- Match threshold is stricter than before.

These settings reduce false positives but can increase time-to-first-match.

## 7) Priority Fixes Before Next Formal Test

### P0 (must do before next test)
1. Standardize restart procedure: always restart service after enrollment batch.
2. Add a pre-test checklist operator can follow in 2 minutes.
3. Verify Render health before scanning starts.
4. Confirm kiosk device is using correct `DEVICE_ID` and room mapping.

### P1 (high impact)
1. Compare recognition latency with 3 controlled users and record seconds-to-first-match.
2. Validate phone-enrolled faces vs laptop-enrolled faces using same lighting and distance.
3. Record false rejects and successful retries.

### P1.1 Testing-only policy switch (optional)

By default, re-entry after EXIT is blocked for the same session window.

For controlled testing only, backend can allow re-entry after EXIT:

```env
KIOSK_ALLOW_REENTRY_AFTER_EXIT=1
```

After changing backend env, restart backend service.

Set back to `0` (or remove) for production policy.

### P2 (tuning)
1. Adjust recognition settings for RPi only after baseline metrics are recorded.
2. Keep same model version for enrollment and recognition (`insightface_buffalo_sc_v1`).

## 8) Required Test Matrix (so next test is not guesswork)

For each user, run 3 attempts each condition and log pass/fail + latency.

1. Enrollment source: laptop
2. Enrollment source: phone
3. Lighting: good room light
4. Lighting: mixed/backlight
5. Distance: near (0.5-0.8m)
6. Distance: medium (1.0-1.5m)

Track per attempt:
- User ID
- Enrollment source (phone/laptop)
- Enrollment quality
- Time to first recognized frame
- Result (pass/fail)
- Retry count

## 9) 10-Minute Pre-Test Checklist

1. Render alive: `/api/health` returns success.
2. Kiosk service restarted after latest code/enrollment updates.
3. Kiosk health endpoint returns camera and recognition as true.
4. Embeddings API count matches expected users.
5. One known user dry-run passes in < 10 seconds.
6. If testing re-entry behavior, confirm `KIOSK_ALLOW_REENTRY_AFTER_EXIT` value matches test plan.

## 10) Canonical Files

- Kiosk startup script: [backend/rpi/start_kiosk_rpi.sh](backend/rpi/start_kiosk_rpi.sh)
- Kiosk runtime config: [backend/rpi/config.py](backend/rpi/config.py)
- Kiosk server: [backend/rpi/kiosk_server.py](backend/rpi/kiosk_server.py)
- Setup guide: [documentation/polishing/RPi_Chromium_SSH_Setup.md](documentation/polishing/RPi_Chromium_SSH_Setup.md)
