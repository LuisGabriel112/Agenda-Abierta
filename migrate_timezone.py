"""
Migración — columna timezone en negocios.
Ejecutar una sola vez: python migrate_timezone.py
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    raise SystemExit("ERROR: DATABASE_URL no esta configurada en .env")


def column_exists(cur, table, column):
    cur.execute(
        """
        SELECT 1 FROM information_schema.columns
        WHERE table_name = %s AND column_name = %s
        """,
        (table, column),
    )
    return cur.fetchone() is not None


def run():
    print("Conectando a la base de datos...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    if column_exists(cur, "negocios", "timezone"):
        print("  OK negocios.timezone ya existe.")
    else:
        cur.execute(
            "ALTER TABLE negocios ADD COLUMN timezone VARCHAR(60) NOT NULL DEFAULT 'America/Mexico_City'"
        )
        print("  + negocios.timezone (VARCHAR(60)) agregada.")

    conn.commit()
    cur.close()
    conn.close()
    print("Migración completada.")


if __name__ == "__main__":
    run()
