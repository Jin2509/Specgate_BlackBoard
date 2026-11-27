# Builds the FastAPI app: lifespan schema setup, CORS, error handlers and workspace routes.
import asyncio
from contextlib import asynccontextmanager

import anyio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import errors
from app.concurrency import ConcurrencyLimitMiddleware
from app.config import settings
from app.db import Base, SessionLocal, engine, worker_thread_limit
from app.ws import models as _ws_models  # noqa: F401  (registers the workspace tables)
from app.ws.deadline_watcher import watch_deadlines
from app.ws.migrate import add_missing_columns, fix_member_colors, start_unclaimed_tasks_as_todo
from app.ws.routers import ROUTERS as WS_ROUTERS


@asynccontextmanager
async def lifespan(_: FastAPI):
    anyio.to_thread.current_default_thread_limiter().total_tokens = worker_thread_limit()
    # Dev convenience; replace with Alembic migrations once the schema settles.
    Base.metadata.create_all(engine)
    add_missing_columns(engine)
    with SessionLocal() as s:
        fix_member_colors(s)
        start_unclaimed_tasks_as_todo(s)
    watcher = asyncio.create_task(watch_deadlines(settings.task_deadline_check_s))
    yield
    watcher.cancel()


app = FastAPI(title="SpecGate Workspace backend", version="0.3.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)
app.add_middleware(ConcurrencyLimitMiddleware, limit=worker_thread_limit(),
                   wait_timeout_s=settings.request_queue_timeout_s)
errors.install(app)
for ws_router in WS_ROUTERS:
    app.include_router(ws_router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health")
def health() -> dict:
    return {"status": "ok"}
