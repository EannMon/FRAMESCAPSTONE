# FRAMES Face Recognition Threshold Analysis

## Purpose

This document addresses the question: **What is the face recognition similarity threshold, and should it be strict?** It provides a technical explanation, recommended values, and guidelines for tuning in the FRAMES attendance system.

---

## 1. How Face Matching Works in FRAMES

FRAMES uses **InsightFace** (buffalo_l model) to generate **512-dimensional embeddings** — numerical representations of a face. When a face is detected by a kiosk camera, the system:

1. **Extracts a 512-d embedding** from the detected face
2. **Normalizes** the embedding vector (unit length)
3. **Computes cosine similarity** against all cached enrolled embeddings
4. **Selects the highest-scoring match** and compares it against the threshold

### Cosine Similarity

Cosine similarity measures how similar two embedding vectors are:

$$\text{similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{||\mathbf{A}|| \times ||\mathbf{B}||}$$

- **1.0** = identical vectors (same person, same image)
- **0.0** = completely unrelated
- **Negative** = extremely dissimilar (rare with face embeddings)

For InsightFace buffalo_l embeddings:
- **Same person, different photos**: typically **0.40 – 0.70**
- **Different people**: typically **0.05 – 0.25**
- **Impostor pairs (similar-looking people)**: can occasionally reach **0.25 – 0.35**

---

## 2. Current FRAMES Configuration

| Parameter | Value | Location |
|-----------|-------|----------|
| `MATCH_THRESHOLD` | **0.35** | `backend/rpi/config.py` |
| `MATCH_THRESHOLD_STRICT` | **0.50** | `backend/rpi/config.py` (available but not active) |
| Face detection model | InsightFace `buffalo_l` | 512-d ArcFace embeddings |
| Enrollment quality minimum | **80%** (0.80 det_score) | Frontend FaceEnrollmentPage |
| Per-sample quality gate | **0.50** det_score | `backend/services/face_enrollment.py` |

### What 0.35 Means

With `MATCH_THRESHOLD = 0.35`, the system identifies a face if the cosine similarity between the detected face and the closest enrolled embedding is **≥ 0.35** (i.e., 35% cosine similarity). This is NOT a percentage match in the traditional sense — it is a mathematical similarity score on a 0-to-1 scale.

---

## 3. Threshold Recommendation for FRAMES

### Context: University Attendance System

FRAMES operates in a **controlled university environment** where:
- Students are pre-enrolled with multiple face samples (up to 15 images)
- The user population is bounded (hundreds to low thousands)
- Cameras are fixed in classrooms at consistent angles
- Lighting conditions are semi-controlled (indoor)
- The consequence of a false match (wrong student marked present) is significant
- The consequence of a false reject (student not recognized) causes frustration but can be retried

### Recommended Threshold: **0.40** (Balanced)

| Threshold | False Accept Rate | False Reject Rate | Use Case |
|-----------|-------------------|-------------------|----------|
| **0.30** | Higher — may match wrong students | Very low — almost everyone is recognized | Too permissive for attendance |
| **0.35** | Low but possible with similar faces | Low | Current default — acceptable for demos |
| **0.40** ★ | Very low | Moderate — some students may need to retry | **Recommended for production** |
| **0.45** | Extremely low | Higher — more retries needed | Strict environments |
| **0.50** | Near zero | High — many students will struggle | Only for high-security (exams) |

### Why 0.40 Is Recommended

1. **Genuine match scores with buffalo_l typically range 0.40–0.70** — a 0.40 threshold catches the lower end of genuine matches while filtering most impostors
2. **Multi-sample enrollment (15 photos) increases match reliability** — the average embedding from 15 angles produces more robust comparisons
3. **University setting is medium-security** — we need to prevent impersonation but also minimize student frustration
4. **The 0.05 gap from current 0.35 to 0.40** eliminates the danger zone where impostor pairs occasionally reach 0.30–0.35

### Tier System for Threshold Selection

| Security Level | Threshold | Scenario |
|----------------|-----------|----------|
| **Standard** (daily attendance) | 0.40 | Regular class attendance, university daily operations |
| **Elevated** (important events) | 0.45 | Exam attendance, lab access |
| **Strict** (high security) | 0.50 | Identity verification for grade changes, admin operations |

---

## 4. Factors That Affect Match Quality

### Improves Accuracy (Higher Scores)
- Good lighting (well-lit classroom)
- Direct face angle (not extreme side profile)
- Higher enrollment quality (multiple angles, good face detection scores)
- Consistent camera height (eye-level)
- Clean camera lens

### Degrades Accuracy (Lower Scores)
- Poor lighting (backlit, dark rooms)
- Extreme angles (looking down at phone)
- Wearing masks, heavy makeup changes
- Low enrollment quality (blurry, far away, single image)
- Model mismatch (enrolled with different model than recognition)
- Glasses on/off between enrollment and recognition

---

## 5. How to Change the Threshold

### Config File (RPi Kiosk)

In `backend/rpi/config.py`:

```python
# Increase for stricter matching (fewer false accepts, more retries)
MATCH_THRESHOLD: float = 0.40  # Recommended for production

# Decrease if students are struggling to be recognized (more false accepts)
MATCH_THRESHOLD: float = 0.35  # Fallback for poor lighting conditions
```

### Environment Variable Override

The threshold can also be set via environment variable without code changes:

```bash
export MATCH_THRESHOLD=0.40
```

---

## 6. Monitoring & Validation

### How to Verify the Threshold Is Correct

1. **Run `test_laptop.py`** which shows real-time similarity scores overlaid on video
2. **Check the confidence_score column** in `attendance_logs` — this records each match's similarity
3. **Analyze distribution**: If most matches score > 0.50, you can safely raise the threshold. If many genuine matches cluster near 0.35–0.40, keep it lower.

### Alert Rules

| Observation | Action |
|-------------|--------|
| Average match score < 0.45 | Check enrollment quality, camera positioning |
| Many matches between 0.35–0.40 | Consider keeping threshold at 0.35 |
| Zero false accepts in testing | Can raise threshold for extra security |
| Students frequently unrecognized | Lower threshold or re-enroll with better images |

---

## 7. Relationship to Enrollment Quality

The **face enrollment quality score** (minimum 80%) and the **recognition match threshold** (0.35–0.40) work together:

- **High enrollment quality + good threshold** = reliable system
- **Low enrollment quality + strict threshold** = frequent false rejects
- **High enrollment quality + low threshold** = works but risks false accepts

The 80% enrollment quality minimum ensures embeddings are reliable enough for recognition. Students below this threshold are prompted to re-enroll.

---

## 8. Summary & Decision

| Question | Answer |
|----------|--------|
| What is the current threshold? | **0.35** (cosine similarity) |
| Should we be strict? | **Moderately** — a university is not a bank vault, but impersonation must be prevented |
| Recommended production threshold? | **0.40** |
| Is 75% a valid threshold? | No — 0.75 cosine similarity would reject almost everyone. That percentage doesn't translate directly. |
| When to use 0.50? | Only for high-security scenarios like exam attendance verification |

**Action Item**: Update `MATCH_THRESHOLD` from `0.35` to `0.40` in `backend/rpi/config.py` before deployment.

---

*Document created for FRAMES Capstone Project — Face Recognition Threshold Discussion (Task 68)*
