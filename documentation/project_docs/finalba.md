// filepath: c:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\documentation\audit\FRAMES_MASTER_PLAN_AND_SOLUTIONS.md
# FRAMES Capstone — Master Plan & Solutions

**Date:** February 28, 2026  
**Purpose:** Comprehensive analysis and action plan for all outstanding FRAMES issues  
**Status:** Active — track progress via checkboxes below

---

## 📋 Issue Map & Priority

| # | Issue | Severity | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | Hand gesture timing/lag | 🔴 Critical | Medium | ⬜ Not started |
| 2 | Google Coral TPU integration | 🟡 Medium | Low-Medium | ⬜ Not started |
| 3 | Spoofing (photo attack) | 🔴 Critical | Medium | ⬜ Not started |
| 4 | Duplicate face enrollment | 🔴 Critical | Low | ⬜ Not started |
| 5 | Twin detection | 🟢 Low | N/A (policy) | ⬜ Not started |
| 6 | Entry/Exit edge cases | 🟡 Medium | Medium | ⬜ Not started |
| 7 | Deployment strategy | 🔴 Critical | High | ⬜ Not started |

---

## 1. 🖐️ Hand Gesture Timing Problem

### What's Happening

After the producer-consumer decoupling (Phase 3 architecture from `RECOGNITION_PIPELINE_RUNTIME_NOTES.md`), the recognition thread processes faces in the background (~800ms cycles). When a face is matched and the system prompts for a gesture:

1. The recognition thread just finished its cycle and won't check again for ~0.7–1.0s
2. By the time the next recognition cycle runs, the user already lowered their hand
3. Result: "Gesture timeout" even though user performed it correctly

### Root Cause

Gesture detection is **tied to the recognition thread's cycle**, not running continuously. The user performs the gesture between recognition cycles, so it gets missed.

### Solution: Dedicated Gesture Detection Window

When a face is matched and gesture is required, switch to a **fast gesture-only mode**:

```
Normal mode:    Recognition every 0.7-1.0s (heavy, InsightFace)
Gesture mode:   MediaPipe Hands every 50-100ms (lightweight, no InsightFace needed)
```

**Concept:**

```python
# When face is recognized and gesture is needed:
# 1. Stop heavy InsightFace recognition temporarily
# 2. Run ONLY MediaPipe Hands at high frequency (~20-40ms per frame)
# 3. Give user a 5-second window
# 4. As soon as gesture detected -> log attendance -> resume normal mode

# State machine:
# IDLE -> FACE_MATCHED -> AWAITING_GESTURE -> GESTURE_CONFIRMED -> COOLDOWN -> IDLE
```

**Why this works:**

- MediaPipe Hands is **lightweight** (~20–40ms per frame)
- No InsightFace needed during gesture window (we already know who they are)
- Gesture detection runs at camera FPS speed, not recognition speed
- User shows gesture → detected within 50–100ms → immediate feedback

**Target user experience: 3 seconds total**

- 0–1.5s: Face detected + recognized (1–2 recognition cycles)
- 1.5–3.0s: Gesture prompt shown + gesture detected (near-instant with fast polling)

### Implementation Approach — Kiosk State Machine

```
┌──────────┐     face match      ┌─────────────────┐
│  SCANNING ├────────────────────►│ AWAITING_GESTURE │
│ (InsightFace │                   │ (MediaPipe only,  │
│  every ~1s)  │                   │  polling at ~15fps)│
└──────────┘                      └────────┬──────────┘
      ▲                                     │
      │              gesture detected        │
      │         ┌──────────────────┐        │
      └─────────┤    COOLDOWN      │◄───────┘
                │  (3-5 sec ignore) │
                └──────────────────┘
```

During `AWAITING_GESTURE`:

- **Do NOT run InsightFace** (saves CPU)
- **Run ONLY MediaPipe Hands** on every frame from camera thread
- Time budget per frame: ~30–50ms instead of ~800ms
- 5-second timeout, then fall back to SCANNING

> **This is the single most impactful fix for user experience.**

### Alignment with FRAMES Rules

- **ENGINEERING_STANDARDS §5.2:** Preload models at session start — MediaPipe Hands should be loaded once at startup, not per-gesture-window
- **DEPLOYMENT_CONSTRAINTS §4.1:** Frame processing < 250ms (RPi) — gesture-only frames at ~30–50ms are well within budget
- **OBSERVABILITY_RULES §5.1:** Must log gesture detection time, timeout rate, and state transitions

---

## 2. 🪸 Google Coral USB Accelerator

### Short Answer

**YES, it will help significantly — but for detection, not InsightFace directly.**

### What Coral Does

The Coral USB Accelerator has a Google Edge TPU that runs **TFLite models** extremely fast:

- Face detection (SSD MobileNet): **~5–10ms** (vs ~50–200ms on RPi CPU)
- Custom classification models: very fast
- Power consumption: ~2W

### What Coral Does NOT Do

- It does **not** run InsightFace buffalo_l natively (InsightFace is ONNX, not TFLite)
- You would need to either:
  - **A)** Use a TFLite-compatible face recognition model (MobileFaceNet) compiled for Edge TPU
  - **B)** Use Coral only for face **detection** and keep InsightFace for **embedding** on CPU

### Recommended Strategy with Coral

**Option B is safest for your timeline:**

| Step | Without Coral | With Coral |
|------|---------------|------------|
| Face detection | MediaPipe BlazeFace (~20–40ms) | Coral SSD MobileNet (~5–10ms) |
| Face embedding | InsightFace buffalo_l CPU (~800ms) | InsightFace buffalo_l CPU (~800ms) |
| Gesture detection | MediaPipe Hands (~20–40ms) | MediaPipe Hands (~20–40ms) |

Coral shaves off detection time, but the big cost is still embedding inference.

**Option A (if time permits):**

Replace InsightFace entirely with a TFLite face recognition model compiled for Edge TPU:

- MobileFaceNet → compile to Edge TPU → inference in ~10–20ms
- **BUT:** you must regenerate ALL facial embeddings in the database
- Risk: accuracy may differ from InsightFace

### Recommendation

Given the timeline:

1. **First**, fix the gesture timing issue (Issue #1) — pure software fix
2. **Then**, try Coral for face detection only — easy integration, no re-enrollment needed
3. **If time permits**, experiment with MobileFaceNet on Coral for full pipeline speedup

Even just using Coral for detection + the gesture window fix could bring total user time to **under 3 seconds** on RPi.

### Alignment with FRAMES Rules

- **DEPLOYMENT_CONSTRAINTS §4.1:** Coral detection at ~5–10ms leaves more budget for embedding inference
- **DEPLOYMENT_CONSTRAINTS §4.2:** Coral adds minimal memory overhead (~50MB), well within 2.5GB ceiling
- **ENGINEERING_STANDARDS §5.2:** Must cache and preload Coral model at startup, not per-frame

---

## 3. 🎭 Spoofing / Anti-Spoofing (Liveness Detection)

### The Problem

Someone holds up a photo of an enrolled student → system recognizes it → fraudulent attendance logged. This is a **critical security flaw**.

### Solutions (Ranked by Feasibility)

#### Option A: Gesture-as-Liveness (Already Partially Implemented)

The hand gesture system is **already a basic liveness check**:

- A photo cannot show a peace sign, thumbs up, or open palm
- But currently only BREAK_OUT/BREAK_IN/EXIT require gestures
- **ENTRY is face-only → vulnerable**

**Quick Fix: Require gesture for ALL actions including ENTRY**

| Action | Current | Proposed |
|--------|---------|----------|
| ENTRY | Face only | Face + random gesture |
| BREAK_OUT | Face + ✌️ | Face + ✌️ |
| BREAK_IN | Face + 👍 | Face + 👍 |
| EXIT | Face + 🖐️ | Face + 🖐️ |

For ENTRY, either:

- Always require a specific gesture (e.g., 👍 thumbs up)
- Or **randomize** the required gesture (display "Show ✌️" or "Show 👍" randomly) — harder for an attacker to prepare a video

**This is the easiest and most practical anti-spoofing for a capstone.**

#### Option B: Blink Detection (Medium Effort)

Use MediaPipe Face Mesh (468 landmarks) to detect eye blinks:

- Real person blinks naturally
- Photo/screen does not blink
- Can run alongside existing pipeline

Downside: requires additional model (Face Mesh), more CPU

#### Option C: Depth / IR (Hardware)

Requires an IR camera or depth sensor. **Not practical for the current timeline.**

### Recommendation

**Go with Option A** — require gesture for ENTRY. The infrastructure already exists. A randomized gesture prompt is very hard to spoof with a photo or even a video.

### Defense Statement

> "FRAMES uses multi-factor biometric verification: face recognition combined with randomized hand gesture challenges, serving as both identity confirmation and liveness detection."

### Alignment with FRAMES Rules

- **SECURITY_RULES §5.1:** Input validation — gesture verification is an additional validation layer on attendance input
- **OBSERVABILITY_RULES §2.1:** Log spoofing attempts (gesture timeout after face match = potential spoof)

---

## 4. 🚫 Duplicate Face Enrollment Problem

### The Problem

User A registers their face. Then User A creates another account and registers the **same face** again. The system allows it, enabling:

- One person attending as multiple students
- Complete fraud vulnerability

### Solution: Embedding Uniqueness Check at Enrollment

Before saving a new facial embedding, **compare it against ALL existing embeddings** in the database:

```python
def check_embedding_uniqueness(new_embedding, db):
    """
    Check if this face is already enrolled under another account.
    Returns (is_unique, matching_user_id or None).
    
    Performance: O(n) where n = total enrolled users.
    With 1000-5000 users, batch comparison takes < 10ms (numpy matrix multiply).
    """
    all_profiles = db.query(FacialProfile).all()
    
    if not all_profiles:
        return True, None
    
    existing_embeddings = []
    user_ids = []
    for profile in all_profiles:
        emb = np.frombuffer(profile.embedding, dtype=np.float32)
        existing_embeddings.append(emb)
        user_ids.append(profile.user_id)
    
    existing_matrix = np.stack(existing_embeddings)  # (N, 512)
    similarities = np.dot(existing_matrix, new_embedding)  # (N,)
    
    max_idx = np.argmax(similarities)
    max_similarity = similarities[max_idx]
    
    DUPLICATE_THRESHOLD = 0.6  # Same threshold as recognition
    
    if max_similarity >= DUPLICATE_THRESHOLD:
        return False, user_ids[max_idx]  # Duplicate found
    
    return True, None  # Unique face
```

**At the API level:**

```python
@router.post("/api/face/enroll")
def enroll_face(current_user: User = Depends(get_current_user), ...):
    # ... extract embedding from frames ...
    
    is_unique, matching_user_id = check_embedding_uniqueness(embedding, db)
    
    if not is_unique:
        logger.warning(
            "SECURITY | Duplicate face enrollment attempt: user=%d matches existing user=%d",
            current_user.id, matching_user_id
        )
        raise api_error(
            409,
            "DUPLICATE_FACE",
            "This face is already registered under another account. "
            "Please contact administration if you believe this is an error."
        )
    
    # Proceed with enrollment...
```

### Alignment with FRAMES Rules

- **ENGINEERING_STANDARDS §5.2:** Batch comparisons using numpy vectorization — O(n) not O(n²)
- **SECURITY_RULES §6.1:** Return structured error response, log internally with user IDs
- **DEPLOYMENT_CONSTRAINTS §1.3:** Consistent error response shape with error code
- **OBSERVABILITY_RULES §8.1:** Never log the actual embedding arrays — only user IDs

---

## 5. 👥 Twin Detection

### Reality Check

Identical twins share ~99.9% of facial structure. Even state-of-the-art systems (FaceNet, ArcFace) struggle with identical twins. InsightFace buffalo_l will likely:

- Match identical twins with high similarity (> 0.6)
- This means Twin A could be recognized as Twin B

### What Can Be Done

1. **Acknowledge it in documentation** — this is an industry-wide limitation
2. **The gesture system helps** — if a randomized gesture is used, even if face matches the wrong twin, the gesture prompt adds a layer
3. **Policy-based mitigation**: Twins must report to admin, who can:
   - Adjust individual similarity thresholds
   - Require gesture for ALL actions
   - Flag their accounts for manual review

### Defense Statement

> "Identical twin differentiation is a known challenge in facial recognition research, with even state-of-the-art models achieving limited accuracy. FRAMES mitigates this through multi-factor verification (gesture challenges) and administrative override capability. In a university deployment of ~2,000–5,000 students, the probability of identical twins in the same class is statistically low."

**This is a legitimate limitation that even Apple FaceID acknowledges. Do not stress about this.**

---

## 6. 📋 Entry/Exit Edge Cases & Policies

### Case 1: Forgot to Exit

**Scenario:** Student has ENTRY logged but never scanned EXIT. Day ends.

**Solution: Auto-close at schedule end**

```
Policy: At class.end_time + 15 minutes, auto-INSERT an EXIT log with:
  - remarks = "[AUTO-CLOSED] No exit scan detected"
  - verified_by = NULL (system-generated, not face/gesture verified)
```

This can be a **scheduled backend job** or triggered by the kiosk when class time ends.

### Case 2: Forgot to Entry

**Scenario:** Student was in class but never scanned ENTRY. Later scans EXIT.

**Solution options:**

| Option | Behavior |
|--------|----------|
| A (Recommended) | Reject: "You have no ENTRY record for this class today. Please see your instructor." |
| B | Auto-create: Insert ENTRY (`is_late=True`, `remarks="[LATE] No entry scan"`) then insert EXIT |

**Recommendation: Option A.** Keep it strict — if they forgot to scan in, that is an absence marker that faculty can override manually.

### Case 3: Users Exceed Schedule Time (Back-to-Back Classes)

**Scenario:** 8AM–10AM class followed by 10AM–12PM class in the same room.

**Solution: Grace Period + Forced Transition**

```
Timeline for Room CL1:
  07:50 - 08:00  → Kiosk shows "Class A starting soon" (ENTRY window opens)
  08:00 - 09:45  → Normal Class A attendance (ENTRY, BREAK_OUT, BREAK_IN)
  09:45 - 10:00  → TRANSITION PERIOD
                    → Auto-EXIT all Class A students still "inside"
                    → Kiosk shows "Class A ending, please exit"
                    → Class B ENTRY window opens
  10:00 - 11:45  → Normal Class B attendance
  11:45 - 12:00  → TRANSITION PERIOD for Class B
```

**Key rule: 15-minute transition window before next class.**

```python
# Schedule resolver logic:
TRANSITION_MINUTES = 15

def get_active_class(self, room, current_time):
    # Find class where:
    #   start_time <= current_time <= end_time - TRANSITION_MINUTES
    # During transition:
    #   auto-close previous class, open next class for ENTRY
```

### Case 4: Re-recognition After Exit (Immediate Re-entry)

**Problem:** Student scans EXIT at 9:50. Walks past kiosk again at 9:51. System recognizes face → logs ENTRY for next class?

**Solution: Cooldown Period**

```python
# After EXIT is logged for a user:
# - Add user_id to cooldown set with timestamp
# - For COOLDOWN_SECONDS (e.g., 60s), ignore this face
# - After cooldown: recognize normally

RECOGNITION_COOLDOWN_SECONDS = 60  # 1 minute after EXIT

# In recognition logic:
if user_id in cooldown_map:
    if time.time() - cooldown_map[user_id] < RECOGNITION_COOLDOWN_SECONDS:
        # Skip — they just exited
        continue
```

### Alignment with FRAMES Rules

- **ENGINEERING_STANDARDS §6:** Cache cooldown map in memory — O(1) lookup using dict/HashMap
- **DEPLOYMENT_CONSTRAINTS §4.5:** Auto-close and transition logic must work offline too
- **OBSERVABILITY_RULES §7.2:** Log with `ATTENDANCE` and `SCHEDULE` prefixes for all edge case events

---

## 7. 🚀 Deployment Strategy

### Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend   │    │   Backend    │    │  Database    │
│ React + Vite │◄──►│  FastAPI     │◄──►│ PostgreSQL   │
│              │    │              │    │ (Aiven)      │
└──────────────┘    └──────────────┘    └──────────────┘
                          ▲
                          │ HTTP/API
                    ┌─────┴──────┐
                    │  RPi Kiosk  │
                    │ (classroom) │
                    └─────────────┘
```

### 7.1 Database: Aiven PostgreSQL ✅ (Already Done)

Already deployed. Provides:

- Managed PostgreSQL with SSL
- Connection pooling
- Automatic backups

**Internet concern:** Every DB query goes over the internet. With connection pooling and efficient queries (following N+1 rules), latency should be ~20–50ms per query. **Acceptable** for FRAMES — the system does not need sub-millisecond DB access.

**Mitigation:** The kiosk already has offline mode. If internet drops, attendance is queued locally and synced later.

### 7.2 Backend Deployment: Railway or Render

**NOT Vercel** — Vercel is for frontend/serverless. FastAPI needs a persistent server.

| Platform | Free Tier | Good For | HTTPS |
|----------|-----------|----------|-------|
| **Railway** | $5 free credit/month | FastAPI + background tasks | ✅ Auto |
| **Render** | Free (sleeps after 15min idle) | Simple deployment | ✅ Auto |
| **Fly.io** | Free tier available | Low latency, multiple regions | ✅ Auto |
| **DigitalOcean App Platform** | $5/month | Full control | ✅ Auto |

**Recommendation: Railway or Render**

Both auto-provide HTTPS (e.g., `https://your-app.railway.app`).

**Railway deployment steps:**

```bash
# In your backend directory:
# 1. Add a Dockerfile or railway.toml
# 2. Push to GitHub
# 3. Connect Railway to your repo
# 4. Set environment variables (DATABASE_URL, JWT_SECRET_KEY, etc.)
# 5. Deploy
```

### 7.3 Frontend Deployment: Vercel or Netlify

**Vercel IS perfect** for the React frontend:

```bash
# In your frontend directory:
# 1. Push to GitHub
# 2. Import project in Vercel
# 3. Set VITE_API_BASE_URL=https://your-backend.railway.app
# 4. Deploy
# Result: https://frames-app.vercel.app
```

### 7.4 RPi Kiosk: Local Network + Internet

The kiosk runs locally in the classroom. It needs:

- Internet access to reach the backend API
- The backend URL configured: `BACKEND_URL=https://your-backend.railway.app`

**Internet as bottleneck?**

| Operation | Internet Required? | If Internet Down |
|-----------|-------------------|------------------|
| Face recognition | **No** (runs locally on RPi) | Works normally |
| Embedding cache load | **Yes** (initial load) | Uses local cache file |
| Log attendance | **Yes** | Queued offline, synced later |
| Schedule check | **Yes** (if API mode) | Uses cached schedule |

**The kiosk is designed to be offline-first.** Internet is needed for initial setup and periodic sync, but recognition runs 100% locally.

### 7.5 Pre-Deployment Setup Order

```
DEPLOYMENT ORDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Deploy backend + database
        → Backend on Railway, DB on Aiven
        → Verify /api/health endpoint works

Step 2: Deploy frontend
        → Vercel, connected to backend
        → Verify login page loads and can reach API

Step 3: Admin creates departments, programs
        → Via admin dashboard

Step 4: Faculty/HEAD upload schedules
        → Auto-creates classes, subjects, student accounts
        → Students get default credentials (TUPM-ID + default password)

Step 5: ALL users register faces (enrollment period)
        → 1-2 week enrollment window before semester starts
        → Students log in → redirected to face enrollment
        → Faculty verified by HEAD → face enrollment
        → Embeddings stored in DB

Step 6: Kiosk setup
        → Install kiosk software on each RPi
        → Configure BACKEND_URL, DEVICE_ID, DEVICE_ROOM
        → Kiosk fetches embeddings from backend → caches locally
        → Test with enrolled users

Step 7: Go live
        → Kiosks activated in classrooms
        → Periodic cache refresh keeps embeddings updated
        → New enrollments mid-semester → cache updates automatically
```

**NOTE:** You do NOT need ALL users enrolled before going live. The kiosk's periodic cache refresh (every 30 min per `DEPLOYMENT_CONSTRAINTS §4.3`) picks up newly enrolled faces.

### 7.6 Network Architecture in Production

```
University WiFi Network
├── RPi Kiosk (CL1) ── Internet ── Railway Backend ── Aiven DB
├── RPi Kiosk (CL2) ── Internet ── Railway Backend ── Aiven DB
├── RPi Kiosk (CL3) ── Internet ── Railway Backend ── Aiven DB
│
├── Student Phones/Laptops ── Vercel Frontend ── Railway Backend
├── Faculty Laptops ── Vercel Frontend ── Railway Backend
└── Admin PC ── Vercel Frontend ── Railway Backend
```

**Bandwidth per kiosk:** Minimal. Each attendance log is ~200 bytes JSON. Even with 30 students per class, that is 6KB per class session. The main bandwidth use is the initial embedding cache download (~2MB for 1000 users).

### Alignment with FRAMES Rules

- **DEPLOYMENT_CONSTRAINTS §1.5:** Database connection pooling configured for Aiven
- **DEPLOYMENT_CONSTRAINTS §5.1:** CORS locked to specific Vercel frontend URL
- **DEPLOYMENT_CONSTRAINTS §5.2:** All environment variables set via platform settings, never hardcoded
- **SECURITY_RULES §3.1:** CORS configured per environment (development vs production)
- **DEPLOYMENT_CONSTRAINTS §4.5:** Offline-first behavior maintained

---

## 📅 Recommended Work Order

| Week | Tasks | Why |
|------|-------|-----|
| **Now** | 1. Fix gesture timing (Issue #1 — gesture-only fast mode) | Most visible UX problem |
| **Now** | 2. Add duplicate face check at enrollment (Issue #4) | Easy win, critical security |
| **Now** | 3. Require gesture for ENTRY (Issue #3 — anti-spoofing) | Easy win, uses existing code |
| **Next** | 4. Entry/Exit edge case policies (Issue #6) | Business logic, needed for demo |
| **Next** | 5. Deploy backend + frontend (Issue #7) | Needed for demo/defense |
| **Next** | 6. Experiment with Coral for detection (Issue #2) | Performance bonus |
| **Defense** | 7. Document twin limitation (Issue #5) | Documentation only |

---

## 💬 Capstone Defense Statement

> "FRAMES implements a multi-layered biometric attendance system with: InsightFace-based face recognition, MediaPipe hand gesture verification as both confirmation and liveness detection, offline-first kiosk architecture for reliability, producer-consumer threading for smooth real-time video, and embedding uniqueness enforcement to prevent identity fraud. The system is designed for deployment at scale with cached embeddings, connection pooling, and graceful degradation."

---

## 📝 Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-02-28 | Initial creation — documented all 7 issues with solutions | Team |