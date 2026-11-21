"""Issues and checks one-time email sign-in codes: rate limits, expiry, attempt limits and HMAC storage."""

import hashlib
import hmac
import secrets
from datetime import timedelta

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.ws import models as m

CODE_DIGITS = 6
ONE_HOUR = timedelta(hours=1)


def _hash(email: str, code: str) -> str:
    return hmac.new(settings.secret_key.encode(), f"email-code:{email}:{code}".encode(), hashlib.sha256).hexdigest()


def _active(s: Session, email: str) -> m.EmailCode | None:
    return s.scalar(select(m.EmailCode).where(m.EmailCode.email == email, m.EmailCode.consumed_at.is_(None),
                                              m.EmailCode.expires_at > m.now())
                    .order_by(m.EmailCode.id.desc()).limit(1))


def issue(s: Session, email: str) -> str:
    """Create a new code for the address and void the older ones. Raises 429 when asked too soon or too often."""
    now = m.now()
    recent = s.scalar(select(func.count()).select_from(m.EmailCode).where(
        m.EmailCode.email == email, m.EmailCode.created_at > now - timedelta(seconds=settings.email_code_resend_seconds)))
    if recent:
        raise ApiError(429, f"Vừa gửi mã tới email này. Đợi {settings.email_code_resend_seconds} giây rồi gửi lại.",
                       "EMAIL_CODE_TOO_SOON")
    sent_last_hour = s.scalar(select(func.count()).select_from(m.EmailCode).where(
        m.EmailCode.email == email, m.EmailCode.created_at > now - ONE_HOUR))
    if sent_last_hour >= settings.email_codes_per_hour_max:
        raise ApiError(429, "Đã gửi quá nhiều mã tới email này. Thử lại sau một giờ.", "EMAIL_CODE_LIMIT")
    s.execute(update(m.EmailCode).where(m.EmailCode.email == email, m.EmailCode.consumed_at.is_(None))
              .values(consumed_at=now))
    code = f"{secrets.randbelow(10 ** CODE_DIGITS):0{CODE_DIGITS}d}"
    s.add(m.EmailCode(email=email, code_hash=_hash(email, code), created_at=now,
                      expires_at=now + timedelta(minutes=settings.email_code_ttl_minutes)))
    return code


def check(s: Session, email: str, code: str) -> m.EmailCode:
    """Return the matching active code without using it up. A wrong guess counts; too many void the code."""
    row = _active(s, email)
    if not row or row.attempt_count >= settings.email_code_attempts_max:
        raise ApiError(400, "Mã sai hoặc đã hết hạn. Gửi mã mới rồi thử lại.", "EMAIL_CODE_INVALID")
    if not hmac.compare_digest(row.code_hash, _hash(email, code.strip())):
        row.attempt_count += 1
        s.commit()
        raise ApiError(400, "Mã sai hoặc đã hết hạn. Gửi mã mới rồi thử lại.", "EMAIL_CODE_INVALID")
    return row


def consume(row: m.EmailCode) -> None:
    row.consumed_at = m.now()
