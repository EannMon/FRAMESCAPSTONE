# Room Name Normalization Analysis

## Issue Reported
Room names like `Room 328`, `ROOM 328`, `328`, `room 328` should all be treated as the same room. Currently, matching is done via `lower(trim())` but there is no canonical normalization that strips the "Room" prefix or adds it.

---

## Current Behavior

### How Room Matching Works Today

**Kiosk Router** (`api/routers/kiosk.py` line 194):
```python
normalized_room = device.room.strip().lower()
# Then:
func.lower(func.trim(Class.room)) == normalized_room
```

This means:
- Device room `"Room 328"` → normalized to `"room 328"`
- Class room `"ROOM 328"` → SQL `lower(trim())` → `"room 328"` ✅ MATCHES
- Class room `"328"` → SQL `lower(trim())` → `"328"` ❌ DOES NOT MATCH
- Class room `"room 328"` → SQL `lower(trim())` → `"room 328"` ✅ MATCHES

**Report Service** (`services/report_service.py` line 51):
```python
def _normalize_room(room: str):
    normalized = room.lower().replace("room", "").strip()
```
This is smarter — strips the word "room" entirely. But it is only used in report generation, NOT in kiosk/schedule matching.

### The Gap
There is no unified normalization function used across the system. The kiosk uses simple `lower(trim())`, reports use a smarter normalization, and data entry (schedule upload, admin forms) stores whatever the user typed.

---

## Required Solution

### Approach: Normalize on Write (Store Canonical Form)

Rather than normalizing at every query point, normalize room names **when they enter the system**:

1. **Schedule upload** (PDF parser) — normalize extracted room names
2. **Admin/faculty forms** — normalize before saving to DB
3. **Device registration** — normalize room assignment

### Canonical Form: `ROOM {number/identifier}` (uppercase)

| Input | Canonical Output |
|-------|-----------------|
| `Room 328` | `ROOM 328` |
| `ROOM 328` | `ROOM 328` |
| `328` | `ROOM 328` |
| `room 328` | `ROOM 328` |
| `CL1` | `ROOM CL1` |
| `Room CL1` | `ROOM CL1` |
| `MH-301` | `ROOM MH-301` |
| `room mh-301` | `ROOM MH-301` |

### Implementation: Utility Function

Create a shared normalization function:

```python
# backend/core/utils.py
import re

def normalize_room_name(room: str) -> str:
    """
    Normalize room names to canonical form: 'ROOM {identifier}'.
    
    Examples:
        'Room 328'  → 'ROOM 328'
        '328'       → 'ROOM 328'
        'CL1'       → 'ROOM CL1'
        'room mh-301' → 'ROOM MH-301'
    """
    if not room:
        return room
    
    # Strip whitespace and convert to uppercase
    cleaned = room.strip().upper()
    
    # Remove 'ROOM' prefix if present (with optional space/separator)
    cleaned = re.sub(r'^ROOM\s*', '', cleaned).strip()
    
    # Result: 'ROOM ' + remaining identifier
    return f"ROOM {cleaned}" if cleaned else room.strip().upper()
```

### Where to Apply

1. **Schedule PDF parser** (`services/pdf_parser.py`) — when extracting room names
2. **Kiosk active-class query** — normalize both device.room and Class.room
3. **Admin device setup** — normalize room on save
4. **Class creation/update** — normalize room before DB insert
5. **One-time migration** — update all existing Class.room and Device.room values

---

## Impact
- **Severity:** Medium (causes missed schedule matches if rooms stored inconsistently)
- **Effort:** Low (utility function + apply at write points)
- **Risk:** Must verify existing data is correctly migrated
