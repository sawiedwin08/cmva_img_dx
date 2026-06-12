from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Request
from sqlalchemy.orm import Session
import models
import os

SECRET_KEY = os.getenv("SECRET_KEY", "cmva-rayosx-change-this-key-2024-seguro")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 10


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(request: Request, db: Session) -> Optional[models.Usuario]:
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None
    return (
        db.query(models.Usuario)
        .filter(models.Usuario.id == user_id, models.Usuario.estado == True)
        .first()
    )


def get_api_user(request: Request, db: Session) -> Optional[models.Usuario]:
    """Lee JWT desde Authorization: Bearer header; si no, cae a cookie."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None
    return (
        db.query(models.Usuario)
        .filter(models.Usuario.id == user_id, models.Usuario.estado == True)
        .first()
    )
