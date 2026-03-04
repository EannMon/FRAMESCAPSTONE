"""
Kiosk metrics collection for FRAMES observability.
Per FRAMES_OBSERVABILITY_RULES §5: frame time, faces, match rate, FPS, cache size, memory.
"""
import time
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Thresholds from FRAMES_OBSERVABILITY_RULES and ENGINEERING_STANDARDS
# RPi 4 target: <250ms/frame  (hardware constraint)
# Laptop CPU-only: buffalo_l takes 300-600ms on CPU without GPU — 1500ms is a
# realistic budget that catches genuine hangs without flooding logs on normal runs.
FRAME_TIME_WARN_MS_RPI = 250
FRAME_TIME_WARN_MS_LAPTOP = 1500
RECOGNITION_WARN_MS_RPI = 200
RECOGNITION_WARN_MS_LAPTOP = 1000  # CPU-only laptop: 300-600ms is normal
RECOGNITION_WARN_MS = RECOGNITION_WARN_MS_RPI  # kept for backward compat
EMBEDDING_COMPARE_WARN_MS = 50


class KioskMetricsCollector:
    """
    Collects and periodically reports kiosk performance metrics.
    Use %-formatting in logs (no f-strings) per observability rules.
    """

    def __init__(self, report_interval_sec: int = 60, platform: str = "laptop"):
        self.report_interval = report_interval_sec
        self.platform = platform.lower()
        self.frame_times_ms: List[float] = []
        self.faces_detected_per_frame: List[int] = []
        self.matches_count = 0
        self.frames_with_face_count = 0
        self.last_report_time = time.time()
        self.frame_count_since_report = 0
        self._recognition_times_ms: List[float] = []
        self._match_times_ms: List[float] = []

    def record_frame(
        self,
        frame_time_ms: float,
        num_faces: int = 0,
        matched: bool = False,
        recognition_ms: Optional[float] = None,
        match_ms: Optional[float] = None,
    ) -> None:
        """Record one frame's metrics."""
        self.frame_times_ms.append(frame_time_ms)
        self.faces_detected_per_frame.append(num_faces)
        self.frame_count_since_report += 1
        if num_faces > 0:
            self.frames_with_face_count += 1
        if matched:
            self.matches_count += 1
        if recognition_ms is not None:
            self._recognition_times_ms.append(recognition_ms)
        if match_ms is not None:
            self._match_times_ms.append(match_ms)

        # Warn on threshold breach (per observability rules)
        is_rpi = self.platform == "rpi"
        limit = FRAME_TIME_WARN_MS_RPI if is_rpi else FRAME_TIME_WARN_MS_LAPTOP
        rec_limit = RECOGNITION_WARN_MS_RPI if is_rpi else RECOGNITION_WARN_MS_LAPTOP
        if frame_time_ms > limit:
            logger.warning(
                "Frame processing exceeded budget: %.1fms (limit %dms)",
                frame_time_ms,
                limit,
            )
        if recognition_ms is not None and recognition_ms > rec_limit:
            logger.warning(
                "Face recognition inference slow: %.1fms (threshold %dms)",
                recognition_ms,
                rec_limit,
            )
        if match_ms is not None and match_ms > EMBEDDING_COMPARE_WARN_MS:
            logger.warning(
                "Embedding comparison slow: %.1fms (threshold %dms)",
                match_ms,
                EMBEDDING_COMPARE_WARN_MS,
            )

    def maybe_report(self, cache_size: int = 0, memory_mb: Optional[float] = None) -> bool:
        """
        If report_interval has elapsed, log aggregated metrics and return True.
        Uses %-formatting; METRICS prefix per observability rules.
        """
        now = time.time()
        if now - self.last_report_time < self.report_interval:
            return False

        if not self.frame_times_ms:
            self.last_report_time = now
            return True

        n = len(self.frame_times_ms)
        avg_frame_ms = sum(self.frame_times_ms) / n
        p95_idx = min(int(n * 0.95), n - 1)
        p95_frame_ms = sorted(self.frame_times_ms)[p95_idx]
        avg_faces = (
            sum(self.faces_detected_per_frame) / n if self.faces_detected_per_frame else 0
        )
        match_rate = (
            (self.matches_count / self.frames_with_face_count * 100)
            if self.frames_with_face_count > 0
            else 0.0
        )
        elapsed = now - self.last_report_time
        fps = self.frame_count_since_report / elapsed if elapsed > 0 else 0

        logger.info(
            "METRICS | frames=%d avg_ms=%.1f p95_ms=%.1f avg_faces=%.1f match_rate=%.1f%% fps=%.1f cache=%d",
            n,
            avg_frame_ms,
            p95_frame_ms,
            avg_faces,
            match_rate,
            fps,
            cache_size,
        )
        if memory_mb is not None:
            logger.info("METRICS | memory_mb=%.0f", memory_mb)
        if self._recognition_times_ms:
            avg_rec = sum(self._recognition_times_ms) / len(self._recognition_times_ms)
            logger.info("METRICS | recognition_avg_ms=%.1f", avg_rec)
        if self._match_times_ms:
            avg_match = sum(self._match_times_ms) / len(self._match_times_ms)
            logger.info("METRICS | match_avg_ms=%.1f", avg_match)

        # Reset for next window
        self.frame_times_ms.clear()
        self.faces_detected_per_frame.clear()
        self._recognition_times_ms.clear()
        self._match_times_ms.clear()
        self.matches_count = 0
        self.frames_with_face_count = 0
        self.frame_count_since_report = 0
        self.last_report_time = now
        return True
