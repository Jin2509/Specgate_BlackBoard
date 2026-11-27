"""One WebSocket per browser tab for everything live (FR-41, NFR-05): messages of the open channel, and the rail,
join-request and membership events of every workspace the user belongs to. It replaces polling and the per-channel
SSE stream.

The browser sends {"type": "subscribe", "workspaceId", "channelId", "after"} for the channel it shows (and
"unsubscribe" when it leaves). No database connection is held while the socket is open: each check opens a short
session in a worker thread, so hundreds of idle sockets cost no pool connections.
"""

import asyncio
import json
from urllib.parse import urlsplit

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.db import SessionLocal
from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv
from app.ws.deps import channel_of, membership
from app.ws.realtime import TopicQueue, broker, channel_topic, user_topic, workspace_topic
from app.ws.security import SESSION_COOKIE, read_session

router = APIRouter(tags=["realtime"])

EVENT_OPENED = "realtime.connection.opened"
EVENT_MESSAGE = "channel.message.created"
EVENT_SUBSCRIBED = "channel.subscription.confirmed"
EVENT_REFUSED = "channel.subscription.refused"
CLOSE_UNAUTHENTICATED = 4401
CLOSE_FORBIDDEN_ORIGIN = 4403
CLOSE_OVERFLOWED = 4408
CLOSE_UNSUPPORTED = 1003
# Missed messages replayed on (re)subscribe; a longer gap is covered by the page reload the client does anyway.
BACKLOG_MAX = 200
CHANNELS_PER_CONNECTION_MAX = 5
BEARER_PREFIX = "bearer "


def _token_of(socket: WebSocket) -> str | None:
    header = socket.headers.get("authorization", "")
    if header.lower().startswith(BEARER_PREFIX):
        return header[len(BEARER_PREFIX):].strip()
    return socket.cookies.get(SESSION_COOKIE)


def is_allowed_origin(origin: str | None, host: str | None) -> bool:
    """Browsers send cookies on cross-site WebSocket handshakes too, so a page elsewhere must not open one.
    Non-browser clients send no Origin; behind the Next.js rewrite or the proxy the origin is the app's own."""
    if not origin:
        return True
    allowed = {o.rstrip("/") for o in settings.cors_origins} | {settings.frontend_url.rstrip("/")}
    return origin.rstrip("/") in allowed or urlsplit(origin).netloc == host


def _user_exists(user_id: str) -> bool:
    with SessionLocal() as s:
        return s.get(m.User, user_id) is not None


def _workspace_ids(user_id: str) -> set[str]:
    with SessionLocal() as s:
        return set(s.scalars(select(m.Member.workspace_id).where(m.Member.user_id == user_id,
                                                                 m.Member.left_at.is_(None))))


def _resolve_channel(user_id: str, workspace_id: str, channel_ref: str) -> str | None:
    """Id of the channel (given by id or name) when the user is a current member of its workspace."""
    with SessionLocal() as s:
        ws = s.get(m.Workspace, workspace_id)
        if not ws or ws.kind != "shared" or not membership(s, ws.id, user_id):
            return None
        try:
            return channel_of(s, ws, channel_ref).id
        except ApiError:
            return None


def _backlog(channel_id: str, after: int) -> list[dict]:
    with SessionLocal() as s:
        rows = s.scalars(select(m.Message).where(m.Message.channel_id == channel_id, m.Message.seq > after)
                         .order_by(m.Message.seq).limit(BACKLOG_MAX))
        return [sv.message_out(s, x) for x in rows]


class Connection:
    """The topics one socket listens to, all feeding a single queue so events leave in the order they came."""

    def __init__(self, socket: WebSocket, user_id: str) -> None:
        self.socket, self.user_id = socket, user_id
        self.queue = TopicQueue()
        self.topics: set[str] = set()
        self.workspace_ids: set[str] = set()
        self.workspace_by_channel_id: dict[str, str] = {}
        self.seq_by_channel_id: dict[str, int] = {}

    def listen(self, topic: str) -> None:
        if topic not in self.topics:
            broker.subscribe(topic, self.queue)
            self.topics.add(topic)

    def stop(self, topic: str) -> None:
        if topic in self.topics:
            broker.unsubscribe(topic, self.queue)
            self.topics.discard(topic)

    def stop_all(self) -> None:
        for topic in list(self.topics):
            self.stop(topic)

    async def send(self, event: dict) -> None:
        await self.socket.send_text(json.dumps(event, ensure_ascii=False))

    async def follow_memberships(self) -> None:
        current = await run_in_threadpool(_workspace_ids, self.user_id)
        for workspace_id in self.workspace_ids - current:
            self.stop(workspace_topic(workspace_id))
        for workspace_id in current:
            self.listen(workspace_topic(workspace_id))
        self.workspace_ids = current
        for channel_id, workspace_id in list(self.workspace_by_channel_id.items()):
            if workspace_id not in current:
                self.drop_channel(channel_id)

    def drop_channel(self, channel_id: str) -> None:
        self.stop(channel_topic(channel_id))
        self.workspace_by_channel_id.pop(channel_id, None)
        self.seq_by_channel_id.pop(channel_id, None)

    async def subscribe(self, request: dict) -> None:
        workspace_id, channel_ref, after = request.get("workspaceId"), request.get("channelId"), request.get("after")
        if not isinstance(workspace_id, str) or not isinstance(channel_ref, str):
            return await self.send({"type": EVENT_REFUSED, "channelId": channel_ref})
        channel_id = await run_in_threadpool(_resolve_channel, self.user_id, workspace_id, channel_ref)
        is_full = len(self.workspace_by_channel_id) >= CHANNELS_PER_CONNECTION_MAX
        if channel_id is None or (is_full and channel_id not in self.workspace_by_channel_id):
            return await self.send({"type": EVENT_REFUSED, "channelId": channel_ref})
        # Listen first, then replay: a message posted in between is in the queue and deduplicated by seq.
        self.listen(channel_topic(channel_id))
        self.workspace_by_channel_id[channel_id] = workspace_id
        start = after if isinstance(after, int) and not isinstance(after, bool) and after >= 0 else None
        self.seq_by_channel_id[channel_id] = max(self.seq_by_channel_id.get(channel_id, 0), start or 0)
        if start is not None:
            for message in await run_in_threadpool(_backlog, channel_id, start):
                await self.deliver_message(message)
        await self.send({"type": EVENT_SUBSCRIBED, "channelId": channel_id, "channelRef": channel_ref,
                         "lastSeq": self.seq_by_channel_id[channel_id]})

    async def deliver_message(self, message: dict) -> None:
        channel_id = message["channelId"]
        if channel_id not in self.workspace_by_channel_id or message["seq"] <= self.seq_by_channel_id.get(channel_id, 0):
            return
        self.seq_by_channel_id[channel_id] = message["seq"]
        await self.send({"type": EVENT_MESSAGE, "message": message})

    async def handle_request(self, raw: str) -> bool:
        """False ends the connection: the client spoke something other than this protocol."""
        try:
            request = json.loads(raw)
        except json.JSONDecodeError:
            return False
        if not isinstance(request, dict):
            return False
        if request.get("type") == "subscribe":
            await self.subscribe(request)
        elif request.get("type") == "unsubscribe" and isinstance(request.get("channelId"), str):
            self.drop_channel(request["channelId"])
        return True

    async def deliver(self, event: dict) -> None:
        if event.get("type") == "message":
            return await self.deliver_message(event["message"])
        if event.get("type") == sv.EVENT_MEMBERSHIP:
            await self.follow_memberships()
        await self.send(event)


@router.websocket("/realtime")
async def realtime(socket: WebSocket) -> None:
    await socket.accept()
    if not is_allowed_origin(socket.headers.get("origin"), socket.headers.get("host")):
        return await socket.close(code=CLOSE_FORBIDDEN_ORIGIN)
    user_id = read_session(_token_of(socket))
    if not user_id or not await run_in_threadpool(_user_exists, user_id):
        return await socket.close(code=CLOSE_UNAUTHENTICATED)
    connection = Connection(socket, user_id)
    connection.listen(user_topic(user_id))
    receiving = asyncio.ensure_future(socket.receive_text())
    waiting = asyncio.ensure_future(connection.queue.get())
    try:
        await connection.follow_memberships()
        await connection.send({"type": EVENT_OPENED})
        while True:
            done, _ = await asyncio.wait({receiving, waiting}, return_when=asyncio.FIRST_COMPLETED)
            if receiving in done:
                if not await connection.handle_request(receiving.result()):
                    return await socket.close(code=CLOSE_UNSUPPORTED)
                receiving = asyncio.ensure_future(socket.receive_text())
            if waiting in done:
                await connection.deliver(waiting.result())
                waiting = asyncio.ensure_future(connection.queue.get())
            if connection.queue.has_overflowed:
                # Events were dropped: the client reconnects and replays from the last seq it saw.
                return await socket.close(code=CLOSE_OVERFLOWED)
    except (WebSocketDisconnect, RuntimeError):
        # The peer went away: receiving raises WebSocketDisconnect, sending after the close raises RuntimeError.
        return None
    finally:
        receiving.cancel()
        waiting.cancel()
        connection.stop_all()
