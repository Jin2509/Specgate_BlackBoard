"""POST /api/run and /api/run/followup: 501 without an engine, and with a fake engine every round is an
evaluation run that History (/api/runs) and Stats (/api/stats) read. API keys never leave the request."""

import json

import pytest

from app import judge
from app.db import SessionLocal
from app.evaluation import run_out
from app.models import EvalRun

TASK = {"id": "t_median", "name": "median", "intentDocstring": "median(xs) trả về trung vị.", "outputType": "float",
        "isUniqueOutput": True, "hasA2": True, "hasA3": False, "anchorLevel": "A2", "isBSynthSupported": False}
SPEC_KEY, CODE_KEY = "sk-spec-secret-123", "sk-ant-code-secret-456"


def body(**extra):
    return {"datasetId": "ds1", "taskId": "t_median",
            "llmSpec": {"provider": "openai", "model": "gpt-4o-mini", "apiKey": SPEC_KEY},
            "llmCode": {"provider": "anthropic", "model": "claude-sonnet-5-5", "apiKey": CODE_KEY}, **extra}


def followup_body(run_id, **extra):
    return {"runId": run_id, "datasetId": "ds1", "taskId": "t_median",
            "llmSpec": {"provider": "openai", "model": "gpt-4o-mini", "apiKey": SPEC_KEY},
            "spec": "SPEC", "code": "def median(xs): ...", "answer": "median([1,2,3,4]) = 2.5", **extra}


def events(response):
    """[(event, data)] of an SSE response."""
    out = []
    for block in response.text.replace("\r\n", "\n").split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines() if ": " in line)
        if "event" in lines:
            out.append((lines["event"], json.loads(lines["data"])))
    return out


def step(name, output, ms):
    return [{"event": "step", "data": {"step": name, "status": "running"}},
            {"event": "step", "data": {"step": name, "status": "done", "output": output, "durationMs": ms}}]


def first_round(verdict):
    def run_first(task, spec_llm, code_llm):
        assert task["id"] == "t_median"
        assert (spec_llm.api_key, code_llm.api_key) == (SPEC_KEY, CODE_KEY)   # keys reach the engine
        assert SPEC_KEY not in repr(spec_llm)                                  # but never its repr
        yield from step("spec", "SPEC", 1200)
        yield from step("code", "def median(xs): ...", 900)
        yield from step("check", "{}", 400)
        yield {"event": "verdict", "data": verdict}
    return run_first


def assert_no_key(*texts):
    for text in texts:
        assert SPEC_KEY not in text and CODE_KEY not in text


@pytest.fixture()
def dataset(client):
    r = client.post("/api/datasets?datasetId=ds1&name=Demo&version=1", content=json.dumps(TASK) + "\n")
    assert r.status_code == 201, r.text


@pytest.fixture()
def engine(monkeypatch):
    monkeypatch.setattr(judge, "available", lambda: True)
    return monkeypatch


def db_dump():
    with SessionLocal() as s:
        return json.dumps([run_out(r) for r in s.query(EvalRun).all()], ensure_ascii=False)


# ── without an engine ───────────────────────────────────────────────────────

def test_run_is_501_without_engine_and_records_nothing(client, dataset):
    r = client.post("/api/run", json=body())
    assert r.status_code == 501 and r.json()["code"] == "ENGINE_NOT_CONFIGURED"
    assert client.get("/api/runs").json()["total"] == 0
    assert_no_key(r.text)


def test_followup_is_404_for_unknown_run(client, dataset):
    assert client.post("/api/run/followup", json=followup_body("eval_nope")).status_code == 404


def test_unknown_dataset_or_task_is_404(client, dataset):
    assert client.post("/api/run", json=body(datasetId="nope")).status_code == 404
    assert client.post("/api/run", json=body(taskId="nope")).status_code == 404


def test_bad_body_is_400_without_echoing_the_key(client, dataset):
    r = client.post("/api/run", json=body(extra="x"))
    assert r.status_code == 400 and r.json()["code"] == "VALIDATION_ERROR"
    bad = body()
    bad["llmSpec"] = {**bad["llmSpec"], "provider": "nope"}
    r2 = client.post("/api/run", json=bad)
    assert r2.status_code == 400
    assert_no_key(r.text, r2.text)


# ── with an engine ──────────────────────────────────────────────────────────

def test_run_is_recorded_for_history_and_stats(client, dataset, engine):
    engine.setattr(judge, "run_first", first_round({"verdict": "consistent", "reason": "Khớp."}))
    r = client.post("/api/run", json=body())
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/event-stream")
    evs = events(r)
    assert evs[0][0] == "run" and [e for e, _ in evs[1:]] == ["step"] * 6 + ["verdict"]
    run_id = evs[0][1]["runId"]

    run = client.get(f"/api/runs/{run_id}").json()["run"]
    assert run["status"] == "final" and run["verdicts"] == ["ACC"]
    assert run["dataset"] == {"id": "ds1", "version": "1"} and run["problem_id"] == "t_median"
    assert run["spec"] == {"agent": "spec", "model": "gpt-4o-mini", "version": "openai", "status": "done",
                           "output": "SPEC", "latencyMs": 1200}
    assert run["code"]["model"] == "claude-sonnet-5-5" and run["code"]["output"] == "def median(xs): ..."
    assert run["latency"] == {"spec": 1200, "code": 900, "check": 400}
    assert [t["role"] for t in run["turns"]] == ["system"] and run["turns"][0]["verdict"] == "ACC"

    assert client.get("/api/runs").json()["total"] == 1
    stats = client.get("/api/stats").json()
    assert stats["metrics"]["byVerdict"] == {"ACC": 1} and stats["metrics"]["totalRuns"] == 1
    assert_no_key(r.text, db_dump(), json.dumps(stats))


def test_unknown_asks_once_and_followup_is_written_into_the_same_run(client, dataset, engine):
    engine.setattr(judge, "run_first", first_round({"verdict": "unknown", "reason": "Mơ hồ.", "question": "n chẵn?"}))

    def run_followup(task, spec_llm, spec, code, answer):
        assert (spec_llm.api_key, spec, code, answer) == (SPEC_KEY, "SPEC", "def median(xs): ...",
                                                           "median([1,2,3,4]) = 2.5")
        yield from step("check", "{}", 300)
        yield {"event": "verdict", "data": {"verdict": "code_fault", "reason": "Phải trả 2.5."}}

    engine.setattr(judge, "run_followup", run_followup)
    run_id = events(client.post("/api/run", json=body()))[0][1]["runId"]
    assert client.get(f"/api/runs/{run_id}").json()["run"]["status"] == "answered"

    r = client.post("/api/run/followup", json=followup_body(run_id))
    evs = events(r)
    assert evs[0] == ("run", {"runId": run_id}) and evs[-1][0] == "verdict"

    run = client.get(f"/api/runs/{run_id}").json()["run"]
    assert run["status"] == "final" and run["verdicts"] == ["UNKNOWN", "CODE_FAULT"]
    assert [t["role"] for t in run["turns"]] == ["system", "user", "system"]
    assert run["turns"][1]["content"] == "median([1,2,3,4]) = 2.5"
    assert run["latency"]["check_followup"] == 300

    again = client.post("/api/run/followup", json=followup_body(run_id))
    assert again.status_code == 409
    metrics = client.get("/api/stats").json()["metrics"]
    assert metrics["followupsUsed"] == 1 and metrics["byVerdict"] == {"CODE_FAULT": 1}
    assert_no_key(r.text, db_dump())


def test_followup_needs_a_pending_question(client, dataset, engine):
    engine.setattr(judge, "run_first", first_round({"verdict": "spec_fault", "reason": "Đặc tả sai."}))
    run_id = events(client.post("/api/run", json=body()))[0][1]["runId"]
    assert client.post("/api/run/followup", json=followup_body(run_id)).status_code == 409


def test_engine_failure_ends_with_error_and_hides_the_key(client, dataset, engine):
    def run_first(task, spec_llm, code_llm):
        yield {"event": "step", "data": {"step": "spec", "status": "running"}}
        raise RuntimeError(f"401 invalid api key {spec_llm.api_key}")

    engine.setattr(judge, "run_first", run_first)
    r = client.post("/api/run", json=body())
    evs = events(r)
    assert evs[-1][0] == "error" and "***" in evs[-1][1]["message"]
    run = client.get(f"/api/runs/{evs[0][1]['runId']}").json()["run"]
    assert run["status"] == "error" and run["spec"]["status"] == "error"
    assert run["logs"][-1]["level"] == "error"
    assert_no_key(r.text, db_dump())
