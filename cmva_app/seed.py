from sqlalchemy.orm import Session
import models
import auth


def seed_initial_data(db: Session):
    _seed_roles(db)
    _seed_especialidades(db)
    _seed_admin_user(db)
    _seed_causa_rechazo_na(db)
    _seed_estudios(db)
    _seed_servicios(db)
    db.commit()


def _seed_roles(db: Session):
    roles = [
        ("ADMINISTRADOR", "Acceso total al sistema"),
        ("TECNOLOGO", "Registra estudios, diligencia campos A-M"),
        ("RADIOLOGO", "Completa lectura radiologica, campos N-Q"),
        ("CONSULTA/GERENCIA", "Consulta, filtros y exportacion"),
    ]
    for nombre, desc in roles:
        if not db.query(models.Rol).filter_by(nombre=nombre).first():
            db.add(models.Rol(nombre=nombre, descripcion=desc))
    db.flush()


def _seed_especialidades(db: Session):
    especialidades = [
        ("RADIOLOGÍA", "Especialidad médica de imágenes diagnósticas"),
        ("TECNOLOGÍA EN IMÁGENES DIAGNÓSTICAS", "Tecnología en rayos X"),
    ]
    for nombre, desc in especialidades:
        if not db.query(models.Especialidad).filter_by(nombre=nombre).first():
            db.add(models.Especialidad(nombre=nombre, descripcion=desc))
    db.flush()


def _seed_admin_user(db: Session):
    if db.query(models.Usuario).filter_by(usuario="admin").first():
        return
    rol = db.query(models.Rol).filter_by(nombre="ADMINISTRADOR").first()
    if not rol:
        return
    db.add(
        models.Usuario(
            nombre_completo="Administrador CMVA",
            usuario="admin",
            correo="admin@cmva.com",
            password_hash=auth.hash_password("Admin2024*"),
            rol_id=rol.id,
            estado=True,
        )
    )
    db.flush()


def _seed_causa_rechazo_na(db: Session):
    if not db.query(models.CausaRechazo).filter_by(descripcion="NA").first():
        db.add(models.CausaRechazo(descripcion="NA"))
    db.flush()


def _seed_estudios(db: Session):
    rx_estudios = [
        "RX TÓRAX", "RX ABDOMEN", "RX MANO", "RX MUÑECA", "RX PIERNA",
        "RX RODILLA", "RX COLUMNA CERVICAL", "RX COLUMNA LUMBAR", "RX PELVIS",
        "RX TOBILLO", "RX PIE", "RX HOMBRO", "RX CODO", "RX ANTEBRAZO",
        "RX PORTÁTIL", "RX CADERA", "RX COLUMNA DORSAL", "RX COLUMNA DORSOLUMBAR",
        "RX CARA", "RX CALCÁNEO", "RX ARTICULACIÓN SACROILÍACA",
    ]
    for nombre in rx_estudios:
        existing = db.query(models.Estudio).filter_by(nombre=nombre).first()
        if not existing:
            db.add(models.Estudio(nombre=nombre, tipo="RX"))
        elif existing.tipo is None:
            existing.tipo = "RX"

    tac_estudios = [
        "TAC CEREBRO SIMPLE", "TAC CEREBRO CONTRASTADO", "TAC TÓRAX",
        "TAC ABDOMEN SIMPLE", "TAC ABDOMEN CONTRASTADO", "TAC PELVIS",
        "TAC COLUMNA CERVICAL", "TAC COLUMNA LUMBAR", "TAC CUELLO",
        "TAC CARA Y SENOS PARANASALES", "TAC ARTICULACIÓN",
    ]
    for nombre in tac_estudios:
        if not db.query(models.Estudio).filter_by(nombre=nombre).first():
            db.add(models.Estudio(nombre=nombre, tipo="TAC"))

    eco_estudios = [
        "ECO ABDOMINAL", "ECO PÉLVICA", "ECO RENAL", "ECO TIROIDES",
        "ECO PARTES BLANDAS", "ECO OBSTÉTRICA", "ECO DOPPLER",
        "ECO MAMARIA", "ECO MUSCULAR", "ECO ARTICULAR",
    ]
    for nombre in eco_estudios:
        if not db.query(models.Estudio).filter_by(nombre=nombre).first():
            db.add(models.Estudio(nombre=nombre, tipo="ECO"))

    db.flush()


def _seed_servicios(db: Session):
    servicios = [
        ("URG", "URGENCIAS"),
        ("HOSP", "HOSPITALIZACIÓN"),
        ("UCI", "UCI"),
        ("QX", "QUIRÓFANO"),
        ("PQX", "PREQUIRÚRGICO"),
        ("C EXT", "CONSULTA EXTERNA"),
    ]
    for codigo, nombre in servicios:
        if not db.query(models.Servicio).filter_by(nombre=nombre).first():
            db.add(models.Servicio(codigo=codigo, nombre=nombre))
    db.flush()
