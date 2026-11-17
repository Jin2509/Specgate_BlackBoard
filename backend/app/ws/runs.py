"""ADOM paper results inside a shared workspace (flow §13).

Two ways in:
- import: the ADOM team hands over a run. Accepted formats are SpecGate's own JSON (`specgate-run/1`, every
  value given) or the three files ADOM's `export_report.py` writes (`<RUN>_summary.csv`, `<RUN>_per_task.csv`,
  `<RUN>_run_meta.json`), from which the six criteria are read without recomputing anything.
- trial: the owner runs a few tasks on the server with the ADOM team's keys and config. With ADOM_TRIAL_FAKE the
  run is simulated deterministically (dev, CI); otherwise it starts the real pipeline (app/jobs.py).

Verdicts follow ADOM's rule (adom/src/scoring/report.py `decide`): too few contributing tasks or too few events is
"Chưa đủ dữ liệu" before any PASS/FAIL, and a bound is compared strictly with its threshold.
"""

import csv
import io
import json
import re
import threading
import time
import zlib
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import SessionLocal
from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv

# Registered thresholds of the paper (adom/config/thresholds.yaml, 2026-10-29). Never tuned after a run.
MIN_CONTRIBUTING_TASKS = 10
CRITERIA = [
    # number, title shown to people, ADOM summary.csv "number" column prefix, row, bound side, threshold, min n
    (1, "Tỷ lệ kết luận SPEC_FAULT sai", "9 SPEC_FAULT false rate", "-", "upper", 0.10, 35),
    (2, "Bản sửa tổng quát gây hại", "10 wrongful repair, non-point", "-", "upper", 0.10, 25),
    (3, "Cổng chặn bản sửa nhầm bên", "4 gate blocks wrong-side", "rules", "lower", 0.60, None),
    (4, "Ứng viên hạng 1 nới quá tay", "5 top1 harmful, right target", "rules", "lower", 0.30, None),
    (5, "Tỷ lệ bản sửa tốt", "1 good repair rate", "rules/gate", "lower", 0.30, None),
    (6, "Ít gây hại hơn hai baseline", "criterion 6 harm difference", None, None, None, None),
]
VERDICTS = ("PASS", "FAIL", "INSUFFICIENT_DATA", "NOT_SET")
REPAIR_METHODS = (("rules/gate", "rules (ADOM)"), ("llm_judge/gate", "llm_judge"), ("always_spec/gate", "always_spec"))
TASK_ID = re.compile(r"^HumanEval/(\d{1,3})$")
A3_STATES = ("AGREE", "SINGLE", "DISAGREE", "no_spec")


def bad(msg: str) -> ApiError:
    return ApiError(400, msg, "BAD_REPORT")


# ---------- verdicts ----------


def verdict(*, value: float | None, n: int | None, tasks: int | None, bound_value: float | None, side: str | None,
            threshold: float | None, min_n: int | None) -> tuple[str, str]:
    """(verdict, reason) with ADOM's precedence: NOT SET, then INSUFFICIENT_DATA, then strict PASS/FAIL."""
    if threshold is None or side is None:
        return "NOT_SET", "chưa đăng ký ngưỡng"
    if value is None or not n:
        return "INSUFFICIENT_DATA", "chưa có sự kiện nào"
    if tasks is None:
        return "INSUFFICIENT_DATA", "tệp xuất không ghi số tác vụ góp vào tiêu chí này"
    if tasks < MIN_CONTRIBUTING_TASKS:
        return "INSUFFICIENT_DATA", f"{tasks} tác vụ góp vào, cần ít nhất {MIN_CONTRIBUTING_TASKS}"
    if min_n is not None and n < min_n:
        return "INSUFFICIENT_DATA", f"n = {n}, cần ít nhất {min_n}"
    if bound_value is None:
        return "INSUFFICIENT_DATA", "không có khoảng tin cậy"
    ok = bound_value < threshold if side == "upper" else bound_value > threshold
    return ("PASS" if ok else "FAIL"), ""


def _footnote(side: str | None, threshold: float | None, ci: tuple[float | None, float | None], reason: str) -> str:
    parts = []
    if threshold is not None and side:
        bound = ci[1] if side == "upper" else ci[0]
        parts.append(f"ngưỡng {'≤' if side == 'upper' else '≥'} {threshold:.2f}")
        if bound is not None:
            parts.append(f"cận {'trên' if side == 'upper' else 'dưới'} {bound:.3f}")
    elif ci[0] is not None:
        parts.append(f"khoảng [{ci[0]:.2f}, {ci[1]:.2f}]")
    if reason:
        parts.append(reason)
    return " · ".join(parts)


# ---------- ADOM export files ----------

_RATE = re.compile(r"^\s*(-?[\d.]+)\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]\s*\((\d+)\s*/\s*(\d+)\)")
_HARM = re.compile(r"^\s*(-?[\d.]+)\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]\s*\((\d+)\s*tasks?,\s*(\d+)\s*violations?\)")
_KV = re.compile(r"(\w+)=(-?[\d.]+)")


def _csv(text: str, required: set[str], name: str) -> list[dict[str, str]]:
    rows = list(csv.DictReader(io.StringIO(text.lstrip("﻿"))))
    if not rows:
        raise bad(f"Tệp {name} trống.")
    missing = required - set(rows[0])
    if missing:
        raise bad(f"Tệp {name} thiếu cột: {', '.join(sorted(missing))}. Hãy dùng tệp do export_report.py của ADOM sinh ra.")
    return rows


def parse_adom(summary_csv: str, per_task_csv: str, run_meta: str) -> dict:
    """The three files of export_report.py -> SpecGate's run report. Nothing is recomputed except verdicts."""
    try:
        meta = json.loads(run_meta)
    except json.JSONDecodeError:
        raise bad("Tệp run_meta.json không phải JSON hợp lệ.") from None
    if not isinstance(meta, dict) or not isinstance(meta.get("variants"), dict) or not meta["variants"]:
        raise bad("Tệp run_meta.json thiếu mục variants.")
    summary = _csv(summary_csv, {"variant", "number", "row", "value", "set", "decision_cell"}, "summary.csv")
    per_task = _csv(per_task_csv, {"variant", "task_id", "status", "a3_state", "violations", "contributing", "wall_s"},
                    "per_task.csv")

    cell = [r for r in summary if r["decision_cell"].strip().lower() == "yes"]
    variants = sorted({r["variant"] for r in cell}) or sorted(meta["variants"])
    variant = variants[0]
    if variant not in meta["variants"]:
        raise bad(f"Biến thể {variant} có trong summary.csv nhưng không có trong run_meta.json.")
    rows = [r for r in (cell or summary) if r["variant"] == variant]

    tasks_rows = [r for r in per_task if r["variant"] == variant]
    if not tasks_rows:
        raise bad(f"per_task.csv không có dòng nào của biến thể {variant}.")
    total_viol = sum(int(float(r["violations"] or 0)) for r in tasks_rows) or 1
    contributing = sum(1 for r in tasks_rows if str(r["contributing"]).strip() in ("1", "True", "true"))
    per = sorted(({
        "taskId": r["task_id"], "status": r["status"], "a3State": r["a3_state"] or "no_spec",
        "violations": int(float(r["violations"] or 0)),
        "share": round(100 * int(float(r["violations"] or 0)) / total_viol, 1),
        "contributing": str(r["contributing"]).strip() in ("1", "True", "true"),
        "wallSeconds": round(float(r["wall_s"] or 0), 2),
    } for r in tasks_rows), key=lambda t: (-t["violations"], t["taskId"]))

    def find(prefix: str, row: str | None) -> list[dict[str, str]]:
        return [r for r in rows if r["number"].startswith(prefix) and (row is None or r["row"] == row)]

    criteria = []
    for number, title, prefix, row, side, threshold, min_n in CRITERIA:
        hits = find(prefix, row)
        value = ci_low = ci_high = None
        num = den = tasks = None
        if number == 6:
            parsed = [_HARM.match(h["value"]) for h in hits]
            parsed = [p for p in parsed if p]
            if parsed:
                vals = [float(p.group(1)) for p in parsed]
                value, ci_low, ci_high = min(vals), min(float(p.group(2)) for p in parsed), max(float(p.group(3)) for p in parsed)
                tasks = min(int(p.group(4)) for p in parsed)
                den = min(int(p.group(5)) for p in parsed)
            # Rules must beat both baselines: every harm difference's lower bound above 0.
            if not parsed:
                v, why = "INSUFFICIENT_DATA", "chưa có sự kiện nào"
            elif tasks < MIN_CONTRIBUTING_TASKS:
                v, why = "INSUFFICIENT_DATA", f"{tasks} tác vụ, {den} vi phạm; cần ít nhất {MIN_CONTRIBUTING_TASKS} tác vụ"
            else:
                v = "PASS" if all(float(p.group(2)) > 0 for p in parsed) else "FAIL"
                why = ""
            display = "n = 0" if value is None else f"{value:.3f}"
            criteria.append({"number": 6, "title": title, "value": value, "display": display, "denominator": den,
                             "tasks": tasks or 0, "ciLow": ci_low, "ciHigh": ci_high, "threshold": None,
                             "footnote": _footnote(None, None, (ci_low, ci_high), why), "verdict": v})
            continue
        mt = _RATE.match(hits[0]["value"]) if hits else None
        if mt:
            value, ci_low, ci_high = float(mt.group(1)), float(mt.group(2)), float(mt.group(3))
            num, den = int(mt.group(4)), int(mt.group(5))
            # Criterion 1 reads every contributing task of the cell (export README); the others do not say.
            tasks = contributing if number == 1 else None
        bound = None if value is None else (ci_high if side == "upper" else ci_low)
        v, why = verdict(value=value, n=den, tasks=tasks, bound_value=bound, side=side, threshold=threshold, min_n=min_n)
        criteria.append({
            "number": number, "title": title, "value": value,
            "display": "n = 0" if value is None else f"{value:.3f}",
            "numerator": num, "denominator": den, "tasks": tasks,
            "ciLow": ci_low, "ciHigh": ci_high,
            "threshold": {"op": "<=" if side == "upper" else ">=", "value": threshold},
            "footnote": _footnote(side, threshold, (ci_low, ci_high), why), "verdict": v,
        })

    repairs = []
    for row, label in REPAIR_METHODS:
        hit = [r for r in summary if r["variant"] == variant and r["number"].startswith("1-3 table") and r["row"] == row]
        if hit:
            kv = {k: int(float(v)) for k, v in _KV.findall(hit[0]["value"])}
            repairs.append({"method": label, "good": kv.get("good", 0), "wrongSide": kv.get("wrong_side", 0),
                            "overRelax": kv.get("over_relax", 0), "unmeasured": kv.get("unmeasured", 0),
                            "noCandidate": kv.get("no_candidate", 0), "notRepaired": kv.get("no_repair", 0)})

    vmeta = meta["variants"][variant]
    models = [{"role": role.capitalize() if not role.startswith("draft") else f"Draft {role[5:]}", "model": str(mod).split("/")[-1]}
              for role, mod in (vmeta.get("models") or {}).items()]
    return {
        "name": str(meta.get("run") or "RUN")[:80], "dataset": "HumanEval+", "variant": variant,
        "tasks": len({r["task_id"] for r in per_task}), "models": models, "criteria": criteria, "perTask": per,
        "repairs": repairs,
        "meta": {"variants": sorted(meta["variants"]), "contributingTasks": contributing,
                 "timingSeconds": vmeta.get("timing_total_s"), "configHash": vmeta.get("config_hash"),
                 "llm": vmeta.get("llm"), "source": "adom-export"},
    }


def parse_native(report: Any) -> dict:
    """SpecGate's own format: every value given, verdicts included."""
    if not isinstance(report, dict) or report.get("format") != "specgate-run/1":
        raise bad('Báo cáo phải là JSON có "format": "specgate-run/1", hoặc ba tệp do export_report.py sinh ra.')
    crit = report.get("criteria")
    if not isinstance(crit, list) or sorted(c.get("number") for c in crit if isinstance(c, dict)) != [1, 2, 3, 4, 5, 6]:
        raise bad("Báo cáo phải có đúng sáu tiêu chí, đánh số 1 đến 6.")
    out_c = []
    for c in sorted(crit, key=lambda c: c["number"]):
        if c.get("verdict") not in VERDICTS:
            raise bad(f"Tiêu chí {c['number']}: kết luận phải là một trong {', '.join(VERDICTS)}.")
        if not str(c.get("title", "")).strip():
            raise bad(f"Tiêu chí {c['number']} thiếu tên.")
        value = c.get("value")
        out_c.append({"number": c["number"], "title": str(c["title"])[:120], "value": value,
                      "display": str(c.get("display") or ("n = 0" if value is None else f"{float(value):.3f}")),
                      "numerator": c.get("numerator"), "denominator": c.get("denominator"), "tasks": int(c.get("tasks") or 0),
                      "ciLow": c.get("ciLow"), "ciHigh": c.get("ciHigh"), "threshold": c.get("threshold"),
                      "footnote": str(c.get("footnote") or ""), "verdict": c["verdict"]})
    per = report.get("perTask") or []
    if not isinstance(per, list):
        raise bad("perTask phải là một danh sách.")
    name = str(report.get("name") or "").strip()
    if not name:
        raise bad("Báo cáo thiếu tên lượt chạy (name).")
    return {"name": name[:80], "dataset": str(report.get("dataset") or "HumanEval+")[:80], "variant": report.get("variant"),
            "tasks": int(report.get("tasks") or len(per)), "models": report.get("models") or [], "criteria": out_c,
            "perTask": per, "repairs": report.get("repairs") or [], "meta": {"source": "specgate-run/1"},
            "validity": report.get("validity"), "invalidReason": report.get("invalidReason")}


# ---------- reading ----------


def current_run(s: Session, ws_id: str) -> m.PaperRun | None:
    """The run the team argues from: the newest official import, else the newest finished trial."""
    done = select(m.PaperRun).where(m.PaperRun.workspace_id == ws_id, m.PaperRun.status == "done")
    return (s.scalar(done.where(m.PaperRun.kind == "import").order_by(m.PaperRun.created_at.desc()).limit(1))
            or s.scalar(done.order_by(m.PaperRun.created_at.desc()).limit(1)))


def run_brief(r: m.PaperRun) -> dict:
    return {"id": r.id, "name": r.name, "kind": r.kind, "dataset": r.dataset, "tasks": r.task_count,
            "validity": r.validity, "invalidReason": r.invalid_reason, "variant": r.variant}


def run_out(s: Session, r: m.PaperRun, full: bool = False) -> dict:
    out = {**run_brief(r), "workspaceId": r.workspace_id, "status": r.status, "error": r.error, "progress": r.progress,
           "config": r.config, "models": r.models, "createdBy": sv.name_of(s, r.created_by, r.workspace_id),
           "createdAt": sv.iso(r.created_at), "finishedAt": sv.iso(r.finished_at), "criteria": r.criteria,
           "violations": sum(t.get("violations", 0) for t in r.tasks or [])}
    if full:
        out |= {"taskResults": r.tasks, "repairs": r.repairs, "meta": r.meta}
    return out


def stats_card(r: m.PaperRun) -> dict:
    """`lines` is exactly what the card shows and what a highlight of it must come from."""
    card = {"kind": "stats", "run": run_brief(r),
            "criteria": [{k: c.get(k) for k in ("number", "title", "display", "verdict", "ciLow", "ciHigh", "threshold")}
                         for c in r.criteria]}
    card["lines"] = [sv.criterion_line(c) for c in r.criteria]
    return card


def task_card(r: m.PaperRun, task_id: str) -> dict | None:
    t = next((x for x in r.tasks or [] if x.get("taskId", "").lower() == task_id.lower()), None)
    if not t:
        return None
    card = {"kind": "task", "run": run_brief(r), "task": t}
    card["line"] = sv.task_line(card)
    return card


def context_block(s: Session, ws_id: str) -> dict | None:
    """What every member's agent reads about the paper (flow §5): run, validity, six criteria, one line each."""
    r = current_run(s, ws_id)
    if not r:
        return None
    return {"run": run_brief(r), "lines": [sv.criterion_line(c) for c in r.criteria]}


# ---------- creating ----------


def create_run(s: Session, ws: m.Workspace, user: m.User, data: dict, *, kind: str, validity: str,
               invalid_reason: str | None) -> m.PaperRun:
    if validity not in ("valid", "invalidated"):
        raise bad("Tình trạng phải là hợp lệ hoặc không hợp lệ.")
    if validity == "invalidated" and not (invalid_reason or "").strip():
        raise bad("Lượt chạy không hợp lệ phải ghi lý do.")
    r = m.PaperRun(workspace_id=ws.id, kind=kind, name=data["name"], dataset=data["dataset"], variant=data.get("variant"),
                   task_count=data["tasks"], validity=validity,
                   invalid_reason=(invalid_reason or "").strip() or None if validity == "invalidated" else None,
                   status="done", models=data["models"], criteria=data["criteria"], tasks=data["perTask"],
                   repairs=data["repairs"], meta=data["meta"], created_by=user.id, finished_at=m.now())
    s.add(r)
    s.flush()
    return r


def announce(s: Session, ws: m.Workspace, text: str, attachment: dict | None = None) -> m.Message | None:
    ch = s.scalar(select(m.Channel).where(m.Channel.workspace_id == ws.id, m.Channel.name == "chung")) or \
        (sv.channels(s, ws.id) or [None])[0]
    if not ch:
        return None
    return sv.add_message(s, ws, ch, kind="system", sender_id="system", text=text, attachment=attachment)


# ---------- trial runs ----------


def parse_task_ids(raw: list[str]) -> list[str]:
    ids: list[str] = []
    for x in raw:
        t = x.strip()
        if t.isdigit():
            t = f"HumanEval/{t}"
        mt = TASK_ID.match(t)
        if not mt or int(mt.group(1)) > 163:
            raise ApiError(400, f'"{x}" không phải mã tác vụ HumanEval+ (HumanEval/0 đến HumanEval/163).', "BAD_TASK")
        if t not in ids:
            ids.append(t)
    if not ids:
        raise ApiError(400, "Chọn ít nhất một tác vụ.", "BAD_TASK")
    if len(ids) > settings.adom_trial_max_tasks:
        raise ApiError(400, f"Mỗi lần chạy thử tối đa {settings.adom_trial_max_tasks} tác vụ.", "TOO_MANY_TASKS")
    return ids


def trial_criteria(tasks: list[dict]) -> list[dict]:
    """A handful of tasks can never reach N_min: every criterion is "Chưa đủ dữ liệu", stated with the count."""
    contributing = sum(1 for t in tasks if t.get("contributing"))
    out = []
    for number, title, _p, _r, side, threshold, _n in CRITERIA:
        out.append({"number": number, "title": title, "value": None, "display": f"{contributing} tác vụ",
                    "tasks": contributing, "ciLow": None, "ciHigh": None,
                    "threshold": {"op": "<=" if side == "upper" else ">=", "value": threshold} if side else None,
                    "footnote": f"chạy thử {len(tasks)} tác vụ, {contributing} góp vào; cần ít nhất {MIN_CONTRIBUTING_TASKS}",
                    "verdict": "INSUFFICIENT_DATA"})
    return out


def _update(run_id: str, **fields: Any) -> None:
    with SessionLocal() as s:
        r = s.get(m.PaperRun, run_id)
        if r:
            for k, v in fields.items():
                setattr(r, k, v)
            s.commit()


def _finish(run_id: str, tasks: list[dict] | None, error: str | None) -> None:
    with SessionLocal() as s:
        r = s.get(m.PaperRun, run_id)
        if not r:
            return
        ws = s.get(m.Workspace, r.workspace_id)
        r.finished_at = m.now()
        if error:
            r.status, r.error = "failed", error[:500]
            msg = announce(s, ws, f"Lượt chạy thử {r.name} bị lỗi: {r.error}", {"type": "run", "runId": r.id})
        else:
            r.status, r.tasks, r.criteria = "done", tasks or [], trial_criteria(tasks or [])
            viol = sum(t["violations"] for t in r.tasks)
            msg = announce(s, ws, f"Lượt chạy thử {r.name} đã xong: {r.task_count} tác vụ, {viol} vi phạm. "
                                  f"Gõ /stats để cả nhóm cùng xem.", {"type": "run", "runId": r.id})
        s.commit()
        if msg:
            sv.publish(s, [msg])


def _fake_task(task_id: str, level: str) -> dict:
    h = zlib.crc32(f"{task_id}:{level}".encode())
    violations = [0, 0, 0, 2, 5, 11, 19][h % 7]
    return {"taskId": task_id, "status": "ok" if h % 11 else "no_spec", "a3State": A3_STATES[(h >> 3) % 3],
            "violations": violations, "share": 0.0, "contributing": violations > 0 and bool((h >> 5) % 2),
            "wallSeconds": round(5 + (h % 400) / 10, 1)}


def _shares(tasks: list[dict]) -> list[dict]:
    total = sum(t["violations"] for t in tasks) or 1
    return [{**t, "share": round(100 * t["violations"] / total, 1)} for t in tasks]


def run_fake_trial(run_id: str, task_ids: list[str], level: str) -> None:
    """Deterministic stand-in for setup -> admit -> run, with the same progress shape as the pipeline."""
    step_s = settings.adom_trial_fake_step_s
    try:
        for step in ("setup", "admit"):
            _update(run_id, progress={"step": step, "done": [], "total": len(task_ids)})
            time.sleep(step_s)
        done: list[dict] = []
        for tid in task_ids:
            _update(run_id, progress={"step": "run", "current": tid, "done": done, "total": len(task_ids)})
            time.sleep(step_s)
            done = done + [_fake_task(tid, level)]
        _update(run_id, progress={"step": "done", "done": done, "total": len(task_ids)})
        _finish(run_id, _shares(done), None)
    except Exception as exc:  # noqa: BLE001
        _finish(run_id, None, str(exc))


def watch_pipeline_trial(run_id: str, pipeline_run_id: str, task_ids: list[str], level: str) -> None:
    """Follows a real pipeline run (app/jobs.py) until it ends, then reads per-task results from its files."""
    from app import results
    from app.models import Run, RunEvent
    from app.pipeline import variant_name

    deadline = time.time() + settings.adom_trial_timeout_s
    try:
        while True:
            with SessionLocal() as s:
                pr = s.get(Run, pipeline_run_id)
                status = pr.status if pr else "failed"
                verdicts: dict[str, int] = {}
                for ev in s.scalars(select(RunEvent).where(RunEvent.run_id == pipeline_run_id, RunEvent.event == "verdict")):
                    tid = (ev.data or {}).get("task_id")
                    if tid:
                        verdicts[tid] = verdicts.get(tid, 0) + 1
                failed = s.scalar(select(RunEvent).where(RunEvent.run_id == pipeline_run_id,
                                                         RunEvent.event == "run_failed").limit(1))
            done = [{"taskId": t, "violations": verdicts.get(t, 0)} for t in task_ids if t in verdicts]
            _update(run_id, progress={"step": status, "done": done, "total": len(task_ids)})
            if status == "failed":
                return _finish(run_id, None, (failed.data or {}).get("message") if failed else "Pipeline báo lỗi.")
            if status == "done":
                break
            if time.time() > deadline:
                return _finish(run_id, None, "Quá thời gian cho phép của một lượt chạy thử.")
            time.sleep(1.0)
        variant = variant_name(level)
        states = results.states_or_empty(pipeline_run_id, variant)
        out = []
        for tid in task_ids:
            st = states.get(tid, ({}, 0))[0]
            v = verdicts.get(tid, 0)
            out.append({"taskId": tid, "status": "ok" if st else "no_spec", "a3State": st.get("a3_state", "no_spec"),
                        "violations": v, "share": 0.0, "contributing": v > 0, "wallSeconds": 0})
        _finish(run_id, _shares(out), None)
    except Exception as exc:  # noqa: BLE001
        _finish(run_id, None, str(exc))


def start_trial(s: Session, ws: m.Workspace, user: m.User, task_ids: list[str], level: str, background) -> m.PaperRun:
    """flow §13: owner only (checked by the router), one at a time per workspace, a few tasks, server-side keys."""
    if s.scalar(select(m.PaperRun.id).where(m.PaperRun.workspace_id == ws.id, m.PaperRun.status == "running").limit(1)):
        raise ApiError(409, "Đang có một lượt chạy thử. Chờ lượt đó xong rồi chạy tiếp.", "TRIAL_RUNNING")
    if level not in ("A1", "A3"):
        raise ApiError(400, "Cấu hình chỉ nhận mức A1 hoặc A3.", "VALIDATION_ERROR")
    count = len(list(s.scalars(select(m.PaperRun.id).where(m.PaperRun.workspace_id == ws.id, m.PaperRun.kind == "trial"))))
    r = m.PaperRun(workspace_id=ws.id, kind="trial", name=f"THU-{count + 1}", dataset="HumanEval+",
                   variant=f"{level}-natural-standard", task_count=len(task_ids), status="running",
                   config={"taskIds": task_ids, "level": level}, progress={"step": "queued", "done": [], "total": len(task_ids)},
                   created_by=user.id,
                   models=[{"role": "Cấu hình", "model": "do nhóm ADOM cài trên máy chủ"}])
    s.add(r)
    s.flush()
    if settings.adom_trial_fake:
        target, args = run_fake_trial, (r.id, task_ids, level)
    else:
        from app.jobs import create_pipeline_run

        pr = create_pipeline_run(s, background, dataset_id="humaneval-plus", seed=None, held_out_ratio=0.2, level=level,
                                 task_ids=task_ids)
        r.pipeline_run_id = pr.id
        target, args = watch_pipeline_trial, (r.id, pr.id, task_ids, level)
    s.commit()
    # A thread, not the request's BackgroundTasks: the response returns at once and the run survives the client.
    threading.Thread(target=target, args=args, daemon=True).start()
    return r


def fail_interrupted(s: Session) -> int:
    """At startup: a trial still "running" lost its worker with the old process (no queue yet, flow §13 later)."""
    rows = list(s.scalars(select(m.PaperRun).where(m.PaperRun.status == "running")))
    for r in rows:
        r.status, r.error, r.finished_at = "failed", "Máy chủ khởi động lại trong lúc chạy thử.", m.now()
    s.commit()
    return len(rows)
