"""LabSettings, persisted as one row. Defaults apply until the first PUT."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import settings
from app.models import LabSettingsRow


def model_ids() -> list[str]:
    return [m["id"] for m in settings.model_catalog if "id" in m]


def defaults() -> dict[str, Any]:
    ids = model_ids()
    return {
        "defaultCoderModel": ids[0] if ids else "",
        "defaultSpecModel": ids[1] if len(ids) > 1 else (ids[0] if ids else ""),
        "maxCallsBudget": 1000, "maxTokensBudget": 2_000_000,
        "a3TimeoutMs": 5000, "z3TimeoutMs": 5000,
        "enableFlaky": False, "enableAudit": False, "enableBSynth": True,
    }


def load(session: Session) -> tuple[dict[str, Any], datetime | None]:
    row = session.get(LabSettingsRow, 1)
    if row is None:
        return defaults(), None
    return {**defaults(), **row.data}, row.updated_at


def save(session: Session, data: dict[str, Any]) -> datetime:
    row = session.get(LabSettingsRow, 1)
    now = datetime.now(timezone.utc)
    if row is None:
        session.add(LabSettingsRow(id=1, data=data, updated_at=now))
    else:
        row.data, row.updated_at = data, now
    session.commit()
    return now


def response(session: Session) -> dict[str, Any]:
    data, updated = load(session)
    out: dict[str, Any] = {"settings": data, "models": settings.model_catalog}
    if updated is not None:
        out["updatedAt"] = updated.isoformat()
    return out
