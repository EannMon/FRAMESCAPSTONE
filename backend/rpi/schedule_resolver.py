"""
Schedule Resolver - Determine active class based on device room and current time.
Queries backend API with local cache fallback for reliability.
"""
import json
import os
import logging
import requests
from datetime import datetime, time as dt_time
from typing import Optional, Dict, List
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class ActiveClass:
    """Represents a currently active class for attendance."""
    class_id: int
    subject_code: str
    subject_title: str
    faculty_name: str
    section: str
    start_time: str
    end_time: str
    room: str


@dataclass
class ScheduleEntry:
    """A scheduled class entry."""
    class_id: int
    subject_code: str
    subject_title: str
    faculty_id: int
    faculty_name: str
    section: str
    day_of_week: str
    start_time: str
    end_time: str
    room: str
    semester: str
    academic_year: str


class ScheduleResolver:
    """
    Resolves which class is currently active based on device room and time.
    
    Flow:
    1. Query backend API: GET /api/kiosk/active-class?device_id=X
    2. If API fails, use local cache
    3. Cache stores full weekly schedule for the room
    """
    
    def __init__(
        self,
        backend_url: str,
        device_id: int,
        cache_path: str = "rpi/data/schedule_cache.json",
        api_timeout: int = 5
    ):
        self.backend_url = backend_url.rstrip('/')
        self.device_id = device_id
        self.cache_path = cache_path
        self.api_timeout = api_timeout
        
        self._schedule_cache: List[ScheduleEntry] = []
        self._device_room: Optional[str] = None
        self._last_sync: Optional[datetime] = None
    
    def get_active_class(self) -> Optional[ActiveClass]:
        """
        Get the currently active class for this device.
        
        Returns:
            ActiveClass if a class is in session, None otherwise
        """
        # Try API first
        active = self._query_api_active_class()
        if active:
            return active
        
        # Fallback to local cache
        logger.info("📦 Using cached schedule...")
        return self._resolve_from_cache()
    
    def _query_api_active_class(self) -> Optional[ActiveClass]:
        """Query backend API for active class."""
        try:
            url = f"{self.backend_url}/api/kiosk/active-class"
            response = requests.get(
                url,
                params={"device_id": self.device_id},
                timeout=self.api_timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('active_class'):
                    cls = data['active_class']
                    # Update device room from response
                    self._device_room = cls.get('room')
                    
                    return ActiveClass(
                        class_id=cls['class_id'],
                        subject_code=cls['subject_code'],
                        subject_title=cls['subject_title'],
                        faculty_name=cls['faculty_name'],
                        section=cls['section'],
                        start_time=cls['start_time'],
                        end_time=cls['end_time'],
                        room=cls['room']
                    )
                else:
                    logger.info("ℹ️ No active class at this time")
                    return None
            
            elif response.status_code == 404:
                logger.warning("⚠️ Device not registered in database")
                return None
            else:
                logger.warning(f"⚠️ API returned status {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"⚠️ API request failed: {e}")
        
        return None
    
    def sync_schedule(self) -> bool:
        """
        Sync full weekly schedule from backend for offline use.
        
        Returns:
            True if sync successful
        """
        try:
            url = f"{self.backend_url}/api/kiosk/schedule"
            response = requests.get(
                url,
                params={"device_id": self.device_id},
                timeout=self.api_timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                self._device_room = data.get('room')
                
                self._schedule_cache = []
                for entry in data.get('schedule', []):
                    self._schedule_cache.append(ScheduleEntry(
                        class_id=entry['class_id'],
                        subject_code=entry['subject_code'],
                        subject_title=entry['subject_title'],
                        faculty_id=entry['faculty_id'],
                        faculty_name=entry['faculty_name'],
                        section=entry['section'],
                        day_of_week=entry['day_of_week'],
                        start_time=entry['start_time'],
                        end_time=entry['end_time'],
                        room=entry['room'],
                        semester=entry.get('semester', ''),
                        academic_year=entry.get('academic_year', '')
                    ))
                
                self._last_sync = datetime.now()
                self._save_cache()
                
                logger.info(f"✅ Synced {len(self._schedule_cache)} schedule entries")
                return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Schedule sync failed: {e}")
        
        return False
    
    def _resolve_from_cache(self) -> Optional[ActiveClass]:
        """Resolve active class from local cache."""
        if not self._schedule_cache:
            self._load_cache()
        
        if not self._schedule_cache:
            logger.warning("⚠️ No cached schedule available")
            return None
        
        now = datetime.now()
        current_day = now.strftime("%A")  # e.g., "Monday"
        current_time = now.time()
        
        for entry in self._schedule_cache:
            if entry.day_of_week.lower() != current_day.lower():
                continue
            
            # Parse times
            start = datetime.strptime(entry.start_time, "%H:%M:%S").time()
            end = datetime.strptime(entry.end_time, "%H:%M:%S").time()
            
            if start <= current_time <= end:
                return ActiveClass(
                    class_id=entry.class_id,
                    subject_code=entry.subject_code,
                    subject_title=entry.subject_title,
                    faculty_name=entry.faculty_name,
                    section=entry.section,
                    start_time=entry.start_time,
                    end_time=entry.end_time,
                    room=entry.room
                )
        
        return None
    
    def _save_cache(self):
        """Save schedule cache to file."""
        try:
            os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
            
            cache_data = {
                "device_id": self.device_id,
                "device_room": self._device_room,
                "synced_at": self._last_sync.isoformat() if self._last_sync else None,
                "schedule": [asdict(e) for e in self._schedule_cache]
            }
            
            with open(self.cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2)
            
            logger.debug(f"💾 Saved schedule cache to {self.cache_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save cache: {e}")
    
    def _load_cache(self):
        """Load schedule cache from file."""
        if not os.path.exists(self.cache_path):
            return
        
        try:
            with open(self.cache_path, 'r') as f:
                cache_data = json.load(f)
            
            self._device_room = cache_data.get('device_room')
            
            self._schedule_cache = []
            for entry in cache_data.get('schedule', []):
                self._schedule_cache.append(ScheduleEntry(**entry))
            
            if cache_data.get('synced_at'):
                self._last_sync = datetime.fromisoformat(cache_data['synced_at'])
            
            logger.info(f"📦 Loaded {len(self._schedule_cache)} cached schedule entries")
            
        except Exception as e:
            logger.error(f"❌ Failed to load cache: {e}")
    
    @property
    def room(self) -> Optional[str]:
        """Get device room assignment."""
        return self._device_room
