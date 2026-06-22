import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from seed import seed_initial_data
from routers import (
    auth_router, registros_router, catalogs_router, users_router,
    export_router, dashboard_router, audit_router, manual_router,
)
from routers import api_auth, api_registros, api_catalogs, api_dashboard, api_usuarios


def _run_migrations(eng):
    """Agrega columnas nuevas a tablas existentes sin perder datos."""
    from sqlalchemy import inspect, text

    insp = inspect(eng)

    # Columnas nuevas en registros_rayos_x
    existing_reg = {c["name"] for c in insp.get_columns("registros_rayos_x")}
    new_reg_cols = [
        ("tipo_estudio_principal", "VARCHAR(10) NOT NULL DEFAULT 'RX'"),
        ("contrastado_si_no",      "VARCHAR(2)  NOT NULL DEFAULT 'NO'"),
        ("codigo_tac",             "VARCHAR(50)"),
        ("volumen_contraste_ml",   "FLOAT"),
        ("profesional_id",         "INTEGER"),
        ("observaciones_tecnologo","TEXT"),
        ("lectura_radiologo",      "TEXT"),
        ("observaciones_radiologo","TEXT"),
        ("estado_carga",           "VARCHAR(30)"),
    ]
    with eng.begin() as conn:
        for col, col_type in new_reg_cols:
            if col not in existing_reg:
                conn.execute(text(f"ALTER TABLE registros_rayos_x ADD COLUMN {col} {col_type}"))
        # Migrar observaciones legado → observaciones_radiologo para registros existentes
        if "observaciones_radiologo" not in existing_reg:
            conn.execute(text(
                "UPDATE registros_rayos_x "
                "SET observaciones_radiologo = observaciones "
                "WHERE observaciones IS NOT NULL AND (observaciones_radiologo IS NULL OR observaciones_radiologo = '')"
            ))

    # Columna tipo en estudios
    existing_est = {c["name"] for c in insp.get_columns("estudios")}
    if "tipo" not in existing_est:
        with eng.begin() as conn:
            conn.execute(text("ALTER TABLE estudios ADD COLUMN tipo VARCHAR(10)"))
            conn.execute(text("UPDATE estudios SET tipo = 'RX' WHERE tipo IS NULL"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _run_migrations(engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title="CMVA – Imágenes Diagnósticas", lifespan=lifespan)

# CORS: permite que el frontend React (localhost:3000 / 5173) consuma la API
_CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Routers API JSON ───────────────────────────────────────────────────────
app.include_router(api_auth.router)
app.include_router(api_registros.router)
app.include_router(api_catalogs.router)
app.include_router(api_dashboard.router)
app.include_router(api_usuarios.router)

# ── Routers Jinja2 (exportación y auditoría siguen en el backend) ─────────
app.include_router(export_router.router)
app.include_router(audit_router.router)

# ── Servir React (frontend/dist) como UI principal ────────────────────────
_REACT_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
_REACT_DIST = os.path.normpath(_REACT_DIST)

if os.path.isdir(_REACT_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(_REACT_DIST, "assets")), name="react-assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
    async def serve_react(full_path: str):
        # Rutas de exportación y auditoría ya registradas — no llegan aquí
        index = os.path.join(_REACT_DIST, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)
        return HTMLResponse("<h1>Frontend no compilado</h1><p>Ejecute: cd frontend && npm run build</p>", status_code=503)

    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def root():
        index = os.path.join(_REACT_DIST, "index.html")
        return FileResponse(index)

else:
    # Sin build de React: redirigir a Jinja2 legacy
    app.include_router(auth_router.router)
    app.include_router(registros_router.router)
    app.include_router(catalogs_router.router)
    app.include_router(users_router.router)
    app.include_router(dashboard_router.router)
    app.include_router(manual_router.router)

    @app.get("/")
    async def root_fallback():
        return RedirectResponse(url="/registros")
