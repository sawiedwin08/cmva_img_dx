from fastapi import APIRouter, Request, Depends, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
import auth, models, utils
from templates_config import templates

router = APIRouter(prefix="/auditoria", tags=["auditoria"])


@router.get("/", response_class=HTMLResponse)
async def auditoria(
    request: Request,
    response: Response,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    usuario_id: Optional[str] = None,
    accion: Optional[str] = None,
    registro_id: Optional[str] = None,
    page: int = 1,
    db: Session = Depends(get_db),
):
    user = auth.get_current_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    if not utils.can_view_auditoria(user):
        return RedirectResponse("/registros", status_code=302)

    q = db.query(models.AuditoriaRegistro).order_by(models.AuditoriaRegistro.fecha_hora.desc())

    if fecha_desde:
        try:
            q = q.filter(models.AuditoriaRegistro.fecha_hora >= datetime.strptime(fecha_desde, "%Y-%m-%d"))
        except ValueError:
            pass
    if fecha_hasta:
        try:
            dt = datetime.strptime(fecha_hasta, "%Y-%m-%d") + timedelta(days=1)
            q = q.filter(models.AuditoriaRegistro.fecha_hora < dt)
        except ValueError:
            pass
    if usuario_id:
        q = q.filter(models.AuditoriaRegistro.usuario_id == int(usuario_id))
    if accion:
        q = q.filter(models.AuditoriaRegistro.accion == accion)
    if registro_id:
        q = q.filter(models.AuditoriaRegistro.registro_id == int(registro_id))

    per_page = 50
    total = q.count()
    entries = q.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page

    usuarios = db.query(models.Usuario).order_by(models.Usuario.nombre_completo).all()
    acciones = ["CREAR", "MODIFICAR", "LECTURA", "ANULAR", "CORREGIR", "INTENTO_NO_AUTORIZADO"]

    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("auditoria.html", {
        "request": request, "user": user, "flash": flash,
        "entries": entries, "page": page, "total": total, "total_pages": total_pages,
        "usuarios": usuarios, "acciones": acciones,
        "params": {
            "fecha_desde": fecha_desde or "", "fecha_hasta": fecha_hasta or "",
            "usuario_id": usuario_id or "", "accion": accion or "", "registro_id": registro_id or "",
        },
    })
