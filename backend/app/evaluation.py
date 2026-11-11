"""Evaluation runs of the chat testbed: serialization, filters and the metrics of /api/stats."""

import csv
import io
import statistics
from datetime import date, datetime, time, timezone
from typing import Any

from app.models import EvalRun


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).isoformat()


def run_out(r: EvalRun) -> dict[str, Any]:
    out: dict[str, Any] = {
        "run_id": r.id, "created_at": _iso(r.created_at), "updated_at": _iso(r.updated_at),
        "dataset": {"id": r.dataset_id, "version": r.dataset_version},
        "problem_id": r.problem_id, "problem": r.problem,
        "turns": r.turns or [], "verdicts": r.verdicts or [], "latency": r.latency or {},
        "logs": r.logs or [], "status": r.status,
    }
    for key in ("spec", "code", "confidence", "gold_label", "review"):
        value = getattr(r, key)
        if value is not None:
            out[key] = value
    return out


def final_verdict(r: EvalRun) -> str | None:
    return r.verdicts[-1] if r.verdicts else None


def _bound(value: str | None, end: bool) -> datetime | None:
    """ISO date or datetime; a bare date covers the whole day."""
    if not value:
        return None
    try:
        if len(value) == 10:
            d = date.fromisoformat(value)
            return datetime.combine(d, time.max if end else time.min, tzinfo=timezone.utc)
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def matches(r: EvalRun, verdict: str | None = None, problem: str | None = None, dataset: str | None = None,
            from_: str | None = None, to: str | None = None) -> bool:
    if verdict and verdict.lower() not in (final_verdict(r) or "").lower():
        return False
    if problem and problem.lower() not in f"{r.problem_id} {r.problem}".lower():
        return False
    if dataset and dataset != r.dataset_id:
        return False
    created = r.created_at if r.created_at.tzinfo else r.created_at.replace(tzinfo=timezone.utc)
    lo, hi = _bound(from_, False), _bound(to, True)
    return not ((lo and created < lo) or (hi and created > hi))


def _total_latency(r: EvalRun) -> float | None:
    lat = r.latency or {}
    if not lat:
        return None
    return float(lat["total"]) if "total" in lat else float(sum(lat.values()))


def _percentile(values: list[float], q: float) -> float:
    s = sorted(values)
    k = (len(s) - 1) * q
    lo, hi = int(k), min(int(k) + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def metrics(runs: list[EvalRun]) -> dict[str, Any]:
    by_verdict: dict[str, int] = {}
    for r in runs:
        v = final_verdict(r)
        if v:
            by_verdict[v] = by_verdict.get(v, 0) + 1
    out: dict[str, Any] = {"totalRuns": len(runs), "byVerdict": by_verdict, "latency": {},
                           "followupsUsed": sum(1 for r in runs if r.followup_used)}
    graded = [r for r in runs if r.gold_label and final_verdict(r)]
    if graded:
        out["accuracy"] = sum(final_verdict(r) == r.gold_label for r in graded) / len(graded)
    conf = [r.confidence for r in runs if r.confidence is not None]
    if conf:
        out["averageConfidence"] = statistics.fmean(conf)
    lat = [x for x in (_total_latency(r) for r in runs) if x is not None]
    if lat:
        out["latency"] = {"mean": statistics.fmean(lat), "p50": _percentile(lat, 0.5), "p95": _percentile(lat, 0.95)}
    followed = [r for r in runs if r.followup_used]
    if followed:
        out["unknownResolvedRate"] = sum(
            not (final_verdict(r) or "UNKNOWN").startswith("UNKNOWN") for r in followed) / len(followed)
    return out


CSV_COLUMNS = ("run_id", "created_at", "dataset", "problem_id", "problem", "verdict", "confidence", "status",
               "gold_label", "review_agree", "review_note")


def to_csv(runs: list[EvalRun]) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(CSV_COLUMNS)
    for r in runs:
        review = r.review or {}
        w.writerow([r.id, _iso(r.created_at), f"{r.dataset_id}@{r.dataset_version}", r.problem_id, r.problem,
                    final_verdict(r) or "", "" if r.confidence is None else r.confidence, r.status,
                    r.gold_label or "", "" if "agree" not in review else review["agree"], review.get("note", "")])
    return buf.getvalue()
