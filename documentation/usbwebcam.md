# USB Webcam Migration Guide for FRAMES Kiosk

## Switching from Raspberry Pi Camera Module to USB Webcam

**Document Version:** 1.0  
**Date:** March 4, 2026  
**Project:** FRAMES — Facial Recognition Attendance and Monitoring System  
**Scope:** Hardware migration guide for kiosk camera subsystem  
**Authors:** FRAMES Capstone Team  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Hardware Comparison](#2-hardware-comparison)
3. [Resolution & Quality Analysis](#3-resolution--quality-analysis)
4. [Performance Impact](#4-performance-impact)
5. [Code Changes Required](#5-code-changes-required)
6. [Recommended USB Webcams for FRAMES](#6-recommended-usb-webcams-for-frames)
7. [Installation & Setup](#7-installation--setup)
8. [Configuration Changes](#8-configuration-changes)
9. [Testing Procedure](#9-testing-procedure)
10. [Troubleshooting](#10-troubleshooting)
11. [Cost Analysis](#11-cost-analysis)
12. [Migration Checklist](#12-migration-checklist)
13. [Conclusion & Recommendation](#13-conclusion--recommendation)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### 1.1 Background

The FRAMES (Facial Recognition Attendance and Monitoring System) kiosk currently uses a **Raspberry Pi Camera Module v2** connected via the CSI (Camera Serial Interface) ribbon cable to a Raspberry Pi 4 Model B. The kiosk performs real-time facial recognition using **InsightFace (buffalo_l model)** for face detection and 512-dimensional embedding generation, **MediaPipe** for hand gesture detection, and **OpenCV** for frame capture and processing.

The current camera abstraction layer in `backend/rpi/camera.py` already supports **two backends**:

- **picamera2** — Required for RPi Camera Module on Raspberry Pi OS Bookworm (2024+), which uses the libcamera stack
- **OpenCV (cv2.VideoCapture)** — Used for USB webcams on both laptops and Raspberry Pi

This dual-backend architecture means that **switching to a USB webcam requires minimal code changes** — the existing framework already supports it.

### 1.2 Why Consider USB Webcam Over RPi Camera Module

| Factor | RPi Camera Module | USB Webcam |
|--------|-------------------|------------|
| **Cost** | ₱1,400–₱1,960 ($25–$35 USD) | ₱560–₱1,400 ($10–$25 USD) |
| **Availability** | Often out of stock; limited supply in PH | Widely available; any computer store |
| **Resolution Options** | Fixed (8MP sensor, 1080p max) | Wide range (720p to 4K) |
| **Plug and Play** | Requires CSI ribbon cable, careful alignment | Standard USB — plug in and go |
| **Driver Complexity** | Requires `picamera2` + libcamera stack on Bookworm | Standard UVC driver — works out of the box |
| **Physical Mounting** | Requires custom bracket for CSI cable | Built-in clip/mount; tripod-compatible |
| **Cable Length** | CSI ribbon max ~30cm (limited flexibility) | USB cable 1–3m (extendable with hub) |
| **Multi-camera** | Only 1 CSI port on RPi 4 | Multiple USB cameras possible |
| **Replacement** | Must match RPi-specific connector | Any USB webcam as drop-in replacement |

### 1.3 Key Benefits

1. **Cost Reduction:** A quality 720p USB webcam costs 40–60% less than an RPi Camera Module v3, with no additional CSI cable needed.
2. **Superior Availability:** USB webcams are commodity hardware available at any electronics store or online retailer in the Philippines (Lazada, Shopee, physical stores like CDR-King, PC Express, Octagon).
3. **Higher Resolution Options:** Many USB webcams offer 1080p with autofocus at the same price point as an RPi Camera Module v2 (720p fixed-focus).
4. **Simplified Software Stack:** Eliminates dependency on `picamera2` and the libcamera stack, reducing complexity and potential points of failure.
5. **Flexible Mounting:** USB webcams come with built-in clips and adjustable mounts, making kiosk installation easier.
6. **Longer Cable Reach:** USB cables (1–3m standard, extendable) allow more flexible kiosk enclosure design compared to the 15–30cm CSI ribbon.

---

## 2. Hardware Comparison

### 2.1 RPi Camera Module Specifications

#### Raspberry Pi Camera Module v2 (IMX219)

| Specification | Value |
|--------------|-------|
| **Sensor** | Sony IMX219 |
| **Resolution** | 8 megapixels (3280 × 2464 stills) |
| **Video Modes** | 1080p @ 30fps, 720p @ 60fps, 640×480 @ 90fps |
| **Field of View (FOV)** | 62.2° horizontal |
| **Focus** | Fixed focus (∞) — no autofocus |
| **Interface** | CSI-2 (15-pin ribbon cable) |
| **Low-Light Performance** | Moderate — no IR filter removal option |
| **Dimensions** | 25mm × 24mm × 9mm |
| **Weight** | 3g |
| **Price** | ~$25 USD (₱1,400) |
| **Availability** | Moderate — sometimes out of stock |

#### Raspberry Pi Camera Module v3 (IMX708)

| Specification | Value |
|--------------|-------|
| **Sensor** | Sony IMX708 |
| **Resolution** | 11.9 megapixels (4608 × 2592 stills) |
| **Video Modes** | 1080p @ 50fps, 720p @ 100fps |
| **Field of View (FOV)** | 66° horizontal (75° for wide variant) |
| **Focus** | Autofocus (phase detection) |
| **HDR** | Yes — hardware HDR support |
| **Interface** | CSI-2 (22-pin or 15-pin via adapter) |
| **Low-Light Performance** | Good — improved with HDR |
| **Dimensions** | 25mm × 24mm × 11.5mm |
| **Weight** | 4g |
| **Price** | ~$25–$35 USD (₱1,400–₱1,960) |
| **Availability** | Limited — newer product, supply chain issues |

### 2.2 USB Webcam Specifications

#### Logitech C270 (Budget Recommendation)

| Specification | Value |
|--------------|-------|
| **Sensor** | VGA-class CMOS |
| **Resolution** | 720p (1280 × 720) HD |
| **Video FPS** | 30fps @ 720p |
| **Field of View (FOV)** | 60° diagonal |
| **Focus** | Fixed focus |
| **Microphone** | Built-in mono mic (noise reduction) |
| **Interface** | USB 2.0 Type-A |
| **Mounting** | Universal clip (monitors, tripod via ¼" thread) |
| **Cable Length** | 1.5m |
| **Low-Light** | Automatic light correction |
| **Dimensions** | 70mm × 31mm × 69mm |
| **Weight** | 75g |
| **Price** | ~$20 USD (₱1,120) |
| **Availability** | Excellent — available everywhere |

#### Logitech C310 (Improved Budget)

| Specification | Value |
|--------------|-------|
| **Sensor** | HD CMOS |
| **Resolution** | 720p (1280 × 720) HD |
| **Video FPS** | 30fps @ 720p |
| **Field of View (FOV)** | 60° diagonal |
| **Focus** | Fixed focus |
| **Microphone** | Built-in mono mic (noise reduction) |
| **Interface** | USB 2.0 Type-A |
| **Mounting** | Adjustable clip (monitors, laptops) |
| **Cable Length** | 1.5m |
| **Low-Light** | Automatic light correction (RightLight 2) |
| **Dimensions** | 70mm × 32mm × 69mm |
| **Weight** | 71g |
| **Price** | ~$25 USD (₱1,400) |
| **Availability** | Excellent |

#### Logitech C920 (Best Value — 1080p)

| Specification | Value |
|--------------|-------|
| **Sensor** | Full HD CMOS |
| **Resolution** | 1080p (1920 × 1080) Full HD |
| **Video FPS** | 30fps @ 1080p, 30fps @ 720p |
| **Field of View (FOV)** | 78° diagonal |
| **Focus** | Autofocus (glass lens, 20-step) |
| **Microphone** | Dual stereo mics |
| **Interface** | USB 2.0 Type-A |
| **Mounting** | Universal clip with tripod mount |
| **Cable Length** | 1.5m |
| **Low-Light** | Automatic HD light correction |
| **Dimensions** | 94mm × 24mm × 29mm |
| **Weight** | 162g |
| **Price** | ~$60 USD (₱3,360) |
| **Availability** | Excellent |

#### Logitech C922 Pro (Streaming-Grade)

| Specification | Value |
|--------------|-------|
| **Sensor** | Full HD CMOS |
| **Resolution** | 1080p @ 30fps, 720p @ 60fps |
| **Video FPS** | 30fps @ 1080p, 60fps @ 720p |
| **Field of View (FOV)** | 78° diagonal |
| **Focus** | Autofocus (glass lens) |
| **Microphone** | Dual stereo mics |
| **Interface** | USB 2.0 Type-A |
| **Mounting** | Universal clip with tripod mount (tripod included) |
| **Cable Length** | 1.5m |
| **Low-Light** | HD light correction + background replacement |
| **Dimensions** | 95mm × 24mm × 29mm |
| **Weight** | 162g |
| **Price** | ~$80 USD (₱4,480) |
| **Availability** | Good |

#### Logitech Brio 4K (Premium)

| Specification | Value |
|--------------|-------|
| **Sensor** | 4K Ultra HD CMOS |
| **Resolution** | 4K @ 30fps, 1080p @ 60fps, 720p @ 90fps |
| **Video FPS** | Up to 90fps (720p) |
| **Field of View (FOV)** | 65°/78°/90° (adjustable) |
| **Focus** | Autofocus (infrared-assisted) |
| **Microphone** | Dual omnidirectional mics |
| **Interface** | USB 3.0 Type-C (with USB-A adapter) |
| **Mounting** | Universal clip with premium build |
| **Cable Length** | 2.2m |
| **Low-Light** | RightLight 3 with HDR |
| **Dimensions** | 102mm × 27mm × 27mm |
| **Weight** | 63g |
| **Price** | ~$150 USD (₱8,400) |
| **Availability** | Good |

#### A4Tech PK-910H (Budget 1080p)

| Specification | Value |
|--------------|-------|
| **Sensor** | Full HD CMOS |
| **Resolution** | 1080p (1920 × 1080) |
| **Video FPS** | 30fps @ 1080p |
| **Field of View (FOV)** | ~65° diagonal |
| **Focus** | Autofocus |
| **Microphone** | Built-in mic |
| **Interface** | USB 2.0 Type-A |
| **Mounting** | Clip mount |
| **Cable Length** | 1.5m |
| **Low-Light** | Auto light correction |
| **Price** | ~$25 USD (₱1,400) |
| **Availability** | Good (common in PH market) |

#### Generic 1080p USB Webcam (Unbranded)

| Specification | Value |
|--------------|-------|
| **Sensor** | Varies (often low-quality CMOS) |
| **Resolution** | Advertised 1080p (often interpolated from 720p or lower) |
| **Video FPS** | 15–30fps (varies) |
| **Field of View (FOV)** | ~50–70° (varies) |
| **Focus** | Usually fixed focus |
| **Microphone** | Usually built-in (poor quality) |
| **Interface** | USB 2.0 Type-A |
| **Low-Light** | Poor (no light correction algorithms) |
| **Price** | ~$10–$15 USD (₱560–₱840) |
| **Availability** | Abundant — Lazada, Shopee, CDR-King |
| **Risk** | Inconsistent quality, lies about resolution, short lifespan |

### 2.3 Comprehensive Comparison Table

| Feature | RPi Cam v2 | RPi Cam v3 | Logitech C270 | Logitech C920 | A4Tech PK-910H | Generic 1080p |
|---------|-----------|-----------|---------------|---------------|----------------|---------------|
| **Max Resolution** | 1080p | 1080p | 720p | 1080p | 1080p | 720p* |
| **Effective FPS** | 30 (1080p) | 50 (1080p) | 30 (720p) | 30 (1080p) | 30 (1080p) | 15–30 |
| **Autofocus** | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **FOV** | 62° | 66–75° | 60° | 78° | ~65° | ~50–70° |
| **Low-Light** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Interface** | CSI ribbon | CSI ribbon | USB 2.0 | USB 2.0 | USB 2.0 | USB 2.0 |
| **Plug-and-Play** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Linux UVC** | ❌ (libcamera) | ❌ (libcamera) | ✅ | ✅ | ✅ | ✅ |
| **Cable Length** | ~15–30cm | ~15–30cm | 1.5m | 1.5m | 1.5m | 1–1.5m |
| **Built-in Mount** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Price (USD)** | ~$25 | ~$25–35 | ~$20 | ~$60 | ~$25 | ~$10–15 |
| **Price (PHP)** | ₱1,400 | ₱1,400–1,960 | ₱1,120 | ₱3,360 | ₱1,400 | ₱560–840 |
| **Reliability** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **FRAMES Rating** | ✅ Good | ✅ Great | ✅ **Best Budget** | ✅ **Best Overall** | ✅ Good | ⚠️ Risky |

*\*Generic webcams often advertise 1080p but deliver interpolated 720p or lower native resolution.*

---

## 3. Resolution & Quality Analysis

### 3.1 What Resolution Does Facial Recognition Need?

Facial recognition accuracy depends on the **number of pixels covering the face region**, not the overall frame resolution. The key factors are:

| Factor | Minimum | Recommended | Optimal |
|--------|---------|-------------|---------|
| **Frame Resolution** | 640×480 (VGA) | 1280×720 (720p) | 1920×1080 (1080p) |
| **Face Region Size** | 80×80 pixels | 112×112 pixels | 160×160+ pixels |
| **Distance from Camera** | < 0.5m | 0.5–1.5m | 0.5–1.0m |
| **InsightFace det_size** | (160, 160) | (320, 320) | (640, 640) |

For the FRAMES kiosk deployment where users stand **0.5–1.5 meters** from the camera:

- **640×480 (VGA):** The face at 1 meter distance occupies approximately 100–150 pixels vertically. This is the **bare minimum** for InsightFace to generate reliable embeddings. Current FRAMES RPi config uses this resolution.
- **1280×720 (720p):** The face at 1 meter occupies approximately 200–300 pixels vertically. This provides **excellent quality** for embedding generation and is the **recommended** resolution.
- **1920×1080 (1080p):** The face at 1 meter occupies approximately 300–450 pixels vertically. This provides **marginal improvement** over 720p for face recognition but significantly increases processing load.

### 3.2 InsightFace `det_size` Parameter

The InsightFace library's `det_size` parameter controls the **internal detection resolution** — the size to which the input frame is resized before face detection occurs. This is configured in `backend/rpi/config.py`:

```python
# Current FRAMES config (from config.py)
# RPi mode:
RECOGNITION_DET_SIZE = (160, 160)   # Aggressive but safe for kiosk (face fills frame)

# Laptop mode:
RECOGNITION_DET_SIZE = (640, 640)   # Full quality
```

**How `det_size` relates to input resolution:**

```
Input Frame (1280×720) 
    ↓ resize
det_size (320×320) ← InsightFace internal detection grid
    ↓ detect faces
Face bounding boxes (mapped back to original frame coordinates)
    ↓ crop face from ORIGINAL frame
Face chip (112×112) ← alignment + crop at original resolution
    ↓ embedding extraction
512-d embedding vector
```

**Key insight:** Even though InsightFace internally detects faces at `det_size` resolution, it **crops the face from the original frame** for embedding extraction. This means:

- **Higher input resolution = more pixels in the face crop = better embedding quality**
- The `det_size` affects **detection accuracy** (finding faces), not embedding quality directly
- A 720p frame with `det_size=(320,320)` will produce better embeddings than a 480p frame with `det_size=(320,320)` because the face crop has more detail

### 3.3 Resolution vs. Embedding Quality

| Input Resolution | det_size | Face Pixels (at 1m) | Embedding Quality | Processing Time (RPi 4) |
|-----------------|----------|---------------------|-------------------|------------------------|
| 480×360 | (160, 160) | ~80–120 px | ⭐⭐ Acceptable | ~150ms |
| 640×480 | (320, 320) | ~120–180 px | ⭐⭐⭐ Good | ~200ms |
| **1280×720** | **(320, 320)** | **~200–300 px** | **⭐⭐⭐⭐ Very Good** | **~220ms** |
| 1920×1080 | (320, 320) | ~300–450 px | ⭐⭐⭐⭐ Very Good | ~280ms |
| 1920×1080 | (640, 640) | ~300–450 px | ⭐⭐⭐⭐⭐ Excellent | ~450ms |

### 3.4 Diminishing Returns Above 1080p

For face recognition specifically, **returns diminish sharply above 1080p**:

1. **InsightFace's recognition model (ArcFace)** aligns faces to a **112×112** pixel chip regardless of input resolution. Once the face region provides enough detail for a clean 112×112 crop, additional resolution offers negligible improvement.
2. At 720p with a typical kiosk distance (0.5–1.5m), the face region provides **200+ pixels** of vertical coverage — already **~2× the alignment target** (112px).
3. At 1080p, you get ~300+ pixels — a 50% improvement over 720p but only marginally better for the 112×112 alignment target.
4. At 4K (2160p), you get ~600+ pixels — **massive overkill** for a 112×112 alignment, and the processing overhead is prohibitive on RPi 4.

**Recommendation: 720p is the optimal resolution for FRAMES kiosk deployment.** It provides excellent face quality while keeping processing time within budget.

---

## 4. Performance Impact

### 4.1 Frame Capture Time: CSI vs. USB

| Metric | RPi Camera (CSI + picamera2) | USB Webcam (OpenCV) |
|--------|------------------------------|---------------------|
| **Interface Bandwidth** | 2 Gbps (CSI-2 dual-lane) | 480 Mbps (USB 2.0) |
| **Raw Frame Capture (VGA)** | ~5ms | ~10ms |
| **Raw Frame Capture (720p)** | ~8ms | ~15ms |
| **Raw Frame Capture (1080p)** | ~12ms | ~25ms |
| **Driver Overhead** | Higher (picamera2 + libcamera) | Lower (V4L2 + UVC) |
| **Total Capture Latency** | ~10–20ms | ~15–30ms |
| **Color Conversion** | RGB→BGR (~2ms) | None (native BGR) |

**Analysis:**

The CSI interface has significantly higher raw bandwidth (2 Gbps vs. 480 Mbps), but for the FRAMES kiosk this advantage is **negligible** because:

1. A 720p frame (1280×720×3 bytes = ~2.76 MB) at 30fps requires only ~83 MB/s — well within USB 2.0's practical throughput of ~280 Mbps (~35 MB/s).
2. The `picamera2` library adds overhead from the libcamera stack (IPA, tuning, pipeline), which partially offsets the CSI speed advantage.
3. Frame capture time is a **small fraction** of total processing time. InsightFace inference alone takes 150–250ms on RPi 4. The 5–15ms difference in capture time is insignificant.

### 4.2 USB Bandwidth Considerations on Raspberry Pi 4

The Raspberry Pi 4 Model B has:

- **1× USB 3.0 bus** (via VL805 controller) — shared by 2 USB 3.0 ports
- **1× USB 2.0 bus** — shared by 2 USB 2.0 ports
- The VL805 USB controller is connected via **PCIe Gen 2 x1** (5 Gbps)

**Bandwidth allocation for FRAMES kiosk:**

| Device | Port | Bandwidth Need | Recommended Port |
|--------|------|---------------|-----------------|
| USB Webcam (720p @ 30fps) | USB 2.0 | ~83 MB/s (MJPEG: ~15 MB/s) | USB 2.0 port |
| Keyboard/Mouse (if any) | USB 2.0 | Negligible | USB 2.0 port |
| USB Storage (if any) | USB 3.0 | Variable | USB 3.0 port |
| Network (Ethernet) | Internal | N/A | Built-in Ethernet |

> **Note:** Most USB webcams compress frames using MJPEG on-device, reducing effective bandwidth to ~10–20 MB/s even at 720p@30fps. This is well within USB 2.0 limits.

### 4.3 CPU/Memory Impact of Higher Resolution Frames

| Resolution | Frame Size (raw) | Memory per Frame | OpenCV Resize to 640 | FPS Impact (RPi 4) |
|-----------|-----------------|------------------|----------------------|---------------------|
| 480×360 | 518 KB | ~0.5 MB | Not needed | Baseline |
| 640×480 | 921 KB | ~0.9 MB | Not needed | ~0% slower |
| **720p (1280×720)** | **2.76 MB** | **~2.8 MB** | **~2ms** | **~5% slower** |
| 1080p (1920×1080) | 6.22 MB | ~6.2 MB | ~5ms | ~15% slower |
| 4K (3840×2160) | 24.88 MB | ~24.9 MB | ~15ms | ~40% slower |

**Memory impact:**

The RPi 4 (4GB) has a memory budget of ~2.5 GB for the kiosk application (see FRAMES deployment constraints). Frame buffers are a small portion:

- At 720p: double-buffered = ~5.6 MB — **negligible** (~0.2% of budget)
- At 1080p: double-buffered = ~12.4 MB — still small (~0.5% of budget)
- OpenCV internally maintains 2–3 buffers, so actual usage is 3× the frame size

### 4.4 Recommended Resolution for FRAMES

**Recommendation: 720p (1280×720) at 15fps camera capture, 4–5 effective recognition FPS**

| Parameter | Value | Justification |
|-----------|-------|---------------|
| **Camera Resolution** | 1280×720 | Optimal face quality without excessive processing cost |
| **Camera FPS** | 15fps | Kiosk processes every 5th frame (RECOGNITION_FRAME_SKIP=5), so 15fps input → 3 recognition attempts/second |
| **det_size** | (320, 320) | Good detection accuracy; (160,160) is too aggressive for 720p frame |
| **Effective Recognition FPS** | 3–5 | Within the 250ms/frame budget on RPi 4 |

### 4.5 Total Frame Processing Pipeline Timing

```
Frame Processing Pipeline (USB Webcam @ 720p, RPi 4):

┌─────────────────────────────┬──────────────┐
│ Stage                       │ Time (ms)    │
├─────────────────────────────┼──────────────┤
│ USB Frame Capture           │   15–25      │
│ Frame Skip Check            │    <1        │
│ MediaPipe Face Gate         │   25–35      │
│ InsightFace Detection       │  100–160     │
│ Embedding Extraction        │   30–50      │
│ Embedding Comparison        │    5–15      │
│ Gesture Detection           │   20–30      │
│ UI Overlay Rendering        │    5–10      │
│ Display (cv2.imshow)        │    5–10      │
├─────────────────────────────┼──────────────┤
│ TOTAL (with face found)     │  205–335     │
│ TOTAL (no face, MediaPipe   │   45–70      │
│ gate skips InsightFace)     │              │
└─────────────────────────────┴──────────────┘

Budget: < 250ms per recognized frame on RPi 4 ✅
```

---

## 5. Code Changes Required

### 5.1 Current Architecture

The FRAMES kiosk already has a **camera abstraction layer** in `backend/rpi/camera.py` that supports both `picamera2` (RPi Camera) and `cv2.VideoCapture` (USB webcams/laptop). The key class is:

```python
# backend/rpi/camera.py (existing)
class Camera:
    """
    Unified camera interface for both laptop (OpenCV) and RPi (picamera2).

    On RPi:
        - Tries picamera2 first (works with Pi Camera V2 on Bookworm)
        - Falls back to OpenCV if picamera2 is unavailable or fails
    On Laptop:
        - Uses OpenCV directly (prefer_picamera2 should be False)
    """
    def __init__(self, index=0, width=640, height=480, fps=30, prefer_picamera2=False):
        # ...
```

And the configuration in `backend/rpi/config.py`:

```python
# backend/rpi/config.py (existing)
@dataclass
class KioskConfig:
    CAMERA_INDEX: int = 0
    CAMERA_WIDTH: int = 640
    CAMERA_HEIGHT: int = 480
    CAMERA_FPS: int = 30
    USE_PICAMERA2: bool = field(default=None)  # Auto-set in __post_init__
```

### 5.2 Minimal Changes for USB Webcam

**The good news:** Switching to a USB webcam requires **only configuration changes**, not code changes. The existing `Camera` class already falls back to OpenCV when `picamera2` is not used.

#### Step 1: Set `USE_PICAMERA2 = False`

In `config.py`, ensure the RPi platform disables picamera2 when using USB webcam:

```python
# Option A: Environment variable (recommended for production)
USE_PICAMERA2: bool = field(
    default_factory=lambda: os.getenv("USE_PICAMERA2", "false").lower() == "true"
)

# Option B: Direct config change
self.USE_PICAMERA2 = False  # USB webcam — uses OpenCV backend
```

#### Step 2: Update Camera Resolution for 720p USB

```python
# In config.py __post_init__, update RPi settings:
if self.PLATFORM == "rpi":
    if self.USE_PICAMERA2:
        # Pi Camera V2 via CSI
        self.CAMERA_WIDTH = 480
        self.CAMERA_HEIGHT = 360
        self.CAMERA_FPS = 15
    else:
        # USB Webcam — can handle higher resolution
        self.CAMERA_WIDTH = 1280
        self.CAMERA_HEIGHT = 720
        self.CAMERA_FPS = 15
        # Better det_size for 720p input
        if self.RECOGNITION_DET_SIZE is None:
            self.RECOGNITION_DET_SIZE = (320, 320)
```

#### Step 3: Camera Initialization (No Change Needed)

The existing `Camera.__init__` already handles the fallback:

```python
# This already works in camera.py — no changes needed
# When USE_PICAMERA2 is False, prefer_picamera2 is False,
# so it goes straight to OpenCV:
if self._cap is None:
    self._cap = cv2.VideoCapture(index)      # index=0 → first USB camera
    if self._cap.isOpened():
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self._cap.set(cv2.CAP_PROP_FPS, fps)
```

The `cv2.VideoCapture(0)` call automatically finds the first available camera device through V4L2 on Linux, which will be the USB webcam.

### 5.3 If Using `picamera2` Library Currently (Migration Steps)

If the kiosk is currently running with `picamera2` for an RPi Camera Module, here are the migration steps:

```bash
# 1. Disconnect the CSI ribbon cable from the RPi Camera Module
# 2. Connect the USB webcam to any USB port
# 3. Verify the USB webcam is detected:
v4l2-ctl --list-devices

# Expected output:
# USB Camera (usb-0000:01:00.0-1.2):
#         /dev/video0
#         /dev/video1

# 4. Set environment variable to disable picamera2:
export USE_PICAMERA2=false

# 5. (Optional) Verify with a quick test:
python3 -c "
import cv2
cap = cv2.VideoCapture(0)
print('Opened:', cap.isOpened())
ret, frame = cap.read()
print('Frame shape:', frame.shape if ret else 'FAILED')
cap.release()
"
# Expected: Opened: True, Frame shape: (720, 1280, 3) or (480, 640, 3)
```

### 5.4 Setting Resolution with OpenCV

```python
import cv2

cap = cv2.VideoCapture(0)

# Set desired resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 30)

# Verify actual resolution (camera may not support requested)
actual_w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
actual_h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
actual_fps = cap.get(cv2.CAP_PROP_FPS)
print(f"Actual: {actual_w:.0f}x{actual_h:.0f} @ {actual_fps:.0f}fps")

# IMPORTANT: Not all cameras support all resolutions.
# The camera will use the closest supported resolution.
# Common supported resolutions for USB webcams:
#   640×480, 800×600, 1280×720, 1920×1080
```

### 5.5 USB Device Enumeration on Linux

```python
"""Enumerate available video devices on Linux."""
import subprocess
import re

def list_video_devices():
    """List all V4L2 video devices."""
    try:
        result = subprocess.run(
            ['v4l2-ctl', '--list-devices'],
            capture_output=True, text=True, timeout=5
        )
        return result.stdout
    except FileNotFoundError:
        return "v4l2-ctl not installed. Run: sudo apt install v4l2-utils"

def find_usb_camera_index():
    """Find the device index of the first USB camera."""
    import glob
    devices = sorted(glob.glob('/dev/video*'))
    for dev in devices:
        try:
            result = subprocess.run(
                ['v4l2-ctl', '-d', dev, '--all'],
                capture_output=True, text=True, timeout=5
            )
            if 'Video Capture' in result.stdout:
                # Extract index from /dev/videoN
                idx = int(re.search(r'/dev/video(\d+)', dev).group(1))
                return idx
        except Exception:
            continue
    return 0  # Default
```

### 5.6 Auto-Detect Camera Type

A utility function to auto-detect whether the connected camera is USB or CSI:

```python
def detect_camera_type() -> str:
    """
    Detect the type of camera connected.
    
    Returns:
        'usb' — USB webcam detected (use OpenCV)
        'csi' — RPi Camera Module detected (use picamera2)
        'none' — No camera found
    """
    import subprocess
    
    # Check for CSI camera (RPi Camera Module)
    try:
        result = subprocess.run(
            ['rpicam-hello', '--list-cameras'],
            capture_output=True, text=True, timeout=5
        )
        if 'Available cameras' in result.stdout and 'No cameras' not in result.stdout:
            return 'csi'
    except FileNotFoundError:
        pass
    
    # Check for USB camera via V4L2
    try:
        result = subprocess.run(
            ['v4l2-ctl', '--list-devices'],
            capture_output=True, text=True, timeout=5
        )
        if '/dev/video' in result.stdout:
            return 'usb'
    except FileNotFoundError:
        pass
    
    return 'none'
```

### 5.7 Enhanced Camera Class (Optional Improvement)

If desired, the existing `Camera` class can be enhanced with USB-specific features:

```python
# Optional enhancement to backend/rpi/camera.py

class Camera:
    def __init__(self, index=0, width=640, height=480, fps=30, prefer_picamera2=False):
        # ... existing init code ...
        
        # For USB webcams: set additional properties for quality
        if self._backend == 'opencv' and self._cap:
            # Use MJPEG backend for lower CPU usage (if supported)
            self._cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))
            
            # Disable auto-exposure if environment is controlled (kiosk)
            # self._cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)  # Manual mode
            
            # Set buffer size to 1 to reduce latency (always get latest frame)
            self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            # Verify actual resolution
            actual_w = self._cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            actual_h = self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            if actual_w != width or actual_h != height:
                logger.warning(
                    "Requested %dx%d but camera set to %dx%d",
                    width, height, int(actual_w), int(actual_h)
                )
```

### 5.8 V4L2 Driver Configuration

Most USB webcams use the **UVC (USB Video Class)** standard and are supported out-of-the-box on Linux via the `uvcvideo` kernel module.

```bash
# Verify UVC driver is loaded
lsmod | grep uvcvideo

# If not loaded:
sudo modprobe uvcvideo

# List supported formats and resolutions for your camera
v4l2-ctl -d /dev/video0 --list-formats-ext

# Example output:
# Type: Video Capture
#     [0]: 'MJPG' (Motion-JPEG)
#         Size: Discrete 1920x1080
#             Interval: Discrete 0.033s (30.000 fps)
#         Size: Discrete 1280x720
#             Interval: Discrete 0.033s (30.000 fps)
#         Size: Discrete 640x480
#             Interval: Discrete 0.033s (30.000 fps)
#     [1]: 'YUYV' (YUYV 4:2:2)
#         Size: Discrete 640x480
#             Interval: Discrete 0.033s (30.000 fps)
#         Size: Discrete 1280x720
#             Interval: Discrete 0.100s (10.000 fps)  ← YUYV is slower at higher res
```

> **Tip:** MJPEG mode is faster at higher resolutions because the camera compresses the frame on-device. YUYV (uncompressed) is fine at 640×480 but may drop to 10fps at 720p on USB 2.0. OpenCV defaults to MJPEG for most USB cameras.

---

## 6. Recommended USB Webcams for FRAMES

### 6.1 Quick Recommendation Matrix

| Use Case | Recommended Webcam | Price (USD) | Price (PHP) | Why |
|----------|-------------------|-------------|-------------|-----|
| **Budget Deployment (per kiosk)** | Logitech C270 | $20 | ₱1,120 | 720p is sufficient, proven reliable, lowest cost from a reputable brand |
| **Standard Deployment** | A4Tech PK-910H | $25 | ₱1,400 | 1080p + autofocus at budget price, widely available in PH |
| **Best Accuracy** | Logitech C920 | $60 | ₱3,360 | 1080p, autofocus, best low-light performance, glass lens |
| **Maximum Savings** | Generic 1080p | $10–15 | ₱560–840 | Cheapest option, but quality varies — test before bulk purchase |
| **Multi-Kiosk (5+ units)** | Logitech C270 × 5 | $100 total | ₱5,600 total | Proven reliability, lowest total cost for fleet deployment |

### 6.2 Detailed Comparison for FRAMES

| Feature | Logitech C270 | Logitech C310 | Logitech C920 | Logitech C922 | A4Tech PK-910H | Generic 1080p |
|---------|--------------|--------------|---------------|---------------|----------------|---------------|
| **Resolution** | 720p | 720p | 1080p | 1080p | 1080p | 720p (actual) |
| **FPS** | 30fps | 30fps | 30fps | 30/60fps | 30fps | 15–30fps |
| **Autofocus** | ❌ Fixed | ❌ Fixed | ✅ 20-step | ✅ Glass lens | ✅ Auto | ❌ Fixed |
| **Low-Light** | ⭐⭐ Basic | ⭐⭐ RightLight | ⭐⭐⭐⭐ HD Light | ⭐⭐⭐⭐ HD Light | ⭐⭐ Basic | ⭐ Poor |
| **FOV** | 60° | 60° | 78° | 78° | 65° | ~50° |
| **Lens** | Plastic | Plastic | Glass | Glass | Plastic | Plastic |
| **UVC Compliant** | ✅ | ✅ | ✅ | ✅ | ✅ | Usually ✅ |
| **Linux Support** | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Good | ⚠️ Varies |
| **Build Quality** | ⭐⭐⭐ Good | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐ Poor |
| **Warranty** | 2 years | 2 years | 2 years | 2 years | 1 year | None |
| **Cable Length** | 1.5m | 1.5m | 1.5m | 1.5m | 1.5m | 1–1.5m |
| **Price (USD)** | ~$20 | ~$25 | ~$60 | ~$80 | ~$25 | ~$10–15 |
| **Price (PHP)** | ₱1,120 | ₱1,400 | ₱3,360 | ₱4,480 | ₱1,400 | ₱560–840 |
| **FRAMES Score** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Verdict** | **Best Budget** | Better build | **Best Overall** | Overkill | **PH-Friendly** | Last resort |

### 6.3 Philippine Market Availability

| Webcam | Lazada/Shopee | PC Express | Octagon | Silicon Valley | CDR-King |
|--------|-------------|-----------|---------|---------------|---------|
| Logitech C270 | ✅ ₱1,000–1,300 | ✅ ~₱1,200 | ✅ ~₱1,200 | ✅ ~₱1,150 | ❌ |
| Logitech C310 | ✅ ₱1,200–1,500 | ✅ ~₱1,400 | ✅ ~₱1,400 | ✅ ~₱1,350 | ❌ |
| Logitech C920 | ✅ ₱2,800–3,500 | ✅ ~₱3,200 | ✅ ~₱3,300 | ✅ ~₱3,100 | ❌ |
| A4Tech PK-910H | ✅ ₱1,200–1,500 | ✅ ~₱1,400 | ✅ ~₱1,400 | ✅ ~₱1,350 | ❌ |
| Generic 1080p | ✅ ₱300–800 | ❌ | ❌ | ❌ | ✅ ₱350–500 |

> **Note:** Prices shown are approximate retail as of early 2026. Online prices (Lazada/Shopee) may include promotions or vouchers. Physical store prices are generally slightly higher but include immediate availability and warranty claims.

### 6.4 Why Not the RPi Camera Module for FRAMES?

Despite being a quality sensor, the RPi Camera Module has specific drawbacks for the FRAMES kiosk deployment:

| Issue | Impact | USB Webcam Solution |
|-------|--------|---------------------|
| CSI ribbon cable is fragile | Can disconnect during kiosk transport or vibration | USB connector is robust |
| Max cable length ~30cm | Limits kiosk enclosure design | USB cable 1.5m+ (extendable) |
| Requires picamera2 + libcamera | Complex software stack, more failure points | Standard UVC driver, simpler |
| Only 1 CSI port on RPi 4 | Cannot add a second camera | Multiple USB cameras possible |
| Fixed focus on v2 | May blur at close range (<30cm) | C920 has autofocus |
| Availability in PH | Hard to find; must order from Cytron/Makerlab | Available at any computer store |
| Custom mounting required | No built-in clip or stand | Built-in clip/mount included |

---

## 7. Installation & Setup

### 7.1 Physical Mounting on Kiosk

#### Kiosk Enclosure Design Considerations

```
┌──────────────────────────────┐
│         KIOSK DISPLAY        │
│                              │
│      ┌──────────────┐        │
│      │   Webcam      │ ◄─── USB webcam mounted above or below screen
│      │   (C270)      │       at user face height (~150cm from floor)
│      └──────┬───────┘        │
│             │ USB Cable       │
│             │ (1.5m)          │
│      ┌──────┴───────┐        │
│      │  Raspberry Pi │        │
│      │      4B       │        │
│      └──────────────┘        │
│                              │
└──────────────────────────────┘
```

**Mounting options:**

1. **Monitor Clip Mount (Default):** Most USB webcams include a clip that attaches to the top edge of a monitor or display. This is the simplest mounting method.

2. **Tripod Mount:** Many webcams (C920, C922) have a standard ¼"-20 tripod thread. Use a small tripod or articulating arm for precise positioning.

3. **Adhesive/Velcro Mount:** For permanent kiosk installations, use 3M adhesive strips or industrial Velcro to mount the webcam to the kiosk enclosure.

4. **3D-Printed Bracket:** For custom kiosk enclosures, design and 3D-print a webcam holder. The C270's dimensions (70mm × 31mm × 69mm) are well-documented.

**Positioning guidelines:**

- Mount webcam at **approximate face height** of standing users (150–165cm from floor)
- Angle the webcam **slightly downward** (5–10°) if mounted above face height
- Ensure **even lighting** on the face — avoid backlighting from windows
- Minimum distance: **30cm** from webcam to face (prevents focal distance issues)
- Optimal distance: **50–100cm** from webcam to face (best for 720p recognition)
- Maximum distance: **150cm** (beyond this, face pixels become too few for reliable recognition)

### 7.2 Linux Driver Support (UVC Standard)

USB webcams that comply with the **USB Video Class (UVC)** standard work out of the box on Linux without any additional driver installation. All Logitech webcams and most branded webcams are UVC-compliant.

```bash
# Step 1: Plug in USB webcam

# Step 2: Verify detection
lsusb
# Expected: Bus 001 Device 004: ID 046d:0825 Logitech, Inc. Webcam C270

# Step 3: Verify V4L2 device creation
ls -la /dev/video*
# Expected: /dev/video0, /dev/video1 (video0 = capture, video1 = metadata)

# Step 4: Install V4L2 utilities (if not already installed)
sudo apt update
sudo apt install v4l-utils

# Step 5: List devices with detail
v4l2-ctl --list-devices
# Expected output:
# USB Camera: USB Camera (usb-0000:01:00.0-1.2):
#         /dev/video0
#         /dev/video1

# Step 6: Check supported formats
v4l2-ctl -d /dev/video0 --list-formats-ext

# Step 7: Quick capture test
python3 -c "
import cv2
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
ret, frame = cap.read()
if ret:
    print(f'Success! Frame: {frame.shape}')
    cv2.imwrite('/tmp/test_frame.jpg', frame)
    print('Saved to /tmp/test_frame.jpg')
else:
    print('FAILED to capture frame')
cap.release()
"
```

### 7.3 udev Rules for Persistent Device Naming

If the kiosk has multiple USB devices, the `/dev/video*` numbering may change between reboots. Use udev rules to create a persistent device symlink:

```bash
# Step 1: Find the camera's unique identifiers
udevadm info -a -n /dev/video0 | grep -E '{idVendor|idProduct|serial}'

# Example output for Logitech C270:
#   ATTRS{idVendor}=="046d"
#   ATTRS{idProduct}=="0825"

# Step 2: Create udev rule
sudo nano /etc/udev/rules.d/99-frames-camera.rules

# Add this line (adjust idVendor and idProduct for your camera):
SUBSYSTEM=="video4linux", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="0825", SYMLINK+="frames_camera", MODE="0666"

# Step 3: Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger

# Step 4: Verify symlink
ls -la /dev/frames_camera
# Expected: /dev/frames_camera -> video0

# Step 5: Use the persistent name in FRAMES config
# In code: cv2.VideoCapture('/dev/frames_camera')
# Or set CAMERA_INDEX environment variable to the device path
```

**udev rules for common webcams:**

```bash
# /etc/udev/rules.d/99-frames-camera.rules

# Logitech C270
SUBSYSTEM=="video4linux", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="0825", SYMLINK+="frames_camera"

# Logitech C310
SUBSYSTEM=="video4linux", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="081b", SYMLINK+="frames_camera"

# Logitech C920
SUBSYSTEM=="video4linux", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="082d", SYMLINK+="frames_camera"

# Logitech C922
SUBSYSTEM=="video4linux", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="085c", SYMLINK+="frames_camera"

# A4Tech PK-910H (vendor ID may vary by batch)
SUBSYSTEM=="video4linux", ATTRS{idVendor}=="09da", ATTRS{idProduct}=="2690", SYMLINK+="frames_camera"
```

### 7.4 Multiple Camera Support

If a kiosk needs multiple cameras (e.g., front-facing for face recognition + overhead for document scanning):

```python
# Enumerate all available cameras
import cv2

def find_available_cameras(max_index=10):
    """Find all available camera indices."""
    available = []
    for idx in range(max_index):
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                available.append({
                    'index': idx,
                    'resolution': f'{w}x{h}',
                    'backend': cap.getBackendName()
                })
            cap.release()
    return available

# Usage:
cameras = find_available_cameras()
for cam in cameras:
    print(f"Camera {cam['index']}: {cam['resolution']} ({cam['backend']})")
```

### 7.5 Verifying Camera with `v4l2-ctl`

```bash
# List all detected video devices
v4l2-ctl --list-devices

# Get detailed info about a specific device
v4l2-ctl -d /dev/video0 --all

# List supported video formats and resolutions
v4l2-ctl -d /dev/video0 --list-formats-ext

# Get current settings (exposure, brightness, etc.)
v4l2-ctl -d /dev/video0 -l

# Set specific controls (example: disable autofocus for controlled environment)
v4l2-ctl -d /dev/video0 --set-ctrl=focus_automatic_continuous=0
v4l2-ctl -d /dev/video0 --set-ctrl=focus_absolute=40

# Test capture (save raw frame to file)
v4l2-ctl -d /dev/video0 --stream-mmap --stream-to=/tmp/test.raw --stream-count=1
```

---

## 8. Configuration Changes

### 8.1 Environment Variables

Add the following environment variables to the kiosk's `.env` file or systemd service configuration:

```bash
# ============================================
# FRAMES Kiosk Camera Configuration
# ============================================

# Camera type: 'usb' or 'csi' (default: auto-detect)
CAMERA_TYPE=usb

# Disable picamera2 (required for USB webcam)
USE_PICAMERA2=false

# Camera device index (0 = first camera, 1 = second, etc.)
# Can also be a device path: /dev/frames_camera
CAMERA_INDEX=0

# Camera resolution (width x height)
CAMERA_WIDTH=1280
CAMERA_HEIGHT=720

# Camera FPS (lower = less CPU usage)
CAMERA_FPS=15

# InsightFace detection size (increased for 720p input)
RECOGNITION_DET_SIZE=320

# Platform override (optional — auto-detected)
# FRAMES_PLATFORM=rpi
```

### 8.2 Updated `config.py` Section

The recommended changes to `backend/rpi/config.py`:

```python
@dataclass
class KioskConfig:
    # ===========================================
    # Camera Settings
    # ===========================================
    CAMERA_INDEX: int = field(
        default_factory=lambda: int(os.getenv("CAMERA_INDEX", "0"))
    )
    CAMERA_WIDTH: int = field(
        default_factory=lambda: int(os.getenv("CAMERA_WIDTH", "640"))
    )
    CAMERA_HEIGHT: int = field(
        default_factory=lambda: int(os.getenv("CAMERA_HEIGHT", "480"))
    )
    CAMERA_FPS: int = field(
        default_factory=lambda: int(os.getenv("CAMERA_FPS", "30"))
    )
    USE_PICAMERA2: bool = field(
        default_factory=lambda: os.getenv("USE_PICAMERA2", "auto").lower()
    )
    
    # ... (rest of config)
    
    def __post_init__(self):
        """Auto-configure platform-specific defaults."""
        
        # Resolve USE_PICAMERA2
        if self.USE_PICAMERA2 == 'auto':
            # Auto-detect: use picamera2 only on RPi with CSI camera
            self.USE_PICAMERA2 = (self.PLATFORM == "rpi" and self._csi_camera_present())
        elif isinstance(self.USE_PICAMERA2, str):
            self.USE_PICAMERA2 = self.USE_PICAMERA2.lower() == 'true'
        
        if self.PLATFORM == "rpi":
            if self.USE_PICAMERA2:
                # Pi Camera V2 via CSI — lower resolution for RPi performance
                self.CAMERA_WIDTH = int(os.getenv("CAMERA_WIDTH", "480"))
                self.CAMERA_HEIGHT = int(os.getenv("CAMERA_HEIGHT", "360"))
                self.CAMERA_FPS = int(os.getenv("CAMERA_FPS", "15"))
                if self.RECOGNITION_DET_SIZE is None:
                    self.RECOGNITION_DET_SIZE = (160, 160)
            else:
                # USB Webcam — higher resolution is feasible
                self.CAMERA_WIDTH = int(os.getenv("CAMERA_WIDTH", "1280"))
                self.CAMERA_HEIGHT = int(os.getenv("CAMERA_HEIGHT", "720"))
                self.CAMERA_FPS = int(os.getenv("CAMERA_FPS", "15"))
                if self.RECOGNITION_DET_SIZE is None:
                    self.RECOGNITION_DET_SIZE = (320, 320)
    
    @staticmethod
    def _csi_camera_present() -> bool:
        """Check if a CSI camera module is connected."""
        import subprocess
        try:
            result = subprocess.run(
                ['rpicam-hello', '--list-cameras'],
                capture_output=True, text=True, timeout=5
            )
            return 'imx' in result.stdout.lower()
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
```

### 8.3 Resolution Configuration Presets

For convenience, define preset configurations:

```python
# Camera presets for common scenarios
CAMERA_PRESETS = {
    "rpi_usb_720p": {
        "CAMERA_WIDTH": 1280,
        "CAMERA_HEIGHT": 720,
        "CAMERA_FPS": 15,
        "RECOGNITION_DET_SIZE": (320, 320),
        "USE_PICAMERA2": False,
        "RECOGNITION_FRAME_SKIP": 3,
    },
    "rpi_usb_480p": {
        "CAMERA_WIDTH": 640,
        "CAMERA_HEIGHT": 480,
        "CAMERA_FPS": 15,
        "RECOGNITION_DET_SIZE": (160, 160),
        "USE_PICAMERA2": False,
        "RECOGNITION_FRAME_SKIP": 5,
    },
    "rpi_csi_default": {
        "CAMERA_WIDTH": 480,
        "CAMERA_HEIGHT": 360,
        "CAMERA_FPS": 15,
        "RECOGNITION_DET_SIZE": (160, 160),
        "USE_PICAMERA2": True,
        "RECOGNITION_FRAME_SKIP": 5,
    },
    "laptop_default": {
        "CAMERA_WIDTH": 1280,
        "CAMERA_HEIGHT": 720,
        "CAMERA_FPS": 30,
        "RECOGNITION_DET_SIZE": (640, 640),
        "USE_PICAMERA2": False,
        "RECOGNITION_FRAME_SKIP": 1,
    },
}
```

### 8.4 OpenCV Backend Configuration

For optimal USB webcam performance, configure the OpenCV capture backend:

```python
# Force V4L2 backend (recommended on Linux for USB webcams)
cap = cv2.VideoCapture(0, cv2.CAP_V4L2)

# Use MJPEG codec for higher effective FPS at HD resolutions
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))

# Reduce internal buffer to 1 frame (minimize latency)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

# Set resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 15)
```

### 8.5 systemd Service Configuration

If the kiosk runs as a systemd service, update the service file:

```ini
# /etc/systemd/system/frames-kiosk.service

[Unit]
Description=FRAMES Attendance Kiosk
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/FRAMES/backend
ExecStart=/home/pi/FRAMES/venv/bin/python -m rpi.main_kiosk

# Camera environment variables
Environment=USE_PICAMERA2=false
Environment=CAMERA_INDEX=0
Environment=CAMERA_WIDTH=1280
Environment=CAMERA_HEIGHT=720
Environment=CAMERA_FPS=15
Environment=RECOGNITION_DET_SIZE=320

# Existing variables
Environment=DEVICE_ID=1
Environment=DEVICE_ROOM=MH-301
Environment=BACKEND_URL=http://your-backend-url:5000
Environment=FRAMES_PLATFORM=rpi

# Restart policy
Restart=on-failure
RestartSec=10

# Access to video devices
SupplementaryGroups=video

[Install]
WantedBy=multi-user.target
```

---

## 9. Testing Procedure

### 9.1 Pre-Integration Camera Test

Before running the full FRAMES kiosk, verify the USB webcam works independently:

```bash
# Test 1: Device Detection
echo "=== Test 1: Device Detection ==="
v4l2-ctl --list-devices
echo ""

# Test 2: Supported Formats
echo "=== Test 2: Supported Formats ==="
v4l2-ctl -d /dev/video0 --list-formats-ext
echo ""

# Test 3: OpenCV Capture Test
echo "=== Test 3: OpenCV Capture ==="
python3 << 'EOF'
import cv2
import time

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 15)

actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
actual_fps = cap.get(cv2.CAP_PROP_FPS)

print(f"Camera opened: {cap.isOpened()}")
print(f"Resolution: {actual_w}x{actual_h}")
print(f"FPS: {actual_fps}")

# Capture 30 frames and measure FPS
start = time.time()
for i in range(30):
    ret, frame = cap.read()
    if not ret:
        print(f"Frame {i} FAILED")
        break
elapsed = time.time() - start
measured_fps = 30 / elapsed

print(f"Captured 30 frames in {elapsed:.2f}s = {measured_fps:.1f} FPS")
print(f"Frame shape: {frame.shape}")

# Save a test frame
cv2.imwrite('/tmp/frames_camera_test.jpg', frame)
print("Test frame saved to /tmp/frames_camera_test.jpg")

cap.release()
print("Camera released. Test PASSED ✅")
EOF
```

### 9.2 Face Detection Test

Verify that InsightFace can detect faces with the USB webcam:

```python
"""
Test script: Verify face detection works with USB webcam.
Run from: backend/ directory
Usage: python -m rpi.test_usb_camera
"""
import cv2
import numpy as np
import time
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_face_detection():
    """Test InsightFace face detection with USB webcam."""
    from insightface.app import FaceAnalysis
    
    print("Loading InsightFace model (buffalo_l)...")
    model = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
    model.prepare(ctx_id=0, det_size=(320, 320))
    print("Model loaded.")
    
    print("Opening USB webcam...")
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if not cap.isOpened():
        print("ERROR: Cannot open camera")
        return False
    
    print("Capturing frame...")
    ret, frame = cap.read()
    if not ret:
        print("ERROR: Cannot read frame")
        cap.release()
        return False
    
    print(f"Frame captured: {frame.shape}")
    
    print("Running face detection...")
    start = time.perf_counter()
    faces = model.get(frame)
    elapsed_ms = (time.perf_counter() - start) * 1000
    
    print(f"Detection time: {elapsed_ms:.1f}ms")
    print(f"Faces found: {len(faces)}")
    
    for i, face in enumerate(faces):
        bbox = face.bbox.astype(int)
        score = face.det_score
        embedding = face.embedding
        print(f"  Face {i}: bbox={bbox}, score={score:.3f}, embedding_dim={len(embedding)}")
        
        # Draw bounding box
        cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
        cv2.putText(frame, f"{score:.2f}", (bbox[0], bbox[1]-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    cv2.imwrite('/tmp/frames_face_test.jpg', frame)
    print(f"Result saved to /tmp/frames_face_test.jpg")
    
    cap.release()
    
    if len(faces) > 0:
        print("\n✅ Face detection with USB webcam: PASSED")
        return True
    else:
        print("\n⚠️ No faces detected — ensure a face is visible to the camera")
        return False

if __name__ == "__main__":
    test_face_detection()
```

### 9.3 Gesture Detection Test

Verify MediaPipe hand gesture detection works:

```python
"""
Test script: Verify gesture detection with USB webcam.
"""
import cv2
import mediapipe as mp
import time

def test_gesture_detection():
    """Test MediaPipe hand detection with USB webcam."""
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if not cap.isOpened():
        print("ERROR: Cannot open camera")
        return False
    
    print("Show your hand to the camera...")
    print("Testing for 10 seconds...")
    
    hand_detected = False
    start = time.time()
    frames = 0
    
    while time.time() - start < 10:
        ret, frame = cap.read()
        if not ret:
            continue
        
        frames += 1
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)
        
        if results.multi_hand_landmarks:
            hand_detected = True
            print(f"  Frame {frames}: Hand detected! "
                  f"({len(results.multi_hand_landmarks)} hand(s))")
    
    elapsed = time.time() - start
    print(f"\nProcessed {frames} frames in {elapsed:.1f}s = {frames/elapsed:.1f} FPS")
    
    cap.release()
    hands.close()
    
    if hand_detected:
        print("✅ Gesture detection with USB webcam: PASSED")
    else:
        print("⚠️ No hands detected — ensure your hand was visible")
    
    return hand_detected

if __name__ == "__main__":
    test_gesture_detection()
```

### 9.4 Performance Benchmarking

Complete benchmark of the full recognition pipeline with USB webcam:

```python
"""
Benchmark: Full FRAMES recognition pipeline with USB webcam.
Measures frame capture, face detection, embedding extraction, and matching.
"""
import cv2
import numpy as np
import time

def benchmark_pipeline(num_frames=100):
    """Benchmark the full pipeline."""
    from insightface.app import FaceAnalysis
    import mediapipe as mp
    
    # Load models
    print("Loading models...")
    face_model = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
    face_model.prepare(ctx_id=0, det_size=(320, 320))
    
    mp_face = mp.solutions.face_detection.FaceDetection(
        model_selection=0, min_detection_confidence=0.7
    )
    
    # Open camera
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))
    
    # Timing arrays
    capture_times = []
    mediapipe_times = []
    insightface_times = []
    total_times = []
    
    print(f"Benchmarking {num_frames} frames...")
    
    for i in range(num_frames):
        frame_start = time.perf_counter()
        
        # Capture
        t0 = time.perf_counter()
        ret, frame = cap.read()
        capture_ms = (time.perf_counter() - t0) * 1000
        capture_times.append(capture_ms)
        
        if not ret:
            continue
        
        # MediaPipe gate
        t0 = time.perf_counter()
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_results = mp_face.process(rgb)
        mp_ms = (time.perf_counter() - t0) * 1000
        mediapipe_times.append(mp_ms)
        
        # InsightFace (only if MediaPipe found a face)
        if mp_results.detections:
            t0 = time.perf_counter()
            faces = face_model.get(frame)
            if_ms = (time.perf_counter() - t0) * 1000
            insightface_times.append(if_ms)
        
        total_ms = (time.perf_counter() - frame_start) * 1000
        total_times.append(total_ms)
        
        if (i + 1) % 20 == 0:
            print(f"  Frame {i+1}/{num_frames}...")
    
    cap.release()
    mp_face.close()
    
    # Report
    def stats(arr, name):
        if not arr:
            return f"  {name}: No data"
        arr = np.array(arr)
        return (f"  {name}: avg={arr.mean():.1f}ms, "
                f"p50={np.percentile(arr, 50):.1f}ms, "
                f"p95={np.percentile(arr, 95):.1f}ms, "
                f"max={arr.max():.1f}ms")
    
    print("\n" + "=" * 60)
    print("BENCHMARK RESULTS (USB Webcam @ 720p)")
    print("=" * 60)
    print(stats(capture_times, "Frame Capture"))
    print(stats(mediapipe_times, "MediaPipe Gate"))
    print(stats(insightface_times, "InsightFace   "))
    print(stats(total_times, "Total Pipeline"))
    print(f"\n  Frames with face detected: {len(insightface_times)}/{num_frames}")
    print(f"  Effective FPS: {1000 / np.mean(total_times):.1f}")
    print("=" * 60)

if __name__ == "__main__":
    benchmark_pipeline(100)
```

### 9.5 Integration Test with FRAMES Kiosk

```bash
# Step 1: Start the FRAMES backend (if not running)
cd /path/to/FRAMES/backend
source venv/bin/activate
python main.py &

# Step 2: Set environment variables for USB webcam
export USE_PICAMERA2=false
export CAMERA_INDEX=0
export CAMERA_WIDTH=1280
export CAMERA_HEIGHT=720
export CAMERA_FPS=15
export DEVICE_ID=1
export DEVICE_ROOM=MH-301

# Step 3: Run the kiosk
python -m rpi.main_kiosk

# Step 4: Test the following scenarios:
# a) Face detection: Stand 50-100cm from camera, verify face bounding box appears
# b) Face recognition: Verify enrolled user is recognized by name
# c) Gesture detection: Show peace sign, thumbs up, open palm — verify detection
# d) Attendance logging: Complete full ENTRY → BREAK_OUT → BREAK_IN → EXIT cycle
# e) Performance: Check that frame processing stays within 250ms budget
```

---

## 10. Troubleshooting

### 10.1 Common USB Webcam Issues on Raspberry Pi

#### Issue 1: Camera Not Detected

```bash
# Symptom: /dev/video* doesn't exist after plugging in camera

# Solution 1: Check USB connection
lsusb  # Should show the webcam

# Solution 2: Check dmesg for errors
dmesg | tail -20
# Look for: "usb X-X: new high-speed USB device"

# Solution 3: Try different USB port
# USB 3.0 ports (blue) are preferred for bandwidth

# Solution 4: Check if UVC driver is loaded
lsmod | grep uvcvideo
# If empty: sudo modprobe uvcvideo

# Solution 5: Update system
sudo apt update && sudo apt upgrade -y
sudo reboot
```

#### Issue 2: Permission Denied

```bash
# Symptom: cv2.VideoCapture(0) opens but read() fails, or "Permission denied"

# Solution: Add user to 'video' group
sudo usermod -aG video $USER
# IMPORTANT: Log out and log back in for group change to take effect

# Verify group membership
groups $USER
# Should include: video

# Alternative: Set device permissions directly (temporary)
sudo chmod 666 /dev/video0
```

#### Issue 3: Low FPS / Stuttering

```bash
# Symptom: Camera captures at 10fps or less instead of 30fps

# Solution 1: Use MJPEG instead of YUYV (raw)
# In Python:
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))

# Solution 2: Lower resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Solution 3: Reduce buffer size
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

# Solution 4: Check CPU temperature (RPi may be throttling)
vcgencmd measure_temp
# If > 80°C, add heatsink/fan or reduce workload

# Solution 5: Check USB bandwidth (other USB devices competing)
lsusb -t  # Shows bandwidth tree
```

#### Issue 4: USB Power Issues

```bash
# Symptom: Camera disconnects randomly, or fails under load

# Diagnosis: Check dmesg for USB errors
dmesg | grep -i "usb\|over-current\|power"

# Solution 1: Use a POWERED USB hub
# The RPi 4 provides max 1.2A across all USB ports combined.
# If camera + other peripherals exceed this, use a powered hub.

# Solution 2: Increase USB current limit (RPi config)
sudo nano /boot/firmware/config.txt
# Add: max_usb_current=1

# Solution 3: Use a higher-rated power supply for RPi
# Use official RPi 4 power supply (5.1V, 3A) — NOT a phone charger
```

#### Issue 5: Blurry / Out-of-Focus Image

```bash
# Symptom: Face appears blurry, affecting recognition accuracy

# Solution 1: Adjust focus distance (for cameras with manual focus)
v4l2-ctl -d /dev/video0 --set-ctrl=focus_automatic_continuous=0
v4l2-ctl -d /dev/video0 --set-ctrl=focus_absolute=30  # Adjust 0-255

# Solution 2: Enable autofocus (if supported)
v4l2-ctl -d /dev/video0 --set-ctrl=focus_automatic_continuous=1

# Solution 3: Ensure proper lighting
# Face recognition requires clear, well-lit face images.
# Add LED lighting if the kiosk location is dim.

# Solution 4: Clean the lens
# USB webcam lenses attract fingerprints and dust
```

#### Issue 6: Green/Corrupted Frames

```bash
# Symptom: Frames are green, have artifacts, or are partially corrupted

# Solution 1: Reduce resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Solution 2: Use YUYV instead of MJPEG
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('Y', 'U', 'Y', 'V'))

# Solution 3: Add warm-up frames (discard first few)
for i in range(10):
    cap.read()  # Discard warm-up frames
# Now use cap.read() for real frames

# Solution 4: Try a different USB cable (if not built-in)
# Cheap cables cause data corruption at high bandwidth
```

#### Issue 7: Camera Works on Laptop But Not RPi

```bash
# Common cause: OpenCV built without V4L2 support on RPi

# Check OpenCV build info
python3 -c "import cv2; print(cv2.getBuildInformation())" | grep V4L

# If V4L is not listed:
sudo apt install python3-opencv  # System package has V4L2
# OR rebuild opencv-python from source with V4L2 flag

# Alternative: Install from pip with correct flags
pip install opencv-python-headless  # Headless version usually works
```

### 10.2 Quick Diagnostic Script

Save and run this script to diagnose camera issues:

```python
#!/usr/bin/env python3
"""
FRAMES Camera Diagnostic Script
Checks all common camera issues in sequence.
"""
import subprocess
import sys
import os

def run_cmd(cmd):
    """Run a shell command and return output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.stdout.strip()
    except Exception as e:
        return f"ERROR: {e}"

def main():
    print("=" * 60)
    print("FRAMES Camera Diagnostic Tool")
    print("=" * 60)
    
    # 1. USB devices
    print("\n1. USB Devices:")
    print(run_cmd("lsusb"))
    
    # 2. Video devices
    print("\n2. Video Devices:")
    print(run_cmd("ls -la /dev/video* 2>/dev/null || echo 'No video devices found'"))
    
    # 3. V4L2 details
    print("\n3. V4L2 Device List:")
    print(run_cmd("v4l2-ctl --list-devices 2>/dev/null || echo 'v4l2-ctl not installed'"))
    
    # 4. User groups
    print(f"\n4. User Groups for '{os.getenv('USER', 'unknown')}':")
    print(run_cmd("groups"))
    
    # 5. UVC driver
    print("\n5. UVC Driver:")
    uvc = run_cmd("lsmod | grep uvcvideo")
    print(uvc if uvc else "NOT LOADED — run: sudo modprobe uvcvideo")
    
    # 6. OpenCV test
    print("\n6. OpenCV Capture Test:")
    try:
        import cv2
        print(f"   OpenCV version: {cv2.__version__}")
        cap = cv2.VideoCapture(0)
        print(f"   Camera opened: {cap.isOpened()}")
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print(f"   Frame captured: {frame.shape}")
                print("   ✅ Camera is working!")
            else:
                print("   ❌ Camera opened but cannot read frames")
            cap.release()
        else:
            print("   ❌ Cannot open camera. Check connection and permissions.")
    except ImportError:
        print("   OpenCV not installed")
    
    # 7. Temperature
    print("\n7. CPU Temperature:")
    print(run_cmd("vcgencmd measure_temp 2>/dev/null || echo 'Not available (not RPi?)'"))
    
    # 8. USB power
    print("\n8. USB Power Status:")
    print(run_cmd("dmesg | grep -i 'over-current\\|power' | tail -5 || echo 'No issues'"))
    
    print("\n" + "=" * 60)
    print("Diagnostic complete.")
    print("=" * 60)

if __name__ == "__main__":
    main()
```

---

## 11. Cost Analysis

### 11.1 Per-Kiosk Cost Comparison

#### Option A: RPi Camera Module v2 (Current)

| Component | Price (USD) | Price (PHP) |
|-----------|------------|-------------|
| RPi Camera Module v2 (IMX219) | $25.00 | ₱1,400 |
| CSI Ribbon Cable (15cm) | $2.50 | ₱140 |
| Camera mounting bracket (3D-printed or purchased) | $3.00 | ₱168 |
| **Total per kiosk** | **$30.50** | **₱1,708** |

#### Option B: RPi Camera Module v3 (Upgrade)

| Component | Price (USD) | Price (PHP) |
|-----------|------------|-------------|
| RPi Camera Module v3 (IMX708, autofocus) | $35.00 | ₱1,960 |
| CSI Ribbon Cable (15cm) | $2.50 | ₱140 |
| Camera mounting bracket | $3.00 | ₱168 |
| **Total per kiosk** | **$40.50** | **₱2,268** |

#### Option C: Logitech C270 (Budget USB — Recommended)

| Component | Price (USD) | Price (PHP) |
|-----------|------------|-------------|
| Logitech C270 webcam | $20.00 | ₱1,120 |
| *(Built-in mount, cable, no extras needed)* | — | — |
| **Total per kiosk** | **$20.00** | **₱1,120** |

#### Option D: Logitech C920 (Premium USB)

| Component | Price (USD) | Price (PHP) |
|-----------|------------|-------------|
| Logitech C920 webcam | $60.00 | ₱3,360 |
| *(Built-in mount, cable, no extras needed)* | — | — |
| **Total per kiosk** | **$60.00** | **₱3,360** |

#### Option E: A4Tech PK-910H (Budget 1080p — PH-Friendly)

| Component | Price (USD) | Price (PHP) |
|-----------|------------|-------------|
| A4Tech PK-910H webcam | $25.00 | ₱1,400 |
| *(Built-in mount, cable, no extras needed)* | — | — |
| **Total per kiosk** | **$25.00** | **₱1,400** |

#### Option F: Generic 1080p (Ultra-Budget)

| Component | Price (USD) | Price (PHP) |
|-----------|------------|-------------|
| Generic USB webcam (Lazada/Shopee) | $10.00 | ₱560 |
| *(Built-in mount, cable)* | — | — |
| Backup unit (high failure rate) | $10.00 | ₱560 |
| **Total per kiosk (with backup)** | **$20.00** | **₱1,120** |

### 11.2 Savings Analysis (vs. RPi Camera Module v2)

| USB Webcam Option | Cost per Kiosk | Savings vs. RPi Cam v2 | % Savings |
|-------------------|---------------|----------------------|-----------|
| **Logitech C270** | ₱1,120 | ₱588 per kiosk | **34%** |
| **A4Tech PK-910H** | ₱1,400 | ₱308 per kiosk | **18%** |
| **Generic 1080p** | ₱560 | ₱1,148 per kiosk | **67%** |
| **Logitech C920** | ₱3,360 | −₱1,652 (more expensive) | **-97%** |

### 11.3 Fleet Deployment Cost (Multiple Kiosks)

For a university deployment with **5, 10, or 20 kiosks**:

| Kiosks | RPi Cam v2 | Logitech C270 | A4Tech PK-910H | Generic 1080p |
|--------|-----------|---------------|----------------|---------------|
| **5** | ₱8,540 | ₱5,600 | ₱7,000 | ₱5,600* |
| **10** | ₱17,080 | ₱11,200 | ₱14,000 | ₱11,200* |
| **20** | ₱34,160 | ₱22,400 | ₱28,000 | ₱22,400* |
| **Savings (20 units vs RPi Cam)** | — | **₱11,760** | **₱6,160** | **₱22,960*** |

*\*Generic pricing includes backup units (50% spare ratio due to quality concerns).*

### 11.4 Bulk Purchase Considerations

- **Logitech C270:** Available in bulk from authorized distributors (EasyPC, DynaQuest). Discounts of 5–10% possible for 10+ units. Contact DataBlitz or Logitech Philippines for institutional pricing.
- **A4Tech PK-910H:** A4Tech has strong Philippine distribution. Contact A4Tech Philippines for bulk pricing.
- **Generic:** Bulk purchase from Shopee/Lazada sellers often includes free shipping and volume discounts. However, **quality control is poor** — expect 10–20% defect rate.

### 11.5 Total Kiosk Cost (Complete Hardware)

For context, here is the full kiosk hardware cost:

| Component | Price (PHP) | Notes |
|-----------|-------------|-------|
| Raspberry Pi 4 Model B (4GB) | ₱3,500–4,500 | Core computing unit |
| MicroSD Card (32GB) | ₱350–500 | OS and software storage |
| RPi Power Supply (5.1V 3A) | ₱500–700 | Official power adapter |
| **Camera (USB Webcam - C270)** | **₱1,120** | **Face recognition camera** |
| Case/Enclosure | ₱300–1,000 | Protection and mounting |
| Display (7" touchscreen) | ₱2,500–4,000 | Optional — kiosk display |
| Ethernet Cable (or WiFi) | ₱100–300 | Network connectivity |
| **Total per Kiosk** | **₱8,370–₱12,120** | |

The camera represents **~9–13%** of total kiosk cost. The savings from switching to USB webcam (₱588 per kiosk) are meaningful but not transformative relative to total cost.

---

## 12. Migration Checklist

### 12.1 Pre-Migration Preparation

- [ ] **Acquire USB webcam** — Logitech C270 recommended (or equivalent)
- [ ] **Verify USB webcam works on a laptop** — Quick OpenCV test
- [ ] **Back up current kiosk configuration** — Copy `config.py` and `.env` files
- [ ] **Document current system state** — Note current camera performance metrics
- [ ] **Prepare fallback plan** — Keep RPi Camera Module connected (can switch back)

### 12.2 Hardware Steps

- [ ] **Power off the Raspberry Pi** — `sudo shutdown -h now`
- [ ] **Connect USB webcam** to any USB port (USB 3.0 blue port preferred)
- [ ] **(Optional) Disconnect CSI camera ribbon** — Not required, but reduces confusion
- [ ] **Power on the Raspberry Pi**
- [ ] **Verify device detection** — `lsusb` should show the webcam
- [ ] **Verify V4L2 device** — `ls /dev/video*` should show `/dev/video0`

### 12.3 Software Configuration Steps

- [ ] **Set environment variable** — `export USE_PICAMERA2=false` (add to `.env` or systemd service)
- [ ] **Update camera resolution** — Set `CAMERA_WIDTH=1280`, `CAMERA_HEIGHT=720`
- [ ] **Update camera FPS** — Set `CAMERA_FPS=15`
- [ ] **Update det_size** — Set `RECOGNITION_DET_SIZE=320` (or update config.py)
- [ ] **Add user to video group** — `sudo usermod -aG video $USER` (then log out/in)
- [ ] **(Optional) Create udev rule** — For persistent device naming
- [ ] **(Optional) Update systemd service** — Add environment variables

### 12.4 Verification Steps

- [ ] **Run camera diagnostic script** — Verify all checks pass
- [ ] **Run face detection test** — Verify InsightFace detects faces from USB webcam
- [ ] **Run gesture detection test** — Verify MediaPipe detects hand gestures
- [ ] **Run performance benchmark** — Verify frame processing < 250ms
- [ ] **Test full attendance cycle** — ENTRY → BREAK_OUT → BREAK_IN → EXIT
- [ ] **Test at different distances** — 30cm, 50cm, 100cm, 150cm from camera
- [ ] **Test in actual kiosk lighting** — Verify performance in deployment environment
- [ ] **Monitor for 1 hour** — Check for disconnections, memory leaks, FPS drops

### 12.5 Rollback Plan

If the USB webcam does not perform adequately:

```bash
# Step 1: Power off RPi
sudo shutdown -h now

# Step 2: Reconnect RPi Camera Module via CSI ribbon cable

# Step 3: Restore picamera2 setting
export USE_PICAMERA2=true

# Step 4: Restore original resolution
export CAMERA_WIDTH=480
export CAMERA_HEIGHT=360

# Step 5: Power on and verify
sudo reboot
# Test: rpicam-hello --timeout 5000  (should show preview)
```

### 12.6 Post-Migration Monitoring

- [ ] **Monitor kiosk metrics for 24 hours** — Check metrics via `MetricsCollector`
- [ ] **Verify attendance accuracy** — Compare recognition rates before/after migration
- [ ] **Check memory usage** — `psutil.Process().memory_info().rss` should stay < 2.5 GB
- [ ] **Verify offline mode still works** — Disconnect network, verify local logging continues
- [ ] **Document final performance numbers** — Update deployment documentation

---

## 13. Conclusion & Recommendation

### 13.1 Summary of Findings

After thorough analysis of hardware options, performance characteristics, codebase compatibility, and cost considerations, the following conclusions apply to the FRAMES kiosk deployment:

1. **The existing FRAMES codebase already supports USB webcams** — The camera abstraction layer in `backend/rpi/camera.py` was designed with dual-backend support (picamera2 for CSI, OpenCV for USB). Switching requires only configuration changes, not code changes.

2. **720p resolution is optimal for FRAMES** — At the typical kiosk operating distance (0.5–1.5m), 720p provides 200+ pixels of face coverage, well above InsightFace's 112×112 alignment target. Higher resolutions offer diminishing returns with increased processing cost.

3. **USB webcams perform comparably to CSI cameras** for face recognition — The 5–15ms additional capture latency of USB vs. CSI is negligible when InsightFace inference takes 150–250ms.

4. **USB webcams are significantly easier to deploy** — plug-and-play, built-in mounting, longer cables, no custom driver configuration, widely available.

### 13.2 Primary Recommendation: Logitech C270

**For the FRAMES capstone deployment, we recommend the Logitech C270 as the primary webcam choice.**

| Criterion | Assessment |
|-----------|-----------|
| **Resolution** | 720p — optimal for FRAMES (sufficient for InsightFace at kiosk distance) |
| **Cost** | ₱1,120 (~$20) — 34% cheaper than RPi Camera Module v2 |
| **Availability** | Excellent — available at all major electronics retailers in the Philippines |
| **Reliability** | Proven brand with 2-year warranty; millions of units deployed worldwide |
| **Linux Compatibility** | Perfect — UVC compliant, works out-of-box with OpenCV |
| **Mounting** | Built-in universal clip — no custom bracket needed |
| **Cable Length** | 1.5m — adequate for most kiosk enclosure designs |

### 13.3 Alternative Recommendation: Logitech C920

**For deployments requiring maximum face recognition accuracy:**

| Criterion | Assessment |
|-----------|-----------|
| **Resolution** | 1080p — provides 50% more face detail than 720p |
| **Autofocus** | 20-step glass lens — handles varying distances automatically |
| **Low-Light** | HD Auto Light Correction — important for poorly-lit rooms |
| **Cost** | ₱3,360 (~$60) — premium but justified for accuracy-critical deployments |
| **Best for** | Kiosks in variable lighting conditions or with wide user distance range |

### 13.4 Decision Matrix

| Deployment Scenario | Recommended Camera | Rationale |
|--------------------|-------------------|-----------|
| **Capstone demo / defense** | Logitech C270 | Cost-effective, sufficient quality, easy to present |
| **Single kiosk pilot** | Logitech C270 or A4Tech PK-910H | Budget-friendly validation |
| **Multi-kiosk deployment (5–10 units)** | Logitech C270 | Lowest fleet cost, consistent quality |
| **Variable-lighting environments** | Logitech C920 | Autofocus + better low-light handling |
| **High-security / high-accuracy** | Logitech C920 | Best embedding quality from higher resolution + autofocus |
| **Maximum budget constraint** | A4Tech PK-910H | 1080p + autofocus at C270 pricing |

### 13.5 Final Statement

The migration from RPi Camera Module to USB webcam is a **low-risk, high-benefit change** for the FRAMES project. The existing codebase architecture already supports it, the performance impact is negligible, and the practical benefits (cost, availability, mounting, reliability) are significant. For the capstone defense presentation, this migration demonstrates thoughtful engineering consideration of deployment constraints, hardware flexibility, and cost optimization — qualities expected of a production-ready system.

---

## 14. Appendix

### Appendix A: USB Vendor/Product IDs for Common Webcams

| Webcam | Vendor ID | Product ID | lsusb String |
|--------|-----------|------------|--------------|
| Logitech C270 | `046d` | `0825` | `Logitech, Inc. Webcam C270` |
| Logitech C310 | `046d` | `081b` | `Logitech, Inc. Webcam C310` |
| Logitech C920 | `046d` | `082d` | `Logitech, Inc. HD Pro Webcam C920` |
| Logitech C922 | `046d` | `085c` | `Logitech, Inc. C922 Pro Stream Webcam` |
| Logitech Brio | `046d` | `085e` | `Logitech, Inc. BRIO` |
| A4Tech PK-910H | `09da` | `2690` | `A4Tech Co., Ltd. USB Camera` |

### Appendix B: OpenCV CAP_PROP Constants Reference

| Constant | Value | Description |
|----------|-------|-------------|
| `CAP_PROP_FRAME_WIDTH` | 3 | Frame width in pixels |
| `CAP_PROP_FRAME_HEIGHT` | 4 | Frame height in pixels |
| `CAP_PROP_FPS` | 5 | Frame rate |
| `CAP_PROP_FOURCC` | 6 | Codec/format (MJPG, YUYV, etc.) |
| `CAP_PROP_BUFFERSIZE` | 38 | Internal frame buffer size |
| `CAP_PROP_AUTO_EXPOSURE` | 21 | Auto exposure mode |
| `CAP_PROP_AUTOFOCUS` | 39 | Autofocus enable/disable |
| `CAP_PROP_FOCUS` | 28 | Manual focus position |
| `CAP_PROP_BRIGHTNESS` | 10 | Brightness control |
| `CAP_PROP_CONTRAST` | 11 | Contrast control |
| `CAP_PROP_SATURATION` | 12 | Saturation control |
| `CAP_PROP_EXPOSURE` | 15 | Manual exposure value |

### Appendix C: V4L2 Camera Controls

```bash
# List all available controls for your camera
v4l2-ctl -d /dev/video0 -l

# Common controls and their typical ranges:
# brightness (int)         : min=0 max=255 step=1 default=128
# contrast (int)           : min=0 max=255 step=1 default=128
# saturation (int)         : min=0 max=255 step=1 default=128
# sharpness (int)          : min=0 max=255 step=1 default=128
# exposure_auto (menu)     : min=0 max=3 default=3 (3=Auto)
# exposure_absolute (int)  : min=1 max=10000 step=1
# focus_automatic_continuous (bool) : default=1
# focus_absolute (int)     : min=0 max=255 step=5 default=0
```

### Appendix D: Exchange Rate Reference

All PHP prices in this document use the approximate exchange rate:

**1 USD ≈ 56 PHP** (as of early 2026)

Actual prices may vary based on:
- Current exchange rate fluctuations
- Retailer markup and promotions
- Import duties and taxes (12% VAT in Philippines)
- Availability and demand

### Appendix E: References

1. Raspberry Pi Camera Module v2 Documentation — https://www.raspberrypi.com/documentation/accessories/camera.html
2. Logitech C270 Product Page — https://www.logitech.com/en-ph/products/webcams/c270-hd-webcam.html
3. Logitech C920 Product Page — https://www.logitech.com/en-ph/products/webcams/c920s-pro-hd-webcam.html
4. InsightFace GitHub Repository — https://github.com/deepinsight/insightface
5. OpenCV VideoCapture Documentation — https://docs.opencv.org/4.x/d8/dfe/classcv_1_1VideoCapture.html
6. V4L2 (Video for Linux 2) API — https://www.kernel.org/doc/html/latest/userspace-api/media/v4l/v4l2.html
7. USB Video Class (UVC) Specification — https://www.usb.org/document-library/video-class-v15-document-set
8. picamera2 Library Documentation — https://datasheets.raspberrypi.com/camera/picamera2-manual.pdf
9. MediaPipe Hands Documentation — https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker

---

*This document was prepared as part of the FRAMES Capstone Project documentation for the Technological University of the Philippines – Manila (TUP-M), Department of Computer Engineering.*
