"""
Migración — columnas de política de cancelación y reembolso.
Ejecutar una sola vez: python migrate_cancelacion.py
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

    migrations = [
        ("negocios", "cancelacion_horas",  "INTEGER"),
        ("negocios", "terminos_reembolso", "VARCHAR(1000)"),
    ]

    for table, column, col_type in migrations:
        if column_exists(cur, table, column):
            print(f"  OK {table}.{column} ya existe.")
        else:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"  + {table}.{column} ({col_type}) agregada.")

    conn.commit()
    cur.close()
    conn.close()
    print("Migración completada.")


if __name__ == "__main__":
    run()
