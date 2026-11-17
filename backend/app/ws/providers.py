"""LLM gateway: list models (key check), stream a chat, complete once. Two adapters (Anthropic, OpenAI-style).

The API key is only a function argument: never logged, stored in plain text or put into an error message.
Provider error bodies may echo the key, so errors map to fixed Vietnamese messages (NFR-08).
With settings.llm_fake the gateway is a deterministic agent for dev and CI (no network).
"""

import asyncio
import ipaddress
import re
import json
import socket
from collections.abc import AsyncIterator
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx

from app.config import settings

PROVIDERS = ("anthropic", "openai-compatible")
FAKE_MODELS = {
    "anthropic": ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
    "openai-compatible": ["gpt-6-luna", "qwen-3.8-max", "deepseek-v4"],
}


class ProviderError(Exception):
    """`code`: invalid-key | quota | network | timeout | model | context | bad-url | provider. Message is safe to show."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code, self.message = code, message


MESSAGES = {
    "invalid-key": "Nhà cung cấp từ chối key này. Kiểm tra lại key, hoặc tạo key mới ở trang dành cho nhà phát triển.",
    "quota": "Key hợp lệ nhưng đã hết hạn mức hoặc vượt giới hạn tốc độ. Nạp thêm tiền ở nhà cung cấp, chờ một lúc hoặc dùng key khác.",
    "network": "Không kết nối được nhà cung cấp mô hình. Kiểm tra địa chỉ API và mạng rồi thử lại.",
    "timeout": "Nhà cung cấp mô hình không trả lời kịp. Thử lại sau.",
    "model": "Nhà cung cấp không có mô hình này, hoặc key không được dùng mô hình này.",
    "context": "Hội thoại quá dài so với giới hạn ngữ cảnh của mô hình. Hãy tạo hội thoại mới.",
    "bad-url": "Địa chỉ API không hợp lệ. Dùng dạng https://…/v1.",
    "provider": "Nhà cung cấp mô hình đang gặp lỗi. Thử lại sau.",
}


def fail(code: str) -> ProviderError:
    return ProviderError(code, MESSAGES[code])


@dataclass
class Target:
    provider: str
    api_key: str
    base_url: str | None = None


def normalize_base_url(provider: str, base_url: str | None) -> str | None:
    """Anthropic: None (fixed endpoint). OpenAI-style: validated http(s) URL, default OpenAI."""
    if provider == "anthropic":
        return None
    url = (base_url or "").strip().rstrip("/") or settings.openai_base_url
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise fail("bad-url")
    if not settings.allow_private_base_urls and not settings.llm_fake and _is_private(parsed.hostname):
        raise fail("bad-url")
    return url


def _is_private(host: str) -> bool:
    """Blocks SSRF to the server's own network (cloud metadata, internal services)."""
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return False   # unresolvable: the request itself will fail with "network"
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return True
    return False


def _status_error(status: int, body: str = "") -> ProviderError:
    low = body.lower()
    if status in (401, 403):
        return fail("invalid-key")
    if status in (402, 429) or "credit balance" in low or "insufficient_quota" in low:
        return fail("quota")
    if status == 404:
        return fail("model")
    if status in (400, 413) and ("context" in low or "too long" in low or "maximum" in low and "token" in low):
        return fail("context")
    return fail("provider")


def _fake_check(api_key: str) -> None:
    key = api_key.strip()
    if len(key) < 20 or any(c.isspace() for c in key):
        raise fail("invalid-key")
    if key.endswith("0000"):
        raise fail("quota")


# ---------- list models (FR-11) ----------


async def list_models(t: Target) -> list[str]:
    if settings.llm_fake:
        _fake_check(t.api_key)
        return list(FAKE_MODELS[t.provider])
    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout_s) as client:
            if t.provider == "anthropic":
                r = await client.get(
                    f"{settings.anthropic_base_url.rstrip('/')}/v1/models",
                    headers={"x-api-key": t.api_key, "anthropic-version": "2023-06-01"},
                    params={"limit": 100},
                )
            else:
                r = await client.get(f"{t.base_url}/models", headers={"Authorization": f"Bearer {t.api_key}"})
    except httpx.TimeoutException:
        raise fail("timeout") from None
    except httpx.HTTPError:
        raise fail("network") from None
    if r.status_code >= 400:
        raise _status_error(r.status_code, r.text[:2000])
    try:
        ids = [str(item["id"]) for item in r.json()["data"]]
    except (ValueError, KeyError, TypeError):
        raise fail("provider") from None
    if not ids:
        raise fail("model")
    return sorted(set(ids))


# ---------- chat ----------


def _fake_answer(model: str, system: str, messages: list[dict]) -> str:
    question = messages[-1]["content"] if messages else ""
    blocks = re.findall(r"^=== KHỐI (\d+)", question, re.MULTILINE)
    if blocks:   # "Tóm tắt tin cũ" (flow §5): one call, one summary per marked block
        return "\n".join(f"=== KHỐI {n} ===\nTóm tắt giả của khối {n}." for n in blocks)
    earlier = sum(1 for x in messages[:-1] if x["role"] == "user")
    parts = [
        f"Mình vẫn giữ {earlier} câu hỏi trước của bạn trong hội thoại này." if earlier else
        "Đây là câu hỏi đầu tiên của hội thoại."
    ]
    if "# Ngữ cảnh nhóm" in system:
        n_hl = system.count("\n- [")
        parts.append(f"Mình đã đọc ngữ cảnh nhóm ({n_hl} mục có người nói).")
    first = question.strip().split("\n")[0][:80]
    parts.append(f'Về "{first}": đây là câu trả lời của agent giả ({model}), dùng cho dev và kiểm thử.')
    return "\n\n".join(parts)


async def stream_chat(t: Target, model: str, system: str, messages: list[dict]) -> AsyncIterator[str]:
    """Yields text deltas as the provider sends them (FR-17, NFR-06). Raises ProviderError."""
    if settings.llm_fake:
        _fake_check(t.api_key)
        if messages and messages[-1]["content"].endswith("[fake-error]"):
            raise fail("quota")
        for word in _fake_answer(model, system, messages).split(" "):
            await asyncio.sleep(0)
            yield word + " "
        return
    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout_s) as client:
            if t.provider == "anthropic":
                req = client.build_request(
                    "POST", f"{settings.anthropic_base_url.rstrip('/')}/v1/messages",
                    headers={"x-api-key": t.api_key, "anthropic-version": "2023-06-01"},
                    json={"model": model, "max_tokens": settings.llm_max_tokens, "system": system,
                          "messages": messages, "stream": True},
                )
            else:
                req = client.build_request(
                    "POST", f"{t.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {t.api_key}"},
                    json={"model": model, "stream": True,
                          "messages": [{"role": "system", "content": system}, *messages]},
                )
            r = await client.send(req, stream=True)
            try:
                if r.status_code >= 400:
                    body = (await r.aread()).decode(errors="replace")[:2000]
                    raise _status_error(r.status_code, body)
                async for line in r.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if not data or data == "[DONE]":
                        continue
                    try:
                        event = json.loads(data)
                    except json.JSONDecodeError:
                        continue
                    delta = _delta(t.provider, event)
                    if delta:
                        yield delta
            finally:
                await r.aclose()
    except ProviderError:
        raise
    except httpx.TimeoutException:
        raise fail("timeout") from None
    except httpx.HTTPError:
        raise fail("network") from None


def _delta(provider: str, event: dict) -> str:
    if provider == "anthropic":
        if event.get("type") == "error":
            err = event.get("error") or {}
            raise fail("quota") if err.get("type") in ("rate_limit_error", "overloaded_error") else fail("provider")
        if event.get("type") == "content_block_delta":
            return (event.get("delta") or {}).get("text") or ""
        return ""
    try:
        return event["choices"][0]["delta"].get("content") or ""
    except (KeyError, IndexError, TypeError, AttributeError):
        return ""


async def complete(t: Target, model: str, system: str, messages: list[dict]) -> str:
    return "".join([chunk async for chunk in stream_chat(t, model, system, messages)]).strip()
