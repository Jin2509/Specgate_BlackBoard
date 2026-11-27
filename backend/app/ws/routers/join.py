"""Joining a shared workspace: Explore, join code, requests, approval (UC08, UC09, FR-33-FR-39, BR-10).
Both ways in wait for the owner's approval; there is no direct link."""

import re
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv
from app.ws.deps import current_user, db, not_found, require_owner, shared_workspace

router = APIRouter(prefix="", tags=["join"])


def _relation(s: Session, ws_id: str, user_id: str) -> tuple[str, m.JoinRequest | None]:
    if sv.membership_of(s, ws_id, user_id):
        return "member", None
    pending = _pending(s, ws_id, user_id)
    return ("pending", pending) if pending else ("none", None)


def _pending(s: Session, ws_id: str, user_id: str) -> m.JoinRequest | None:
    return s.scalar(select(m.JoinRequest).where(m.JoinRequest.workspace_id == ws_id, m.JoinRequest.user_id == user_id,
                                                m.JoinRequest.status == "pending"))


def _public_card(s: Session, ws: m.Workspace, user: m.User) -> dict:
    rel, req = _relation(s, ws.id, user.id)
    return {"id": ws.id, "name": ws.name, "short": sv.initial(ws.name), "brief": ws.brief,
            "ownerName": sv.name_of(s, ws.owner_id), "memberCount": len(sv.team(s, ws)),
            "relation": rel, "pendingRequestId": req.id if req else None}


@router.get("/explore", tags=["join"])
def explore(q: str | None = Query(None, description="Tìm theo tên hoặc đề bài"),
            selected: str | None = Query(None, description="FR-39: workspace cần chọn sẵn"),
            user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-34: discoverable workspaces with the relation (none, pending, member)."""
    query = select(m.Workspace).where(m.Workspace.kind == "shared", m.Workspace.visibility == "discoverable")
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.where(or_(m.Workspace.name.ilike(like), m.Workspace.brief.ilike(like)))
    rows = [_public_card(s, ws, user) for ws in s.scalars(query.order_by(m.Workspace.created_at.desc()))]
    sel = None
    if selected:
        ws = s.get(m.Workspace, selected)
        # A hidden workspace opened by URL is not revealed beyond its existence.
        if ws and ws.kind == "shared" and ws.visibility == "discoverable":
            sel = _public_card(s, ws, user)
    return {"workspaces": rows, "selected": sel}


def _create_or_update(s: Session, ws: m.Workspace, user: m.User, via: str, code: str | None, message: str | None) -> m.JoinRequest:
    """FR-36: at most one pending request per user and workspace; a second ask updates it."""
    if sv.membership_of(s, ws.id, user.id):
        raise ApiError(409, "Bạn đã là thành viên của workspace này.", "ALREADY_MEMBER")
    req = _pending(s, ws.id, user.id)
    if req:
        if message is not None:
            req.message = message
        if code:
            req.via, req.code = via, code
        req.created_at = m.now()
    else:
        req = m.JoinRequest(workspace_id=ws.id, user_id=user.id, via=via, code=code, message=message or "")
        s.add(req)
    s.commit()
    sv.publish_join_request(s, req)
    return req


class JoinRequestCreate(BaseModel):
    """Either a 7-character join code, or a discoverable workspace id with an optional message."""

    code: str | None = None
    workspaceId: str | None = None
    message: str = Field("", max_length=500)


def _create_by_code(raw_code: str, user: m.User, s: Session) -> dict:
    """FR-33: a valid code creates a pending request; the UI then opens /join/{id} ("Đang chờ duyệt")."""
    code = re.sub(r"[\s-]", "", raw_code).upper()
    if not re.fullmatch(r"[A-Z0-9]{7}", code):
        raise ApiError(400, "Mã gồm 7 ký tự chữ và số, ví dụ ADM7Q3P.", "INVALID_CODE")
    ws = s.scalar(select(m.Workspace).where(m.Workspace.join_code == code, m.Workspace.kind == "shared"))
    if not ws:
        raise ApiError(404, "Không tìm thấy workspace với mã này. Mã có thể đã được đổi, hãy xin mã mới.", "INVALID_CODE")
    return sv.join_request_out(s, _create_or_update(s, ws, user, "code", code, None))


def _create_from_explore(workspace_id: str, message: str, user: m.User, s: Session) -> dict:
    """FR-35: from Explore, with a message. Only discoverable workspaces can be asked this way."""
    ws = shared_workspace(s, workspace_id)
    if ws.visibility != "discoverable":
        raise not_found("Không tìm thấy workspace chung.")
    return sv.join_request_out(s, _create_or_update(s, ws, user, "explore", None, message.strip()))


@router.post("/join-requests", status_code=201)
def create_join_request(body: JoinRequestCreate, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    if body.code is not None:
        return _create_by_code(body.code, user, s)
    if body.workspaceId:
        return _create_from_explore(body.workspaceId, body.message, user, s)
    raise ApiError(400, "Cần mã tham gia hoặc workspace muốn xin vào.", "VALIDATION_ERROR")


def _request(s: Session, req_id: str) -> m.JoinRequest:
    req = s.get(m.JoinRequest, req_id)
    if not req:
        raise not_found("Không tìm thấy yêu cầu.")
    return req


@router.get("/join-requests/mine")
def my_requests(user: m.User = Depends(current_user), s: Session = Depends(db)) -> list[dict]:
    rows = s.scalars(select(m.JoinRequest).where(m.JoinRequest.user_id == user.id).order_by(m.JoinRequest.created_at.desc()))
    return [sv.join_request_out(s, r) for r in rows]


@router.get("/join-requests/{req_id}")
def get_request(req_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-38: the waiting page polls this; when status is approved it goes to `redirect`."""
    req = _request(s, req_id)
    ws = s.get(m.Workspace, req.workspace_id)
    if req.user_id != user.id and not (ws and ws.owner_id == user.id and sv.membership_of(s, ws.id, user.id)):
        raise not_found("Không tìm thấy yêu cầu.")
    out = sv.join_request_out(s, req)
    if req.status == "approved":
        out["redirect"] = f"/w/{req.workspace_id}/c/chung"
    return out


def _cancel(req_id: str, user: m.User, s: Session) -> dict:
    req = _request(s, req_id)
    if req.user_id != user.id:
        raise not_found("Không tìm thấy yêu cầu.")
    if req.status != "pending":
        raise ApiError(409, "Yêu cầu này không còn chờ duyệt.", "NOT_PENDING")
    req.status, req.decided_at = "cancelled", m.now()
    s.commit()
    sv.publish_join_request(s, req)
    return sv.join_request_out(s, req)


def _decide(req_id: str, approve: bool, user: m.User, s: Session) -> dict:
    req = _request(s, req_id)
    require_owner(s, req.workspace_id, user, "duyệt yêu cầu tham gia")
    if req.status != "pending":
        raise ApiError(409, "Yêu cầu này đã được xử lý.", "NOT_PENDING")
    req.status = "approved" if approve else "rejected"
    req.decided_by, req.decided_at = user.id, m.now()
    returning = sv.member_row(s, req.workspace_id, req.user_id) if approve else None
    if returning and returning.left_at:
        # flow §14: the same account coming back gets its old name, and its old messages read as before.
        taken = {x.color for x in s.scalars(sv.active_members(s, req.workspace_id))}
        if returning.color in taken:
            returning.color = sv.free_color(s, req.workspace_id)
        returning.left_at, returning.role, returning.joined_at = None, "member", m.now()
    elif approve and not returning:
        # flow §8: names are unique in a workspace, counting people who left. On a clash the newcomer gets a
        # provisional "Lan 2" and is asked to choose a nickname on entering.
        newcomer = s.get(m.User, req.user_id)
        nickname, needs = None, False
        if newcomer and sv.name_taken(s, req.workspace_id, newcomer.display_name):
            n = 2
            while sv.name_taken(s, req.workspace_id, f"{newcomer.display_name} {n}"):
                n += 1
            nickname, needs = f"{newcomer.display_name} {n}", True
        s.add(m.Member(workspace_id=req.workspace_id, user_id=req.user_id, role="member", nickname=nickname,
                       needs_nickname=needs, color=sv.free_color(s, req.workspace_id)))
    s.commit()
    sv.publish_join_request(s, req)
    if approve:
        sv.publish_membership(req.workspace_id, req.user_id)
    return sv.join_request_out(s, req)


class JoinRequestUpdate(BaseModel):
    """The requester cancels; the owner approves or rejects."""

    status: Literal["approved", "rejected", "cancelled"]


@router.patch("/join-requests/{req_id}")
def update_join_request(req_id: str, body: JoinRequestUpdate, user: m.User = Depends(current_user),
                        s: Session = Depends(db)) -> dict:
    if body.status == "cancelled":
        return _cancel(req_id, user, s)
    return _decide(req_id, body.status == "approved", user, s)
