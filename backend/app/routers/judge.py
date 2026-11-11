"""POST /api/run and /api/run/followup: stateless pipeline on a dataset task with the user's own API keys.

Nothing is written to the database (the task is only read). The keys arrive in the JSON body, live only in this
request and are dropped when it ends. Never log the request body.
"""

import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import judge
from app.db import get_session
from app.errors import ApiError
from app.models import Dataset
from app.schemas import JudgeFollowupIn, JudgeRunIn

router = APIRouter(tags=["run"])


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _task(session: Session, dataset_id: str, task_id: str) -> dict[str, Any]:
    dataset = session.get(Dataset, dataset_id)
    if dataset is None:
        raise ApiError(404, f'Không có dataset "{dataset_id}".', "NOT_FOUND")
    task = next((t for t in dataset.tasks if t.get("id") == task_id), None)
    if task is None:
        raise ApiError(404, f'Dataset "{dataset_id}" không có tác vụ "{task_id}".', "NOT_FOUND")
    return task


def _stream(events: AsyncIterator[judge.Event]) -> StreamingResponse:
    async def gen() -> AsyncIterator[str]:
        try:
            async for event, data in events:
                yield _sse(event, data)
        except Exception:  # noqa: BLE001 - the message must stay generic: it may otherwise carry request data
            yield _sse("error", {"message": "Lỗi nội bộ khi chạy pipeline."})

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/api/run")
def run(body: JudgeRunIn, session: Session = Depends(get_session)) -> StreamingResponse:
    return _stream(judge.run(body, _task(session, body.dataset_id, body.task_id)))


@router.post("/api/run/followup")
def followup(body: JudgeFollowupIn, session: Session = Depends(get_session)) -> StreamingResponse:
    return _stream(judge.followup(body, _task(session, body.dataset_id, body.task_id)))
