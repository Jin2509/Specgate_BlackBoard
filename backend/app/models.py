from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Run(Base):
    """One ADOM pipeline run (setup -> admit -> run of one variant). Also backs an experiment."""

    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    dataset_id: Mapped[str] = mapped_column(String)
    seed: Mapped[str] = mapped_column(String)
    held_out_ratio: Mapped[float] = mapped_column(Float)
    run_task_ids: Mapped[list] = mapped_column(JSON, default=list)
    held_out_task_ids: Mapped[list] = mapped_column(JSON, default=list)
    is_held_out_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    active_monitor_version: Mapped[str] = mapped_column(String, default="P_0")
    status: Mapped[str] = mapped_column(String, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    # Variant options passed to `harness.pipeline run`; `variant` is the folder ADOM writes.
    level: Mapped[str] = mapped_column(String, default="A3")
    policy: Mapped[str] = mapped_column(String, default="standard")
    fail_mode: Mapped[str] = mapped_column(String, default="closed")
    human_oracle: Mapped[str] = mapped_column(String, default="none")   # ADOM value: none | perfect | noise5 | noise10
    variant: Mapped[str] = mapped_column(String, default="A3-natural-standard")
    admission_reviewed_task_ids: Mapped[list] = mapped_column(JSON, default=list)
    experiment_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)   # set by POST /api/experiments


class RunEvent(Base):
    """Append-only event log; `seq` backs SSE resume via Last-Event-ID."""

    __tablename__ = "run_events"
    __table_args__ = (UniqueConstraint("run_id", "seq"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id"), index=True)
    seq: Mapped[int] = mapped_column(Integer)
    event: Mapped[str] = mapped_column(String)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Ticket(Base):
    """Human query ticket for one case (an UNKNOWN verdict at witness w). Single-shot: open -> spent."""

    __tablename__ = "tickets"
    __table_args__ = (UniqueConstraint("run_id", "task_id", "witness_key"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id"), index=True)
    case_id: Mapped[str] = mapped_column(String, index=True)
    task_id: Mapped[str] = mapped_column(String)
    witness_key: Mapped[str] = mapped_column(Text)
    witness: Mapped[object] = mapped_column(JSON, nullable=True)
    code_output: Mapped[object] = mapped_column(JSON, nullable=True)
    question_type: Mapped[str] = mapped_column(String)       # expected-output | acceptability
    prompt_text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="open")
    answer: Mapped[object] = mapped_column(JSON, nullable=True)
    is_uncertain: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    defer_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    version: Mapped[str] = mapped_column(String)
    tasks: Mapped[list] = mapped_column(JSON, default=list)   # AcademicTask dicts, upload order
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class EvalRun(Base):
    """Evaluation run of the chat testbed / history (`Run` in the UI's evaluation-types.ts)."""

    __tablename__ = "eval_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    dataset_id: Mapped[str] = mapped_column(String)
    dataset_version: Mapped[str] = mapped_column(String)
    problem_id: Mapped[str] = mapped_column(String)
    problem: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="queued")
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    gold_label: Mapped[str | None] = mapped_column(String, nullable=True)
    spec: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    code: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    turns: Mapped[list] = mapped_column(JSON, default=list)
    verdicts: Mapped[list] = mapped_column(JSON, default=list)
    latency: Mapped[dict] = mapped_column(JSON, default=dict)
    logs: Mapped[list] = mapped_column(JSON, default=list)
    review: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    followup_used: Mapped[bool] = mapped_column(Boolean, default=False)


class LabSettingsRow(Base):
    """Single row (id 1) holding LabSettings as JSON."""

    __tablename__ = "lab_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
