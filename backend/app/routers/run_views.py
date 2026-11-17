"""Sub-resources of a pipeline run: manifest, summary, held-out lock, SSE events, admission, evidence,
revocation and RQ results. Read models come from app/views.py."""

import asyncio
import json
from typing import Any

from fastapi import APIRouter, Body, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import views
from app.db import SessionLocal, get_session
from app.errors import ApiError, engine_not_configured
from app.events import append_event, events_after
from app.models import Run
from app.schemas import AdmissionReviewRequest, LockHeldOut, RunEventOut, RunManifest

RQ_IDS = ("rq1", "rq2", "rq3", "rq4", "rq5", "rq6")

router = APIRouter(prefix="/runs/{run_id}", tags=["pipeline runs"])


def manifest(run: Run) -> RunManifest:
    return RunManifest(
        id=run.id,
        dataset_id=run.dataset_id,
        seed=run.seed,
        held_out_ratio=run.held_out_ratio,
        total_tasks=len(run.run_task_ids) + len(run.held_out_task_ids),
        run_task_ids=run.run_task_ids,
        held_out_task_ids=run.held_out_task_ids,
        is_held_out_locked=run.is_held_out_locked,
        active_monitor_version=run.active_monitor_version,
        status=run.status,
        created_at=run.created_at,
    )


def get_run(session: Session, run_id: str, status: int = 404) -> Run:
    run = session.get(Run, run_id)
    if run is None:
        raise ApiError(status, f'Run "{run_id}" không tồn tại.')
    return run


@router.get("/manifest", response_model=RunManifest, response_model_by_alias=True)
def get_manifest(run_id: str, session: Session = Depends(get_session)) -> RunManifest:
    return manifest(get_run(session, run_id))


@router.get("/summary")
def get_summary(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    return views.run_summary(session, get_run(session, run_id))


@router.post("/lock-heldout")
def lock_heldout(run_id: str, body: LockHeldOut | None = Body(None),
                 session: Session = Depends(get_session)) -> dict[str, Any]:
    """Locks the partition. ADOM holds out inputs inside each task (setup --seed), so seed and ratio can only
    change before the pipeline has started; afterwards they must match what the run used."""
    body = body or LockHeldOut()
    run = get_run(session, run_id, status=400)
    if run.is_held_out_locked:
        raise ApiError(400, "Phân vùng held-out đã khoá, không ghi đè được.")
    changes = {k: v for k, v in (("seed", body.seed), ("held_out_ratio", body.held_out_ratio))
               if v is not None and v != getattr(run, k)}
    if changes and run.status != "pending":
        raise ApiError(400, "Pipeline đã chạy với seed/tỷ lệ hiện tại; không đổi được nữa.")
    for k, v in changes.items():
        setattr(run, k, v)
    run.is_held_out_locked = True
    session.commit()
    append_event(session, run.id, "heldout_locked", {"seed": run.seed, "heldOutRatio": run.held_out_ratio})
    return {"success": True, "message": "Đã khoá phân vùng held-out.",
            "manifest": manifest(run).model_dump(mode="json", by_alias=True)}


@router.get("/events")
async def stream_events(
    run_id: str,
    request: Request,
    lastEventId: int = 0,
    follow: bool = True,
    session: Session = Depends(get_session),
) -> StreamingResponse:
    """SSE stream. Resumes after Last-Event-ID (header) or ?lastEventId=; follow=false sends the backlog and closes.

    A followed stream also closes once the run is done or failed and every event has been sent."""
    get_run(session, run_id)
    header = request.headers.get("last-event-id")
    start = int(header) if header and header.isdigit() else lastEventId

    async def gen():
        last = start
        while True:
            with SessionLocal() as s:
                # Status first: a run that is terminal here has written all its events.
                finished = s.get(Run, run_id).status in views.TERMINAL
                batch = events_after(s, run_id, last)
            for ev in batch:
                out = RunEventOut.model_validate(ev).model_dump(mode="json", by_alias=True)
                yield f"id: {ev.seq}\nevent: {ev.event}\ndata: {json.dumps(out['data'])}\n\n"
                last = ev.seq
            if not follow or finished or await request.is_disconnected():
                return
            yield ": keep-alive\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/admission")
def get_admission(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    return views.admission_report(session, get_run(session, run_id))


@router.post("/admission")
def rerun_admission(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    get_run(session, run_id)
    raise engine_not_configured(
        "Kiểm nạp chạy bên trong pipeline ADOM khi tạo run; backend chưa hỗ trợ chạy lại riêng bước này. "
        "Theo dõi tiến độ qua SSE events (admission_step, admission_completed).")


@router.post("/admission/review")
def mark_for_review(run_id: str, body: AdmissionReviewRequest,
                    session: Session = Depends(get_session)) -> dict[str, Any]:
    run = get_run(session, run_id)
    if body.task_id not in run.admission_reviewed_task_ids:
        run.admission_reviewed_task_ids = [*run.admission_reviewed_task_ids, body.task_id]
        session.commit()
    return {"runId": run.id, "reviewedTaskIds": run.admission_reviewed_task_ids}


@router.get("/evidence")
def get_evidence(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    return views.evidence(session, get_run(session, run_id))


@router.get("/revocation")
def get_revocation(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    run = get_run(session, run_id)
    return {"runId": run.id, "monitorHistory": views.monitor_history(session, run)}


@router.post("/revocation")
def inject_bad_trace(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    get_run(session, run_id)
    raise engine_not_configured(
        "Tiêm vết xấu cần chạy lại bước bảo trì của ADOM trên monitor hiện hành; backend chưa có engine này. "
        "Các lần thu hồi do pipeline thực hiện xem ở GET /revocation.")


@router.get("/results/{rq}")
def get_results(run_id: str, rq: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    get_run(session, run_id)
    if rq.lower() not in RQ_IDS:
        raise ApiError(404, f'RQ "{rq}" không hợp lệ (rq1 … rq6).')
    raise engine_not_configured(
        "Chưa có bước tổng hợp RQ1–RQ6 từ kết quả ADOM (scoring.compare) trong backend.")
