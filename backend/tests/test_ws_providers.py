"""Model listing of the real LLM gateway: id cleanup and dropping models that cannot chat."""

import asyncio
import json

import httpx

from app.config import settings
from app.ws import providers as pv

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"


def _list_with(monkeypatch, ids: list[str]) -> list[str]:
    def answer(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{"id": model} for model in ids]})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(settings, "llm_fake", False)
    monkeypatch.setattr(pv.httpx, "AsyncClient",
                        lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs))
    return asyncio.run(pv.list_models(pv.Target("openai-compatible", "test-key", GEMINI_BASE_URL)))


def test_should_strip_gemini_prefix_and_drop_non_chat_models(monkeypatch):
    ids = ["models/gemini-3.8-flash", "models/gemini-embedding-001", "models/gemini-3.8-flash-tts",
           "models/aqa", "models/gemini-3.1-flash-image", "models/gemini-pro-latest"]
    assert _list_with(monkeypatch, ids) == ["gemini-3.8-flash", "gemini-pro-latest"]


def test_should_keep_every_model_when_none_looks_like_chat(monkeypatch):
    assert _list_with(monkeypatch, ["text-embedding-3-small"]) == ["text-embedding-3-small"]


def test_should_mark_each_system_block_and_the_last_message_for_the_anthropic_cache():
    body = pv.anthropic_body("claude-sonnet-5-5", ["stable", "", "timeline"],
                             [{"role": "user", "content": "q1"}, {"role": "assistant", "content": "a1"},
                              {"role": "user", "content": "q2"}])
    assert [b["text"] for b in body["system"]] == ["stable", "timeline"]
    assert all(b["cache_control"] == pv.CACHE_MARK for b in body["system"])
    assert body["messages"][0]["content"] == "q1"
    assert body["messages"][-1]["content"] == [{"type": "text", "text": "q2", "cache_control": pv.CACHE_MARK}]


def test_should_keep_anthropic_cache_marks_within_the_limit():
    body = pv.anthropic_body("m", ["a", "b", "c", "d", "e"], [{"role": "user", "content": "q"}])
    marked = [b["text"] for b in body["system"] if "cache_control" in b]
    assert marked == ["c", "d", "e"]


def test_should_join_system_blocks_in_order_and_ask_for_usage_on_openai_style():
    body = pv.openai_body("gpt", ["stable", "timeline"], [{"role": "user", "content": "q"}])
    assert body["messages"][0] == {"role": "system", "content": "stable\n\ntimeline"}
    assert body["stream_options"] == {"include_usage": True}


def test_should_read_anthropic_usage_with_cache_counts():
    usage = pv.Usage()
    pv.read_usage("anthropic", {"type": "message_start", "message": {"usage": {
        "input_tokens": 20, "cache_read_input_tokens": 7000, "cache_creation_input_tokens": 0, "output_tokens": 1}}},
        usage)
    pv.read_usage("anthropic", {"type": "message_delta", "usage": {"output_tokens": 150}}, usage)
    assert (usage.input_tokens, usage.cached_input_tokens, usage.cache_write_tokens, usage.output_tokens) == (
        7020, 7000, 0, 150)


def test_should_read_openai_style_usage_from_the_last_chunk():
    usage = pv.Usage()
    pv.read_usage("openai-compatible", {"choices": [], "usage": {
        "prompt_tokens": 5000, "completion_tokens": 80, "prompt_tokens_details": {"cached_tokens": 4096}}}, usage)
    assert (usage.input_tokens, usage.cached_input_tokens, usage.output_tokens) == (5000, 4096, 80)


def test_should_collect_usage_while_streaming_from_anthropic(monkeypatch):
    events = [
        {"type": "message_start", "message": {"usage": {"input_tokens": 10, "cache_read_input_tokens": 90,
                                                        "cache_creation_input_tokens": 0, "output_tokens": 1}}},
        {"type": "content_block_delta", "delta": {"text": "Xin chào"}},
        {"type": "message_delta", "usage": {"output_tokens": 3}},
    ]
    sent: list[dict] = []

    def answer(request: httpx.Request) -> httpx.Response:
        sent.append(json.loads(request.content))
        return httpx.Response(200, text="".join(f"data: {json.dumps(e)}\n\n" for e in events))

    real_client = httpx.AsyncClient
    monkeypatch.setattr(settings, "llm_fake", False)
    monkeypatch.setattr(pv.httpx, "AsyncClient",
                        lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs))
    usage = pv.Usage()
    text = asyncio.run(pv.complete(pv.Target("anthropic", "test-key"), "claude-sonnet-5-5", ["stable", "timeline"],
                                   [{"role": "user", "content": "hi"}], usage=usage))
    assert text == "Xin chào"
    assert (usage.input_tokens, usage.cached_input_tokens, usage.output_tokens) == (100, 90, 3)
    assert sent[0]["system"][0]["cache_control"] == pv.CACHE_MARK
