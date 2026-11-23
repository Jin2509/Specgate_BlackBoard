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


def _list_failing_with(monkeypatch, status: int, body: str, base_url: str = GEMINI_BASE_URL) -> str:
    def answer(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status, text=body)

    real_client = httpx.AsyncClient
    monkeypatch.setattr(settings, "llm_fake", False)
    monkeypatch.setattr(pv.httpx, "AsyncClient",
                        lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs))
    try:
        asyncio.run(pv.list_models(pv.Target("openai-compatible", "test-key", base_url)))
    except pv.ProviderError as err:
        return err.code
    raise AssertionError("list_models should have failed")


def test_should_report_invalid_key_when_gemini_rejects_the_key_with_400(monkeypatch):
    body = '{"error": {"code": 400, "message": "API key not valid. Please pass a valid API key.", ' \
           '"status": "INVALID_ARGUMENT"}}'
    assert _list_failing_with(monkeypatch, 400, body) == "invalid-key"


def test_should_report_bad_url_when_gemini_native_endpoint_expects_oauth(monkeypatch):
    body = '{"error": {"code": 401, "message": "Request had invalid authentication credentials. ' \
           'Expected OAuth 2 access token, login cookie or other valid authentication credential."}}'
    native_url = "https://generativelanguage.googleapis.com/v1beta"
    assert _list_failing_with(monkeypatch, 401, body, native_url) == "bad-url"


def test_should_keep_context_error_for_a_400_without_key_complaint(monkeypatch):
    body = '{"error": {"message": "This model maximum context length is 8192 tokens"}}'
    assert _list_failing_with(monkeypatch, 400, body) == "context"


def test_should_pick_the_newest_gemini_flash_instead_of_the_first_model_alphabetically():
    models = ["antigravity-preview-05-2026", "gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.8-flash",
              "gemini-3.8-flash-lite", "gemini-pro-latest"]
    assert pv.pick_default_model(models) == "gemini-3.8-flash"


def test_should_pick_the_newest_claude_sonnet_ignoring_release_dates():
    models = ["claude-haiku-5-5", "claude-sonnet-4-20250514", "claude-sonnet-4-5-20250929", "claude-sonnet-5-5"]
    assert pv.pick_default_model(models) == "claude-sonnet-5-5"


def test_should_fall_back_to_the_first_model_when_no_family_is_known():
    assert pv.pick_default_model(["llama-4-70b", "mixtral-8x7b"]) == "llama-4-70b"


def test_should_drop_agent_only_gemini_models_from_the_list(monkeypatch):
    ids = ["models/antigravity-preview-05-2026", "models/deep-research-preview-04-2026",
           "models/gemini-2.5-computer-use-preview-10-2025", "models/gemini-3.5-flash"]
    assert _list_with(monkeypatch, ids) == ["gemini-3.5-flash"]


def test_should_report_model_error_when_gemini_rejects_the_model_with_400(monkeypatch):
    body = '[{"error": {"code": 400, "message": "Developer instruction is not enabled for ' \
           'models/antigravity-preview-05-2026", "status": "INVALID_ARGUMENT"}}]'
    assert _list_failing_with(monkeypatch, 400, body) == "model"


def test_should_detect_the_address_from_the_key_prefix():
    assert pv.detect_base_url("AIzaSyExample") == pv.GEMINI_OPENAI_BASE_URL
    assert pv.detect_base_url("AQ.Example") == pv.GEMINI_OPENAI_BASE_URL
    assert pv.detect_base_url("sk-or-v1-example") == "https://openrouter.ai/api/v1"
    assert pv.detect_base_url("gsk_example") == "https://api.groq.com/openai/v1"
    assert pv.detect_base_url("sk-" + "a1" * 16) == "https://api.deepseek.com/v1"
    assert pv.detect_base_url("sk-proj-example") is None


def test_should_use_the_detected_address_when_none_is_given(monkeypatch):
    monkeypatch.setattr(settings, "llm_fake", False)
    monkeypatch.setattr(pv, "_is_private", lambda host: False)
    assert pv.normalize_base_url("openai-compatible", None, "AIzaSyExample") == pv.GEMINI_OPENAI_BASE_URL
    assert pv.normalize_base_url("openai-compatible", None, "sk-proj-example") == settings.openai_base_url


def test_should_treat_an_anthropic_key_as_anthropic():
    assert pv.infer_provider("openai-compatible", "sk-ant-api03-example") == "anthropic"
    assert pv.infer_provider("openai-compatible", "sk-proj-example") == "openai-compatible"


def test_should_pick_the_best_ranked_model_that_answers_the_probe(monkeypatch):
    def answer(request: httpx.Request) -> httpx.Response:
        model = json.loads(request.content)["model"]
        if model == "gemini-3.8-flash":
            raise httpx.ReadTimeout("overloaded", request=request)
        if model == "gemini-3.7-flash":
            return httpx.Response(503, json={"error": {"message": "high demand"}})
        return httpx.Response(200, json={"choices": []})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(settings, "llm_fake", False)
    monkeypatch.setattr(pv.httpx, "AsyncClient",
                        lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs))
    models = ["antigravity-preview-05-2026", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash",
              "gemini-3.8-flash"]
    target = pv.Target("openai-compatible", "test-key", GEMINI_BASE_URL)
    assert asyncio.run(pv.pick_working_model(target, models)) == "gemini-3.6-flash"


def test_should_rank_known_families_newest_first_then_the_rest():
    assert pv.rank_default_models(["zeta", "gemini-3.5-flash", "gemini-3.6-flash", "alpha"]) == [
        "gemini-3.6-flash", "gemini-3.5-flash", "zeta", "alpha"]


def test_should_report_invalid_key_for_a_rejected_google_auth_key(monkeypatch):
    body = '{"error": {"code": 400, "message": "Invalid Auth key.", "status": "INVALID_ARGUMENT"}}'
    assert _list_failing_with(monkeypatch, 400, body) == "invalid-key"


def test_should_halve_earlier_turns_and_keep_each_version_starting_with_a_user_turn():
    turns = [{"role": r, "content": f"{r}{i}"} for i, r in enumerate(["user", "assistant"] * 3)]
    question = {"role": "user", "content": "now"}
    versions = pv.to_shorter_histories([*turns, question])
    assert [[x["content"] for x in v] for v in versions] == [
        ["user4", "assistant5", "now"], ["now"]]


def test_should_retry_with_a_shorter_history_when_the_context_window_is_full(monkeypatch):
    sent_lengths: list[int] = []

    def answer(request: httpx.Request) -> httpx.Response:
        messages = json.loads(request.content)["messages"]
        sent_lengths.append(len(messages))
        if len(messages) > 2:
            return httpx.Response(400, json={"error": {"message": "Please reduce the length of the messages."}})
        chunk = {"choices": [{"delta": {"content": "Hộp đen là kiểm thử theo đặc tả."}}]}
        return httpx.Response(200, text=f"data: {json.dumps(chunk)}\n\ndata: [DONE]\n\n")

    real_client = httpx.AsyncClient
    monkeypatch.setattr(settings, "llm_fake", False)
    monkeypatch.setattr(pv.httpx, "AsyncClient",
                        lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs))
    history = [{"role": "user", "content": "q1"}, {"role": "assistant", "content": "a1 " * 4000},
               {"role": "user", "content": "q2"}]
    target = pv.Target("openai-compatible", "test-key", "https://api.groq.com/openai/v1")
    text = asyncio.run(pv.complete(target, "llama-3.3-70b-versatile", "system", history))
    assert text == "Hộp đen là kiểm thử theo đặc tả."
    assert sent_lengths == [4, 2]   # system + 3 turns, then system + the question


def test_should_still_report_context_when_the_question_alone_does_not_fit(monkeypatch):
    def answer(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"error": {"message": "maximum context length is 4096 tokens"}})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(settings, "llm_fake", False)
    monkeypatch.setattr(pv.httpx, "AsyncClient",
                        lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs))
    target = pv.Target("openai-compatible", "test-key", "https://api.groq.com/openai/v1")
    try:
        asyncio.run(pv.complete(target, "m", "system", [{"role": "user", "content": "q"}]))
    except pv.ProviderError as err:
        assert err.code == "context"
    else:
        raise AssertionError("complete should have failed")


def test_should_prefer_a_large_general_model_over_the_first_groq_model():
    models = ["allam-2-7b", "groq/compound", "llama-3.1-8b-instant", "llama-3.3-70b-versatile",
              "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3-32b"]
    assert pv.rank_default_models(models)[:3] == ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"]


def test_should_drop_guard_classifiers_from_the_list(monkeypatch):
    ids = ["meta-llama/llama-guard-4-12b", "meta-llama/llama-prompt-guard-2-86m", "llama-3.3-70b-versatile"]
    assert _list_with(monkeypatch, ids) == ["llama-3.3-70b-versatile"]
