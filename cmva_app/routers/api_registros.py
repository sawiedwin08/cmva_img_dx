from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
import auth, models, utils

router = APIRouter(prefix="/api/registros", tags=["api-registros"])


# ── Helpers ────────────────────────────────────────────────────────────────

def _require(request: Request, db: Session) -> models.Usuario:
    user = auth.get_api_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return user


def _reg_dict(r: models.RegistroRayosX) -> dict:
    return {
        "id": r.id,
        "codigo_registro": r.codigo_registro,
        "tipo_estudio_principal": r.tipo_estudio_principal or "RX",
        "fecha_hora_toma": r.fecha_hora_toma.isoformat() if r.fecha_hora_toma else None,
        "fecha_hora_orden": r.fecha_hora_orden.isoformat() if r.fecha_hora_orden else None,
        "identificacion": r.identificacion,
        "nombre_paciente": r.nombre_paciente,
        "contrastado_si_no": r.contrastado_si_no or "NO",
        "estudio_id": r.estudio_id,
        "estudio_nombre": r.estudio.nombre if r.estudio else None,
        "codigo_tac": r.codigo_tac,
        "servicio_id": r.servicio_id,
        "servicio_nombre": r.servicio.nombre if r.servicio else None,
        "profesional_id": r.profesional_id,
        "profesional_nombre": r.profesional.nombre if r.profesional else None,
        "numero_tomas": r.numero_tomas,
        "kv": r.kv,
        "mas": r.mas,
        "volumen_contraste_ml": r.volumen_contraste_ml,
        "observaciones_tecnologo": r.observaciones_tecnologo,
        "tecnologo_id": r.tecnologo_id,
        "tecnologo_nombre": r.tecnologo.nombre if r.tecnologo else None,
        "reporte_id": r.reporte_id,
        "reporte_nombre": r.reporte.nombre if r.reporte else None,
        "rechazada": bool(r.rechazada),
        "causa_rechazo_id": r.causa_rechazo_id,
        "causa_rechazo": r.causa_rechazo.descripcion if r.causa_rechazo else None,
        "radiologo_id": r.radiologo_id,
        "radiologo_nombre": r.radiologo.nombre if r.radiologo else None,
        "transcriptora_id": r.transcriptora_id,
        "transcriptora_nombre": r.transcriptora.nombre if r.transcriptora else None,
        "lectura_radiologo": r.lectura_radiologo,
        "fecha_hora_lectura_radiologo": (
            r.fecha_hora_lectura_radiologo.isoformat()
            if r.fecha_hora_lectura_radiologo else None
        ),
        "observaciones_radiologo": r.observaciones_radiologo,
        "estado": r.estado or "PENDIENTE",
        "motivo_anulacion": r.motivo_anulacion,
        "creado_por_id": r.creado_por_id,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


def _build_query(db: Session, params: dict):
    q = db.query(models.RegistroRayosX)
    if params.get("fecha_desde"):
        try:
            q = q.filter(models.RegistroRayosX.fecha_hora_toma >= datetime.strptime(params["fecha_desde"], "%Y-%m-%d"))
        except ValueError:
            pass
    if params.get("fecha_hasta"):
        try:
            dt = datetime.strptime(params["fecha_hasta"], "%Y-%m-%d") + timedelta(days=1)
            q = q.filter(models.RegistroRayosX.fecha_hora_toma < dt)
        except ValueError:
            pass
    if params.get("tipo_estudio_principal"):
        q = q.filter(models.RegistroRayosX.tipo_estudio_principal == params["tipo_estudio_principal"])
    if params.get("tecnologo_id"):
        q = q.filter(models.RegistroRayosX.tecnologo_id == int(params["tecnologo_id"]))
    if params.get("radiologo_id"):
        q = q.filter(models.RegistroRayosX.radiologo_id == int(params["radiologo_id"]))
    if params.get("servicio_id"):
        q = q.filter(models.RegistroRayosX.servicio_id == int(params["servicio_id"]))
    if params.get("estudio_id"):
        q = q.filter(models.RegistroRayosX.estudio_id == int(params["estudio_id"]))
    if params.get("estado"):
        q = q.filter(models.RegistroRayosX.estado == params["estado"])
    if params.get("rechazada") in ("SI", "NO"):
        q = q.filter(models.RegistroRayosX.rechazada == (params["rechazada"] == "SI"))
    if params.get("identificacion"):
        q = q.filter(models.RegistroRayosX.identificacion.contains(params["identificacion"]))
    if params.get("nombre_paciente"):
        q = q.filter(models.RegistroRayosX.nombre_paciente.ilike(f"%{params['nombre_paciente']}%"))
    return q


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("")
async def api_list_registros(
    request: Request,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    tipo_estudio_principal: Optional[str] = None,
    tecnologo_id: Optional[str] = None,
    radiologo_id: Optional[str] = None,
    servicio_id: Optional[str] = None,
    estudio_id: Optional[str] = None,
    estado: Optional[str] = None,
    rechazada: Optional[str] = None,
    identificacion: Optional[str] = None,
    nombre_paciente: Optional[str] = None,
    page: int = 1,
    per_page: int = 30,
    db: Session = Depends(get_db),
):
    _require(request, db)
    params = {k: v for k, v in {
        "fecha_desde": fecha_desde, "fecha_hasta": fecha_hasta,
        "tipo_estudio_principal": tipo_estudio_principal,
        "tecnologo_id": tecnologo_id, "radiologo_id": radiologo_id,
        "servicio_id": servicio_id, "estudio_id": estudio_id,
        "estado": estado, "rechazada": rechazada,
        "identificacion": identificacion, "nombre_paciente": nombre_paciente,
    }.items() if v}
    q = _build_query(db, params).order_by(models.RegistroRayosX.fecha_hora_toma.desc())
    total = q.count()
    registros = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
        "registros": [_reg_dict(r) for r in registros],
    }


class RegistroCreateBody(BaseModel):
    tipo_estudio_principal: str = "RX"
    fecha_hora_orden: str
    identificacion: str
    nombre_paciente: str
    contrastado_si_no: str = "NO"
    estudio_id: int
    codigo_tac: Optional[str] = None
    servicio_id: int
    profesional_id: Optional[int] = None
    numero_tomas: int
    kv: float
    mas: float
    volumen_contraste_ml: Optional[float] = None
    observaciones_tecnologo: Optional[str] = None
    tecnologo_id: Optional[int] = None
    reporte_id: Optional[int] = None
    estado: Optional[str] = "PENDIENTE"


@router.post("")
async def api_crear_registro(
    request: Request,
    body: RegistroCreateBody,
    db: Session = Depends(get_db),
):
    user = _require(request, db)
    if not utils.can_create_registro(user):
        raise HTTPException(status_code=403, detail="Sin permiso para crear registros")

    try:
        fecha_orden_dt = datetime.fromisoformat(body.fecha_hora_orden)
    except ValueError:
        raise HTTPException(status_code=422, detail="Formato de fecha/hora de orden inválido")

    fecha_toma = utils.now_colombia()
    if fecha_orden_dt > fecha_toma:
        raise HTTPException(status_code=422, detail="La fecha/hora de la orden no puede ser mayor a la de la toma")
    if body.numero_tomas <= 0:
        raise HTTPException(status_code=422, detail="Número de tomas debe ser mayor a cero")
    if not (40 <= body.kv <= 200):
        raise HTTPException(status_code=422, detail="KV debe estar entre 40 y 200")
    if not (1.2 <= body.mas <= 500):
        raise HTTPException(status_code=422, detail="mAs debe estar entre 1.2 y 500")
    if body.volumen_contraste_ml is not None and not (30 <= body.volumen_contraste_ml <= 200):
        raise HTTPException(status_code=422, detail="Volumen de contraste debe estar entre 30 y 200 ml")

    tipo = (body.tipo_estudio_principal or "RX").upper()
    contrastado = (body.contrastado_si_no or "NO").upper() if tipo == "TAC" else "NO"
    na_causa = db.query(models.CausaRechazo).filter_by(descripcion="NA").first()
    codigo = utils.generate_codigo_registro(db, tipo)

    estado_inicial = (body.estado or "PENDIENTE").upper()
    if estado_inicial not in ("PENDIENTE", "POR CARGAR"):
        estado_inicial = "PENDIENTE"

    registro = models.RegistroRayosX(
        codigo_registro=codigo,
        tipo_estudio_principal=tipo,
        fecha_hora_toma=fecha_toma,
        fecha_hora_orden=fecha_orden_dt,
        identificacion=body.identificacion.strip(),
        nombre_paciente=body.nombre_paciente.strip().upper(),
        contrastado_si_no=contrastado,
        estudio_id=body.estudio_id,
        codigo_tac=body.codigo_tac.strip() if (body.codigo_tac and tipo == "TAC") else None,
        servicio_id=body.servicio_id,
        profesional_id=body.profesional_id,
        numero_tomas=body.numero_tomas,
        kv=body.kv,
        mas=body.mas,
        volumen_contraste_ml=body.volumen_contraste_ml if contrastado == "SI" else None,
        observaciones_tecnologo=body.observaciones_tecnologo.strip() if body.observaciones_tecnologo else None,
        rechazada=False,
        causa_rechazo_id=na_causa.id if na_causa else None,
        tecnologo_id=body.tecnologo_id,
        reporte_id=body.reporte_id,
        estado=estado_inicial,
        creado_por_id=user.id,
    )
    db.add(registro)
    db.flush()
    utils.log_audit(db, "CREAR", user.id, registro.id, ip=request.client.host if request.client else None)
    db.commit()
    db.refresh(registro)
    return _reg_dict(registro)


@router.get("/{registro_id}")
async def api_get_registro(request: Request, registro_id: int, db: Session = Depends(get_db)):
    _require(request, db)
    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return _reg_dict(registro)


class RegistroUpdateBody(BaseModel):
    tipo_estudio_principal: str = "RX"
    fecha_hora_orden: str
    identificacion: str
    nombre_paciente: str
    contrastado_si_no: str = "NO"
    estudio_id: int
    codigo_tac: Optional[str] = None
    servicio_id: int
    profesional_id: Optional[int] = None
    numero_tomas: int
    kv: float
    mas: float
    volumen_contraste_ml: Optional[float] = None
    observaciones_tecnologo: Optional[str] = None
    tecnologo_id: Optional[int] = None
    reporte_id: Optional[int] = None
    motivo_correccion: Optional[str] = None


@router.put("/{registro_id}")
async def api_editar_registro(
    request: Request,
    registro_id: int,
    body: RegistroUpdateBody,
    db: Session = Depends(get_db),
):
    user = _require(request, db)
    if not utils.can_create_registro(user):
        raise HTTPException(status_code=403)

    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)
    if registro.estado == "ANULADO":
        raise HTTPException(status_code=422, detail="No se puede editar un registro anulado")
    if utils.is_admin(user) and registro.estado in ("LEIDO", "CORREGIDO") and not body.motivo_correccion:
        raise HTTPException(status_code=422, detail="Debe ingresar el motivo de corrección")

    try:
        fecha_orden_dt = datetime.fromisoformat(body.fecha_hora_orden)
    except ValueError:
        raise HTTPException(status_code=422, detail="Formato de fecha/hora inválido")

    if fecha_orden_dt > registro.fecha_hora_toma:
        raise HTTPException(status_code=422, detail="La fecha/hora de la orden no puede ser mayor a la de la toma")
    if body.numero_tomas <= 0:
        raise HTTPException(status_code=422, detail="Número de tomas debe ser mayor a cero")
    if not (40 <= body.kv <= 200):
        raise HTTPException(status_code=422, detail="KV debe estar entre 40 y 200")
    if not (1.2 <= body.mas <= 500):
        raise HTTPException(status_code=422, detail="mAs debe estar entre 1.2 y 500")
    if body.volumen_contraste_ml is not None and not (30 <= body.volumen_contraste_ml <= 200):
        raise HTTPException(status_code=422, detail="Volumen de contraste debe estar entre 30 y 200 ml")

    tipo = (body.tipo_estudio_principal or "RX").upper()
    contrastado = (body.contrastado_si_no or "NO").upper() if tipo == "TAC" else "NO"
    registro.tipo_estudio_principal = tipo
    registro.fecha_hora_orden = fecha_orden_dt
    registro.identificacion = body.identificacion.strip()
    registro.nombre_paciente = body.nombre_paciente.strip().upper()
    registro.contrastado_si_no = contrastado
    registro.estudio_id = body.estudio_id
    registro.codigo_tac = body.codigo_tac.strip() if (body.codigo_tac and tipo == "TAC") else None
    registro.servicio_id = body.servicio_id
    registro.profesional_id = body.profesional_id
    registro.numero_tomas = body.numero_tomas
    registro.kv = body.kv
    registro.mas = body.mas
    registro.volumen_contraste_ml = body.volumen_contraste_ml if contrastado == "SI" else None
    registro.observaciones_tecnologo = body.observaciones_tecnologo.strip() if body.observaciones_tecnologo else None
    registro.tecnologo_id = body.tecnologo_id
    registro.reporte_id = body.reporte_id
    registro.modificado_por_id = user.id
    if utils.is_admin(user) and body.motivo_correccion:
        registro.estado = "CORREGIDO"

    utils.log_audit(db, "MODIFICAR", user.id, registro.id, motivo=body.motivo_correccion,
                    ip=request.client.host if request.client else None)
    db.commit()
    db.refresh(registro)
    return _reg_dict(registro)


class LecturaBody(BaseModel):
    rechazada: str = "NO"
    causa_rechazo_id: Optional[int] = None
    radiologo_id: int
    transcriptora_id: Optional[int] = None
    lectura_radiologo: Optional[str] = None


@router.post("/{registro_id}/lectura")
async def api_guardar_lectura(
    request: Request,
    registro_id: int,
    body: LecturaBody,
    db: Session = Depends(get_db),
):
    user = _require(request, db)
    if not utils.can_complete_lectura(user):
        raise HTTPException(status_code=403)

    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)
    if registro.estado == "ANULADO":
        raise HTTPException(status_code=422, detail="No se puede completar lectura en un registro anulado")

    es_rechazada = body.rechazada == "SI"
    na_causa = db.query(models.CausaRechazo).filter_by(descripcion="NA").first()
    if es_rechazada and (body.causa_rechazo_id is None or (na_causa and body.causa_rechazo_id == na_causa.id)):
        raise HTTPException(status_code=422, detail="Debe seleccionar una causa de rechazo válida")

    registro.rechazada = es_rechazada
    registro.causa_rechazo_id = body.causa_rechazo_id if es_rechazada else (na_causa.id if na_causa else None)
    registro.radiologo_id = body.radiologo_id
    registro.transcriptora_id = body.transcriptora_id
    registro.lectura_radiologo = body.lectura_radiologo
    registro.fecha_hora_lectura_radiologo = utils.now_colombia()
    registro.estado = "LEIDO"
    registro.leido_por_id = user.id
    utils.log_audit(db, "LECTURA", user.id, registro.id, ip=request.client.host if request.client else None)
    db.commit()
    db.refresh(registro)
    return _reg_dict(registro)


@router.post("/{registro_id}/activar")
async def api_activar_registro(
    request: Request,
    registro_id: int,
    db: Session = Depends(get_db),
):
    user = _require(request, db)
    if not utils.can_create_registro(user):
        raise HTTPException(status_code=403, detail="Sin permiso")

    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if registro.estado != "POR CARGAR":
        raise HTTPException(status_code=422, detail="El registro no está en estado POR CARGAR")

    registro.estado = "PENDIENTE"
    registro.modificado_por_id = user.id
    utils.log_audit(db, "ACTIVAR", user.id, registro.id, ip=request.client.host if request.client else None)
    db.commit()
    db.refresh(registro)
    return _reg_dict(registro)


class AnularBody(BaseModel):
    motivo_anulacion: str


@router.post("/{registro_id}/anular")
async def api_anular_registro(
    request: Request,
    registro_id: int,
    body: AnularBody,
    db: Session = Depends(get_db),
):
    user = _require(request, db)
    if not utils.is_admin(user):
        raise HTTPException(status_code=403)

    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)
    registro.estado = "ANULADO"
    registro.motivo_anulacion = body.motivo_anulacion
    registro.modificado_por_id = user.id
    utils.log_audit(db, "ANULAR", user.id, registro.id, motivo=body.motivo_anulacion,
                    ip=request.client.host if request.client else None)
    db.commit()
    db.refresh(registro)
    return _reg_dict(registro)
