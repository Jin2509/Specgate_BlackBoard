"""Experiments (batch runner). An experiment is one pipeline run whose variant comes from ExperimentConfig:
anchorLevel -> --level, policy -> --policy, unknownMode -> --fail-mode, humanOracle -> --human-oracle,
baselines -> --ablation, coder/spec model -> CODER_MODEL / SPEC_MODEL of the ADOM process."""

import hashlib
import json
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import lab_settings, views
from app.config import settings
from app.db import get_session
from app.errors import ApiError, engine_not_configured
from app.jobs import create_pipeline_run
from app.models import Dataset, Run, RunEvent
from app.schemas import ExperimentConfig, ExperimentRequest

router = APIRouter(prefix="/api/experiments", tags=["experiments"])

# UI humanOracle -> ADOM --human-oracle. real_human runs without a simulated oracle; its UNKNOWN cases become
# tickets in /annotation-queue.
HUMAN_ORACLE = {"off": "none", "real_human": "none", "perfect": "perfect", "noise_5": "noise5", "noise_10": "noise10"}


def manifest_hash(config: dict[str, Any], task_ids: list[str]) -> str:
    blob = json.dumps({"config": config, "taskIds": sorted(task_ids)}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


@router.get("/options")
def options(session: Session = Depends(get_session)) -> dict[str, Any]:
    lab, _ = lab_settings.load(session)
    datasets = []
    for ds in session.scalars(select(Dataset).order_by(Dataset.created_at)):
        last = session.scalar(select(Run).where(Run.dataset_id == ds.id).order_by(Run.created_at.desc()).limit(1))
        datasets.append({"id": ds.id, "name": ds.name, "taskCount": len(ds.tasks),
                         "heldOutRatio": last.held_out_ratio if last else 0.2,
                         "isHeldOutLocked": last.is_held_out_locked if last else False})
    return {
        "datasets": datasets, "models": settings.model_catalog, "baselines": settings.baselines,
        "anchorLevels": ["A0", "A1", "A2", "A3"],
        "defaults": {"datasetId": datasets[0]["id"] if datasets else "", "heldOutRatio": 0.2,
                     "coderModel": lab["defaultCoderModel"], "specModel": lab["defaultSpecModel"],
                     "anchorLevel": "A1", "policy": "standard", "unknownMode": "closed", "humanOracle": "off",
                     "baselines": [], "seed": "0"},
    }


@router.post("/plan")
def plan(body: ExperimentRequest) -> dict[str, Any]:
    raise engine_not_configured("Chưa có mô hình ước tính chi phí (số lời gọi, token, USD) cho pipeline ADOM.")


def _status(session: Session, run: Run) -> dict[str, Any]:
    cfg = run.experiment_config or {}
    out: dict[str, Any] = {
        "experimentId": run.id, "status": "completed" if run.status in views.TERMINAL else "running",
        "config": cfg, "manifestHash": manifest_hash(cfg, run.run_task_ids), "progress": views.progress(session, run),
        "runId": run.id, "runStatus": run.status,
    }
    if run.status == "failed":
        ev = session.scalar(select(RunEvent).where(RunEvent.run_id == run.id, RunEvent.event == "run_failed")
                            .order_by(RunEvent.seq.desc()).limit(1))
        out["error"] = (ev.data.get("message") if ev else None) or "Pipeline thất bại."
    return out


@router.post("", status_code=201)
def start(body: ExperimentRequest, background: BackgroundTasks,
          session: Session = Depends(get_session)) -> dict[str, Any]:
    cfg: ExperimentConfig = body.config
    ds = session.get(Dataset, cfg.dataset_id)
    if ds is None or not ds.tasks:
        raise ApiError(400, f'Dataset "{cfg.dataset_id}" không tồn tại hoặc chưa có task.')
    unknown = sorted(set(cfg.baselines) - set(settings.baselines))
    if unknown:
        raise ApiError(400, f"Baseline không hỗ trợ: {', '.join(unknown)}.")
    ids = lab_settings.model_ids()
    for label, model in (("coderModel", cfg.coder_model), ("specModel", cfg.spec_model)):
        if ids and model not in ids:
            raise ApiError(400, f'{label} "{model}" không có trong danh mục model.')
    if cfg.coder_model == cfg.spec_model:
        raise ApiError(400, "coderModel và specModel phải khác nhau (ADOM yêu cầu model độc lập).")
    config = cfg.model_dump(by_alias=True)
    run = create_pipeline_run(
        session, background, dataset_id=cfg.dataset_id, seed=cfg.seed, held_out_ratio=cfg.held_out_ratio,
        level=cfg.anchor_level, task_ids=[t["id"] for t in ds.tasks], policy=cfg.policy,
        fail_mode=cfg.unknown_mode, human_oracle=HUMAN_ORACLE[cfg.human_oracle], ablation=bool(cfg.baselines),
        models={"CODER_MODEL": cfg.coder_model, "SPEC_MODEL": cfg.spec_model}, experiment_config=config)
    run.run_task_ids = [t["id"] for t in ds.tasks]   # known up front; setup narrows it to the tasks it kept
    session.commit()
    return _status(session, run)


@router.get("/{experiment_id}")
def status(experiment_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    run = session.get(Run, experiment_id)
    if run is None or run.experiment_config is None:
        raise ApiError(404, f'Thực nghiệm "{experiment_id}" không tồn tại.')
    return _status(session, run)
