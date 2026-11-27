"""Checks task deadlines in the background and tells #chung once when an unfinished task's deadline passes (flow §13)."""

import asyncio
import logging

from starlette.concurrency import run_in_threadpool

from app.db import SessionLocal
from app.ws import service as sv
from app.ws import tasks as tk

logger = logging.getLogger(__name__)


def check_deadlines_once() -> int:
    """One round: announce every newly overdue task; return how many were announced."""
    with SessionLocal() as s:
        notices = tk.notify_overdue(s)
        s.commit()
        sv.publish(s, notices)
        return len(notices)


async def watch_deadlines(interval_s: float) -> None:
    """Run until cancelled at shutdown. Database work runs on a worker thread so the event loop keeps serving."""
    while True:
        await asyncio.sleep(interval_s)
        try:
            await run_in_threadpool(check_deadlines_once)
        except Exception:  # noqa: BLE001 - one failed round (database unreachable) must not stop later rounds
            logger.exception("deadline check failed", extra={"job": "deadline-watcher"})
