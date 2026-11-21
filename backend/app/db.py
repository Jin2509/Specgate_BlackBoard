# Creates the SQLAlchemy engine, session factory and declarative base from DATABASE_URL.
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")
_connect_args = {"check_same_thread": False} if _is_sqlite else {}
# Supabase's pooler closes idle connections; a ping before reuse avoids failing the first request after a quiet spell.
engine = create_engine(settings.database_url, connect_args=_connect_args, pool_pre_ping=not _is_sqlite)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_session() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session
