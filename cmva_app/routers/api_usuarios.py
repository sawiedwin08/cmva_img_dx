from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import auth, models, utils

router = APIRouter(prefix="/api/usuarios", tags=["api-usuarios"])


def _require_admin(request: Request, db: Session) -> models.Usuario:
    user = auth.get_api_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    if not utils.is_admin(user):
        raise HTTPException(status_code=403, detail="Solo el administrador puede gestionar usuarios")
    return user


def _user_dict(u: models.Usuario) -> dict:
    return {
        "id": u.id,
        "nombre_completo": u.nombre_completo,
        "usuario": u.usuario,
        "correo": u.correo,
        "tipo_documento": u.tipo_documento,
        "numero_documento": u.numero_documento,
        "rol_id": u.rol_id,
        "rol": u.rol.nombre if u.rol else None,
        "estado": u.estado,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.get("")
async def api_list_usuarios(request: Request, db: Session = Depends(get_db)):
    _require_admin(request, db)
    usuarios = db.query(models.Usuario).order_by(models.Usuario.id.desc()).all()
    roles = db.query(models.Rol).filter_by(estado=True).all()
    return {
        "usuarios": [_user_dict(u) for u in usuarios],
        "roles": [{"id": r.id, "nombre": r.nombre} for r in roles],
    }


class UsuarioCreateBody(BaseModel):
    nombre_completo: str
    usuario: str
    password: str
    rol_id: int
    correo: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None


@router.post("")
async def api_crear_usuario(
    request: Request,
    body: UsuarioCreateBody,
    db: Session = Depends(get_db),
):
    _require_admin(request, db)
    login = body.usuario.lower().strip()
    if db.query(models.Usuario).filter_by(usuario=login).first():
        raise HTTPException(status_code=422, detail=f"El usuario '{login}' ya existe")
    u = models.Usuario(
        nombre_completo=body.nombre_completo.strip().upper(),
        usuario=login,
        password_hash=auth.hash_password(body.password),
        rol_id=body.rol_id,
        correo=body.correo or None,
        tipo_documento=body.tipo_documento or None,
        numero_documento=body.numero_documento or None,
        estado=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return _user_dict(u)


class UsuarioUpdateBody(BaseModel):
    nombre_completo: str
    rol_id: int
    correo: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    nuevo_password: Optional[str] = None


@router.put("/{usuario_id}")
async def api_editar_usuario(
    request: Request,
    usuario_id: int,
    body: UsuarioUpdateBody,
    db: Session = Depends(get_db),
):
    _require_admin(request, db)
    u = db.query(models.Usuario).filter_by(id=usuario_id).first()
    if not u:
        raise HTTPException(status_code=404)
    u.nombre_completo = body.nombre_completo.strip().upper()
    u.rol_id = body.rol_id
    u.correo = body.correo or None
    u.tipo_documento = body.tipo_documento or None
    u.numero_documento = body.numero_documento or None
    if body.nuevo_password:
        u.password_hash = auth.hash_password(body.nuevo_password)
    db.commit()
    db.refresh(u)
    return _user_dict(u)


@router.post("/{usuario_id}/toggle")
async def api_toggle_usuario(
    request: Request,
    usuario_id: int,
    db: Session = Depends(get_db),
):
    admin = _require_admin(request, db)
    u = db.query(models.Usuario).filter_by(id=usuario_id).first()
    if not u:
        raise HTTPException(status_code=404)
    if u.id == admin.id:
        raise HTTPException(status_code=422, detail="No puede inactivar su propio usuario")
    u.estado = not u.estado
    db.commit()
    db.refresh(u)
    return _user_dict(u)


@router.get("/roles")
async def api_roles(request: Request, db: Session = Depends(get_db)):
    _require_admin(request, db)
    roles = db.query(models.Rol).filter_by(estado=True).all()
    return {"roles": [{"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion} for r in roles]}
