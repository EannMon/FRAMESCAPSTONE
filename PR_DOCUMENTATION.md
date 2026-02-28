# Pull Request: Backend API Optimization & Refactoring

## 🎯 Objective
This PR addresses the backend shortcomings identified in the `FRAMES_Process_Audit_v2.md`, focusing strictly on non-breaking structural and infrastructure optimizations. It aligns the codebase with strict workspace deployment rules, preparing it for scale while maintaining compatibility with the current frontend.

> **Note:** JWT authentication has been intentionally excluded from this PR to prevent breaking the current frontend prior to a centralized API client refactor.

## 🛠️ Key Changes

### 1. Robust Error Handling (Rule 1.3 Compliance)
- **New Core Module:** Created `backend/core/errors.py` introducing the `api_error()` helper.
- **Standardized Responses:** Replaced raw `HTTPException` calls across all routers (`admin`, `auth`, `dept`, `face`, `faculty`, `kiosk`, `student`, `users`) with `api_error()`. All failed requests now predictably return a structured JSON format:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable message",
      "details": null
    }
  }
  ```

### 2. Standardized Logging (Rule 6.1 Compliance)
- **Eliminated Prints:** Removed **all** `print()` statements from the backend.
- **Python Logger:** Configured `logging.basicConfig` in `main.py` and implemented `logging.getLogger(__name__)` across all routers using appropriately leveled `logger.info`, `logger.warning`, and `logger.error` calls.

### 3. Rate Limiting Enforced (Security Rule 5.4)
- Integrated the `slowapi` library globally.
- Protected vulnerable endpoints with intelligent rate limits returning HTTP 429:
  - `POST /api/auth/login` → **5/minute**
  - `POST /api/auth/register` → **3/minute**
  - `POST /api/kiosk/attendance/log` → **6/minute**
  - `POST /api/faculty/upload-schedule` → **5/minute**
  - `POST /api/face/enroll` → **3/minute**

### 4. Query Optimization (N+1 Fixes)
- **Aggressive Eager Loading:** Restructured loop-based database queries using SQLAlchemy's `joinedload` to eliminate N+1 latency issues.
- **Key Affected Endpoints:**
  - `dept.py`: `/management-data`
  - `kiosk.py`: `/active-class`, `/schedule`, `/class/{class_id}/enrolled`
  - `admin.py`: `/verification/list`

### 5. API Scalability & Security
- **Pagination:** Introduced `limit` (max capped) and `skip` query parameters to heavy listing endpoints like `/verification/list` (Admin) and `/session-exceptions-by-faculty` (Faculty) to prevent database stalling on large data sets.
- **Kiosk Authentication:** Enforced dependency validation for the `X-Device-Key` header across all sensitive Raspberry Pi/Kiosk device endpoints.

## 🧪 Validation & QA Performed
- ✅ Walked through endpoint states with live cURL scripts.
- ✅ Successfully triggered HTTP 429 via `slowapi` rate limits.
- ✅ Confirmed standard JSON responses accurately replace raw exceptions.
- ✅ Confirmed the elimination of raw stdout `print` loops in the terminal log output.
- ✅ Updated `requirements.txt` with `pip freeze` to include new modules (`slowapi`, `limits`).
