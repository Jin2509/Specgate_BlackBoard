"""Model listing of the real LLM gateway: id cleanup and dropping models that cannot chat."""

import asyncio

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
