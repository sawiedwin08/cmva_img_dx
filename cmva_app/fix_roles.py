from database import SessionLocal, engine
import sqlalchemy as sa

db = SessionLocal()

updates = [
    (2, "TECNOLOGO"),
    (3, "RADIOLOGO"),
]

for rol_id, nuevo_nombre in updates:
    db.execute(sa.text(f"UPDATE roles SET nombre='{nuevo_nombre}' WHERE id={rol_id}"))

db.commit()

for row in db.execute(sa.text("SELECT id, nombre FROM roles ORDER BY id")):
    print("Rol:", row)

db.close()
print("Roles corregidos OK")
