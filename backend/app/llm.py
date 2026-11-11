"""Calls one LLM with the API key the user sent in the request (POST /api/run).

The key is only a function argument: it is never logged, stored or put into an error message. Errors from the
provider are mapped to fixed messages, because provider error bodies may echo (part of) the key.
"""

import httpx

from app.config import settings


class LlmError(Exception):
    """Safe to show to the user: the message never contains the key or the provider's response body."""


async def complete(provider: str, model: str, api_key: str, system: str, prompt: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout_s) as client:
            if provider == "anthropic":
                response = await client.post(
                    f"{settings.anthropic_base_url.rstrip('/')}/v1/messages",
                    headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
                    json={"model": model, "max_tokens": 1024, "system": system,
                          "messages": [{"role": "user", "content": prompt}]},
                )
            else:
                response = await client.post(
                    f"{settings.openai_base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"model": model, "messages": [{"role": "system", "content": system},
                                                       {"role": "user", "content": prompt}]},
                )
    except httpx.TimeoutException:
        raise LlmError("hết thời gian chờ nhà cung cấp mô hình") from None
    except httpx.HTTPError:
        raise LlmError("không kết nối được nhà cung cấp mô hình") from None

    if response.status_code in (401, 403):
        raise LlmError("API key bị nhà cung cấp từ chối")
    if response.status_code == 404:
        raise LlmError(f'nhà cung cấp không có mô hình "{model}"')
    if response.status_code == 429:
        raise LlmError("vượt giới hạn tốc độ hoặc hết hạn mức của API key")
    if response.status_code >= 400:
        raise LlmError(f"nhà cung cấp trả lỗi HTTP {response.status_code}")

    try:
        data = response.json()
        if provider == "anthropic":
            return "".join(part.get("text", "") for part in data["content"] if part.get("type") == "text")
        return data["choices"][0]["message"]["content"] or ""
    except (ValueError, KeyError, IndexError, TypeError):
        raise LlmError("nhà cung cấp trả về dữ liệu không đọc được") from None
