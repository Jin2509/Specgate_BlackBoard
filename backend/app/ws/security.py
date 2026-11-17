"""Session tokens (HMAC-signed, stdlib only) and encryption of stored API keys (Fernet).

API keys are write-only (NFR-01): `encrypt_key` on save, `decrypt_key` only right before calling the provider.
Nothing here logs or returns a key.
"""

import base64
import hashlib
import hmac
import json
import time

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

SESSION_COOKIE = "sg_session"


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _sign(payload: str) -> str:
    return _b64(hmac.new(settings.secret_key.encode(), payload.encode(), hashlib.sha256).digest())


def issue_session(user_id: str) -> str:
    payload = _b64(json.dumps({"sub": user_id, "exp": int(time.time()) + settings.session_ttl_days * 86400}).encode())
    return f"{payload}.{_sign(payload)}"


def read_session(token: str | None) -> str | None:
    """User id of a valid, unexpired token; None otherwise."""
    if not token or token.count(".") != 1:
        return None
    payload, sig = token.split(".")
    if not hmac.compare_digest(sig, _sign(payload)):
        return None
    try:
        data = json.loads(_unb64(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict) or data.get("exp", 0) < time.time():
        return None
    sub = data.get("sub")
    return sub if isinstance(sub, str) else None


def sign_state(data: dict) -> str:
    """Tamper-proof OAuth `state` (carries `next` and a nonce)."""
    payload = _b64(json.dumps({**data, "exp": int(time.time()) + 600}).encode())
    return f"{payload}.{_sign(payload)}"


def read_state(token: str | None) -> dict | None:
    if not token or token.count(".") != 1:
        return None
    payload, sig = token.split(".")
    if not hmac.compare_digest(sig, _sign(payload)):
        return None
    try:
        data = json.loads(_unb64(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) and data.get("exp", 0) >= time.time() else None


def _fernet() -> Fernet:
    key = settings.key_encryption_key or _b64(hashlib.sha256(b"specgate-key:" + settings.secret_key.encode()).digest()) + "="
    return Fernet(key.encode())


def encrypt_key(api_key: str) -> bytes:
    return _fernet().encrypt(api_key.encode())


def decrypt_key(secret: bytes) -> str | None:
    try:
        return _fernet().decrypt(secret).decode()
    except InvalidToken:
        return None
