from pathlib import Path
import argparse
import sys

import psycopg2
from dotenv import dotenv_values


def resolve_database_url(explicit_url: str | None) -> str:
    if explicit_url:
        return explicit_url

    root = Path(__file__).resolve().parents[2]
    env_path = root / "backend" / ".env"
    if not env_path.exists():
        raise SystemExit(f"backend .env not found at {env_path}")

    env_values = dotenv_values(str(env_path))
    database_url = env_values.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL missing in backend/.env")
    return database_url


def _resolve_includes(sql_path: Path) -> list[Path]:
    """Resolve psql-style include directives (\\i relative/path.sql)."""
    sql_text = sql_path.read_text(encoding="utf-8")
    include_paths: list[Path] = []

    for raw_line in sql_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("--"):
            continue
        if line.startswith("\\i "):
            include_target = line[3:].strip().strip('"').strip("'")
            include_path = (sql_path.parent / include_target).resolve()
            if not include_path.exists():
                # Also try workspace-relative path as written in the include line.
                include_path = (Path.cwd() / include_target).resolve()
            if not include_path.exists():
                raise SystemExit(f"Included SQL file not found: {include_target}")
            include_paths.append(include_path)

    return include_paths


def run_sql(sql_path: Path, database_url: str) -> None:
    if not sql_path.exists():
        raise SystemExit(f"SQL file not found: {sql_path}")

    include_paths = _resolve_includes(sql_path)

    if include_paths:
        for include_path in include_paths:
            run_sql(include_path, database_url)
        return

    sql_text = sql_path.read_text(encoding="utf-8")

    with psycopg2.connect(database_url) as conn:
        conn.autocommit = False
        with conn.cursor() as cursor:
            cursor.execute(sql_text)
        conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a SQL file via psycopg2 without psql")
    parser.add_argument("sql_file", help="Path to SQL file")
    parser.add_argument("--db-url", dest="db_url", default=None, help="Optional database URL override")
    args = parser.parse_args()

    sql_path = Path(args.sql_file).resolve()
    database_url = resolve_database_url(args.db_url)
    run_sql(sql_path, database_url)

    print(f"Executed SQL successfully: {sql_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}")
        sys.exit(1)
