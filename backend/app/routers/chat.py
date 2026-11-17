"""POST /api/run and /api/run/followup (SSE): the chat page.

Every first round is recorded as an evaluation run (table eval_runs), so it shows up in History and Stats;
the follow-up is written into the same run. The first SSE event is `run` with its id. API keys come in
the body as SecretStr, are unwrapped only to call the engine and never reach the database, a log line or
an error message.
"""

import json
import time
import uuid
from collections.abc import Iterable, Iterator
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import judge
from app.db import SessionLocal, get_session
from app.errors import ApiError, engine_not_configured
from app.models import Dataset, EvalRun
from app.schemas import ChatFollowupIn, ChatRunIn, LlmConfigIn

router = APIRouter(prefix="/run", tags=["chat"])

# Chat verdict -> EvalVerdict of the UI (Stats groups by these).
TO_EVAL = {"consistent": "ACC", "spec_fault": "SPEC_FAULT", "code_fault": "CODE_FAULT", "unknown": "UNKNOWN"}
STEP_STATUS = {"spec": "spec_running", "code": "code_running", "check": "judging"}
NO_ENGINE = "Chưa có engine Hỏi đáp: script ADOM chưa có lệnh chạy một tác vụ và trả kết luận."


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _llm(cfg: LlmConfigIn) -> judge.Llm:
    return judge.Llm(provider=cfg.provider, model=cfg.model, api_key=cfg.apiKey.get_secret_value())


def _task(session: Session, dataset_id: str, task_id: str) -> tuple[Dataset, dict[str, Any]]:
    ds = session.get(Dataset, dataset_id)
    if ds is None:
        raise ApiError(404, f'Dataset "{dataset_id}" không tồn tại.', "NOT_FOUND")
    task = next((t for t in ds.tasks if t.get("id") == task_id), None)
    if task is None:
        raise ApiError(404, f'Không có tác vụ "{task_id}" trong dataset "{dataset_id}".', "NOT_FOUND")
    return ds, task


def _agent(role: str, cfg: LlmConfigIn) -> dict[str, Any]:
    return {"agent": role, "model": cfg.model, "version": cfg.provider, "status": "queued"}


def _turn(role: str, content: str, **extra: Any) -> dict[str, Any]:
    return {"id": uuid.uuid4().hex, "role": role, "content": content, "at": _now().isoformat(), **extra}


def _apply(run: EvalRun, ev: dict[str, Any], followup: bool) -> None:
    """Writes one engine event into the run. JSON columns get a new object: in-place changes are not tracked."""
    data = ev["data"]
    if ev["event"] == "step":
        step = data["step"]
        if data["status"] == "running":
            run.status = STEP_STATUS.get(step, run.status)
            if step in ("spec", "code"):
                setattr(run, step, {**(getattr(run, step) or {}), "status": "running"})
        elif data["status"] == "done":
            if step in ("spec", "code"):
                setattr(run, step, {**(getattr(run, step) or {}), "status": "done", "output": data.get("output", ""),
                                    "latencyMs": data.get("durationMs")})
            if data.get("durationMs") is not None:
                key = f"{step}_followup" if followup else step
                run.latency = {**(run.latency or {}), key: data["durationMs"]}
    elif ev["event"] == "verdict":
        verdict = TO_EVAL.get(data["verdict"], "UNKNOWN")
        run.verdicts = [*(run.verdicts or []), verdict]
        run.turns = [*(run.turns or []), _turn("system", data.get("reason", ""), verdict=verdict)]
        run.status = "answered" if data.get("question") and not followup else "final"
    run.updated_at = _now()


def _clean(message: str, secrets: Iterable[str]) -> str:
    for secret in secrets:
        if secret:
            message = message.replace(secret, "***")
    return message


def _stream(run_id: str, events: Iterator[dict[str, Any]], followup: bool, secrets: list[str]) -> StreamingResponse:
    def gen() -> Iterator[str]:
        yield _sse("run", {"runId": run_id})
        with SessionLocal() as s:
            try:
                for ev in events:
                    run = s.get(EvalRun, run_id)
                    _apply(run, ev, followup)
                    s.commit()
                    yield _sse(ev["event"], ev["data"])
            except Exception as exc:  # noqa: BLE001 — every engine failure ends the stream with `error`
                s.rollback()
                message = _clean(str(exc) or exc.__class__.__name__, secrets)
                run = s.get(EvalRun, run_id)
                run.status, run.updated_at = "error", _now()
                for role in ("spec", "code"):
                    agent = getattr(run, role)
                    if agent and agent.get("status") == "running":
                        setattr(run, role, {**agent, "status": "error", "error": message})
                run.logs = [*(run.logs or []), {"id": uuid.uuid4().hex, "at": _now().isoformat(),
                                                "level": "error", "message": message}]
                s.commit()
                yield _sse("error", {"message": message})

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("")
def run_task(body: ChatRunIn, session: Session = Depends(get_session)) -> StreamingResponse:
    ds, task = _task(session, body.datasetId, body.taskId)
    if not judge.available():
        raise engine_not_configured(NO_ENGINE)
    now = _now()
    run = EvalRun(
        id=f"eval_{time.time_ns()}", created_at=now, updated_at=now, dataset_id=ds.id,
        dataset_version=ds.version, problem_id=body.taskId,
        problem=task.get("intentDocstring") or task.get("name") or body.taskId, status="queued",
        spec=_agent("spec", body.llmSpec), code=_agent("code", body.llmCode),
    )
    session.add(run)
    session.commit()
    spec_llm, code_llm = _llm(body.llmSpec), _llm(body.llmCode)
    return _stream(run.id, judge.run_first(task, spec_llm, code_llm), followup=False,
                   secrets=[spec_llm.api_key, code_llm.api_key])


@router.post("/followup")
def followup(body: ChatFollowupIn, session: Session = Depends(get_session)) -> StreamingResponse:
    _, task = _task(session, body.datasetId, body.taskId)
    run = session.get(EvalRun, body.runId)
    if run is None or run.problem_id != body.taskId or run.dataset_id != body.datasetId:
        raise ApiError(404, f'Run "{body.runId}" không tồn tại cho tác vụ này.', "NOT_FOUND")
    if run.followup_used:
        raise ApiError(409, "Run này đã dùng lượt hỏi lại duy nhất.")
    if run.status != "answered":
        raise ApiError(409, "Run này không chờ câu trả lời (chỉ hỏi lại khi kết luận là unknown).")
    if not judge.available():
        raise engine_not_configured(NO_ENGINE)
    run.followup_used, run.status, run.updated_at = True, "followup", _now()
    run.turns = [*(run.turns or []), _turn("user", body.answer)]
    session.commit()
    spec_llm = _llm(body.llmSpec)
    return _stream(run.id, judge.run_followup(task, spec_llm, body.spec, body.code, body.answer), followup=True,
                   secrets=[spec_llm.api_key])
