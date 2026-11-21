"""Sends the sign-in code email over SMTP (stdlib smtplib), configured by the SMTP_* settings."""

import smtplib
import ssl
from email.message import EmailMessage

import certifi

from app.config import settings

IMPLICIT_TLS_PORT = 465
SMTP_TIMEOUT_S = 15


class MailError(Exception):
    """The SMTP server could not be reached or refused the message. Never carries the code or credentials."""


def is_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_address)


def send_login_code(address: str, code: str) -> None:
    """Send the one-time code. Raises MailError when delivery fails."""
    message = EmailMessage()
    message["Subject"] = f"Mã đăng nhập SpecGate: {code}"
    message["From"] = settings.smtp_from_address
    message["To"] = address
    message.set_content(
        f"Mã đăng nhập SpecGate của bạn là {code}.\n\n"
        f"Mã dùng được một lần trong {settings.email_code_ttl_minutes} phút. "
        "Không đưa mã này cho ai, kể cả người tự nhận là nhân viên SpecGate.\n"
        "Nếu bạn không yêu cầu mã, hãy bỏ qua email này: chưa ai vào được tài khoản của bạn.\n"
    )
    # Python from python.org on macOS ships without system CA roots, so STARTTLS to Gmail fails verification.
    context = ssl.create_default_context(cafile=certifi.where())
    try:
        if settings.smtp_port == IMPLICIT_TLS_PORT:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=SMTP_TIMEOUT_S, context=context) as smtp:
                _deliver(smtp, message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=SMTP_TIMEOUT_S) as smtp:
                smtp.starttls(context=context)
                _deliver(smtp, message)
    except (OSError, smtplib.SMTPException) as err:
        raise MailError(type(err).__name__) from None


def _deliver(smtp: smtplib.SMTP, message: EmailMessage) -> None:
    if settings.smtp_username:
        smtp.login(settings.smtp_username, settings.smtp_password)
    smtp.send_message(message)
