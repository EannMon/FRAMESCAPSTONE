"""Centralized rate limiter for FRAMES to avoid circular imports."""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared Limiter instance used by the app and routers
limiter = Limiter(key_func=get_remote_address)
