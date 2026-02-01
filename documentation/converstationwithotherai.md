# 1️⃣ WHAT IS “EDGE”? (Super simple)

### In one sentence:

**Edge computing means processing data near where it is captured, instead of sending everything to a server.**

### In your project:

* **Camera is in the classroom**
* **Raspberry Pi is beside the camera**
* Face recognition runs **on the Raspberry Pi**
  ➡️ That is **EDGE**

### NOT edge:

* Webcam → send video to cloud → cloud processes → send result back
  (that’s slow, expensive, risky)

### Why edge matters in defense:

* Faster response (real-time)
* Works even with weak internet
* Better privacy (faces don’t leave the room)
* Lower cloud cost

📌 **Key line for defense:**

> The system performs face recognition at the edge using Raspberry Pi to reduce latency, bandwidth usage, and privacy risks.

---

# 2️⃣ WHAT IS A “PIPELINE”?

Don’t overthink it.

### Pipeline = **ordered steps that data passes through**

Like a factory line.

Example:

```
Camera → Face Detect → Face Encode → Compare → Decision
```

That’s a **pipeline**.

You have **TWO pipelines** because they have **different goals**.

---

# 3️⃣ ENROLLMENT PIPELINE vs RECOGNITION PIPELINE

(THIS IS VERY IMPORTANT)

They are **different on purpose**. This is GOOD design.

---

## 🟦 A. ENROLLMENT PIPELINE (Laptop / Browser)

### Goal:

👉 Create a **high-quality face embedding ONCE**

### Characteristics:

* Runs **once per user**
* Accuracy > speed
* Runs on laptop/PC
* Not time-critical

### Flow:

```
User login (first time)
        ↓
Force Face Registration Page
        ↓
Webcam capture (10–20 images)
        ↓
Face detection
        ↓
Face embedding extraction
        ↓
Average embeddings
        ↓
Store in database
        ↓
Unlock dashboard
```

### Does this need TFLite?

❌ **NO**

Why?

* Laptop CPU is stronger
* One-time operation
* You want best-quality embeddings
* Simpler to implement

📌 **Professional justification:**

> Enrollment uses full-precision models to prioritize embedding quality, while edge recognition prioritizes speed and efficiency.

---

## 🟩 B. RECOGNITION PIPELINE (Raspberry Pi / Classroom)

### Goal:

👉 Recognize faces **in real time**

### Characteristics:

* Runs **every second**
* Speed > accuracy
* Low-power device
* Must not lag

### Flow:

```
Pi Camera capture
        ↓
Face detection
        ↓
Preprocessing
        ↓
TFLite FaceNet (INT8)
        ↓
Embedding output
        ↓
Compare with DB embeddings
        ↓
Recognized? → Attendance logic
        ↓
Gesture check (except first entry)
```

### Does this need TFLite?

✅ **YES**

Why?

* Raspberry Pi is weak
* Full TensorFlow is heavy
* DeepFace is slow
* TFLite is optimized for edge

---

# 4️⃣ WHY NOT DEEPFACE ON RASPBERRY PI?

This is a **classic panel question**. Answer it like this:

### Why DeepFace is bad on Pi:

* Built for **research & desktop**
* Loads multiple heavy backends
* Uses full TensorFlow / PyTorch
* High RAM usage
* Slow FPS
* Unstable on ARM devices

### Why TFLite is better:

* Designed for embedded devices
* Quantized (INT8)
* Smaller model size
* Faster inference
* Stable on ARM

📌 **Defense mic-drop line:**

> DeepFace was used during prototyping, but was replaced by a quantized TFLite model for production deployment on Raspberry Pi.

---

# 5️⃣ DO WE NEED TO ADD DEEPFACE / INSIGHTFACE TO STACK?

### Short answer:

✅ **YES — but ONLY for enrollment**
❌ **NOT on Raspberry Pi**

### Updated mental stack (don’t panic):

**Backend (Server / Enrollment):**

* Python
* FastAPI
* FaceNet / InsightFace (for enrollment only)

**Edge (Pi):**

* TFLite FaceNet (INT8)
* MediaPipe Hands

This is **normal in real systems**.

---

# 6️⃣ “WHAT IF MY LAPTOP LAGS DURING ENROLLMENT?”

Good question. Shows maturity.

### Important clarification:

👉 **Face processing happens on the BACKEND**, not in the browser.

### Browser only does:

* Webcam capture
* Sends frames to backend

### Backend does:

* Face detection
* Embedding extraction
* Saving to DB

So even if the laptop is weak:

* It’s just streaming images
* Backend server does the heavy work

📌 If backend is deployed on:

* Decent PC
* School server
* Cloud VM

➡️ You’re safe.

---

# 7️⃣ HOW ENROLLMENT WORKS VIA WEBSITE (DEPLOYED)

### Actual flow:

```
User opens https://frames.app
        ↓
Login
        ↓
Backend checks: face_registered?
        ↓
NO → redirect to /face-enroll
        ↓
Browser opens webcam
        ↓
Frames sent to backend
        ↓
Backend extracts embeddings
        ↓
Saved to DB
        ↓
face_registered = true
        ↓
Dashboard access granted
```

This works **anywhere**:

* Laptop
* PC lab
* Home

---

# 8️⃣ SIMPLE FLOWCHART (YOU CAN PRESENT THIS)

## Enrollment Pipeline

```
[User Login]
      ↓
[Face Registered?] ── Yes ─→ [Dashboard]
      │
      No
      ↓
[Force Face Enrollment Page]
      ↓
[Webcam Capture (10–20 frames)]
      ↓
[Backend Face Detection]
      ↓
[Embedding Extraction]
      ↓
[Save to Database]
      ↓
[Unlock System]
```

---

## Recognition Pipeline (Edge)

```
[Pi Camera]
     ↓
[Face Detection]
     ↓
[TFLite FaceNet]
     ↓
[Embedding]
     ↓
[Compare with DB]
     ↓
[Recognized?]
     ↓
[ENTRY auto]
     ↓
[Gesture Required?]
     ↓
[Log Attendance]
```

---

# 9️⃣ YOUR DATABASE SCHEMA — QUICK FEEDBACK

Bff, **this schema is GOOD**. Like genuinely.

### 👍 What you did right:

* `facial_profiles` separated ✔
* `model_version` included ✔
* `devices` table ✔
* `verified_by` ✔
* `confidence_score` ✔

### One small correction (important):

In `facial_profiles.model_version`

* Enrollment model ≠ recognition model

So:

```text
"facenet_full_v1"  ← enrollment
"facenet_tflite_int8_v1" ← edge
```

This helps future retraining.

---

# 1️⃣0️⃣ FINAL CLARITY CHECK (Answer These in Defense)

If panel asks:

**Q: Why two facial pipelines?**
✔ Different goals: quality vs speed

**Q: Why TFLite only on Pi?**
✔ Resource constraints, real-time need

**Q: Why not DeepFace everywhere?**
✔ Too heavy for edge deployment

**Q: Is this realistic in industry?**
✔ Yes, this is standard edge AI architecture

