from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import export as export_api
from .api import generate as generate_api
from .api import health as health_api
from .api import motions as motions_api
from .api import plan as plan_api
from .config import settings
from .database import init_db
from .utils.errors import AppError
from .utils.logging import log

settings.ensure_dirs()
init_db()

app = FastAPI(title="Motion AI Studio", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_api.router, prefix="/api")
app.include_router(plan_api.router, prefix="/api")
app.include_router(generate_api.router, prefix="/api")
app.include_router(motions_api.router, prefix="/api")
app.include_router(export_api.router, prefix="/api")


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    log.warning("app error: %s", exc.message)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(ValueError)
async def value_error_handler(_: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})
