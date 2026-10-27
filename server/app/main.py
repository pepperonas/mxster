"""mxster API: Google login with an approval queue, per-account data, audio gate."""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api import admin, auth, data, friends, rooms
from app.config import get_settings
from app.db import init_db

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def create_app() -> FastAPI:
    s = get_settings()
    if s.is_prod and len(s.session_secret) < 32:
        raise RuntimeError("SESSION_SECRET must be at least 32 characters in production")
    if s.is_prod and s.mx_dev_login:
        raise RuntimeError("MX_DEV_LOGIN must never be enabled in production")
    init_db()
    app = FastAPI(title="mxster", docs_url=None, redoc_url=None, openapi_url=None)

    @app.exception_handler(HTTPException)
    async def _http(_: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, dict) else {"code": "error", "message": str(exc.detail)}
        return JSONResponse(detail, status_code=exc.status_code)

    @app.get("/api/health")
    def health() -> dict:
        return {"ok": True}

    app.include_router(auth.router)
    app.include_router(admin.router)
    app.include_router(data.router)
    app.include_router(rooms.router)
    app.include_router(friends.router)
    return app


app = create_app()
