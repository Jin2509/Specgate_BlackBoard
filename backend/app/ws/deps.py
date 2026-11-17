"""Authentication and authorization helpers. Every check runs here on the backend (NFR-03), never in the UI."""

from collections.abc import Iterator

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.errors import ApiError
from app.ws import models as m
from app.ws.security import SESSION_COOKIE, read_session

bearer = HTTPBearer(auto_error=False, description="Token từ /api/auth/dev-login hoặc cookie sg_session")


def db() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session


def current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    s: Session = Depends(db),
) -> m.User:
    token = creds.credentials if creds else request.cookies.get(SESSION_COOKIE)
    user_id = read_session(token)
    user = s.get(m.User, user_id) if user_id else None
    if not user:
        raise ApiError(401, "Bạn cần đăng nhập.", "UNAUTHENTICATED")
    return user


def not_found(what: str = "Không tìm thấy.") -> ApiError:
    return ApiError(404, what, "NOT_FOUND")


def forbidden(what: str) -> ApiError:
    return ApiError(403, what, "FORBIDDEN")


def membership(s: Session, workspace_id: str, user_id: str) -> m.Member | None:
    """Current members only: a member who left keeps the row (their name stays reserved) but loses access."""
    return s.scalar(select(m.Member).where(m.Member.workspace_id == workspace_id, m.Member.user_id == user_id,
                                           m.Member.left_at.is_(None)))


def shared_workspace(s: Session, workspace_id: str) -> m.Workspace:
    ws = s.get(m.Workspace, workspace_id)
    if not ws or ws.kind != "shared":
        raise not_found("Không tìm thấy workspace chung.")
    return ws


def require_member(s: Session, workspace_id: str, user: m.User) -> tuple[m.Workspace, m.Member]:
    """FR-39: a non-member gets 403 NOT_MEMBER; the UI then opens Explore with this workspace selected."""
    ws = shared_workspace(s, workspace_id)
    mem = membership(s, ws.id, user.id)
    if not mem:
        raise ApiError(403, "Bạn chưa là thành viên của workspace này.", "NOT_MEMBER")
    return ws, mem


def require_owner(s: Session, workspace_id: str, user: m.User, action: str = "thao tác này") -> m.Workspace:
    ws, mem = require_member(s, workspace_id, user)
    if mem.role != "owner":
        raise forbidden(f"Chỉ chủ workspace được {action}.")
    return ws


def channel_of(s: Session, ws: m.Workspace, channel_id: str) -> m.Channel:
    """Accepts the channel id or its name (the UI's URLs use /c/chung)."""
    ch = s.get(m.Channel, channel_id)
    if not ch or ch.workspace_id != ws.id:
        ch = s.scalar(select(m.Channel).where(m.Channel.workspace_id == ws.id, m.Channel.name == channel_id))
    if not ch:
        raise not_found("Không tìm thấy kênh.")
    return ch
