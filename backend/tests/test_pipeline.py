"""POST /api/v1/runs drives the real ADOM pipeline with fixed LLM answers (no API calls).

Needs spec-gate/adom at ADOM_DIR and the HumanEval+ download that adom caches; skipped otherwise.
"""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import Base, engine
from app.main import app
from app.pipeline import adom_seed, build_cmd, JobOptions

FIXTURE_TASKS = ["HumanEval/53", "HumanEval/13", "HumanEval/23"]


@pytest.fixture()
def pipeline_client(monkeypatch, tmp_path):
    if not (settings.adom_dir / "tests" / "fixtures" / "llm.json").exists():
        pytest.skip(f"spec-gate/adom not found at {settings.adom_dir}")
    try:
        from harness import dataset as ds
        ds.download("humanevalplus")
    except Exception as exc:  # noqa: BLE001
        pytest.skip(f"HumanEval+ not available: {exc}")
    monkeypatch.setattr(settings, "pipeline_enabled", True)
    monkeypatch.setattr(settings, "runs_dir", tmp_path)
    monkeypatch.setattr(settings, "llm_fixtures", "tests/fixtures/llm.json")
    monkeypatch.setattr(settings, "adom_tasks_dir", "tests/fixtures/tasks")
    monkeypatch.setattr(settings, "holdout_max", 40)
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c


def _events(client, run_id):
    text = client.get(f"/api/v1/runs/{run_id}/events?follow=false").text
    out = []
    for block in text.strip().split("\n\n"):
        fields = dict(line.split(": ", 1) for line in block.splitlines() if not line.startswith(":"))
        out.append((fields["event"], json.loads(fields["data"])))
    return out


def test_seed_string_maps_to_stable_int():
    assert adom_seed("42") == 42
    assert adom_seed("adjudicator_seed_42") == adom_seed("adjudicator_seed_42") != 42


def test_run_cmd_uses_level_and_tasks_dir():
    cmd = build_cmd("run", Path("r"), JobOptions(seed=0, level="A2"))
    assert cmd[cmd.index("--level") + 1] == "A2"
    assert cmd[cmd.index("--tasks") + 1] == settings.adom_tasks_dir


@pytest.mark.slow
def test_post_run_executes_pipeline(pipeline_client):
    # TestClient returns only after background tasks finish, so the job is complete here.
    run_id = pipeline_client.post("/api/v1/runs", json={"seed": "7", "taskIds": FIXTURE_TASKS}).json()["id"]

    manifest = pipeline_client.get(f"/api/v1/runs/{run_id}/manifest").json()
    assert manifest["status"] == "done"
    assert manifest["runTaskIds"] == sorted(FIXTURE_TASKS)

    events = _events(pipeline_client, run_id)
    names = [e for e, _ in events]
    assert [d["step"] for e, d in events if e == "step_done"] == ["setup", "admit", "run"]
    assert names[-1] == "run_done"
    adom = [d for e, d in events if e == "adom_event"]
    assert any(d["phase"] == "admission" for d in adom) and any(d["phase"] == "online" for d in adom)
    assert (settings.runs_dir / run_id / "A3-natural-standard" / "variant.json").exists()


@pytest.mark.slow
def test_failed_step_marks_run_failed(pipeline_client):
    run_id = pipeline_client.post("/api/v1/runs", json={"taskIds": ["HumanEval/9999"]}).json()["id"]

    assert pipeline_client.get(f"/api/v1/runs/{run_id}/manifest").json()["status"] == "failed"
    err = [d for e, d in _events(pipeline_client, run_id) if e == "run_failed"]
    assert err and err[0]["step"] == "setup" and "0 tasks ready" in err[0]["message"]


def test_followed_stream_closes_when_run_finished(pipeline_client):
    run_id = pipeline_client.post("/api/v1/runs", json={"taskIds": ["HumanEval/9999"]}).json()["id"]
    # follow=true would hang forever if the stream ignored the terminal status.
    assert "event: run_failed" in pipeline_client.get(f"/api/v1/runs/{run_id}/events").text
