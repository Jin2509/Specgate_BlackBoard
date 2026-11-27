# Creates the SQLAlchemy engine, session factory and declarative base from DATABASE_URL.
import time
from collections.abc import Iterator

from sqlalchemy import create_engine, event, exc
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")
_connect_args = {"check_same_thread": False} if _is_sqlite else {}
# A connection idle this long may have been closed by Supabase's pooler, so it is pinged before reuse.
IDLE_PING_AFTER_S = 60
# Connections older than this are replaced, whatever their idle time.
POOL_RECYCLE_S = 1800
engine = create_engine(settings.database_url, connect_args=_connect_args,
                       pool_recycle=-1 if _is_sqlite else POOL_RECYCLE_S, pool_size=settings.db_pool_size,
                       max_overflow=settings.db_max_overflow, pool_timeout=settings.db_pool_timeout_s)


def worker_thread_limit() -> int:
    """Worker threads that never outnumber pooled connections, so no thread waits on a connection forever."""
    return max(1, min(settings.worker_threads_max, settings.db_pool_size + settings.db_max_overflow))
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def _mark_checked_in(_dbapi_connection, connection_record) -> None:
    connection_record.info["checked_in_at"] = time.monotonic()


def _ping_if_idle(dbapi_connection, connection_record, _connection_proxy) -> None:
    """Ping only a connection that sat idle: pinging on every checkout costs one database round trip per request."""
    checked_in_at = connection_record.info.get("checked_in_at")
    if checked_in_at is None or time.monotonic() - checked_in_at < IDLE_PING_AFTER_S:
        return
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
    except Exception as err:  # every driver error means the same here: the connection is gone; the pool retries
        raise exc.DisconnectionError() from err


if not _is_sqlite:
    event.listen(engine, "checkin", _mark_checked_in)
    event.listen(engine, "checkout", _ping_if_idle)


class Base(DeclarativeBase):
    pass


def get_session() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session
