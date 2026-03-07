# FRAMES RPi Kiosk — Performance Optimization Analysis

**Written:** 2026-03-07  
**Based on:** Live field logs from RPi 4 (4GB), USB webcam, `buffalo_l` model  

---

## 1. What the Logs Show

Two completely different performance profiles exist inside the same process:

```
METRICS | avg_ms=111.5, fps=7.6    ← no face in frame (fast, MediaPipe only)
METRICS | recognition_avg_ms=2880  ← face detected, InsightFace running (slow)
```

The gated detection is **working correctly**. MediaPipe runs at ~30ms and only calls InsightFace when it sees a face. The bottleneck is entirely InsightFace inference on CPU.

---

## 2. Why `buffalo_l` Is 3000–3500ms

`buffalo_l` loads **five ONNX sub-models** every startup:

| Sub-model | Purpose | Used by kiosk? | Cost |
|---|---|---|---|
| `w600k_r50.onnx` | **ResNet50 embedding** | ✅ Yes | ~2000ms |
| `det_10g.onnx` | Face detection | ✅ Yes | ~800ms |
| `1k3d68.onnx` | 3D face landmarks (68 pts) | ❌ Not needed | ~300ms wasted |
| `2d106det.onnx` | 2D face landmarks (106 pts) | ❌ Not needed | ~300ms wasted |
| `genderage.onnx` | Gender/age prediction | ❌ Not needed | ~100ms wasted |

On RPi CPU (no GPU, no NPU), the ResNet50 (`w600k_r50.onnx`) takes ~2000ms per inference. Every time a face is recognized, this is the cost.

---

## 3. Optimization Options (Ranked by Impact)

---

### Option A: Switch to `buffalo_sc` ← **Simplest path, no extra hardware**

`buffalo_sc` uses a **MobileNet backbone** instead of ResNet50. MobileNet was designed for edge devices.

| Metric | `buffalo_l` (current) | `buffalo_sc` |
|---|---|---|
| Inference per frame | ~3000–3500ms | ~300–500ms |
| Speedup | baseline | **~7–10×** |
| Embedding dimensions | 512-d | 512-d |
| Cold load time | ~6–7s | ~2s |
| Accuracy (LFW benchmark) | 99.77% | 97.5% |

**The catch**: `buffalo_l` and `buffalo_sc` produce *different* embedding spaces even though both output 512-d vectors. Matching a `buffalo_l` enrollment embedding against a `buffalo_sc` recognition embedding produces near-random similarity scores. **Everyone must be re-enrolled.**

**Steps to switch:**

1. In `backend/rpi/config.py`, change:
   ```python
   INSIGHTFACE_MODEL: str = "buffalo_l"
   ```
   to:
   ```python
   INSIGHTFACE_MODEL: str = "buffalo_sc"
   ```
   
2. Also update the backend enrollment to use `buffalo_sc`. Find where `FaceAnalysis` is called server-side (likely in `backend/api/routes/face.py` or `services/face_service.py`) and change the model name there too.

3. Delete all existing facial profiles from the database (they are `buffalo_l` embeddings and are now invalid).

4. Re-enroll every student/faculty from the Admin Panel.

5. Re-export the `embeddings_cache.json` to the RPi.

**After this change**: A student walks up, it recognizes them in ~400ms instead of ~3500ms. From a user's perspective it feels instant.

---

### Option B: Google Coral Edge TPU ← **Extreme speedup, significant work**

#### What Coral Is

The Google Coral USB Accelerator (or M.2/PCIe card) is a hardware co-processor with **~4 TOPS** dedicated to matrix math (neural network inference). It runs TFLite models compiled for the Edge TPU.

Projected performance with Coral:

| Model | Platform | Inference time |
|---|---|---|
| `buffalo_l` | RPi CPU (current) | ~3000–3500ms |
| `buffalo_sc` | RPi CPU | ~300–500ms |
| MobileFaceNet (TFLite EdgeTPU) | **Coral USB** | **~5–15ms** |

That's a **~200–700× speedup** over the current setup.

#### The Hard Problem: Model Incompatibility

**Coral cannot run ONNX models.** InsightFace's `buffalo_l` and `buffalo_sc` are ONNX models. To use Coral, you must switch to a TFLite-based face embedding model.

The standard choice for Coral face recognition is **MobileFaceNet** (or similar), available as a pre-compiled Edge TPU TFLite:
- `mobilefacenet_edgetpu.tflite` (128-d or 192-d embeddings)

This creates the same problem as Option A but more severe: **all existing enrollments must be deleted and re-done using the MobileFaceNet model**.

Additionally, the backend enrollment pipeline (currently using `insightface.app.FaceAnalysis`) must be rewritten to use TFLite inference so enrollment embeddings match what the kiosk generates.

#### What Needs to Be Built for Coral

1. **Install Coral runtime on RPi:**
   ```bash
   echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" | sudo tee /etc/apt/sources.list.d/coral-edgetpu.list
   curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
   sudo apt update
   sudo apt install libedgetpu1-std   # standard clock (safe/cool)
   # OR: libedgetpu1-max              # max clock (~2× faster, runs warm)
   pip install pycoral
   ```

2. **Download a Coral-compatible face embedding model:**
   - Option: `MobileFaceNet_edgetpu.tflite` from public model repositories
   - Must be compiled with `edgetpu_compiler` — pre-compiled versions are available

3. **Rewrite `face_recognizer.py`** to use `pycoral.utils.edgetpu` instead of `onnxruntime`:
   ```python
   from pycoral.utils.edgetpu import make_interpreter
   from pycoral.adapters import common
   
   interpreter = make_interpreter("mobilefacenet_edgetpu.tflite")
   interpreter.allocate_tensors()
   
   # Set input
   common.set_input(interpreter, face_crop_normalized)
   interpreter.invoke()
   
   # Get embedding
   embedding = common.output_tensor(interpreter, 0)  # shape: (128,) or (192,)
   ```

4. **Rewrite the backend enrollment** (`face.py` service) to use the same TFLite model instead of InsightFace. This means removing the `insightface` dependency from the backend API and replacing it with a TFLite inference call.

5. **Re-enroll everyone.**

#### Is Coral Worth It?

| Scenario | Recommendation |
|---|---|
| Demo / capstone presentation | **Option A (buffalo_sc)** — fast to implement, looks great |
| Permanent classroom deployment for many users | **Option B (Coral)** — 400ms is acceptable, but ~10ms is much better at scale |
| Multiple RPis per building | **Option B** — at scale, Coral pays off |

---

### Option C: `RECOGNITION_MIN_INTERVAL_SECONDS = 2.0` ← **1-line fix, works now**

This parameter already exists in the config but defaults to 0 (disabled). Setting it to `2.0` means after any recognition attempt (match or no match), the system waits 2 seconds before trying InsightFace again.

Since a student only needs one successful recognition, repeated 3500ms inference calls while they're standing there are wasted work.

In `backend/rpi/config.py`, add to the `KioskConfig` dataclass:
```python
RECOGNITION_MIN_INTERVAL_SECONDS: float = 2.0
```

This does **not** affect how fast a single recognition completes (still ~3500ms with `buffalo_l`), but reduces CPU thrash between attempts. Already supported in `kiosk_server.py` — just needs the config value set.

---

### Option D: Increase `RECOGNITION_FRAME_SKIP` to 15 ← **1-line fix**

Currently set to `5` on RPi — processes every 5th frame for recognition. At 15fps camera and ~3500ms inference, the recognition thread is already saturated and frames pile up. Increasing to `15` means one recognition attempt per second at most when idle, reducing CPU load when nobody is present.

In `backend/rpi/config.py`:
```python
if self.RECOGNITION_FRAME_SKIP is None:
    self.RECOGNITION_FRAME_SKIP = 15  # was 5
```

---

### Option E: Decouple Schedule API from Recognition Loop ← **Fixes 3–6s API blocks**

Currently `get_active_class()` is called inside the recognition thread. When Render (the cloud backend) is sleeping and times out at 3s, the entire recognition loop blocks for 3 seconds on top of the 3500ms inference. This is why you sometimes see `Frame processing exceeded budget: 6044ms` — that's 3000ms inference + 3000ms API timeout stacked.

**Fix**: Move the schedule poll to a separate background thread with a shared result variable. The recognition thread reads from the variable (instant), the background thread updates it (every 30–60 seconds, non-blocking).

This is a medium-effort code change to `kiosk_server.py`.

---

## 4. Current Architecture Diagram

```
Camera (15fps)
    ↓
Camera Thread (producer)
    ↓ writes latest_frame
Recognition Thread (consumer)
    ├── Frame skip check (skip 4 of every 5 frames)
    ├── MediaPipe gate (~30ms) ← FAST, runs every eligible frame
    │     └── No face? → skip InsightFace entirely
    │     └── Face too small? → skip
    ├── InsightFace inference (~3000ms) ← THE BOTTLENECK
    ├── Embedding match (~1ms) ← FAST
    ├── Schedule API call (~3000ms when Render sleeping) ← BLOCKS recognition
    └── Attendance log API call (~100ms when Render awake)
```

After Option B (Coral) + Option E (decoupled schedule):

```
Camera (15fps)
    ↓
Camera Thread (producer)
    ↓ writes latest_frame
Recognition Thread (consumer)
    ├── MediaPipe gate (~30ms)
    ├── Coral Edge TPU inference (~10ms) ← was 3000ms
    ├── Embedding match (~1ms)
    └── Attendance log API (~100ms)

Schedule Background Thread (every 60s)
    └── API call → updates shared active_class variable
```

---

## 5. Recommended Path for Classroom Deployment

### Short Term (Before Next Demo)

| Step | Change | Impact | Effort |
|---|---|---|---|
| 1 | Switch `INSIGHTFACE_MODEL` to `buffalo_sc` | 7–10× faster recognition | Low — 1 line + re-enroll |
| 2 | Set `RECOGNITION_MIN_INTERVAL_SECONDS = 2.0` | Reduces CPU thrash | 1 line |
| 3 | Set `RECOGNITION_FRAME_SKIP = 15` | Reduces idle CPU | 1 line |
| 4 | Pre-wake Render before demo | Removes 3s API blocks | Manual |

### Long Term (Permanent Deployment)

| Step | Change | Impact | Effort |
|---|---|---|---|
| 5 | Implement Coral Edge TPU path | ~10ms inference | High — rewrite recognizer + backend enrollment |
| 6 | Decouple schedule poll to background thread | Removes API blocking camera loop | Medium |
| 7 | Move backend to always-on hosting (not Render free tier) | Removes all cold-start delays | Medium — hosting cost |

---

## 6. Coral Setup Reference (for when ready)

```bash
# On RPi — install Coral runtime
echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" \
  | sudo tee /etc/apt/sources.list.d/coral-edgetpu.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
sudo apt update
sudo apt install libedgetpu1-std  # standard clock

# In Python venv
pip install pycoral tflite-runtime

# Verify Coral is found
python3 -c "from pycoral.utils.edgetpu import list_edge_tpus; print(list_edge_tpus())"
# Should print: [{'type': 'usb', 'path': '/dev/bus/usb/...'}]
```

Model to use: `MobileFaceNet` compiled for Edge TPU  
→ Search: `mobilefacenet edgetpu tflite` — several pre-compiled versions exist on GitHub  
→ Embedding dimension will be **128-d** (not 512-d like buffalo) — cosine similarity threshold must be re-tuned (typically 0.60–0.75 for MobileFaceNet)

**Critical reminder**: After switching to any new model, delete all facial profiles in the database and re-enroll everyone. Mixed embeddings from different models will produce random match scores.

---

## 7. Quick Reference: Performance Numbers

| Config | Recognition time | Notes |
|---|---|---|
| `buffalo_l` @ `(160,160)` (current) | ~3000–3500ms | Confirmed on RPi 4 |
| `buffalo_sc` @ `(160,160)` | ~300–500ms | Estimated — needs testing |
| MobileFaceNet on Coral USB | ~5–15ms | Reported in literature |
| MediaPipe face detection (gate) | ~25–35ms | Confirmed on RPi 4 |
| Embedding cosine match (in-memory) | ~0.1–1ms | Negligible at 3 embeddings |
| Render API (awake) | ~100–300ms | Acceptable |
| Render API (cold start) | ~3000–15000ms | Was blocking camera loop; now capped at 3s timeout + cache fallback |
