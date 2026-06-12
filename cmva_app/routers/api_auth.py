from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import auth, models

router = APIRouter(prefix="/api/auth", tags=["api-auth"])


class LoginBody(BaseModel):
    usuario: str
    password: str


def _user_dict(user: models.Usuario) -> dict:
    return {
        "id": user.id,
        "nombre_completo": user.nombre_completo,
        "usuario": user.usuario,
        "rol": user.rol.nombre,
        "correo": user.correo,
        "tipo_documento": user.tipo_documento,
        "numero_documento": user.numero_documento,
    }


@router.post("/login")
async def api_login(body: LoginBody, response: Response, db: Session = Depends(get_db)):
    user = (
        db.query(models.Usuario)
        .filter_by(usuario=body.usuario.lower().strip(), estado=True)
        .first()
    )
    if not user or not auth.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = auth.create_token(user.id)
    # Cookie para compatibilidad con Jinja2 + Bearer para React
    response.set_cookie(
        "access_token", token,
        httponly=True, max_age=36000, samesite="lax",
    )
    return {"token": token, "user": _user_dict(user)}


@router.post("/logout")
async def api_logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}


@router.get("/me")
async def api_me(request: Request, db: Session = Depends(get_db)):
    user = auth.get_api_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return _user_dict(user)
