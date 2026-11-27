# Limits the HTTP requests in progress so worker threads and pooled connections can never starve each other.

import asyncio
import json

from starlette.types import ASGIApp, Message, Receive, Scope, Send

SERVICE_UNAVAILABLE_STATUS = 503
RETRY_AFTER_S = 5


class ConcurrencyLimitMiddleware:
    """A request waits here, costing neither a thread nor a connection, until fewer than `limit` are in progress.

    Without it a burst deadlocks: threads wait for a connection while requests that hold one wait for a thread to
    validate their response. The permit is returned when the response starts, so long streams (SSE, model answers)
    do not keep it; WebSockets never take one.
    """

    def __init__(self, app: ASGIApp, limit: int, wait_timeout_s: float) -> None:
        self.app = app
        self.limit = limit
        self.wait_timeout_s = wait_timeout_s
        self._permits: asyncio.Semaphore | None = None
        self._loop: asyncio.AbstractEventLoop | None = None

    def _permits_for_loop(self) -> asyncio.Semaphore:
        # A semaphore belongs to one event loop; test clients start a new loop for each app run.
        loop = asyncio.get_running_loop()
        if self._permits is None or self._loop is not loop:
            self._permits, self._loop = asyncio.Semaphore(self.limit), loop
        return self._permits

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        permits = self._permits_for_loop()
        try:
            await asyncio.wait_for(permits.acquire(), timeout=self.wait_timeout_s)
        except TimeoutError:
            return await _send_busy(send)
        is_released = False

        def release() -> None:
            nonlocal is_released
            if not is_released:
                is_released = True
                permits.release()

        async def send_and_release(message: Message) -> None:
            if message["type"] == "http.response.start":
                release()
            await send(message)

        try:
            await self.app(scope, receive, send_and_release)
        finally:
            release()


async def _send_busy(send: Send) -> None:
    body = json.dumps({"error": {"code": "SERVER_BUSY", "message": "Máy chủ đang bận, hãy thử lại sau ít giây.",
                                 "details": []}}, ensure_ascii=False).encode()
    await send({"type": "http.response.start", "status": SERVICE_UNAVAILABLE_STATUS,
                "headers": [(b"content-type", b"application/json"), (b"retry-after", str(RETRY_AFTER_S).encode())]})
    await send({"type": "http.response.body", "body": body})
