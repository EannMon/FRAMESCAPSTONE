# Network Dependency & Performance Analysis

## Issue Reported
Recognition is smooth at home (WiFi), extremely slow on mobile data (~2 min per recognition), and faster but still delayed on university WiFi. User asks: Is internet the bottleneck? What exactly requires network?

---

## Complete Network Dependency Map

### What Happens On Boot (ONE-TIME, requires network)

| Step | Network? | What It Does | Time Impact |
|------|----------|-------------|-------------|
| 1. Export/download embeddings | **YES** | Downloads all enrolled face embeddings from backend API | 2-30s depending on user count and connection |
| 2. Load InsightFace model | **NO** | Loads ONNX model from local disk (`~/.insightface/`) | 10-30s (CPU-bound, no network) |
| 3. Load MediaPipe models | **NO** | Loads face detection + hand models from local pip package | 5-10s (CPU-bound) |
| 4. Sync schedule | **YES** | Downloads weekly schedule for this room | 1-3s |
| 5. Flush offline queue | **YES** (if records queued) | Sends previously queued attendance records | 1-10s depending on queue size |

### What Happens Per Frame (CONTINUOUS)

| Operation | Network? | Time |
|-----------|----------|------|
| Camera read | **NO** | <5ms |
| MediaPipe face detection | **NO** | 20-30ms (RPi) |
| InsightFace embedding extraction | **NO** | 150-250ms (RPi) |
| Embedding cache matching | **NO** | <1ms |
| Gesture detection | **NO** | 20-40ms |

**Face recognition itself is 100% LOCAL.** It does NOT use the network at all.

### What Requires Network During Operation

| Operation | When | Network Call | Impact if Slow |
|-----------|------|-------------|---------------|
| Get active class | Every schedule check (~every second when no class, backoff on failure) | `GET /api/kiosk/active-class` | Falls back to local schedule cache |
| Fetch class enrollment | When class changes | `GET /api/kiosk/class/{id}/enrolled` | Cannot determine who belongs to class |
| Fetch attendance state | When face is recognized | `GET /api/kiosk/attendance-state` | Falls back to local state cache |
| Log attendance | When action occurs | `POST /api/kiosk/attendance/log` | Queued offline |
| Periodic cache refresh | Every 30 minutes | Reads local file (not network) | No impact |
| Periodic schedule sync | Every 30 minutes | `GET /api/kiosk/schedule` | Falls back to existing cache |

---

## Why Mobile Data Is Catastrophically Slow

### Your Observation Is Correct — But the Cause Is NOT Face Recognition

The 2-minute delay you experienced on mobile data is caused by **network API calls, not recognition computation.** Here is the exact flow when a face is detected:

```
Frame captured (0ms)
  → MediaPipe detects face (30ms)           ← LOCAL
  → InsightFace extracts embedding (200ms)  ← LOCAL
  → Cache match found (0.5ms)               ← LOCAL
  ─── TOTAL SO FAR: ~230ms ───
  
  → _fetch_attendance_state() ← *** NETWORK CALL ***
    → GET /api/kiosk/attendance-state?user_id=X&class_id=Y
    → On mobile data with poor signal: 2-10 SECONDS per request
    → On university WiFi: 200-500ms
    → On home WiFi: 50-100ms
  
  → attendance_logger.log_attendance() ← *** NETWORK CALL ***
    → POST /api/kiosk/attendance/log
    → Same latency as above
```

**The recognition thread is BLOCKED waiting for the HTTP response.** It cannot process the next frame until the network call returns.

### Root Cause Breakdown

| Factor | Home WiFi | University WiFi | Mobile Data (4G/5G) |
|--------|-----------|----------------|-------------------|
| Ping to backend server | 10-30ms | 50-200ms | 200-2000ms |
| DNS resolution | Cached | May need lookup | Often slow |
| TLS handshake (HTTPS) | 20-40ms | 50-100ms | 500-1500ms |
| Data transfer | Instant (small payloads) | Fast | Variable, congested |
| **Total per API call** | **50-100ms** | **200-500ms** | **1000-5000ms** |
| **API calls per recognition** | **2-3** | **2-3** | **2-3** |
| **Total network overhead** | **100-300ms** | **400-1500ms** | **2000-15000ms** |

### Why Building Location Matters

University buildings often have:
- Thick concrete walls that degrade cellular signal
- Many students on the same cell tower (congestion)
- WiFi that routes through campus proxy/firewall (added latency)
- WiFi access points that may be far from the kiosk location

---

## Correcting Your Understanding About Caching

### What You Got Right
- Embeddings ARE cached locally — recognition does NOT need network
- Schedule IS cached locally — class resolution works offline
- Offline queue DOES save attendance records when network is down

### What Needs Clarification

**"When I add new enrolled users, it does not update automatically"**

This is **partially correct but explainable:**

1. **Embeddings are cached locally in `embeddings_cache.json`**
2. The kiosk refreshes this cache in two ways:
   - **On boot:** `export_embeddings()` downloads fresh data from the API
   - **Every 30 minutes:** `CACHE_REFRESH_MINUTES = 30` triggers a reload — BUT this currently only reloads FROM THE LOCAL FILE, not from the API

**The current code in `kiosk_server.py` recognition_loop:**
```python
# This only reloads from the LOCAL JSON file — it does NOT download new data from API
if (self._last_cache_refresh is None
    or (now_sec - self._last_cache_refresh) >= self.config.CACHE_REFRESH_MINUTES * 60
) and os.path.exists(cache_path_local):
    if self.embedding_cache.load_from_json(cache_path_local):
        self._last_cache_refresh = now_sec
```

**To get new enrollments, you must:**
1. Restart the kiosk (triggers `export_embeddings()` on boot), OR
2. Manually run `export_embeddings` script, OR
3. Wait for the local file to be updated by some external process

**This is a gap** — the periodic refresh should also download new embeddings from the API, not just reload the local file.

**"When I changed the schedule time, it reflects automatically"**

This is because the **schedule resolver queries the API in real-time** (every time it checks for the active class):
```python
def get_active_class(self):
    # Tries API FIRST (real-time, hits database)
    active = self._query_api_active_class()
    if active:
        return active
    # Only falls back to cache if API fails
    return self._resolve_from_cache()
```

So schedule changes reflect immediately because the kiosk calls the API every few seconds. Embedding changes do NOT reflect because embeddings are only downloaded on boot.

---

## What Actually Needs Internet

| Feature | Needs Internet? | Fallback Without Internet |
|---------|----------------|--------------------------|
| Face recognition | **NO** | Works from local cache |
| Schedule display | Partially — API preferred | Falls back to local cache |
| Attendance logging | **YES** for real-time | Queued offline, flushed later |
| Dashboard updates | **YES** | Dashboards show stale data |
| New enrollments | **YES** (on boot only) | Uses last-downloaded cache |
| Real-time class changes | **YES** | Uses cached schedule |

### The Real Bottleneck

**The bottleneck is NOT the recognition pipeline. It is the synchronous network calls made on every recognized face:**

1. `_fetch_attendance_state()` — Called EVERY TIME a face is matched
2. `attendance_logger.log_attendance()` — Called EVERY TIME an action is logged

These calls block the recognition thread. On slow connections, they add seconds of delay per recognition.

---

## Recommended Fixes

### Fix 1: Make Attendance State Fully Local (HIGH PRIORITY)

Instead of querying the API for attendance state on every recognition, maintain state entirely in memory:

```python
# Current (SLOW — network call per recognition):
state = self._fetch_attendance_state(match.user_id, active_class.class_id)

# Better: Only fetch state from API on CLASS CHANGE, then maintain locally
# The local cache is already updated after each action — just use it
cache_key = f"{match.user_id}_{active_class.class_id}"
state = self._user_attendance_state.get(cache_key, {"allowed_actions": ["ENTRY"], ...})
```

Only call `_fetch_attendance_state()` once per user when a new class starts, not on every frame where a face is recognized.

### Fix 2: Non-Blocking Attendance Logging

Make the `POST /api/kiosk/attendance/log` call asynchronous so it does not block the recognition thread:

```python
# Queue the API call in a background thread
import concurrent.futures
executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

def log_attendance_async(record):
    future = executor.submit(self.attendance_logger.log_attendance, **record)
    # Don't wait for result — update local state immediately
```

### Fix 3: Periodic Embedding Download (Not Just Local Reload)

Add actual API download to the periodic refresh:
```python
if should_refresh:
    # Download from API, not just reload local file
    try:
        export_embeddings(cache_path, backend_url=self.config.BACKEND_URL)
    except Exception:
        pass  # Fall back to existing local file
    self.embedding_cache.load_from_json(cache_path)
```

---

## Summary for Panel

| Question | Answer |
|----------|--------|
| Is internet the main bottleneck? | **YES for speed, NO for functionality.** Recognition works offline. Internet slows down state queries and attendance logging. |
| Why is mobile data so slow? | High latency (1-5s per request) × 2-3 API calls per recognition = 2-15s total delay |
| Why does schedule update but embeddings don't? | Schedule queries API in real-time. Embeddings are only downloaded on boot. |
| Can the system work fully offline? | **YES** — recognition, schedule (cached), and attendance (queued) all work offline. Only real-time dashboard updates require internet. |
| What is the fix? | Minimize network calls during recognition loop. Use local state cache. Make API calls asynchronous. |
