"""Datasets of AcademicTask, uploaded as JSONL (one task per line)."""

import json
import time
from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_session
from app.errors import ApiError
from app.models import Dataset
from app.schemas import AcademicTask

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


def _summary(ds: Dataset) -> dict[str, Any]:
    return {"id": ds.id, "name": ds.name, "version": ds.version, "taskCount": len(ds.tasks)}


@router.get("")
def list_datasets(session: Session = Depends(get_session)) -> dict[str, Any]:
    rows = session.scalars(select(Dataset).order_by(Dataset.created_at))
    return {"datasets": [{**_summary(ds), "tasks": ds.tasks} for ds in rows]}


@router.post("", status_code=201)
async def upload_jsonl(request: Request, datasetId: str | None = None, name: str | None = None,
                       version: str | None = None, session: Session = Depends(get_session)) -> Any:
    """Body: raw JSONL. `?datasetId=` replaces the tasks of that dataset (or creates it); `?name=&version=` label it."""
    text = (await request.body()).decode("utf-8", errors="replace")
    lines = [(i, ln) for i, ln in enumerate(text.splitlines(), start=1) if ln.strip()]
    if not lines:
        raise ApiError(400, "Body rỗng: cần ít nhất một dòng JSON.")
    tasks, errors, seen = [], [], set()
    for no, line in lines:
        try:
            task = AcademicTask.model_validate(json.loads(line))
        except json.JSONDecodeError as exc:
            errors.append({"line": no, "message": f"JSON không hợp lệ: {exc.msg}"})
            continue
        except ValidationError as exc:
            for e in exc.errors():
                errors.append({"line": no, "field": ".".join(map(str, e["loc"])) or None, "message": e["msg"]})
            continue
        if task.id in seen:
            errors.append({"line": no, "field": "id", "message": f'Trùng id "{task.id}".'})
            continue
        seen.add(task.id)
        tasks.append(task.model_dump(by_alias=True, exclude_none=True))
    if errors:
        return JSONResponse({"success": False, "totalLines": len(lines), "validCount": len(tasks),
                             "errorCount": len(errors), "errors": errors}, status_code=422)
    ds = session.get(Dataset, datasetId) if datasetId else None
    if ds is None:
        ds = Dataset(id=datasetId or f"ds_{time.time_ns()}", name=name or datasetId or "Dataset tải lên",
                     version=version or "1", tasks=tasks)
        session.add(ds)
    else:
        ds.tasks = tasks
        ds.name, ds.version = name or ds.name, version or ds.version
    session.commit()
    return {"success": True, "message": f"Đã nạp {len(tasks)} task vào {ds.id}.", "datasetId": ds.id,
            "taskCount": len(tasks), "tasks": tasks}


@router.get("/{dataset_id}/tasks")
def dataset_tasks(dataset_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    ds = session.get(Dataset, dataset_id)
    if ds is None:
        raise ApiError(404, f'Dataset "{dataset_id}" không tồn tại.')
    return {"datasetId": ds.id, "taskCount": len(ds.tasks), "tasks": ds.tasks}
