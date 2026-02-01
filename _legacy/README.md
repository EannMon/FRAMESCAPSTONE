# Legacy Code Archive

> ⚠️ **WARNING: Do not use these files in production!**  
> This folder contains old code kept for reference only.

---

## Contents

| Folder | Description | Original Location |
|--------|-------------|-------------------|
| `backend_flask/` | Old Flask monolith (1907 lines) | `backend/app.py` |
| `frontend_cra/` | Old Create React App setup | `frontend_cra_backup/` |
| `sql_structure/` | Old MySQL schema files | `OLD SQL Structure/` |

---

## What Changed

### Backend: Flask → FastAPI
- **Old**: `app.py` (77KB monolith with 53 functions)
- **New**: Modular FastAPI with `api/routers/`, `models/`, `services/`

### Frontend: CRA → Vite
- **Old**: Create React App (slow 30s startup)
- **New**: Vite (637ms startup, 47x faster!)

### Database: MySQL → PostgreSQL
- **Old**: Raw MySQL queries with `db_config.py`
- **New**: SQLAlchemy ORM with PostgreSQL (Aiven cloud)

---

## Migration Date

**January 31, 2026**

See `documentation/MIGRATION_DOCUMENTATION.md` for full details.
