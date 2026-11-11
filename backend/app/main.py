from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import errors
from app.config import settings
from app.db import Base, engine
from app.routers import cases, chat, datasets, experiments, lab, results, run_views, runs


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience; replace with Alembic migrations once the schema settles.
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="spec-gate backend", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
errors.install(app)
# runs first: /api/runs/current and /api/runs/export must match before /api/runs/{run_id}.
for module in (runs, run_views, chat, cases, datasets, experiments, lab, results):
    app.include_router(module.router)


@app.get("/api/health")
def health() -> dict:
    try:
        import adom  # noqa: F401

        adom_ok = True
    except ImportError:
        adom_ok = False
    return {"status": "ok", "adom": adom_ok}
