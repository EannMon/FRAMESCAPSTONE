"""
Camera Abstraction Layer

On Laptop: Uses OpenCV VideoCapture (cv2.VideoCapture) — works with USB webcams.
On RPi Bookworm: Uses picamera2 (libcamera stack) — required for Pi Camera V2.

WHY THIS EXISTS:
    Raspberry Pi OS Bookworm (2024+) switched to the 'libcamera' camera stack.
    The old V4L2 driver that OpenCV uses (cv2.VideoCapture) can no longer read
    from the CSI camera port directly. The camera HARDWARE works (rpicam-hello
    shows a preview), but OpenCV gets "opened but cannot read frames".

    The solution is picamera2, the official Python library for Raspberry Pi cameras.
    This wrapper auto-detects the platform and picks the right backend, so the rest
    of the kiosk code doesn't need to care which camera library is in use.

INTERFACE:
    Matches cv2.VideoCapture — cam.isOpened(), cam.read() → (bool, bgr_frame), cam.release()
"""
import cv2
import numpy as np
import time
import logging

logger = logging.getLogger(__name__)


def _picamera2_available() -> bool:
    """Check if picamera2 is importable."""
    try:
        import picamera2  # noqa: F401
        return True
    except ImportError:
        return False


class Camera:
    """
    Unified camera interface for both laptop (OpenCV) and RPi (picamera2).

    Usage:
        cam = Camera(width=640, height=480, fps=30, prefer_picamera2=True)
        if cam.isOpened():
            ret, frame = cam.read()   # frame is BGR numpy array (same as cv2)
        cam.release()

    On RPi:
        - Tries picamera2 first (works with Pi Camera V2 on Bookworm)
        - Falls back to OpenCV if picamera2 is unavailable or fails
    On Laptop:
        - Uses OpenCV directly (prefer_picamera2 should be False)
    """

    def __init__(self, index=0, width=640, height=480, fps=30, prefer_picamera2=False):
        """
        Args:
            index: Camera index for OpenCV backend (0 = default camera)
            width: Desired frame width
            height: Desired frame height
            fps: Desired frames per second
            prefer_picamera2: If True, try picamera2 first (use on RPi)
        """
        self._backend = None   # 'picamera2' or 'opencv'
        self._cap = None       # Picamera2 or cv2.VideoCapture instance
        self._opened = False
        self._width = width
        self._height = height

        # Try picamera2 first on RPi
        if prefer_picamera2 and _picamera2_available():
            try:
                from picamera2 import Picamera2
                self._cap = Picamera2()

                cam_config = self._cap.create_preview_configuration(
                    main={"format": "RGB888", "size": (width, height)},
                    controls={"FrameRate": fps}
                )
                self._cap.configure(cam_config)
                self._cap.start()

                # picamera2 needs a moment to warm up after start
                time.sleep(0.5)

                # Verify we can actually capture a frame
                test_frame = self._cap.capture_array("main")
                if test_frame is not None and test_frame.size > 0:
                    self._backend = 'picamera2'
                    self._opened = True
                    logger.info(f"Camera opened via picamera2 ({width}x{height} @ {fps}fps)")
                    logger.info(f"  Test frame shape: {test_frame.shape}, dtype: {test_frame.dtype}")
                else:
                    logger.warning("picamera2 started but test capture returned empty frame")
                    self._cap.stop()
                    self._cap.close()
                    self._cap = None
            except Exception as e:
                logger.warning(f"picamera2 failed ({e}), falling back to OpenCV")
                self._cap = None

        # Fallback to OpenCV
        if self._cap is None:
            self._cap = cv2.VideoCapture(index)
            if self._cap.isOpened():
                self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
                self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
                self._cap.set(cv2.CAP_PROP_FPS, fps)
                self._backend = 'opencv'
                self._opened = True
                logger.info(f"Camera opened via OpenCV ({width}x{height} @ {fps}fps)")
            else:
                logger.error("Failed to open camera via OpenCV")
                self._opened = False

    def isOpened(self) -> bool:
        """Check if camera is opened successfully."""
        return self._opened

    def read(self):
        """
        Read a frame from the camera.

        Returns:
            (success: bool, frame: np.ndarray | None)
            frame is in BGR format (matches cv2 convention).
        """
        if not self._opened:
            return False, None

        if self._backend == 'picamera2':
            try:
                # picamera2 returns RGB; convert to BGR for cv2 compatibility
                rgb_frame = self._cap.capture_array("main")
                if rgb_frame is None or rgb_frame.size == 0:
                    logger.warning("picamera2 capture_array returned empty")
                    return False, None
                bgr_frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
                return True, bgr_frame
            except Exception as e:
                logger.error(f"picamera2 capture error: {e}")
                return False, None
        else:
            return self._cap.read()

    def set(self, prop, value):
        """Set camera property (OpenCV only — no-op for picamera2)."""
        if self._backend == 'opencv' and self._cap:
            self._cap.set(prop, value)

    def release(self):
        """Release camera resources."""
        if self._cap is not None:
            if self._backend == 'picamera2':
                try:
                    self._cap.stop()
                    self._cap.close()
                except Exception:
                    pass
            else:
                self._cap.release()
            self._cap = None
            self._opened = False

    @property
    def backend_name(self) -> str:
        """Which backend is in use: 'picamera2', 'opencv', or 'none'."""
        return self._backend or 'none'
