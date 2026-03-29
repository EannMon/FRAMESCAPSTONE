# 📘 FRAMES CAPSTONE — CHAPTER 4 & 5 EXECUTION GUIDE
### Internal Project Playbook | Team Use Only | AY 2025–2026

> **System:** FRAMES — Facial Recognition and Attendance Monitoring with Embedded System  
> **Institution:** Technological University of the Philippines – Manila  
> **Degree Program:** Bachelor of Science in Information Technology  
> **Deployment Site:** Room 328, College of Science Building, Computer Studies Department

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Global Prerequisites](#2-global-prerequisites)
3. [Workflow & Build Order](#3-workflow--build-order)
4. [Chapter 4 Execution Guide](#4-chapter-4-execution-guide-detailed)
   - [4.1 Project Description](#41-project-description)
   - [4.2 Project Structure](#42-project-structure)
   - [4.3 Figures and Screenshots](#43-figures-and-screenshots)
   - [4.4 Capabilities and Limitations](#44-capabilities-and-limitations)
   - [4.5 Test Results](#45-test-results)
   - [4.6 Evaluation Results](#46-evaluation-results)
5. [Chapter 5 Execution Guide](#5-chapter-5-execution-guide-detailed)
   - [5.1 Summary of Findings](#51-summary-of-findings)
   - [5.2 Conclusions](#52-conclusions)
   - [5.3 Recommendations](#53-recommendations)
6. [Task Assignment Matrix](#6-task-assignment-matrix)
7. [Quality Control Checklist](#7-quality-control-checklist)
8. [Common Mistakes to Avoid](#8-common-mistakes-to-avoid)
9. [Final Output Format](#9-final-output-format)

---

# 1. OVERVIEW

## What is Chapter 4?

Chapter 4 presents the **Results and Discussion** of FRAMES. This is where everything comes together — you show the panel that the system you described in Chapters 1–3 actually **exists, functions, and performs well**. Every claim must be supported with a figure, a table, or actual data.

This chapter contains:
- A description of the developed system (what it is, what it does)
- The structural breakdown of modules and their UIs (screenshots)
- Documented capabilities and known limitations
- Test results per ISO/IEC 25010 quality characteristic (functional, performance, usability, reliability, security)
- Evaluation results from Likert-scale survey responses (computed means, interpretation)

## What is Chapter 5?

Chapter 5 presents the **Summary, Conclusions, and Recommendations**. This is your closing argument. It demonstrates that you understand the significance and impact of your own work. The panel looks here to judge your maturity as researchers.

This chapter contains:
- A concise summary of findings (no new information)
- Conclusions that directly answer each study objective
- Recommendations based on the system's limitations and future directions

## Why These Chapters Are Critical for Panel Evaluation

The panel will spend the most time scrutinizing Chapters 4 and 5. Specifically, they will:

1. **Cross-reference your test results with your methodology** (Chapter 3 must match Chapter 4 exactly)
2. **Challenge your evaluation data** — they will ask how you computed the means and whether respondents actually used the system
3. **Probe your conclusions** — each conclusion must link directly to a specific objective from Chapter 1
4. **Question your recommendations** — recommendations must be realistic and grounded in actual limitations, not generic ideas

If your results do not match your methodology, or if your conclusions do not answer your objectives, **you will fail the panel defense**. This guide exists to prevent that.

---

# 2. GLOBAL PREREQUISITES

Before any writing begins, ALL of the following must be in place. Writing must not start without these.

---

### ✅ PREREQUISITE 1: Final System is Complete and Deployed

**Why it's needed:** Chapter 4 describes the actual system. You cannot describe what doesn't exist.  
**Depends on:** 4.1 (Project Description), 4.2 (Project Structure), 4.3 (Figures)  
**Who verifies:** Emman (lead developer)

**Checklist:**
- [ ] Kiosk is running on Raspberry Pi 4 with USB webcam
- [ ] Backend (FastAPI) is deployed and accessible
- [ ] Frontend (Vite + React) is running and all dashboards function
- [ ] Face enrollment works via browser webcam
- [ ] All 4 gestures work: Entry (auto), Break-out (✌️), Break-in (👍), Exit (✋)
- [ ] Auto-exit mechanism works at class end_time
- [ ] Early entry window (10 min before class) is working
- [ ] CSV and PDF report generation is functional
- [ ] Anomaly detection (unrecognized users) displays red alert on kiosk

---

### ✅ PREREQUISITE 2: Final Screenshots / Screen Recordings Organized

**Why it's needed:** Chapter 4 requires labeled figures for every module and UI screen.  
**Depends on:** 4.3 (Figures and Screenshots), 4.2 (Project Structure)  
**Who prepares:** Karl (screenshot capture + organization)

**Checklist:**
- [ ] Screenshots taken for EVERY major screen of the system (see Section 4.3 for full list)
- [ ] Screenshots saved in a shared folder named using the convention: `Figure_X_[description].png`
- [ ] Screenshots are high-resolution (minimum 1280×720), not blurry or cropped incorrectly
- [ ] Kiosk photos taken from an actual classroom deployment (or realistic simulation)
- [ ] Screenshots are organized in order from Figure 1 onwards

---

### ✅ PREREQUISITE 3: Functional Testing is Completed and Documented

**Why it's needed:** Section 4.5 (Test Results) requires a table of test steps and observed results. You cannot write "Passed" if you haven't actually tested it.  
**Depends on:** 4.5 (Test Results)  
**Who prepares:** Angge + Elena

**Checklist:**
- [ ] All 5 ISO/IEC 25010 test tables from Chapter 3 have been executed
- [ ] Actual results per test case are recorded (not hypothetical)
- [ ] Results are noted as: PASS / FAIL / PARTIAL (if applicable, with reason)
- [ ] Any observed issues during testing are noted for use in 4.4 (Limitations)

---

### ✅ PREREQUISITE 4: Survey Responses are Collected and Tabulated

**Why it's needed:** Section 4.6 (Evaluation Results) requires computed weighted means per ISO/IEC 25010 criterion, per respondent group.  
**Depends on:** 4.6 (Evaluation Results)  
**Who prepares:** Elena (tabulation in Excel) + Emman (verification)

**Checklist:**
- [ ] Survey Questionnaire A1 completed by ~25 CRP students (hands-on users)
- [ ] Survey Questionnaire A2 completed by ~25 NCRP students (demo/video observers)
- [ ] Survey Questionnaire B completed by the Department Head (expert evaluation)
- [ ] All 30 items per student questionnaire are tallied (frequency per rating per item)
- [ ] Weighted Mean per item is computed: `WM = Σ(f × w) / N`
- [ ] Category Mean is computed per ISO/IEC 25010 characteristic (Functional, Performance, etc.)
- [ ] Grand Mean is computed across all characteristics
- [ ] Adjectival interpretation applied: 3.4–4.0 = Highly Acceptable, 2.6–3.3 = Very Acceptable, 1.8–2.5 = Acceptable, 1.0–1.7 = Not Acceptable
- [ ] Separate computations done for: CRP students, NCRP students, Department Head (expert)

---

### ✅ PREREQUISITE 5: Finalized Modules and Features List

**Why it's needed:** Section 4.2 and 4.4 require a definitive list of everything the system can and cannot do.  
**Depends on:** 4.2, 4.4  
**Who prepares:** Emman

**Minimum list of modules to document:**
1. Student Module — Face Enrollment, Personal Attendance View, Real-Time Status
2. Faculty Module — Class Management, Schedule Upload, Class Attendance View, Report Generation
3. Department Head Module — Faculty Verification, Department Reports, Room Utilization View
4. Kiosk (Raspberry Pi) — Face Recognition, Gesture Detection, Kiosk Display, Anomaly Detection

---

### ✅ PREREQUISITE 6: Chapter 3 Must Be Frozen (No Further Changes)

**Why it's needed:** Chapter 4's test results must mirror the test procedures defined in Chapter 3 exactly. If Chapter 3 changes, Chapter 4 becomes inconsistent.  
**Depends on:** 4.5 (Test Results)  
**Who verifies:** All members before writing begins

**Action:** Once writing of Chapter 4 begins, lock `chapter3_revised.md`. No edits without group approval.

---

### ✅ PREREQUISITE 7: Seeded Data is Available for Reporting Screenshots

**Why it's needed:** The system was only deployed for one day. Seeded data is needed to demonstrate robust report generation in screenshots.  
**Depends on:** 4.2 (Project Structure), 4.3 (Figures)  
**Who prepares:** Emman (already stated in Chapter 3 scope)

---

# 3. WORKFLOW & BUILD ORDER

Follow this exact order. **Do not skip steps. Do not write a later section before its dependencies are done.**

```
WEEK 1 — DATA GATHERING PHASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1 │ [Emman]   Seed attendance data in the database
Step 2 │ [Karl]    Capture ALL system screenshots (see list in 4.3)
Step 3 │ [Angge]   Execute Functional Suitability tests (live testing)
Step 4 │ [Elena]   Execute Performance, Usability, Reliability, Security tests
Step 5 │ [All]     Administer surveys to ~50 students + faculty + dept head
Step 6 │ [Elena]   Tabulate survey results in Excel, compute weighted means
Step 7 │ [Emman]   Verify computation and category means, compute grand mean

WEEK 2 — WRITING PHASE (Chapter 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 8 │ [Emman]   Write 4.1 — Project Description
Step 9 │ [Karl]    Write 4.2 — Project Structure (with screenshots organized by Step 2)
Step 10│ [Karl]    Write 4.3 — Figures (insert captions, reference in text)
       │ [PARALLEL with Step 8, 9]
Step 11│ [Angge]   Write 4.4 — Capabilities and Limitations
Step 12│ [Angge]   Write 4.5 — Test Results (Functional Suitability + Performance tables)
Step 13│ [Elena]   Write 4.5 — Test Results (Usability, Reliability, Security tables)
       │ [PARALLEL with Step 12]
Step 14│ [Elena]   Write 4.6 — Evaluation Results (CRP + NCRP student means table)
Step 15│ [Emman]   Write 4.6 — Expert Evaluation (Department Head mean table + discussion)
       │ [PARALLEL with Step 14]
Step 16│ [All]     Peer review Chapter 4 for consistency + cross-references

WEEK 3 — WRITING PHASE (Chapter 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 17│ [Mel]     Write 5.1 — Summary of Findings
Step 18│ [Denice]  Write 5.2 — Conclusions (using template provided in Section 5.2)
Step 19│ [Mel]     Write 5.3 — Recommendations
Step 20│ [All]     Final review — check checklist in Section 7
```

### Dependency Map

```
Step 1 ──► Step 9, 10 (need seeded data for reporting screenshots)
Step 2 ──► Step 9, 10 (screenshots needed before writing 4.2)
Step 3 ──► Step 12 (test data needed before writing test results)
Step 4 ──► Step 13
Step 5 ──► Step 6
Step 6 ──► Step 7 ──► Step 14, 15 (means needed before writing 4.6)
Step 16 ──► Step 17, 18, 19 (Ch4 must be done before Ch5 Summary)
```

---

# 4. CHAPTER 4 EXECUTION GUIDE (DETAILED)

---

## 4.1 Project Description

### Objective of This Section
To introduce FRAMES to the reader as a fully developed system — what it does, how it addresses the problem, what modules it contains, what technologies power it, and what benefit it delivers.

### Assigned To: **Emman**

### Required Inputs
- Chapter 1 Introduction (problem statement, study objectives)
- Final list of modules (Student, Faculty, Department Head, Kiosk)
- Technology stack: FastAPI, PostgreSQL (Aiven), Vite + React, InsightFace buffalo_sc, MediaPipe, Raspberry Pi 4, USB webcam

### Writing Formula

Follow this 5-part paragraph structure:

```
Paragraph 1 — THE PROBLEM (1–2 sentences)
  → Restate the core problem from Chapter 1 in 1 sentence.
  → Example: "Manual attendance monitoring in educational institutions is 
     susceptible to proxy attendance, delayed recording, and limited 
     accountability..."

Paragraph 2 — THE SOLUTION (2–3 sentences)
  → Introduce FRAMES as the solution.
  → State what FRAMES is and what it does in plain terms.
  → Example: "FRAMES is a web-based, gesture-gated smart attendance 
     monitoring system deployed on Raspberry Pi hardware that integrates 
     facial recognition and static hand gesture confirmation..."

Paragraph 3 — THE MODULES (3–4 sentences)
  → Enumerate the main modules and what each does.
  → Example: "The system is composed of four primary modules: the Student 
     module, which provides face enrollment and personal attendance 
     monitoring; the Faculty module, which enables class management and 
     report generation; the Department Head module, which offers 
     department-wide oversight and faculty verification; and the Raspberry 
     Pi Kiosk, which performs real-time face recognition and gesture-gated 
     attendance logging at the classroom entrance."

Paragraph 4 — THE TECHNOLOGY (2–3 sentences)
  → Mention key tech aligned with Chapter 3. Keep it brief.
  → Example: "The backend is built using FastAPI with SQLAlchemy 2.x ORM, 
     and the PostgreSQL database is hosted on Aiven Cloud with SSL/TLS 
     encryption. The frontend is developed using Vite and React with 
     Bootstrap 5.3 for responsive design and Chart.js/Recharts for 
     attendance visualization. The kiosk utilizes InsightFace's buffalo_sc 
     model pack and MediaPipe Hands running via ONNX Runtime on a Raspberry 
     Pi 4 Model B."

Paragraph 5 — THE BENEFIT (1–2 sentences)
  → State the value the system delivers.
  → Example: "FRAMES transforms routine attendance recording into a 
     data-driven, intent-aware process that reduces administrative overhead, 
     prevents proxy attendance, and provides actionable insights for 
     institutional decision-making."
```

### Format
- 5 paragraphs
- No bullets or headers within this section
- Formal academic tone
- Do NOT re-explain Chapter 1 objectives or Chapter 3 methodology here

---

## 4.2 Project Structure

### Objective of This Section
To walk the reader through every module of FRAMES using labeled screenshots and structured descriptions, so the panel can see exactly what was built.

### Assigned To: **Karl**

### Required Inputs
- All organized screenshots from Prerequisite 2
- Final modules list from Prerequisite 5

### How to Divide Modules

Organize the section into 4 sub-sections (one per module):

```
4.2.1 Student Module
4.2.2 Faculty Module
4.2.3 Department Head Module
4.2.4 Kiosk (Raspberry Pi Interface)
```

### How Many Screenshots Per Module

| Module | Minimum Screenshots |
|--------|-------------------|
| Student Module | 4 (Login, Face Enrollment, Attendance View, Real-Time Status) |
| Faculty Module | 5 (Dashboard, Schedule Upload, Class View, Student Logs, Report Download) |
| Department Head Module | 4 (Dashboard, Faculty Verification, Department Reports, Room Utilization) |
| Kiosk Interface | 4 (Idle screen, Face detected, Gesture prompt, Anomaly detected) |

### Standard Explanation Pattern Per Screen

For EACH screenshot, write using this 3-part pattern:

```
[1 sentence — what this screen is]
[1–2 sentences — what the user does on this screen / what information is displayed]
[1 sentence — how this connects to a system objective or module function]

EXAMPLE (Student Dashboard):
"Figure 3 shows the Student Attendance Dashboard of the FRAMES web application. 
The dashboard displays the student's complete attendance log, including timestamps 
for each attendance action (Entry, Break-Out, Break-In, Exit), real-time status 
indicators, and a summary of attendance performance for the current class section. 
This dashboard allows students to verify their attendance records and monitor 
their punctuality in real time."
```

### Format Rules
- Each module gets its own `###` heading
- Each figure is referenced in the text BEFORE the figure appears
- Use: `As shown in Figure X,...` or `Figure X illustrates...`
- Do not dump screenshots without explanatory text

---

## 4.3 Figures and Screenshots

### Objective of This Section
To establish a consistent naming and captioning system for all figures so the document looks professional and is easy to navigate.

### Assigned To: **Karl** (capture + labels) | **All** (reference in-text when writing their sections)

### EXACT List of Required Screenshots

Capture ALL of the following. Tag each file as `Figure_[N]_[description].png`:

| Figure No. | What to Capture | Module |
|-----------|----------------|--------|
| Figure 1 | Landing/Login page of the web app | General |
| Figure 2 | Student account creation / first-time login | Student |
| Figure 3 | Face Enrollment page (browser webcam UI) | Student |
| Figure 4 | Student dashboard — attendance log table | Student |
| Figure 5 | Student real-time status indicator (Green = Present) | Student |
| Figure 6 | Faculty dashboard — class overview | Faculty |
| Figure 7 | Faculty schedule upload (PDF upload UI) | Faculty |
| Figure 8 | Faculty class attendance — student list with statuses | Faculty |
| Figure 9 | CSV/PDF report download UI | Faculty |
| Figure 10 | Department Head dashboard — department-wide summary | Dept Head |
| Figure 11 | Faculty verification panel (approve faculty accounts) | Dept Head |
| Figure 12 | Department-wide attendance report | Dept Head |
| Figure 13 | Room utilization view or analytics chart | Dept Head |
| Figure 14 | Kiosk idle screen (camera feed, class info, gesture guide) | Kiosk |
| Figure 15 | Kiosk — face recognized (green bounding box, welcome message) | Kiosk |
| Figure 16 | Kiosk — gesture prompt displayed (after face recognized) | Kiosk |
| Figure 17 | Kiosk — anomaly detected (red overlay / alert message) | Kiosk |
| Figure 18 | Kiosk physical setup in Room 328 (photo of actual hardware) | Hardware |
| Figure 19 | Chart/visualization on dashboard (Chart.js attendance graph) | General |
| Figure 20 | Mobile-responsive view of dashboard (phone screenshot) | General |

> **Note:** You may add additional figures as needed. Always increment the number sequentially. Do NOT reuse figure numbers.

### Caption Format

Every figure must have a caption BELOW the image in this exact format:

```
Figure [N]. [Screen Name] — [Brief description of what is shown]

EXAMPLE:
Figure 3. Face Enrollment Page — The browser webcam interface used by students 
and faculty to capture facial embeddings for registration in the FRAMES system.
```

### In-Text Referencing Style

Always reference the figure in the paragraph BEFORE it appears:

```
"Figure 5 displays the real-time status indicator visible on the student dashboard. 
The indicator changes color based on the student's current attendance state: green 
(Present), or yellow (On Break)."
[INSERT Figure 5 here]
```

**NEVER** place a figure without at least one preceding sentence referencing it.

---

## 4.4 Capabilities and Limitations

### Objective of This Section
To transparently document what FRAMES can and cannot do, demonstrating research maturity.

### Assigned To: **Angge**

### Required Inputs
- Final features list from Prerequisite 5
- Testing notes from Steps 3–4 (any observed failures or edge cases)

### How to Identify Capabilities

List every feature that was **tested and confirmed working** during pilot deployment. Group them by module. Use this format:

```
WRITING PATTERN:
"FRAMES is capable of [action], allowing [user] to [benefit]."

EXAMPLES:
"FRAMES is capable of real-time facial recognition via the Raspberry Pi 4 kiosk, 
allowing enrolled students and faculty to log attendance without making physical 
contact with any input device."

"The system is capable of generating exportable attendance reports in both CSV 
and PDF formats, allowing faculty and the department head to maintain official 
academic records."
```

**Use bullet points within a paragraph.** Start each bullet with the module name in bold:

```
The following capabilities were confirmed during system deployment:

• **Kiosk – Face Recognition:** The system accurately identifies enrolled users 
  via the InsightFace buffalo_sc model, with an observed recognition latency of 
  approximately [X] seconds under standard lighting conditions.

• **Kiosk – Gesture-Gated Logging:** The system correctly detects and logs four  
  attendance actions: automatic entry upon face recognition, break-out via  
  peace sign (✌️), break-in via thumbs-up (👍), and final exit via open palm (✋).

• **Kiosk – Anomaly Detection:** Unrecognized individuals are flagged with a 
  visual alert on the kiosk display. No attendance log is created for flagged 
  individuals.

[Continue for all major features...]
```

### How to Write Limitations

Limitations must be **realistic and observable**, not vague. Base them on actual testing findings or known constraints.

**DO NOT write:** "The system is not perfect."  
**WRITE instead:**

```
WRITING PATTERN:
"The system is limited to [specific constraint], which may affect [specific 
scenario]. This limitation exists because [brief technical reason if applicable]."

EXAMPLES:
"The system is currently limited to a single-classroom deployment (Room 328, 
College of Science Building), and does not support multi-room or campus-wide 
simultaneous operation."

"Recognition accuracy may be affected under poor lighting conditions, as the 
USB webcam does not include infrared or night-vision capabilities. The system 
performed optimally under standard fluorescent classroom lighting."

"The system does not include advanced liveness detection techniques such as 
3D depth sensing or infrared analysis. While gesture-gated interaction 
mitigates simple presentation attacks (e.g., printed photos), it does not 
prevent spoofing via high-quality video playback."

"The system does not support a dedicated mobile application; all dashboard 
features are accessible through a mobile-responsive web interface."
```

### Format Rules
- Capabilities: 1 paragraph intro + bullet list
- Limitations: 1 paragraph intro + bullet list
- 5–8 capabilities minimum, 4–6 limitations minimum
- Never fabricate limitations you didn't observe

---

## 4.5 Test Results

### Objective of This Section
To present the documented results of all functional and quality tests defined in Chapter 3, proving that the system meets its stated requirements.

### Assigned To
- **Angge** → Functional Suitability Test, Performance Efficiency Test
- **Elena** → Interaction Capability (Usability) Test, Reliability Test, Security Test

### Required Inputs
- Live testing results from Steps 3–4 of the Workflow
- Chapter 3 test tables (use same test modules, scenarios, and steps — only add Observed Result and Status columns)

### EXACT Table Format

Each test table must have the following **5 columns**:

| Test Module | Test Scenario | Steps | Observed Result | Status |
|-------------|--------------|-------|-----------------|--------|

**Column Definitions:**

| Column | What to Write |
|--------|--------------|
| **Test Module** | Name of the feature being tested (e.g., "Attendance Logging (Face + Gesture)") |
| **Test Scenario** | What condition is being verified (copy directly from Chapter 3) |
| **Steps** | Numbered steps performed during testing (copy/condense from Chapter 3) |
| **Observed Result** | What the system actually did — be specific, use system language |
| **Status** | PASSED / FAILED / PARTIALLY PASSED |

### How to Write Observed Results (VERY SPECIFIC)

The **Observed Result** column must describe what the SYSTEM RESPONDED WITH, not what the tester did.

```
WRONG: "The system worked."
WRONG: "It recognized the face."

CORRECT: "The kiosk displayed a green bounding box around the detected face, 
showed the message 'Welcome, [Student Name]!', and logged an ENTRY record 
with action = ENTRY and verified_by = FACE in the attendance_logs table. 
The student dashboard updated the status indicator to green (Present) without 
manual refresh."

CORRECT (for Anomaly): "The kiosk displayed a red bounding box labeled 
'Unrecognized Individual' and showed an alert message onscreen. No attendance 
log was created in the database for the unrecognized user."
```

### One Table Per ISO/IEC 25010 Characteristic

Create separate tables labeled:

```
Table 1. Functional Suitability Test Results
Table 2. Performance Efficiency Test Results
Table 3. Interaction Capability (Usability) Test Results
Table 4. Reliability Test Results
Table 5. Security Test Results
```

### How to Write the Interpretation After Each Table

After each table, write a **2–3 sentence paragraph interpretation:**

```
PATTERN:
"The [characteristic name] tests revealed that FRAMES [summary of result]. 
All [N] test scenarios resulted in a [PASSED/PASSED with minor observations] 
status, demonstrating that the system [specific strength]. [Optional: note 
any observed limitation or deviation]."

EXAMPLE:
"The Functional Suitability test results demonstrate that FRAMES successfully 
performs all its core attendance management functions. All six (6) test scenarios 
recorded a PASSED status, confirming that the system accurately logs attendance 
actions, detects anomalies, and generates exportable reports consistent with the 
data stored in the database. The early entry window and auto-exit mechanisms also 
functioned as designed, with no missed or duplicate records observed during testing."
```

---

## 4.6 Evaluation Results

### Objective of This Section
To present the results of the ISO/IEC 25010 Likert-scale survey evaluation, demonstrating user acceptance of FRAMES.

### Assigned To
- **Elena** → Student evaluation tables (CRP + NCRP groups, all 5 characteristics)
- **Emman** → Expert evaluation table (Department Head) + grand mean discussion

### Required Inputs
- Completed Excel tabulation from Step 6–7 of Workflow
- Weighted mean per item, category mean per characteristic, grand mean

### How to Present the Survey Data

**Structure the section as follows:**

```
4.6.1 Student Evaluation Results (CRP Group)
4.6.2 Student Evaluation Results (NCRP Group)
4.6.3 Comparative Analysis (CRP vs. NCRP)
4.6.4 Expert Evaluation (Department Head)
4.6.5 Overall Evaluation Summary
```

### Likert Scale Explanation Format

At the start of Section 4.6, include this explanation paragraph (write it ONCE):

```
"The acceptability of FRAMES was evaluated using a 4-point Likert scale 
administered through structured survey questionnaires aligned with the 
ISO/IEC 25010 Software Quality Model. Respondents rated each criterion 
on a scale from 1 (Not Acceptable) to 4 (Highly Acceptable). The weighted 
mean for each item was computed using the formula WM = Σ(f × w) / N, where 
f is the frequency of each rating, w is the corresponding weight, and N is 
the total number of respondents. Category means were derived per ISO/IEC 25010 
quality characteristic, and a grand mean was computed to represent the 
system's overall acceptability. The adjectival interpretations are as follows: 
3.4–4.0 (Highly Acceptable), 2.6–3.3 (Very Acceptable), 1.8–2.5 (Acceptable), 
and 1.0–1.7 (Not Acceptable)."
```

### Table Format (Per ISO/IEC 25010 Characteristic)

Each evaluation table must have these EXACT columns:

| Criterion No. | Criterion Statement | Weighted Mean | Interpretation |
|--------------|--------------------|--------------:|---------------|
| 1 | [Statement from survey item 1] | X.XX | Highly Acceptable |
| ... | ... | ... | ... |
| | **Category Mean** | **X.XX** | **Highly Acceptable** |

**Rules:**
- Use the EXACT statement from the survey questionnaire (do not paraphrase)
- Round weighted means to 2 decimal places
- Interpretation is based on the Likert range table
- Category Mean row must be bolded
- Create one table per ISO/IEC 25010 characteristic (Functional, Performance, Usability, Reliability, Security)

### How to Write the Paragraph Interpretation

After each table, write a **3–4 sentence interpretation paragraph:**

```
PATTERN:
"Table [N] presents the evaluation results for [characteristic name] as 
rated by [respondent group]. The category mean of [X.XX] was interpreted 
as [Adjectival Rating], indicating that respondents found the system 
[meaning in plain language]. Among the individual items, [Item X] received 
the highest mean of [X.XX], suggesting that [specific insight]. Conversely, 
[Item Y] received a relatively lower mean of [X.XX], which may indicate 
[specific observation]."

EXAMPLE:
"Table 6 presents the Functional Suitability evaluation from CRP student 
respondents. The category mean of 3.72 was interpreted as Highly Acceptable, 
indicating that hands-on users found FRAMES to reliably perform its core 
attendance management functions. Item 1, which assessed face recognition 
accuracy, received the highest mean of 3.88, reflecting strong user 
confidence in the system's identification capability. Item 7, which assessed 
the system's ability to distinguish between attendance action types, received 
a mean of 3.60, still within the Highly Acceptable range but suggesting some 
users experienced minor ambiguity in action differentiation."
```

### Grand Mean Summary Table

At the end of Section 4.6, create a consolidated summary table:

| ISO/IEC 25010 Characteristic | CRP Mean | NCRP Mean | Expert Mean | Overall Mean | Interpretation |
|-----------------------------|:--------:|:---------:|:-----------:|:------------:|---------------|
| Functional Suitability | X.XX | X.XX | X.XX | X.XX | Highly Acceptable |
| Performance Efficiency | X.XX | X.XX | X.XX | X.XX | Highly Acceptable |
| Interaction Capability | X.XX | X.XX | X.XX | X.XX | Highly Acceptable |
| Reliability | X.XX | X.XX | X.XX | X.XX | Highly Acceptable |
| Security | X.XX | X.XX | X.XX | X.XX | Highly Acceptable |
| **Grand Mean** | **X.XX** | **X.XX** | **X.XX** | **X.XX** | **Highly Acceptable** |

---

# 5. CHAPTER 5 EXECUTION GUIDE (DETAILED)

---

## 5.1 Summary of Findings

### Objective of This Section
To present a concise, objective summary of everything discovered and accomplished in the study. No new information. No analysis. Just facts from Chapter 4.

### Assigned To: **Mel**

### Required Inputs
- Completed Chapter 4 (all sections must be done first)
- Grand mean evaluation results from Section 4.6
- Test results STATUS from Section 4.5

### Structure Template

```
Opening sentence (what the study did)
→ "This study aimed to design, develop, and evaluate FRAMES — a web-based, 
   gesture-gated facial recognition attendance monitoring system deployed on 
   Raspberry Pi hardware — for use in a selected classroom of the 
   Technological University of the Philippines–Manila."

Body (1 paragraph per major finding):

Paragraph 1 — System design and development outcome
→ "The developed system consists of [N] modules: the Student module, 
   Faculty module, Department Head module, and the Raspberry Pi Kiosk 
   interface. The system employs a two-pipeline architecture that separates 
   face enrollment (server-side via InsightFace buffalo_sc) from recognition 
   (edge-side via ONNX Runtime on Raspberry Pi 4), enabling reliable low-cost 
   deployment."

Paragraph 2 — Test results
→ "Functional testing based on the ISO/IEC 25010 quality model revealed that 
   FRAMES successfully passed all [N] test scenarios across all five quality 
   characteristics: Functional Suitability, Performance Efficiency, Interaction 
   Capability, Reliability, and Security."

Paragraph 3 — Evaluation results
→ "The post-deployment evaluation conducted with [N] student respondents and 
   one department head yielded a grand mean of [X.XX], interpreted as 
   [Adjectival Rating] based on the 4-point Likert scale. CRP student 
   respondents rated the system at [X.XX] ([Interpretation]), NCRP student 
   respondents rated it at [X.XX] ([Interpretation]), and the department head 
   expert evaluation yielded [X.XX] ([Interpretation])."
```

### What to AVOID

- ❌ Do NOT introduce new data not in Chapter 4
- ❌ Do NOT include tables or figures
- ❌ Do NOT include your opinions or interpretations
- ❌ Do NOT repeat the problem statement from Chapter 1 verbatim
- ❌ Do NOT say "the researchers found that the system is good" — cite actual means

---

## 5.2 Conclusions

### Objective of This Section
To state the research conclusions that directly answer each study objective from Chapter 1, based on the findings in Chapter 4.

### Assigned To: **Denice**

### Required Inputs
- Chapter 1 Objectives (all 4 specific objectives)
- Chapter 4 results (test results + evaluation grand mean)
- Summary from Section 5.1

### Mandatory Rule: ONE CONCLUSION PER OBJECTIVE

Refer to the 4 specific objectives from Chapter 1:

```
Objective 1: To design a smart monitoring system incorporating facial recognition, 
gesture recognition, and web-based dashboard for all user roles.

Objective 2: To create reporting and visualization features exportable in CSV and PDF.

Objective 3: To test and improve functionality, compatibility, and usability through 
pilot deployment in Room 328.

Objective 4: To evaluate the system using ISO/IEC 25010 focusing on Functional 
Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security.
```

### Sentence Construction Pattern Per Conclusion

```
PATTERN:
"Based on the [test/evaluation/development] results, [the system / FRAMES] 
[specific achievement that answers the objective], as evidenced by [specific 
finding from Chapter 4]."

EXAMPLES:

Conclusion for Objective 1:
"Based on the results of the development and pilot deployment, FRAMES 
successfully integrates facial recognition using InsightFace's buffalo_sc 
model pack, static hand gesture recognition via MediaPipe Hands, and a 
role-based web dashboard serving Student, Faculty, and Department Head users, 
fulfilling the design requirements of the first objective."

Conclusion for Objective 4:
"The ISO/IEC 25010 evaluation revealed that FRAMES was rated as [Adjectival 
Rating] by its respondents, achieving a grand mean of [X.XX] across all five 
quality characteristics: Functional Suitability ([X.XX]), Performance 
Efficiency ([X.XX]), Interaction Capability ([X.XX]), Reliability ([X.XX]), 
and Security ([X.XX]). These results indicate that the system meets acceptable 
standards of software quality for its intended deployment environment."
```

### How to Sound Authoritative

- Use declarative statements, not hedging language
- ❌ "The system seems to have worked well..."
- ✅ "The system demonstrated [specific capability], confirmed by [specific result]."
- End conclusions with a strong, definitive closing sentence about the overall contribution of FRAMES

### Closing Sentence Template

```
"Overall, FRAMES demonstrates the feasibility of deploying edge-optimized, 
gesture-gated biometric attendance systems using affordable embedded hardware — 
providing a viable, low-cost, and privacy-conscious alternative to conventional 
attendance management practices in Philippine academic institutions."
```

---

## 5.3 Recommendations

### Objective of This Section
To recommend specific future improvements to FRAMES, grounded in documented limitations.

### Assigned To: **Mel**

### Required Inputs
- Section 4.4 Limitations (MUST derive recommendations FROM limitations only)
- Expert evaluation open-ended responses from Department Head survey

### Rules
- Every recommendation must trace back to a specific limitation
- Do NOT recommend something that was not a limitation (e.g., don't recommend fingerprint if you didn't say fingerprint was a limitation)
- Be specific — name technologies or approaches where applicable
- Mix short-term (realistic for a v2) and long-term (larger scope) recommendations

### Structured Format

Write each recommendation as a numbered item with:

```
[N]. [Recommendation Title]
Limited by: [Which limitation from 4.4 this addresses]
Recommendation: [Specific what-to-do]

EXAMPLES:

1. Multi-Room and Campus-Wide Deployment
Limited by: Single-classroom prototype scope (Room 328 only)
Recommendation: Future versions of FRAMES should support multi-classroom 
deployment through centralized device management, allowing multiple Raspberry Pi 
kiosks to synchronize attendance data under a unified dashboard accessible 
institution-wide.

2. Advanced Liveness Detection
Limited by: No 3D depth sensing or infrared analysis for presentation attacks
Recommendation: Future iterations may incorporate liveness detection modules 
such as blink detection, head pose estimation, or depth-camera-based verification 
to enhance resistance against video-playback spoofing attempts.

3. Lighting Robustness Enhancement
Limited by: Recognition accuracy sensitive to poor lighting conditions
Recommendation: Integration of infrared-sensitive or wide dynamic range cameras 
could improve recognition reliability in low-light classroom environments.

4. Dedicated Mobile Application
Limited by: No dedicated mobile application; web-only interface
Recommendation: A native mobile application (iOS/Android) could provide 
students and faculty with push notifications and offline attendance viewing, 
improving accessibility beyond browser-dependent access.

5. Integration with Learning Management Systems
Limited by: No integration with external LMS platforms
Recommendation: Future development may include API integration with platforms 
such as Moodle or Google Classroom to automatically synchronize attendance data 
with grade computation and academic monitoring tools.
```

### Realistic vs. Unrealistic

| ✅ Realistic Recommendation | ❌ Unrealistic / Too Vague |
|-----------------------------|--------------------------|
| Add liveness detection via blink analysis | Make the system perfect |
| Support multi-room deployment via central API | Deploy across all Philippine schools |
| Integrate with Google Classroom API | Replace all teachers with AI |
| Improve lighting robustness via IR webcam | Use quantum computing for recognition |

---

# 6. TASK ASSIGNMENT MATRIX

## Primary Assignments

| Section | Assigned Member | Responsibilities | Required Inputs | Output Deliverable |
|---------|----------------|-----------------|-----------------|-------------------|
| 4.1 Project Description | **Emman** | Write 5-paragraph description using template | Ch1 problem statement, modules list, tech stack | 4–5 paragraphs |
| 4.2 Project Structure | **Karl** | Organize screenshots by module, write descriptions | All screenshots (captioned), modules list | 4 sub-sections with 17–21 figures |
| 4.3 Figures and Screenshots | **Karl** | Capture all 20 required screenshots, label per convention | Fully functional system with seeded data | 20+ labeled `Figure_N_description.png` files |
| 4.4 Capabilities and Limitations | **Angge** | Write bullets for capabilities + limitations | Features list, testing notes | 1 section with 2 sub-lists |
| 4.5 Test Results (Functional + Performance) | **Angge** | Build Tables 1 & 2 with observed results | Live test results from testing week | 2 complete tables + 2 interpretation paragraphs |
| 4.5 Test Results (Usability + Reliability + Security) | **Elena** | Build Tables 3, 4 & 5 with observed results | Live test results from testing week | 3 complete tables + 3 interpretation paragraphs |
| 4.6 Evaluation (Student CRP + NCRP) | **Elena** | Build evaluation tables, compute means, write interpretations | Excel tabulation, weighted means per item | 5+ tables + interpretation paragraphs per group |
| 4.6 Expert Evaluation + Grand Mean | **Emman** | Build expert eval table, compute grand mean, write overall discussion | Expert (Dept Head) survey tabulation | Expert table + summary grand mean table + 2 paragraphs |
| 5.1 Summary of Findings | **Mel** | Write concise summary of all Ch4 findings | COMPLETED Chapter 4 | 3–4 paragraphs |
| 5.2 Conclusions | **Denice** | Write 1 conclusion per study objective | Ch1 objectives + Ch4 results | 4 conclusion paragraphs + closing |
| 5.3 Recommendations | **Mel** | Write numbered recommendations from limitations | Section 4.4 limitations | 5–7 numbered recommendations |

---

## Collaboration Points (Who Depends on Who)

```
Karl → Angge, Elena, Mel (screenshots must exist before 4.2, 4.3 are written;
                          figures are referenced in 5.1 Summary)

Angge, Elena → Emman (test results must be done before expert evaluation 
                      discussion can be written)

Elena → Mel, Denice (evaluation means must be done before 5.1 and 5.2 
                     can include specific grand mean values)

Emman → Denice (expert evaluation grand mean needed for Objective 4 conclusion)

All Ch4 members → Mel, Denice (Chapter 5 must not be started until Chapter 4 
                               is at minimum 90% complete)
```

---

## Lighter Sections — Denice & Mel Justification

| Member | Assigned Section | Why It's Assigned to Them |
|--------|-----------------|--------------------------|
| **Denice** | 5.2 Conclusions | Template-driven, follows a strict pattern; requires reading Ch1 objectives + Ch4 results but no original analysis |
| **Mel** | 5.1 Summary of Findings | Summarizing — no original writing, no computation, no technical design |
| **Mel** | 5.3 Recommendations | Traceable from limitations list — structured and formulaic |

---

# 7. QUALITY CONTROL CHECKLIST

Run this checklist BEFORE submitting for panel defense. Every item must be ✅.

### Chapter 4 Checklist

- [ ] **Every figure is referenced in text** before the figure appears
- [ ] **Every figure has a caption** in the format: `Figure N. [Name] — [Description]`
- [ ] **Every table has an interpretation paragraph** after it (2–4 sentences minimum)
- [ ] **Observed results in test tables** are specific (name actual system responses — not "it worked")
- [ ] **All weighted means** are rounded to 2 decimal places
- [ ] **All adjectival interpretations** match the Likert scale ranges exactly
- [ ] **Capabilities match features that were actually tested**
- [ ] **Limitations are realistic** — not "the system is imperfect"
- [ ] **No content from Chapter 3 is repeated verbatim** in Chapter 4 (no copy-paste of methodology)
- [ ] **Test table structure** has exactly 5 columns: Module, Scenario, Steps, Observed Result, Status
- [ ] **Evaluation tables** include the exact criterion statements from the survey instruments
- [ ] **Grand Mean table** is present at the end of 4.6 with all groups and characteristics
- [ ] **4.1 Project Description** does not restate Chapter 1 objective numbers (e.g., "Objective 1 is...")
- [ ] **Figure numbers are sequential** — no gaps, no duplicates

### Chapter 5 Checklist

- [ ] **Summary of Findings** contains no new information not in Chapter 4
- [ ] **Summary** mentions the grand mean with proper adjectival interpretation
- [ ] **Each conclusion answers exactly one specific objective** from Chapter 1
- [ ] **Conclusions cite specific data** (mean scores, test statuses) — not generic claims
- [ ] **Recommendations trace directly to limitations** in Section 4.4
- [ ] **No recommendation appears that was not a limitation** in the system
- [ ] **Recommendations are numbered and specific** — not one-word bullets

### Tone and Format Checklist

- [ ] All writing is in formal academic English (no contractions: it's, don't, can't)
- [ ] No first-person singular ("I recommend...") — use "the researchers" or "the study"
- [ ] All tables have proper headers and borders
- [ ] Writing uses past tense for completed actions ("the system successfully logged...")
- [ ] Writing uses present tense for descriptions ("FRAMES consists of four modules...")

---

# 8. COMMON MISTAKES TO AVOID

## ❌ Mistake 1: Writing Generic or Vague Observed Results

| ❌ WRONG | ✅ CORRECT |
|---------|----------|
| "The system worked correctly." | "The kiosk displayed 'Welcome, [Name]!' and logged an ENTRY record in the attendance_logs table with verified_by = FACE." |
| "The gesture was detected." | "The kiosk displayed a prompt to perform the peace sign (✌️), detected the gesture after 3-frame debounce confirmation, and logged action = BREAK_OUT in the attendance_logs table." |
| "It passed the test." | "All steps were completed successfully. No duplicate records or missing entries were found in the database." |

---

## ❌ Mistake 2: Weak Conclusions That Don't Answer Objectives

| ❌ WRONG | ✅ CORRECT |
|---------|----------|
| "The system was found to be effective." | "FRAMES was evaluated as Highly Acceptable with a grand mean of [X.XX], confirming that it meets the quality standards set by the ISO/IEC 25010 model across all five quality characteristics." |
| "The researchers concluded the system is good." | "Based on testing results, FRAMES successfully performed all [N] functional test scenarios with a PASSED status, demonstrating that the system correctly implements attendance logging, gesture-gated confirmation, and anomaly detection as designed." |

---

## ❌ Mistake 3: Recommendations Not Grounded in Limitations

| ❌ WRONG | ✅ CORRECT |
|---------|----------|
| "The system should include AI chatbots." | [Not a limitation → don't recommend it] |
| "Future researchers should make it better." | "Future development may integrate liveness detection via depth cameras to address the current limitation of the gesture-only spoofing prevention mechanism." |

---

## ❌ Mistake 4: Data Inconsistencies (Panel Triggered)

These will cause immediate panel challenges:

| Risk | Prevention |
|------|-----------|
| Mean in 4.6 ≠ mean in 5.1 Summary | Copy means from ONE Excel source only |
| Test scenarios in 4.5 ≠ Chapter 3 test procedures | Use Chapter 3 as the source — do NOT rewrite |
| Module descriptions in 4.2 ≠ objectives in 4.1 | Cross-check both sections before submitting |
| Conclusion references objective 5 but there are only 4 objectives | Recount objectives in Chapter 1 before writing Ch5 |

---

## ❌ Mistake 5: Missing Figure References

Every figure MUST be mentioned by name in the body text before it appears. Panels will specifically check if figures are orphaned.

```
❌ WRONG: [Figure appears with no mention in text above it]

✅ CORRECT: "As illustrated in Figure 8, the Faculty Class Attendance view 
displays a real-time list of all enrolled students along with their current 
attendance status and timestamps for each recorded action."
[Figure 8 appears here]
```

---

## ❌ Mistake 6: Repeating Chapter 3 Verbatim in Chapter 4

Chapter 4 is about RESULTS — not procedures. Do not paste methodology into Chapter 4.

| What belongs in Chapter 3 | What belongs in Chapter 4 |
|--------------------------|--------------------------|
| "The test was conducted by approaching the kiosk..." | "The kiosk successfully recognized the enrolled user and logged an ENTRY record..." |
| "The Likert scale ranges are as follows..." | "The category mean of X.XX was interpreted as Highly Acceptable..." |

---

# 9. FINAL OUTPUT FORMAT

## File Naming Convention

```
chapter4_results_and_discussion.md    ← Chapter 4
chapter5_summary_conclusions.md       ← Chapter 5
figures/                              ← All screenshot files
  Figure_1_login_page.png
  Figure_2_student_account.png
  ...
  Figure_20_mobile_responsive.png
evaluation_data/                      ← Raw data files
  survey_tabulation_CRP.xlsx
  survey_tabulation_NCRP.xlsx
  survey_tabulation_DeptHead.xlsx
  weighted_means_summary.xlsx
```

## Document Format Standards

| Element | Standard |
|---------|---------|
| Heading 1 (Chapter title) | `# Chapter 4` |
| Heading 2 (Main section) | `## 4.1 Project Description` |
| Heading 3 (Sub-section) | `### 4.1.1 Student Module` |
| Figure captions | Bold, italicized, below figure |
| Table labels | Above table: `Table N. [Title]` |
| Paragraph length | 3–6 sentences per paragraph |
| Font (if Word doc) | Times New Roman 12pt, double-spaced |
| Margins (if Word doc) | 1 inch all sides |

## Review Submission Order

```
1. Emman submits 4.1 → Reviewed by Elena
2. Karl submits 4.2 + 4.3 → Reviewed by Angge
3. Angge submits 4.4 + 4.5 (Functional + Performance) → Reviewed by Emman
4. Elena submits 4.5 (Usability, Reliability, Security) + 4.6 (Students) → Reviewed by Karl
5. Emman submits 4.6 (Expert + Grand Mean) → Reviewed by Elena
6. ALL review complete Chapter 4 together
7. Mel submits 5.1 → Reviewed by Emman
8. Denice submits 5.2 → Reviewed by Elena
9. Mel submits 5.3 → Reviewed by Angge
10. ALL final review → Submit to adviser
```

---

*This guide was prepared for internal capstone team use only.*  
*FRAMES Capstone Project | BSIT | College of Science | TUP–Manila | AY 2025–2026*
