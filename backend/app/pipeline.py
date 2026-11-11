"""Runs the ADOM pipeline (spec-gate/adom); app/results.py reads what it writes.

A job runs `python -m harness.pipeline setup|admit|run` as child processes, in that order, and
streams the lines the pipeline appends to its events.jsonl into the run_events table: every line as
`adom_event`, and the lines the UI already has a name for once more under that name (ui_event_name).

subprocess.Popen in a worker thread, not asyncio subprocesses: those raise NotImplementedError
under `uvicorn --reload` on Windows.
"""

import json
import os
import subprocess
import sys
import time
import zlib
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.config import settings
from app.db import SessionLocal
from app.events import append_event
from app.models import Run
from app.tickets import open_ticket_for

STEPS = ("setup", "admit", "run")
_POLL_S = 0.5

# Static admission milestones, one per task each (flow Part II admission steps).
_ADMISSION_STEPS = frozenset({
    "STATIC_OK", "STATIC_REJECTED", "CROSSCHECK_OK", "UNIQUE_OUTPUT_CHECKED",
    "Z3_ADMISSION", "Z3_ADMISSION_SKIPPED", "LOOSENESS_MEASURED", "ADMISSION_DONE",
})
# ADOM event -> SSE event name the UI listens for (LLM_spec_gate src/mock/runs.ts RunEvent).
_UI_EVENTS = {"VERDICT": "verdict", "MONITOR_REPLACED": "repair_deployed", "REVOKED": "patch_revoked"}


def ui_event_name(rec: dict[str, Any]) -> str | None:
    """The UI name for an ADOM log record, or None when the UI has no event for it."""
    if rec.get("phase") == "admission" and rec.get("event") in _ADMISSION_STEPS:
        return "admission_step"
    return _UI_EVENTS.get(rec.get("event"))


@dataclass
class JobOptions:
    seed: int
    level: str
    task_ids: list[str] = field(default_factory=list)
    policy: str = "standard"
    fail_mode: str = "closed"
    human_oracle: str = "none"        # none | perfect | noise5 | noise10
    ablation: bool = False
    flaky_probe: bool = False
    a3_timeout_s: float | None = None
    open_tickets: bool = True         # UNKNOWN verdicts become human query tickets (annotation queue)
    env: dict[str, str] = field(default_factory=dict)   # CODER_MODEL, SPEC_MODEL, LLM_MAX_CALLS


def adom_seed(seed: str) -> int:
    """The UI seed is a string; the pipeline wants an int. Digits pass through, anything else is hashed stably."""
    return int(seed) if seed.isdigit() else zlib.crc32(seed.encode("utf-8"))


def variant_name(level: str, policy: str = "standard", human_oracle: str = "none") -> str:
    # Mirrors harness.pipeline._variant_name with the natural fault and no tag.
    name = f"{level}-natural-{policy}"
    return name + (f"-hq{human_oracle}" if human_oracle != "none" else "")


def build_cmd(step: str, run_dir: Path, opts: JobOptions) -> list[str]:
    cmd = [sys.executable, "-m", "harness.pipeline"]
    if settings.llm_fixtures:
        cmd += ["--llm-fixtures", settings.llm_fixtures]
    if step == "setup":
        cmd += ["setup", "--out", str(run_dir), "--tasks", settings.adom_tasks_dir,
                "--holdout-max", str(settings.holdout_max), "--seed", str(opts.seed)]
        if settings.dataset_file:
            cmd += ["--dataset-file", settings.dataset_file]
        for tid in opts.task_ids:
            cmd += ["--task-id", tid]
    elif step == "admit":
        cmd += ["admit", "--run", str(run_dir), "--seed", str(opts.seed)]
    elif step == "run":
        cmd += ["run", "--run", str(run_dir), "--tasks", settings.adom_tasks_dir,
                "--level", opts.level, "--seed", str(opts.seed),
                "--policy", opts.policy, "--fail-mode", opts.fail_mode, "--human-oracle", opts.human_oracle]
        if opts.ablation:
            cmd.append("--ablation")
        if opts.flaky_probe:
            cmd.append("--flaky-probe")
        if opts.a3_timeout_s is not None:
            cmd += ["--a3-timeout", str(opts.a3_timeout_s)]
    else:
        raise ValueError(f"unknown step {step}")
    return cmd


def events_file(step: str, run_dir: Path, opts: JobOptions) -> Path | None:
    if step == "admit":
        return run_dir / "static" / "events.jsonl"
    if step == "run":
        return run_dir / variant_name(opts.level, opts.policy, opts.human_oracle) / "events.jsonl"
    return None


class _Tail:
    """Reads the complete lines appended to a JSONL file since the last call."""

    def __init__(self, path: Path | None):
        self.path = path
        self.offset = 0

    def read(self) -> list[dict[str, Any]]:
        if self.path is None or not self.path.exists():
            return []
        with open(self.path, "rb") as fh:
            fh.seek(self.offset)
            chunk = fh.read()
        end = chunk.rfind(b"\n")
        if end < 0:   # only a line still being written
            return []
        self.offset += end + 1
        return [json.loads(line) for line in chunk[:end].decode("utf-8").splitlines() if line.strip()]


def run_step(step: str, run_dir: Path, opts: JobOptions, log_dir: Path,
             on_event: Callable[[dict[str, Any]], None]) -> None:
    """Runs one pipeline command; raises RuntimeError with the pipeline's last output line on failure."""
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"{step}.log"
    tail = _Tail(events_file(step, run_dir, opts))
    env = {**os.environ, "PYTHONUTF8": "1", **opts.env}
    with open(log_path, "w", encoding="utf-8") as log:
        # stdout goes to a file, not a pipe: an unread pipe fills up and blocks the child.
        proc = subprocess.Popen(build_cmd(step, run_dir, opts), cwd=settings.adom_dir, env=env,
                                stdout=log, stderr=subprocess.STDOUT)
        while proc.poll() is None:
            for rec in tail.read():
                on_event(rec)
            time.sleep(_POLL_S)
    for rec in tail.read():
        on_event(rec)
    if proc.returncode != 0:
        lines = [ln for ln in log_path.read_text(encoding="utf-8", errors="replace").splitlines() if ln.strip()]
        raise RuntimeError(lines[-1] if lines else f"{step} exited with code {proc.returncode}")


def _set_status(run_id: str, status: str | None, **fields: Any) -> None:
    """status None keeps the current one."""
    with SessionLocal() as s:
        run = s.get(Run, run_id)
        if status is not None:
            run.status = status
        for k, v in fields.items():
            setattr(run, k, v)
        s.commit()


def run_job(run_id: str, opts: JobOptions) -> None:
    """setup -> admit -> run for one backend run. Never raises: failures end as status 'failed' + a run_failed event."""
    run_dir = (settings.runs_dir / run_id).resolve()
    log_dir = (settings.runs_dir / f"{run_id}.logs").resolve()
    with SessionLocal() as s:
        def emit(event: str, data: dict[str, Any]) -> None:
            append_event(s, run_id, event, data)

        def on_adom(rec: dict[str, Any]) -> None:
            emit("adom_event", rec)
            name = ui_event_name(rec)
            if name:
                ev = append_event(s, run_id, name, rec)
                if name == "verdict" and opts.open_tickets:
                    open_ticket_for(s, run_id, ev)
            if rec.get("event") in ("MONITOR_REPLACED", "REVOKED") and rec.get("after_version") is not None:
                _set_status(run_id, None, active_monitor_version=f"P_{rec['after_version']}")

        step = None
        try:
            for step in STEPS:
                _set_status(run_id, step)
                emit("step_started", {"step": step})
                run_step(step, run_dir, opts, log_dir, on_adom)
                if step == "setup":
                    tasks = json.loads((run_dir / "tasks.json").read_text(encoding="utf-8"))
                    # ADOM holds out inputs inside each task, not whole tasks, so every task is a run task.
                    _set_status(run_id, step, run_task_ids=sorted(tasks), held_out_task_ids=[])
                if step == "admit":
                    emit("admission_completed", {})
                emit("step_done", {"step": step})
            _set_status(run_id, "done")
            emit("run_done", {"variant": variant_name(opts.level, opts.policy, opts.human_oracle)})
        except Exception as exc:  # noqa: BLE001
            _set_status(run_id, "failed")
            emit("run_failed", {"step": step, "message": str(exc)})
