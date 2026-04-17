"""
Centralized timezone utilities for FRAMES.

All date/time calculations that determine "today", "this week", or
any business-logic date boundary MUST use these helpers instead of
raw datetime.utcnow() or datetime.now(timezone.utc).

The application timezone defaults to Asia/Manila (UTC+8) and can be
overridden via the APP_TIMEZONE environment variable.
"""
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

APP_TIMEZONE = os.getenv("APP_TIMEZONE", "Asia/Manila")
TZ_INFO = ZoneInfo(APP_TIMEZONE)


def local_now() -> datetime:
    """Return current wall-clock datetime in the app timezone (naive).

    Use this instead of datetime.utcnow() or datetime.now() for any
    business-logic that needs to know "what time is it for the user".
    Returns a naive datetime in local time (no tzinfo attached) so it
    can be compared directly with naive DB timestamps.
    """
    return datetime.now(TZ_INFO).replace(tzinfo=None)


def local_today_start() -> datetime:
    """Return midnight (00:00:00) of today in the app timezone (naive)."""
    now = local_now()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def local_day_window(reference_time=None):
    """Return [start, end) window for the local calendar day (naive)."""
    now = reference_time or local_now()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1)


def local_date_to_datetime(d) -> datetime:
    """Convert a date object to a naive datetime at midnight in app timezone."""
    return datetime(d.year, d.month, d.day)
