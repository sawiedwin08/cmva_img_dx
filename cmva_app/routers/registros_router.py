from fastapi import APIRouter, Request, Form, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from database import get_db
import auth, models, utils
from templates_config import templates

router = APIRouter(tags=["registros"])


def _require_user(request, db):
    user = auth.get_current_user(request, db)
    if not user:
        return None, RedirectResponse("/login", status_code=302)
    return user, None


def _get_catalogs(db, tipo_filter: str = None):
    estudios_q = db.query(models.Estudio).filter_by(estado=True)
    if tipo_filter:
        estudios_q = estudios_q.filter(models.Estudio.tipo == tipo_filter)
    return {
        "estudios": estudios_q.order_by(models.Estudio.nombre).all(),
        "todos_estudios": db.query(models.Estudio).filter_by(estado=True).order_by(models.Estudio.nombre).all(),
        "servicios": db.query(models.Servicio).filter_by(estado=True).order_by(models.Servicio.nombre).all(),
        "causas_rechazo": db.query(models.CausaRechazo).filter_by(estado=True).all(),
        "tecnologos": db.query(models.Tecnologo).filter_by(estado=True).order_by(models.Tecnologo.nombre).all(),
        "radiologos": db.query(models.Radiologo).filter_by(estado=True).order_by(models.Radiologo.nombre).all(),
        "transcriptoras": db.query(models.Transcriptora).filter_by(estado=True).order_by(models.Transcriptora.nombre).all(),
        "reportes": db.query(models.Reporte).filter_by(estado=True).order_by(models.Reporte.nombre).all(),
        "profesionales": db.query(models.Profesional).filter_by(estado=True).order_by(models.Profesional.nombre).all(),
    }


def _build_query(db, params):
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


@router.get("/registros", response_class=HTMLResponse)
async def list_registros(
    request: Request,
    response: Response,
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
    db: Session = Depends(get_db),
):
    user, redir = _require_user(request, db)
    if redir:
        return redir

    params = {k: v for k, v in {
        "fecha_desde": fecha_desde, "fecha_hasta": fecha_hasta,
        "tipo_estudio_principal": tipo_estudio_principal,
        "tecnologo_id": tecnologo_id, "radiologo_id": radiologo_id,
        "servicio_id": servicio_id, "estudio_id": estudio_id,
        "estado": estado, "rechazada": rechazada,
        "identificacion": identificacion, "nombre_paciente": nombre_paciente,
    }.items() if v}

    per_page = 30
    q = _build_query(db, params).order_by(models.RegistroRayosX.fecha_hora_toma.desc())
    total = q.count()
    registros = q.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = max(1, (total + per_page - 1) // per_page)

    cats = _get_catalogs(db)
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("registros/list.html", {
        "request": request, "user": user, "flash": flash,
        "registros": registros, "params": params,
        "page": page, "total": total, "total_pages": total_pages,
        **cats,
    })


@router.get("/registros/nuevo", response_class=HTMLResponse)
async def nuevo_registro_page(request: Request, response: Response, db: Session = Depends(get_db)):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    if not utils.can_create_registro(user):
        redir2 = RedirectResponse("/registros", status_code=302)
        utils.set_flash(redir2, "error", "No tiene permiso para crear registros.")
        return redir2

    fecha_toma = utils.now_colombia()
    cats = _get_catalogs(db)
    tecnologo_default = user.tecnologo_perfil.id if user.tecnologo_perfil else None
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("registros/form.html", {
        "request": request, "user": user, "flash": flash,
        "registro": None, "fecha_toma": fecha_toma,
        "tecnologo_default": tecnologo_default, "modo": "nuevo", **cats,
    })


@router.post("/registros/nuevo")
async def crear_registro(
    request: Request,
    tipo_estudio_principal: str = Form("RX"),
    fecha_hora_orden: str = Form(...),
    identificacion: str = Form(...),
    nombre_paciente: str = Form(...),
    contrastado_si_no: str = Form("NO"),
    estudio_id: int = Form(...),
    codigo_tac: Optional[str] = Form(None),
    servicio_id: int = Form(...),
    profesional_id: Optional[int] = Form(None),
    numero_tomas: int = Form(...),
    kv: float = Form(...),
    mas: float = Form(...),
    volumen_contraste_ml: Optional[str] = Form(None),
    observaciones_tecnologo: Optional[str] = Form(None),
    tecnologo_id: Optional[int] = Form(None),
    reporte_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    if not utils.can_create_registro(user):
        raise HTTPException(status_code=403)

    vol_ml = None
    if volumen_contraste_ml and volumen_contraste_ml.strip():
        try:
            vol_ml = float(volumen_contraste_ml)
        except ValueError:
            vol_ml = None

    redir_nuevo = RedirectResponse("/registros/nuevo", status_code=303)

    try:
        fecha_orden_dt = datetime.fromisoformat(fecha_hora_orden)
    except ValueError:
        utils.set_flash(redir_nuevo, "error", "Formato de fecha/hora de orden inválido.")
        return redir_nuevo

    fecha_toma = utils.now_colombia()
    if fecha_orden_dt > fecha_toma:
        utils.set_flash(redir_nuevo, "error", "La fecha/hora de la orden no puede ser mayor a la fecha/hora de la toma.")
        return redir_nuevo

    if numero_tomas <= 0:
        utils.set_flash(redir_nuevo, "error", "Número de tomas debe ser mayor a cero.")
        return redir_nuevo
    if not (40 <= kv <= 200):
        utils.set_flash(redir_nuevo, "error", "KV debe estar entre 40 y 200.")
        return redir_nuevo
    if not (1.2 <= mas <= 500):
        utils.set_flash(redir_nuevo, "error", "mAs debe estar entre 1.2 y 500.")
        return redir_nuevo
    if vol_ml is not None and not (30 <= vol_ml <= 200):
        utils.set_flash(redir_nuevo, "error", "Volumen de contraste debe estar entre 30 y 200 ml.")
        return redir_nuevo

    # RECHAZADA y CAUSA_RECHAZO son responsabilidad del radiólogo
    na_causa = db.query(models.CausaRechazo).filter_by(descripcion="NA").first()
    causa_rechazo_id = na_causa.id if na_causa else None

    tipo_upper = (tipo_estudio_principal or "RX").upper()
    # CONTRASTADO solo aplica para TAC
    contrastado = (contrastado_si_no or "NO").upper() if tipo_upper == "TAC" else "NO"
    codigo = utils.generate_codigo_registro(db, tipo_upper)
    registro = models.RegistroRayosX(
        codigo_registro=codigo,
        tipo_estudio_principal=tipo_upper,
        fecha_hora_toma=fecha_toma,
        fecha_hora_orden=fecha_orden_dt,
        identificacion=identificacion.strip(),
        nombre_paciente=nombre_paciente.strip().upper(),
        contrastado_si_no=contrastado,
        estudio_id=estudio_id,
        codigo_tac=codigo_tac.strip() if (codigo_tac and tipo_upper == "TAC") else None,
        servicio_id=servicio_id,
        profesional_id=profesional_id,
        numero_tomas=numero_tomas,
        kv=kv,
        mas=mas,
        volumen_contraste_ml=vol_ml if contrastado == "SI" else None,
        observaciones_tecnologo=observaciones_tecnologo.strip() if observaciones_tecnologo else None,
        rechazada=False,
        causa_rechazo_id=causa_rechazo_id,
        tecnologo_id=tecnologo_id,
        reporte_id=reporte_id,
        estado="PENDIENTE",
        creado_por_id=user.id,
    )
    db.add(registro)
    db.flush()
    utils.log_audit(db, "CREAR", user.id, registro.id, ip=request.client.host if request.client else None)
    db.commit()

    redir_ok = RedirectResponse("/registros", status_code=303)
    utils.set_flash(redir_ok, "success", f"Registro {codigo} creado exitosamente.")
    return redir_ok


@router.get("/registros/{registro_id}", response_class=HTMLResponse)
async def ver_registro(request: Request, response: Response, registro_id: int, db: Session = Depends(get_db)):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("registros/detail.html", {
        "request": request, "user": user, "flash": flash, "registro": registro,
    })


@router.get("/registros/{registro_id}/editar", response_class=HTMLResponse)
async def editar_registro_page(request: Request, response: Response, registro_id: int, db: Session = Depends(get_db)):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)
    if registro.estado == "ANULADO":
        redir2 = RedirectResponse(f"/registros/{registro_id}", status_code=302)
        utils.set_flash(redir2, "error", "No se puede editar un registro anulado.")
        return redir2
    if not utils.can_create_registro(user):
        redir2 = RedirectResponse(f"/registros/{registro_id}", status_code=302)
        utils.set_flash(redir2, "error", "Sin permiso para editar campos del tecnólogo.")
        return redir2
    cats = _get_catalogs(db)
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("registros/form.html", {
        "request": request, "user": user, "flash": flash,
        "registro": registro, "fecha_toma": registro.fecha_hora_toma,
        "tecnologo_default": registro.tecnologo_id, "modo": "editar", **cats,
    })


@router.post("/registros/{registro_id}/editar")
async def editar_registro(
    request: Request,
    registro_id: int,
    tipo_estudio_principal: str = Form("RX"),
    fecha_hora_orden: str = Form(...),
    identificacion: str = Form(...),
    nombre_paciente: str = Form(...),
    contrastado_si_no: str = Form("NO"),
    estudio_id: int = Form(...),
    codigo_tac: Optional[str] = Form(None),
    servicio_id: int = Form(...),
    profesional_id: Optional[int] = Form(None),
    numero_tomas: int = Form(...),
    kv: float = Form(...),
    mas: float = Form(...),
    volumen_contraste_ml: Optional[str] = Form(None),
    observaciones_tecnologo: Optional[str] = Form(None),
    tecnologo_id: Optional[int] = Form(None),
    reporte_id: Optional[int] = Form(None),
    motivo_correccion: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    if not utils.can_create_registro(user):
        raise HTTPException(status_code=403)

    vol_ml_e = None
    if volumen_contraste_ml and volumen_contraste_ml.strip():
        try:
            vol_ml_e = float(volumen_contraste_ml)
        except ValueError:
            vol_ml_e = None

    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)

    redir_edit = RedirectResponse(f"/registros/{registro_id}/editar", status_code=303)

    if utils.is_admin(user) and registro.estado in ("LEIDO", "CORREGIDO") and not motivo_correccion:
        utils.set_flash(redir_edit, "error", "Debe ingresar el motivo de corrección.")
        return redir_edit

    try:
        fecha_orden_dt = datetime.fromisoformat(fecha_hora_orden)
    except ValueError:
        utils.set_flash(redir_edit, "error", "Formato de fecha/hora inválido.")
        return redir_edit

    if fecha_orden_dt > registro.fecha_hora_toma:
        utils.set_flash(redir_edit, "error", "La fecha/hora de la orden no puede ser mayor a la de la toma.")
        return redir_edit

    if numero_tomas <= 0:
        utils.set_flash(redir_edit, "error", "Número de tomas debe ser mayor a cero.")
        return redir_edit
    if not (40 <= kv <= 200):
        utils.set_flash(redir_edit, "error", "KV debe estar entre 40 y 200.")
        return redir_edit
    if not (1.2 <= mas <= 500):
        utils.set_flash(redir_edit, "error", "mAs debe estar entre 1.2 y 500.")
        return redir_edit
    if vol_ml_e is not None and not (30 <= vol_ml_e <= 200):
        utils.set_flash(redir_edit, "error", "Volumen de contraste debe estar entre 30 y 200 ml.")
        return redir_edit

    tipo_upper_e = (tipo_estudio_principal or "RX").upper()
    contrastado_e = (contrastado_si_no or "NO").upper() if tipo_upper_e == "TAC" else "NO"
    registro.tipo_estudio_principal = tipo_upper_e
    registro.fecha_hora_orden = fecha_orden_dt
    registro.identificacion = identificacion.strip()
    registro.nombre_paciente = nombre_paciente.strip().upper()
    registro.contrastado_si_no = contrastado_e
    registro.estudio_id = estudio_id
    registro.codigo_tac = codigo_tac.strip() if (codigo_tac and tipo_upper_e == "TAC") else None
    registro.servicio_id = servicio_id
    registro.profesional_id = profesional_id
    registro.numero_tomas = numero_tomas
    registro.kv = kv
    registro.mas = mas
    registro.volumen_contraste_ml = vol_ml_e if contrastado_e == "SI" else None
    registro.observaciones_tecnologo = observaciones_tecnologo.strip() if observaciones_tecnologo else None
    # RECHAZADA y CAUSA_RECHAZO son del radiólogo — el tecnólogo no los modifica
    registro.tecnologo_id = tecnologo_id
    registro.reporte_id = reporte_id
    registro.modificado_por_id = user.id
    if utils.is_admin(user) and motivo_correccion:
        registro.estado = "CORREGIDO"

    utils.log_audit(db, "MODIFICAR", user.id, registro.id, motivo=motivo_correccion,
                    ip=request.client.host if request.client else None)
    db.commit()

    redir_ok = RedirectResponse(f"/registros/{registro_id}", status_code=303)
    utils.set_flash(redir_ok, "success", "Registro actualizado correctamente.")
    return redir_ok


@router.get("/registros/{registro_id}/lectura", response_class=HTMLResponse)
async def lectura_page(request: Request, response: Response, registro_id: int, db: Session = Depends(get_db)):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    if not utils.can_complete_lectura(user):
        redir2 = RedirectResponse("/registros", status_code=302)
        utils.set_flash(redir2, "error", "Solo el Radiólogo puede completar la lectura.")
        return redir2
    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)
    if registro.estado == "ANULADO":
        redir2 = RedirectResponse(f"/registros/{registro_id}", status_code=302)
        utils.set_flash(redir2, "error", "No se puede completar lectura en un registro anulado.")
        return redir2

    cats = _get_catalogs(db)
    radiologo_default = user.radiologo_perfil.id if user.radiologo_perfil else None
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("registros/lectura.html", {
        "request": request, "user": user, "flash": flash,
        "registro": registro, "radiologo_default": radiologo_default, **cats,
    })


@router.post("/registros/{registro_id}/lectura")
async def guardar_lectura(
    request: Request,
    registro_id: int,
    rechazada: str = Form("NO"),
    causa_rechazo_id: Optional[int] = Form(None),
    radiologo_id: Optional[int] = Form(None),
    transcriptora_id: Optional[int] = Form(None),
    lectura_radiologo: Optional[str] = Form(None),  # OBSERVACION_RADIOLOGO = texto del informe
    db: Session = Depends(get_db),
):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    if not utils.can_complete_lectura(user):
        raise HTTPException(status_code=403)

    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)

    redir_lec = RedirectResponse(f"/registros/{registro_id}/lectura", status_code=303)

    if not radiologo_id:
        utils.set_flash(redir_lec, "error", "Debe seleccionar el Radiólogo (LECTURA_RADIOLOGO).")
        return redir_lec

    es_rechazada = rechazada == "SI"
    na_causa = db.query(models.CausaRechazo).filter_by(descripcion="NA").first()
    if es_rechazada and (causa_rechazo_id is None or (na_causa and causa_rechazo_id == na_causa.id)):
        utils.set_flash(redir_lec, "error", "Debe seleccionar una causa de rechazo válida.")
        return redir_lec
    if not es_rechazada:
        causa_rechazo_id = na_causa.id if na_causa else None

    registro.rechazada = es_rechazada
    registro.causa_rechazo_id = causa_rechazo_id
    registro.radiologo_id = radiologo_id          # LECTURA_RADIOLOGO = nombre del radiólogo
    registro.transcriptora_id = transcriptora_id
    registro.lectura_radiologo = lectura_radiologo  # OBSERVACION_RADIOLOGO = texto del informe
    registro.fecha_hora_lectura_radiologo = utils.now_colombia()
    registro.estado = "LEIDO"
    registro.leido_por_id = user.id
    utils.log_audit(db, "LECTURA", user.id, registro.id, ip=request.client.host if request.client else None)
    db.commit()

    redir_ok = RedirectResponse(f"/registros/{registro_id}", status_code=303)
    utils.set_flash(redir_ok, "success", "Lectura radiológica completada exitosamente.")
    return redir_ok


@router.post("/registros/{registro_id}/anular")
async def anular_registro(
    request: Request,
    registro_id: int,
    motivo_anulacion: str = Form(...),
    db: Session = Depends(get_db),
):
    user, redir = _require_user(request, db)
    if redir:
        return redir
    if not utils.is_admin(user):
        raise HTTPException(status_code=403)
    registro = db.query(models.RegistroRayosX).filter_by(id=registro_id).first()
    if not registro:
        raise HTTPException(status_code=404)
    registro.estado = "ANULADO"
    registro.motivo_anulacion = motivo_anulacion
    registro.modificado_por_id = user.id
    utils.log_audit(db, "ANULAR", user.id, registro.id, motivo=motivo_anulacion,
                    ip=request.client.host if request.client else None)
    db.commit()
    redir_ok = RedirectResponse(f"/registros/{registro_id}", status_code=303)
    utils.set_flash(redir_ok, "success", "Registro anulado correctamente.")
    return redir_ok
