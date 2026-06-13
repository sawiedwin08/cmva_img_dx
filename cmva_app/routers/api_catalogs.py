from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import auth, models, utils

router = APIRouter(prefix="/api/catalogs", tags=["api-catalogs"])


def _require(request: Request, db: Session) -> models.Usuario:
    user = auth.get_api_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return user


def _require_admin(request: Request, db: Session) -> models.Usuario:
    user = _require(request, db)
    if not utils.is_admin(user):
        raise HTTPException(status_code=403, detail="Solo el administrador puede modificar catálogos")
    return user


# ── Lectura (todos los roles autenticados) ─────────────────────────────────

@router.get("/estudios")
async def api_estudios(
    request: Request,
    tipo: Optional[str] = None,
    solo_activos: bool = True,
    db: Session = Depends(get_db),
):
    _require(request, db)
    q = db.query(models.Estudio)
    if solo_activos:
        q = q.filter_by(estado=True)
    if tipo:
        q = q.filter(models.Estudio.tipo == tipo.upper())
    items = q.order_by(models.Estudio.nombre).all()
    return {"items": [
        {"id": i.id, "codigo": i.codigo, "nombre": i.nombre, "tipo": i.tipo,
         "especialidad_id": i.especialidad_id, "estado": i.estado}
        for i in items
    ]}


@router.get("/servicios")
async def api_servicios(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.Servicio).filter_by(estado=True).order_by(models.Servicio.nombre).all()
    return {"items": [{"id": i.id, "codigo": i.codigo, "nombre": i.nombre, "estado": i.estado} for i in items]}


@router.get("/profesionales")
async def api_profesionales(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.Profesional).filter_by(estado=True).order_by(models.Profesional.nombre).all()
    return {"items": [{"id": i.id, "nombre": i.nombre, "tipo": i.tipo, "estado": i.estado} for i in items]}


@router.get("/tecnologos")
async def api_tecnologos(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.Tecnologo).filter_by(estado=True).order_by(models.Tecnologo.nombre).all()
    return {"items": [{"id": i.id, "nombre": i.nombre, "estado": i.estado} for i in items]}


@router.get("/radiologos")
async def api_radiologos(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.Radiologo).filter_by(estado=True).order_by(models.Radiologo.nombre).all()
    return {"items": [
        {"id": i.id, "nombre": i.nombre, "estado": i.estado,
         "especialidad_id": i.especialidad_id,
         "especialidad": i.especialidad.nombre if i.especialidad else None}
        for i in items
    ]}


@router.get("/transcriptoras")
async def api_transcriptoras(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.Transcriptora).filter_by(estado=True).order_by(models.Transcriptora.nombre).all()
    return {"items": [{"id": i.id, "nombre": i.nombre, "estado": i.estado} for i in items]}


@router.get("/reportes")
async def api_reportes(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.Reporte).filter_by(estado=True).order_by(models.Reporte.nombre).all()
    return {"items": [{"id": i.id, "nombre": i.nombre, "estado": i.estado} for i in items]}


@router.get("/causas-rechazo")
async def api_causas_rechazo(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.CausaRechazo).filter_by(estado=True).all()
    return {"items": [{"id": i.id, "descripcion": i.descripcion, "estado": i.estado} for i in items]}


@router.get("/especialidades")
async def api_especialidades(request: Request, db: Session = Depends(get_db)):
    _require(request, db)
    items = db.query(models.Especialidad).filter_by(estado=True).order_by(models.Especialidad.nombre).all()
    return {"items": [
        {"id": i.id, "nombre": i.nombre, "descripcion": i.descripcion, "estado": i.estado}
        for i in items
    ]}


@router.get("/all")
async def api_all_catalogs(request: Request, db: Session = Depends(get_db)):
    """Retorna todos los catálogos necesarios para los formularios en una sola llamada."""
    _require(request, db)
    return {
        "estudios": [
            {"id": i.id, "codigo": i.codigo, "nombre": i.nombre, "tipo": i.tipo}
            for i in db.query(models.Estudio).filter_by(estado=True).order_by(models.Estudio.nombre).all()
        ],
        "servicios": [
            {"id": i.id, "nombre": i.nombre}
            for i in db.query(models.Servicio).filter_by(estado=True).order_by(models.Servicio.nombre).all()
        ],
        "profesionales": [
            {"id": i.id, "nombre": i.nombre, "tipo": i.tipo}
            for i in db.query(models.Profesional).filter_by(estado=True).order_by(models.Profesional.nombre).all()
        ],
        "tecnologos": [
            {"id": i.id, "nombre": i.nombre}
            for i in db.query(models.Tecnologo).filter_by(estado=True).order_by(models.Tecnologo.nombre).all()
        ],
        "radiologos": [
            {"id": i.id, "nombre": i.nombre}
            for i in db.query(models.Radiologo).filter_by(estado=True).order_by(models.Radiologo.nombre).all()
        ],
        "transcriptoras": [
            {"id": i.id, "nombre": i.nombre}
            for i in db.query(models.Transcriptora).filter_by(estado=True).order_by(models.Transcriptora.nombre).all()
        ],
        "reportes": [
            {"id": i.id, "nombre": i.nombre}
            for i in db.query(models.Reporte).filter_by(estado=True).order_by(models.Reporte.nombre).all()
        ],
        "causas_rechazo": [
            {"id": i.id, "descripcion": i.descripcion}
            for i in db.query(models.CausaRechazo).filter_by(estado=True).all()
        ],
        "especialidades": [
            {"id": i.id, "nombre": i.nombre}
            for i in db.query(models.Especialidad).filter_by(estado=True).order_by(models.Especialidad.nombre).all()
        ],
    }


# ── CRUD admin (solo ADMINISTRADOR) ───────────────────────────────────────

_CATALOG_MAP = {
    "estudios":       (models.Estudio,       ["codigo", "nombre"],        ["especialidad_id"], ["RX", "TAC", "ECO"]),
    "servicios":      (models.Servicio,       ["codigo", "nombre"],        [],                  None),
    "causas-rechazo": (models.CausaRechazo,   ["descripcion"],             [],                  None),
    "reportes":       (models.Reporte,        ["nombre"],                  [],                  None),
    "especialidades": (models.Especialidad,   ["nombre", "descripcion"],   [],                  None),
    "profesionales":  (models.Profesional,    ["nombre"],                  [],                  ["MEDICO GENERAL", "ESPECIALISTA"]),
    "tecnologos":     (models.Tecnologo,      ["nombre"],                  [],                  None),
    "radiologos":     (models.Radiologo,      ["nombre"],                  ["especialidad_id"], None),
    "transcriptoras": (models.Transcriptora,  ["nombre"],                  [],                  None),
}


class CatalogItemBody(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    especialidad_id: Optional[int] = None
    tipo: Optional[str] = None
    estado: Optional[bool] = None


@router.post("/{catalog}")
async def api_create_catalog_item(
    request: Request,
    catalog: str,
    body: CatalogItemBody,
    db: Session = Depends(get_db),
):
    _require_admin(request, db)
    if catalog not in _CATALOG_MAP:
        raise HTTPException(status_code=404, detail=f"Catálogo '{catalog}' no encontrado")
    model, fields, extra_fields, tipo_options = _CATALOG_MAP[catalog]
    kwargs = {}
    for f in fields:
        val = getattr(body, f, None)
        if val is None and f in ("nombre", "descripcion"):
            raise HTTPException(status_code=422, detail=f"El campo '{f}' es obligatorio")
        if val is not None:
            kwargs[f] = val.upper() if f == "nombre" else val
    for f in extra_fields:
        val = getattr(body, f, None)
        kwargs[f] = val
    if tipo_options and body.tipo:
        t = body.tipo.upper()
        if t in [x.upper() for x in tipo_options]:
            kwargs["tipo"] = t
        else:
            kwargs["tipo"] = tipo_options[0]
    db.add(model(**kwargs))
    db.commit()
    return {"ok": True}


@router.put("/{catalog}/{item_id}")
async def api_update_catalog_item(
    request: Request,
    catalog: str,
    item_id: int,
    body: CatalogItemBody,
    db: Session = Depends(get_db),
):
    _require_admin(request, db)
    if catalog not in _CATALOG_MAP:
        raise HTTPException(status_code=404)
    model, fields, extra_fields, tipo_options = _CATALOG_MAP[catalog]
    item = db.query(model).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    for f in fields:
        val = getattr(body, f, None)
        if val is not None:
            setattr(item, f, val)
    for f in extra_fields:
        val = getattr(body, f, None)
        if val is not None:
            setattr(item, f, val)
    if tipo_options and body.tipo:
        t = body.tipo.upper()
        if t in [x.upper() for x in tipo_options]:
            item.tipo = t
    if body.estado is not None:
        item.estado = body.estado
    db.commit()
    return {"ok": True}


@router.post("/{catalog}/{item_id}/toggle")
async def api_toggle_catalog_item(
    request: Request,
    catalog: str,
    item_id: int,
    db: Session = Depends(get_db),
):
    _require_admin(request, db)
    if catalog not in _CATALOG_MAP:
        raise HTTPException(status_code=404)
    model = _CATALOG_MAP[catalog][0]
    item = db.query(model).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    item.estado = not item.estado
    db.commit()
    return {"estado": item.estado}
