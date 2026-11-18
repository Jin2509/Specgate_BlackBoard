# Builds the FastAPI app: lifespan schema setup, CORS, error handlers and workspace routes.
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import errors
from app.config import settings
from app.db import Base, SessionLocal, engine
from app.ws import models as _ws_models  # noqa: F401  (registers the workspace tables)
from app.ws.migrate import add_missing_columns, fix_member_colors
from app.ws.routers import ROUTERS as WS_ROUTERS


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience; replace with Alembic migrations once the schema settles.
    Base.metadata.create_all(engine)
    add_missing_columns(engine)
    with SessionLocal() as s:
        fix_member_colors(s)
    yield


app = FastAPI(title="SpecGate Workspace backend", version="0.3.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)
errors.install(app)
for ws_router in WS_ROUTERS:
    app.include_router(ws_router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health")
def health() -> dict:
    return {"status": "ok"}
