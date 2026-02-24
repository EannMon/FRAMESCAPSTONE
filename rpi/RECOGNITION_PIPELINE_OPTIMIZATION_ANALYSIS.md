# Facial Recognition Pipeline Optimization Analysis (FRAMES)

## Overview
This document analyzes the current facial recognition pipeline in the FRAMES project, focusing on performance bottlenecks, scalability, and compliance with FRAMES engineering standards. It is based on the rules in ENGINEERING_STANDARDS_FRAMES.md and FRAMES_DEPLOYMENT_CONSTRAINTS.md.

---

## 1. Frame Processing Budget
- **Target:** <100ms per frame (laptop), <250ms per frame (RPi)
- **Observation:** Current pipeline lags on laptop, will be worse on RPi.
- **Action:** Profile each step (face detection, embedding extraction, comparison) and log processing time.

---

## 2. Expensive Operations Inside Loop
- **Forbidden:** Reloading embeddings, querying DB, or reloading models per frame.
- **Required:** Preload embeddings and models at session start; refresh cache periodically (not per frame).

---

## 3. Embedding Cache Management
- **Observation:** If embeddings are loaded or refreshed per frame, this causes major slowdowns.
- **Required:**
  - Load embeddings once at startup.
  - Refresh cache every 30 minutes or on class change.
  - Use efficient structures (numpy arrays, KD-tree) for fast lookup.

---

## 4. Batch Processing & Data Structures
- **Forbidden:** Comparing each detected face to all embeddings in a slow Python loop.
- **Required:** Batch comparisons using numpy vectorization or KD-tree.
- **Action:** Convert embedding list to numpy array; use vectorized distance calculation.

---

## 5. Resource Management
- **Forbidden:** Blocking camera read loop with heavy computation.
- **Required:**
  - Use threading or async for face recognition.
  - Skip frames (process every Nth frame).
  - Reduce image resolution and detection size for RPi.

---

## 6. Logging & Observability
- **Required:** Log per-frame processing time, memory usage, and cache size.
- **Action:** Add performance logging to main loop and critical functions.

---

## 7. Caching & Refresh Strategy
- **Required:**
  - Periodic embedding cache refresh (every 30 min).
  - On class change, reload only relevant embeddings.
  - Invalidate cache if new enrollment detected.

---

## 8. Recommendations
- Profile and log each pipeline step.
- Move all embedding/model loads outside main loop.
- Use numpy/KD-tree for batch comparisons.
- Implement frame skipping and reduce detection size.
- Add periodic cache refresh and memory monitoring.

---

## 9. References
- See ENGINEERING_STANDARDS_FRAMES.md, FRAMES_DEPLOYMENT_CONSTRAINTS.md, FRAMES_OBSERVABILITY_RULES.md for mandatory optimization rules.

---

## 10. Next Steps
- Review and refactor main_kiosk.py, embedding_cache.py, face_recognizer.py for compliance.
- Add logging and batch processing.
- Test on laptop and RPi, measure frame time and memory usage.

---

**Summary:**
The current pipeline likely violates several FRAMES rules, causing lag. Optimizing as above is mandatory for deployment. See this file for actionable steps and reference rules.
