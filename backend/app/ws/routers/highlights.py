""""Highlight của tôi" (FR-24): only the creator sees or deletes a highlight (NFR-04)."""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ws import models as m
from app.ws import service as sv
from app.config import settings
from app.ws.deps import current_user, db, not_found

router = APIRouter(prefix="/highlights", tags=["highlights"])


@router.get("")
def my_highlights(workspaceId: str | None = Query(None), user: m.User = Depends(current_user),
                  s: Session = Depends(db)) -> dict:
    """Newest first, grouped by workspace, each with speaker and channel."""
    q = select(m.Highlight).where(m.Highlight.owner_id == user.id)
    if workspaceId:
        q = q.where(m.Highlight.workspace_id == workspaceId)
    rows = [sv.highlight_out(s, h) for h in s.scalars(q.order_by(m.Highlight.at.desc(), m.Highlight.id.desc()))]
    groups: dict[str, dict] = {}
    for h in rows:
        g = groups.setdefault(h["workspaceId"], {"workspaceId": h["workspaceId"], "workspaceName": h["workspaceName"],
                                                 "highlights": []})
        g["highlights"].append(h)
    for g in groups.values():
        g["count"], g["limit"] = len(g["highlights"]), settings.agent_highlights_max
    return {"groups": list(groups.values()), "total": len(rows), "limit": settings.agent_highlights_max}


class PatchHighlight(BaseModel):
    label: Literal["important", "review"] | None = None
    note: str | None = Field(None, max_length=1000)


@router.patch("/{highlight_id}")
def patch_highlight(highlight_id: str, body: PatchHighlight, user: m.User = Depends(current_user),
                    s: Session = Depends(db)) -> dict:
    """flow §10: only the user's own note and the label change; the speaker's words never do."""
    h = s.get(m.Highlight, highlight_id)
    if not h or h.owner_id != user.id:
        raise not_found("Không tìm thấy highlight.")
    if body.label:
        h.label = body.label
    if "note" in body.model_fields_set:
        h.note = (body.note or "").strip() or None
    s.commit()
    return sv.highlight_out(s, h)


@router.delete("/{highlight_id}", status_code=204)
def delete_highlight(highlight_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    h = s.get(m.Highlight, highlight_id)
    if not h or h.owner_id != user.id:
        raise not_found("Không tìm thấy highlight.")
    s.delete(h)
    s.commit()
