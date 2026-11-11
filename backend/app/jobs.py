"""Creates a pipeline run and schedules its job (POST /api/runs and POST /api/experiments)."""

import time
from typing import Any

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app import lab_settings
from app.config import settings
from app.events import append_event
from app.models import Dataset, Run
from app.pipeline import JobOptions, adom_seed, run_job, variant_name


def create_pipeline_run(session: Session, background: BackgroundTasks, *, dataset_id: str, seed: str | None,
                        held_out_ratio: float, level: str, task_ids: list[str], policy: str = "standard",
                        fail_mode: str = "closed", human_oracle: str = "none", ablation: bool = False,
                        models: dict[str, str] | None = None, experiment_config: dict[str, Any] | None = None) -> Run:
    if not task_ids:
        ds = session.get(Dataset, dataset_id)
        task_ids = [t["id"] for t in ds.tasks] if ds else []
    lab, _ = lab_settings.load(session)
    run_id = f"run_{time.time_ns()}"
    run = Run(
        id=run_id, dataset_id=dataset_id, seed=seed or f"seed_{time.time_ns()}", held_out_ratio=held_out_ratio,
        level=level, policy=policy, fail_mode=fail_mode, human_oracle=human_oracle,
        variant=variant_name(level, policy, human_oracle), experiment_config=experiment_config,
    )
    session.add(run)
    session.commit()
    append_event(session, run_id, "run_created", {"runId": run_id})
    if settings.pipeline_enabled:
        env = {"LLM_MAX_CALLS": str(lab["maxCallsBudget"])}
        if models:
            env |= {k: v for k, v in models.items() if v}
        opts = JobOptions(seed=adom_seed(run.seed), level=level, task_ids=task_ids, policy=policy,
                          fail_mode=fail_mode, human_oracle=human_oracle, ablation=ablation,
                          flaky_probe=bool(lab["enableFlaky"]), a3_timeout_s=lab["a3TimeoutMs"] / 1000,
                          open_tickets=human_oracle == "none", env=env)
        # Sync function: FastAPI runs it in its threadpool after the response is sent.
        background.add_task(run_job, run_id, opts)
    return run
