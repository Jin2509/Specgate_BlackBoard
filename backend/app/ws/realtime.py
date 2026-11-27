"""In-process pub/sub for channel messages and workspace events (FR-41, NFR-05). One backend process; swap for
Postgres LISTEN/NOTIFY or Redis when running several. Subscribers that miss events reconnect with ?after=<seq>."""

import asyncio
from collections import defaultdict

QUEUE_SIZE_MAX = 1000


class TopicQueue(asyncio.Queue):
    """A subscriber's queue; `has_overflowed` turns true once an event was dropped, so the reader can resync."""

    def __init__(self, maxsize: int = QUEUE_SIZE_MAX) -> None:
        super().__init__(maxsize=maxsize)
        self.has_overflowed = False


class Broker:
    def __init__(self) -> None:
        self._subs: dict[str, set[tuple[asyncio.AbstractEventLoop, asyncio.Queue]]] = defaultdict(set)

    def subscribe(self, topic: str, q: asyncio.Queue | None = None) -> asyncio.Queue:
        """Add a queue to a topic; one queue may listen to many topics."""
        q = q if q is not None else TopicQueue()
        self._subs[topic].add((asyncio.get_running_loop(), q))
        return q

    def unsubscribe(self, topic: str, q: asyncio.Queue) -> None:
        self._subs[topic] = {(lp, x) for lp, x in self._subs[topic] if x is not q}
        if not self._subs[topic]:
            self._subs.pop(topic, None)

    def subscriber_count(self, topic: str) -> int:
        return len(self._subs.get(topic, ()))

    def publish(self, topic: str, event: dict) -> None:
        """Safe from sync endpoints (worker threads) and async code alike."""
        for loop, q in list(self._subs.get(topic, ())):
            try:
                loop.call_soon_threadsafe(_put, q, event)
            except RuntimeError:   # loop closed
                pass


def _put(q: asyncio.Queue, event: dict) -> None:
    try:
        q.put_nowait(event)
    except asyncio.QueueFull:
        # Slow client: an SSE reader resyncs with ?after=, a WebSocket reader is closed and reconnects.
        if isinstance(q, TopicQueue):
            q.has_overflowed = True


broker = Broker()


def channel_topic(channel_id: str) -> str:
    return f"channel:{channel_id}"


def workspace_topic(workspace_id: str) -> str:
    return f"workspace:{workspace_id}"


def user_topic(user_id: str) -> str:
    return f"user:{user_id}"
