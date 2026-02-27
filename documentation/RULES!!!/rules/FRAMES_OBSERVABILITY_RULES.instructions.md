# FRAMES Observability & Logging Rules

## Purpose

The existing rules say "use `logging` not `print()`" and "log slow queries." This file defines the **complete logging architecture**: format standards, level guidelines, health checks, metric collection, and alerting thresholds.

This supplements `FRAMES_DEPLOYMENT_CONSTRAINTS.md` §6.1–6.2 and `ENGINEERING_STANDARDS_FRAMES.md` §10.

---

# 1️⃣ Logging Configuration — Single Source

## 1.1 Backend Logging Setup

A single logging configuration MUST be initialized in `backend/main.py` **before any router import**:

```python
import logging
import os

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Silence noisy third-party loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

### Log Format Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `%(asctime)s` | Timestamp | `2025-01-15 14:32:01` |
| `%(name)s` | Module name | `api.routers.faculty` |
| `%(levelname)s` | Severity | `WARNING` |
| `%(message)s` | Event description | `Slow query in get_schedule: 142.3ms` |

### FORBIDDEN

```python
# ❌ BANNED — Each module creating its own format
logging.basicConfig(format="%(message)s")  # In every file

# ❌ BANNED — print() anywhere in production code
print(f"User {user_id} enrolled")
print(f"Error: {e}")
print("DEBUG:", some_variable)
```

---

## 1.2 Module Logger Pattern

Every Python module MUST create a logger at module level:

```python
# ✅ REQUIRED — at the top of every .py file that needs logging
import logging
logger = logging.getLogger(__name__)
```

**NEVER** use `logging.info()` directly — always use the module logger (`logger.info()`). This ensures the `%(name)s` field correctly identifies the source module.

---

# 2️⃣ Log Level Guidelines

## 2.1 When to Use Each Level

| Level | When to Use | Example |
|-------|-------------|---------|
| `DEBUG` | Internal state, query parameters, embedding distances — useful during development, silenced in production | `logger.debug("Comparing against %d cached embeddings", len(cache))` |
| `INFO` | Business events that matter — user actions, attendance logged, class resolved, cache refreshed | `logger.info("Attendance logged: user=%d class=%d action=%s", uid, cid, action)` |
| `WARNING` | Degraded but recoverable — slow query, cache miss, API retry, offline mode | `logger.warning("Slow query in %s: %.1fms", func_name, elapsed_ms)` |
| `ERROR` | Operation failed but system continues — endpoint failure, DB error caught, face detection failed | `logger.error("Failed to log attendance for user %d: %s", uid, str(e))` |
| `CRITICAL` | System unusable — DB connection lost, model failed to load, camera unavailable | `logger.critical("InsightFace model failed to initialize: %s", str(e))` |

## 2.2 Level Rules

- **Development/Local**: `LOG_LEVEL=DEBUG`
- **Production/Deployment**: `LOG_LEVEL=INFO`
- **NEVER**: Log passwords, tokens, embeddings, or biometric data at ANY level
- **ALWAYS**: Use `logger.exception(...)` in `except` blocks — it automatically includes the traceback

### FORBIDDEN Log Content

```python
# ❌ BANNED — sensitive data in logs
logger.info("User login with password: %s", password)
logger.debug("JWT token: %s", token)
logger.info("Embedding: %s", embedding_array)
logger.info("User %s authenticated with hash %s", email, password_hash)

# ✅ SAFE — identifiers only
logger.info("User %d authenticated successfully", user.id)
logger.debug("Token issued for user %d, expires %s", user.id, exp_time)
```

---

# 3️⃣ Performance Logging — Mandatory Instrumentation

## 3.1 What MUST Be Timed

Every operation in this table MUST log execution time:

| Operation | Warning Threshold | Where |
|-----------|------------------|-------|
| Database queries (aggregations, JOINs) | > 100ms | Backend services |
| Face recognition inference | > 200ms | RPi kiosk |
| Embedding batch comparison | > 50ms | RPi kiosk |
| Schedule PDF parsing | > 2000ms | Backend upload service |
| Report generation | > 5000ms | Backend report service |
| API endpoint total time | > 500ms | Backend middleware |
| Frame processing (full pipeline) | > 250ms (RPi), > 100ms (laptop) | RPi kiosk |

## 3.2 Timing Pattern

```python
import time

def timed_operation(operation_name: str):
    """Context manager for performance logging."""
    class Timer:
        def __enter__(self):
            self.start = time.perf_counter()
            return self
        
        def __exit__(self, *args):
            elapsed_ms = (time.perf_counter() - self.start) * 1000
            if elapsed_ms > 100:
                logger.warning("Slow operation [%s]: %.1fms", operation_name, elapsed_ms)
            else:
                logger.debug("Operation [%s]: %.1fms", operation_name, elapsed_ms)
    
    return Timer()

# Usage:
with timed_operation("get_faculty_schedule"):
    result = db.query(...).all()
```

### Inline Timing (For Simple Cases)

```python
start = time.perf_counter()
embeddings = face_model.get(frame)
elapsed_ms = (time.perf_counter() - start) * 1000
logger.info("Face detection: %.1fms, found %d faces", elapsed_ms, len(embeddings))
```

---

# 4️⃣ Health Check Endpoint

## 4.1 Required: `/api/health`

Every FRAMES deployment MUST expose a health check endpoint:

```python
@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for monitoring.
    Returns system status and component health.
    No authentication required.
    """
    health = {"status": "healthy", "components": {}}
    
    # Check database connectivity
    try:
        db.execute(text("SELECT 1"))
        health["components"]["database"] = "up"
    except Exception:
        health["status"] = "degraded"
        health["components"]["database"] = "down"
    
    # Check timestamp for uptime tracking
    health["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    return health
```

### What Health Check MUST NOT Do
- Query large datasets
- Perform expensive operations
- Require authentication
- Return sensitive configuration

---

# 5️⃣ Kiosk Metrics Collection

## 5.1 Required Metrics (RPi)

The kiosk main loop MUST track and periodically report:

| Metric | Collection Method | Report Interval |
|--------|------------------|-----------------|
| Frame processing time (avg, p95) | Per-frame timer | Every 60 seconds |
| Faces detected per frame (avg) | Counter | Every 60 seconds |
| Recognition match rate (%) | Matches / total faces | Every 60 seconds |
| Cache size (embeddings) | `len(cache)` | Every 5 minutes |
| Memory usage (RSS) | `psutil.Process().memory_info().rss` | Every 5 minutes |
| Camera FPS (actual) | Frame counter / elapsed | Every 60 seconds |
| API latency (avg) | Per-request timer | Every 60 seconds |
| Offline queue size | `len(queue)` | Every 60 seconds |

## 5.2 Metric Logging Pattern

```python
import time
import psutil

class MetricsCollector:
    """Collects and reports kiosk performance metrics."""
    
    def __init__(self, report_interval: int = 60):
        self.report_interval = report_interval
        self.frame_times = []
        self.faces_detected = []
        self.last_report = time.time()
    
    def record_frame(self, processing_time_ms: float, num_faces: int):
        """Record metrics for a single frame."""
        self.frame_times.append(processing_time_ms)
        self.faces_detected.append(num_faces)
        
        if time.time() - self.last_report > self.report_interval:
            self._report()
    
    def _report(self):
        """Log aggregated metrics."""
        if not self.frame_times:
            return
        
        avg_time = sum(self.frame_times) / len(self.frame_times)
        p95_time = sorted(self.frame_times)[int(len(self.frame_times) * 0.95)]
        avg_faces = sum(self.faces_detected) / len(self.faces_detected)
        memory_mb = psutil.Process().memory_info().rss / (1024 * 1024)
        
        logger.info(
            "METRICS | frames=%d avg_ms=%.1f p95_ms=%.1f avg_faces=%.1f memory_mb=%.0f",
            len(self.frame_times), avg_time, p95_time, avg_faces, memory_mb
        )
        
        # Alert on threshold violations
        if memory_mb > 3000:
            logger.critical("Memory usage exceeds 3GB ceiling: %.0fMB", memory_mb)
        if p95_time > 250:
            logger.warning("P95 frame time exceeds 250ms budget: %.1fms", p95_time)
        
        self.frame_times.clear()
        self.faces_detected.clear()
        self.last_report = time.time()
```

---

# 6️⃣ Alert Thresholds

## 6.1 Automatic Log-Level Alerts

These conditions MUST trigger elevated log levels:

| Condition | Level | Action |
|-----------|-------|--------|
| Memory > 2.5 GB (RPi) | `WARNING` | Log metric, consider cache trim |
| Memory > 3.0 GB (RPi) | `CRITICAL` | Log metric, restart kiosk |
| DB query > 100ms | `WARNING` | Log query context |
| DB query > 500ms | `ERROR` | Log query, investigate index |
| API response > 1000ms | `WARNING` | Log endpoint + parameters |
| Face model load failure | `CRITICAL` | Log error, enter degraded mode |
| Camera disconnected | `CRITICAL` | Log, attempt reconnect, display error |
| Offline queue > 100 entries | `WARNING` | Log, attempt flush |
| Embedding cache empty | `ERROR` | Log, force refresh |

---

# 7️⃣ Structured Logging Fields

## 7.1 Use %-formatting, Not f-strings

```python
# ❌ BANNED — f-strings bypass lazy evaluation, waste CPU if level is filtered
logger.debug(f"Processing frame {frame_id} with {len(faces)} faces")

# ✅ REQUIRED — %-formatting is lazy (string only built if level is active)
logger.debug("Processing frame %d with %d faces", frame_id, len(faces))
```

## 7.2 Standard Log Prefixes

Use consistent prefixes for grep-ability:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `ATTENDANCE` | Attendance events | `logger.info("ATTENDANCE | user=%d class=%d action=%s", ...)` |
| `AUTH` | Authentication events | `logger.info("AUTH | login user=%d success=True", ...)` |
| `METRICS` | Performance metrics | `logger.info("METRICS | frames=%d avg_ms=%.1f", ...)` |
| `CACHE` | Cache operations | `logger.info("CACHE | refreshed embeddings=%d", ...)` |
| `SCHEDULE` | Schedule resolution | `logger.info("SCHEDULE | resolved class=%d room=%s", ...)` |
| `OFFLINE` | Offline queue events | `logger.info("OFFLINE | queued=%d flushed=%d", ...)` |

---

# 8️⃣ What NOT to Log

## 8.1 Absolute Bans

| Data | Reason |
|------|--------|
| Passwords (plain or hashed) | Security |
| JWT tokens | Security |
| Facial embeddings (the float arrays) | Biometric data protection |
| Full user objects | May contain sensitive fields |
| Stack traces in `WARNING`/`INFO` | Use `logger.exception()` only in `except` blocks |
| Request/response bodies in production | Privacy + volume |

## 8.2 Rate-Limit Repetitive Logs

```python
# ❌ BAD — Logs 30 times per second if camera runs at 30 FPS
for frame in camera_stream():
    logger.info("Processing frame")

# ✅ GOOD — Log periodically, not per-frame
frame_count = 0
for frame in camera_stream():
    frame_count += 1
    if frame_count % 100 == 0:
        logger.debug("Processed %d frames", frame_count)
```

---

# 9️⃣ Observability Checklist

Before deployment, verify:

- [ ] `logging.basicConfig()` configured in `main.py` with standard format
- [ ] Every module uses `logger = logging.getLogger(__name__)`
- [ ] Zero `print()` statements in production code
- [ ] `LOG_LEVEL` configurable via environment variable
- [ ] All operations in §3.1 table are instrumented with timers
- [ ] `/api/health` endpoint exists and checks DB connectivity
- [ ] Kiosk collects and logs metrics every 60 seconds
- [ ] Memory usage monitored on RPi with 3GB alert threshold
- [ ] No sensitive data (passwords, tokens, embeddings) in log output
- [ ] `logger.exception()` used in all `except` blocks (not `logger.error(str(e))`)
- [ ] %-formatting used (not f-strings) in all logger calls
- [ ] Third-party loggers silenced to WARNING level

---

**This document is mandatory for FRAMES observability. Every logged line must be intentional.**
