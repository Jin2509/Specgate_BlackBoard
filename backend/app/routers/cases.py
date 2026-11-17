"""Cases (one per non-holdout ADOM verdict), repair candidates, human query tickets and the annotation queue."""

import random
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import views
from app.db import get_session
from app.errors import ApiError, engine_not_configured
from app.events import append_event
from app.models import RunEvent, Ticket
from app.routers.run_views import get_run
from app.schemas import TicketAnswerIn
from app.tickets import parse_case_id, ticket_out

router = APIRouter(tags=["cases"])


def _case_event(session: Session, cid: str, run_id: str | None = None) -> RunEvent:
    parsed = parse_case_id(cid)
    ev = views.get_case_event(session, *parsed) if parsed and (run_id is None or parsed[0] == run_id) else None
    if ev is None:
        raise ApiError(404, f'Case "{cid}" không tồn tại.')
    return ev


@router.get("/cases")
def list_cases(runId: str | None = None, hasTicket: bool = False,
               session: Session = Depends(get_session)) -> dict[str, Any]:
    return {"cases": views.list_cases(session, runId, hasTicket)}


@router.get("/cases/{case_id}")
def get_case(case_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    return views.case_dossier(session, _case_event(session, case_id))


@router.get("/runs/{run_id}/cases/{case_id}/repair-candidates")
def repair_candidates(run_id: str, case_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    get_run(session, run_id)
    ev = _case_event(session, case_id, run_id)
    return {"caseId": case_id, "candidates": views.repair_candidates(session, run_id, ev)}


@router.post("/cases/{case_id}/repair/deploy")
def deploy_repair(case_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    _case_event(session, case_id)
    raise engine_not_configured(
        "ADOM triển khai bản vá ngay trong pipeline (sự kiện repair_deployed) theo chính sách của run; "
        "backend chưa có engine để triển khai thủ công một ứng viên.")


@router.post("/runs/{run_id}/cases/{case_id}/stream")
def stream_case(run_id: str, case_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    get_run(session, run_id)
    _case_event(session, case_id, run_id)
    raise engine_not_configured(
        "Chưa có engine phân xử tương tác (oracle P0/code theo prompt); ADOM chỉ chạy theo lô qua pipeline.")


def _ticket(session: Session, ticket_id: str) -> Ticket:
    t = session.get(Ticket, ticket_id)
    if t is None:
        raise ApiError(404, f'Vé "{ticket_id}" không tồn tại.')
    return t


@router.post("/tickets/{ticket_id}/answer")
def answer_ticket(ticket_id: str, body: TicketAnswerIn, session: Session = Depends(get_session)) -> dict[str, Any]:
    t = _ticket(session, ticket_id)
    if t.status == "spent":
        raise ApiError(409, "Vé này đã được trả lời (mỗi vé chỉ dùng một lần).", "TICKET_ALREADY_SPENT")
    t.status, t.answer, t.is_uncertain = "spent", body.answer, bool(body.is_uncertain)
    t.answered_at, t.response_duration_ms = datetime.now(timezone.utc), body.duration_ms
    session.commit()
    append_event(session, t.run_id, "human_answer",
                 {"ticketId": t.id, "caseId": t.case_id, "answer": t.answer, "isUncertain": t.is_uncertain})
    # No resolvedVerdict: ADOM does not re-adjudicate inside the backend, so none is invented here.
    return {"success": True, "ticket": ticket_out(t),
            "message": "Đã ghi câu trả lời. Backend không phân xử lại nên chưa có verdict cuối."}


@router.post("/tickets/{ticket_id}/defer")
def defer_ticket(ticket_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    t = _ticket(session, ticket_id)
    if t.status == "spent":
        raise ApiError(409, "Vé này đã được trả lời.", "TICKET_ALREADY_SPENT")
    t.defer_count += 1
    session.commit()
    return {"success": True, "ticketId": t.id, "status": "open", "message": "Đã hoãn vé."}


@router.get("/runs/{run_id}/annotation-queue")
def annotation_queue(run_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    run = get_run(session, run_id)
    items = []
    for t in session.scalars(select(Ticket).where(Ticket.run_id == run.id, Ticket.status != "spent")
                             .order_by(Ticket.id)):
        parsed = parse_case_id(t.case_id)
        ev = views.get_case_event(session, *parsed) if parsed else None
        if ev is None:
            continue
        case = views.case_dossier(session, ev)
        items.append({**case, "ticket": ticket_out(t), "isUniqueOutput": case["uniqueOutput"]})
    # Same seed, same order for every annotator.
    random.Random(run.seed).shuffle(items)
    return {"runId": run.id, "seed": run.seed, "total": len(items), "items": items}
