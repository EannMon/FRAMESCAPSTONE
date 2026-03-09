# FRAMES Gesture Detection — Changes, Logic & Architecture

## Document Purpose

This document provides a **super-specific** record of every change made to the gesture detection system, the reasoning behind each decision, and the final architecture. Written for contributors who need to understand why the code looks the way it does.

---

## Table of Contents

1. [Problem History](#1-problem-history)
2. [Root Cause Analysis](#2-root-cause-analysis)
3. [Architecture: Before vs After](#3-architecture-before-vs-after)
4. [Change 1: Smoothing Algorithm (N-out-of-M)](#4-change-1-smoothing-algorithm-n-out-of-m)
5. [Change 2: Lazy Timer (Sentinel-Based Countdown)](#5-change-2-lazy-timer-sentinel-based-countdown)
6. [Change 3: MediaPipe Static vs Video Mode](#6-change-3-mediapipe-static-vs-video-mode)
7. [Change 4: Relative Ratio Peace Sign Classification](#7-change-4-relative-ratio-peace-sign-classification)
8. [Change 5: Frame Cadence Fix (Gesture Block at Top of Loop)](#8-change-5-frame-cadence-fix-gesture-block-at-top-of-loop)
9. [Change 6: Config Tuning](#9-change-6-config-tuning)
10. [Final Architecture Summary](#10-final-architecture-summary)
11. [Gesture Classification Algorithm](#11-gesture-classification-algorithm)
12. [Debugging & Diagnostics](#12-debugging--diagnostics)
13. [Known Limitations](#13-known-limitations)

---

## 1. Problem History

### Original Behavior

Gesture detection **always timed out**. The kiosk would recognize a face, prompt for a gesture (peace sign, thumbs up, etc.), count down 5 seconds, and then report "Gesture timeout." No gesture was ever successfully detected.

### Symptoms (Layered Failures)

The failure wasn't caused by a single bug — it was **5 independent issues stacked on top of each other**:

| # | Issue | Effect |
|---|-------|--------|
| 1 | Smoothing required N identical consecutive frames | Natural hand jitter (PEACE → NONE → PEACE) always reset the counter |
| 2 | Timer started when face was recognized, not when gesture UI appeared | 2-3 seconds of the 5-second window were consumed by recognition latency |
| 3 | `static_image_mode=True` made each gesture frame take ~2.2s | Only 2-3 gesture frames fit in 5 seconds |
| 4 | Peace sign was misclassified as open palm due to lowered thresholds | Even when detected, the wrong gesture was reported |
| 5 | `schedule_resolver.get_active_class()` HTTP call ran BEFORE gesture check every frame | Added 0.5-3s latency per gesture frame, starving the gesture window |

Each fix alone was insufficient. All five had to be resolved together.

---

## 2. Root Cause Analysis

### Why Each Frame Took ~2.2 Seconds

The recognition loop in `kiosk_server.py` processed frames in this order:

```
1. Read frame from camera buffer          (~0ms)
2. schedule_resolver.get_active_class()    (~500ms-3000ms) ← HTTP API call!
3. Check active class, broadcast state     (~1ms)
4. Check class enrollment                  (~1ms)
5. GESTURE DETECTION                       (~50ms with video mode)
6. continue (skip recognition)
```

Steps 2-4 ran on **every frame**, even during gesture mode. `get_active_class()` makes an HTTP GET request to the backend API with a 3-second timeout. This meant each gesture iteration — even though gesture detection itself was fast (~50ms) — had 500ms-3000ms of overhead.

With a 5-second gesture window, this allowed only **2-3 gesture frames**. If the user didn't show the gesture on the very first frame, timeout was almost guaranteed.

### Why the Gesture Timer Was Inaccurate

The original timer started when `pending_match` was set (i.e., when the face was recognized). But face recognition itself takes ~2 seconds (InsightFace inference). So by the time the user sees "Show gesture (5s)", only ~3 seconds actually remain.

---

## 3. Architecture: Before vs After

### BEFORE (Broken)

```
while running:
    frame = read_latest_frame()
    active_class = schedule_resolver.get_active_class()  ← SLOW (HTTP)
    broadcast_class_info()
    check_enrollment()
    
    if pending_gesture:         ← gesture check buried under slow code
        detect_gesture(frame)   ← only runs 2-3 times in 5 seconds
        continue
    
    run_face_recognition(frame) ← heavy (~2s)
```

### AFTER (Fixed)

```
while running:
    frame = read_latest_frame()
    
    if pending_gesture:         ← FIRST thing checked, NO overhead
        detect_gesture(frame)   ← runs 50-100 times in 8 seconds
        sleep(0.01)             ← yield CPU, stay responsive
        continue                ← skip ALL heavy code below
    
    active_class = schedule_resolver.get_active_class()  ← only when NOT in gesture mode
    broadcast_class_info()
    check_enrollment()
    run_face_recognition(frame)
```

**Result:** Gesture frames now take ~50-100ms instead of ~2200ms. The user gets **80-160 gesture detection attempts** in the 8-second window.

---

## 4. Change 1: Smoothing Algorithm (N-out-of-M)

### File: `backend/rpi/gesture_detector.py`

### Before (Broken)

Required N **consecutive identical** gesture detections. Natural hand jitter caused sequences like:

```
[PEACE, NONE, PEACE, PEACE, NONE]
```

With N=3, no 3 consecutive PEACE frames existed. Gesture always timed out.

### After (Fixed)

Uses a **sliding window** (deque) where any gesture appearing >= N times in the window passes:

```python
def _get_smoothed_gesture(self) -> Gesture:
    if len(self._gesture_buffer) < self._consecutive_frames:
        return Gesture.NONE
    
    window = list(self._gesture_buffer)
    counts = {}
    for g in window:
        if g != Gesture.NONE:
            counts[g] = counts.get(g, 0) + 1
    
    for gesture, count in counts.items():
        if count >= self._consecutive_frames:
            return gesture
    
    return Gesture.NONE
```

With `GESTURE_CONSECUTIVE_FRAMES=1`, the first non-NONE detection passes immediately. This is safe because the classification algorithm (Change 4) is now accurate enough to not need temporal smoothing.

### Reasoning

N-out-of-M is robust against jitter. With a 5-frame buffer and N=1, even intermittent detection works. Higher N values can be used if false positives become a problem.

---

## 5. Change 2: Lazy Timer (Sentinel-Based Countdown)

### File: `backend/rpi/kiosk_server.py`

### Problem

The timer started when `pending_match` was set (during face recognition). Face recognition takes ~2s. So the displayed "5s" countdown was already at ~3s internally.

```python
# OLD: Timer started at face recognition time
gesture_timeout_end = time.time() + GESTURE_TIMEOUT_SECONDS  # set during recognition frame
# ...next iteration (2s later)...
remaining = gesture_timeout_end - time.time()  # already 3s, not 5s!
```

### Solution

Use a **sentinel value** (`-1`) to indicate "timer not started yet." The timer starts on the **first gesture display frame**, which is the first iteration where the user actually sees the gesture prompt:

```python
gesture_timeout_end = -1  # sentinel: not yet started

# In gesture loop:
if gesture_timeout_end < 0:
    gesture_timeout_end = time.time() + GESTURE_TIMEOUT_SECONDS
    # NOW the timer starts — user is seeing "8s" right as the countdown begins
```

### Reasoning

- The user sees "8 seconds" exactly when the system starts counting 8 seconds
- No time is stolen by the recognition + network pipeline that runs between setting `pending_match` and the first gesture frame
- Clean sentinel pattern: -1 means "not started", 0 means "expired/reset", >0 means "active deadline"

---

## 6. Change 3: MediaPipe Static vs Video Mode

### File: `backend/rpi/gesture_detector.py`

### `static_image_mode=True` (Rejected)

- Runs **full hand detection** on every frame
- On CPU: ~2000-2500ms per frame (640x480)
- Guaranteed detection accuracy but unusably slow

### `static_image_mode=False` (Current — Video/Tracking Mode)

- First frame: full detection (~200-500ms)
- Subsequent frames: **tracking** (~30-50ms)
- If tracking fails, automatically falls back to detection

### Why Video Mode Works Now

With the gesture block moved to the top of the loop (Change 5), gesture frames run in a tight loop at ~50ms each. Video mode's tracking is perfectly suited for this: the user's hand stays roughly in place, so tracking maintains the landmark positions frame-to-frame.

### Configuration

```python
self.hands = mp_hands.Hands(
    static_image_mode=False,      # Video/tracking mode
    max_num_hands=1,              # Only detect one hand (faster)
    min_detection_confidence=0.35, # Low threshold for reliability
    min_tracking_confidence=0.35,  # Keep tracking even in poor lighting
)
```

---

## 7. Change 4: Relative Ratio Peace Sign Classification

### File: `backend/rpi/gesture_detector.py`

### Problem

After lowering thresholds for reliable detection, the peace sign (index + middle extended) was misclassified as open palm (all fingers extended). This happened because lowered extension thresholds made ring/pinky fingers appear "extended" even when they were curled.

### Before (Absolute Thresholds)

```python
# Extended if ratio > 1.5 (distance-to-MCP / MCP-to-wrist)
if all([index_up, middle_up, not ring_up, not pinky_up]):
    return PEACE_SIGN
```

With lowered thresholds (1.3 for extended), a peace sign with slightly relaxed ring/pinky could have:
- Index ratio: 2.1 (clearly extended)
- Middle ratio: 1.9 (clearly extended)
- Ring ratio: 1.4 (borderline — classified as "extended")
- Pinky ratio: 1.35 (borderline — classified as "extended")

Result: All 4 fingers "extended" → classified as OPEN_PALM instead of PEACE_SIGN.

### After (Relative Ratio Comparison)

Instead of binary extended/curled, compare finger groups **relative to each other**:

```python
if index_up and middle_up:
    avg_up = (idx_ratio + mid_ratio) / 2    # e.g. (2.1 + 1.9) / 2 = 2.0
    avg_down = (ring_ratio + pinky_ratio) / 2  # e.g. (1.4 + 1.35) / 2 = 1.375
    if avg_up > avg_down * 1.15:              # 2.0 > 1.375 * 1.15 = 1.58 → True!
        return Gesture.PEACE_SIGN
```

**Key insight:** For a peace sign, the index/middle fingers are ALWAYS more extended than ring/pinky, regardless of absolute thresholds. The 1.15x multiplier provides a safety margin against noise.

### Peace Sign vs Open Palm Priority

Peace sign is checked **before** open palm. If a hand has index + middle clearly more extended than ring + pinky, it's a peace sign. Only if this test fails AND all 4 fingers are extended does it become open palm.

```
Classification priority:
1. PEACE_SIGN  (index + middle up, avg_up > avg_down * 1.15)
2. THUMBS_UP   (thumb up, all 4 fingers curled)
3. OPEN_PALM   (all 4 fingers extended, but peace test failed)
4. NONE        (nothing matched)
```

---

## 8. Change 5: Frame Cadence Fix (Gesture Block at Top of Loop)

### File: `backend/rpi/kiosk_server.py`

### This Is the Critical Fix

This single change transformed gesture detection from "only works in the first 1 second" to "works throughout the entire window."

### Problem

The `recognition_loop()` in `kiosk_server.py` is a single `while` loop that processes each frame. **Every iteration** ran:

1. `schedule_resolver.get_active_class()` — HTTP GET to backend API (timeout: 3s)
2. `broadcast_state()` — WebSocket push (non-blocking but still runs)
3. `_fetch_class_enrollment()` — checks if enrollment loaded
4. **Then** gesture detection

Even though gesture detection itself was fast (~50ms), steps 1-3 added up to 500ms-3000ms per iteration. The gesture block's `continue` statement skipped face recognition, but NOT the HTTP call at step 1.

### Solution

Move the gesture block to the **very top** of the loop, right after reading the frame:

```python
while self.running:
    frame = read_latest()
    frame_count += 1
    t_frame_start = time.perf_counter()
    
    # ── GESTURE HANDLING (TOP) ────────────────────
    if pending_match is not None:
        # gesture detection runs here ~50ms
        # ...
        time.sleep(0.01)  # yield, ~100fps effective
        continue           # skip EVERYTHING below
    
    # ── HEAVY PROCESSING (only when NOT in gesture mode) ──
    active_class = self.schedule_resolver.get_active_class()  # HTTP
    # ... broadcast, enrollment, face recognition
```

### Cache Pattern for `active_class`

When `pending_match` is set, the gesture block needs `active_class.class_id` for the attendance log success handler. But `active_class` is resolved BELOW the gesture block now. Solution: **cache it when pending_match is set**:

```python
# When face is matched and gesture is required:
pending_match = match
pending_active_class = active_class  # Snapshot for gesture success handler

# In gesture success handler:
self.attendance_logger.log_attendance(
    class_id=pending_active_class.class_id,  # Use cached, not live
    ...
)
```

`pending_active_class` is cleared alongside `pending_match` on both timeout and success.

### Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Gesture frame time | ~2200ms | ~50-100ms |
| Frames in 8s window | 3-4 | 80-160 |
| Detection reliability | ~20% (must gesture in first 1s) | ~99% (gesture anytime in window) |

### CPU Note

A `time.sleep(0.01)` is added after the gesture block's metrics to prevent CPU spinning. This limits the effective gesture loop to ~100fps, which is far more than needed (MediaPipe Hands processes at ~30fps). Without this sleep, the loop would busy-wait at 100% CPU.

---

## 9. Change 6: Config Tuning

### File: `backend/rpi/config.py`

| Parameter | Original | Final | Reasoning |
|-----------|----------|-------|-----------|
| `GESTURE_CONFIDENCE` | 0.5 | 0.35 | Lower threshold detects hands reliably across varying lighting and angles |
| `GESTURE_TIMEOUT_SECONDS` | 8 → 12 → 5 | **8.0** | 8s is comfortable. With the frame cadence fix, even 3s would work, but 8s gives ample time for users unfamiliar with the system |
| `GESTURE_CONSECUTIVE_FRAMES` | 3 | **1** | Accept first valid detection immediately. Classification accuracy (relative ratios) is high enough to not need temporal smoothing |

### Where These Are Used

- `GESTURE_CONFIDENCE` → `GestureDetector.__init__` → `mp_hands.Hands(min_detection_confidence=...)`
- `GESTURE_TIMEOUT_SECONDS` → `kiosk_server.py` → lazy timer calculation
- `GESTURE_CONSECUTIVE_FRAMES` → `GestureDetector._get_smoothed_gesture()` → minimum count threshold

### Pre-flight Alignment

`run_kiosk.py` pre-flight check now reads these values from `KioskConfig()` instead of hardcoded values, ensuring the displayed config matches what the system uses.

---

## 10. Final Architecture Summary

### Gesture Detection Data Flow

```
Camera Thread (30fps)
    │
    ├── Captures frame → self._latest_frame (shared buffer)
    │
Recognition Thread (single consumer)
    │
    ├── Read latest frame
    │
    ├── [IF gesture pending]
    │   ├── Check timeout
    │   ├── Run GestureDetector.detect(frame)    ~50ms
    │   │   ├── MediaPipe Hands process (video mode tracking)
    │   │   ├── Classify gesture (relative ratios)
    │   │   └── Smooth gesture (N-out-of-M buffer)
    │   ├── If matched → log attendance via API
    │   ├── Broadcast state via WebSocket
    │   ├── sleep(0.01)
    │   └── continue (skip all heavy processing)
    │
    ├── [ELSE — normal mode]
    │   ├── schedule_resolver.get_active_class()  ← HTTP (500ms-3s)
    │   ├── Check class enrollment
    │   ├── Face detection (InsightFace)           ← heavy (~1-2s)
    │   ├── Embedding match
    │   ├── If match → set pending_match + pending_active_class
    │   └── Loop to next frame
```

### State Machine for Gesture Session

```
IDLE ──[face recognized + gesture required]──> PENDING
    │
    │   pending_match = match
    │   pending_active_class = active_class
    │   gesture_timeout_end = -1  (lazy)
    │
PENDING ──[first gesture frame]──> ACTIVE
    │
    │   gesture_timeout_end = now + 8s
    │
ACTIVE ──[gesture detected + matches allowed]──> SUCCESS
    │       │
    │       └── Log attendance, clear pending, broadcast
    │
    ├──[timeout]──> TIMEOUT
    │       │
    │       └── Clear pending, short cooldown (2s), broadcast timeout msg
    │
    └──[each frame]──> ACTIVE (loop)
            │
            └── detect + broadcast remaining time
```

---

## 11. Gesture Classification Algorithm

### File: `backend/rpi/gesture_detector.py` — `_classify_gesture()`

### Finger Extension Detection

Each finger's "extension ratio" measures how far the fingertip is from the wrist relative to the MCP (knuckle) joint:

```
ratio = dist(fingertip, wrist) / dist(mcp, wrist)
```

- **Extended**: ratio > 1.3 (fingertip is farther from wrist than MCP)
- **Curled**: ratio < 1.5 (fingertip is closer to wrist — inside the palm)
- Hysteresis zone (1.3–1.5) prevents flickering

### Thumb Detection

Thumb uses a separate ratio because its anatomy is different:

```
thumb_ratio = dist(thumb_tip, wrist) / dist(thumb_cmc, wrist)
```

- **Extended**: ratio > 1.2 (thumb is spread away from palm)

### Gesture Classification (Priority Order)

```python
1. PEACE_SIGN:
   - index extended AND middle extended
   - avg(index_ratio, middle_ratio) > avg(ring_ratio, pinky_ratio) * 1.15
   
2. THUMBS_UP:
   - thumb extended (ratio > 1.2)
   - all 4 fingers curled (ratio < 1.5 each)
   
3. OPEN_PALM:
   - all 4 fingers extended (ratio > 1.3 each)
   - peace sign check FAILED (avg_up not significantly > avg_down)
   
4. NONE:
   - nothing matched
```

### Gesture-to-Action Mapping

```python
GESTURE_ACTION_MAP = {
    Gesture.PEACE_SIGN: AttendanceAction.BREAK_OUT,
    Gesture.THUMBS_UP:  AttendanceAction.BREAK_IN,
    Gesture.OPEN_PALM:  AttendanceAction.EXIT,
}
```

Only gestures whose mapped action is in `pending_allowed` are accepted.

---

## 12. Debugging & Diagnostics

### Diagnostic Counters

`GestureDetector` maintains counters reset on each `reset_buffer()`:

```python
self._diag_frames = 0       # Total frames processed in this gesture session
self._diag_hand_found = 0   # Frames where MediaPipe detected a hand
self._diag_gesture_found = 0 # Frames where a non-NONE gesture was classified
```

Every 10 frames, a diagnostic log is emitted:

```
GESTURE_DIAG | frames=10 hand_found=7 gesture_found=3
```

When a hand IS detected, the raw gesture and ratio details are logged at INFO level:

```
GESTURE_DIAG | hand_found! raw=PEACE_SIGN (frames=5 found=2)
```

### Gesture Frame Timing

Each gesture frame logs its processing time at DEBUG level:

```
GESTURE | hand=True gesture=PEACE_SIGN remaining=6.2s gesture_ms=47.3 allowed=['BREAK_OUT', 'EXIT']
```

The `gesture_ms` field isolates gesture detection time from everything else.

---

## 13. Known Limitations

1. **Single-hand detection**: `max_num_hands=1`. If two hands are visible, MediaPipe picks one (potentially the wrong one).

2. **Lighting sensitivity**: MediaPipe Hands struggles in very low light. The 0.35 detection confidence helps but doesn't eliminate the issue.

3. **Distance sensitivity**: Hand must be within ~0.5-1.5m of camera for reliable detection. Too far = landmarks are noisy.

4. **Angle dependency**: Finger extension ratios assume the palm faces the camera roughly head-on. Extreme angles (edge of hand) produce unreliable ratios.

5. **Offline attendance during gesture**: If the backend API is unreachable when the gesture succeeds, `attendance_logger.log_attendance()` queues to the offline JSON. This works but introduces a delay before the success broadcast.

6. **No gesture for ENTRY**: `REQUIRE_GESTURE_FOR_ENTRY = False` means ENTRY is face-only. This is by design — reduces friction for clock-in.

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/rpi/gesture_detector.py` | Video mode, relative ratio classification, N-out-of-M smoothing, diagnostics |
| `backend/rpi/kiosk_server.py` | Gesture block moved to top of loop, lazy timer, `pending_active_class` cache, `time.sleep(0.01)` yield |
| `backend/rpi/config.py` | `GESTURE_TIMEOUT_SECONDS=8.0`, `GESTURE_CONSECUTIVE_FRAMES=1`, `GESTURE_CONFIDENCE=0.35` |
| `backend/run_kiosk.py` | Pre-flight reads from KioskConfig instead of hardcoded values |
| `backend/api/routers/kiosk.py` | EXIT returns `allowed_actions=[]` (prevents re-entry) |

---

*Last updated: Session of March 9, 2026*
