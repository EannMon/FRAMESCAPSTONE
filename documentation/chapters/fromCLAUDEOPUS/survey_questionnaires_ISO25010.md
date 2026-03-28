# FRAMES — Post-Deployment Evaluation Survey Questionnaires

## Based on ISO/IEC 25010 Software Quality Model

**System Evaluated:** FRAMES (Facial Recognition and Attendance Monitoring with Embedded System)  
**Evaluation Criteria:** Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, Security  
**Deployment Site:** Room 328, College of Science Building, Computer Studies Department, TUP–Manila  

---

## Letter of Introduction

Dear Respondent,

Greetings!

We are undergraduate students of the **Technological University of the Philippines – Manila (TUP-Manila)**, currently in our final year and pursuing our Bachelor of Science degree in **Information Technology** under the **College of Science**. In partial fulfillment of the requirements for our degree, we are conducting a post-deployment evaluation of our capstone project entitled:

> **FRAMES: Facial Recognition and Attendance Monitoring with Embedded System**

FRAMES is an automated student attendance monitoring system that utilizes real-time facial recognition and gesture-gated logging through a Raspberry Pi-powered kiosk and a web-based dashboard. The system was designed and deployed in Room 328, College of Science Building, Computer Studies Department, TUP-Manila.

As part of our evaluation, we are requesting your assistance in assessing the system's software quality in accordance with the **ISO/IEC 25010 Software Quality Model**. Your honest and thoughtful responses are crucial to our research and will contribute significantly to the validity and completeness of our study.

Rest assured that all information gathered in this survey will be kept strictly **confidential** and will be used solely for **academic research purposes**.

Thank you for your time and cooperation.

Respectfully,

**The FRAMES Capstone Project Group**  
Bachelor of Science in Information Technology  
College of Science, Technological University of the Philippines – Manila  
Academic Year 2025–2026  

---

## Informed Consent Form

### Data Privacy Notice and Consent

In compliance with **Republic Act No. 10173**, otherwise known as the **Data Privacy Act of 2012**, and its Implementing Rules and Regulations, we are obligated to inform you of the following before you proceed with this survey:

#### 1. Purpose of Data Collection
Your responses to this survey questionnaire will be collected and processed exclusively for the purpose of evaluating the software quality of the FRAMES system as part of our undergraduate capstone research. No personal identifying information beyond your program classification and year level is required; all survey responses will be treated as anonymous and aggregated.

#### 2. Nature of Data Collected
- **Survey responses** — Your ratings and open-ended answers regarding the FRAMES system
- **Respondent profile** — Program classification (Computer-Related or Non-Computer-Related) and year level
- **No biometric data** is collected through this survey instrument itself

> **Note on biometric data collected during system use:** If you participated in the hands-on testing of the FRAMES kiosk, your facial image was captured solely for the purpose of generating a facial embedding (a mathematical representation) used for recognition. The raw facial image is **not stored** in the system. Only the embedding is retained for the duration of the evaluation period and will be deleted thereafter. You were separately informed of and consented to this during the face enrollment process.

#### 3. Data Handling and Security
All data collected through this survey will be:
- Stored securely and accessible only to the research team
- Used solely for academic analysis and reporting
- Reported only in aggregated form; individual responses will not be individually identifiable in any publication or presentation

#### 4. Your Rights Under RA 10173
As a data subject, you have the right to:
- **Be informed** — Know how your data is collected, processed, and used (this notice fulfills that obligation)
- **Access** — Request access to any personal data we hold about you
- **Rectification** — Request correction of any inaccurate data
- **Erasure or Blocking** — Request deletion or suspension of processing of your data
- **Withdrawal of Consent** — Withdraw your consent at any time without penalty

#### 5. Voluntary Participation
Your participation in this survey is entirely **voluntary**. You may choose not to answer any question or withdraw from the survey at any time without any adverse consequence.

---

### Consent Acknowledgment

By proceeding with this survey, you acknowledge that:

- [ ] I have read and understood the Data Privacy Notice above.
- [ ] I understand the purpose of this survey and how my responses will be used.
- [ ] I voluntarily agree to participate in this evaluation survey.
- [ ] I understand that I may withdraw my participation at any time.

**Respondent's Signature:** _______________________________  
**Date:** _______________________________  

---

## Rating Scale

All items are rated using a 4-point Likert scale:

| Scale | Adjectival Rating | Range |
|-------|-------------------|-------|
| 4 | Highly Acceptable | 3.4 – 4.0 |
| 3 | Very Acceptable | 2.6 – 3.3 |
| 2 | Acceptable | 1.8 – 2.5 |
| 1 | Not Acceptable | 1.0 – 1.7 |

---

## Survey Questionnaire A1 — For Computer-Related Program (CRP) Students
*(Hands-On System Users)*

**Instructions:** You are receiving this questionnaire because you **directly used** the FRAMES kiosk and web dashboard during the evaluation period. Please rate each statement based on your **personal, hands-on experience** with the system. Check (✓) the box that corresponds to your response.

### Respondent Profile

| Field | Response |
|-------|----------|
| Course/Program | _________________________ |
| Year Level | _________________________ |
| Program Classification | ☐ Computer-Related Program (e.g., BSIT, BSCS, BSIS) |

---

### Part I — Functional Suitability
*The degree to which the system performs the functions that meet stated and implied needs.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 1 | The kiosk accurately recognized my face during attendance logging. | | | | |
| 2 | The system correctly recorded my entry (time-in) when I was recognized. | | | | |
| 3 | The hand gesture for break-out (peace sign) was correctly detected and logged. | | | | |
| 4 | The hand gesture for break-in (thumbs-up) was correctly detected and logged. | | | | |
| 5 | The hand gesture for exit (open palm) was correctly detected and logged. | | | | |
| 6 | My attendance records displayed on the web dashboard were accurate and matched my actual attendance. | | | | |
| 7 | The system properly distinguished between different attendance actions (entry, break-out, break-in, exit). | | | | |
| 8 | The real-time status indicators on the dashboard (e.g., "Inside Classroom," "On Break") correctly reflected my current status. | | | | |

### Part II — Performance Efficiency
*The degree to which the system provides appropriate performance relative to the amount of resources used.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 9 | The system recognized my face within an acceptable time (2 seconds or less). | | | | |
| 10 | The hand gesture recognition responded promptly without noticeable delay. | | | | |
| 11 | The kiosk display updated quickly after recognizing my face and gesture. | | | | |
| 12 | The web dashboard loaded my attendance records without significant waiting time. | | | | |
| 13 | The system operated smoothly without freezing or crashing during my interactions. | | | | |

### Part III — Interaction Capability (Usability)
*The degree to which the system can be understood, learned, used, and is attractive to the user.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 14 | The face enrollment process on the web application was easy to understand and complete. | | | | |
| 15 | The gesture instructions displayed on the kiosk screen were clear and easy to follow. | | | | |
| 16 | The attendance confirmation messages on the kiosk (e.g., "Welcome, [Name]!") were clear and understandable. | | | | |
| 17 | The web dashboard was easy to navigate and I could find my attendance records without difficulty. | | | | |
| 18 | The overall visual design and layout of the web dashboard were professional and appealing. | | | | |
| 19 | The system was easy to use even without prior training or detailed instructions. | | | | |
| 20 | The kiosk provided helpful visual feedback when my face or gesture was not recognized. | | | | |

### Part IV — Reliability
*The degree to which the system performs specified functions under stated conditions for a specified period of time.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 21 | The system consistently recognized my face across multiple attempts throughout the day. | | | | |
| 22 | The hand gesture recognition produced consistent results each time I performed the same gesture. | | | | |
| 23 | My attendance records remained accurate and complete with no missing or duplicate entries. | | | | |
| 24 | The kiosk system operated reliably throughout the testing period without unexpected shutdowns or errors. | | | | |
| 25 | The web dashboard displayed my records accurately every time I accessed it. | | | | |

### Part V — Security
*The degree to which the system protects information and data so that persons or other systems have the appropriate degree of data access.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 26 | I was confident that only my own face could log my attendance (no one else could log in using my identity). | | | | |
| 27 | The system required my deliberate gesture to confirm attendance actions, preventing accidental or unauthorized logging. | | | | |
| 28 | I was assured that only my attendance data were visible to me and not accessible by other students. | | | | |
| 29 | I was informed about how my facial data would be used and consented before enrollment. | | | | |
| 30 | The system flagged unrecognized individuals and prevented unauthorized attendance logging. | | | | |

### Open-Ended Questions (Optional)

31. What did you find most useful or helpful about the FRAMES attendance system?

    _______________________________________________________________________________

32. What difficulties or issues, if any, did you encounter while using the system?

    _______________________________________________________________________________

33. Do you have any suggestions for improving the system?

    _______________________________________________________________________________

---

## Survey Questionnaire A2 — For Non-Computer-Related Program (NCRP) Students
*(Demo/Video Observers)*

**Instructions:** You are receiving this questionnaire because you were shown a **demonstration video** of the FRAMES attendance system. Please rate each statement based on what you **observed** in the demonstration. Check (✓) the box that corresponds to your response.

### Respondent Profile

| Field | Response |
|-------|----------|
| Course/Program | _________________________ |
| Year Level | _________________________ |
| Program Classification | ☐ Non-Computer-Related Program (e.g., BSIE-ICT, BTTE-CP, BSEd, etc.) |

---

### Part I — Functional Suitability
*The degree to which the system performs the functions that meet stated and implied needs.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 1 | Based on the demo, the kiosk accurately recognized the student's face during attendance logging. | | | | |
| 2 | The system correctly recorded the student's entry (time-in) upon successful recognition. | | | | |
| 3 | The hand gesture for break-out (peace sign) was correctly detected and logged by the system. | | | | |
| 4 | The hand gesture for break-in (thumbs-up) was correctly detected and logged by the system. | | | | |
| 5 | The hand gesture for exit (open palm) was correctly detected and logged by the system. | | | | |
| 6 | The attendance records displayed on the web dashboard appeared accurate and consistent with the logged actions. | | | | |
| 7 | The system appeared to properly distinguish between different attendance actions (entry, break-out, break-in, exit). | | | | |
| 8 | The real-time status indicators on the dashboard (e.g., "Inside Classroom," "On Break") appeared to update correctly based on logged actions. | | | | |

### Part II — Performance Efficiency
*The degree to which the system provides appropriate performance relative to the amount of resources used.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 9 | Based on the demo, the system recognized the student's face within an acceptable time (2 seconds or less). | | | | |
| 10 | The hand gesture recognition appeared to respond promptly without noticeable delay. | | | | |
| 11 | The kiosk display appeared to update quickly after recognizing the face and gesture. | | | | |
| 12 | The web dashboard appeared to load attendance records without significant waiting time. | | | | |
| 13 | The system operated smoothly without visible freezing or crashing throughout the demonstration. | | | | |

### Part III — Interaction Capability (Usability)
*The degree to which the system can be understood, learned, used, and is attractive to the user.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 14 | Based on the demo, the face enrollment process on the web application appeared easy to understand and complete. | | | | |
| 15 | The gesture instructions displayed on the kiosk screen were clear and easy to follow, even as an observer. | | | | |
| 16 | The attendance confirmation messages on the kiosk (e.g., "Welcome, [Name]!") were clear and understandable. | | | | |
| 17 | The web dashboard appeared easy to navigate for finding attendance records. | | | | |
| 18 | The overall visual design and layout of the web dashboard were professional and appealing. | | | | |
| 19 | Based on what I observed, the system appears easy to use even without prior training or detailed instructions. | | | | |
| 20 | The kiosk provided clear visual feedback when a face or gesture was not recognized. | | | | |

### Part IV — Reliability
*The degree to which the system performs specified functions under stated conditions for a specified period of time.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 21 | Based on the demo, the system appeared to consistently recognize the student's face across interactions. | | | | |
| 22 | The hand gesture recognition produced consistent results each time the same gesture was performed in the demo. | | | | |
| 23 | The attendance records shown in the demo appeared accurate and complete with no visible errors or duplicates. | | | | |
| 24 | The kiosk operated reliably throughout the demonstration without unexpected shutdowns or errors. | | | | |
| 25 | The web dashboard displayed attendance records consistently and accurately during the demo. | | | | |

### Part V — Security
*The degree to which the system protects information and data so that persons or other systems have the appropriate degree of data access.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 26 | Based on the demo, the facial recognition appears to ensure that only the correct student can log their own attendance. | | | | |
| 27 | The required gesture confirmation appears to effectively prevent accidental or unauthorized attendance logging. | | | | |
| 28 | The system appears to restrict attendance record visibility to individual students only. | | | | |
| 29 | The system appears to have an appropriate process for informing students about facial data use before enrollment. | | | | |
| 30 | The system appeared to flag and prevent attendance logging for unrecognized individuals. | | | | |

### Open-Ended Questions (Optional)

31. Based on the demonstration, what did you find most useful or helpful about the FRAMES attendance system?

    _______________________________________________________________________________

32. Based on your observation, were there any aspects of the system that seemed unclear, confusing, or problematic?

    _______________________________________________________________________________

33. Do you have any suggestions for improving the system?

    _______________________________________________________________________________

---

## Survey Questionnaire B — Expert Evaluation Form (For Department Head)

**Instructions:** As the Department Head of the Computer Studies Department, please evaluate the FRAMES attendance system as a whole based on your hands-on experience and the demonstration video provided. This expert evaluation covers the system's usability and technical quality across all modules (student kiosk, faculty dashboard, and department head dashboard). Check (✓) the box that corresponds to your assessment.

### Part I — Functional Suitability
*The degree to which the system performs the functions that meet stated and implied needs.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 1 | The facial recognition system accurately identified enrolled individuals during attendance logging. | | | | |
| 2 | The gesture-gated logging mechanism (entry, break-out, break-in, exit) functioned correctly and as intended. | | | | |
| 3 | The attendance records generated by the system accurately reflected actual attendance. | | | | |
| 4 | The system provided complete and useful attendance reports appropriate for academic and administrative use. | | | | |
| 5 | The system correctly generated exportable reports (CSV/PDF) suitable for record-keeping. | | | | |
| 6 | The face enrollment process for students was straightforward and produced accurate results. | | | | |
| 7 | The kiosk correctly identified and flagged unauthorized individuals (anomaly detection). | | | | |
| 8 | The faculty verification feature (approving faculty accounts) functioned correctly. | | | | |

### Part II — Performance Efficiency
*The degree to which the system provides appropriate performance relative to the amount of resources used.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 9 | The kiosk recognized users and logged attendance within an acceptable time frame. | | | | |
| 10 | The web dashboard loaded reports and data without significant delay across all modules. | | | | |
| 11 | The system processed multiple student entries/exits in sequence without slowing down or freezing. | | | | |
| 12 | The overall system responsiveness was satisfactory for the scale of deployment. | | | | |

### Part III — Interaction Capability (Usability)
*The degree to which the system can be understood, learned, used, and is attractive to the user.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 13 | The web dashboard interface was intuitive and easy to navigate across all user roles (student, faculty, department head). | | | | |
| 14 | The attendance reports and visualizations (charts, summaries) were clear and informative. | | | | |
| 15 | The system's features were well-organized and logically structured. | | | | |
| 16 | The overall visual design and professional appearance of the system met institutional standards. | | | | |
| 17 | Users (students and faculty) could operate the system with minimal training or technical knowledge. | | | | |
| 18 | The system reduced the time and effort required for attendance management compared to traditional methods. | | | | |

### Part IV — Reliability
*The degree to which the system performs specified functions under stated conditions for a specified period of time.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 19 | The system produced consistent recognition results for the same individuals across multiple interactions. | | | | |
| 20 | Attendance logs were reliably recorded without missing or duplicate entries. | | | | |
| 21 | The kiosk and web dashboard remained operational and stable throughout the testing period. | | | | |
| 22 | The system recovered appropriately from any errors encountered during operation. | | | | |

### Part V — Security
*The degree to which the system protects information and data so that persons or other systems have the appropriate degree of data access.*

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 23 | The multimodal verification (face + gesture) provides adequate protection against proxy attendance. | | | | |
| 24 | Access to data and features was appropriately restricted based on user roles. | | | | |
| 25 | The system's data handling practices (embedding-only storage, consent-based enrollment) align with data privacy standards. | | | | |
| 26 | The system adequately protects student and faculty biometric data. | | | | |

### Part VI — Overall Expert Assessment

| No. | Statement | 4 | 3 | 2 | 1 |
|-----|-----------|---|---|---|---|
| 27 | The system is suitable for deployment in an academic setting for automated attendance monitoring. | | | | |
| 28 | The system demonstrates a viable improvement over traditional attendance management methods. | | | | |

### Open-Ended Questions

29. What are the system's strongest qualities from a usability and technical standpoint?

    _______________________________________________________________________________

30. What areas of the system require the most improvement?

    _______________________________________________________________________________

31. Do you have any recommendations for future development or scalability of the system?

    _______________________________________________________________________________

---

## Data Analysis Method

All survey responses shall be tabulated and analyzed using the following:

1. **Weighted Mean (WM)** — The weighted mean for each item is computed as:

   WM = Σ (f × w) / N

   Where:
   - f = frequency of each rating
   - w = weight of the rating (1, 2, 3, or 4)
   - N = total number of respondents

2. **Category Mean** — The mean of all weighted means within each ISO/IEC 25010 quality characteristic (e.g., all items under Functional Suitability).

3. **Grand Mean** — The overall mean across all five quality characteristics, representing the system's overall acceptability.

4. **Comparative Analysis** — The weighted means and category means are computed separately for:
   - **Computer-Related Program (CRP) Students** — Students enrolled in programs such as BSIT, BSCS, BSIS, and similar computing-focused programs.
   - **Non-Computer-Related Program (NCRP) Students** — Students enrolled in programs outside computing (e.g., BSIE-ICT, BTTE-CP, BSEd, and other non-computing programs).

   This comparison determines whether technical background significantly influences user perception of the system's quality.

5. **Adjectival Interpretation** — Each mean score is interpreted using the Likert scale:

   | Range | Interpretation |
   |-------|----------------|
   | 3.4 – 4.0 | Highly Acceptable |
   | 2.6 – 3.3 | Very Acceptable |
   | 1.8 – 2.5 | Acceptable |
   | 1.0 – 1.7 | Not Acceptable |

6. **Expert Evaluation Summary** — The Department Head's responses are tabulated and analyzed separately as an expert evaluation. The weighted mean per quality characteristic is computed and interpreted using the same adjectival scale.

---

## Respondent Summary

| Respondent Group | Count | Survey Instrument | Evaluation Method |
|------------------|-------|-------------------|-------------------|
| Students — CRP | ~25 | Survey Questionnaire A1 | Hands-on system use + survey |
| Students — NCRP | ~25 | Survey Questionnaire A2 | Demo/video observation + survey |
| Department Head | 1 | Survey Questionnaire B (Expert Evaluation) | Hands-on system use + demo video + expert evaluation form |

> **Note:** CRP (Computer-Related Program) students directly used the FRAMES kiosk and web dashboard and are evaluated using **Survey A1**, which uses first-person experience-based statements. NCRP (Non-Computer-Related Program) students observed a demonstration video of the system and are evaluated using **Survey A2**, which uses observation-based statements. Responses from both student groups are tabulated and analyzed individually and comparatively by program classification. The Department Head evaluates the entire system across all user role modules through the Expert Evaluation Form (**Survey B**).

