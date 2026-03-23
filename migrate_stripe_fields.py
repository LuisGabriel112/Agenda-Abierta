"""
Migración Supabase/PostgreSQL — columnas de Stripe Connect y pago por cita.
Ejecutar una sola vez: python migrate_stripe_fields.py
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
    print(f"Conectando a Supabase...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    migrations = [
        # Stripe Connect + CLABE en negocios
        ("negocios", "clabe",            "VARCHAR(18)"),
        ("negocios", "banco",            "VARCHAR(100)"),
        ("negocios", "titular_cuenta",   "VARCHAR(150)"),
        ("negocios", "stripe_connect_id","VARCHAR(100)"),
        # Estado de pago en citas
        ("citas",    "pagado",           "BOOLEAN NOT NULL DEFAULT FALSE"),
        ("citas",    "stripe_session_id","VARCHAR(200)"),
        # Indica si el negocio puede recibir pagos online (charges_enabled en Stripe)
        ("negocios", "stripe_charges_enabled", "BOOLEAN NOT NULL DEFAULT FALSE"),
    ]

    for table, column, col_type in migrations:
        if column_exists(cur, table, column):
            print(f"  OK {table}.{column} ya existe.")
        else:
            cur.execute(f'ALTER TABLE {table} ADD COLUMN {column} {col_type}')
            print(f"  + {table}.{column} ({col_type}) agregada.")

    conn.commit()
    cur.close()
    conn.close()
    print("Migracion completada.")


if __name__ == "__main__":
    run()
