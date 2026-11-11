"""UI views built from what one pipeline run recorded: ADOM log records in run_events (`adom_event`, plus the
`verdict` copies that define cases) and the result files read by app/results.py.

ADOM names are mapped to the contract here and nowhere else (provenance kinds, repair families, Gate checks).
"""

import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import results
from app.models import Dataset, Run, RunEvent, Ticket
from app.tickets import case_id, ticket_out

TERMINAL = ("done", "failed")
ACTIVE = ("setup", "admit", "run")

# ADOM provenance kind -> ProvenanceSource of the UI; unmapped kinds (g-store, b-store, pbt) pass through.
PROVENANCE = {"anchor-docstring": "docstring_anchor", "mr-derived": "verified_mr", "a2": "formal_a2",
              "a3": "differential_a3", "human-query": "human_query"}
# ADOM grammar family -> RepairFamily of the UI.
FAMILY = {"boundary_relaxation": "broaden_bounds", "predicate_change": "replace_predicate",
          "case_exception": "case_exception", "point_patch": "point_patch"}
RULE_TEXT = {
    "R1": "Các nguồn grounded mâu thuẫn nhau tại w (hoặc c vừa được chấp nhận vừa bị bác bỏ).",
    "R2": "Bằng chứng grounded chấp nhận c nhưng đặc tả bác bỏ: lỗi ở đặc tả.",
    "R3": "c sai, có e(w) grounded và đặc tả bác bỏ cả e(w): lỗi ở cả code và đặc tả.",
    "R4": "c vi phạm tính chất grounded và đặc tả mâu thuẫn tính chất đó.",
    "R5": "Bằng chứng grounded bác bỏ c: lỗi ở code.",
    "R6": "Không có bằng chứng grounded tại w.",
}


def _iso(ts: float | datetime) -> str:
    if isinstance(ts, datetime):
        return ts.isoformat()
    return datetime.fromtimestamp(ts, timezone.utc).isoformat()


def adom_records(session: Session, run_id: str) -> list[dict[str, Any]]:
    stmt = (select(RunEvent.data).where(RunEvent.run_id == run_id, RunEvent.event == "adom_event")
            .order_by(RunEvent.seq))
    return list(session.scalars(stmt))


def _key(value: Any) -> str:
    return json.dumps(value, sort_keys=True, ensure_ascii=False)


# ── Cases ───────────────────────────────────────────────────────────────────

def verdict_events(session: Session, run_id: str | None = None) -> list[RunEvent]:
    """Case events: the `verdict` copies of ADOM VERDICT records, holdout replay excluded."""
    stmt = select(RunEvent).where(RunEvent.event == "verdict")
    if run_id is not None:
        stmt = stmt.where(RunEvent.run_id == run_id)
    return [ev for ev in session.scalars(stmt.order_by(RunEvent.run_id, RunEvent.seq)) if not ev.data.get("holdout")]


def dossier(ev: RunEvent, specs: dict[str, Any], ticket: Ticket | None) -> dict[str, Any]:
    rec = ev.data
    cid = case_id(ev.run_id, ev.seq)
    tid = rec.get("task_id", "")
    has_target = bool(rec.get("has_target"))
    rule = rec.get("rule", "")
    notes = list(rec.get("notes") or [])
    grounded = []
    for i, kind in enumerate(rec.get("provenances") or []):
        item = {"id": f"{cid}-g{i}", "isGrounded": True, "kind": "expected_output",
                "source": PROVENANCE.get(kind, kind), "input": rec.get("w"), "label": kind}
        if has_target:
            item["expected"] = rec.get("target")
        grounded.append(item)
    spec = specs.get(tid) or {}
    adjudication: dict[str, Any] = {
        "verdict": rec.get("verdict"), "matchedRule": rule, "skippedRules": [],
        "explanation": " ".join([RULE_TEXT.get(rule, ""), *notes]).strip(),
    }
    if has_target:
        adjudication["expectedOutput"] = rec.get("target")
    out: dict[str, Any] = {
        "id": cid, "runId": ev.run_id, "taskId": tid, "witness": rec.get("w"), "codeOutput": rec.get("c"),
        "specP0": (spec.get("monitor") or {}).get("dsl", ""),
        "groundedEvidence": grounded, "advisoryEvidence": [], "adjudication": adjudication,
        "currentMonitorVersion": f"P_{rec.get('monitor_version', 0)}",
        "phase": rec.get("phase"), "uniqueOutput": bool(rec.get("unique_output")), "at": rec.get("timestamp"),
    }
    if ticket is not None:
        out["ticket"] = ticket_out(ticket)
    return out


def list_cases(session: Session, run_id: str | None, has_ticket: bool) -> list[dict[str, Any]]:
    events = verdict_events(session, run_id)
    stmt = select(Ticket) if run_id is None else select(Ticket).where(Ticket.run_id == run_id)
    tickets = {t.case_id: t for t in session.scalars(stmt)}
    specs_by_run: dict[str, dict] = {}
    out = []
    for ev in events:
        t = tickets.get(case_id(ev.run_id, ev.seq))
        if has_ticket and t is None:
            continue
        if ev.run_id not in specs_by_run:
            specs_by_run[ev.run_id] = results.specs_or_empty(ev.run_id)
        out.append(dossier(ev, specs_by_run[ev.run_id], t))
    return out


def get_case_event(session: Session, run_id: str, seq: int) -> RunEvent | None:
    ev = session.scalar(select(RunEvent).where(RunEvent.run_id == run_id, RunEvent.seq == seq,
                                               RunEvent.event == "verdict"))
    return None if ev is None or ev.data.get("holdout") else ev


def case_dossier(session: Session, ev: RunEvent) -> dict[str, Any]:
    t = session.scalar(select(Ticket).where(Ticket.case_id == case_id(ev.run_id, ev.seq)))
    return dossier(ev, results.specs_or_empty(ev.run_id), t)


# ── Repair candidates (ADOM REPAIR_CANDIDATES + GATE_RESULT for the case's witness) ──

def _gate_result(rec: dict[str, Any]) -> dict[str, Any]:
    """ADOM Gate G1..G5 -> the UI's check names. None (not applicable) does not fail a check, as in ADOM."""
    c = rec.get("checks") or {}
    ok = lambda k: c.get(k) is not False  # noqa: E731
    checks = {
        "g1_accept_grounded": ok("G2"),                       # P' accepts (w, target)
        "g2_reject_b": ok("G3"),                              # N(P') contains no trace of B
        "g3_locality": ok("G1"),                              # canonical form, w in g, g != True
        "g4_preserve_g_a2": ok("G5"),                         # N(P') satisfies A2
        "g5_in_repair_space_and_bsynth": ok("G1") and ok("G4"),
    }
    ui_name = {"G1": "g3_locality", "G2": "g1_accept_grounded", "G3": "g2_reject_b",
               "G4": "g5_in_repair_space_and_bsynth", "G5": "g4_preserve_g_a2"}
    method = rec.get("g5_method")
    passed = bool(rec.get("passed"))
    reasons = rec.get("reasons") or {}
    out: dict[str, Any] = {
        "passed": passed, "checks": checks,
        "guaranteeNature": "proof" if method == "proof" else "finite-set" if method == "sampled" else "structural",
        "message": (f"Qua Gate ({rec.get('mode')})." if passed
                    else f"Bị chặn ở {rec.get('failed_at')}: " + "; ".join(f"{k}: {v}" for k, v in reasons.items())),
    }
    if rec.get("failed_at"):
        out["firstFailedCheck"] = ui_name.get(rec["failed_at"], rec["failed_at"])
    if not passed:
        out["unknownGateReason"] = "rejected_by_gate"
    return out


def _guard_dsl(patch: dict[str, Any]) -> str:
    try:
        from adom.spec_ast import expr_from_dict
        return expr_from_dict(patch["guard"]).to_dsl()
    except Exception:  # noqa: BLE001  (adom not importable or an unknown node)
        return ""


def repair_candidates(session: Session, run_id: str, ev: RunEvent) -> list[dict[str, Any]]:
    tid, w = ev.data.get("task_id"), _key(ev.data.get("w"))
    recs = [r for r in adom_records(session, run_id) if r.get("task_id") == tid and r.get("phase") == "repair"]
    repair_ids = {r["repair_id"] for r in recs if r.get("event") == "REPAIR_CANDIDATES" and _key(r.get("w")) == w}
    deployed = {(r["repair_id"], r.get("rank")) for r in recs if r.get("event") == "MONITOR_REPLACED"}
    out = []
    for r in recs:
        if r.get("event") != "GATE_RESULT" or r.get("repair_id") not in repair_ids:
            continue
        patch = r.get("patch") or {}
        checks = r.get("checks") or {}
        cand: dict[str, Any] = {
            "id": f"{r['repair_id']}#{r.get('rank')}", "family": FAMILY.get(r.get("family"), r.get("family")),
            "guard": _guard_dsl(patch), "replacement": patch.get("dsl", ""), "targetExpectedOutput": patch.get("target"),
            "rank": r.get("rank"), "diffPreview": patch.get("dsl", ""),
            "complexity": r.get("d_complexity"), "breadth": r.get("g_width"),
            "isProofVerified": r.get("g5_method") == "proof", "hasA2Anchor": checks.get("G5") is not None,
            "gateResult": _gate_result(r),
            "isBEmptyInGuard": bool(r.get("b_in_g_empty")) and bool(r.get("bsynth_in_g_empty")),
            "isDeployed": (r["repair_id"], r.get("rank")) in deployed,
        }
        if r.get("passed"):
            cand["passMode"] = r.get("mode")
        out.append(cand)
    return out


# ── Admission ───────────────────────────────────────────────────────────────

STEPS = (
    ("static_checker", "Kiểm tĩnh P0", "Parse và kiểm kiểu đặc tả P0, sinh lại tối đa k lần khi lỗi."),
    ("contract_runner", "Chạy thử hợp đồng",
     "Chạy C trên các anchor và kiểm tiền/hậu điều kiện của P0 (lỗi hợp đồng, vi phạm tiền điều kiện, code ném lỗi)."),
    ("anchor_cross_check", "Đối chiếu anchor", "Đối chiếu A2/A3 với anchor đã duyệt; nguồn mâu thuẫn bị loại và cần người kiểm."),
    ("silent_fault_replay", "Phát lại tìm lỗi im lặng", "Phát lại anchor: P0 chấp nhận c trong khi bằng chứng grounded bác bỏ c."),
    ("z3_property_verifier", "Kiểm chứng tính chất bằng Z3", "Z3 tìm input mà P0 mâu thuẫn A2, rồi kiểm lại trên C."),
    ("bsynth_slack_measurement", "Đo độ lỏng trên B_synth", "Tỷ lệ đột biến B_synth mà P0 vẫn chấp nhận."),
)


def admission_report(session: Session, run: Run) -> dict[str, Any]:
    recs = [r for r in adom_records(session, run.id) if r.get("phase") == "admission"]
    by: dict[str, list[dict]] = defaultdict(list)
    for r in recs:
        by[r.get("event")].append(r)
    tasks = lambda name: sorted({r.get("task_id") for r in by[name]})  # noqa: E731
    done = tasks("ADMISSION_DONE")
    pending = "running" if run.status in ACTIVE else "idle"

    def status(seen: bool, warn: bool) -> str:
        return pending if not seen else "warning" if warn else "passed"

    steps: list[dict[str, Any]] = []
    ok, rej, bad = tasks("STATIC_OK"), len(by["STATIC_REJECTED"]), tasks("MALFORMED")
    steps.append({"status": status(bool(ok or rej or bad), bool(bad)),
                  "details": f"{len(ok)} task đạt, {rej} lần bị từ chối, {len(bad)} task hỏng sau k lần."})

    errs = {n: len(by[n]) for n in ("CONTRACT_ERROR", "PRE_VIOLATION", "CODE_EXCEPTION")}
    steps.append({"status": status(bool(done) or any(errs.values()), any(errs.values())),
                  "details": f"{errs['CONTRACT_ERROR']} lỗi hợp đồng, {errs['PRE_VIOLATION']} vi phạm tiền điều kiện, "
                             f"{errs['CODE_EXCEPTION']} lần code ném lỗi."})

    conflicts = by["CROSSCHECK_CONFLICT"]
    step: dict[str, Any] = {"status": status(bool(done or by["CROSSCHECK_OK"] or conflicts), bool(conflicts)),
                            "details": f"{len(by['CROSSCHECK_OK'])} lần khớp, {len(conflicts)} mâu thuẫn "
                                       f"({', '.join(sorted({c.get('source', '?') for c in conflicts})) or 'không có'})."}
    step["hasViolation"] = bool(conflicts)
    if conflicts:
        step["violatedTaskId"] = conflicts[0].get("task_id")
    steps.append(step)

    silent = tasks("SILENT_FAULT")
    steps.append({"status": status(bool(done or silent), bool(silent)),
                  "details": f"{len(by['SILENT_FAULT'])} lỗi im lặng ở {len(silent)} task.",
                  "silentFaultsCount": len(by["SILENT_FAULT"]), "silentFaultCases": silent})

    z3, z3_skip = by["Z3_ADMISSION"], by["Z3_ADMISSION_SKIPPED"]
    steps.append({"status": status(bool(done or z3 or z3_skip), bool(z3_skip) and not z3),
                  "details": f"Z3 chạy ở {len(z3)} task ({sum(r.get('n_inputs') or 0 for r in z3)} input mâu thuẫn A2), "
                             f"bỏ qua ở {len(z3_skip)} task."})

    loose = by["LOOSENESS_MEASURED"]
    n = sum(r.get("n") or 0 for r in loose)
    accepted = sum(r.get("accepted") or 0 for r in loose)
    slack = round(100 * accepted / n, 2) if n else 0.0
    steps.append({"status": status(bool(loose), accepted > 0),
                  "details": f"P0 chấp nhận {accepted}/{n} đột biến B_synth.", "slackRatio": slack})

    total = len(run.run_task_ids)
    return {
        "runId": run.id,
        "ranAt": recs[-1].get("timestamp") if recs else _iso(run.created_at),
        "steps": [{"index": i, "key": key, "title": title, "description": desc, **st}
                  for i, ((key, title, desc), st) in enumerate(zip(STEPS, steps))],
        "summary": {"slackRatio": slack, "slackCases": accepted, "totalTasks": total,
                    "silentFaultCases": silent, "admittedTasks": len(done),
                    "excludedTasks": max(0, total - len(done)) if run.status in TERMINAL else 0},
        "reviewedTaskIds": list(run.admission_reviewed_task_ids or []),
    }


# ── Evidence store ──────────────────────────────────────────────────────────

def evidence(session: Session, run: Run) -> dict[str, Any]:
    good, bad, anchors = [], [], []
    for tid, (state, mtime) in sorted(results.states_or_empty(run.id, run.variant).items()):
        stores = state.get("stores") or {}
        for store, verdict, out in (("G", "ACC", good), ("B", "REJ", bad)):
            for i, t in enumerate(stores.get(store) or []):
                prov = list(t.get("prov") or [])
                rec = {"id": f"{tid}:{store}:{i}", "taskId": tid,
                       "kind": "expected_output" if store == "G" else "rejection",
                       "source": PROVENANCE.get(prov[0], prov[0]) if prov else "unknown",
                       "input": t.get("x"), "output": t.get("y"), "verdict": verdict, "timestamp": _iso(mtime),
                       "notes": f"origin={t.get('origin')}; provenance={', '.join(prov)}"}
                out.append(rec)
                if store == "G" and {"anchor-docstring", "mr-derived"} & set(prov):
                    anchors.append({"id": rec["id"], "taskId": tid, "input": t.get("x"), "expectedOutput": t.get("y"),
                                    "origin": "gốc" if "anchor-docstring" in prov else "dẫn xuất", "parentId": "root",
                                    "children": []})
    keys = lambda recs: {f"{r['taskId']}:{_key(r['input'])}->{_key(r['output'])}" for r in recs}  # noqa: E731
    overlap = sorted(keys(good) & keys(bad))

    debt = []
    for r in adom_records(session, run.id):
        if r.get("event") == "SPEC_DEBT":
            debt.append({"id": f"debt-{len(debt)}", "taskId": r.get("task_id"), "witness": r.get("w"),
                         "debtType": "weak_precondition", "title": "Vết xấu B vẫn được P_k chấp nhận",
                         "description": f"Monitor P_{r.get('monitor_version')} chấp nhận ({_key(r.get('w'))}, "
                                        f"{_key(r.get('y'))}) dù vết này thuộc B ({r.get('kind')}).",
                         "severity": "high", "recordedAt": r.get("timestamp")})
    for t in session.scalars(select(Ticket).where(Ticket.run_id == run.id, Ticket.status == "open")):
        debt.append({"id": f"debt-{t.id}", "taskId": t.task_id, "witness": t.witness, "debtType": "open_ticket",
                     "title": "Vé hỏi người chưa trả lời", "description": t.prompt_text, "severity": "medium",
                     "recordedAt": _iso(t.created_at)})
    return {
        "runId": run.id, "good": good, "bad": bad,
        "bSynth": [],   # ADOM keeps B_synth in memory; only the looseness counts reach the log (admission report)
        "metamorphicTree": {"id": "root", "taskId": "", "input": None, "expectedOutput": None, "origin": "gốc",
                            "children": anchors},
        "specDebt": debt,
        "invariant": {"holds": not overlap, "intersectionCount": len(overlap), "violatingKeys": overlap},
    }


# ── Monitor history / revocation ────────────────────────────────────────────

def monitor_history(session: Session, run: Run) -> list[dict[str, Any]]:
    """Every monitor version per task from TASK_START (P_0), MONITOR_REPLACED and REVOKED."""
    per_task: dict[str, list[dict]] = defaultdict(list)
    for r in adom_records(session, run.id):
        tid, ev = r.get("task_id"), r.get("event")
        hist = per_task[tid]
        if ev == "TASK_START":
            hist.append({"version": f"P_{r.get('monitor_version', 0)}", "taskId": tid, "status": "active",
                         "deployedAt": r.get("timestamp")})
        elif ev in ("MONITOR_REPLACED", "REVOKED"):
            rec = {"version": f"P_{r.get('after_version')}", "taskId": tid, "status": "active",
                   "deployedAt": r.get("timestamp")}
            if ev == "MONITOR_REPLACED":
                patch = r.get("patch") or {}
                rec.update(patchId=patch.get("patch_id"), guard=_guard_dsl(patch), replacement=patch.get("dsl"))
            else:
                for old in hist:
                    if old.get("patchId") == r.get("patch_id"):
                        old.update(status="revoked", revokedAt=r.get("timestamp"),
                                   revocationReason=f"Vết xấu {_key(r.get('b'))} rơi vào vùng vá ({r.get('reason')}).",
                                   violatingTrace=r.get("b"))
                rec["revocationReason"] = f"Gỡ bản vá {r.get('patch_id')}"
            hist.append(rec)
    out = []
    for hist in per_task.values():
        for i, rec in enumerate(hist):
            if rec["status"] == "active" and i < len(hist) - 1:
                rec["status"] = "deprecated"
            out.append(rec)
    return out


# ── Summary / progress ──────────────────────────────────────────────────────

def run_summary(session: Session, run: Run) -> dict[str, Any]:
    ds = session.get(Dataset, run.dataset_id)
    counts = dict(session.execute(select(Ticket.status, func.count()).where(Ticket.run_id == run.id)
                                  .group_by(Ticket.status)).all())
    recs = adom_records(session, run.id)
    return {
        "runId": run.id, "datasetName": ds.name if ds else run.dataset_id, "anchorLevel": run.level,
        "monitorVersion": run.active_monitor_version, "isHeldOutLocked": run.is_held_out_locked,
        "isDisjointGB": evidence(session, run)["invariant"]["holds"],
        "ticketsSpent": counts.get("spent", 0), "ticketsTotal": sum(counts.values()),
        "rejectedWritesCount": sum(1 for r in recs if r.get("event") == "STORE_WRITE_ABORTED"),
    }


def progress(session: Session, run: Run) -> dict[str, Any]:
    recs = adom_records(session, run.id)
    started = [r.get("task_id") for r in recs if r.get("event") == "TASK_START"]
    verdicts = [r.get("verdict", "") for r in recs if r.get("event") == "VERDICT" and not r.get("holdout")]
    total = len(run.run_task_ids)
    completed = total if run.status in TERMINAL else max(0, len(set(started)) - 1)
    pending = session.scalar(select(func.count()).select_from(Ticket)
                             .where(Ticket.run_id == run.id, Ticket.status == "open")) or 0
    return {
        "completed": completed, "total": total,
        "accCount": sum(v == "ACC" for v in verdicts),
        "rejCount": sum(v.endswith("_FAULT") for v in verdicts),
        "unknownCount": sum(v.startswith("UNKNOWN") for v in verdicts),
        "repairCount": sum(r.get("event") == "MONITOR_REPLACED" for r in recs),
        "revocations": sum(r.get("event") == "REVOKED" for r in recs),
        "pendingHumanTickets": pending,
    }
