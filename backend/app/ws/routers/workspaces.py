"""Shared workspaces: create, settings, members, team role, join code, board, brief
(UC07, UC11-UC15, FR-30-FR-32, FR-44, FR-50-FR-56, FR-60-FR-62)."""

import re
import secrets
from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.ws import board as bd
from app.ws import models as m
from app.ws import service as sv
from app.ws import tasks as tk
from app.ws.deps import current_user, db, load_workspace_and_member, require_member, require_owner

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

# No 0/O, 1/I/L: readable over the phone (same alphabet as web_ui/src/lib/join-code.ts).
ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CHANNEL_NAME = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")


def new_join_code(s: Session) -> str:
    while True:
        code = "".join(secrets.choice(ALPHABET) for _ in range(7))
        if not s.scalar(select(m.Workspace.id).where(m.Workspace.join_code == code)):
            return code


class NewWorkspace(BaseModel):
    name: str = Field(max_length=80)
    brief: str = Field(description="Đề bài, bắt buộc", max_length=4000)
    visibility: Literal["hidden", "discoverable"] = "hidden"


@router.post("", status_code=201)
def create_workspace(body: NewWorkspace, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """UC07 / FR-30: name and brief required; one default channel #chung; the creator is the owner.
    No agent belongs to the workspace: every member brings their own."""
    name, brief = " ".join(body.name.split()), body.brief.strip()
    missing = [f for f, v in (("name", name), ("brief", brief)) if not v]
    if missing:
        label = {"name": "tên", "brief": "đề bài"}
        raise ApiError(400, "Thiếu " + " và ".join(label[f] for f in missing) + ".", "MISSING_FIELDS")
    owned = list(s.scalars(select(m.Workspace).where(m.Workspace.kind == "shared", m.Workspace.owner_id == user.id)))
    if len(owned) >= settings.owned_workspaces_max:
        raise ApiError(409, f"Mỗi người làm chủ tối đa {settings.owned_workspaces_max} workspace chung.", "OWNED_LIMIT")
    if any(w.name.casefold() == name.casefold() for w in owned):
        raise ApiError(409, f"Bạn đã làm chủ một workspace tên \"{name}\". Hãy đặt tên khác.", "NAME_TAKEN")
    ws = m.Workspace(kind="shared", name=name, brief=brief, visibility=body.visibility, owner_id=user.id,
                     join_code=new_join_code(s), join_code_at=m.now())
    s.add(ws)
    s.flush()
    s.add(m.Member(workspace_id=ws.id, user_id=user.id, role="owner", color=0))
    s.add(m.Channel(workspace_id=ws.id, name="chung"))
    s.commit()
    sv.publish_membership(ws.id, user.id)
    return sv.workspace_out(s, ws, sv.membership_of(s, ws.id, user.id))


@router.get("/{ws_id}")
def get_workspace(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-39: a non-member gets 403 NOT_MEMBER and the UI opens Explore with this workspace selected."""
    load_workspace_and_member(s, ws_id, user.id)
    ws = s.get(m.Workspace, ws_id)
    if ws and ws.kind == "personal":
        if ws.owner_id != user.id:
            raise ApiError(404, "Không tìm thấy workspace.", "NOT_FOUND")
        return sv.workspace_out(s, ws, None)
    ws, mem = require_member(s, ws_id, user)
    return sv.workspace_out(s, ws, mem)


class PatchWorkspace(BaseModel):
    brief: str | None = Field(None, max_length=4000)
    name: str | None = Field(None, max_length=80)
    visibility: Literal["hidden", "discoverable"] | None = None


@router.patch("/{ws_id}")
def patch_workspace(ws_id: str, body: PatchWorkspace, user: m.User = Depends(current_user),
                    s: Session = Depends(db)) -> dict:
    """FR-60: the owner edits the brief (and name, visibility)."""
    ws = require_owner(s, ws_id, user, "sửa cấu hình workspace")
    if body.brief is not None:
        if not body.brief.strip():
            raise ApiError(400, "Đề bài không được trống.", "MISSING_FIELDS")
        ws.brief = body.brief.strip()
    if body.name is not None:
        name = " ".join(body.name.split())
        if not name:
            raise ApiError(400, "Tên không được trống.", "MISSING_FIELDS")
        clash = s.scalar(select(m.Workspace.id).where(m.Workspace.kind == "shared", m.Workspace.owner_id == ws.owner_id,
                                                      m.Workspace.id != ws.id, func.lower(m.Workspace.name) == name.lower()))
        if clash:
            raise ApiError(409, f"Bạn đã làm chủ một workspace tên \"{name}\". Hãy đặt tên khác.", "NAME_TAKEN")
        ws.name = name
    if body.visibility is not None:
        ws.visibility = body.visibility
    s.commit()
    return sv.workspace_out(s, ws, sv.membership_of(s, ws.id, user.id))


# ---------- channels ----------


class NewChannel(BaseModel):
    name: str


@router.get("/{ws_id}/channels")
def list_channels(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> list[dict]:
    ws, _ = require_member(s, ws_id, user)
    return [{"id": c.id, "name": c.name} for c in sv.channels(s, ws.id)]


@router.post("/{ws_id}/channels", status_code=201)
def create_channel(ws_id: str, body: NewChannel, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-60 (SRS §8 point 7): only the owner creates channels."""
    ws = require_owner(s, ws_id, user, "tạo kênh")
    name = body.name.strip().lstrip("#").lower().replace(" ", "-")
    if not CHANNEL_NAME.match(name):
        raise ApiError(400, "Tên kênh gồm chữ thường không dấu, số và dấu gạch ngang, tối đa 40 ký tự.", "INVALID_NAME")
    if s.scalar(select(m.Channel.id).where(m.Channel.workspace_id == ws.id, m.Channel.name == name)):
        raise ApiError(409, f"Kênh #{name} đã có.", "CHANNEL_EXISTS")
    ch = m.Channel(workspace_id=ws.id, name=name)
    s.add(ch)
    s.commit()
    return {"id": ch.id, "name": ch.name}


# ---------- members, team role ----------


@router.get("/{ws_id}/members")
def members(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> list[dict]:
    """FR-62 / FR-44: everyone's role, team role and personal agent; nobody's key."""
    ws, _ = require_member(s, ws_id, user)
    return sv.team(s, ws)


class TeamRole(BaseModel):
    teamRole: str = Field(description="Tối đa 40 ký tự; chuỗi rỗng để xóa")


@router.put("/{ws_id}/members/me/team-role")
def set_team_role(ws_id: str, body: TeamRole, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """UC14 / FR-61: each member sets only their own role (the path has no user id to change)."""
    _, mem = require_member(s, ws_id, user)
    value = " ".join(body.teamRole.split())
    if len(value) > 40:
        raise ApiError(400, "Vai trong nhóm tối đa 40 ký tự.", "TOO_LONG")
    mem.team_role = value or None
    s.commit()
    return {"teamRole": mem.team_role}


class Nickname(BaseModel):
    nickname: str = Field(description="Tên trong workspace, tối đa 40 ký tự; chuỗi rỗng = dùng tên tài khoản")


@router.put("/{ws_id}/members/me/nickname")
def set_nickname(ws_id: str, body: Nickname, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """flow §8, §14: the name used everywhere in this workspace, unique in it."""
    ws, mem = require_member(s, ws_id, user)
    value = " ".join(body.nickname.split())
    if len(value) > 40:
        raise ApiError(400, "Tên trong workspace tối đa 40 ký tự.", "TOO_LONG")
    name = value or user.display_name
    if sv.name_taken(s, ws.id, name, except_user=user.id):
        raise ApiError(409, f"Trong workspace đã có người tên \"{name}\". Hãy chọn tên khác, ví dụ \"{name} B\".",
                       "NAME_TAKEN")
    mem.nickname = value if value and value != user.display_name else None
    mem.needs_nickname = False
    s.commit()
    return {"nickname": mem.nickname, "name": name}


def _leave(s: Session, ws: m.Workspace, mem: m.Member, removed: bool) -> list[m.Message]:
    """flow §14: the row stays, so the name stays reserved and old messages read "Lan (đã rời)". flow §13: the
    person is taken off their unfinished tasks, locked board or not, and #chung says so."""
    name = sv.base_name(s, mem.user_id, ws.id)
    mem.left_at = m.now()
    released = tk.release_member(s, ws, mem.user_id)
    notice = tk.post_notice(s, ws, tk.departure_text(name, removed, released))
    return [notice] if notice else []


@router.delete("/{ws_id}/members/me", status_code=204)
def leave_workspace(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    ws, mem = require_member(s, ws_id, user)
    if mem.role == "owner":
        raise ApiError(409, "Chủ workspace không rời workspace được.", "OWNER_CANNOT_LEAVE")
    notices = _leave(s, ws, mem, removed=False)
    s.commit()
    sv.publish(s, notices)
    sv.publish_membership(ws.id, user.id)


@router.delete("/{ws_id}/members/{user_id}", status_code=204)
def remove_member(ws_id: str, user_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    ws = require_owner(s, ws_id, user, "xóa thành viên khỏi workspace")
    mem = sv.membership_of(s, ws.id, user_id)
    if not mem:
        raise ApiError(404, "Người này không còn là thành viên của workspace.", "NOT_FOUND")
    if mem.role == "owner":
        raise ApiError(409, "Không xóa được chủ workspace.", "OWNER_CANNOT_LEAVE")
    notices = _leave(s, ws, mem, removed=True)
    s.commit()
    sv.publish(s, notices)
    sv.publish_membership(ws.id, user_id)


# ---------- join code ----------


@router.get("/{ws_id}/join-code")
def get_join_code(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    ws, _ = require_member(s, ws_id, user)
    return {"code": ws.join_code, "createdAt": sv.iso(ws.join_code_at)}


@router.put("/{ws_id}/join-code")
def rotate_join_code(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-32: the old code stops working immediately."""
    ws = require_owner(s, ws_id, user, "đổi mã tham gia")
    ws.join_code, ws.join_code_at = new_join_code(s), m.now()
    s.commit()
    return {"code": ws.join_code, "createdAt": sv.iso(ws.join_code_at)}


# ---------- join requests (owner side, UC09) ----------


@router.get("/{ws_id}/join-requests")
def list_join_requests(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-37: owner only; pending + processed history, newest first. The UI polls this page."""
    ws = require_owner(s, ws_id, user, "xem yêu cầu tham gia")
    rows = list(s.scalars(select(m.JoinRequest).where(m.JoinRequest.workspace_id == ws.id)
                          .order_by(m.JoinRequest.created_at.desc())))
    return {"pending": [sv.join_request_out(s, r) for r in rows if r.status == "pending"],
            "history": [sv.join_request_out(s, r) for r in rows if r.status != "pending"]}


# ---------- board ----------


@router.get("/{ws_id}/board")
def get_board(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    ws, _ = require_member(s, ws_id, user)
    return bd.board(s, ws)


class NewItem(BaseModel):
    kind: Literal["idea", "note"] = "idea"
    body: str


@router.post("/{ws_id}/board", status_code=201)
def add_board_item(ws_id: str, body: NewItem, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """Same as /idea or /note typed in a channel, for a button on the board page."""
    ws, _ = require_member(s, ws_id, user)
    item = bd.add_item(s, ws, kind=body.kind, body=body.body, by_kind="human", by_id=user.id)
    s.commit()
    return sv.board_item_out(s, item)


class Decision(BaseModel):
    decision: Literal["decided", "rejected"]
    reason: str


@router.put("/{ws_id}/board/{number}/decision")
def update_decision(ws_id: str, number: int, body: Decision, user: m.User = Depends(current_user),
                s: Session = Depends(db)) -> dict:
    """UC12 / FR-52 / FR-53: reason required, records decider and time, no way back."""
    ws, _ = require_member(s, ws_id, user)
    item = bd.decide(s, bd.item_by_number(s, ws, number), user, body.decision, body.reason)
    s.commit()
    return sv.board_item_out(s, item)


class StatusChange(BaseModel):
    status: Literal["discussing"]


@router.put("/{ws_id}/board/{number}/status")
def update_status(ws_id: str, number: int, body: StatusChange, user: m.User = Depends(current_user),
                  s: Session = Depends(db)) -> dict:
    """flow §11: owner only; an idea can only be moved to "discussing" this way."""
    ws, mem = require_member(s, ws_id, user)
    item = bd.move_to_discussing(bd.item_by_number(s, ws, number), mem.role)
    s.commit()
    return sv.board_item_out(s, item)


# ---------- brief ----------


def _latest_brief(s: Session, ws: m.Workspace) -> m.Brief:
    br = s.scalar(select(m.Brief).where(m.Brief.workspace_id == ws.id).order_by(m.Brief.built_at.desc()).limit(1))
    if not br:
        raise ApiError(404, "Chủ workspace chưa dựng bản tổng hợp. Chủ gõ /brief trong kênh để dựng.", "NO_BRIEF")
    return br


@router.get("/{ws_id}/brief")
def get_brief(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-56: every member views the latest brief."""
    ws, _ = require_member(s, ws_id, user)
    return bd.brief_out(s, _latest_brief(s, ws))


@router.get("/{ws_id}/brief.md", response_class=PlainTextResponse)
def download_brief(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> PlainTextResponse:
    """FR-56: Markdown download."""
    ws, _ = require_member(s, ws_id, user)
    br = _latest_brief(s, ws)
    return PlainTextResponse(br.markdown, media_type="text/markdown; charset=utf-8",
                             headers={"Content-Disposition": f'attachment; filename="tong-hop-{ws.id}.md"'})


@router.post("/{ws_id}/brief", status_code=201)
def build_brief(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """Same as /brief in a channel (FR-54: owner only)."""
    ws = require_owner(s, ws_id, user, "dựng bản tổng hợp")
    br = bd.snapshot_brief(s, ws, user)
    s.commit()
    return bd.brief_out(s, br)
