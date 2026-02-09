"""
Attendance Logger - Send attendance records to backend API.
Includes offline queue for network failure resilience.
"""
import json
import os
import logging
import requests
from datetime import datetime
from typing import Optional, List, Dict
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)


class AttendanceAction(Enum):
    """Attendance action types (must match backend enum)."""
    ENTRY = "ENTRY"
    BREAK_OUT = "BREAK_OUT"
    BREAK_IN = "BREAK_IN"
    EXIT = "EXIT"


class VerifiedBy(Enum):
    """Verification method (must match backend enum)."""
    FACE = "FACE"
    FACE_GESTURE = "FACE+GESTURE"


@dataclass
class AttendanceRecord:
    """A single attendance record to be logged."""
    user_id: int
    class_id: int
    device_id: int
    action: str
    verified_by: str
    confidence_score: float
    gesture_detected: Optional[str] = None
    timestamp: Optional[str] = None
    remarks: Optional[str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()


class AttendanceLogger:
    """
    Logs attendance to backend API with offline fallback.
    
    Features:
    - POST attendance to backend API
    - Queue failed requests for later retry
    - Flush offline queue when connection restored
    """
    
    def __init__(
        self,
        backend_url: str,
        offline_queue_path: str = "rpi/data/offline_attendance.json",
        api_timeout: int = 5
    ):
        self.backend_url = backend_url.rstrip('/')
        self.offline_queue_path = offline_queue_path
        self.api_timeout = api_timeout
        
        self._offline_queue: List[AttendanceRecord] = []
        self._load_offline_queue()
    
    def log_attendance(
        self,
        user_id: int,
        class_id: int,
        device_id: int,
        action: AttendanceAction,
        verified_by: VerifiedBy,
        confidence_score: float,
        gesture_detected: Optional[str] = None,
        remarks: Optional[str] = None
    ) -> bool:
        """
        Log attendance record to backend.
        
        Args:
            user_id: User's database ID
            class_id: Active class ID
            device_id: This kiosk's device ID
            action: ENTRY, EXIT, BREAK_OUT, BREAK_IN
            verified_by: FACE or FACE+GESTURE
            confidence_score: Recognition confidence (0.0-1.0)
            gesture_detected: Gesture name if used
            remarks: Optional notes
            
        Returns:
            True if logged successfully (API or queued)
        """
        record = AttendanceRecord(
            user_id=user_id,
            class_id=class_id,
            device_id=device_id,
            action=action.value,
            verified_by=verified_by.value,
            confidence_score=confidence_score,
            gesture_detected=gesture_detected,
            remarks=remarks
        )
        
        # Try API first
        if self._post_to_api(record):
            logger.info(f"✅ Logged attendance: user={user_id}, action={action.value}")
            return True
        
        # Queue for later if API fails
        self._queue_offline(record)
        logger.warning(f"⚠️ Queued offline: user={user_id}, action={action.value}")
        return True  # Still return True since it's queued
    
    def _post_to_api(self, record: AttendanceRecord) -> bool:
        """Post attendance record to backend API."""
        try:
            url = f"{self.backend_url}/api/attendance/log"
            payload = {
                "user_id": record.user_id,
                "class_id": record.class_id,
                "device_id": record.device_id,
                "action": record.action,
                "verified_by": record.verified_by,
                "confidence_score": record.confidence_score,
                "gesture_detected": record.gesture_detected,
                "timestamp": record.timestamp,
                "remarks": record.remarks
            }
            
            response = requests.post(
                url,
                json=payload,
                timeout=self.api_timeout
            )
            
            if response.status_code in (200, 201):
                return True
            else:
                logger.warning(f"⚠️ API returned {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"⚠️ API request failed: {e}")
            return False
    
    def _queue_offline(self, record: AttendanceRecord):
        """Add record to offline queue."""
        self._offline_queue.append(record)
        self._save_offline_queue()
    
    def flush_offline_queue(self) -> int:
        """
        Attempt to send all queued offline records.
        
        Returns:
            Number of successfully sent records
        """
        if not self._offline_queue:
            return 0
        
        logger.info(f"🔄 Flushing {len(self._offline_queue)} offline records...")
        
        success_count = 0
        remaining = []
        
        for record in self._offline_queue:
            if self._post_to_api(record):
                success_count += 1
            else:
                remaining.append(record)
        
        self._offline_queue = remaining
        self._save_offline_queue()
        
        logger.info(f"✅ Flushed {success_count} records, {len(remaining)} still queued")
        return success_count
    
    def _save_offline_queue(self):
        """Save offline queue to file."""
        try:
            os.makedirs(os.path.dirname(self.offline_queue_path), exist_ok=True)
            
            queue_data = {
                "queued_at": datetime.now().isoformat(),
                "records": [asdict(r) for r in self._offline_queue]
            }
            
            with open(self.offline_queue_path, 'w') as f:
                json.dump(queue_data, f, indent=2)
                
        except Exception as e:
            logger.error(f"❌ Failed to save offline queue: {e}")
    
    def _load_offline_queue(self):
        """Load offline queue from file."""
        if not os.path.exists(self.offline_queue_path):
            return
        
        try:
            with open(self.offline_queue_path, 'r') as f:
                queue_data = json.load(f)
            
            self._offline_queue = []
            for record_dict in queue_data.get('records', []):
                self._offline_queue.append(AttendanceRecord(**record_dict))
            
            if self._offline_queue:
                logger.info(f"📦 Loaded {len(self._offline_queue)} queued offline records")
                
        except Exception as e:
            logger.error(f"❌ Failed to load offline queue: {e}")
    
    @property
    def offline_count(self) -> int:
        """Number of records in offline queue."""
        return len(self._offline_queue)
