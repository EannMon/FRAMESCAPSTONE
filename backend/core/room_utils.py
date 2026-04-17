"""
Room Name Normalization Utility

Ensures consistent room name format across the system:
Device.room, Class.room, and schedule imports all use the same canonical form.

Canonical form: 'ROOM {identifier}' (uppercase)
  'Room 328'  → 'ROOM 328'
  'ROOM 328'  → 'ROOM 328'
  '328'       → 'ROOM 328'
  'room 328'  → 'ROOM 328'
  'CL1'       → 'ROOM CL1'
  'Room CL1'  → 'ROOM CL1'
  'MH-301'    → 'ROOM MH-301'
"""
import re
import logging

logger = logging.getLogger(__name__)


def normalize_room_name(room: str) -> str:
    """
    Normalize a room name to canonical uppercase form: 'ROOM {identifier}'.

    Handles variations like 'Room 328', 'ROOM 328', '328', 'room mh-301'.
    Returns original stripped value if input is empty or whitespace-only.
    """
    if not room or not room.strip():
        return (room or "").strip()

    cleaned = room.strip().upper()

    # Remove 'ROOM' prefix if present (with optional trailing space/separator)
    cleaned = re.sub(r"^ROOM\s*", "", cleaned).strip()

    if not cleaned:
        # Edge case: input was literally "ROOM" with nothing after
        return room.strip().upper()

    return f"ROOM {cleaned}"
