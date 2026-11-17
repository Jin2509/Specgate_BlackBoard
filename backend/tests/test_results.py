"""Result endpoints and UI event names, on one real pipeline run with fixed LLM answers."""

import json

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import Base, engine
from app.main import app
from app.pipeline import ui_event_name

VARIANT = "A3-natural-standard"
TASKS = ["HumanEval/53", "HumanEval/13", "HumanEval/23"]


@pytest.fixture(scope="module")
def finished_run(tmp_path_factory):
    if not (settings.adom_dir / "tests" / "fixtures" / "llm.json").exists():
        pytest.skip(f"spec-gate/adom not found at {settings.adom_dir}")
    try:
        from harness import dataset as ds
        ds.download("humanevalplus")
    except Exception as exc:  # noqa: BLE001
        pytest.skip(f"HumanEval+ not available: {exc}")
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(settings, "pipeline_enabled", True)
        mp.setattr(settings, "runs_dir", tmp_path_factory.mktemp("runs"))
        mp.setattr(settings, "llm_fixtures", "tests/fixtures/llm.json")
        mp.setattr(settings, "adom_tasks_dir", "tests/fixtures/tasks")
        mp.setattr(settings, "holdout_max", 40)
        Base.metadata.drop_all(engine)
        with TestClient(app) as client:
            # TestClient returns only after the background job has finished.
            run_id = client.post("/api/v1/runs", json={"taskIds": TASKS}).json()["id"]
            yield client, run_id


def _events(client, run_id):
    text = client.get(f"/api/v1/runs/{run_id}/events?follow=false").text
    out = []
    for block in text.strip().split("\n\n"):
        fields = dict(line.split(": ", 1) for line in block.splitlines() if not line.startswith(":"))
        out.append((fields["event"], json.loads(fields["data"])))
    return out


def test_ui_event_name():
    assert ui_event_name({"phase": "online", "event": "VERDICT"}) == "verdict"
    assert ui_event_name({"phase": "admission", "event": "VERDICT"}) == "verdict"
    assert ui_event_name({"phase": "admission", "event": "STATIC_OK"}) == "admission_step"
    assert ui_event_name({"phase": "online", "event": "STATIC_OK"}) is None
    assert ui_event_name({"phase": "repair", "event": "MONITOR_REPLACED"}) == "repair_deployed"
    assert ui_event_name({"phase": "maintenance", "event": "REVOKED"}) == "patch_revoked"
    assert ui_event_name({"phase": "online", "event": "PASS"}) is None


@pytest.mark.slow
def test_ui_events_mirror_adom_events(finished_run):
    client, run_id = finished_run
    events = _events(client, run_id)
    adom = [d for e, d in events if e == "adom_event"]
    verdicts = [d for e, d in events if e == "verdict"]
    assert verdicts and len(verdicts) == sum(d["event"] == "VERDICT" for d in adom)
    assert len([e for e, _ in events if e == "admission_step"]) == sum(
        d["phase"] == "admission" and ui_event_name(d) == "admission_step" for d in adom)
    assert [e for e, _ in events].count("admission_completed") == 1


@pytest.mark.slow
def test_variants_and_tasks(finished_run):
    client, run_id = finished_run
    variants = client.get(f"/api/v1/runs/{run_id}/variants").json()
    assert [v["variant"] for v in variants] == [VARIANT]
    assert set(variants[0]["tasks"]) == set(TASKS)
    assert variants[0]["tasks"]["HumanEval/53"]["status"] == "ok"
    assert client.get(f"/api/v1/runs/{run_id}/variants/{VARIANT}").json()["level"] == "A3"
    assert set(client.get(f"/api/v1/runs/{run_id}/tasks").json()) == set(TASKS)
    assert set(client.get(f"/api/v1/runs/{run_id}/specs").json()) == set(TASKS)


@pytest.mark.slow
def test_state_and_monitor_history(finished_run):
    client, run_id = finished_run
    final = client.get(f"/api/v1/runs/{run_id}/variants").json()[0]["tasks"]["HumanEval/53"]["finalVersion"]
    state = client.get(f"/api/v1/runs/{run_id}/variants/{VARIANT}/state/HumanEval/53").json()
    assert {"monitor", "stores"} <= set(state)
    monitors = client.get(f"/api/v1/runs/{run_id}/variants/{VARIANT}/monitors/HumanEval/53").json()
    assert [m["version"] for m in monitors] == list(range(final + 1))


@pytest.mark.slow
@pytest.mark.parametrize("path", [
    "variants/A9-nope-standard",
    "variants/..",
    "variants/A3-natural-standard/state/HumanEval/9999",
    "variants/A3-natural-standard/state/../../MANIFEST",
    "variants/A3-natural-standard/monitors/..%2F..%2Fspecs",
])
def test_unknown_or_escaping_names_are_404(finished_run, path):
    client, run_id = finished_run
    assert client.get(f"/api/v1/runs/{run_id}/{path}").status_code == 404


def test_run_without_results_is_404(client):
    run_id = client.post("/api/v1/runs", json={}).json()["id"]
    assert client.get(f"/api/v1/runs/{run_id}/variants").status_code == 404
