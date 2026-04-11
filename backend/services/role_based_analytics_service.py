"""
Role-Based Attendance Analytics Service
Generates explainable behavioral insights for Student, Faculty, and Department Head contexts.
"""

from typing import Dict, List, Optional


def _to_behavior_ratio(percent: float) -> str:
    """Translate a percent into analyst-style ratio language."""
    if percent <= 0:
        return "no meaningful incidence"
    missed_share = round(percent / 100.0, 2)
    if missed_share >= 1:
        return "nearly all observed sessions"
    if missed_share == 0:
        return "minimal incidence"
    one_in = max(1, round(1 / missed_share))
    return f"about one in {one_in} observations"


def _confidence_reason(confidence: str, completeness: Optional[float], session_count: Optional[int]) -> str:
    parts: List[str] = []
    if completeness is not None:
        parts.append(f"data completeness is {completeness:.1f}%")
    if session_count is not None:
        parts.append(f"window includes {session_count} conducted sessions")
    if not parts:
        return f"Confidence is {confidence} based on available signal quality."
    return f"Confidence is {confidence} because " + " and ".join(parts) + "."


def _make_insight(
    code: str,
    title: str,
    analysis: str,
    evidence: Dict,
    implication: str,
    confidence: str,
    confidence_reason: str,
) -> Dict:
    return {
        "insight_code": code,
        "title": title,
        "analysis": analysis,
        "evidence": evidence,
        "implication": implication,
        "confidence": confidence,
        "confidence_reason": confidence_reason,
        # Backward-compatible key for existing frontend rendering.
        "narrative": analysis,
    }


def generate_student_role_insights(
    metrics: Dict[str, float],
    report_code: Optional[str] = None,
    previous_window_metrics: Optional[Dict[str, float]] = None,
    scope_label: str = None,
) -> List[Dict]:
    insights: List[Dict] = []
    scope_phrase = f"[{scope_label}] " if scope_label else ""

    attendance_rate = float(metrics.get("real_time_attendance_rate", 0.0))
    punctuality_rate = float(metrics.get("punctuality_rate", 0.0))
    consistency = float(metrics.get("consistency_index", 0.0))
    late_frequency = float(metrics.get("late_frequency", 0.0))
    early_exit_rate = float(metrics.get("early_exit_rate", 0.0))
    break_compliance_rate = float(metrics.get("break_compliance_rate", 100.0))
    average_break_minutes = float(metrics.get("average_break_minutes", 0.0))
    extended_break_count = int(metrics.get("extended_break_count", 0))
    completeness = float(metrics.get("data_completeness_score", 0.0))
    session_count = int(metrics.get("session_count_for_confidence", 0))

    confidence = "HIGH" if session_count >= 20 and completeness >= 95 else ("MEDIUM" if session_count >= 8 and completeness >= 85 else "LOW")
    confidence_msg = _confidence_reason(confidence, completeness, session_count)
    report_code_upper = (report_code or "").upper()

    if report_code_upper == "LATE_REPORT":
        return [
            _make_insight(
                "STUDENT_LATE_REPORT_FREQUENCY",
                f"Late Arrival Frequency ({scope_label})" if scope_label else "Late Arrival Frequency",
                (
                    f"{scope_phrase}Late entries account for {late_frequency:.1f}% of recorded entries in this window "
                    f"({int(metrics.get('late_entries', 0))} late out of {int(metrics.get('total_entries', 0))} entries)."
                ),
                {
                    "late_entries": int(metrics.get("late_entries", 0)),
                    "total_entries": int(metrics.get("total_entries", 0)),
                    "late_frequency": late_frequency,
                },
                "This report isolates punctuality risk and should be read independently from attendance volume.",
                confidence,
                confidence_msg,
            ),
            _make_insight(
                "STUDENT_LATE_REPORT_IMPACT",
                "Late Arrival Risk Impact",
                (
                    f"Punctuality rate is {punctuality_rate:.1f}%, indicating "
                    f"{'controlled lateness risk' if punctuality_rate >= 85 else 'noticeable start-of-class disruption risk'} in this selected scope."
                ),
                {
                    "punctuality_rate": punctuality_rate,
                    "on_time_entries": int(metrics.get("on_time_entries", 0)),
                    "late_entries": int(metrics.get("late_entries", 0)),
                },
                "Use this to prioritize arrival-discipline interventions per subject or overall scope.",
                confidence,
                confidence_msg,
            ),
        ]

    if report_code_upper == "BREAK_LOG":
        return [
            _make_insight(
                "STUDENT_BREAK_REPORT_DURATION",
                f"Break Duration Pattern ({scope_label})" if scope_label else "Break Duration Pattern",
                (
                    f"{scope_phrase}Average break duration is {average_break_minutes:.1f} minutes with "
                    f"{extended_break_count} extended-break events in the selected window."
                ),
                {
                    "average_break_minutes": average_break_minutes,
                    "extended_break_count": extended_break_count,
                    "total_break_minutes": float(metrics.get("total_break_minutes", 0.0)),
                },
                "This report focuses on in-session break discipline and return behavior.",
                confidence,
                confidence_msg,
            ),
            _make_insight(
                "STUDENT_BREAK_REPORT_COMPLIANCE",
                "Break Compliance Risk",
                (
                    f"Break compliance is {break_compliance_rate:.1f}% which indicates "
                    f"{'stable break behavior' if break_compliance_rate >= 85 else 'possible break-overrun risk'} for monitored sessions."
                ),
                {
                    "break_compliance_rate": break_compliance_rate,
                    "extended_break_count": extended_break_count,
                },
                "Use this report to distinguish break behavior issues from attendance/punctuality issues.",
                confidence,
                confidence_msg,
            ),
        ]

    if report_code_upper == "ABSENT_LOG":
        attended_sessions = int(metrics.get("sessions_attended", 0))
        conducted_sessions = int(metrics.get("sessions_conducted", 0))
        expected_sessions = int(metrics.get("expected_sessions", 0))
        derived_absences = max(conducted_sessions - attended_sessions, 0)
        return [
            _make_insight(
                "STUDENT_ABSENT_REPORT_VOLUME",
                f"Absence Volume ({scope_label})" if scope_label else "Absence Volume",
                (
                    f"{scope_phrase}Derived absences are {derived_absences} based on conducted vs attended sessions "
                    f"({conducted_sessions} conducted, {attended_sessions} attended)."
                ),
                {
                    "derived_absences": derived_absences,
                    "sessions_conducted": conducted_sessions,
                    "sessions_attended": attended_sessions,
                },
                "This report isolates missed conducted sessions only, independent of late/break behavior.",
                confidence,
                confidence_msg,
            ),
            _make_insight(
                "STUDENT_ABSENT_REPORT_EXPOSURE",
                "Schedule Exposure Gap",
                (
                    f"Expected sessions are {expected_sessions}; attendance covered {attended_sessions}. "
                    f"This reflects semester coverage pressure in the selected scope."
                ),
                {
                    "expected_sessions": expected_sessions,
                    "sessions_attended": attended_sessions,
                },
                "Use absence logs to target continuity risk, not punctuality or break timing.",
                confidence,
                confidence_msg,
            ),
        ]

    reliability_band = "strong" if attendance_rate >= 95 else ("moderate" if attendance_rate >= 85 else "weak")
    missed_pct = max(0.0, 100.0 - attendance_rate)
    insights.append(
        _make_insight(
            "STUDENT_ATTENDANCE_RELIABILITY",
            f"Attendance Reliability Profile ({scope_label})" if scope_label else "Attendance Reliability Profile",
            (
                f"{scope_phrase}Attendance reliability is {reliability_band} in this window. "
                f"At current behavior, { _to_behavior_ratio(missed_pct) } are being missed, which indicates {'stable engagement' if attendance_rate >= 90 else 'visible continuity risk'} over scheduled participation."
            ),
            {
                "real_time_attendance_rate": attendance_rate,
                "sessions_attended": metrics.get("sessions_attended", 0),
                "sessions_conducted": metrics.get("sessions_conducted", 0),
            },
            f"This reflects whether the student can sustain regular participation without intervention. Scope: {scope_label or 'All Subjects'}.",
            confidence,
            confidence_msg,
        )
    )

    punctuality_state = "healthy" if late_frequency < 15 else ("watchlist" if late_frequency < 30 else "critical")
    insights.append(
        _make_insight(
            "STUDENT_PUNCTUALITY_PATTERN",
            f"Punctuality Habit Pattern ({scope_label})" if scope_label else "Punctuality Habit Pattern",
            (
                f"{scope_phrase}Punctuality behavior is currently {punctuality_state}. "
                f"Late arrivals represent { _to_behavior_ratio(late_frequency) } of attended entries, suggesting {'good time discipline' if punctuality_state == 'healthy' else 'repeated time-friction before class start'} even when attendance is present."
            ),
            {
                "punctuality_rate": punctuality_rate,
                "late_frequency": late_frequency,
                "late_entries": metrics.get("late_entries", 0),
                "on_time_entries": metrics.get("on_time_entries", 0),
            },
            f"Persistent lateness can erode instructional continuity despite acceptable attendance totals. Scope: {scope_label or 'All Subjects'}.",
            confidence,
            confidence_msg,
        )
    )

    consistency_state = "stable" if consistency >= 75 else ("fluctuating" if consistency >= 60 else "unstable")
    insights.append(
        _make_insight(
            "STUDENT_CONSISTENCY_SIGNAL",
            f"Consistency and Behavioral Stability ({scope_label})" if scope_label else "Consistency and Behavioral Stability",
            (
                f"{scope_phrase}Consistency is {consistency_state} across the selected window. "
                f"The attendance-punctuality blend suggests {'repeatable habits' if consistency >= 75 else 'uneven attendance timing and participation rhythm'} that can impact long-term reliability."
            ),
            {
                "consistency_index": consistency,
                "real_time_attendance_rate": attendance_rate,
                "punctuality_rate": punctuality_rate,
            },
            f"Lower consistency increases forecasting risk for future absences and punctuality drift. Scope: {scope_label or 'All Subjects'}.",
            confidence,
            confidence_msg,
        )
    )

    insights.append(
        _make_insight(
            "STUDENT_EXIT_BEHAVIOR",
            "Session Completion Behavior",
            (
                f"Early-exit behavior shows { _to_behavior_ratio(early_exit_rate) } of exits happening before normal completion. "
                f"This indicates {'strong full-session participation' if early_exit_rate < 10 else 'possible engagement drop before session closure'} regardless of entry attendance."
            ),
            {
                "early_exit_rate": early_exit_rate,
                "early_exits": metrics.get("early_exits", 0),
                "total_exits": metrics.get("total_exits", 0),
            },
            "Frequent early exits weaken effective learning time even when attendance appears acceptable.",
            confidence,
            confidence_msg,
        )
    )

    break_state = "compliant" if break_compliance_rate >= 85 and extended_break_count < 3 else "risk-pattern"
    insights.append(
        _make_insight(
            "STUDENT_BREAK_COMPLIANCE",
            "Break Discipline Signal",
            (
                f"Break behavior is {break_state} in the selected period. "
                f"Average break length is {average_break_minutes:.1f} minutes with {extended_break_count} extended-break events, indicating {'healthy return-to-class behavior' if break_state == 'compliant' else 'possible break-abuse tendency'} during active sessions."
            ),
            {
                "break_compliance_rate": break_compliance_rate,
                "average_break_minutes": average_break_minutes,
                "extended_break_count": extended_break_count,
            },
            "Break noncompliance can directly reduce in-class engagement and participation reliability.",
            confidence,
            confidence_msg,
        )
    )

    if previous_window_metrics:
        prev_att = float(previous_window_metrics.get("real_time_attendance_rate", 0.0))
        prev_punc = float(previous_window_metrics.get("punctuality_rate", 0.0))
        att_delta = round(attendance_rate - prev_att, 1)
        punc_delta = round(punctuality_rate - prev_punc, 1)
        trend_state = "improving" if att_delta > 3 and punc_delta >= 0 else ("declining" if att_delta < -3 or punc_delta < -3 else "stable")

        insights.append(
            _make_insight(
                "STUDENT_TREND_COMPARISON",
                "Previous-Window Trend Direction",
                (
                    f"Behavior trend is {trend_state} compared with the previous equivalent period. "
                    f"Attendance changed by {att_delta:+.1f} points and punctuality changed by {punc_delta:+.1f}, showing {'positive momentum' if trend_state == 'improving' else 'emerging deterioration risk' if trend_state == 'declining' else 'flat trajectory without strong movement'} in participation discipline."
                ),
                {
                    "attendance_delta": att_delta,
                    "punctuality_delta": punc_delta,
                    "previous_window_attendance_rate": prev_att,
                    "previous_window_punctuality_rate": prev_punc,
                },
                "Trend direction is the strongest short-term indicator of whether interventions are needed now.",
                confidence,
                confidence_msg,
            )
        )

    # Recognition quality insight (uses confidence_score + verified_by from metrics)
    avg_conf = float(metrics.get("avg_confidence_score", 0.0))
    high_conf_pct = float(metrics.get("high_confidence_pct", 0.0))
    face_verified = int(metrics.get("face_verified_count", 0))
    manual_overrides = int(metrics.get("manual_override_count", 0))
    recognition_quality = float(metrics.get("recognition_quality_rate", 0.0))

    if avg_conf > 0 or face_verified > 0:
        quality_state = "high" if high_conf_pct >= 85 else ("moderate" if high_conf_pct >= 60 else "low")
        insights.append(
            _make_insight(
                "STUDENT_RECOGNITION_QUALITY",
                "Facial Recognition Quality",
                (
                    f"Recognition quality is {quality_state} with a {avg_conf:.0%} average confidence score. "
                    f"{high_conf_pct:.0f}% of entries achieved high-confidence face matching (≥85%). "
                    f"{'All entries used automated face verification.' if manual_overrides == 0 else f'{manual_overrides} entries required manual override, which may indicate lighting or positioning issues.'}"
                ),
                {
                    "avg_confidence_score": avg_conf,
                    "high_confidence_pct": high_conf_pct,
                    "face_verified_count": face_verified,
                    "manual_override_count": manual_overrides,
                    "recognition_quality_rate": recognition_quality,
                },
                "Low recognition quality can indicate enrollment photo issues or environmental interference at the kiosk.",
                confidence,
                confidence_msg,
            )
        )

    insights.append(
        _make_insight(
            "STUDENT_EVIDENCE_STRENGTH",
            "Evidence Strength and Reliability",
            (
                f"This interpretation is based on {session_count} conducted sessions and {completeness:.1f}% data completeness. "
                f"The result is {'highly reliable for immediate behavior decisions' if confidence == 'HIGH' else 'moderately reliable and should be validated in the next window' if confidence == 'MEDIUM' else 'directional only, with conclusions that may shift as more sessions accumulate'} for intervention planning."
            ),
            {
                "session_count_for_confidence": session_count,
                "data_completeness_score": completeness,
            },
            "Confidence-aware interpretation prevents overreacting to short-window noise.",
            confidence,
            confidence_msg,
        )
    )

    return insights[:10]


def _row_status_rate(rows: List[Dict], tokens: List[str]) -> float:
    if not rows:
        return 0.0
    matched = 0
    token_set = [token.lower() for token in tokens]
    for row in rows:
        status = str(row.get("status", "")).lower()
        if any(token in status for token in token_set):
            matched += 1
    return round((matched / len(rows)) * 100, 1)


def _select_faculty_insights_for_report(insights: List[Dict], report_code: Optional[str]) -> List[Dict]:
    if not report_code:
        return insights[:10]

    code = report_code.upper()
    keep_map = {
        "CLASS_LATE": {"FACULTY_PUNCTUALITY_CLUSTER", "FACULTY_RISK_CONCENTRATION_SIGNAL", "FACULTY_DATA_SUFFICIENCY", "FACULTY_STUDENT_RANKING_SUMMARY"},
        "PUNCTUALITY_INDEX": {"FACULTY_PUNCTUALITY_CLUSTER", "FACULTY_DATA_SUFFICIENCY", "FACULTY_SECTION_COMPARISON", "FACULTY_STUDENT_RANKING_SUMMARY", "FACULTY_SECTION_RANKING_DEPTH"},
        "BREAK_DURATION": {"FACULTY_ANOMALY_RISK_CLUSTER", "FACULTY_ENGAGEMENT_COMPLETION", "FACULTY_DATA_SUFFICIENCY"},
        "BREAK_ABUSE": {"FACULTY_ANOMALY_RISK_CLUSTER", "FACULTY_ENGAGEMENT_COMPLETION", "FACULTY_DATA_SUFFICIENCY"},
        "ATTENDANCE_INCONSISTENCY": {"FACULTY_ANOMALY_RISK_CLUSTER", "FACULTY_RISK_CONCENTRATION_SIGNAL", "FACULTY_DATA_SUFFICIENCY"},
        "EARLY_EXITS": {"FACULTY_ENGAGEMENT_COMPLETION", "FACULTY_RISK_CONCENTRATION_SIGNAL", "FACULTY_DATA_SUFFICIENCY"},
        "PERSONAL_CONSISTENCY": {"FACULTY_PARTICIPATION_DISTRIBUTION", "FACULTY_RISK_CONCENTRATION_SIGNAL", "FACULTY_DATA_SUFFICIENCY"},
        "INSTRUCTOR_DELAY": {"FACULTY_PUNCTUALITY_CLUSTER", "FACULTY_DATA_SUFFICIENCY"},
        "UNRECOGNIZED_LOGS": {"FACULTY_ANOMALY_RISK_CLUSTER", "FACULTY_DATA_SUFFICIENCY"},
        "CLASS_WEEKLY": {"FACULTY_PARTICIPATION_DISTRIBUTION", "FACULTY_PUNCTUALITY_CLUSTER", "FACULTY_SECTION_COMPARISON", "FACULTY_STUDENT_RANKING_SUMMARY", "FACULTY_SECTION_RANKING_DEPTH", "FACULTY_DATA_SUFFICIENCY"},
        "CLASS_MONTHLY": {"FACULTY_PARTICIPATION_DISTRIBUTION", "FACULTY_PUNCTUALITY_CLUSTER", "FACULTY_SECTION_COMPARISON", "FACULTY_STUDENT_RANKING_SUMMARY", "FACULTY_SECTION_RANKING_DEPTH", "FACULTY_DATA_SUFFICIENCY"},
        "CLASS_SEMESTER": {"FACULTY_PARTICIPATION_DISTRIBUTION", "FACULTY_PUNCTUALITY_CLUSTER", "FACULTY_SECTION_COMPARISON", "FACULTY_STUDENT_RANKING_SUMMARY", "FACULTY_SECTION_RANKING_DEPTH", "FACULTY_DATA_SUFFICIENCY"},
        "PARTICIPATION_INSIGHT": {"FACULTY_PARTICIPATION_DISTRIBUTION", "FACULTY_SECTION_COMPARISON", "FACULTY_STUDENT_RANKING_SUMMARY", "FACULTY_SECTION_RANKING_DEPTH", "FACULTY_DATA_SUFFICIENCY"},
    }

    keep = keep_map.get(code)
    if not keep:
        return insights[:10]

    filtered = [insight for insight in insights if insight.get("insight_code") in keep]
    return filtered[:10] if filtered else insights[:3]


def _select_department_insights_for_report(insights: List[Dict], report_code: Optional[str]) -> List[Dict]:
    if not report_code:
        return insights[:10]

    code = report_code.upper()
    facility_reports = {"ROOM_OCCUPANCY", "PEAK_USAGE", "ROOM_UTILIZATION", "OVERCROWDING"}
    faculty_reports = {"FACULTY_SUMMARY", "FACULTY_LATE", "FACULTY_CONSISTENCY", "FACULTY_ATTENDANCE_RATE", "FACULTY_ABSENCE", "FACULTY_PUNCTUALITY", "FACULTY_TEACHING_LOAD", "DEPT_ACTIVITY"}

    facility_codes = {
        "DEPT_CAPACITY_PRESSURE",
        "DEPT_UTILIZATION_EFFICIENCY",
        "DEPT_PEAK_LOAD_CONCENTRATION",
        "DEPT_SYSTEMIC_RISK_BALANCE",
        "DEPT_EVIDENCE_STRENGTH",
    }
    faculty_codes = {
        "DEPT_OPERATIONAL_HEALTH",
        "DEPT_SYSTEMIC_RISK_BALANCE",
        "DEPT_EVIDENCE_STRENGTH",
    }

    if code in facility_reports:
        filtered = [insight for insight in insights if insight.get("insight_code") in facility_codes]
        return filtered[:10] if filtered else insights[:3]

    if code in faculty_reports:
        filtered = [insight for insight in insights if insight.get("insight_code") in faculty_codes]
        return filtered[:10] if filtered else insights[:3]

    return insights[:10]


def generate_faculty_role_insights(
    rows: List[Dict],
    summary_metrics: Optional[List[Dict]] = None,
    report_code: Optional[str] = None,
    faculty_metrics: Optional[Dict] = None,
) -> List[Dict]:
    summary_metrics = summary_metrics or []
    total_rows = len(rows)
    late_rate = _row_status_rate(rows, ["late"])
    risk_rate = _row_status_rate(rows, ["risk", "warning", "inconsistent", "no return", "overcrowd"])
    positive_rate = _row_status_rate(rows, ["good", "excellent", "present", "active", "on time"])

    # Use computed metrics for confidence when available
    if faculty_metrics:
        session_count = faculty_metrics.get("session_count_for_confidence", total_rows)
        completeness = faculty_metrics.get("data_completeness_score", 0.0)
        if session_count >= 20 and completeness >= 95:
            confidence = "HIGH"
        elif session_count >= 8 and completeness >= 85:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"
    else:
        confidence = "HIGH" if total_rows >= 40 else ("MEDIUM" if total_rows >= 15 else "LOW")
    confidence_msg = _confidence_reason(confidence, None, total_rows)

    insights: List[Dict] = [
        _make_insight(
            "FACULTY_PARTICIPATION_DISTRIBUTION",
            "Class Participation Stability",
            (
                f"Participation distribution indicates {'stable class engagement' if positive_rate >= 65 else 'mixed-to-fragile engagement quality'} across the observed records. "
                f"Positive-status records make up {positive_rate:.1f}% while risk-tagged records account for {risk_rate:.1f}%, signaling {'manageable variance' if risk_rate < 20 else 'non-trivial attendance risk concentration'} in classroom participation behavior."
            ),
            {"total_rows": total_rows, "positive_rate": positive_rate, "risk_rate": risk_rate},
            "This guides whether intervention should be broad (whole class) or targeted (specific risk clusters).",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "FACULTY_PUNCTUALITY_CLUSTER",
            "Punctuality Distribution Risk",
            (
                f"Late-pattern density is {late_rate:.1f}% of class records, equivalent to { _to_behavior_ratio(late_rate) } showing delayed starts or arrivals. "
                f"This implies {'healthy classroom time adherence' if late_rate < 15 else 'measurable punctuality friction affecting session flow'} across the analyzed window."
            ),
            {"late_rate": late_rate, "total_rows": total_rows},
            "Higher late-density can reduce instructional continuity and compress effective teaching time.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "FACULTY_ANOMALY_RISK_CLUSTER",
            "Behavioral Anomaly Concentration",
            (
                f"Anomaly-like statuses (inconsistency, no-return break, risk flags) represent {risk_rate:.1f}% of records. "
                f"This indicates {'low anomaly pressure' if risk_rate < 20 else 'repeated edge-case behavior that may escalate without targeted follow-up'} among participating students."
            ),
            {"risk_rate": risk_rate, "total_rows": total_rows},
            "Anomaly clusters are early warning signals for deeper attendance disengagement.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "FACULTY_ENGAGEMENT_COMPLETION",
            "Session Completion and Exit Discipline",
            (
                f"Risk-tag density implies { _to_behavior_ratio(risk_rate) } with potential session-friction signals such as inconsistency and no-return breaks. "
                f"This indicates {'healthy completion discipline overall' if risk_rate < 15 else 'measurable completion leakage that can reduce effective class-time quality'} within the observed period."
            ),
            {"risk_rate": risk_rate, "total_rows": total_rows},
            "Completion leakage reduces effective engagement even when initial attendance appears acceptable.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "FACULTY_RISK_CONCENTRATION_SIGNAL",
            "Risk Concentration Signal",
            (
                f"Combined risk and late pressure reaches {min(100.0, round((risk_rate + late_rate) / 2.0, 1)):.1f}% on average. "
                f"This suggests {'isolated issues likely manageable by targeted coaching' if risk_rate < 20 and late_rate < 20 else 'clustered class-risk behavior that may need explicit intervention strategy'} rather than passive monitoring alone."
            ),
            {"late_rate": late_rate, "risk_rate": risk_rate},
            "When risk and lateness co-occur, classroom flow and participation reliability usually deteriorate together.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "FACULTY_DATA_SUFFICIENCY",
            "Evidence Reliability for Decision-Making",
            (
                f"The current decision signal is based on {total_rows} report rows. "
                f"This provides {'highly reliable coverage for intervention planning' if confidence == 'HIGH' else 'moderate reliability and should be paired with next-window validation' if confidence == 'MEDIUM' else 'directional guidance only due sparse evidence'} for behavioral conclusions."
            ),
            {"row_count": total_rows, "confidence": confidence},
            "Confidence-aware decisions prevent overreaction to short-window noise.",
            confidence,
            confidence_msg,
        ),
    ]

    scored_rows = []
    for row in rows:
        score_value = row.get("score_numeric")
        if score_value is None:
            continue
        try:
            numeric_score = float(score_value)
        except (TypeError, ValueError):
            continue

        section_name = str(row.get("section") or "UNASSIGNED").strip() or "UNASSIGNED"
        student_name = str(row.get("student_name") or row.get("col1") or "Unknown Student").strip() or "Unknown Student"
        scored_rows.append(
            {
                "student_name": student_name,
                "section": section_name,
                "score": numeric_score,
                "rank_overall": row.get("rank_overall"),
                "rank_in_section": row.get("rank_in_section"),
            }
        )

    if scored_rows:
        section_totals: Dict[str, Dict[str, float]] = {}
        for item in scored_rows:
            bucket = section_totals.setdefault(item["section"], {"sum": 0.0, "count": 0})
            bucket["sum"] += item["score"]
            bucket["count"] += 1

        section_rows = []
        for section_name, values in section_totals.items():
            avg_score = round(values["sum"] / max(values["count"], 1), 1)
            section_rows.append(
                {
                    "section": section_name,
                    "avg_score": avg_score,
                    "count": int(values["count"]),
                }
            )

        section_rows.sort(key=lambda item: item["avg_score"], reverse=True)

        previous_avg = None
        dense_rank = 0
        tied_sections = 0
        for item in section_rows:
            if previous_avg is None or item["avg_score"] != previous_avg:
                dense_rank += 1
            else:
                tied_sections += 1
            item["dense_rank"] = dense_rank
            previous_avg = item["avg_score"]

        top_section = section_rows[0]
        low_section = section_rows[-1]
        gap = round(top_section["avg_score"] - low_section["avg_score"], 1)

        insights.append(
            _make_insight(
                "FACULTY_SECTION_COMPARISON",
                "Section Comparison and Ranking",
                (
                    f"Section comparison shows {len(section_rows)} section groups with dense ranking applied for tie handling. "
                    f"Top section is {top_section['section']} ({top_section['avg_score']:.1f}) and lowest is {low_section['section']} ({low_section['avg_score']:.1f}), "
                    f"with a spread of {gap:.1f} points{'; ties detected across section ranks' if tied_sections > 0 else ''}."
                ),
                {
                    "section_count": len(section_rows),
                    "top_section": top_section,
                    "lowest_section": low_section,
                    "score_gap": gap,
                    "tied_section_ranks": tied_sections,
                },
                "Use this to prioritize section-level coaching and identify where support should be concentrated first.",
                confidence,
                confidence_msg,
            )
        )

        scored_rows.sort(key=lambda item: item["score"], reverse=True)
        top_students = scored_rows[:3]
        if top_students:
            tied_top = sum(1 for student in scored_rows if student["score"] == top_students[0]["score"]) - 1
            top_student_labels = [
                f"{student['student_name']} ({student['section']}) {student['score']:.1f}"
                for student in top_students
            ]
            insights.append(
                _make_insight(
                    "FACULTY_STUDENT_RANKING_SUMMARY",
                    "Student Ranking Snapshot",
                    (
                        f"Top-ranked students by score are {', '.join(top_student_labels)}. "
                        f"Ranking uses dense tie rules so students with equal scores share the same rank{'; tie at the top is present' if tied_top > 0 else ''}."
                    ),
                    {
                        "top_students": top_students,
                        "top_rank_tie_count": max(tied_top, 0),
                        "scored_student_count": len(scored_rows),
                    },
                    "Use this as a high-level rank board, then validate with section-level ranking details for fairness and intervention planning.",
                    confidence,
                    confidence_msg,
                )
            )

        section_top_samples = []
        for section_name in sorted(section_totals.keys()):
            section_students = [student for student in scored_rows if student["section"] == section_name]
            section_students.sort(key=lambda item: item["score"], reverse=True)
            if not section_students:
                continue
            top_score = section_students[0]["score"]
            tied_students = [student for student in section_students if student["score"] == top_score]
            section_top_samples.append(
                {
                    "section": section_name,
                    "top_score": top_score,
                    "top_students": [student["student_name"] for student in tied_students],
                    "student_count": len(section_students),
                }
            )

        if section_top_samples:
            summarized_sections = ", ".join(
                [
                    f"{sample['section']}: {sample['top_students'][0]} ({sample['top_score']:.1f})"
                    for sample in section_top_samples[:3]
                ]
            )
            tie_sections = sum(1 for sample in section_top_samples if len(sample["top_students"]) > 1)
            insights.append(
                _make_insight(
                    "FACULTY_SECTION_RANKING_DEPTH",
                    "Within-Section Student Ranking",
                    (
                        f"Within-section ranking leaders include {summarized_sections}. "
                        f"Dense ranking keeps ties at equal rank and {'multiple sections currently show tied top students' if tie_sections > 0 else 'current top positions are mostly distinct'}."
                    ),
                    {
                        "section_top_samples": section_top_samples,
                        "sections_with_top_ties": tie_sections,
                    },
                    "Use this to compare students inside each section before applying cross-section interventions.",
                    confidence,
                    confidence_msg,
                )
            )

    # Filter to only medium-high confidence insights
    filtered_insights = [
        ins for ins in _select_faculty_insights_for_report(insights, report_code)
        if ins.get("confidence", "LOW") in ("HIGH", "MEDIUM")
    ]
    return filtered_insights


def generate_department_role_insights(
    rows: List[Dict],
    summary_metrics: Optional[List[Dict]] = None,
    report_code: Optional[str] = None,
) -> List[Dict]:
    summary_metrics = summary_metrics or []
    total_rows = len(rows)
    overcrowd_rate = _row_status_rate(rows, ["overcrowded"])
    low_util_rate = _row_status_rate(rows, ["low"])
    no_data_rate = _row_status_rate(rows, ["no data"])
    peak_rate = _row_status_rate(rows, ["peak"])
    positive_rate = _row_status_rate(rows, ["good", "excellent", "active", "normal", "high", "moderate"])
    risk_rate = _row_status_rate(rows, ["overcrowded", "at risk", "warning", "low"])

    confidence = "HIGH" if total_rows >= 30 else ("MEDIUM" if total_rows >= 12 else "LOW")
    confidence_msg = _confidence_reason(confidence, None, total_rows)

    insights: List[Dict] = [
        _make_insight(
            "DEPT_OPERATIONAL_HEALTH",
            "Department Reliability and Activity Health",
            (
                f"Department-level attendance operations appear {'stable' if no_data_rate < 20 else 'partially blind due to sparse or missing records'}. "
                f"No-data or inactive signals account for {no_data_rate:.1f}% of rows, which {'supports confident governance decisions' if no_data_rate < 20 else 'reduces confidence in cross-unit comparisons'} in the selected window."
            ),
            {"total_rows": total_rows, "no_data_rate": no_data_rate},
            "Coverage quality determines whether planning decisions are proactive or reactive.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "DEPT_CAPACITY_PRESSURE",
            "Overcrowding and Capacity Pressure",
            (
                f"Overcrowding-related statuses comprise {overcrowd_rate:.1f}% of operational rows. "
                f"This indicates {'minimal immediate capacity pressure' if overcrowd_rate < 10 else 'room allocation stress that can affect safety, recognition quality, and attendance flow'} during peak periods."
            ),
            {"overcrowd_rate": overcrowd_rate, "total_rows": total_rows},
            "Sustained capacity pressure is both a learning-experience and operational-risk issue.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "DEPT_UTILIZATION_EFFICIENCY",
            "Room Utilization Efficiency Pattern",
            (
                f"Low-utilization signals represent {low_util_rate:.1f}% of room-related records. "
                f"This suggests {'acceptable schedule-room alignment' if low_util_rate < 20 else 'possible timetable inefficiency where assigned spaces are underused relative to schedule load'} across the department."
            ),
            {"low_utilization_rate": low_util_rate, "total_rows": total_rows},
            "Persistent underutilization can be corrected through room and schedule rebalancing.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "DEPT_PEAK_LOAD_CONCENTRATION",
            "Peak Load Concentration Pattern",
            (
                f"Peak-tagged conditions appear in {peak_rate:.1f}% of operational rows. "
                f"This implies {'balanced demand distribution across facilities' if peak_rate < 20 else 'time-concentrated usage pressure likely to stress room and device throughput during specific windows'} across monitored spaces."
            ),
            {"peak_rate": peak_rate, "total_rows": total_rows},
            "Peak concentration is a scheduling and infrastructure planning signal, not just an attendance metric.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "DEPT_SYSTEMIC_RISK_BALANCE",
            "Department Risk-to-Stability Balance",
            (
                f"Stability-like statuses are {positive_rate:.1f}% while risk-like statuses are {risk_rate:.1f}%. "
                f"This indicates {'healthy department operations with localized issues' if positive_rate >= risk_rate else 'risk-weighted operations requiring cross-unit intervention prioritization'} in the current reporting horizon."
            ),
            {"positive_rate": positive_rate, "risk_rate": risk_rate},
            "Risk-weighted periods require coordinated action across faculty management and facilities.",
            confidence,
            confidence_msg,
        ),
        _make_insight(
            "DEPT_EVIDENCE_STRENGTH",
            "Evidence Strength for Governance Decisions",
            (
                f"Current governance interpretation uses {total_rows} rows of operational evidence. "
                f"This provides {'strong confidence for policy-level adjustments' if confidence == 'HIGH' else 'moderate confidence suited for incremental adjustments' if confidence == 'MEDIUM' else 'limited confidence that should trigger additional monitoring before major policy changes'} for department planning decisions."
            ),
            {"row_count": total_rows, "confidence": confidence},
            "Confidence-aware governance avoids policy swings caused by sparse-window volatility.",
            confidence,
            confidence_msg,
        ),
    ]

    return _select_department_insights_for_report(insights, report_code)
