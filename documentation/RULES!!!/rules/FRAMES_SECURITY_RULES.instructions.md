# FRAMES Security Implementation Rules

## Purpose

The existing rules say "implement JWT" and "add rate limiting" but provide NO implementation detail. This file fills that gap with **specific, copy-paste-ready patterns** for every security requirement.

This supplements `FRAMES_DEPLOYMENT_CONSTRAINTS.md` §1.4, §5.1–5.4 and `codingRules.md` §5.

---

# 1️⃣ JWT Authentication — Complete Implementation

## 1.1 Token Architecture

FRAMES uses a **dual-token** system:

| Token | Purpose | Lifetime | Storage (Frontend) |
|-------|---------|----------|-------------------|
| Access Token | Authenticates API requests | 24 hours | `localStorage('accessToken')` |
| Refresh Token | Issues new access tokens | 7 days | `localStorage('refreshToken')` |

### Token Payload (Claims)

```python
# Access token payload — ONLY these fields
{
    "sub": 42,                    # user.id (subject)
    "role": "FACULTY",            # UserRole enum value
    "dept": 3,                    # department_id (for dept-scoped queries)
    "iat": 1708700000,           # issued at (Unix timestamp)
    "exp": 1708786400,           # expires at (iat + 24h)
    "type": "access"             # distinguish from refresh token
}
```

**FORBIDDEN in token payload:**
- Email, name, or any PII
- Password hash
- Facial embeddings or any biometric data
- Full user object

### Why These Specific Claims

- `sub` (user ID): Needed for every DB query scoping
- `role`: Needed for authorization checks without a DB round-trip
- `dept`: Needed for dept-scoped queries (dept head sees only their department)
- Keep payload small — tokens travel on every request

---

## 1.2 Backend: Token Creation & Verification

### Required Dependencies

```
pip install python-jose[cryptography]
```

### Core Auth Module — `backend/core/auth.py`

```python
"""
JWT Authentication for FRAMES.
Handles token creation, verification, and user extraction.
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import User, UserRole

logger = logging.getLogger(__name__)

# Configuration — MUST come from environment
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is not set!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
REFRESH_TOKEN_EXPIRE_DAYS = 7

# FastAPI security scheme
security = HTTPBearer()


def create_access_token(user: User) -> str:
    """Create a JWT access token for an authenticated user."""
    payload = {
        "sub": user.id,
        "role": user.role.value,
        "dept": user.department_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user: User) -> str:
    """Create a JWT refresh token for token renewal."""
    payload = {
        "sub": user.id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str, expected_type: str = "access") -> dict:
    """
    Decode and verify a JWT token.
    
    Returns the payload dict if valid.
    Raises HTTPException if invalid, expired, or wrong type.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != expected_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        return payload
    except JWTError as e:
        logger.warning("JWT verification failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency: extracts and validates the current user from JWT.
    
    Usage in routers:
        @router.get("/endpoint")
        def my_endpoint(current_user: User = Depends(get_current_user)):
    """
    payload = verify_token(credentials.credentials, expected_type="access")
    
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    return user


def require_role(*allowed_roles: UserRole):
    """
    Factory for role-based authorization dependency.
    
    Usage:
        @router.get("/admin-only")
        def admin_endpoint(user: User = Depends(require_role(UserRole.ADMIN))):
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            logger.warning(
                "User %d (%s) attempted to access %s-only endpoint",
                current_user.id,
                current_user.role.value,
                [r.value for r in allowed_roles],
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_checker
```

---

## 1.3 Role Hierarchy & Endpoint Protection

### Role Definitions

| Role | Can Access |
|------|-----------|
| `ADMIN` | All endpoints. User verification, system management. |
| `DEPT_HEAD` | Department-scoped data only. Faculty/student management within their department. |
| `FACULTY` | Their own classes, schedules, attendance data. |
| `STUDENT` | Their own dashboard, schedule, attendance history. |

### Router Protection Patterns

```python
# Pattern 1: Any authenticated user
@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

# Pattern 2: Specific role required
@router.get("/admin/users")
def list_users(admin: User = Depends(require_role(UserRole.ADMIN))):
    ...

# Pattern 3: Multiple roles allowed
@router.get("/management-data")
def get_dept_data(
    user: User = Depends(require_role(UserRole.DEPT_HEAD, UserRole.ADMIN))
):
    ...

# Pattern 4: Own-data-only (user can only see their own data)
@router.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use current_user.id — NEVER accept user_id from URL
    return student_service.get_dashboard(db, current_user.id)
```

### FORBIDDEN: User ID from URL

```python
# ❌ BANNED — anyone can change the number
@router.get("/dashboard/{user_id}")
def get_dashboard(user_id: int, ...):

# ✅ REQUIRED — identity comes from verified JWT
@router.get("/dashboard")
def get_dashboard(current_user: User = Depends(get_current_user), ...):
```

**Exception:** Admin endpoints that operate on other users (approve, reject, delete) are allowed user_id parameters because the admin role is verified first:

```python
@router.post("/verification/approve")
def approve(
    req: VerificationRequest,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    # admin role is verified — they CAN act on other users
```

---

## 1.4 Kiosk Authentication

Kiosk endpoints (`/api/kiosk/*`) use **device-level authentication**, not user JWT:

```python
# Kiosk uses API key or device token, not user JWT
KIOSK_API_KEY = os.getenv("KIOSK_API_KEY")

def verify_kiosk_device(
    api_key: str = Header(..., alias="X-Device-Key"),
    db: Session = Depends(get_db)
) -> Device:
    """Verify kiosk request comes from a registered device."""
    if api_key != KIOSK_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid device key")
    # Optionally verify device_id from header
    ...
```

---

## 1.5 Login & Token Refresh Endpoints

### Login Response Contract

```python
# POST /api/auth/login
# Request:
{
    "email": "faculty@tupm.edu.ph",   # or tupm_id
    "password": "hashed_not_shown"
}

# Response (200):
{
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "user": {
        "id": 42,
        "email": "faculty@tupm.edu.ph",
        "first_name": "Juan",
        "last_name": "Cruz",
        "role": "FACULTY",
        "verification_status": "VERIFIED",
        "face_registered": true
    }
}
```

### Refresh Token Endpoint

```python
# POST /api/auth/refresh
# Request:
{
    "refresh_token": "eyJ..."
}

# Response (200):
{
    "access_token": "new_eyJ...",
    "token_type": "bearer"
}
```

---

# 2️⃣ Password Security

## 2.1 Password Rules

| Rule | Requirement |
|------|------------|
| Minimum length | 8 characters |
| Hashing algorithm | bcrypt (already used) |
| Salt rounds | 12 (default for bcrypt) |
| Plaintext in logs | **NEVER** — do not log passwords, even hashed |
| Plaintext in responses | **NEVER** — exclude `hashed_password` from all API responses |

## 2.2 Response Model Exclusion

```python
# Pydantic response model MUST exclude password
class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    # hashed_password is NEVER included
    
    class Config:
        from_attributes = True
```

---

# 3️⃣ CORS Configuration

## 3.1 Development vs Production

```python
import os

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],           # NEVER ["*"] in production
    allow_credentials=True,                  # Required for cookies/auth
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Device-Key"],
)
```

---

# 4️⃣ Rate Limiting Implementation

## 4.1 Required Library

```
pip install slowapi
```

## 4.2 Setup Pattern

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# On specific endpoints:
@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, ...):
    ...

@router.post("/enroll")
@limiter.limit("3/minute")
def enroll_face(request: Request, ...):
    ...
```

## 4.3 Rate Limit Table (Mandatory)

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/auth/login` | 5/minute | Per IP |
| `POST /api/auth/register` | 3/minute | Per IP |
| `POST /api/face/enroll` | 3/minute | Per user (JWT) |
| `POST /api/kiosk/attendance/log` | 6/minute | Per device |
| `POST /api/faculty/upload-schedule` | 5/minute | Per user (JWT) |

---

# 5️⃣ Input Validation Rules

## 5.1 All Endpoints MUST Use Pydantic Schemas

```python
# ❌ BANNED — raw dict from request body
@router.post("/login")
def login(credentials: dict, ...):

# ✅ REQUIRED — Pydantic model validates shape and types
class LoginRequest(BaseModel):
    email: str          # Pydantic validates type
    password: str
    
    @validator('email')
    def email_must_be_valid(cls, v):
        if '@' not in v and not v.startswith('TUPM-'):
            raise ValueError('Must be email or TUPM-ID')
        return v

@router.post("/login")
def login(credentials: LoginRequest, ...):
```

## 5.2 File Upload Validation

```python
MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload-schedule")
async def upload_schedule(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.FACULTY, UserRole.STUDENT)),
):
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are accepted")
    
    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE:
        raise HTTPException(400, f"File too large. Max {MAX_PDF_SIZE // (1024*1024)}MB")
    
    # Reset file position for processing
    await file.seek(0)
```

---

# 6️⃣ Error Opacity — Never Expose Internals

## 6.1 Error Response Standard

ALL errors MUST use this shape:

```python
# Helper function in backend/core/errors.py
from fastapi import HTTPException

def api_error(status_code: int, code: str, message: str, details=None):
    """Create a standardized API error response."""
    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        }
    )

# Usage:
raise api_error(404, "USER_NOT_FOUND", "User not found")
raise api_error(403, "INSUFFICIENT_PERMISSIONS", "Admin access required")
raise api_error(429, "RATE_LIMIT_EXCEEDED", "Too many login attempts")
```

## 6.2 FORBIDDEN Error Patterns

```python
# ❌ BANNED — exposes internal traceback
except Exception as e:
    raise HTTPException(500, detail=str(e))

# ❌ BANNED — exposes database schema
except IntegrityError as e:
    raise HTTPException(400, detail=str(e))

# ✅ REQUIRED — log internally, return generic message
except Exception as e:
    logger.exception("Unexpected error in get_dashboard")
    raise api_error(500, "INTERNAL_ERROR", "An unexpected error occurred")
```

---

# 7️⃣ Environment Variable Checklist

These MUST exist in `.env` before security features are operational:

```env
# Authentication
JWT_SECRET_KEY=<random-64-char-string>      # Generate with: python -c "import secrets; print(secrets.token_hex(32))"

# CORS
FRONTEND_URL=http://localhost:5173          # Change for production

# Kiosk Authentication
KIOSK_API_KEY=<random-32-char-string>       # Shared secret for RPi devices

# Existing
DATABASE_URL=postgresql://...
```

### Generate Secret Key Command

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

# 8️⃣ Security Audit Checklist

Before marking security as "done," verify:

- [ ] `JWT_SECRET_KEY` loaded from environment, NOT hardcoded
- [ ] Access tokens expire in 24 hours
- [ ] Refresh tokens expire in 7 days
- [ ] Token payload contains ONLY: sub, role, dept, iat, exp, type
- [ ] `get_current_user` dependency used on ALL non-public endpoints
- [ ] `require_role()` used on admin, faculty, dept_head specific endpoints
- [ ] User ID comes from JWT (`current_user.id`), NEVER from URL path
- [ ] `hashed_password` excluded from ALL API responses
- [ ] `str(e)` never appears in HTTP response bodies
- [ ] CORS `allow_origins` is NOT `["*"]`
- [ ] Rate limiting active on login, register, enroll, upload
- [ ] All request bodies validated by Pydantic models
- [ ] File uploads validated for type and size
- [ ] Kiosk endpoints use device-level auth (API key or device token)

---

**This document is mandatory for all FRAMES security implementation. No shortcuts.**
