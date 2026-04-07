"""
Migración — columna cancel_token en tabla citas.
Ejecutar una sola vez: python migrate_cancel_token.py
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

    if column_exists(cur, "citas", "cancel_token"):
        print("  OK citas.cancel_token ya existe.")
    else:
        # Agregar columna con valor por defecto gen_random_uuid() para filas existentes
        cur.execute("""
            ALTER TABLE citas
            ADD COLUMN cancel_token UUID NOT NULL DEFAULT gen_random_uuid()
        """)
        print("  + citas.cancel_token (UUID) agregada.")

        # Crear índice único
        cur.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS ix_citas_cancel_token
            ON citas (cancel_token)
        """)
        print("  + Índice único ix_citas_cancel_token creado.")

    conn.commit()
    cur.close()
    conn.close()
    print("Migración completada.")


if __name__ == "__main__":
    run()
