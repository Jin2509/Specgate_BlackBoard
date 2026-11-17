"""Adds columns that newer models have and an existing database lacks (create_all never alters a table).

Only for the ws_ tables, only additive, nullable or with a constant default. Replace with Alembic together with
the move to Postgres.
"""

from sqlalchemy import Boolean, Integer, inspect, text
from sqlalchemy.engine import Engine

from app.db import Base


def _default_sql(col) -> str:
    if isinstance(col.type, Boolean):
        # Existing rows take the column's own default (Turn.active must be true for turns written before versions).
        arg = getattr(col.default, "arg", None)
        return " DEFAULT 1" if arg is True else " DEFAULT 0"
    if isinstance(col.type, Integer) and not col.nullable:
        return " DEFAULT 0"
    return ""


def add_missing_columns(engine: Engine) -> list[str]:
    insp = inspect(engine)
    added: list[str] = []
    existing_tables = set(insp.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not table.name.startswith("ws_") or table.name not in existing_tables:
                continue
            have = {c["name"] for c in insp.get_columns(table.name)}
            for col in table.columns:
                if col.name in have:
                    continue
                ddl = col.type.compile(dialect=engine.dialect)
                conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN "{col.name}" {ddl}{_default_sql(col)}'))
                added.append(f"{table.name}.{col.name}")
    return added


def fix_member_colors(session) -> int:
    """Members created before avatar colours existed all have colour 0: give each workspace distinct colours
    (flow §9), keeping the earliest member's colour."""
    from sqlalchemy import select

    from app.ws import models as m
    from app.ws.service import AVATAR_COLORS

    changed = 0
    for ws_id in set(session.scalars(select(m.Member.workspace_id))):
        members = list(session.scalars(select(m.Member).where(m.Member.workspace_id == ws_id)
                                        .order_by(m.Member.joined_at, m.Member.id)))
        if len({x.color for x in members}) == len(members) or len(members) > AVATAR_COLORS:
            continue
        used: set[int] = set()
        for x in members:
            if x.color in used:
                x.color = next(i for i in range(AVATAR_COLORS) if i not in used)
                changed += 1
            used.add(x.color)
    session.commit()
    return changed
