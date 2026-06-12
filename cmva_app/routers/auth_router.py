from fastapi import APIRouter, Request, Form, Depends, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
import auth, models, utils
from templates_config import templates

router = APIRouter(tags=["auth"])


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, response: Response, db: Session = Depends(get_db)):
    user = auth.get_current_user(request, db)
    if user:
        return RedirectResponse("/registros", status_code=302)
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse("login.html", {"request": request, "flash": flash})


@router.post("/login")
async def login(
    request: Request,
    usuario: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.Usuario).filter_by(usuario=usuario, estado=True).first()
    if not user or not auth.verify_password(password, user.password_hash):
        redir = RedirectResponse("/login", status_code=303)
        utils.set_flash(redir, "error", "Usuario o contraseña incorrectos.")
        return redir
    token = auth.create_token(user.id)
    # Radiólogo va directo a sus pendientes
    destino = "/registros?estado=PENDIENTE" if user.rol.nombre == "RADIÓLOGO" else "/registros"
    redir = RedirectResponse(destino, status_code=303)
    redir.set_cookie("access_token", token, httponly=True, max_age=36000, samesite="lax")
    return redir


@router.get("/logout")
async def logout(request: Request):
    response = RedirectResponse("/login", status_code=302)
    response.delete_cookie("access_token")
    return response


@router.get("/cambiar-password", response_class=HTMLResponse)
async def cambiar_password_page(request: Request, response: Response, db: Session = Depends(get_db)):
    user = auth.get_current_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    flash = utils.get_flash(request, response)
    return templates.TemplateResponse(
        "cambiar_password.html", {"request": request, "user": user, "flash": flash}
    )


@router.post("/cambiar-password")
async def cambiar_password(
    request: Request,
    password_actual: str = Form(...),
    password_nuevo: str = Form(...),
    password_confirmar: str = Form(...),
    db: Session = Depends(get_db),
):
    user = auth.get_current_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    redir = RedirectResponse("/cambiar-password", status_code=303)
    if not auth.verify_password(password_actual, user.password_hash):
        utils.set_flash(redir, "error", "La contraseña actual no es correcta.")
        return redir
    if password_nuevo != password_confirmar:
        utils.set_flash(redir, "error", "Las contraseñas nuevas no coinciden.")
        return redir
    if len(password_nuevo) < 6:
        utils.set_flash(redir, "error", "La contraseña debe tener al menos 6 caracteres.")
        return redir
    user.password_hash = auth.hash_password(password_nuevo)
    db.commit()
    redir_ok = RedirectResponse("/cambiar-password", status_code=303)
    utils.set_flash(redir_ok, "success", "Contraseña actualizada correctamente.")
    return redir_ok
