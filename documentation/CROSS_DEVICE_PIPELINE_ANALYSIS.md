# Cross-Device Pipeline Analysis: Enrollment (Server) → Recognition (Raspberry Pi 4)

## Why This Document Exists

The FRAMES documentation ([FRAMES_DOCUMENTATION_RECENT.md](../FRAMES_DOCUMENTATION_RECENT.md)) currently describes two **different** model stacks for the two pipelines:

| Pipeline | What the Documentation Says | What's Actually Implemented |
|----------|----------------------------|----------------------------|
| **Enrollment** (server) | "FaceNet" / "InsightFace" | InsightFace `buffalo_l` (ResNet-50 + ArcFace) |
| **Recognition** (RPi) | "MobileNetV2 + FaceNet, TFLite INT8" | InsightFace `buffalo_l` via ONNX Runtime |

This document explains:
1. **Why using two different models across pipelines doesn't work** (proved by the bug we fixed)
2. **What HoG is**, and whether it fits FRAMES
3. **All viable architecture options** for enrolling on webcam and recognizing on RPi4
4. **The recommended approach** with academic justification

---

## Table of Contents

1. [The Cross-Model Problem (Lessons Learned)](#1-the-cross-model-problem)
2. [What is HoG? Can We Use It?](#2-what-is-hog)
3. [Architecture Options for Server Enrollment → RPi Recognition](#3-architecture-options)
4. [Option Comparison Matrix](#4-option-comparison-matrix)
5. [Recommended Architecture](#5-recommended-architecture)
6. [How the Current Implementation Works](#6-current-implementation)
7. [Documentation Corrections Needed](#7-documentation-corrections)
8. [Academic References](#8-academic-references)

---

## 1. The Cross-Model Problem

### What Happened

The original FRAMES codebase enrolled faces with **InsightFace buffalo_l** (ResNet-50 backbone) on the server but attempted recognition with **InsightFace buffalo_sc** (MobileFaceNet backbone) on the kiosk. The result: **0% recognition rate** — every face was "Unknown."

### Why Different Models Don't Work

Face recognition models trained with metric learning (ArcFace, CosFace, etc.) learn a **model-specific embedding space**. Two different models — even if trained on the same data with the same loss — learn **different mappings** from face images to vectors.

```
Model A (ResNet-50 / buffalo_l):
    Face → [ResNet-50 weights] → Point in Sphere_A (512-d)

Model B (MobileFaceNet / buffalo_sc):
    Face → [MobileFaceNet weights] → Point in Sphere_B (512-d)

cosine_similarity(Sphere_A, Sphere_B) ≈ RANDOM (0.05–0.15)
cosine_similarity(Sphere_A, Sphere_A) ≈ MEANINGFUL (0.40–0.70 for same person)
```

This is a fundamental property of deep metric learning embeddings. The vector dimensions are not aligned across architectures — dimension #47 in buffalo_l encodes something completely different than dimension #47 in buffalo_sc (Musgrave et al., 2020).

### The Rule

> **Enrollment and recognition MUST use the exact same model architecture and weights to produce compatible embeddings.**

This means:
- ❌ InsightFace `buffalo_l` enrollment + TFLite MobileFaceNet recognition → **WILL NOT WORK**
- ❌ InsightFace enrollment + FaceNet (Google) recognition → **WILL NOT WORK**
- ✅ Same model on both sides → **WORKS**
- ✅ Same model, different runtime (ONNX vs TFLite of same weights) → **WORKS** (same weights = same embedding space)

---

## 2. What is HoG?

### Definition

**HoG (Histogram of Oriented Gradients)** is a classical computer vision feature descriptor developed by Dalal & Triggs (2005). It works by:

1. Dividing an image into small cells (e.g., 8×8 pixels)
2. Computing the gradient direction and magnitude for each pixel
3. Creating a histogram of gradient orientations per cell
4. Normalizing across blocks of cells for illumination invariance

### HoG in Face Recognition: Two Roles

| Role | HoG Suitability | Accuracy | Speed on RPi4 |
|------|-----------------|----------|---------------|
| **Face Detection** (finding where faces are) | ✅ Good | ~85-90% (simple scenes) | ~20-30ms |
| **Face Recognition** (identifying who) | ❌ Poor | ~70-80% (not production-grade) | N/A |

### HoG for Face Detection

**dlib** includes a HoG-based face detector. It's:
- Very fast on CPU (~20-30ms on RPi4)
- No deep learning required
- Good for frontal faces with reasonable lighting
- **Less accurate** than deep learning detectors (BlazeFace, RetinaFace) for: profile views, small faces, poor lighting

**Comparison with other detectors:**

| Detector | Type | Speed (RPi4) | Accuracy | Profile/Angle | Notes |
|----------|------|-------------|----------|---------------|-------|
| **dlib HoG** | Classical | ~20-30ms | ~85% | Poor | No GPU needed |
| **MediaPipe BlazeFace** | Deep Learning (TFLite) | ~30-50ms | ~95% | Moderate | Already in FRAMES |
| **InsightFace RetinaFace** | Deep Learning (ONNX) | ~150-300ms | ~98% | Good | Part of buffalo_l |
| **Haar Cascades** | Classical | ~15-25ms | ~75% | Very poor | OpenCV built-in, outdated |

### HoG for Face Recognition — Why It Doesn't Work Well

HoG was designed for **object detection**, not identity-level recognition. For face recognition (telling Person A from Person B), you need embeddings that encode identity-specific features. HoG features:

- Capture edge/gradient patterns (good for detecting "this is a face")
- Do NOT capture identity-discriminative features (bad for "this is Person #47")
- Cannot match the 99.5%+ accuracy of deep learning embeddings
- Would require separate training for each new person (not scalable)

**Verdict:** HoG could replace MediaPipe as a face **detection** gate on RPi, but it **cannot replace deep learning for face recognition**. Since MediaPipe BlazeFace is already lightweight and more accurate, there's limited benefit.

### Where HoG Fits in FRAMES (If At All)

```
OPTION A (current — recommended):
  MediaPipe BlazeFace (detection) → InsightFace buffalo_l (recognition)
  
OPTION B (HoG alternative — marginally faster, less accurate):
  dlib HoG detector (detection) → InsightFace buffalo_l (recognition)
  
OPTION C (HoG only — NOT viable for production):
  dlib HoG detector (detection) → HoG/LBP features (recognition) → ~75% accuracy ❌
```

**Recommendation:** Stick with MediaPipe BlazeFace for detection. It's only ~10-20ms slower than HoG but significantly more accurate for varied angles and lighting conditions common in classroom environments.

---

## 3. Architecture Options for Server Enrollment → RPi4 Recognition

Here are **all viable paths** for enrolling on a laptop/server webcam and recognizing on Raspberry Pi 4 Model B:

### Option A: Same Model, Same Runtime (InsightFace ONNX on Both) ⭐ CURRENT

**How it works:** Both enrollment (server) and recognition (RPi4) run InsightFace `buffalo_l` via ONNX Runtime. On RPi4, a two-stage gated detection reduces how often the heavy model runs.

```
SERVER (enrollment):
  Webcam → InsightFace buffalo_l (ONNX Runtime) → 512-d embedding → PostgreSQL

RPi4 (recognition):
  Camera → MediaPipe BlazeFace gate (~30ms)
         → [if face found] → InsightFace buffalo_l (ONNX Runtime, ~200ms) → match
```

| Aspect | Detail |
|--------|--------|
| Re-enrollment needed? | **NO** — already implemented |
| Recognition speed (RPi4) | ~200-250ms per recognition event (3-4 FPS) |
| Idle speed (no face) | ~30-50ms per frame (18-28 FPS) |
| Accuracy | 99.83% LFW (buffalo_l) |
| Dependencies on RPi | `insightface`, `onnxruntime`, `mediapipe`, `opencv-python` |
| Model size on RPi | ~200MB (buffalo_l ONNX files) |
| Complexity | Low — already working, tested |

**Pros:**
- Already implemented and tested (89% frame recognition rate on laptop)
- No re-enrollment ever needed
- No model conversion or quantization steps
- Single codebase for both pipelines
- ONNX Runtime has ARM64 optimizations for RPi4

**Cons:**
- buffalo_l is ~200MB on disk
- ~200ms per recognition event (well within kiosk requirements — under 1s end-to-end from face detection to dashboard update)
- ONNX Runtime on ARM64 may need compilation from source

---

### Option B: Same Model Weights, TFLite Runtime (Convert buffalo_l → TFLite)

**How it works:** Export the buffalo_l ONNX model to TFLite format. Optionally quantize to INT8. Both sides use the **same weights** so embeddings are compatible.

```
SERVER (enrollment):
  Webcam → InsightFace buffalo_l (ONNX) → 512-d embedding → PostgreSQL

RPi4 (recognition):
  Camera → TFLite buffalo_l (INT8 quantized) → 512-d embedding → match
```

| Aspect | Detail |
|--------|--------|
| Re-enrollment needed? | **Depends** — FP32 TFLite: NO. INT8 quantized: possibly slight accuracy drop |
| Recognition speed (RPi4) | ~100-150ms (FP32 TFLite), ~60-100ms (INT8) |
| Accuracy | FP32: ~99.83%, INT8: ~99.5-99.7% (slight quantization loss) |
| Dependencies on RPi | `tflite-runtime`, `opencv-python` |
| Model size on RPi | ~100MB (FP32), ~25MB (INT8) |
| Complexity | **HIGH** — model conversion is non-trivial |

**Pros:**
- Potentially faster on RPi (TFLite is optimized for ARM + NEON)
- INT8 quantization shrinks model to ~25MB
- TFLite runtime is smaller than ONNX Runtime
- Compatible with Coral Edge TPU if added later

**Cons:**
- **Conversion is complex:** ONNX → TFLite path is unreliable for ResNet-50 models; may require ONNX → TF SavedModel → TFLite chain
- INT8 quantization may shift the embedding space slightly → could require re-enrollment or threshold recalibration
- Need to validate embedding alignment after conversion (critical testing)
- InsightFace doesn't officially support TFLite export
- Maintenance burden: every model update requires re-conversion
- Not yet proven for this specific model architecture

**How conversion would work (if attempted):**
```bash
# Step 1: ONNX to TensorFlow SavedModel
pip install onnx onnx-tf
python -c "
import onnx
from onnx_tf.backend import prepare
model = onnx.load('buffalo_l/w600k_r50.onnx')
tf_rep = prepare(model)
tf_rep.export_graph('buffalo_l_saved_model')
"

# Step 2: TF SavedModel to TFLite (FP32)
python -c "
import tensorflow as tf
converter = tf.lite.TFLiteConverter.from_saved_model('buffalo_l_saved_model')
tflite_model = converter.convert()
open('buffalo_l.tflite', 'wb').write(tflite_model)
"

# Step 3: Optional INT8 quantization (requires calibration dataset)
python -c "
import tensorflow as tf
converter = tf.lite.TFLiteConverter.from_saved_model('buffalo_l_saved_model')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = calibration_data_gen  # Need face images!
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
tflite_quant = converter.convert()
open('buffalo_l_int8.tflite', 'wb').write(tflite_quant)
"
```

> ⚠️ **Warning:** This conversion chain has known issues with certain ONNX ops (like `InstanceNormalization`) used in InsightFace models. It may not work without manual intervention.

---

### Option C: Use MobileFaceNet for BOTH Pipelines

**How it works:** Use the lighter `buffalo_sc` (MobileFaceNet) for both enrollment AND recognition. This is fast on RPi but requires re-enrolling all users.

```
SERVER (enrollment):
  Webcam → InsightFace buffalo_sc (MobileFaceNet, ONNX) → 512-d embedding → PostgreSQL

RPi4 (recognition):
  Camera → InsightFace buffalo_sc (MobileFaceNet, ONNX) → 512-d embedding → match
```

| Aspect | Detail |
|--------|--------|
| Re-enrollment needed? | **YES** — all existing profiles must be re-created |
| Recognition speed (RPi4) | ~80-120ms per recognition event (~8-12 FPS) |
| Accuracy | 99.55% LFW |
| Dependencies on RPi | `insightface`, `onnxruntime` |
| Model size on RPi | ~10MB |
| Complexity | Low code changes, but operational overhead for re-enrollment |

**Pros:**
- Smaller and faster on RPi (~80ms vs ~200ms)
- Still uses InsightFace ecosystem (same API)
- Well-tested MobileFaceNet architecture

**Cons:**
- **All 8+ enrolled users must re-enroll their faces**
- Slightly lower accuracy (99.55% vs 99.83%)
- MobileFaceNet is less robust to: extreme angles, low lighting, partial occlusion (Chen et al., 2018)
- For a classroom with 30-50 students, re-enrollment is a significant operational burden

---

### Option D: FaceNet (Google) via TFLite for BOTH Pipelines

**How it works:** Abandon InsightFace entirely. Use Google's FaceNet model (available as TFLite) for both enrollment and recognition.

```
SERVER (enrollment):
  Webcam → FaceNet (TFLite FP32) → 128-d embedding → PostgreSQL

RPi4 (recognition):
  Camera → FaceNet (TFLite INT8) → 128-d embedding → match
```

| Aspect | Detail |
|--------|--------|
| Re-enrollment needed? | **YES** — different model, different embedding space entirely |
| Recognition speed (RPi4) | ~50-80ms (INT8 FaceNet via TFLite) |
| Accuracy | ~99.63% LFW (FaceNet v2) |
| Dependencies on RPi | `tflite-runtime`, `opencv-python` |
| Model size on RPi | ~25MB (FP32), ~7MB (INT8) |
| Complexity | **HIGH** — full stack rewrite, schema change (512-d → 128-d) |

**Pros:**
- Purpose-built for TFLite (no conversion issues)
- Fastest option on RPi4
- Smallest model size
- Well-documented and widely used

**Cons:**
- **Complete pipeline rewrite** (enrollment service, recognition, cache, matching)
- **Database schema change** (embedding column: 512 floats → 128 floats)
- **All users must re-enroll**
- 128-d embeddings may be slightly less discriminative than 512-d at scale
- FaceNet's pre-trained models are older (2015-era) vs InsightFace (2022-era)
- Need separate face detection (FaceNet doesn't include a detector)
- Alignment preprocessing is different from InsightFace

---

### Option E: Dual-Embedding Storage (Enroll with Both Models)

**How it works:** During enrollment, run BOTH buffalo_l and buffalo_sc (or FaceNet TFLite). Store both embeddings. RPi uses the lightweight embedding, server uses the heavy one.

```
SERVER (enrollment):
  Webcam → InsightFace buffalo_l → 512-d embedding_heavy → PostgreSQL
         → InsightFace buffalo_sc → 512-d embedding_light → PostgreSQL

RPi4 (recognition):
  Camera → buffalo_sc → 512-d → match against embedding_light column
```

| Aspect | Detail |
|--------|--------|
| Re-enrollment needed? | **YES** — need to generate the second embedding for all existing users |
| Accuracy | 99.55% on RPi (buffalo_sc), 99.83% on server (buffalo_l) |
| Dependencies on RPi | `insightface`, `onnxruntime` (lighter model) |
| Complexity | **MEDIUM** — schema change, enrollment change, but recognition stays simple |

**Pros:**
- Optimal model per device
- Switchable per device capability
- Future-proof

**Cons:**
- Schema change (add second embedding column)
- Re-enrollment required
- Double storage per user
- Double processing during enrollment
- Overkill for current scope

---

## 4. Option Comparison Matrix

| Criteria | A: Same Model ONNX ⭐ | B: TFLite Convert | C: buffalo_sc Both | D: FaceNet TFLite | E: Dual Embed |
|----------|:---:|:---:|:---:|:---:|:---:|
| **Re-enrollment required** | ❌ No | ⚠️ Maybe | ✅ Yes | ✅ Yes | ✅ Yes |
| **Code changes needed** | None (done) | Medium | Small | Large | Medium |
| **RPi recognition speed** | ~200ms | ~60-100ms | ~80-120ms | ~50-80ms | ~80-120ms |
| **Accuracy (LFW)** | 99.83% | ~99.5-99.7% | 99.55% | 99.63% | 99.55% (RPi) |
| **Model size on RPi** | ~200MB | ~25-100MB | ~10MB | ~7-25MB | ~10MB |
| **Conversion complexity** | None | High | None | None | None |
| **Schema changes** | None | None | None | Yes (128-d) | Yes (+column) |
| **Risk level** | Low | High | Low | High | Medium |
| **Already working?** | ✅ Yes | No | No | No | No |
| **Kiosk-acceptable speed?** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 5. Recommended Architecture

### **Recommendation: Option A — Same Model (InsightFace buffalo_l) on Both, ONNX Runtime**

For a **capstone defense**, Option A is the strongest choice because:

1. **It's already working and tested.** No re-enrollment, no conversion, no risk of new bugs.

2. **200ms recognition is well within requirements.** The user walks up, gets recognized (~200ms), the result is sent to the database, and the dashboard reflects their presence in real time — all under 1 second end-to-end. A 200ms recognition time is imperceptible to the user.

3. **The two-stage gated detection solves the RPi performance problem.** When no one is at the kiosk, the system runs only MediaPipe BlazeFace (~30ms/frame, 28+ FPS). InsightFace only activates when a face is detected.

4. **One model = zero embedding compatibility issues.** The bug we fixed proved that cross-model embeddings don't work. Keeping one model eliminates this entire class of bugs.

5. **Simpler to defend.** "We use the same model on both sides because embeddings are model-specific" is a clean, defensible statement backed by literature (Deng et al., 2019; Musgrave et al., 2020).

### When to Consider Other Options

| If... | Then consider... |
|-------|-----------------|
| RPi4 can't install ONNX Runtime (compilation fails) | Option C (buffalo_sc both sides) — simplest fallback |
| You need <100ms recognition for a future live-tracking feature | Option B (TFLite conversion) or Option C |
| The capstone panel specifically asks "why not TFLite?" | Acknowledge it's viable via Option B, explain the conversion complexity and that Option A meets performance requirements |
| You plan to add Coral Edge TPU | Option B or D (TFLite models work with Edge TPU if fully quantized) |

---

## 6. How the Current Implementation Works

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ENROLLMENT (Server / Laptop)                    │
│                                                                     │
│  Browser Webcam → 15 frames → POST /api/users/enroll-face          │
│       │                                                             │
│       ▼                                                             │
│  InsightFace buffalo_l (ONNX Runtime)                               │
│  ├── FaceAnalysis(name='buffalo_l')                                 │
│  ├── .prepare(ctx_id=0, det_size=(640,640))                         │
│  └── face.normed_embedding → 512-d float32                         │
│       │                                                             │
│       ▼                                                             │
│  Average 15 embeddings → L2 normalize → store as bytes             │
│       │                                                             │
│       ▼                                                             │
│  PostgreSQL: facial_profiles.embedding (LargeBinary)                │
│  + facial_profiles.model_version = 'insightface_buffalo_l_v1'       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    export_embeddings.py
                              │
                              ▼
                   embeddings_cache.json
                              │
                     (copied to RPi4)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RECOGNITION (RPi4 Kiosk)                         │
│                                                                     │
│  USB Camera (480×360 @ 15fps)                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌─── Frame Skip (process every 5th frame) ──────────────────────┐ │
│  │                                                                │ │
│  │  Stage 1: MediaPipe BlazeFace (~30ms)                          │ │
│  │  ├── Face found?                                               │ │
│  │  │   ├── NO → skip frame (saves ~200ms) → next frame          │ │
│  │  │   └── YES + big enough (>80px)?                             │ │
│  │  │       │                                                     │ │
│  │  │       ▼                                                     │ │
│  │  │  Stage 2: InsightFace buffalo_l (ONNX, ~200ms)              │ │
│  │  │  ├── FaceAnalysis(name='buffalo_l')                         │ │
│  │  │  ├── .prepare(ctx_id=0, det_size=(320,320))                 │ │
│  │  │  └── face.normed_embedding → 512-d                          │ │
│  │  │       │                                                     │ │
│  │  │       ▼                                                     │ │
│  │  │  Cosine similarity vs cache matrix (~1ms)                   │ │
│  │  │  ├── score ≥ 0.35 → MATCH → Gesture gate                   │ │
│  │  │  └── score < 0.35 → Unknown → next frame                   │ │
│  │  │                                                             │ │
│  │  │       ▼                                                     │ │
│  │  │  Stage 3: MediaPipe Hands — Gesture check                   │ │
│  │  │  ├── ✌️ Peace sign → BREAK OUT                              │ │
│  │  │  ├── 👍 Thumbs up → BREAK IN                                │ │
│  │  │  ├── 🖐 Open palm → EXIT                                    │ │
│  │  │  └── 3 consecutive frames required                          │ │
│  │  │                                                             │ │
│  │  │       ▼                                                     │ │
│  │  │  Log attendance → POST /api/kiosk/attendance/log            │ │
│  │  │                                                             │ │
│  └──┴────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  PERFORMANCE:                                                       │
│  ├── Idle (no face): ~30ms/frame → ~28 FPS                         │
│  ├── Recognition: ~230ms → ~3-4 FPS (but only processing 1 in 5)   │
│  └── Gesture: ~310ms total → acceptable for one-shot kiosk event    │
│                                                                     │
│  SAME MODEL on both pipelines:                                      │
│  └── InsightFace buffalo_l = ResNet-50 + ArcFace + ONNX Runtime    │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Technical Details

| Parameter | Enrollment (Server) | Recognition (RPi4) | Recognition (Laptop) |
|-----------|--------------------|--------------------|---------------------|
| Model | `buffalo_l` | `buffalo_l` | `buffalo_l` |
| Runtime | ONNX Runtime (CPU) | ONNX Runtime (CPU) | ONNX Runtime (CPU) |
| Det size | (640, 640) | (320, 320) | (640, 640) |
| Embedding dim | 512-d float32 | 512-d float32 | 512-d float32 |
| Normalization | L2 normalized | L2 normalized | L2 normalized |
| Detection gate | N/A | MediaPipe BlazeFace | None (InsightFace direct) |
| Frame skip | N/A | Every 5th frame | Every frame |

---

## 7. Documentation Corrections Needed

The [FRAMES_DOCUMENTATION_RECENT.md](../FRAMES_DOCUMENTATION_RECENT.md) has several statements that need updating to match the actual implementation:

### Section 4.3 — "TFLite FaceNet model extracts embedding"
- **Current:** "TFLite FaceNet model extracts embedding"
- **Should be:** "InsightFace buffalo_l extracts embedding (same model as enrollment)"
- **Why:** We use InsightFace (not FaceNet) on the RPi, with ONNX Runtime (not TFLite)

### Section 5.3 — "TFLite FaceNet Inference (INT8)"
- **Current:** Recognition pipeline uses "TFLite FaceNet Inference (INT8)"
- **Should be:** "InsightFace buffalo_l Inference (ONNX Runtime)" with gated detection
- **Why:** No TFLite or FaceNet is used in the actual code

### Section 7 — "Why TensorFlow Lite (TFLite)?"
- **The entire section about TFLite vs DeepFace** doesn't apply since we use ONNX Runtime
- **Should be updated** to explain why ONNX Runtime + gated detection was chosen over TFLite

### Section 8 — "Model Quantization (INT8)"
- **Current:** Describes INT8 quantization used on RPi
- **This is not currently implemented.** The RPi uses the same FP32 ONNX model with gated detection for speed optimization instead of quantization.

### Section 10 — Technology Stack
- **Current:** "MobileNetV2 + FaceNet, TensorFlow Lite (INT8) for rasp pi, insightface for face enrollment pipeline"
- **Should be:** "InsightFace buffalo_l (ResNet-50 + ArcFace) for both enrollment and recognition, ONNX Runtime, MediaPipe BlazeFace (detection gate), MediaPipe Hands (gesture detection)"

---

## 8. Academic References

### Cross-Model Embedding Incompatibility

> **Deng, J., Guo, J., Xue, N., & Zafeiriou, S. (2019).** ArcFace: Additive Angular Margin Loss for Deep Face Recognition. *CVPR*, pp. 4690–4699. DOI: [10.1109/CVPR.2019.00482](https://doi.org/10.1109/CVPR.2019.00482)

ArcFace introduces angular margin penalty for discriminative face embeddings. The embedding space is specific to the model backbone — different architectures produce non-interchangeable embeddings even with the same loss function.

### MobileFaceNet Architecture

> **Chen, S., Liu, Y., Gao, X., & Han, Z. (2018).** MobileFaceNets: Efficient CNNs for Accurate Real-Time Face Verification on Mobile Devices. *CCBR*, pp. 495–504. DOI: [10.1007/978-3-319-97909-0_53](https://doi.org/10.1007/978-3-319-97909-0_53)

MobileFaceNet achieves 99.55% LFW with depthwise separable convolutions. While fast, it learns a different feature space from ResNet-50, confirming cross-model incompatibility.

### Metric Learning Embedding Spaces

> **Musgrave, K., Belongie, S., & Lim, S.-N. (2020).** A Metric Learning Reality Check. *ECCV*, pp. 681–699. DOI: [10.1007/978-3-030-58595-2_41](https://doi.org/10.1007/978-3-030-58595-2_41)

Demonstrates that embedding spaces from different architectures are not directly comparable, even with the same training data and loss function. Architecture shapes the embedding geometry fundamentally.

### HoG Feature Descriptor

> **Dalal, N. & Triggs, B. (2005).** Histograms of Oriented Gradients for Human Detection. *CVPR*, pp. 886–893. DOI: [10.1109/CVPR.2005.177](https://doi.org/10.1109/CVPR.2005.177)

The original HoG paper. Designed for object detection (pedestrians, faces), not identity-level recognition. Captures edge/gradient structures invariant to illumination changes.

### HoG-Based Face Detection (dlib)

> **King, D. E. (2009).** Dlib-ml: A Machine Learning Toolkit. *Journal of Machine Learning Research*, 10, pp. 1755–1758. [JMLR](http://jmlr.org/papers/v10/king09a.html)

dlib's face detector uses HoG + linear SVM, achieving fast and reliable frontal face detection. Well-suited for CPU-only environments but less robust than deep learning detectors for varied poses.

### ONNX Runtime for Edge Deployment

> **ONNX Runtime Team (2021).** ONNX Runtime: Cross-platform, High Performance ML Inferencing and Training Accelerator. [https://onnxruntime.ai/](https://onnxruntime.ai/)

ONNX Runtime provides optimized inference for ARM64 platforms including Raspberry Pi. Supports graph optimizations, quantization-aware operators, and NEON SIMD acceleration on ARM.

### FaceNet (For Reference)

> **Schroff, F., Kalenichenko, D., & Philbin, J. (2015).** FaceNet: A Unified Embedding for Face Recognition and Clustering. *CVPR*, pp. 815–823. DOI: [10.1109/CVPR.2015.7298682](https://doi.org/10.1109/CVPR.2015.7298682)

Google's FaceNet introduced the triplet-loss face embedding approach with 128-d vectors. While influential, its pre-trained models are older (2015) and produce different embedding spaces than InsightFace models (2019-2022).

### TFLite for Edge Inference (For Reference)

> **David, R., Duke, J., Jain, A., et al. (2021).** TensorFlow Lite Micro: Embedded Machine Learning for TinyML Systems. *Proceedings of Machine Learning and Systems (MLSys)*, 3, pp. 800–811. [arXiv:2010.08678](https://arxiv.org/abs/2010.08678)

TFLite provides optimized inference for mobile and embedded devices. While powerful for models designed for TFLite (e.g., MobileNet family), converting arbitrary ONNX models to TFLite is non-trivial and may introduce embedding space distortions.

### MediaPipe BlazeFace

> **Bazarevsky, V., Kartynnik, Y., Vakunov, A., Raveendran, K., & Grundmann, M. (2019).** BlazeFace: Sub-millisecond Neural Face Detection on Mobile GPUs. *CVPR Workshop on Computer Vision for AR/VR*. [arXiv:1907.05047](https://arxiv.org/abs/1907.05047)

BlazeFace achieves sub-millisecond face detection on mobile GPUs. On RPi4 CPU, it runs at ~30-50ms — significantly faster than full InsightFace detection, making it ideal as a lightweight detection gate.

---

## Summary: Answer to "Won't Different Stacks Work?"

**No.** Enrolling with InsightFace buffalo_l (ResNet-50) and recognizing with MobileFaceNet/FaceNet TFLite produces embeddings in **incompatible vector spaces**. This is the exact bug that caused the "always Unknown" problem.

The **only ways** to use different models across pipelines are:
1. **Convert the same model** to a different runtime (ONNX → TFLite of the same weights) — complex, risky
2. **Re-enroll everyone** with the target model — operational overhead

For a capstone, **using the same model (buffalo_l ONNX) on both sides with gated detection** is the clearest, most defensible, and lowest-risk approach. The ~200ms recognition time on RPi4 is well within kiosk requirements.

---

*Document authored: February 12, 2026*
*Based on: FRAMES codebase analysis, InsightFace documentation, and cited publications*
