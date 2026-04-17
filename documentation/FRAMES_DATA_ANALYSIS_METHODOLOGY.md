# FRAMES Data Analysis Methodology & Respondent Design

## Purpose

This document addresses three critical questions for the FRAMES capstone:
1. Is the current respondent composition (43 total) valid and defensible?
2. Is there a bias concern with faculty respondents?
3. What statistical treatment should be used for the collected data?

---

## 1. Respondent Composition (43 Total)

### Current Breakdown

| Group | Count | Interaction Mode | Rationale |
|-------|-------|-----------------|-----------|
| Students (computer-related program) | 20 | **Live kiosk interaction** in Room 328 | Direct hands-on experience with the full system |
| Students (non-computer-related program) | 20 | **Demonstration video** only | External perspective; avoids tech-familiarity bias; no additional hardware needed |
| Faculty members | 2 | Hands-on + demonstration | 1 capstone course instructor + 1 capstone research adviser |
| Department head | 1 | Demonstration + walkthrough | Sole department head; evaluates department-level module |
| **Total** | **43** | | |

### Is 43 Respondents Enough?

For a **prototype evaluation study** (not a population-representative survey), 43 respondents is **acceptable and standard** for Philippine capstone research. Here is the justification:

1. **ISO/IEC 25010 evaluations in capstone studies** typically use 30–60 respondents with purposive or convenience sampling (not random sampling from a large population).
2. **This is not a statistical inference study.** The goal is to evaluate a working prototype—not to generalize results to all Filipino university students. Descriptive statistics (mean, standard deviation) and frequency distributions are appropriate.
3. **The 20+20 student split** strengthens the study by enabling a **between-group comparison**: students who used the system live vs. students who only watched the demo video. This can reveal whether direct experience significantly affects perceived usability.

### Anchor References for Small-N Prototype Evaluations

If the panel questions the sample size, cite:
- ISO/IEC 25010 does not prescribe a minimum sample size; it defines **quality characteristics** and leaves instrument design to the evaluators.
- Philippine capstone conventions (CHED Memorandum Order No. 20, Series of 2014 for IT programs) require a working prototype and evaluation—not a population study.

---

## 2. Bias Assessment — Are the Faculty Respondents Biased?

### The Concern

Both faculty respondents are connected to the capstone project:
- **Faculty 1:** Capstone course instructor (teaches the capstone class)
- **Faculty 2:** Capstone research adviser (supervises the FRAMES study)

### Honest Assessment: Yes, There Is Potential Bias — But It Is Manageable

The bias risk is **acknowledged, not hidden**. Here is how to handle it:

#### Option A: Acknowledge and Mitigate (Recommended)

In the Scope and Delimitations or Chapter 3 (Methodology), include a statement like:

> "The two faculty respondents—the capstone course instructor and the capstone research adviser—are acknowledged as having prior familiarity with the system's development. This proximity introduces a potential familiarity bias. To mitigate this, both faculty respondents evaluated the system using the same standardized ISO/IEC 25010-based survey instrument administered to all other respondents, without modification or preferential treatment. Their responses are reported alongside, but also separately from, the student responses to allow the reader to assess any scoring differential."

This is a standard academic disclosure. Panels respect transparency over pretending the issue doesn't exist.

#### Option B: Add 1–2 External Faculty (If Still Possible)

If the timeline allows, invite 1–2 faculty members from outside the capstone committee to evaluate the system via a demonstration video and the same survey instrument. This would:
- Increase the faculty respondent count from 2 to 3–4
- Dilute the familiarity bias
- Strengthen the "faculty perspective" data

**However, this is not strictly required for a capstone evaluation.** Most Philippine capstone panels accept 1–2 faculty evaluators, especially when the prototype is a working deployment and not a paper concept.

#### Option C: Separate Faculty Scores in Analysis

Report faculty evaluations **separately** from student evaluations:

| Respondent Group | n | Mean Score | SD |
|---|---|---|---|
| Students (live, computer-related) | 20 | 4.35 | 0.42 |
| Students (video, non-computer-related) | 20 | 4.12 | 0.55 |
| Faculty | 2 | 4.60 | 0.28 |
| Department Head | 1 | 4.50 | — |
| **Overall Weighted Mean** | **43** | **4.27** | **0.47** |

This way the reader (and panel) can see whether faculty scores are suspiciously high compared to student scores. If they are close, the bias concern is effectively neutralized.

### Is 1 Department Head a Problem?

No. There is literally one department head for the Computer Studies Department. This is not a bias issue—it is a structural constraint. The study should state:

> "The department head respondent is the sole occupant of this role within the Computer Studies Department. A single-respondent evaluation is a methodological limitation inherent to the organizational structure, not a sampling choice."

---

## 3. Recommended Statistical Treatment

### 3.1 Type of Data

The ISO/IEC 25010 evaluation uses a **5-point Likert scale** (ordinal data):

| Rating | Interpretation |
|--------|---------------|
| 5 | Strongly Agree / Excellent |
| 4 | Agree / Very Satisfactory |
| 3 | Neutral / Satisfactory |
| 2 | Disagree / Fair |
| 1 | Strongly Disagree / Poor |

### 3.2 Descriptive Statistics (Primary Analysis)

For each ISO/IEC 25010 characteristic (Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, Security):

1. **Weighted Mean** per survey item
2. **Grand Mean** per quality characteristic (average of item means)
3. **Standard Deviation** per quality characteristic
4. **Verbal Interpretation** based on a standard Likert scale interpretation table:

| Mean Range | Verbal Interpretation |
|---|---|
| 4.50 – 5.00 | Strongly Agree / Excellent |
| 3.50 – 4.49 | Agree / Very Satisfactory |
| 2.50 – 3.49 | Neutral / Satisfactory |
| 1.50 – 2.49 | Disagree / Fair |
| 1.00 – 1.49 | Strongly Disagree / Poor |

### 3.3 Group Comparison (Between Live and Video Groups)

Since there are two distinct student groups (20 live + 20 video), compare their evaluation scores to determine if the interaction mode affected their perception:

**Test: Mann-Whitney U Test** (non-parametric, for ordinal Likert data with small samples)

- **Why not a t-test?** Likert-scale data is ordinal, not interval. While some researchers use t-tests on Likert means, the Mann-Whitney U is more defensible for a capstone thesis with ordinal data and n=20 per group.
- **Null hypothesis (H₀):** There is no significant difference in the evaluation scores between students who used the system live and students who viewed the demonstration video.
- **Significance level:** α = 0.05

If the panel prefers parametric tests, a **Welch's t-test** on the mean scores per quality characteristic is also acceptable—just note the ordinal data caveat.

### 3.4 Composite Score Table (For Each Quality Characteristic)

**Example Output Table:**

| Quality Characteristic | Items | Live Students (n=20) Mean | Video Students (n=20) Mean | Faculty (n=2) Mean | Dept. Head (n=1) | Overall Mean | SD | Interpretation |
|---|---|---|---|---|---|---|---|---|
| Functional Suitability | 5 | 4.32 | 4.10 | 4.60 | 4.40 | 4.25 | 0.45 | Very Satisfactory |
| Performance Efficiency | 4 | 4.15 | 3.95 | 4.50 | 4.00 | 4.10 | 0.52 | Very Satisfactory |
| Interaction Capability | 5 | 4.40 | 4.20 | 4.80 | 4.60 | 4.35 | 0.38 | Very Satisfactory |
| Reliability | 4 | 4.25 | 4.05 | 4.50 | 4.50 | 4.20 | 0.44 | Very Satisfactory |
| Security | 3 | 4.10 | 3.90 | 4.33 | 4.33 | 4.07 | 0.50 | Very Satisfactory |
| **Grand Mean** | | | | | | **4.19** | | **Very Satisfactory** |

*(Values above are illustrative placeholders.)*

### 3.5 Overall Assessment Formula

**Grand Weighted Mean:**

$$\bar{X}_{overall} = \frac{\sum_{i=1}^{k} \bar{X}_i}{k}$$

Where:
- $\bar{X}_i$ = mean score for each quality characteristic
- $k$ = number of quality characteristics (5)

### 3.6 Frequency Distribution

For transparency, also present the **frequency and percentage distribution** of responses per rating level for each quality characteristic:

| Rating | Functional Suitability | Performance Efficiency | ... |
|---|---|---|---|
| 5 (Strongly Agree) | 15 (35%) | 12 (28%) | ... |
| 4 (Agree) | 20 (47%) | 18 (42%) | ... |
| 3 (Neutral) | 6 (14%) | 8 (19%) | ... |
| 2 (Disagree) | 2 (5%) | 4 (9%) | ... |
| 1 (Strongly Disagree) | 0 (0%) | 1 (2%) | ... |

### 3.7 Reliability of the Instrument

To demonstrate that the survey instrument produces consistent results, compute **Cronbach's Alpha** for each quality characteristic section:

- α ≥ 0.70 = acceptable internal consistency
- α ≥ 0.80 = good
- α ≥ 0.90 = excellent

This is standard for Likert-based evaluation instruments in Philippine capstone theses.

---

## 4. Recommended Survey Structure

### Section A: Respondent Profile
- Role (Student – Live / Student – Video / Faculty / Department Head)
- Program (for students)
- Year level (for students)

### Section B: ISO/IEC 25010 Evaluation (5-point Likert)

Organize questions by quality characteristic:

**Functional Suitability** (Does the system do what it should?)
- The system accurately logs entry attendance through facial recognition.
- The system correctly records break-out, break-in, and exit through gesture confirmation.
- The kiosk displays appropriate feedback after each attendance action.
- The anomaly notification correctly identifies unrecognized individuals.
- Attendance records on the dashboard match the actions performed at the kiosk.

**Performance Efficiency** (Does it respond quickly enough?)
- The facial recognition response time is acceptably fast for kiosk use.
- The gesture detection responds without noticeable delay.
- The web dashboard loads attendance data in a reasonable time.
- Reports generate without excessive waiting.

**Interaction Capability** (Is it easy to use?)
- The kiosk interface is easy to understand without external instructions.
- The hand gestures required are easy to perform.
- The web dashboard navigation is intuitive.
- Error messages and feedback are clear and helpful.
- The system is accessible to users with minimal technical background.

**Reliability** (Does it work consistently?)
- The system consistently recognizes enrolled users across multiple attempts.
- Attendance logs are recorded without missing entries.
- The system operates without unexpected crashes or errors.
- The auto-exit feature correctly closes sessions at class end time.

**Security** (Is attendance data protected?)
- Only enrolled users can log attendance for themselves.
- The gesture-gated mechanism prevents accidental or unauthorized logging.
- The system appropriately restricts dashboard access based on user role.

### Section C: Open-Ended (Optional)
- What did you find most useful about the system?
- What aspects of the system could be improved?
- Any additional comments or suggestions?

---

## 5. Data Collection Procedure

### For Live Student Group (20 students, computer-related program)
1. Students register faces on the web portal before the pilot day
2. On pilot day, students interact with the kiosk in Room 328 during actual class time
3. Students use the web dashboard to view their attendance records
4. At the end of the session, students fill out the printed or digital survey

### For Video Student Group (20 students, non-computer-related program)
1. Students are shown a 10–15 minute recorded video demonstrating:
   - The kiosk in operation (entry, break-out, break-in, exit)
   - The web dashboard (student view, faculty view, department head view)
   - The report generation feature
2. After the video, students are given time to ask clarifying questions
3. Students fill out the same survey instrument as the live group

### For Faculty (2)
1. Faculty members interact with the faculty module (upload schedule, view attendance, generate reports)
2. A complete demonstration of the system is provided covering all modules
3. Faculty fill out the survey with additional role-specific items if applicable

### For Department Head (1)
1. A hands-on walkthrough of the department head dashboard is conducted
2. Demonstration of department-wide reports and room visualization
3. Department head fills out the survey

---

## 6. Addressing Panel Questions — Quick Reference

| Likely Panel Question | Defense |
|---|---|
| "Is 43 respondents enough?" | This is a prototype evaluation, not a population study. ISO/IEC 25010 does not prescribe sample sizes. 30–60 is the accepted range for Philippine capstone evaluations. |
| "Are the faculty respondents biased?" | Acknowledged in limitations. They used the same standardized instrument. Their scores are reported separately for transparency. |
| "Why only 1 department head?" | Structural constraint—there is one department head. This is disclosed as a limitation. |
| "Why two different student groups?" | To enable comparison between direct users and video-based evaluators, strengthening the evaluation's external validity. |
| "Is the video group's evaluation valid?" | Yes. Demonstration-based evaluation is standard when direct system access is limited. The group provides user perception data, not usability testing data. This distinction is stated. |
| "What statistical test did you use?" | Descriptive statistics (weighted mean, SD) for all groups. Mann-Whitney U test for between-group comparison (live vs. video students). Cronbach's alpha for instrument reliability. |

---

## 7. Summary of Recommended Analysis Steps

1. Administer survey to all 43 respondents
2. Encode responses (spreadsheet or Google Forms auto-tabulation)
3. Compute **Cronbach's Alpha** per section to verify instrument reliability
4. Compute **weighted mean and SD** per item, per quality characteristic, per respondent group
5. Compute **grand mean** per quality characteristic across all respondents
6. Apply **verbal interpretation** scale
7. Run **Mann-Whitney U** test comparing live vs. video student group scores
8. Present results in tables following the format in Section 3.4
9. Discuss findings with reference to ISO/IEC 25010 quality characteristics
10. Note limitations: small faculty sample, single department head, familiarity bias acknowledged

---

**This document should be reviewed by the team before finalizing Chapter 3 (Methodology).**
