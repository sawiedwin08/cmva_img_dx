"""
migrate_to_postgres.py
Exporta todos los datos del SQLite local a un archivo SQL compatible con PostgreSQL.

Uso:
    cd cmva_app
    python migrate_to_postgres.py

Genera: cmva_export.sql  (en la misma carpeta)
Luego ese archivo se importa en Railway con el cliente psql o la consola de Railway.
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "cmva_rayosx.db")
OUTPUT  = os.path.join(os.path.dirname(__file__), "cmva_export.sql")

# Orden respetando claves foráneas (tablas padre primero)
TABLES = [
    "roles",
    "especialidades",
    "usuarios",
    "estudios",
    "servicios",
    "causas_rechazo",
    "profesionales",
    "tecnologos",
    "radiologos",
    "transcriptoras",
    "reportes",
    "registros_rayos_x",
    "auditoria_registros",
]

# Columnas que SQLite guarda como 0/1 pero PostgreSQL necesita TRUE/FALSE
BOOL_COLS = {"estado", "rechazada"}


def fmt(col, val):
    """Formatea un valor Python al literal SQL correcto para PostgreSQL."""
    if val is None:
        return "NULL"
    if col in BOOL_COLS:
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    # Texto / datetime: escapar comillas simples
    return "'" + str(val).replace("'", "''") + "'"


def main():
    if not os.path.isfile(DB_PATH):
        print(f"ERROR: No se encontro la base de datos: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur  = conn.cursor()

    lines = [
        "-- ============================================================",
        "-- CMVA Imágenes Diagnósticas — Exportación SQLite → PostgreSQL",
        f"-- Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "-- ============================================================",
        "",
        "BEGIN;",
        "",
        "-- Desactivar chequeo de FK temporalmente",
        "SET session_replication_role = replica;",
        "",
        "-- TRUNCATE en orden inverso para respetar FK",
    ]

    for table in reversed(TABLES):
        lines.append(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;")

    lines.append("")

    total_rows = 0

    for table in TABLES:
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]

        lines.append(f"-- ── {table} ({len(rows)} filas) ──────────────────────")

        for row in rows:
            vals = ", ".join(fmt(c, row[c]) for c in cols)
            col_list = ", ".join(cols)
            lines.append(f"INSERT INTO {table} ({col_list}) VALUES ({vals});")

        # Reiniciar el auto-increment (SEQUENCE) de PostgreSQL
        lines.append(
            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
            f"COALESCE((SELECT MAX(id) FROM {table}), 1));"
        )
        lines.append("")
        total_rows += len(rows)

    lines += [
        "-- Reactivar chequeo de FK",
        "SET session_replication_role = DEFAULT;",
        "",
        "COMMIT;",
        "",
        f"-- Total exportado: {total_rows} filas en {len(TABLES)} tablas",
    ]

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nExportacion completada: {OUTPUT}")
    print(f"{'Tabla':<30} {'Filas':>6}")
    print("-" * 38)
    for table in TABLES:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        n = cur.fetchone()[0]
        print(f"{table:<30} {n:>6}")
    print("-" * 38)
    print(f"{'TOTAL':<30} {total_rows:>6}")
    print()
    print("Proximo paso: importar cmva_export.sql en PostgreSQL de Railway.")
    print("Ver instrucciones al final de este script.")

    conn.close()


if __name__ == "__main__":
    main()

# ══════════════════════════════════════════════════════════════
# INSTRUCCIONES PARA IMPORTAR EN RAILWAY
# ══════════════════════════════════════════════════════════════
#
# 1. En Railway, agregue el plugin PostgreSQL a su proyecto.
#
# 2. Instale el cliente psql en su PC (viene con PostgreSQL):
#    https://www.postgresql.org/download/windows/
#
# 3. En Railway → PostgreSQL → "Connect" → copie la cadena de
#    conexión pública (Public URL). Tiene este formato:
#    postgresql://postgres:PASSWORD@HOST:PORT/railway
#
# 4. Importe el archivo generado:
#
#    psql "postgresql://postgres:PASSWORD@HOST:PORT/railway" -f cmva_export.sql
#
# 5. Verifique:
#    psql "postgresql://..." -c "SELECT COUNT(*) FROM registros_rayos_x;"
#
# ══════════════════════════════════════════════════════════════
