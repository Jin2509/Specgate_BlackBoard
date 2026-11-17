"""Contract endpoints (api.md) on recorded data: no pipeline, ADOM records are written straight into run_events."""

import json

import pytest

from app.config import settings
from app.db import SessionLocal
from app.events import append_event
from app.tickets import open_ticket_for

TASK = {"id": "HumanEval/53", "name": "add", "intentDocstring": "Add two numbers x and y", "outputType": "int",
        "isUniqueOutput": True, "hasA2": False, "hasA3": True, "anchorLevel": "A1", "isBSynthSupported": True,
        "grading": {"secret": 1}}


def _rec(event, phase="online", **kw):
    return {"task_id": "HumanEval/53", "phase": phase, "event": event, "timestamp": "2026-10-25T00:00:00+00:00",
            "monitor_version": 0, "unique_output": True, **kw}


def _record(run_id, rec):
    """What app.pipeline.run_job does with one ADOM log line."""
    with SessionLocal() as s:
        append_event(s, run_id, "adom_event", rec)
        if rec["event"] == "VERDICT":
            ev = append_event(s, run_id, "verdict", rec)
            open_ticket_for(s, run_id, ev)
            return f"{run_id}~{ev.seq}"


@pytest.fixture()
def dataset(client):
    body = "\n".join(json.dumps({**TASK, "id": f"HumanEval/{n}"}) for n in (53, 13)) + "\n"
    r = client.post("/api/v1/datasets?datasetId=he&name=HumanEval%2B&version=0.1.10", content=body)
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture()
def run_id(client, dataset):
    return client.post("/api/v1/runs", json={"datasetId": "he", "seed": "7"}).json()["id"]


# ── errors, datasets ────────────────────────────────────────────────────────

def test_error_body_has_error_field(client):
    r = client.get("/api/v1/runs/nope")
    assert r.status_code == 404 and "error" in r.json()


def test_dataset_upload_list_and_tasks(client, dataset):
    assert dataset["taskCount"] == 2 and "grading" not in dataset["tasks"][0]
    assert dataset["tasks"][0]["assignedBy"] == "expert_annotator_1"
    listed = client.get("/api/v1/datasets").json()["datasets"]
    assert [(d["id"], d["name"], d["version"], d["taskCount"]) for d in listed] == [("he", "HumanEval+", "0.1.10", 2)]
    assert client.get("/api/v1/datasets/he/tasks").json()["taskCount"] == 2
    assert client.get("/api/v1/datasets/nope/tasks").status_code == 404


def test_dataset_upload_errors(client):
    assert client.post("/api/v1/datasets", content="  \n").status_code == 400
    r = client.post("/api/v1/datasets", content=json.dumps(TASK) + "\n{bad\n" + json.dumps({**TASK, "outputType": "x"}))
    body = r.json()
    assert r.status_code == 422 and body["success"] is False
    assert (body["totalLines"], body["validCount"]) == (3, 1) and {e["line"] for e in body["errors"]} == {2, 3}


# ── evaluation runs ─────────────────────────────────────────────────────────

def _eval(client, problem="tính tổng"):
    r = client.post("/api/v1/runs", json={"mode": "evaluation", "datasetId": "he", "datasetVersion": "0.1.10",
                                       "problemId": "HumanEval/53", "problem": problem})
    assert r.status_code == 201, r.text
    return r.json()["run"]


def test_evaluation_run_lifecycle(client, dataset):
    run = _eval(client)
    assert run["status"] == "queued" and [t["role"] for t in run["turns"]] == ["user"]
    rid = run["run_id"]
    patched = client.patch(f"/api/v1/runs/{rid}", json={
        "patch": {"status": "answered", "confidence": 0.8}, "verdict": "UNKNOWN_EVIDENCE",
        "turn": {"role": "system", "content": "chưa đủ bằng chứng", "verdict": "UNKNOWN_EVIDENCE"},
        "latency": {"total": 120}, "log": "judging", "level": "info"}).json()["run"]
    assert patched["status"] == "answered" and patched["verdicts"] == ["UNKNOWN_EVIDENCE"]
    assert patched["turns"][-1]["id"] and patched["logs"][0]["message"] == "judging"
    assert client.patch(f"/api/v1/runs/{rid}", json={"patch": {"run_id": "x"}}).status_code == 400

    assert client.post(f"/api/v1/runs/{rid}/followup", json={"content": ""}).status_code == 400
    assert client.post(f"/api/v1/runs/{rid}/followup", json={"content": "thêm ví dụ"}).json()["run"]["status"] == "followup"
    assert client.post(f"/api/v1/runs/{rid}/followup", json={"content": "lần 2"}).status_code == 409

    assert client.patch(f"/api/v1/runs/{rid}/review", json={"agree": "yes", "note": ""}).status_code == 400
    assert client.patch(f"/api/v1/runs/{rid}/review", json={"agree": True, "note": "ok"}).json()["run"]["review"]["agree"]


def test_run_list_filters_stats_export_clear(client, dataset):
    a, b = _eval(client, "tổng hai số"), _eval(client, "đảo chuỗi")
    client.patch(f"/api/v1/runs/{a['run_id']}", json={"verdict": "CODE_FAULT", "patch": {"gold_label": "CODE_FAULT"}})
    page = client.get("/api/v1/runs?verdict=code&pageSize=1").json()
    assert page["total"] == 1 and page["runs"][0]["run_id"] == a["run_id"]
    assert client.get("/api/v1/runs?problem=chuỗi").json()["runs"][0]["run_id"] == b["run_id"]
    assert client.get("/api/v1/runs?pageSize=101").status_code == 400

    metrics = client.get("/api/v1/stats").json()["metrics"]
    assert metrics["totalRuns"] == 2 and metrics["byVerdict"] == {"CODE_FAULT": 1} and metrics["accuracy"] == 1.0

    csv = client.get("/api/v1/runs/export?format=csv")
    assert "attachment" in csv.headers["content-disposition"]
    assert csv.text.splitlines()[0].startswith("run_id,created_at,dataset,problem_id")

    assert client.request("DELETE", "/api/v1/runs", json={"confirmation": "xoa"}).status_code == 400
    assert client.request("DELETE", "/api/v1/runs", json={"confirmation": "XOA LICH SU"}).json() == {"deleted": True}
    assert client.get("/api/v1/runs").json()["total"] == 0


def test_log_stream_closes_on_final(client, dataset):
    rid = _eval(client)["run_id"]
    client.patch(f"/api/v1/runs/{rid}", json={"log": "xong", "patch": {"status": "final"}})
    text = client.get(f"/api/v1/logs/stream?runId={rid}").text
    assert '"message": "xong"' in text
    assert client.get("/api/v1/logs/stream").status_code == 400


# ── pipeline run views ──────────────────────────────────────────────────────

def test_current_run(client, dataset):
    assert client.get("/api/v1/runs/current").status_code == 404
    rid = client.post("/api/v1/runs", json={"datasetId": "he"}).json()["id"]
    assert client.get("/api/v1/runs/current").json() == {"runId": rid}


def test_lock_heldout_once(client, run_id):
    r = client.post(f"/api/v1/runs/{run_id}/lock-heldout", json={"seed": "9", "heldOutRatio": 0.3})
    assert r.status_code == 200 and r.json()["manifest"]["isHeldOutLocked"] and r.json()["manifest"]["seed"] == "9"
    assert client.post(f"/api/v1/runs/{run_id}/lock-heldout", json={}).status_code == 400
    assert client.post("/api/v1/runs/nope/lock-heldout", json={}).status_code == 400
    assert "event: heldout_locked" in client.get(f"/api/v1/runs/{run_id}/events?follow=false").text


def test_cases_tickets_and_queue(client, run_id):
    acc = _record(run_id, _rec("VERDICT", verdict="CODE_FAULT", rule="R5", w={"__tuple__": [2, 3]}, c=6,
                               provenances=["anchor-docstring"], has_target=False, target=None))
    unk = _record(run_id, _rec("VERDICT", verdict="UNKNOWN_EVIDENCE", rule="R6", w={"__tuple__": [5, 7]}, c=11,
                               provenances=[], has_target=False, target=None))
    _record(run_id, _rec("VERDICT", verdict="UNKNOWN_EVIDENCE", rule="R6", w={"__tuple__": [1, 1]}, c=3,
                         provenances=[], has_target=False, target=None, holdout=True))

    cases = client.get(f"/api/v1/cases?runId={run_id}").json()["cases"]
    assert [c["id"] for c in cases] == [acc, unk]
    assert cases[0]["adjudication"]["matchedRule"] == "R5"
    assert cases[0]["groundedEvidence"][0]["source"] == "docstring_anchor"
    with_ticket = client.get(f"/api/v1/cases?runId={run_id}&hasTicket=true").json()["cases"]
    assert [c["id"] for c in with_ticket] == [unk]
    assert client.get(f"/api/v1/cases/{unk}").json()["ticket"]["questionType"] == "expected-output"
    assert client.get(f"/api/v1/cases/{run_id}~99999").status_code == 404

    queue = client.get(f"/api/v1/runs/{run_id}/annotation-queue").json()
    assert queue["total"] == 1 and queue["items"][0]["isUniqueOutput"] is True
    tid = queue["items"][0]["ticket"]["id"]
    assert client.post(f"/api/v1/tickets/{tid}/defer").json()["status"] == "open"
    r = client.post(f"/api/v1/tickets/{tid}/answer", json={"answer": 12, "durationMs": 900})
    assert r.status_code == 200 and r.json()["ticket"]["status"] == "spent" and "resolvedVerdict" not in r.json()
    again = client.post(f"/api/v1/tickets/{tid}/answer", json={"answer": 12})
    assert again.status_code == 409 and again.json()["error"]["code"] == "TICKET_ALREADY_SPENT"
    assert client.get(f"/api/v1/runs/{run_id}/annotation-queue").json()["total"] == 0
    summary = client.get(f"/api/v1/runs/{run_id}/summary").json()
    assert (summary["ticketsSpent"], summary["ticketsTotal"], summary["datasetName"]) == (1, 1, "HumanEval+")


def test_repair_candidates_and_revocation(client, run_id):
    w = {"__tuple__": [2, 3]}
    case = _record(run_id, _rec("VERDICT", verdict="SPEC_FAULT", rule="R2", w=w, c=5, provenances=["a3"],
                                has_target=True, target=5))
    patch = {"patch_id": "p1", "guard": {}, "dsl": "C0 or (x == 2 and result == 5)", "target": 5}
    _record(run_id, _rec("TASK_START", phase="setup"))
    _record(run_id, _rec("REPAIR_CANDIDATES", phase="repair", repair_id="r1", w=w))
    for rank, passed in ((0, False), (1, True)):
        _record(run_id, _rec("GATE_RESULT", phase="repair", repair_id="r1", rank=rank, family="point_patch",
                             g_width=1, d_complexity=3, passed=passed, mode="PASS_NO_A2" if passed else "FAIL",
                             failed_at=None if passed else "G3", g5_method="none", b_in_g_empty=True,
                             bsynth_in_g_empty=True, reasons={}, patch=patch,
                             checks={"G1": True, "G2": True, "G3": passed, "G4": True, "G5": None}))
    _record(run_id, _rec("MONITOR_REPLACED", phase="repair", repair_id="r1", rank=1, before_version=0,
                         after_version=1, patch=patch))
    _record(run_id, _rec("REVOKED", phase="maintenance", patch_id="p1", b=[w, 5], before_version=1,
                         after_version=2, reason="n_k"))

    cands = client.get(f"/api/v1/runs/{run_id}/cases/{case}/repair-candidates").json()["candidates"]
    assert [c["gateResult"]["passed"] for c in cands] == [False, True]
    assert cands[0]["gateResult"]["firstFailedCheck"] == "g2_reject_b" and not cands[0]["gateResult"]["checks"]["g2_reject_b"]
    assert cands[1]["family"] == "point_patch" and cands[1]["passMode"] == "PASS_NO_A2" and cands[1]["isDeployed"]

    history = client.get(f"/api/v1/runs/{run_id}/revocation").json()["monitorHistory"]
    assert [(h["version"], h["status"]) for h in history] == [("P_0", "deprecated"), ("P_1", "revoked"),
                                                              ("P_2", "active")]


def test_admission_report(client, run_id):
    assert all(s["status"] == "idle" for s in client.get(f"/api/v1/runs/{run_id}/admission").json()["steps"])
    _record(run_id, _rec("STATIC_OK", phase="admission"))
    _record(run_id, _rec("SILENT_FAULT", phase="admission", w=[1], c=2))
    _record(run_id, _rec("LOOSENESS_MEASURED", phase="admission", n=4, accepted=1, errors=0, ratio=0.25))
    _record(run_id, _rec("ADMISSION_DONE", phase="admission"))
    report = client.get(f"/api/v1/runs/{run_id}/admission").json()
    steps = {s["key"]: s for s in report["steps"]}
    assert [s["key"] for s in report["steps"]][0] == "static_checker" and len(steps) == 6
    assert steps["silent_fault_replay"]["silentFaultCases"] == ["HumanEval/53"]
    assert report["summary"]["slackRatio"] == 25.0 and report["summary"]["admittedTasks"] == 1
    r = client.post(f"/api/v1/runs/{run_id}/admission/review", json={"taskId": "HumanEval/53"})
    assert r.json()["reviewedTaskIds"] == ["HumanEval/53"]
    assert client.post(f"/api/v1/runs/{run_id}/admission/review", json={}).status_code == 400


def test_evidence_without_results_is_empty(client, run_id):
    ev = client.get(f"/api/v1/runs/{run_id}/evidence").json()
    assert ev["good"] == [] and ev["bad"] == [] and ev["invariant"]["holds"] is True


@pytest.mark.parametrize("method,path", [
    ("post", "/api/v1/runs/{run}/admission"),
    ("post", "/api/v1/runs/{run}/revocation"),
    ("get", "/api/v1/runs/{run}/results/rq1"),
    ("post", "/api/v1/experiments/plan"),
])
def test_engine_not_configured(client, run_id, method, path):
    body = {"config": {}} if "plan" in path else None
    r = client.request(method.upper(), path.format(run=run_id), json=body)
    if "plan" in path:
        assert r.status_code == 400   # config is validated before anything else
        return
    assert r.status_code == 501 and r.json()["error"]["code"] == "ENGINE_NOT_CONFIGURED"


def test_unknown_rq_is_404(client, run_id):
    assert client.get(f"/api/v1/runs/{run_id}/results/rq9").status_code == 404


# ── experiments, settings, fault injection ──────────────────────────────────

CATALOG = [{"id": "m-coder", "name": "Coder", "family": "a"}, {"id": "m-spec", "name": "Spec", "family": "b"}]


def test_settings_strict(client, monkeypatch):
    monkeypatch.setattr(settings, "model_catalog", CATALOG)
    s = client.get("/api/v1/settings").json()
    assert s["settings"]["defaultCoderModel"] == "m-coder" and "updatedAt" not in s
    good = {**s["settings"], "maxCallsBudget": 50}
    assert client.put("/api/v1/settings", json={**good, "apiKey": "sk-x"}).status_code == 400
    assert client.put("/api/v1/settings", json={**good, "maxCallsBudget": 0}).status_code == 400
    assert client.put("/api/v1/settings", json={**good, "defaultSpecModel": "nope"}).status_code == 400
    saved = client.put("/api/v1/settings", json=good).json()
    assert saved["settings"]["maxCallsBudget"] == 50 and saved["updatedAt"]


def test_experiment_start_and_status(client, dataset, monkeypatch):
    monkeypatch.setattr(settings, "model_catalog", CATALOG)
    opts = client.get("/api/v1/experiments/options").json()
    cfg = {**opts["defaults"], "humanOracle": "real_human"}
    assert cfg["datasetId"] == "he"
    assert client.post("/api/v1/experiments", json={"config": {**cfg, "specModel": "m-coder"}}).status_code == 400
    r = client.post("/api/v1/experiments", json={"config": cfg})
    assert r.status_code == 201, r.text
    exp = r.json()
    assert exp["status"] == "running" and exp["progress"]["total"] == 2 and len(exp["manifestHash"]) == 64
    assert client.get(f"/api/v1/experiments/{exp['experimentId']}").json()["config"]["humanOracle"] == "real_human"
    assert client.get("/api/v1/experiments/nope").status_code == 404


def test_fault_injection(client):
    state = client.get("/api/v1/fault-injection").json()
    assert state["metrics"]["totalInjections"] == 0
    assert client.post("/api/v1/fault-injection", json={"specFault": "x", "codeFault": "none",
                                                     "trustedFault": "none"}).status_code == 400
    assert client.post("/api/v1/fault-injection", json=state["defaults"]).status_code == 501
