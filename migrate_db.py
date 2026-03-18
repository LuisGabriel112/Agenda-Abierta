"""
Script de migración para agregar nuevas columnas a la BD existente.
Ejecutar una sola vez: python migrate_db.py
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "agenda.db")


def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def run():
    print(f"📦 Conectando a {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    migrations = [
        # Nuevas columnas en la tabla negocios
        ("negocios", "giro", "TEXT"),
        ("negocios", "descripcion", "TEXT"),
        ("negocios", "direccion", "TEXT"),
        # Nueva columna en la tabla empleados (sin UNIQUE, SQLite no lo soporta en ALTER TABLE)
        ("empleados", "clerk_user_id", "TEXT"),
    ]

    for table, column, col_type in migrations:
        if column_exists(cursor, table, column):
            print(f"  ✅ {table}.{column} ya existe — omitiendo.")
        else:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"  ➕ {table}.{column} ({col_type}) agregada.")

    conn.commit()
    conn.close()
    print("✔  Migración completada.")


if __name__ == "__main__":
    run()
