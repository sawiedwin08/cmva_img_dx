from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
import auth
from templates_config import templates

router = APIRouter(tags=["manual"])


@router.get("/manual", response_class=HTMLResponse)
async def manual_usuario(request: Request, db: Session = Depends(get_db)):
    user = auth.get_current_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    return templates.TemplateResponse("manual.html", {"request": request, "user": user})
