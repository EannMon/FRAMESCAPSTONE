"""
Export PostgreSQL table data into an importable SQL file.

Usage (from repo root):
    python documentation/finalseed/export_db_data_to_sql.py

Optional env vars:
    DATABASE_URL
    EXPORT_SQL_OUTPUT_PATH
"""

from __future__ import annotations

import json
import os
from collections import defaultdict, deque
from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path
from typing import Dict, Iterable, List, Set
from uuid import UUID

import psycopg2

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_BACKEND_ENV = ROOT_DIR / "backend" / ".env"
DEFAULT_OUTPUT_PATH = Path(__file__).resolve().parent / "import_data_from_database.sql"


def load_dotenv_file(path: Path) -> Dict[str, str]:
    env: Dict[str, str] = {}
    if not path.exists():
        return env

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, raw_value = stripped.split("=", 1)
        key = key.strip()
        value = raw_value.strip().strip('"').strip("'")
        env[key] = value

    return env


def get_database_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.environ["DATABASE_URL"]

    dotenv_values = load_dotenv_file(DEFAULT_BACKEND_ENV)
    database_url = dotenv_values.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it to environment or backend/.env before export."
        )
    return database_url


def to_sql_literal(value) -> str:
    if value is None:
        return "NULL"

    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"

    if isinstance(value, (int, float, Decimal)):
        return str(value)

    if isinstance(value, (datetime, date, time)):
        escaped = value.isoformat().replace("'", "''")
        return f"'{escaped}'"

    if isinstance(value, (dict, list)):
        escaped = json.dumps(value, ensure_ascii=True).replace("'", "''")
        return f"'{escaped}'::jsonb"

    if isinstance(value, UUID):
        escaped = str(value).replace("'", "''")
        return f"'{escaped}'"

    if isinstance(value, (bytes, bytearray, memoryview)):
        hex_data = bytes(value).hex()
        return f"'\\x{hex_data}'::bytea"

    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def fetch_user_tables(cursor) -> List[str]:
    cursor.execute(
        """
        SELECT tablename
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('alembic_version')
        ORDER BY tablename
        """
    )
    return [row[0] for row in cursor.fetchall()]


def fetch_fk_dependencies(cursor, tables: Iterable[str]) -> Dict[str, Set[str]]:
    table_set = set(tables)
    dependencies: Dict[str, Set[str]] = {table: set() for table in table_set}

    cursor.execute(
        """
        SELECT
            child.relname AS child_table,
            parent.relname AS parent_table
        FROM pg_constraint con
        JOIN pg_class child ON con.conrelid = child.oid
        JOIN pg_namespace child_ns ON child.relnamespace = child_ns.oid
        JOIN pg_class parent ON con.confrelid = parent.oid
        JOIN pg_namespace parent_ns ON parent.relnamespace = parent_ns.oid
        WHERE con.contype = 'f'
          AND child_ns.nspname = 'public'
          AND parent_ns.nspname = 'public'
        """
    )

    for child_table, parent_table in cursor.fetchall():
        if child_table in table_set and parent_table in table_set and child_table != parent_table:
            dependencies[child_table].add(parent_table)

    return dependencies


def topo_sort_tables(tables: List[str], dependencies: Dict[str, Set[str]]) -> List[str]:
    indegree: Dict[str, int] = {table: len(dependencies.get(table, set())) for table in tables}
    dependents: Dict[str, Set[str]] = defaultdict(set)

    for child, parents in dependencies.items():
        for parent in parents:
            dependents[parent].add(child)

    queue = deque(sorted([table for table in tables if indegree[table] == 0]))
    ordered: List[str] = []

    while queue:
        current = queue.popleft()
        ordered.append(current)

        for child in sorted(dependents.get(current, set())):
            indegree[child] -= 1
            if indegree[child] == 0:
                queue.append(child)

    if len(ordered) == len(tables):
        return ordered

    # Fallback for cyclic FKs: keep deterministic order.
    remaining = sorted([table for table in tables if table not in ordered])
    return ordered + remaining


def export_data_to_sql(database_url: str, output_path: Path) -> None:
    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cursor:
            tables = fetch_user_tables(cursor)
            fk_dependencies = fetch_fk_dependencies(cursor, tables)
            ordered_tables = topo_sort_tables(tables, fk_dependencies)

            lines: List[str] = []
            lines.append("-- Generated by documentation/finalseed/export_db_data_to_sql.py")
            lines.append("-- This file is data-only and intended for import into an existing FRAMES schema.")
            lines.append("")
            lines.append("BEGIN;")
            lines.append("SET TIME ZONE 'UTC';")
            lines.append("")
            lines.append("-- Reset table contents before import")
            lines.append(
                "TRUNCATE TABLE "
                + ", ".join(f'\"public\".\"{table}\"' for table in reversed(ordered_tables))
                + " RESTART IDENTITY CASCADE;"
            )
            lines.append("")

            for table in ordered_tables:
                cursor.execute(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position
                    """,
                    (table,),
                )
                columns = [row[0] for row in cursor.fetchall()]

                if not columns:
                    continue

                column_list = ", ".join(f'\"{column}\"' for column in columns)
                cursor.execute(f'SELECT {column_list} FROM \"public\".\"{table}\"')
                rows = cursor.fetchall()

                lines.append(f"-- Table: {table} ({len(rows)} rows)")
                if not rows:
                    lines.append("")
                    continue

                for row in rows:
                    values_sql = ", ".join(to_sql_literal(value) for value in row)
                    lines.append(
                        f'INSERT INTO \"public\".\"{table}\" ({column_list}) VALUES ({values_sql});'
                    )
                lines.append("")

            lines.append("COMMIT;")
            lines.append("")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    db_url = get_database_url()
    output_override = os.getenv("EXPORT_SQL_OUTPUT_PATH")
    output = Path(output_override) if output_override else DEFAULT_OUTPUT_PATH

    export_data_to_sql(db_url, output)
    print(f"Export complete: {output}")
