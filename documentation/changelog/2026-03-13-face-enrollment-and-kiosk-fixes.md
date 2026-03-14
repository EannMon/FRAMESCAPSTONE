# FRAMES Change Log (March 13, 2026)

## Scope of this update
This update fixes five high-impact issues reported in face enrollment and kiosk display behavior.

## Problem 1: Low-quality enrollments (<80%) were still ending up in the database

### What was happening before
- The frontend blocked dashboard navigation when quality was low.
- But your concern was valid: if backend-side protections are bypassed or inconsistently interpreted, bad data can still be persisted.
- Error responses were not consistently mapped for the frontend, so users could receive confusing feedback.

### What was changed
1. Added stricter backend validation gates in the face enrollment endpoint.
2. Added a minimum valid-sample gate (at least 5 high-quality frames must be usable).
3. Added explicit rollback behavior for HTTP and validation errors.
4. Added standardized error code mapping for validation failures.

### Files changed
- backend/api/routers/face.py

### New backend validation rules
- Enrollment average quality must be >= 0.80.
- Number of valid frames used by the model must be >= 5.
- If either fails, request is rejected and no profile update/insert should be committed.

### Why this works
- The hard gate is on the server (authoritative layer), not only on the UI.
- Rollback is explicit for both HTTPException and ValueError paths, reducing chance of accidental persistence.

---

## Problem 2: Similar embeddings should be blocked (duplicate face registration)

### What was happening before
- Duplicate checks existed, but threshold strictness and frontend duplicate messaging could still be improved.

### What was changed
1. Kept batch-vectorized duplicate detection (fast O(n) cosine check).
2. Made duplicate threshold configurable via environment variable.
3. Tightened default duplicate threshold from 0.60 to 0.55 for buffalo_sc enrollment gate.
4. Added structured duplicate details in API response payload for better diagnostics.

### Files changed
- backend/services/face_enrollment.py
- backend/api/routers/face.py

### Why this works
- buffalo_sc can benefit from stricter duplicate screening during enrollment.
- Configurable threshold allows safe tuning without code edits.
- Frontend can now display clearer “possible duplicate” warnings from error code.

---

## Problem 3: Enrollment messages/UI flow should give proper warnings and hide Enroll button after fail

### What was happening before
- Generic or inconsistent error messages.
- Potentially confusing states after failures.
- You requested that after failed enrollment, only Retake should be visible (not Enroll Face).

### What was changed
1. Added frontend error interpreter for standardized backend errors.
2. Added specific user messages for:
   - QUALITY_TOO_LOW
   - INSUFFICIENT_QUALITY_FRAMES
   - NO_FACE_DETECTED
   - DUPLICATE_FACE
   - server timeout
   - offline/server unreachable
   - server-side 5xx failures
3. Added status text aligned with feedback context (not just raw error).
4. Added a `lastAttemptFailed` state flag.
5. Updated control rendering logic:
   - On failed attempt: hide Enroll Face button.
   - Show only Retake button.

### Files changed
- frontend/src/components/FaceEnrollment/FaceEnrollmentPage.jsx

### Why this works
- Feedback now matches real failure reason.
- User flow is safer: failed captures cannot be repeatedly submitted without retake.
- UX now aligns with your requirement: fail/error => Retake only.

---

## Problem 4: Kiosk on 7-inch Chromium screen cuts content; thumbs-up icon missing

### What was happening before
- Sidebar and content were easy to clip on 800x480-like displays.
- Gesture emoji (especially thumbs-up) could fail rendering depending on font support.

### What was changed
1. Responsive layout hardening:
   - Better use of dynamic viewport height (`100dvh`).
   - Sidebar now scrolls when needed instead of clipping content.
   - Reduced spacing/padding/font sizes for short-height displays.
   - Added explicit low-height media query (`max-height: 520px`) for 7-inch landscapes.
2. Gesture icon resilience:
   - Added emoji font fallback stack.
   - Added text fallback badges under each gesture icon (`V`, `UP`, `PALM`) so the meaning remains visible even if emoji glyph fails.
3. Startup script Chromium tuning:
   - Added `--window-size=800,480`
   - Added `--force-device-scale-factor=1`
   - Added `--high-dpi-support=1`

### Files changed
- frontend/src/components/KioskDashboard/KioskDashboardPage.jsx
- frontend/src/components/KioskDashboard/KioskDashboardPage.css
- backend/rpi/start_kiosk_rpi.sh

### Why this works
- Vertical clipping is prevented by allowing controlled sidebar scrolling.
- Low-height mode optimizes density for 7-inch kiosk usage.
- Gesture meaning remains visible even if emoji rendering fails.
- Chromium launch flags reduce unpredictable viewport scaling issues.

---

## Problem 5: Provide a spoonfed, super-detailed changelog

### What was changed
- This document was created to explain:
  - The bug symptoms
  - Root causes
  - Exact code-level changes
  - Why each fix is correct
  - What to verify after deployment

### File added
- documentation/changelog/2026-03-13-face-enrollment-and-kiosk-fixes.md

---

## Backend API behavior changes summary

### New/strengthened enrollment error codes and meanings
- `QUALITY_TOO_LOW`: Quality below 80%, enrollment rejected.
- `INSUFFICIENT_QUALITY_FRAMES`: Too few valid high-quality frames.
- `NO_FACE_DETECTED`: Face could not be reliably detected.
- `INVALID_IMAGE_DATA`: Frame payload not decodable.
- `ENROLLMENT_VALIDATION_FAILED`: Generic safe fallback for validation path.
- `DUPLICATE_FACE`: Enrollment blocked due to high similarity with existing profile.

### Security/robustness improvements
- No raw internal exception text returned to client from ValueError path.
- Rollback is explicit in handled HTTP and ValueError cases.

---

## Frontend behavior changes summary

### Enrollment screen UX flow
1. User captures frames.
2. User taps Enroll.
3. If backend success:
   - Show quality success status.
   - Mark user face_registered.
   - Navigate to role dashboard.
4. If backend fails:
   - Show specific warning.
   - Set failed state.
   - Hide Enroll button.
   - Show Retake only.

### Better user feedback
- Distinguishes low quality vs no face vs duplication vs offline vs timeout vs server error.

---

## Kiosk behavior changes summary

### Display responsiveness
- Improved layout fit for small kiosk displays.
- Recent check-ins panel remains reachable due scrollable sidebar.

### Gesture visibility
- Added fallback textual markers for gesture cards to prevent “missing symbol” confusion.

---

## Post-merge verification checklist (manual)

1. Face enrollment low quality test
- Use dim lighting or off-angle capture.
- Confirm response is `QUALITY_TOO_LOW`.
- Confirm no new facial profile is created/updated for that failed attempt.

2. Face duplicate test
- Try enrolling same person using a different account.
- Confirm response is `DUPLICATE_FACE`.
- Confirm enrollment is blocked.

3. Enrollment UI flow test
- Trigger any fail mode (low quality or no face).
- Confirm only Retake button is visible.
- Confirm Enroll Face is hidden until recapture.

4. Network/offline feedback test
- Stop backend or disconnect network.
- Confirm enrollment UI shows offline/unreachable warning.

5. Kiosk 7-inch layout test
- Launch with existing command:
  - `cd ~/frames`
  - `chmod +x backend/rpi/start_kiosk_rpi.sh`
  - `bash backend/rpi/start_kiosk_rpi.sh`
- Confirm Recent Check-ins panel is visible/reachable.
- Confirm BREAK IN card always shows readable icon/label (emoji or fallback).

---

## Notes for maintainers

- Duplicate threshold is now configurable:
  - `DUPLICATE_FACE_THRESHOLD` (default `0.55`)
- If false positives occur, increase threshold slightly (example: `0.57` to `0.60`).
- If false negatives occur, decrease threshold slightly (example: `0.53` to `0.55`).
- Tune carefully with real campus data before production-wide rollout.
