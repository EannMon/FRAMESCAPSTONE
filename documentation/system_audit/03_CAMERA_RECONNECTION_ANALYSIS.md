# Camera Disconnection & Reconnection Analysis

## Issue Reported
When the camera USB cable is accidentally moved/disconnected, the kiosk freezes. Reinserting the cable does not recover — the kiosk must be fully restarted (unplug RPi and replug).

---

## Root Cause Analysis

### Why Camera Disconnection Freezes the Kiosk

**Both `main_kiosk.py` and `kiosk_server.py` have the same fundamental problem:**

The `Camera` object is created **once** at startup and never recreated. When the USB cable is disturbed:

1. `cap.read()` starts returning `(False, None)` 
2. The camera loop handles this with `time.sleep(0.01); continue` — it retries but the underlying `cv2.VideoCapture` device handle is **dead**
3. Even after the cable is physically reconnected, the OS assigns a potentially different `/dev/video*` device node
4. The old `cv2.VideoCapture(0)` handle remains bound to the **disconnected** device
5. Result: infinite loop of `ret=False`, no frames ever produced again

### Code Evidence

**camera.py — No reconnection logic:**
```python
def read(self):
    if not self._opened:
        return False, None
    if self._backend == 'picamera2':
        try:
            rgb_frame = self._cap.capture_array("main")
            # ...
        except Exception as e:
            logger.error(f"picamera2 capture error: {e}")
            return False, None  # Returns failure but NEVER attempts reconnection
    else:
        return self._cap.read()  # Returns (False, None) forever after disconnect
```

**kiosk_server.py — camera_loop:**
```python
def camera_loop():
    while self.running:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.01)  # Just waits, never reconnects
            continue
```

**main_kiosk.py — Main loop:**
```python
while not self._shutdown_requested:
    ret, frame = cap.read()
    if not ret:
        continue  # Same problem — silent infinite loop
```

### Why Physical Restart is Required

The `cv2.VideoCapture` object holds a file descriptor to `/dev/video0`. When the USB device disconnects:
- The kernel removes the device node
- The file descriptor becomes invalid
- When reconnected, the kernel creates a NEW device node (could be `/dev/video0` again, or `/dev/video1`)
- The old `VideoCapture` object cannot recover — it must be `.release()`d and a new one created

On RPi with `picamera2`, the CSI camera is more stable (no USB), but if using USB webcam on RPi, the same issue applies.

---

## Recommended Fix: Camera Auto-Reconnection

### Add Reconnection Logic to `Camera` class

```python
# In camera.py — add reconnection method and failure tracking

class Camera:
    def __init__(self, ...):
        # ... existing init ...
        self._consecutive_failures = 0
        self._max_failures_before_reconnect = 30  # ~0.3s at 10ms per retry
        self._index = index
        self._fps = fps
    
    def read(self):
        if not self._opened:
            return False, None
        
        if self._backend == 'opencv':
            ret, frame = self._cap.read()
            if not ret:
                self._consecutive_failures += 1
                if self._consecutive_failures >= self._max_failures_before_reconnect:
                    logger.warning("Camera: %d consecutive read failures, attempting reconnect...",
                                   self._consecutive_failures)
                    self._reconnect()
                return False, None
            self._consecutive_failures = 0
            return True, frame
        
        # ... picamera2 path ...
    
    def _reconnect(self):
        """Release and re-open the camera device."""
        logger.info("Camera: Attempting reconnection...")
        self._consecutive_failures = 0
        
        # Release old handle
        if self._cap is not None:
            try:
                self._cap.release()
            except Exception:
                pass
        
        # Wait for OS to stabilize device node
        import time
        time.sleep(2.0)
        
        # Try to reopen
        for attempt in range(5):
            self._cap = cv2.VideoCapture(self._index)
            if self._cap.isOpened():
                self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
                self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
                self._opened = True
                logger.info("Camera: Reconnected successfully on attempt %d", attempt + 1)
                return
            else:
                self._cap.release()
                self._cap = None
                time.sleep(2)
                logger.warning("Camera: Reconnect attempt %d/5 failed", attempt + 1)
        
        logger.error("Camera: All reconnection attempts failed")
        self._opened = False
```

### Update Loop to Handle Prolonged Camera Loss

```python
# In kiosk_server.py camera_loop:
consecutive_failures = 0
while self.running:
    ret, frame = cap.read()
    if not ret:
        consecutive_failures += 1
        if consecutive_failures > 150:  # ~1.5s of failures
            self.broadcast_state({
                "status": "error",
                "message": "Camera disconnected — attempting reconnection...",
            })
        time.sleep(0.01)
        continue
    consecutive_failures = 0
    # ... normal processing ...
```

---

## Hardware Recommendation

For production kiosk deployment:
1. **Use a CSI camera** (Pi Camera V2/V3) instead of USB webcam — CSI connection is more stable
2. **Secure USB cables** with cable clips or strain relief
3. **Use a powered USB hub** if using USB webcam — prevents power-related disconnects
4. If USB webcam is required, use a **USB extension cable with locking connector**

---

## Impact
- **Severity:** High (requires full RPi restart, disrupts attendance logging)
- **Effort:** Medium (camera reconnection + loop updates)
- **Files to modify:** `camera.py`, `kiosk_server.py`, `main_kiosk.py`
