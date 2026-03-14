"""
Report Insight Service
Generates explainable, threshold-based insights from computed report metrics.
"""

from typing import Dict, List, Optional

from services.report_metric_service import compute_confidence_label


def generate_student_insights(
    metrics: Dict[str, float],
    previous_window_metrics: Optional[Dict[str, float]] = None,
) -> List[Dict]:
    insights: List[Dict] = []

    confidence = compute_confidence_label(
        int(metrics.get("session_count_for_confidence", 0)),
        float(metrics.get("data_completeness_score", 0.0)),
    )

    # 1) Attendance decline WoW / previous equivalent window
    if previous_window_metrics:
        curr = float(metrics.get("real_time_attendance_rate", 0.0))
        prev = float(previous_window_metrics.get("real_time_attendance_rate", 0.0))
        delta = round(curr - prev, 1)
        if delta <= -10.0:
            insights.append(
                {
                    "insight_code": "ATTENDANCE_DECLINE_WEEK_OVER_WEEK",
                    "title": "Attendance trend is declining",
                    "narrative": f"Attendance dropped by {abs(delta)} percentage points compared to the previous period.",
                    "trigger_conditions": ["current_rate - previous_rate <= -10"],
                    "supporting_metrics": [
                        "real_time_attendance_rate_current",
                        "real_time_attendance_rate_previous",
                    ],
                    "thresholds_used": {"decline_threshold": 10},
                    "confidence": confidence,
                    "recommended_action": "Review schedule pressure and set a short-term attendance recovery target.",
                }
            )

    # 2) Chronic lateness
    late_frequency = float(metrics.get("late_frequency", 0.0))
    late_entries = int(metrics.get("late_entries", 0))
    if late_frequency >= 30.0 and late_entries >= 3:
        insights.append(
            {
                "insight_code": "CHRONIC_LATENESS_PATTERN",
                "title": "Repeated lateness detected",
                "narrative": f"Late frequency is {late_frequency}% with {late_entries} late arrivals in this window.",
                "trigger_conditions": ["late_frequency >= 30", "late_entries >= 3"],
                "supporting_metrics": ["late_frequency", "late_entries", "punctuality_rate"],
                "thresholds_used": {"late_frequency_pct": 30, "late_count": 3},
                "confidence": confidence,
                "recommended_action": "Apply punctuality intervention and monitor next 2-4 sessions.",
            }
        )

    # 3) Break abuse risk
    extended_break_count = int(metrics.get("extended_break_count", 0))
    avg_break = float(metrics.get("average_break_minutes", 0.0))
    if extended_break_count >= 3:
        insights.append(
            {
                "insight_code": "BREAK_ABUSE_RISK",
                "title": "Extended break pattern detected",
                "narrative": f"Detected {extended_break_count} extended breaks with average break duration {avg_break} minutes.",
                "trigger_conditions": ["extended_break_count >= 3"],
                "supporting_metrics": ["extended_break_count", "average_break_minutes", "break_compliance_rate"],
                "thresholds_used": {"extended_break_count": 3, "break_limit_minutes": 15},
                "confidence": confidence,
                "recommended_action": "Review break policy compliance and watch return-to-class behavior.",
            }
        )

    # 4) Early exits
    early_exit_rate = float(metrics.get("early_exit_rate", 0.0))
    early_exits = int(metrics.get("early_exits", 0))
    if early_exit_rate >= 20.0 and early_exits >= 3:
        insights.append(
            {
                "insight_code": "EARLY_EXIT_RISK",
                "title": "Frequent early exits observed",
                "narrative": f"Early exit rate is {early_exit_rate}% with {early_exits} early exit incidents.",
                "trigger_conditions": ["early_exit_rate >= 20", "early_exits >= 3"],
                "supporting_metrics": ["early_exit_rate", "early_exits", "total_exits"],
                "thresholds_used": {"early_exit_rate_pct": 20, "early_exit_count": 3},
                "confidence": confidence,
                "recommended_action": "Investigate class engagement and enforce full-session participation.",
            }
        )

    # 5) Low consistency
    consistency = float(metrics.get("consistency_index", 0.0))
    if consistency < 60.0:
        insights.append(
            {
                "insight_code": "LOW_CONSISTENCY_RISK",
                "title": "Low consistency risk",
                "narrative": f"Consistency index is {consistency}, which is below the risk threshold.",
                "trigger_conditions": ["consistency_index < 60"],
                "supporting_metrics": ["consistency_index", "real_time_attendance_rate", "punctuality_rate"],
                "thresholds_used": {"consistency_index_threshold": 60},
                "confidence": confidence,
                "recommended_action": "Initiate advising follow-up and monitor bi-weekly trend.",
            }
        )

    return insights
