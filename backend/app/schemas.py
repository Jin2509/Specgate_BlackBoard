"""Wire format. Mirrors src/lib/api/types.ts of LLM_spec_gate (camelCase), except the evaluation `Run`,
which the UI keeps in snake_case (src/core/evaluation-types.ts)."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, SecretStr, StrictBool, StrictInt, StrictStr
from pydantic.alias_generators import to_camel

AnchorLevel = Literal["A0", "A1", "A2", "A3"]
Policy = Literal["strict", "standard", "shadow"]
EvalStatus = Literal["queued", "spec_running", "code_running", "judging", "answered", "followup", "final", "error"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ── Pipeline runs ───────────────────────────────────────────────────────────

class RunCreate(CamelModel):
    dataset_id: str = "evalplus_illustrative"
    seed: str | None = None
    held_out_ratio: float = Field(0.2, gt=0, lt=1)
    level: AnchorLevel = "A3"
    task_ids: list[str] = []          # empty: the tasks of dataset_id if it is an uploaded dataset, else every config


class RunManifest(CamelModel):
    id: str
    dataset_id: str
    seed: str
    held_out_ratio: float
    total_tasks: int
    run_task_ids: list[str]
    held_out_task_ids: list[str]
    is_held_out_locked: bool
    active_monitor_version: str
    status: str
    created_at: datetime


class RunEventOut(CamelModel):
    seq: int
    event: str
    data: dict[str, Any]
    timestamp: datetime


class LockHeldOut(CamelModel):
    seed: str | None = None
    held_out_ratio: float | None = Field(None, gt=0, lt=1)


class AdmissionReviewRequest(CamelModel):
    task_id: str = Field(min_length=1)


# ── Datasets ────────────────────────────────────────────────────────────────

class AcademicTask(CamelModel):
    """AcademicTaskSchema of src/core/schema.ts: strict types, unknown keys dropped (zod default)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, strict=True, extra="ignore")

    id: str
    name: str
    intent_docstring: str
    output_type: Literal["int", "bool", "str", "float", "list", "tuple", "other"]
    is_unique_output: bool
    assigned_by: str = "expert_annotator_1"
    anchor_origin: Literal["gốc", "dẫn xuất"] = "gốc"
    epsilon: float | None = None
    has_a2: bool
    has_a3: bool
    anchor_level: AnchorLevel
    is_b_synth_supported: bool = Field(alias="isBSynthSupported")


# ── Evaluation runs ─────────────────────────────────────────────────────────

class EvalRunCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    mode: Literal["evaluation"]
    datasetId: str = Field(min_length=1)
    datasetVersion: str = Field(min_length=1)
    problemId: str = Field(min_length=1)
    problem: str = Field(min_length=1)


EvalVerdict = str   # ACC | SPEC_FAULT | CODE_FAULT | DUAL_FAULT | UNKNOWN_* | NEUTRAL | UNKNOWN


class RunPatchFields(BaseModel):
    """The only Run fields a client may overwrite."""

    model_config = ConfigDict(extra="forbid")

    status: EvalStatus | None = None
    confidence: float | None = Field(None, ge=0, le=1)
    gold_label: EvalVerdict | None = None


class TurnIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "system"]
    content: str
    verdict: EvalVerdict | None = None
    confidence: float | None = None
    latencyMs: float | None = None


class RunPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patch: RunPatchFields | None = None
    turn: TurnIn | None = None
    verdict: EvalVerdict | None = None
    latency: dict[str, float] | None = None
    log: str | None = None
    level: Literal["info", "warn", "error"] = "info"


class ReviewIn(BaseModel):
    agree: StrictBool
    note: StrictStr


class FollowupIn(BaseModel):
    content: str = Field(min_length=1)


class ClearRunsIn(BaseModel):
    confirmation: str


# ── Chat page: POST /api/run, /api/run/followup ──────────────────────────────

class LlmConfigIn(BaseModel):
    """One LLM chosen on the chat page. `apiKey` is a SecretStr: it never shows in repr, logs or errors."""

    model_config = ConfigDict(extra="forbid")

    provider: Literal["openai", "anthropic"]
    model: str = Field(min_length=1)
    apiKey: SecretStr = Field(min_length=1)


class ChatRunIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    datasetId: str = Field(min_length=1)
    taskId: str = Field(min_length=1)
    llmSpec: LlmConfigIn
    llmCode: LlmConfigIn


class ChatFollowupIn(BaseModel):
    """The single follow-up of an `unknown` first round; `runId` is the evaluation run of that round."""

    model_config = ConfigDict(extra="forbid")

    runId: str = Field(min_length=1)
    datasetId: str = Field(min_length=1)
    taskId: str = Field(min_length=1)
    llmSpec: LlmConfigIn
    spec: str
    code: str
    answer: str = Field(min_length=1)


# ── Tickets ─────────────────────────────────────────────────────────────────

class TicketAnswerIn(CamelModel):
    answer: Any = None
    is_uncertain: bool | None = None
    duration_ms: float | None = Field(None, ge=0)


# ── Experiments ─────────────────────────────────────────────────────────────

class ExperimentConfig(CamelModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")

    dataset_id: str = Field(min_length=1)
    held_out_ratio: float = Field(gt=0, lt=1)
    coder_model: str = Field(min_length=1)
    spec_model: str = Field(min_length=1)
    anchor_level: AnchorLevel
    policy: Policy
    unknown_mode: Literal["closed", "open"]
    human_oracle: Literal["off", "perfect", "noise_5", "noise_10", "real_human"]
    baselines: list[str]
    seed: str = Field(min_length=1)


class ExperimentRequest(BaseModel):
    config: ExperimentConfig


# ── Settings ────────────────────────────────────────────────────────────────

class LabSettings(CamelModel):
    """PUT /api/settings replaces everything; unknown keys (apiKey...) are rejected (security invariant)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")

    default_coder_model: StrictStr
    default_spec_model: StrictStr
    max_calls_budget: StrictInt = Field(gt=0)
    max_tokens_budget: StrictInt = Field(gt=0)
    a3_timeout_ms: StrictInt = Field(gt=0)
    z3_timeout_ms: StrictInt = Field(gt=0)
    enable_flaky: StrictBool
    enable_audit: StrictBool
    enable_b_synth: StrictBool = Field(alias="enableBSynth")


class FaultProfile(CamelModel):
    spec_fault: str
    code_fault: str
    trusted_fault: str
