from fastapi import APIRouter, Request, Depends, HTTPException, Response, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import auth, models, utils
from templates_config import templates

router = APIRouter(prefix="/catalogos", tags=["catalogos"])

# Catálogos que usan la vista personalizada de personal (usuario + perfil)
PERSONAL_CATALOGS = {
    "radiologos": {
        "model": models.Radiologo,
        "rol_nombre": utils.ROL_RAD,
        "titulo": "Radiólogos",
        "icono": "stethoscope",
        "con_especialidad": True,
    },
    "tecnologos": {
        "model": models.Tecnologo,
        "rol_nombre": utils.ROL_TEC,
        "titulo": "Tecnólogos",
        "icono": "user-nurse",
        "con_especialidad": False,
    },
    "transcriptoras": {
        "model": models.Transcriptora,
        "rol_nombre": None,
        "titulo": "Transcriptoras",
        "icono": "keyboard",
        "con_especialidad": False,
    },
}


def _get_user_admin(request, db):
    user = auth.get_current_user(request, db)
    if not user:
        return None, RedirectResponse("/login", status_code=302)
    if not utils.is_admin(user):
        return None, RedirectResponse("/registros", status_code=302)
    return user, None


CATALOG_CONFIG = {
    "estudios": {
        "model": models.Estudio,
        "title": "Estudios Radiológicos",
        "fields": ["codigo", "nombre"],
        "extra_fields": ["especialidad_id"],
        "tipo_options": ["RX", "TAC", "ECO"],
    },
    "servicios": {"model": models.Servicio, "title": "Servicios", "fields": ["codigo", "nombre"], "extra_fields": []},
    "causas-rechazo": {"model": models.CausaRechazo, "title": "Causas de Rechazo", "fields": ["descripcion"], "extra_fields": []},
    "tecnologos": {"model": models.Tecnologo, "title": "Tecnólogos", "fields": ["nombre"], "extra_fields": []},
    "radiologos": {"model": models.Radiologo, "title": "Radiólogos", "fields": ["nombre"], "extra_fields": ["especialidad_id"]},
    "transcriptoras": {"model": models.Transcriptora, "title": "Transcriptoras", "fields": ["nombre"], "extra_fields": []},
    "reportes": {"model": models.Reporte, "title": "Reportes", "fields": ["nombre"], "extra_fields": []},
    "especialidades": {"model": models.Especialidad, "title": "Especialidades", "fields": ["nombre", "descripcion"], "extra_fields": []},
    "profesionales": {
        "model": models.Profesional,
        "title": "Profesionales (Médicos)",
        "fields": ["nombre"],
        "extra_fields": [],
        "tipo_options": ["MEDICO GENERAL", "ESPECIALISTA"],
    },
}


@router.get("/", response_class=HTMLResponse)
async def catalogs_index(request: Request, response: Response, db: Session = Depends(get_db)):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("catalogs/index.html", {"request": request, "user": user, "flash": flash})


@router.post("/{catalog}/nuevo")
async def create_catalog_item(request: Request, catalog: str, db: Session = Depends(get_db)):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    if catalog not in CATALOG_CONFIG:
        raise HTTPException(status_code=404)
    cfg = CATALOG_CONFIG[catalog]
    form_data = await request.form()
    redir_back = RedirectResponse(f"/catalogos/{catalog}", status_code=303)
    kwargs = {}
    for field in cfg["fields"]:
        val = str(form_data.get(field, "")).strip()
        if not val and field in ("nombre", "descripcion"):
            utils.set_flash(redir_back, "error", f"El campo '{field}' es obligatorio.")
            return redir_back
        kwargs[field] = val.upper() if field == "nombre" else val
    for field in cfg.get("extra_fields", []):
        val = form_data.get(field)
        kwargs[field] = int(val) if val else None
    # Manejar campo tipo cuando el catálogo tiene tipo_options
    if cfg.get("tipo_options"):
        tipo_val = str(form_data.get("tipo", "")).strip().upper()
        if not tipo_val or tipo_val not in [t.upper() for t in cfg["tipo_options"]]:
            tipo_val = cfg["tipo_options"][0]
        kwargs["tipo"] = tipo_val
    db.add(cfg["model"](**kwargs))
    db.commit()
    utils.set_flash(redir_back, "success", "Registro creado exitosamente.")
    return redir_back


@router.post("/{catalog}/{item_id}/editar")
async def edit_catalog_item(request: Request, catalog: str, item_id: int, db: Session = Depends(get_db)):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    if catalog not in CATALOG_CONFIG:
        raise HTTPException(status_code=404)
    cfg = CATALOG_CONFIG[catalog]
    item = db.query(cfg["model"]).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    form_data = await request.form()
    for field in cfg["fields"]:
        val = str(form_data.get(field, "")).strip()
        if val:
            setattr(item, field, val)
    for field in cfg.get("extra_fields", []):
        val = form_data.get(field)
        setattr(item, field, int(val) if val else None)
    if cfg.get("tipo_options"):
        tipo_val = str(form_data.get("tipo", "")).strip().upper()
        if tipo_val and tipo_val in [t.upper() for t in cfg["tipo_options"]]:
            item.tipo = tipo_val
    db.commit()
    redir_ok = RedirectResponse(f"/catalogos/{catalog}", status_code=303)
    utils.set_flash(redir_ok, "success", "Registro actualizado.")
    return redir_ok


@router.post("/{catalog}/{item_id}/toggle")
async def toggle_catalog_item(request: Request, catalog: str, item_id: int, db: Session = Depends(get_db)):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    if catalog not in CATALOG_CONFIG:
        raise HTTPException(status_code=404)
    cfg = CATALOG_CONFIG[catalog]
    item = db.query(cfg["model"]).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    item.estado = not item.estado
    db.commit()
    redir_ok = RedirectResponse(f"/catalogos/{catalog}", status_code=303)
    utils.set_flash(redir_ok, "success", "Estado actualizado.")
    return redir_ok


# ── Catálogos de personal (Radiólogos / Tecnólogos / Transcriptoras) ──────────

@router.get("/{catalog}", response_class=HTMLResponse)
async def list_catalog(request: Request, response: Response, catalog: str, db: Session = Depends(get_db)):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    # Vista personalizada para catálogos de personal
    if catalog in PERSONAL_CATALOGS:
        cfg = PERSONAL_CATALOGS[catalog]
        items = db.query(cfg["model"]).order_by(cfg["model"].nombre).all()
        especialidades = db.query(models.Especialidad).filter_by(estado=True).all() if cfg["con_especialidad"] else []
        flash = utils.get_flash(request, response)
        return templates.TemplateResponse("catalogs/personal.html", {
            "request": request, "user": user, "flash": flash,
            "items": items, "catalog": catalog,
            "titulo": cfg["titulo"], "icono": cfg["icono"],
            "con_especialidad": cfg["con_especialidad"],
            "especialidades": especialidades,
        })
    if catalog not in CATALOG_CONFIG:
        raise HTTPException(status_code=404)
    cfg = CATALOG_CONFIG[catalog]
    items = db.query(cfg["model"]).order_by(cfg["model"].id.desc()).all()
    especialidades = db.query(models.Especialidad).filter_by(estado=True).all()
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("catalogs/list.html", {
        "request": request, "user": user, "flash": flash,
        "items": items, "catalog": catalog, "cfg": cfg, "especialidades": especialidades,
    })


@router.post("/{catalog}/nuevo-personal")
async def crear_personal(
    request: Request,
    catalog: str,
    nombre_completo: str = Form(...),
    usuario_login: str = Form(...),
    password: str = Form(...),
    tipo_documento: Optional[str] = Form(None),
    numero_documento: Optional[str] = Form(None),
    correo: Optional[str] = Form(None),
    especialidad_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    redir_back = RedirectResponse(f"/catalogos/{catalog}", status_code=303)
    if catalog not in PERSONAL_CATALOGS:
        raise HTTPException(status_code=404)

    if db.query(models.Usuario).filter_by(usuario=usuario_login.strip().lower()).first():
        utils.set_flash(redir_back, "error", f"El usuario '{usuario_login}' ya existe.")
        return redir_back

    cfg = PERSONAL_CATALOGS[catalog]
    nombre = nombre_completo.strip().upper()

    nuevo_usuario = None
    if cfg["rol_nombre"]:
        rol = db.query(models.Rol).filter_by(nombre=cfg["rol_nombre"]).first()
        if rol:
            nuevo_usuario = models.Usuario(
                nombre_completo=nombre,
                usuario=usuario_login.strip().lower(),
                tipo_documento=tipo_documento or None,
                numero_documento=numero_documento or None,
                correo=correo or None,
                password_hash=auth.hash_password(password),
                rol_id=rol.id,
                especialidad_id=especialidad_id or None,
                estado=True,
            )
            db.add(nuevo_usuario)
            db.flush()

    kwargs = {"nombre": nombre, "estado": True}
    if nuevo_usuario:
        kwargs["usuario_id"] = nuevo_usuario.id
    if catalog == "radiologos":
        kwargs["especialidad_id"] = especialidad_id or None

    db.add(cfg["model"](**kwargs))
    db.commit()
    utils.set_flash(redir_back, "success", "Registro creado correctamente.")
    return redir_back


@router.post("/{catalog}/{item_id}/editar-personal")
async def editar_personal(
    request: Request,
    catalog: str,
    item_id: int,
    nombre_completo: str = Form(...),
    tipo_documento: Optional[str] = Form(None),
    numero_documento: Optional[str] = Form(None),
    correo: Optional[str] = Form(None),
    nuevo_password: Optional[str] = Form(None),
    especialidad_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    if catalog not in PERSONAL_CATALOGS:
        raise HTTPException(status_code=404)
    cfg = PERSONAL_CATALOGS[catalog]
    item = db.query(cfg["model"]).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404)

    nombre = nombre_completo.strip().upper()
    item.nombre = nombre
    if catalog == "radiologos":
        item.especialidad_id = especialidad_id or None

    if item.usuario:
        item.usuario.nombre_completo = nombre
        item.usuario.tipo_documento = tipo_documento or None
        item.usuario.numero_documento = numero_documento or None
        item.usuario.correo = correo or None
        if nuevo_password:
            item.usuario.password_hash = auth.hash_password(nuevo_password)

    db.commit()
    redir_ok = RedirectResponse(f"/catalogos/{catalog}", status_code=303)
    utils.set_flash(redir_ok, "success", "Registro actualizado.")
    return redir_ok


@router.post("/{catalog}/{item_id}/toggle-personal")
async def toggle_personal(request: Request, catalog: str, item_id: int, db: Session = Depends(get_db)):
    user, redir = _get_user_admin(request, db)
    if redir:
        return redir
    if catalog not in PERSONAL_CATALOGS:
        raise HTTPException(status_code=404)
    cfg = PERSONAL_CATALOGS[catalog]
    item = db.query(cfg["model"]).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    item.estado = not item.estado
    if item.usuario:
        item.usuario.estado = item.estado
    db.commit()
    redir_ok = RedirectResponse(f"/catalogos/{catalog}", status_code=303)
    estado_txt = "activado" if item.estado else "inactivado"
    utils.set_flash(redir_ok, "success", f"Registro {estado_txt}.")
    return redir_ok
