from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import RunEvent


def append_event(session: Session, run_id: str, event: str, data: dict[str, Any]) -> RunEvent:
    last = session.scalar(select(func.max(RunEvent.seq)).where(RunEvent.run_id == run_id)) or 0
    ev = RunEvent(run_id=run_id, seq=last + 1, event=event, data=data)
    session.add(ev)
    session.commit()
    return ev


def events_after(session: Session, run_id: str, from_seq: int) -> list[RunEvent]:
    stmt = (
        select(RunEvent)
        .where(RunEvent.run_id == run_id, RunEvent.seq > from_seq)
        .order_by(RunEvent.seq)
    )
    return list(session.scalars(stmt))
