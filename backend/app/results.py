"""Reads the files ADOM writes into a run directory (the other module, with pipeline.py, that knows ADOM).

Layout under RUNS_DIR/<run id>/:
    MANIFEST.json, tasks.json, specs.json        written by setup / admit
    <variant>/variant.json                       one per `run`, variant = {level}-{fault}-{policy}[-...]
    <variant>/state/<task>.json                  final monitor + evidence stores (G/B)
    <variant>/monitors/<task>/v<N>.json          every monitor version P_0..P_k
where <task> is the task id with "/" replaced by "_".

Names coming from a URL are only accepted if they match what is on disk, so no path is built from raw input.
"""

import json
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from app.config import settings


def _read(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _task_file(task_id: str) -> str:
    return task_id.replace("/", "_")


def run_dir(run_id: str) -> Path:
    root = settings.runs_dir.resolve()
    candidates = {p.name: p for p in root.iterdir() if p.is_dir()} if root.exists() else {}
    path = candidates.get(run_id)
    if path is None or not (path / "tasks.json").exists():
        raise HTTPException(404, f'Run "{run_id}" chưa có kết quả setup.')
    return path


def read_tasks(run_id: str) -> dict[str, Any]:
    return _read(run_dir(run_id) / "tasks.json")


def read_specs(run_id: str) -> dict[str, Any]:
    path = run_dir(run_id) / "specs.json"
    if not path.exists():
        raise HTTPException(404, f'Run "{run_id}" chưa chạy admit.')
    return _read(path)


def _variant_dirs(run: Path) -> dict[str, Path]:
    return {p.name: p for p in run.iterdir() if p.is_dir() and (p / "variant.json").exists()}


def list_variants(run_id: str) -> list[dict[str, Any]]:
    out = []
    for name, path in sorted(_variant_dirs(run_dir(run_id)).items()):
        v = _read(path / "variant.json")
        out.append({
            "variant": name,
            "level": v.get("level"),
            "fault": v.get("fault"),
            "policy": v.get("policy"),
            "humanOracle": v.get("human_oracle"),
            "tasks": {tid: {"status": t.get("status"), "finalVersion": t.get("final_version")}
                      for tid, t in v.get("tasks", {}).items()},
        })
    return out


def _variant_dir(run_id: str, variant: str) -> Path:
    path = _variant_dirs(run_dir(run_id)).get(variant)
    if path is None:
        raise HTTPException(404, f'Run "{run_id}" không có variant "{variant}".')
    return path


def read_variant(run_id: str, variant: str) -> dict[str, Any]:
    return _read(_variant_dir(run_id, variant) / "variant.json")


def _task_name(run_id: str, task_id: str) -> str:
    if task_id not in read_tasks(run_id):
        raise HTTPException(404, f'Run "{run_id}" không có task "{task_id}".')
    return _task_file(task_id)


def read_state(run_id: str, variant: str, task_id: str) -> dict[str, Any]:
    path = _variant_dir(run_id, variant) / "state" / f"{_task_name(run_id, task_id)}.json"
    if not path.exists():
        raise HTTPException(404, f'Task "{task_id}" không có state trong variant "{variant}".')
    return _read(path)


def specs_or_empty(run_id: str) -> dict[str, Any]:
    """specs.json, or {} while setup/admit have not written it."""
    try:
        return read_specs(run_id)
    except HTTPException:
        return {}


def states_or_empty(run_id: str, variant: str) -> dict[str, tuple[dict[str, Any], float]]:
    """task id -> (final state, file mtime) for every task of a variant; {} while it has not run."""
    try:
        folder = _variant_dir(run_id, variant) / "state"
        tasks = read_tasks(run_id)
    except HTTPException:
        return {}
    out = {}
    for tid in tasks:
        path = folder / f"{_task_file(tid)}.json"
        if path.exists():
            out[tid] = (_read(path), path.stat().st_mtime)
    return out


def list_monitors(run_id: str, variant: str, task_id: str) -> list[dict[str, Any]]:
    """Every monitor version of a task, oldest first."""
    folder = _variant_dir(run_id, variant) / "monitors" / _task_name(run_id, task_id)
    if not folder.exists():
        raise HTTPException(404, f'Task "{task_id}" không có monitor trong variant "{variant}".')
    monitors = [_read(p) for p in folder.glob("v*.json")]
    return sorted(monitors, key=lambda m: m["version"])
