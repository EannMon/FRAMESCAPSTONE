# Attendance Operation Sequence Diagrams — FRAMES

## 1. Entry Sequence (Automatic — No Gesture Required)

```
┌──────────┐  ┌──────────┐  ┌─────────────────────────────────────────┐  ┌─────────────┐  ┌──────────┐
│ Student  │  │USB Webcam│  │          RPi Kiosk Processing           │  │ Backend API │  │Dashboard │
└────┬─────┘  └────┬─────┘  └───────────────────┬─────────────────────┘  └──────┬──────┘  └────┬─────┘
     │              │                            │                               │              │
     │ Stand in     │                            │                               │              │
     │ front of     │                            │                               │              │
     │ kiosk        │                            │                               │              │
     │─────────────→│                            │                               │              │
     │              │ Capture frame (720p)       │                               │              │
     │              │───────────────────────────→│                               │              │
     │              │                            │                               │              │
     │              │                            │ 1. MediaPipe BlazeFace        │              │
     │              │                            │    (~30ms) → face detected    │              │
     │              │                            │                               │              │
     │              │                            │ 2. InsightFace buffalo_sc     │              │
     │              │                            │    SCRFD → detect face        │              │
     │              │                            │    → 5 landmarks              │              │
     │              │                            │    MobileFaceNet → align      │              │
     │              │                            │    → 512-d embedding          │              │
     │              │                            │    (~300-500ms)               │              │
     │              │                            │                               │              │
     │              │                            │ 3. Cosine similarity vs cache │              │
     │              │                            │    Score ≥ 0.30 → MATCH       │              │
     │              │                            │    (~1ms)                     │              │
     │              │                            │                               │              │
     │              │                            │ 4. Determine action: ENTRY    │              │
     │              │                            │    (first recognition today)  │              │
     │              │                            │                               │              │
     │              │                            │ POST /api/kiosk/attendance/log│              │
     │              │                            │ {user_id, action: ENTRY,      │              │
     │              │                            │  confidence: 0.72,            │              │
     │              │                            │  verified_by: "face"}         │              │
     │              │                            │──────────────────────────────→│              │
     │              │                            │                               │ Create log   │
     │              │                            │                               │ entry        │
     │              │                            │                               │──────────────→
     │              │                            │           200 OK              │  Update      │
     │              │                            │←──────────────────────────────│  status:     │
     │              │                            │                               │  🟢 Present  │
     │              │  Display: "Welcome,        │                               │              │
     │ "Welcome,    │  Emmanuel!" + green box    │                               │              │
     │  Emmanuel!"  │←───────────────────────────│                               │              │
     │←─────────────│                            │                               │              │
     │              │                            │                               │              │
```

## 2. Break-Out Sequence (Peace Sign ✌️ Required)

```
┌──────────┐  ┌──────────┐  ┌─────────────────────────────────────────┐  ┌─────────────┐  ┌──────────┐
│ Student  │  │USB Webcam│  │          RPi Kiosk Processing           │  │ Backend API │  │Dashboard │
└────┬─────┘  └────┬─────┘  └───────────────────┬─────────────────────┘  └──────┬──────┘  └────┬─────┘
     │              │                            │                               │              │
     │ Approach     │                            │                               │              │
     │ kiosk        │                            │                               │              │
     │─────────────→│ Capture frame              │                               │              │
     │              │───────────────────────────→│                               │              │
     │              │                            │ 1-3. Same face detection &    │              │
     │              │                            │    recognition as Entry       │              │
     │              │                            │    Score ≥ 0.30 → MATCH       │              │
     │              │                            │                               │              │
     │              │                            │ 4. Check current status:      │              │
     │              │                            │    User is PRESENT            │              │
     │              │                            │    → Eligible for BREAK_OUT   │              │
     │              │                            │                               │              │
     │ "Show ✌️ to  │  Display gesture prompt    │                               │              │
     │  take a      │←───────────────────────────│                               │              │
     │  break"      │                            │                               │              │
     │←─────────────│                            │                               │              │
     │              │                            │                               │              │
     │ Show peace   │                            │                               │              │
     │ sign ✌️      │                            │                               │              │
     │─────────────→│ Capture gesture frame      │                               │              │
     │              │───────────────────────────→│                               │              │
     │              │                            │ 5. MediaPipe Hands            │              │
     │              │                            │    → 21 hand landmarks        │              │
     │              │                            │    → classify: PEACE_SIGN     │              │
     │              │                            │    (~30ms)                    │              │
     │              │                            │                               │              │
     │              │                            │ 6. Debounce: frame 1/3       │              │
     │              │ Next frame                 │                               │              │
     │              │───────────────────────────→│ 7. Debounce: frame 2/3       │              │
     │              │ Next frame                 │                               │              │
     │              │───────────────────────────→│ 8. Debounce: frame 3/3 ✅    │              │
     │              │                            │    Gesture CONFIRMED          │              │
     │              │                            │                               │              │
     │              │                            │ POST /api/kiosk/attendance/log│              │
     │              │                            │ {user_id, action: BREAK_OUT,  │              │
     │              │                            │  confidence: 0.68,            │              │
     │              │                            │  verified_by: "face+gesture"} │              │
     │              │                            │──────────────────────────────→│              │
     │              │                            │                               │ Create log   │
     │              │                            │                               │──────────────→
     │              │                            │           200 OK              │  Update      │
     │              │                            │←──────────────────────────────│  status:     │
     │ "Break       │  Display: "Break logged"   │                               │  🟡 On Break │
     │  logged"     │←───────────────────────────│                               │              │
     │←─────────────│                            │                               │              │
```

## 3. Break-In Sequence (Thumbs-Up 👍 Required)

Same as Break-Out sequence except:
- **Status Check:** User is ON_BREAK → Eligible for BREAK_IN
- **Gesture:** Thumbs-Up (👍) instead of Peace Sign
- **Action:** BREAK_IN posted to backend
- **Dashboard Update:** Status returns to 🟢 Present (Green)

## 4. Exit Sequence (Open Palm ✋ Required)

Same as Break-Out sequence except:
- **Status Check:** User is PRESENT or ON_BREAK → Eligible for EXIT
- **Gesture:** Open Palm (✋) instead of Peace Sign
- **Action:** EXIT posted to backend
- **Dashboard Update:** User removed from active room display

## 5. Anomaly Sequence (Unrecognized Individual)

```
┌──────────────┐  ┌──────────┐  ┌─────────────────────────────────────────┐
│ Unrecognized │  │USB Webcam│  │          RPi Kiosk Processing           │
│ Person       │  │          │  │                                         │
└──────┬───────┘  └────┬─────┘  └───────────────────┬─────────────────────┘
       │               │                            │
       │ Approach      │                            │
       │ kiosk         │                            │
       │──────────────→│ Capture frame              │
       │               │───────────────────────────→│
       │               │                            │ 1. MediaPipe gate → face found
       │               │                            │ 2. InsightFace → 512-d embedding
       │               │                            │ 3. Cosine similarity vs cache
       │               │                            │    All scores < 0.30
       │               │                            │    → NO MATCH
       │               │                            │
       │               │  Display: "Unrecognized"   │
       │ "Unrecognized" │  + RED bounding box       │
       │ alert with    │←───────────────────────────│
       │ red box       │                            │
       │←──────────────│                            │
       │               │                            │ NO attendance logged
       │               │                            │ Anomaly event recorded
```

---

## Gesture Summary

| Attendance Action | Gesture Required | MediaPipe Gesture | Debounce |
|-------------------|-----------------|-------------------|----------|
| **Entry** | ❌ None (automatic) | N/A | N/A |
| **Break-Out** | ✌️ Peace Sign | Two fingers extended, others curled | 3 frames |
| **Break-In** | 👍 Thumbs-Up | Thumb extended, all fingers curled | 3 frames |
| **Exit** | ✋ Open Palm | All five fingers extended | 3 frames |

## Timing Summary

| Step | Typical Duration |
|------|-----------------|
| USB frame capture | 15–25ms |
| MediaPipe BlazeFace gate | 25–35ms |
| InsightFace SCRFD detection | 100–160ms |
| MobileFaceNet embedding | 30–50ms |
| Cosine similarity matching | 5–15ms |
| MediaPipe Hands (per frame) | 20–30ms |
| 3-frame gesture debounce | 60–90ms |
| **Total (face + gesture)** | **~300–400ms** |
| Backend API round-trip | 50–200ms |
| **Total user-perceived** | **~0.5–1.5 seconds** |
