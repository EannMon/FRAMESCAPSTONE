# 📷 FRAMES Recognition Pipeline Plan

This plan focuses exclusively on the **facial recognition, gesture control, and edge device integration** components of the FRAMES system.

---

## 🖐️ Focus Area 1: Hand Gesture Control

### Easy Tasks (1-2 days)

#### 1. Gesture Constants & Types
- **Difficulty:** Easy
- **Status:** ✅ DONE
- **Description:** Define standard gesture types (OK, PALM, THUMB) and their corresponding actions (BREAK_IN, BREAK_OUT, EXIT).
- **Files:** `backend/services/gesture_constants.py`, `frontend/src/constants/gestures.ts` (if needed)
- **Dependencies:** None
- **Blockers:** None

#### 2. Gesture UI Context & Prompt
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Create a frontend context/hook to manage gesture state and display an overlay prompt ("Show 👌 to Enter").
- **Files:** `frontend/src/contexts/GestureContext.tsx` (create), `frontend/src/components/GesturePrompt.tsx`
- **Dependencies:** Gesture Constants
- **Blockers:** None

#### 3. Gesture Feedback Display
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Visual feedback component that shows recognized gesture confidence and countdown before action.
- **Files:** `frontend/src/components/GestureFeedback.tsx`
- **Dependencies:** Gesture Context
- **Blockers:** Task #2

### Medium Tasks (3-5 days)

#### 4. MediaPipe Hands Integration
- **Difficulty:** Medium
- **Status:** ✅ DONE
- **Description:** Implement `MediaPipe` service to detect hands and classify gestures from image frames.
- **Files:** `backend/services/gesture_detection.py`, `backend/scripts/test_gesture_detection.py`
- **Dependencies:** `mediapipe` library
- **Blockers:** None

#### 5. Gesture Validation API
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** Endpoint to receive a frame/gesture, validate it, and log it to `attendance_logs` (using `gesture_detected` column).
- **Files:** `backend/routers/attendance.py`, `backend/services/attendance_service.py`
- **Dependencies:** Task #4, `attendance_logs` table
- **Blockers:** Task #4

#### 6. Gesture-Gated Action Flow
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** Complete backend logic to trigger attendance actions (ENTRY/EXIT) *only* upon confirmed gesture sequence.
- **Files:** `backend/services/attendance_flow.py` (create)
- **Dependencies:** Task #5
- **Blockers:** Task #5

---

## 🖥️ Focus Area 2: Kiosk & Edge Devices

### Easy Tasks (1-3 days)

#### 7. Device Registration API
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** API to register new Raspberry Pi devices and assign them to rooms.
- **Files:** `backend/routers/devices.py` (create), `backend/schemas/device.py`
- **Dependencies:** `devices` table
- **Blockers:** None

#### 8. Device Heartbeat API
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Endpoint for devices to ping "I'm alive" every minute.
- **Files:** `backend/routers/devices.py`
- **Dependencies:** `devices` table
- **Blockers:** Task #7

#### 9. Kiosk Fullscreen UI
- **Difficulty:** Easy
- **Status:** ⬜ TODO
- **Description:** Specialized frontend layout for Raspberry Pi touchscreens (no sidebar, large text).
- **Files:** `frontend/src/layouts/KioskLayout.tsx`, `frontend/src/pages/kiosk/StandbyPage.tsx`
- **Dependencies:** None
- **Blockers:** None

### Medium Tasks (3-5 days)

#### 10. Pi Camera Capture Service
- **Difficulty:** Medium
- **Status:** ⬜ TODO (Hardware dependent)
- **Description:** Python script on Pi to capture frames and send to backend (or process locally).
- **Files:** `edge/camera_service.py` (new folder)
- **Dependencies:** `picamera` or `opencv`
- **Blockers:** Hardware availability

#### 11. Edge-to-Server Sync
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** Sync mechanism to download updated student face embeddings to the Pi (if using local recognition).
- **Files:** `backend/routers/sync.py`, `edge/sync_service.py`
- **Dependencies:** `facial_profiles` table
- **Blockers:** Task #7

### Hard Tasks (5-8 days)

#### 12. Complete Kiosk Pipeline
- **Difficulty:** Hard
- **Status:** ⬜ TODO
- **Description:** End-to-end flow: Detect Face -> Recognize -> Wait for Gesture -> Confirm Action -> Show Success UI.
- **Files:** `edge/main.py`, `backend/services/kiosk_flow.py`
- **Dependencies:** Tasks #4, #5, #10
- **Blockers:** Tasks #4, #5

---

## 🔒 Focus Area 3: Security & Monitoring

### Medium Tasks (2-4 days)

#### 13. System Health Dashboard
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** Dashboard to view status of all connected devices (Online/Offline, Last Heartbeat).
- **Files:** `frontend/src/pages/admin/DeviceDashboard.tsx`, `backend/services/device_service.py`
- **Dependencies:** `devices` table, Task #8
- **Blockers:** Task #8

#### 14. Anomaly Detection Logging
- **Difficulty:** Medium
- **Status:** ⬜ TODO
- **Description:** Log failed recognition attempts and potential spoofing to `security_logs`.
- **Files:** `backend/services/security_service.py` (create)
- **Dependencies:** `security_logs` table
- **Blockers:** None (Table created)
