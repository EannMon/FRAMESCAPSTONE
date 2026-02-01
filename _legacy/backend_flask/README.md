# Legacy Code

This folder contains the old Flask/MySQL implementation for reference purposes only.

## Files

| File | Description | Lines |
|------|-------------|-------|
| `app.py` | Original Flask monolith | ~1907 lines |
| `db_config.py` | MySQL connection config | ~20 lines |

## ⚠️ Warning

**DO NOT USE THESE FILES IN PRODUCTION**

These files are kept for reference only. The new backend uses:
- **FastAPI** instead of Flask
- **PostgreSQL + SQLAlchemy** instead of MySQL
- **Modular architecture** (`api/routers/`, `models/`, `services/`)

## New Entry Point

To run the backend, use:
```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```
