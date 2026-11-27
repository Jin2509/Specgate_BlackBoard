"""Authentication and authorization helpers. Every check runs here on the backend (NFR-03), never in the UI."""

from collections.abc import AsyncIterator

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv
from app.ws.security import SESSION_COOKIE, read_session

bearer = HTTPBearer(auto_error=False, description="Token từ /api/auth/dev-login hoặc cookie sg_session")


async def db() -> AsyncIterator[Session]:
    """A request's session. Async so FastAPI opens and closes it on the event loop: a sync generator is closed on a
    worker thread, and when every thread waits for a connection no session could be closed to free one."""
    with SessionLocal() as session:
        yield session


def current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    s: Session = Depends(db),
) -> m.User:
    token = creds.credentials if creds else request.cookies.get(SESSION_COOKIE)
    user_id = read_session(token)
    # The read stays open into the endpoint: ending it here would cost a COMMIT and a new BEGIN, two round trips to a
    # remote database per request. ConcurrencyLimitMiddleware keeps in-flight requests below the pool size, so a
    # request holding its connection between threads can no longer starve the others.
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
    mem = sv.member_row(s, workspace_id, user_id)
    return mem if mem and not mem.left_at else None


def load_workspace_and_member(s: Session, workspace_id: str, user_id: str) -> None:
    """Fetch the workspace and the person's membership row in one query, so the checks that follow need none."""
    if sv.is_member_row_loaded(s, workspace_id, user_id):
        return
    row = s.execute(select(m.Workspace, m.Member)
                    .outerjoin(m.Member, and_(m.Member.workspace_id == m.Workspace.id, m.Member.user_id == user_id))
                    .where(m.Workspace.id == workspace_id)).first()
    if not row:
        return
    sv.keep_for_request(s, row[0])
    if row[1] is not None:
        sv.remember_members(s, [row[1]])


def shared_workspace(s: Session, workspace_id: str) -> m.Workspace:
    ws = s.get(m.Workspace, workspace_id)
    if not ws or ws.kind != "shared":
        raise not_found("Không tìm thấy workspace chung.")
    return ws


def require_member(s: Session, workspace_id: str, user: m.User) -> tuple[m.Workspace, m.Member]:
    """FR-39: a non-member gets 403 NOT_MEMBER; the UI then opens Explore with this workspace selected."""
    load_workspace_and_member(s, workspace_id, user.id)
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


def owned_conversation(s: Session, conversation_id: str, user: m.User) -> m.Conversation:
    """NFR-04: another user's conversation answers 404, as if it did not exist."""
    conv = s.get(m.Conversation, conversation_id)
    if not conv or conv.owner_id != user.id:
        raise not_found("Không tìm thấy hội thoại.")
    return conv


def channel_of(s: Session, ws: m.Workspace, channel_id: str, reader_id: str | None = None) -> m.Channel:
    """Accepts the channel id or its name (the UI's URLs use /c/chung). With `reader_id`, that person's read
    position comes in the same query, for the read marker that usually follows."""
    # One query for both spellings; an id match wins over a channel that happens to be named like an id.
    query = select(m.Channel).where(m.Channel.workspace_id == ws.id,
                                    or_(m.Channel.id == channel_id, m.Channel.name == channel_id))
    if reader_id:
        query = query.add_columns(m.ChannelRead).outerjoin(
            m.ChannelRead, and_(m.ChannelRead.channel_id == m.Channel.id, m.ChannelRead.user_id == reader_id))
        matches = [(ch, read) for ch, read in s.execute(query)]
    else:
        matches = [(ch, None) for ch in s.scalars(query)]
    picked = next((x for x in matches if x[0].id == channel_id), matches[0] if matches else None)
    if not picked:
        raise not_found("Không tìm thấy kênh.")
    ch, read = picked
    if reader_id:
        sv.remember_channel_read(s, reader_id, ch.id, read)
    return ch
