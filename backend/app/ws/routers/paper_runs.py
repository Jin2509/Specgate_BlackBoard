"""ADOM runs of a shared workspace (flow §13): list, read, import, trial run, mark invalid, remove."""

import json
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.ws import models as m
from app.ws import runs as rn
from app.ws import service as sv
from app.ws.deps import current_user, db, not_found, require_member, require_owner

router = APIRouter(prefix="/workspaces/{ws_id}/runs", tags=["paper-runs"])


def _run(s: Session, ws: m.Workspace, run_id: str) -> m.PaperRun:
    r = s.get(m.PaperRun, run_id)
    if not r or r.workspace_id != ws.id:
        raise not_found("Không tìm thấy lượt chạy.")
    return r


@router.get("")
def list_runs(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    ws, mem = require_member(s, ws_id, user)
    rows = list(s.scalars(select(m.PaperRun).where(m.PaperRun.workspace_id == ws.id).order_by(m.PaperRun.created_at.desc())))
    cur = rn.current_run(s, ws.id)
    running = next((r for r in rows if r.status == "running"), None)
    return {"runs": [rn.run_out(s, r) for r in rows], "currentId": cur.id if cur else None,
            "runningId": running.id if running else None, "canManage": mem.role == "owner",
            "trialMaxTasks": settings.adom_trial_max_tasks, "trialMode": "fake" if settings.adom_trial_fake else "pipeline"}


@router.get("/{run_id}")
def get_run(ws_id: str, run_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    ws, _ = require_member(s, ws_id, user)
    r = _run(s, ws, run_id)
    cur = rn.current_run(s, ws.id)
    return {**rn.run_out(s, r, full=True), "isCurrent": bool(cur and cur.id == r.id)}


class ImportIn(BaseModel):
    format: Literal["adom-export", "specgate-run/1"]
    summaryCsv: str | None = Field(None, max_length=2_000_000)
    perTaskCsv: str | None = Field(None, max_length=5_000_000)
    runMeta: str | None = Field(None, max_length=1_000_000)
    report: str | None = Field(None, max_length=5_000_000, description="JSON specgate-run/1")
    name: str | None = Field(None, max_length=80)
    validity: Literal["valid", "invalidated"] = "valid"
    invalidReason: str | None = Field(None, max_length=1000)


@router.post("/import", status_code=201)
def import_run(ws_id: str, body: ImportIn, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """Checks the agreed format, attaches the run, and tells #chung (flow §13). Owner only for now: the ADOM team
    has no account role yet (flow open point 6)."""
    ws = require_owner(s, ws_id, user, "nhập lượt chạy")
    if body.format == "adom-export":
        if not (body.summaryCsv and body.perTaskCsv and body.runMeta):
            raise rn.bad("Cần đủ ba tệp: <RUN>_summary.csv, <RUN>_per_task.csv và <RUN>_run_meta.json.")
        data = rn.parse_adom(body.summaryCsv, body.perTaskCsv, body.runMeta)
        validity, reason = body.validity, body.invalidReason
    else:
        try:
            raw = json.loads(body.report or "")
        except json.JSONDecodeError:
            raise rn.bad("Báo cáo không phải JSON hợp lệ.") from None
        data = rn.parse_native(raw)
        validity = data.get("validity") or body.validity
        reason = data.get("invalidReason") or body.invalidReason
    if body.name and body.name.strip():
        data["name"] = body.name.strip()
    r = rn.create_run(s, ws, user, data, kind="import", validity=validity, invalid_reason=reason)
    msg = rn.announce(s, ws, f"Đã có lượt chạy mới: {r.name}, {r.dataset}, {r.task_count} tác vụ"
                             f"{'' if r.validity == 'valid' else ' (không hợp lệ)'}.", {"type": "run", "runId": r.id})
    s.commit()
    if msg:
        sv.publish(s, [msg])
    return rn.run_out(s, r, full=True)


class TrialIn(BaseModel):
    taskIds: list[str] = Field(min_length=1, max_length=50)
    level: Literal["A1", "A3"] = "A3"


@router.post("/trial", status_code=201)
def trial(ws_id: str, body: TrialIn, background: BackgroundTasks, user: m.User = Depends(current_user),
          s: Session = Depends(db)) -> dict:
    """"Chạy thử": owner only, a few tasks, one at a time per workspace. Progress: GET /runs/{id} (`progress`)."""
    ws = require_owner(s, ws_id, user, "chạy thử thí nghiệm")
    r = rn.start_trial(s, ws, user, rn.parse_task_ids(body.taskIds), body.level, background)
    return rn.run_out(s, r)


class PatchRun(BaseModel):
    validity: Literal["valid", "invalidated"]
    invalidReason: str | None = Field(None, max_length=1000)


@router.patch("/{run_id}")
def patch_run(ws_id: str, run_id: str, body: PatchRun, user: m.User = Depends(current_user),
              s: Session = Depends(db)) -> dict:
    """Marking a run invalid: stats cards already in the channels then show a notice (they are snapshots)."""
    ws = require_owner(s, ws_id, user, "đổi tình trạng lượt chạy")
    r = _run(s, ws, run_id)
    if r.status != "done":
        raise ApiError(409, "Lượt chạy chưa xong.", "NOT_DONE")
    if body.validity == "invalidated" and not (body.invalidReason or "").strip():
        raise rn.bad("Lượt chạy không hợp lệ phải ghi lý do.")
    changed = r.validity != body.validity
    r.validity = body.validity
    r.invalid_reason = (body.invalidReason or "").strip() or None if body.validity == "invalidated" else None
    msg = None
    if changed and body.validity == "invalidated":
        msg = rn.announce(s, ws, f"Lượt chạy {r.name} đã bị đánh dấu không hợp lệ: {r.invalid_reason}",
                          {"type": "run", "runId": r.id})
    s.commit()
    if msg:
        sv.publish(s, [msg])
    return rn.run_out(s, r, full=True)


@router.delete("/{run_id}", status_code=204)
def remove_run(ws_id: str, run_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    ws = require_owner(s, ws_id, user, "gỡ lượt chạy")
    r = _run(s, ws, run_id)
    if r.status == "running":
        raise ApiError(409, "Không gỡ được lượt đang chạy.", "RUNNING")
    s.delete(r)
    s.commit()
