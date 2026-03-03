"""
JWT Authentication for FRAMES.
Handles token creation, verification, and user extraction.
Dual-token system: access token (24h) + refresh token (7d).
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
from core.errors import api_error

logger = logging.getLogger(__name__)

# Configuration — loaded from environment
# In development, fallback to a default so the app can still start.
# In production, .env MUST define a strong random secret.
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "frames-dev-secret-change-in-production")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
REFRESH_TOKEN_EXPIRE_DAYS = 7

# FastAPI security scheme — extracts Bearer token from Authorization header
security = HTTPBearer(auto_error=False)


def create_access_token(user) -> str:
    """
    Create a JWT access token for an authenticated user.
    Payload kept minimal per FRAMES_SECURITY_RULES:
    sub (user_id), role, dept, iat, exp, type.
    """
    payload = {
        "sub": user.id,
        "role": user.role.value,
        "dept": user.department_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user) -> str:
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
            raise api_error(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="INVALID_TOKEN_TYPE",
                message="Invalid token type",
            )
        return payload
    except JWTError as e:
        logger.warning("JWT verification failed: %s", str(e))
        raise api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="TOKEN_INVALID",
            message="Token is invalid or expired",
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency: extracts and validates the current user from JWT.
    
    If no Bearer token is provided, falls back to legacy behavior
    (returns None) so existing non-JWT endpoints continue working
    during the migration period.
    
    Usage in routers:
        @router.get("/endpoint")
        def my_endpoint(current_user: User = Depends(get_current_user)):
    """
    if not credentials:
        return None

    payload = verify_token(credentials.credentials, expected_type="access")

    # Lazy import to avoid circular dependency
    from models.user import User
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="USER_NOT_FOUND",
            message="User no longer exists",
        )
    return user


def require_role(*allowed_roles):
    """
    Factory for role-based authorization dependency.
    
    Usage:
        @router.get("/admin-only")
        def admin_endpoint(user: User = Depends(require_role(UserRole.ADMIN))):
    """
    def role_checker(current_user=Depends(get_current_user)):
        # Lazy import to avoid circular dependency
        from models.user import UserRole

        if current_user is None:
            raise api_error(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="NOT_AUTHENTICATED",
                message="Authentication required",
            )
        if current_user.role not in allowed_roles:
            logger.warning(
                "User %d (%s) attempted to access %s-only endpoint",
                current_user.id,
                current_user.role.value,
                [r.value for r in allowed_roles],
            )
            raise api_error(
                status_code=status.HTTP_403_FORBIDDEN,
                code="INSUFFICIENT_PERMISSIONS",
                message="Insufficient permissions",
            )
        return current_user
    return role_checker
