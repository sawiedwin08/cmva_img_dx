from fastapi import APIRouter, Request, Depends, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
import auth, models, utils
from templates_config import templates

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    response: Response,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    tipo_estudio_principal: Optional[str] = None,
    tecnologo_id: Optional[str] = None,
    radiologo_id: Optional[str] = None,
    servicio_id: Optional[str] = None,
    estudio_id: Optional[str] = None,
    rechazada: Optional[str] = None,
    db: Session = Depends(get_db),
):
    user = auth.get_current_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    if not utils.can_view_dashboard(user):
        return RedirectResponse("/registros", status_code=302)

    q = db.query(models.RegistroRayosX).filter(models.RegistroRayosX.estado != "ANULADO")

    if fecha_desde:
        try:
            q = q.filter(models.RegistroRayosX.fecha_hora_toma >= datetime.strptime(fecha_desde, "%Y-%m-%d"))
        except ValueError:
            pass
    if fecha_hasta:
        try:
            dt = datetime.strptime(fecha_hasta, "%Y-%m-%d") + timedelta(days=1)
            q = q.filter(models.RegistroRayosX.fecha_hora_toma < dt)
        except ValueError:
            pass
    if tipo_estudio_principal:
        q = q.filter(models.RegistroRayosX.tipo_estudio_principal == tipo_estudio_principal)
    if tecnologo_id:
        q = q.filter(models.RegistroRayosX.tecnologo_id == int(tecnologo_id))
    if radiologo_id:
        q = q.filter(models.RegistroRayosX.radiologo_id == int(radiologo_id))
    if servicio_id:
        q = q.filter(models.RegistroRayosX.servicio_id == int(servicio_id))
    if estudio_id:
        q = q.filter(models.RegistroRayosX.estudio_id == int(estudio_id))
    if rechazada in ("SI", "NO"):
        q = q.filter(models.RegistroRayosX.rechazada == (rechazada == "SI"))

    all_regs = q.all()
    total = len(all_regs)
    pendientes = sum(1 for r in all_regs if r.estado == "PENDIENTE")
    leidos = sum(1 for r in all_regs if r.estado == "LEIDO")
    rechazados = sum(1 for r in all_regs if r.rechazada)
    pct_rechazados = round(rechazados / total * 100, 1) if total else 0

    # KPIs por tipo de estudio (sin filtro de tipo aplicado para el resumen global)
    q_global = db.query(models.RegistroRayosX).filter(models.RegistroRayosX.estado != "ANULADO")
    if fecha_desde:
        try:
            q_global = q_global.filter(models.RegistroRayosX.fecha_hora_toma >= datetime.strptime(fecha_desde, "%Y-%m-%d"))
        except ValueError:
            pass
    if fecha_hasta:
        try:
            dt2 = datetime.strptime(fecha_hasta, "%Y-%m-%d") + timedelta(days=1)
            q_global = q_global.filter(models.RegistroRayosX.fecha_hora_toma < dt2)
        except ValueError:
            pass
    global_regs = q_global.all()
    rx_total = sum(1 for r in global_regs if (r.tipo_estudio_principal or 'RX') == 'RX')
    tac_total = sum(1 for r in global_regs if (r.tipo_estudio_principal or '') == 'TAC')
    eco_total = sum(1 for r in global_regs if (r.tipo_estudio_principal or '') == 'ECO')

    # Por tipo de estudio principal
    por_tipo = {"RX": rx_total, "TAC": tac_total, "ECO": eco_total}
    por_tipo_items = sorted(por_tipo.items(), key=lambda x: x[1], reverse=True)

    # Por servicio
    por_servicio = {}
    for r in all_regs:
        key = r.servicio.nombre if r.servicio else "SIN SERVICIO"
        por_servicio[key] = por_servicio.get(key, 0) + 1
    por_servicio = sorted(por_servicio.items(), key=lambda x: x[1], reverse=True)

    # Por estudio (top 10)
    por_estudio = {}
    for r in all_regs:
        key = r.estudio.nombre if r.estudio else "SIN ESTUDIO"
        por_estudio[key] = por_estudio.get(key, 0) + 1
    por_estudio = sorted(por_estudio.items(), key=lambda x: x[1], reverse=True)[:10]

    # Por tecnólogo
    por_tecnologo = {}
    for r in all_regs:
        key = r.tecnologo.nombre if r.tecnologo else "SIN TECNÓLOGO"
        por_tecnologo[key] = por_tecnologo.get(key, 0) + 1
    por_tecnologo = sorted(por_tecnologo.items(), key=lambda x: x[1], reverse=True)

    # Por radiólogo
    por_radiologo = {}
    for r in all_regs:
        if r.radiologo:
            key = r.radiologo.nombre
            por_radiologo[key] = por_radiologo.get(key, 0) + 1
    por_radiologo = sorted(por_radiologo.items(), key=lambda x: x[1], reverse=True)

    def _fd(dt):
        return dt.strftime("%d/%m/%Y") if dt else "—"

    registros_list = [{
        "id": r.id,
        "codigo": r.codigo_registro or f"#{r.id}",
        "fecha": _fd(r.fecha_hora_toma),
        "paciente": r.nombre_paciente or "—",
        "tipo": r.tipo_estudio_principal or "RX",
        "estudio": r.estudio.nombre if r.estudio else "—",
        "servicio": r.servicio.nombre if r.servicio else "—",
        "tecnologo": r.tecnologo.nombre if r.tecnologo else "—",
        "estado": r.estado or "PENDIENTE",
        "rechazada": bool(r.rechazada),
    } for r in all_regs]

    cats = {
        "tecnologos": db.query(models.Tecnologo).filter_by(estado=True).all(),
        "radiologos": db.query(models.Radiologo).filter_by(estado=True).all(),
        "servicios": db.query(models.Servicio).filter_by(estado=True).all(),
        "estudios": db.query(models.Estudio).filter_by(estado=True).all(),
    }

    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("dashboard.html", {
        "request": request, "user": user, "flash": flash,
        "total": total, "pendientes": pendientes, "leidos": leidos,
        "rechazados": rechazados, "pct_rechazados": pct_rechazados,
        "rx_total": rx_total, "tac_total": tac_total, "eco_total": eco_total,
        "por_tipo": por_tipo_items,
        "por_servicio": por_servicio, "por_estudio": por_estudio,
        "por_tecnologo": por_tecnologo, "por_radiologo": por_radiologo,
        "registros_list": registros_list,
        "params": {
            "fecha_desde": fecha_desde or "", "fecha_hasta": fecha_hasta or "",
            "tipo_estudio_principal": tipo_estudio_principal or "",
            "tecnologo_id": tecnologo_id or "", "radiologo_id": radiologo_id or "",
            "servicio_id": servicio_id or "", "estudio_id": estudio_id or "",
            "rechazada": rechazada or "",
        },
        **cats,
    })
