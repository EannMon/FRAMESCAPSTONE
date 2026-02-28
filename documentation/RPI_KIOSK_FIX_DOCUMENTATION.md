# RPi Kiosk Processes Fix Documentation

> **Date:** 2026-02-25  
> **Scope:** All `backend/rpi/*.py` files (9 files modified, 2 already clean)

## Summary

Fixed all RPi kiosk modules to comply with FRAMES Observability, Deployment, and Engineering rules. Resolved 1 P0 bug (incompatible model defaults), added SIGTERM handler for systemd, periodic offline queue flush, and periodic schedule re-sync.

---

## P0 Bug Fix — Incompatible Model Default

**File:** `face_recognizer.py`

The `FaceRecognizer` class defaulted to `buffalo_sc` but enrollment uses `buffalo_l`. These models produce **different embedding spaces** despite both outputting 512-d vectors. If `FaceRecognizer()` was instantiated without arguments (e.g., in tests or future code), face recognition would silently fail — generating near-random similarity scores against enrolled embeddings.

```diff
-    def __init__(self, model_name: str = "buffalo_sc", ...):
+    def __init__(self, model_name: str = "buffalo_l", ...):
```

> **Note:** `main_kiosk.py` explicitly passes `buffalo_l` from config, so production kiosks were not affected. But this was a latent bug waiting to cause issues.

---

## Audit Failure Fixes

### SIGTERM Handler — `main_kiosk.py`

The kiosk runs as a systemd service on RPi. Without a SIGTERM handler, `systemctl stop` would force-kill the process, potentially losing offline attendance records.

**Added:**
- `import signal` at module level
- `self._shutdown_requested = False` flag in `__init__`
- SIGTERM handler registered in `run()` that sets the flag
- Main loop now checks `while not self._shutdown_requested:` instead of `while True:`

### Periodic Offline Queue Flush — `main_kiosk.py`

Previously, offline records only flushed at startup and shutdown. If the kiosk ran for hours after a brief network outage, records would stay queued until the next restart.

**Added:** Every 5 minutes, if there are queued offline records, attempt to flush them to the API.

### Periodic Schedule Re-Sync — `main_kiosk.py`

Previously, the schedule only synced at startup. If a class was added or moved mid-day, the kiosk wouldn't know until restart.

**Added:** Every 30 minutes, re-sync full weekly schedule from the backend API.

---

## Observability Fixes (All Files)

### Changes Applied Across All 9 Files

| Change | Details |
|--------|---------|
| **f-string logging → %-formatting** | ~50 total occurrences converted (lazy evaluation for performance) |
| **Emoji removed from logs** | All `✅`, `❌`, `⚠️`, `📷`, `🔄`, etc. stripped from log messages |
| **`print()` → `logger`** | 2 `print()` calls in `main()` replaced with `logger.error()` |
| **Log level tuning** | "No active class" downgraded from INFO to DEBUG (fires every 30s) |
| **Model load failure** | Elevated from `logger.error` to `logger.critical` in `face_recognizer.py` |
| **Performance timing** | Added model load timing in `face_recognizer.py` (%.1fms) |

### Files Modified

| File | # Log Fixes | Additional Changes |
|------|-------------|-------------------|
| `main_kiosk.py` | ~25 | SIGTERM handler, periodic flush/re-sync, print() removal |
| `face_recognizer.py` | 3 | P0 default model fix, model load timing, critical-level |
| `embedding_cache.py` | 6 | — |
| `attendance_logger.py` | 8 | — |
| `schedule_resolver.py` | 12 | "No active class" → DEBUG |
| `face_detector.py` | 1 | — |
| `gesture_detector.py` | 1 | — |
| `camera.py` | 5 | — |
| `kiosk_server.py` | 3 | — |

### Files Not Modified (Already Clean)

- `config.py` — dataclass configuration, no logging
- `metrics_collector.py` — already uses %-formatting

---

## Verification Results

| Check | Result |
|-------|--------|
| `grep print(` in `rpi/` | **0 matches** |
| `grep logger.\w+(f"` in `rpi/` | **0 matches** |
| Python AST parse — all 11 RPi files | **All pass** |

## What Was NOT Changed

- No business logic, algorithms, or thresholds were modified
- f-strings in `cv2.putText()` UI overlays are kept (these are screen display strings, not logs)
- f-strings in API URL construction (`f"{self.config.BACKEND_URL}/api/..."`) are kept (not logging)
- f-strings in `remarks=f"[NOT_IN_CLASS] ..."` are kept (data payload, not log formatting)
- Gesture emoji in UI prompt strings (e.g., `"✌️ Peace=Break"`) are kept (user-facing display)
