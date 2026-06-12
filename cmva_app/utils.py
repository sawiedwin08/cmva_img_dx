import pytz
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import Request
import models

COLOMBIA_TZ = pytz.timezone("America/Bogota")

ROL_ADMIN    = "ADMINISTRADOR"
ROL_TEC      = "TECNOLOGO"
ROL_RAD      = "RADIOLOGO"
ROL_CONSULTA = "CONSULTA/GERENCIA"


def now_colombia() -> datetime:
    return datetime.now(COLOMBIA_TZ).replace(tzinfo=None)


def generate_codigo_registro(db: Session, tipo: str = "RX") -> str:
    now = now_colombia()
    tipo = tipo.upper() if tipo else "RX"
    prefix = f"{tipo}-{now.year}-{now.month:02d}-"
    last = (
        db.query(models.RegistroRayosX)
        .filter(models.RegistroRayosX.codigo_registro.like(f"{prefix}%"))
        .order_by(models.RegistroRayosX.id.desc())
        .first()
    )
    if last:
        try:
            seq = int(last.codigo_registro.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:06d}"


def set_flash(response, type_: str, message: str):
    response.set_cookie(
        key=f"flash_{type_}",
        value=message[:500],
        max_age=60,
        httponly=False,
        samesite="lax",
    )


def get_flash(request: Request, response=None) -> dict:
    flash = {}
    for t in ("success", "error", "warning", "info"):
        val = request.cookies.get(f"flash_{t}")
        if val:
            flash[t] = val
            if response is not None:
                response.delete_cookie(f"flash_{t}")
    return flash


def log_audit(
    db: Session,
    accion: str,
    usuario_id: int = None,
    registro_id: int = None,
    campo: str = None,
    valor_anterior: str = None,
    valor_nuevo: str = None,
    ip: str = None,
    motivo: str = None,
):
    entry = models.AuditoriaRegistro(
        registro_id=registro_id,
        usuario_id=usuario_id,
        accion=accion,
        campo_modificado=campo,
        valor_anterior=str(valor_anterior) if valor_anterior is not None else None,
        valor_nuevo=str(valor_nuevo) if valor_nuevo is not None else None,
        ip_origen=ip,
        motivo_correccion=motivo,
    )
    db.add(entry)


def is_admin(user: models.Usuario) -> bool:
    return user.rol.nombre == ROL_ADMIN


def is_tecnologo(user: models.Usuario) -> bool:
    return user.rol.nombre == ROL_TEC


def is_radiologo(user: models.Usuario) -> bool:
    return user.rol.nombre == ROL_RAD


def is_consulta(user: models.Usuario) -> bool:
    return user.rol.nombre == ROL_CONSULTA


def can_create_registro(user: models.Usuario) -> bool:
    return user.rol.nombre in (ROL_TEC, ROL_ADMIN)


def can_complete_lectura(user: models.Usuario) -> bool:
    return user.rol.nombre in (ROL_RAD, ROL_ADMIN)


def can_export(user: models.Usuario) -> bool:
    return user.rol.nombre in (ROL_ADMIN, ROL_CONSULTA, ROL_TEC, ROL_RAD)


def can_view_dashboard(user: models.Usuario) -> bool:
    return user.rol.nombre in (ROL_ADMIN, ROL_CONSULTA)


def can_view_auditoria(user: models.Usuario) -> bool:
    return user.rol.nombre == ROL_ADMIN


def format_dt(value) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M")
    return str(value)
