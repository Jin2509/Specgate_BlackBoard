"""Human query tickets. The pipeline opens one per (run, task, witness) with an UNKNOWN verdict; people answer
them in the annotation queue. ADOM does not re-adjudicate inside the backend, so an answer is stored as a label
and no resolved verdict is derived from it."""

import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import RunEvent, Ticket


def case_id(run_id: str, seq: int) -> str:
    """A case is the `verdict` event at `seq` of a run."""
    return f"{run_id}~{seq}"


def parse_case_id(cid: str) -> tuple[str, int] | None:
    run_id, sep, seq = cid.rpartition("~")
    return (run_id, int(seq)) if sep and seq.isdigit() else None


def needs_ticket(rec: dict[str, Any]) -> bool:
    return str(rec.get("verdict", "")).startswith("UNKNOWN") and not rec.get("holdout")


def open_ticket_for(session: Session, run_id: str, ev: RunEvent) -> Ticket | None:
    rec = ev.data
    if not needs_ticket(rec):
        return None
    key = json.dumps(rec.get("w"), sort_keys=True)
    task_id = rec.get("task_id", "")
    exists = session.scalar(select(Ticket).where(
        Ticket.run_id == run_id, Ticket.task_id == task_id, Ticket.witness_key == key))
    if exists is not None:
        return None
    unique = bool(rec.get("unique_output"))
    cid = case_id(run_id, ev.seq)
    w = json.dumps(rec.get("w"), ensure_ascii=False)
    c = json.dumps(rec.get("c"), ensure_ascii=False)
    t = Ticket(
        id=f"tk_{cid}", run_id=run_id, case_id=cid, task_id=task_id, witness_key=key,
        witness=rec.get("w"), code_output=rec.get("c"),
        question_type="expected-output" if unique else "acceptability",
        prompt_text=(f"{task_id}: đầu ra đúng tại w = {w} là gì? (code trả về {c})" if unique
                     else f"{task_id}: với w = {w}, đầu ra {c} có chấp nhận được không?"),
    )
    session.add(t)
    session.commit()
    return t


def ticket_out(t: Ticket) -> dict[str, Any]:
    out: dict[str, Any] = {
        "id": t.id, "caseId": t.case_id, "witness": t.witness, "codeOutput": t.code_output,
        "status": t.status, "questionType": t.question_type, "promptText": t.prompt_text,
    }
    if t.status == "spent":
        out.update(answer=t.answer, isUncertain=bool(t.is_uncertain),
                   answeredAt=t.answered_at.isoformat() if t.answered_at else None)
        if t.response_duration_ms is not None:
            out["responseDurationMs"] = t.response_duration_ms
    return out
