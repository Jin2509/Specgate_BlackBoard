"""/api/runs collection, evaluation runs (chat testbed / history), /api/logs/stream and /api/stats.

POST /api/runs has two modes: `mode: "evaluation"` records an evaluation run, anything else starts a pipeline run.
Static paths (/current, /export) are declared before /{run_id}.
"""

import asyncio
import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app import evaluation
from app.db import SessionLocal, get_session
from app.errors import ApiError
from app.jobs import create_pipeline_run
from app.models import Dataset, EvalRun, Run
from app.routers.run_views import manifest
from app.schemas import ClearRunsIn, EvalRunCreate, FollowupIn, ReviewIn, RunCreate, RunPatch

CLEAR_PHRASE = "XOA LICH SU"
EVAL_TERMINAL = ("final", "error")

router = APIRouter(tags=["runs"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _eval_run(session: Session, run_id: str) -> EvalRun:
    run = session.get(EvalRun, run_id)
    if run is None:
        raise ApiError(404, f'Run "{run_id}" không tồn tại.')
    return run


def _validation(exc: ValidationError) -> ApiError:
    return ApiError(400, "Dữ liệu không hợp lệ: " + "; ".join(
        f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in exc.errors()), "VALIDATION_ERROR")


@router.post("/runs", status_code=201)
async def create_run(request: Request, background: BackgroundTasks,
                     session: Session = Depends(get_session)) -> Any:
    raw = await request.body()
    try:
        body = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        raise ApiError(400, "Body không phải JSON hợp lệ.")
    if not isinstance(body, dict):
        raise ApiError(400, "Body phải là một object JSON.")
    try:
        if body.get("mode") == "evaluation":
            return {"run": evaluation.run_out(_create_eval_run(session, EvalRunCreate.model_validate(body)))}
        req = RunCreate.model_validate(body)
    except ValidationError as exc:
        raise _validation(exc)
    run = create_pipeline_run(session, background, dataset_id=req.dataset_id, seed=req.seed,
                              held_out_ratio=req.held_out_ratio, level=req.level, task_ids=req.task_ids)
    return manifest(run).model_dump(mode="json", by_alias=True)


def _create_eval_run(session: Session, body: EvalRunCreate) -> EvalRun:
    if session.get(Dataset, body.datasetId) is None:
        raise ApiError(400, f'Dataset "{body.datasetId}" không tồn tại.')
    now = _now()
    run = EvalRun(
        id=f"eval_{time.time_ns()}", created_at=now, updated_at=now, dataset_id=body.datasetId,
        dataset_version=body.datasetVersion, problem_id=body.problemId, problem=body.problem, status="queued",
        turns=[{"id": uuid.uuid4().hex, "role": "user", "content": body.problem, "at": now.isoformat()}],
    )
    session.add(run)
    session.commit()
    return run


@router.get("/runs")
def list_runs(page: int = Query(1, ge=1), pageSize: int = Query(25, ge=1, le=100), verdict: str | None = None,
              problem: str | None = None, dataset: str | None = None, from_: str | None = Query(None, alias="from"),
              to: str | None = None, session: Session = Depends(get_session)) -> dict[str, Any]:
    runs = [r for r in session.scalars(select(EvalRun).order_by(EvalRun.created_at.desc()))
            if evaluation.matches(r, verdict, problem, dataset, from_, to)]
    start = (page - 1) * pageSize
    return {"total": len(runs), "page": page, "pageSize": pageSize,
            "runs": [evaluation.run_out(r) for r in runs[start:start + pageSize]]}


@router.delete("/runs")
def clear_runs(body: ClearRunsIn, session: Session = Depends(get_session)) -> dict[str, bool]:
    if body.confirmation != CLEAR_PHRASE:
        raise ApiError(400, f'Cụm xác nhận phải là "{CLEAR_PHRASE}".')
    session.execute(delete(EvalRun))
    session.commit()
    return {"deleted": True}


@router.get("/runs/current")
def current_run(session: Session = Depends(get_session)) -> dict[str, str]:
    """The newest pipeline run; pages without [runId] in the URL work on it."""
    run = session.scalar(select(Run).order_by(Run.created_at.desc()).limit(1))
    if run is None:
        raise ApiError(404, "Chưa có run nào. Hãy tạo run hoặc chạy thực nghiệm trước.")
    return {"runId": run.id}


@router.get("/runs/export")
def export_runs(format: Literal["csv", "json", "stats"] = "json", session: Session = Depends(get_session)) -> Response:
    runs = list(session.scalars(select(EvalRun).order_by(EvalRun.created_at.desc())))
    stamp = _now().strftime("%Y%m%d-%H%M%S")
    if format == "csv":
        body, media, ext = evaluation.to_csv(runs), "text/csv; charset=utf-8", "csv"
    else:
        data: Any = evaluation.metrics(runs) if format == "stats" else [evaluation.run_out(r) for r in runs]
        body, media, ext = json.dumps(data, ensure_ascii=False, indent=2), "application/json", "json"
    name = f"runs-{'stats-' if format == 'stats' else ''}{stamp}.{ext}"
    return Response(body, media_type=media, headers={"Content-Disposition": f'attachment; filename="{name}"'})


@router.get("/runs/{run_id}")
def get_run(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    return {"run": evaluation.run_out(_eval_run(session, run_id))}


@router.patch("/runs/{run_id}")
def patch_run(run_id: str, body: RunPatch, session: Session = Depends(get_session)) -> dict[str, Any]:
    run = _eval_run(session, run_id)
    now = _now().isoformat()
    if body.patch is not None:
        for key, value in body.patch.model_dump(exclude_unset=True).items():
            setattr(run, key, value)
    if body.turn is not None:
        turn = {"id": uuid.uuid4().hex, **body.turn.model_dump(exclude_none=True), "at": now}
        run.turns = [*run.turns, turn]
    if body.verdict is not None:
        run.verdicts = [*run.verdicts, body.verdict]
    if body.latency:
        run.latency = {**run.latency, **body.latency}
    if body.log is not None:
        run.logs = [*run.logs, {"id": uuid.uuid4().hex, "at": now, "level": body.level, "message": body.log}]
    run.updated_at = _now()
    session.commit()
    return {"run": evaluation.run_out(run)}


@router.patch("/runs/{run_id}/review")
def review_run(run_id: str, body: ReviewIn, session: Session = Depends(get_session)) -> dict[str, Any]:
    run = _eval_run(session, run_id)
    run.review = {"agree": body.agree, "note": body.note, "at": _now().isoformat()}
    run.updated_at = _now()
    session.commit()
    return {"run": evaluation.run_out(run)}


@router.post("/runs/{run_id}/followup")
def followup(run_id: str, body: FollowupIn, session: Session = Depends(get_session)) -> dict[str, Any]:
    if not body.content.strip():
        raise ApiError(400, "Nội dung lượt bổ sung không được rỗng.")
    run = _eval_run(session, run_id)
    if run.followup_used:
        raise ApiError(409, "Run này đã dùng lượt bổ sung duy nhất.")
    now = _now()
    run.turns = [*run.turns, {"id": uuid.uuid4().hex, "role": "user", "content": body.content, "at": now.isoformat()}]
    run.followup_used, run.status, run.updated_at = True, "followup", now
    session.commit()
    return {"run": evaluation.run_out(run)}


@router.get("/logs/stream")
async def stream_logs(request: Request, runId: str | None = None,
                      session: Session = Depends(get_session)) -> StreamingResponse:
    """SSE of RunLog entries; closes once the run is final or error and every log has been sent."""
    if not runId:
        raise ApiError(400, "Thiếu runId.")
    _eval_run(session, runId)

    async def gen():
        sent = 0
        while True:
            with SessionLocal() as s:
                run = s.get(EvalRun, runId)
                if run is None:
                    return
                logs, finished = list(run.logs or []), run.status in EVAL_TERMINAL
            for log in logs[sent:]:
                yield f"data: {json.dumps(log, ensure_ascii=False)}\n\n"
            sent = len(logs)
            if finished or await request.is_disconnected():
                return
            yield ": keep-alive\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/stats")
def stats(dataset: str | None = None, verdict: str | None = None, from_: str | None = Query(None, alias="from"),
          to: str | None = None, session: Session = Depends(get_session)) -> JSONResponse:
    runs = [r for r in session.scalars(select(EvalRun).order_by(EvalRun.created_at.desc()))
            if evaluation.matches(r, verdict, None, dataset, from_, to)]
    return JSONResponse({"metrics": evaluation.metrics(runs), "runs": [evaluation.run_out(r) for r in runs]})
