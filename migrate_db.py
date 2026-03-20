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
        # Método de pago elegido al reservar
        ("citas", "metodo_pago", "TEXT"),
    ]

    for table, column, col_type in migrations:
        if column_exists(cursor, table, column):
            print(f"  ✅ {table}.{column} ya existe — omitiendo.")
        else:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"  ➕ {table}.{column} ({col_type}) agregada.")

    # Nueva tabla: bloqueos_tiempo
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bloqueos_tiempo (
            id TEXT PRIMARY KEY,
            negocio_id TEXT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
            empleado_id TEXT REFERENCES empleados(id) ON DELETE CASCADE,
            hora_inicio DATETIME NOT NULL,
            hora_fin DATETIME NOT NULL,
            motivo TEXT,
            notas TEXT
        )
    """)
    print("  ✅ Tabla bloqueos_tiempo verificada.")

    conn.commit()
    conn.close()
    print("✔  Migración completada.")


if __name__ == "__main__":
    run()
