"""POST /api/run: SSE events of the stateless pipeline, and the API key never leaves the request."""

import asyncio
import json
import logging

import httpx
import pytest

from app import judge, llm
from app.db import SessionLocal
from app.models import Dataset, EvalRun, Run

CANARY = "sk-CANARY-123"


def _body(**kw):
    llm_cfg = {"provider": "openai", "model": "gpt-4o-mini", "apiKey": CANARY}
    return {"llmSpec": dict(llm_cfg), "llmCode": {**llm_cfg, "provider": "anthropic", "model": "claude-sonnet-5-5"},
            "datasetId": "ds1", "taskId": "t_add", **kw}


TASK = {"id": "t_add", "name": "add", "intentDocstring": "add(x, y) returns x + y"}


@pytest.fixture()
def dataset(client):
    with SessionLocal() as s:
        s.add(Dataset(id="ds1", name="Demo", version="1", tasks=[TASK]))
        s.commit()


def _events(text):
    out = []
    for block in text.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines())
        out.append((lines["event"], json.loads(lines["data"])))
    return out


@pytest.fixture()
def replies(monkeypatch, dataset):
    """Fake LLMs: each step answers from this dict; records which key each call received."""
    answers = {"spec": "add returns the sum", "code": "def add(x, y): return x - y",
               "check": '{"verdict": "code_fault", "reason": "subtracts"}'}
    calls = []

    async def fake(provider, model, api_key, system, prompt):
        step = "spec" if prompt.startswith("Write a precise") else "code" if prompt.startswith("Write a Python") else "check"
        assert TASK["intentDocstring"] in prompt
        calls.append((step, provider, model, api_key, prompt))
        reply = answers[step]
        if isinstance(reply, Exception):
            raise reply
        return reply

    monkeypatch.setattr(llm, "complete", fake)
    return answers, calls


def test_streams_steps_then_verdict(client, replies, caplog):
    caplog.set_level(logging.DEBUG)
    answers, calls = replies
    res = client.post("/api/run", json=_body())
    assert res.status_code == 200 and res.headers["content-type"].startswith("text/event-stream")
    events = _events(res.text)
    assert [(e, d.get("step"), d.get("status")) for e, d in events] == [
        ("step", "spec", "running"), ("step", "spec", "done"), ("step", "code", "running"), ("step", "code", "done"),
        ("step", "check", "running"), ("step", "check", "done"), ("verdict", None, None)]
    assert events[1][1]["output"] == answers["spec"] and events[3][1]["output"] == answers["code"]
    assert events[-1][1] == {"verdict": "code_fault", "reason": "subtracts"}
    # spec and check use the spec LLM, code uses the code LLM; every call got the key from the body.
    assert [c[:4] for c in calls] == [("spec", "openai", "gpt-4o-mini", CANARY),
                                      ("code", "anthropic", "claude-sonnet-5-5", CANARY),
                                      ("check", "openai", "gpt-4o-mini", CANARY)]
    # The code LLM never sees the spec: the two are generated independently.
    assert answers["spec"] not in calls[1][4] and answers["spec"] in calls[2][4] and answers["code"] in calls[2][4]
    assert CANARY not in res.text and CANARY not in caplog.text


def test_unknown_when_check_format_is_wrong(client, replies):
    answers, _ = replies
    answers["check"] = '{"verdict": "consistent", "reason": "ok"}'
    assert _events(client.post("/api/run", json=_body()).text)[-1][1]["verdict"] == "consistent"
    answers["check"] = "I think it is fine"
    last = _events(client.post("/api/run", json=_body()).text)[-1][1]
    assert last["verdict"] == "unknown" and last["question"]


def test_followup_rechecks_once_with_the_answer_and_never_asks_again(client, replies):
    answers, calls = replies
    answers["check"] = '{"verdict": "unknown", "reason": "ambiguous"}'
    body = {"llmSpec": _body()["llmSpec"], "datasetId": "ds1", "taskId": "t_add",
            "spec": "SPEC-1", "code": "CODE-1", "answer": "add(2, 3) must be 5"}
    events = _events(client.post("/api/run/followup", json=body).text)
    assert [(e, d.get("step"), d.get("status")) for e, d in events] == [
        ("step", "check", "running"), ("step", "check", "done"), ("verdict", None, None)]
    assert events[-1][1] == {"verdict": "unknown", "reason": "ambiguous"}  # final: no question
    prompt = calls[-1][4]
    assert all(x in prompt for x in ("SPEC-1", "CODE-1", "add(2, 3) must be 5"))
    assert CANARY not in json.dumps(events)


def test_unknown_dataset_or_task_is_404(client, dataset):
    assert client.post("/api/run", json=_body(datasetId="nope")).status_code == 404
    res = client.post("/api/run", json=_body(taskId="nope"))
    assert res.status_code == 404 and res.json()["code"] == "NOT_FOUND"


def test_llm_error_ends_with_error_event(client, replies):
    answers, _ = replies
    answers["code"] = llm.LlmError("API key bị nhà cung cấp từ chối")
    events = _events(client.post("/api/run", json=_body()).text)
    assert events[-1] == ("error", {"step": "code", "message": "API key bị nhà cung cấp từ chối"})
    assert all(e != "verdict" for e, _ in events)


def test_unexpected_error_is_generic(client, dataset, monkeypatch):
    async def boom(body, task):
        raise RuntimeError(f"leak {CANARY}")
        yield  # pragma: no cover

    monkeypatch.setattr(judge, "run", boom)
    res = client.post("/api/run", json=_body())
    assert _events(res.text) == [("error", {"message": "Lỗi nội bộ khi chạy pipeline."})]
    assert CANARY not in res.text


@pytest.mark.parametrize("patch", [
    {"llmSpec": {"provider": "openai", "model": "m"}},                                 # missing key
    {"llmSpec": {"provider": "openai", "model": "m", "apiKey": 123}},                  # wrong type
    {"llmCode": {"provider": "nope", "model": "m", "apiKey": CANARY}},                 # unknown provider
    {"llmSpec": {"provider": "openai", "model": "m", "apiKey": CANARY, "extra": 1}},   # unknown field
    {"taskId": ""},
])
def test_invalid_body_is_400_without_echoing_the_key(client, patch):
    res = client.post("/api/run", json=_body(**patch))
    assert res.status_code == 400 and res.json()["code"] == "VALIDATION_ERROR"
    assert CANARY not in res.text


def test_nothing_is_written_to_the_database(client, replies):
    client.post("/api/run", json=_body())
    with SessionLocal() as s:
        assert s.query(Run).count() == 0 and s.query(EvalRun).count() == 0


@pytest.mark.parametrize(("provider", "status", "expected"), [
    ("openai", 401, "API key bị nhà cung cấp từ chối"),
    ("anthropic", 429, "vượt giới hạn tốc độ"),
    ("openai", 500, "HTTP 500"),
])
def test_provider_errors_never_carry_the_key(monkeypatch, provider, status, expected):
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers.get("authorization") or request.headers.get("x-api-key")
        return httpx.Response(status, json={"error": {"message": f"Incorrect API key provided: {CANARY}"}})

    real = httpx.AsyncClient
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kw: real(transport=httpx.MockTransport(handler), **kw))
    with pytest.raises(llm.LlmError) as info:
        asyncio.run(llm.complete(provider, "m", CANARY, "sys", "prompt"))
    assert expected in str(info.value) and CANARY not in str(info.value)
    assert seen["auth"] in (CANARY, f"Bearer {CANARY}")


def test_reads_both_provider_formats(monkeypatch):
    bodies = {"openai": {"choices": [{"message": {"content": "hi"}}]},
              "anthropic": {"content": [{"type": "text", "text": "h"}, {"type": "text", "text": "i"}]}}
    real = httpx.AsyncClient
    for provider, body in bodies.items():
        transport = httpx.MockTransport(lambda request, body=body: httpx.Response(200, json=body))
        monkeypatch.setattr(httpx, "AsyncClient", lambda transport=transport, **kw: real(transport=transport, **kw))
        assert asyncio.run(llm.complete(provider, "m", CANARY, "sys", "prompt")) == "hi"
