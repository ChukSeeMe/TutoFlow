"""
Run before 'alembic upgrade head' on first deploy.

If the database was bootstrapped via SQLAlchemy create_all_tables() rather than
Alembic, the alembic_version table will not exist. In that case, stamp the database
at revision 0003 (the last migration that create_all_tables covers) so that
'alembic upgrade head' only runs the new migrations (0004 onwards).

Exits 0 if alembic_version already exists (nothing to do).
Exits 0 after stamping successfully.
Exits non-zero on any error.
"""
import asyncio
import subprocess
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings


async def alembic_version_exists() -> bool:
    engine = create_async_engine(settings.database_url)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(
                "SELECT EXISTS ("
                "  SELECT 1 FROM information_schema.tables"
                "  WHERE table_schema = 'public'"
                "  AND table_name = 'alembic_version'"
                ")"
            ))
            return bool(result.scalar())
    finally:
        await engine.dispose()


def main() -> None:
    exists = asyncio.run(alembic_version_exists())
    if exists:
        print("alembic_version table found — skipping stamp.")
        sys.exit(0)

    print("No alembic_version table found — database was seeded via create_all_tables().")
    print("Stamping database at revision 0003 before upgrading...")
    result = subprocess.run(["alembic", "stamp", "0003"], check=True)
    if result.returncode == 0:
        print("Stamped at 0003 successfully.")
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
