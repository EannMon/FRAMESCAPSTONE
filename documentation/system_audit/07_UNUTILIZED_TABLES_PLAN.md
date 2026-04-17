# Unutilized Tables — Implementation Plan

## Overview

FRAMES has several database tables that are defined in models but have **no code wiring them into the system**. These tables were designed for future use. This document outlines how to utilize each one.

---

## Table Inventory

| Table | Model File | Current Status | Priority |
|-------|-----------|---------------|----------|
| `session_exceptions` | `models/session_exception.py` | Defined, has faculty API endpoints, but **NOT checked during active class resolution** | 🔴 HIGH |
| `system_metrics` | `models/system_metric.py` | Defined with metric types, **NO code writes to it** | 🟡 MEDIUM |
| `security_logs` | `models/security_log.py` | Defined with event types, **NO code writes to it** | 🟡 MEDIUM |
| `audit_logs` | `models/audit_log.py` | Defined with 20+ action types, **NO middleware auto-logs** | 🟢 LOW |
| `notifications` | `models/notification.py` | Partially used (overcrowding alerts), most types unused | 🟢 LOW |

---

## 1. Session Exceptions (HIGH PRIORITY)

### What It Should Do
Faculty should be able to mark a specific class session as CANCELLED, ONLINE, or HOLIDAY. The kiosk should then:
- **CANCELLED/HOLIDAY**: Skip that class — show "No class (cancelled)" instead of activating attendance
- **ONLINE**: Skip that class — show "Class is online today"
- **ONSITE**: Normal behavior (default)

### Current Gap
The `session_exceptions` table EXISTS and faculty can CREATE exceptions via API, but the **kiosk active-class resolver does NOT check for exceptions.** If a faculty member cancels a class, the kiosk still activates attendance for that class.

### Where the Check Should Go

**Backend — `api/routers/kiosk.py` — `get_active_class()` endpoint:**

After finding classes that match room + day + time, filter out any that have a session exception for today:

```python
from models.session_exception import SessionException, ExceptionType

# After finding candidate classes for this room/day/time:
for cls in classes:
    # Check if there is a session exception for today
    today = now.date()
    exception = db.query(SessionException).filter(
        SessionException.class_id == cls.id,
        SessionException.session_date == today,
        SessionException.exception_type.in_([
            ExceptionType.CANCELLED,
            ExceptionType.ONLINE,
            ExceptionType.HOLIDAY,
        ])
    ).first()
    
    if exception:
        logger.info("SCHEDULE | Class %d skipped: %s for %s",
                     cls.id, exception.exception_type.value, today)
        continue  # Skip this class
    
    # ... existing time-window check ...
```

**Schedule cache should also include exception data** so offline fallback respects cancellations.

### Files to Modify
1. `api/routers/kiosk.py` — Add exception check in `get_active_class()`
2. `api/routers/kiosk.py` — Include exceptions in `get_device_schedule()` response
3. `rpi/schedule_resolver.py` — Check exceptions when resolving from cache

---

## 2. System Metrics (MEDIUM PRIORITY)

### What It Should Do
Store kiosk performance metrics in the database for historical analysis and the admin health dashboard.

### Current Gap
The `KioskMetricsCollector` in `rpi/metrics_collector.py` collects metrics and logs them to console, but **never writes to the `system_metrics` table.**

### Implementation Plan

**Step 1: Add a metrics reporting endpoint to the backend**

```python
# api/routers/kiosk.py
@router.post("/metrics/report")
def report_metrics(
    metrics: MetricsReportRequest,
    db: Session = Depends(get_db)
):
    """Kiosk periodically reports performance metrics."""
    for metric in metrics.metrics:
        db.add(SystemMetric(
            device_id=metrics.device_id,
            metric_type=metric.type,
            value=metric.value,
            unit=metric.unit,
        ))
    db.commit()
    return {"status": "ok", "recorded": len(metrics.metrics)}
```

**Step 2: Modify KioskMetricsCollector to POST metrics**

In `metrics_collector.py`, after the `_report()` method logs to console, also POST to the backend:

```python
def _report(self):
    # ... existing logging ...
    
    # POST to backend (non-blocking, best-effort)
    try:
        requests.post(
            f"{self.backend_url}/api/kiosk/metrics/report",
            json={
                "device_id": self.device_id,
                "metrics": [
                    {"type": "RECOGNITION_LATENCY", "value": avg_time, "unit": "ms"},
                    {"type": "MEMORY_USAGE", "value": memory_mb, "unit": "MB"},
                    {"type": "RECOGNITION_ACCURACY", "value": match_rate * 100, "unit": "percent"},
                ]
            },
            timeout=5
        )
    except Exception:
        pass  # Best-effort, don't block kiosk
```

**Step 3: Admin dashboard can query metrics**

```python
# api/routers/admin.py
@router.get("/system-metrics")
def get_system_metrics(
    device_id: Optional[int] = None,
    metric_type: Optional[str] = None,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get system metrics for health dashboard."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    query = db.query(SystemMetric).filter(SystemMetric.timestamp >= cutoff)
    if device_id:
        query = query.filter(SystemMetric.device_id == device_id)
    if metric_type:
        query = query.filter(SystemMetric.metric_type == metric_type)
    return query.order_by(SystemMetric.timestamp.desc()).limit(1000).all()
```

### Files to Modify
1. `api/routers/kiosk.py` — Add metrics reporting endpoint
2. `rpi/metrics_collector.py` — Add API POST in _report()
3. `api/routers/admin.py` — Add metrics query endpoint
4. `schemas/` — Add Pydantic schemas for metrics request/response

---

## 3. Security Logs (MEDIUM PRIORITY)

### What It Should Do
Track security-relevant events:
- **UNRECOGNIZED_FACE**: Face detected but not matched to any enrolled user (potential intruder)
- **GESTURE_FAILURE**: Repeated gesture failures (potential confusion or spoofing)
- **SPOOF_ATTEMPT**: If liveness detection flags a photo/video attack
- **UNAUTHORIZED_ACCESS**: User recognized but not enrolled in the current class

### Current Gap
The recognition pipeline detects all these events and LOGS them to console, but never writes to the `security_logs` table.

### Implementation Plan

**Step 1: Add security logging to attendance_logger.py or a new security_logger.py**

```python
# rpi/security_logger.py
class SecurityLogger:
    def __init__(self, backend_url: str, device_id: int):
        self.backend_url = backend_url
        self.device_id = device_id
        self._queue = []
    
    def log_event(self, event_type: str, confidence: float = None,
                  room: str = None, details: str = None):
        """Queue a security event for batch reporting."""
        self._queue.append({
            "device_id": self.device_id,
            "event_type": event_type,
            "confidence_score": confidence,
            "room": room,
            "details": details,
        })
        
        # Batch send every 10 events or 60 seconds
        if len(self._queue) >= 10:
            self.flush()
    
    def flush(self):
        if not self._queue:
            return
        try:
            requests.post(
                f"{self.backend_url}/api/kiosk/security/report",
                json={"events": self._queue},
                timeout=5
            )
            self._queue.clear()
        except Exception:
            pass  # Best-effort
```

**Step 2: Wire into recognition pipeline**

In `kiosk_server.py` recognition_loop:

```python
# When unknown face is detected:
if match is None and bbox is not None:
    security_logger.log_event("UNRECOGNIZED_FACE", confidence=best_score,
                               room=self.schedule_resolver.room)

# When NOT_IN_CLASS is detected:
if not self._is_user_in_class(match.user_id):
    security_logger.log_event("UNAUTHORIZED_ACCESS", confidence=confidence,
                               details=f"user={match.user_id} class={active_class.class_id}")
```

**Step 3: Admin security dashboard**

Show recent security events, filter by event type, time range, and room.

### Files to Modify
1. Create `rpi/security_logger.py`
2. `rpi/kiosk_server.py` — Wire security logger into recognition loop
3. `rpi/main_kiosk.py` — Same for standalone mode
4. `api/routers/kiosk.py` — Add security report endpoint
5. `api/routers/admin.py` — Add security events query endpoint

---

## 4. Audit Logs (LOW PRIORITY)

### What It Should Do
Track all administrative actions: user verification, schedule upload, class creation, enrollment changes, etc.

### Current Gap
The model defines 20+ action types, but no middleware or service writes to the table.

### Implementation Plan

**Create a utility function:**

```python
# core/audit.py
def log_audit(db: Session, user_id: int, action: str,
              target_table: str = None, target_id: int = None,
              old_value: dict = None, new_value: dict = None,
              request: Request = None):
    """Log an administrative action."""
    log = AuditLog(
        user_id=user_id,
        action_type=action,
        target_table=target_table,
        target_id=target_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(log)
    # Don't commit — let the caller's transaction handle it
```

**Add to critical endpoints:**

```python
# In admin.py — approve user endpoint:
log_audit(db, admin.id, AuditActions.USER_VERIFY,
          target_table="users", target_id=user.id,
          old_value={"status": "PENDING"}, new_value={"status": "VERIFIED"},
          request=request)

# In faculty.py — upload schedule:
log_audit(db, user.id, AuditActions.SCHEDULE_UPLOAD,
          target_table="classes", new_value={"classes_created": len(new_classes)},
          request=request)
```

### Files to Modify
1. Create `core/audit.py`
2. `api/routers/admin.py` — Add audit logging to user management endpoints
3. `api/routers/faculty.py` — Add audit logging to schedule/class management
4. `api/routers/admin.py` — Add endpoint to query audit logs

---

## 5. Notifications (LOW PRIORITY)

### Current State
Overcrowding notifications work. Other types (absent alert, late alert, system alert) are defined but not triggered.

### Implementation Plan
Wire notification creation into:
- **Attendance logging:** When a student is late → create notification for faculty
- **Auto-exit:** When auto-exit fires → notify faculty
- **System health:** When kiosk goes offline → notify admin

---

## Implementation Order

| Step | Table | Effort | Impact |
|------|-------|--------|--------|
| 1 | Session Exceptions → active-class check | 2-4 hours | Faculty can cancel classes properly |
| 2 | System Metrics → kiosk reporting | 4-6 hours | Admin health dashboard data |
| 3 | Security Logs → recognition pipeline | 4-6 hours | Security monitoring |
| 4 | Audit Logs → admin actions | 6-8 hours | Accountability trail |
| 5 | Notifications → triggers | 4-6 hours | User alerts |

---

## Summary

These tables represent thoughtful forward-looking design. The schema work is done — what remains is **wiring the data flow** (collecting events and writing to DB) and **surfacing the data** (admin dashboard queries and displays). Session exceptions are the highest priority because they directly affect attendance accuracy.
