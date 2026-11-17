"""In-process pub/sub for channel messages (FR-41, NFR-05). One backend process; swap for Supabase Realtime or
Postgres LISTEN/NOTIFY when running several. Subscribers that miss events reconnect with ?after=<seq>."""

import asyncio
from collections import defaultdict


class Broker:
    def __init__(self) -> None:
        self._subs: dict[str, set[tuple[asyncio.AbstractEventLoop, asyncio.Queue]]] = defaultdict(set)

    def subscribe(self, topic: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self._subs[topic].add((asyncio.get_running_loop(), q))
        return q

    def unsubscribe(self, topic: str, q: asyncio.Queue) -> None:
        self._subs[topic] = {(lp, x) for lp, x in self._subs[topic] if x is not q}
        if not self._subs[topic]:
            self._subs.pop(topic, None)

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
        pass   # slow client; it resyncs with ?after=


broker = Broker()


def channel_topic(channel_id: str) -> str:
    return f"channel:{channel_id}"
