from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
import auth, models, utils

router = APIRouter(prefix="/api/dashboard", tags=["api-dashboard"])


@router.get("")
async def api_dashboard(
    request: Request,
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
    user = auth.get_api_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    if not utils.can_view_dashboard(user):
        raise HTTPException(status_code=403, detail="Sin permiso para ver el dashboard")

    def _apply_date_filters(q):
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
        return q

    q = db.query(models.RegistroRayosX).filter(models.RegistroRayosX.estado != "ANULADO")
    q = _apply_date_filters(q)
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
    rechazados_count = sum(1 for r in all_regs if r.rechazada)

    # KPIs globales por tipo (sin filtro de tipo para no distorsionar el resumen)
    q_global = db.query(models.RegistroRayosX).filter(models.RegistroRayosX.estado != "ANULADO")
    q_global = _apply_date_filters(q_global)
    global_regs = q_global.all()
    rx_total  = sum(1 for r in global_regs if (r.tipo_estudio_principal or "RX") == "RX")
    tac_total = sum(1 for r in global_regs if (r.tipo_estudio_principal or "") == "TAC")
    eco_total = sum(1 for r in global_regs if (r.tipo_estudio_principal or "") == "ECO")

    def _agg(regs, key_fn):
        result = {}
        for r in regs:
            k = key_fn(r)
            if k:
                result[k] = result.get(k, 0) + 1
        return sorted([{"nombre": k, "count": v} for k, v in result.items()], key=lambda x: x["count"], reverse=True)

    por_servicio   = _agg(all_regs, lambda r: r.servicio.nombre if r.servicio else "SIN SERVICIO")
    por_estudio    = _agg(all_regs, lambda r: r.estudio.nombre if r.estudio else "SIN ESTUDIO")[:10]
    por_tecnologo  = _agg(all_regs, lambda r: r.tecnologo.nombre if r.tecnologo else "SIN TECNÓLOGO")
    por_radiologo  = _agg(all_regs, lambda r: r.radiologo.nombre if r.radiologo else None)

    registros_list = [{
        "id": r.id,
        "codigo": r.codigo_registro or f"#{r.id}",
        "fecha": r.fecha_hora_toma.isoformat() if r.fecha_hora_toma else None,
        "paciente": r.nombre_paciente or "—",
        "tipo": r.tipo_estudio_principal or "RX",
        "estudio": r.estudio.nombre if r.estudio else "—",
        "servicio": r.servicio.nombre if r.servicio else "—",
        "tecnologo": r.tecnologo.nombre if r.tecnologo else "—",
        "estado": r.estado or "PENDIENTE",
        "rechazada": bool(r.rechazada),
    } for r in all_regs]

    return {
        "kpis": {
            "total": total,
            "pendientes": pendientes,
            "leidos": leidos,
            "rechazados": rechazados_count,
            "pct_rechazados": round(rechazados_count / total * 100, 1) if total else 0,
            "rx_total": rx_total,
            "tac_total": tac_total,
            "eco_total": eco_total,
        },
        "por_tipo": [
            {"tipo": "RX",  "nombre": "Rayos X",    "count": rx_total},
            {"tipo": "TAC", "nombre": "TAC",         "count": tac_total},
            {"tipo": "ECO", "nombre": "Ecografía",   "count": eco_total},
        ],
        "por_servicio":  por_servicio,
        "por_estudio":   por_estudio,
        "por_tecnologo": por_tecnologo,
        "por_radiologo": por_radiologo,
        "registros":     registros_list,
    }
