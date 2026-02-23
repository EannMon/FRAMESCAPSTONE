# Backend Optimization Documentation

This documentation details the optimizations applied to the FRAMES backend to align with the P0 constraints for production deployment, specifically focusing on database performance, memory efficiency, and timezone reliability.

## 1. Database Connection Tuning
The initial setup for `database.py` was generating memory bloat via excessive logging and did not handle stale connections gracefully.

**Changes:**
- Disabled `echo=False` to neutralize the overhead of printing every SQL command in production.
- Lowered `pool_size` and `max_overflow` to `5` to adhere to the strict Aiven free tier connection limits.
- Configured `pool_recycle=300` (5 minutes) and `pool_timeout=30` to proactively recycle stagnant connections and prevent hanging requests during scaling spikes.

```diff
- echo=True,
- pool_size=2,         
- max_overflow=3       
+ echo=False,
+ pool_size=5,             
+ max_overflow=5,          
+ pool_recycle=300,        
+ pool_timeout=30          
```

## 2. Model Indexing & Timestamps
To prevent full table scans when JOINing models, an index was added to all foreign keys across the application, as well as to columns frequently used in WHERE conditions (`room`, `day_of_week`, `is_late`, `action`).

**Changes:**
- Scanned all models (`attendance_log`, `audit_log`, `class_`, `department`, `device`, `enrollment`, `facial_profile`, `program`, `security_log`, `session_exception`, `subject`, `system_metric`, `user`).
- Attached `index=True` parameters to all valid foreign keys and enum filters.
- Replaced the deprecated `datetime.utcnow()` default with a lambda generating a timezone-aware UTC datetime (`lambda: datetime.now(timezone.utc)`).

## 3. N+1 Query Elimination in Routers
Several endpoints executed database queries inside loops, leading to N+1 query explosions when hitting the API (e.g., retrieving 100 students triggered 100+ separate SQL lookups).

**Changes:**
Refactored the `faculty.py` router to significantly improve latency:
- **`get_faculty_schedule`**: Utilized `joinedload()` to eagerly load `Subject` relationships and replaced loop queries with batch queries using heavily optimized `func.count` groupings.
- **`get_class_details_by_schedule_id`**: Streamlined by using `joinedload()` to batch extract `enrollment` links and aggregating active `AttendanceLogs` into an $O(1)$ memory lookup dictionary before mapping them to the response instead of requesting the database on every mapped row.
- Verified that `student.py` and `kiosk.py` endpoints already leverage efficient queries and explicit relationships.

## Validation Completed
- Spawned a local `uvicorn` instance using the virtual environment to ensure all syntax updates and imports were cleanly processed.
- Exchanged test requests to endpoint routers using `curl` and confirmed successful responses without triggering backend server execution crashes or logic panics.
