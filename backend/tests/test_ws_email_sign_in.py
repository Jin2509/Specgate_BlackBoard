"""Email sign-in with a one-time code: sending, checking, rate limits, attempt limits and SMTP delivery."""

from datetime import timedelta

from sqlalchemy import update

from app.config import settings
from app.db import SessionLocal
from app.ws import mailer
from app.ws import models as m
from test_ws import SENT_CODES, api  # noqa: F401

EMAIL = "lan@example.edu"


def send_code(c, email=EMAIL):
    return c.post("/api/v1/auth/email-codes", json={"email": email})


def emailed_code(c, email=EMAIL):
    """Ask for a code and read it from the test mailbox, as the user reads it from their inbox."""
    r = send_code(c, email)
    assert r.status_code == 201, r.text
    return SENT_CODES[r.json()["email"]]


def sign_in(c, code, email=EMAIL, name=None):
    return c.post("/api/v1/auth/email-sessions", json={"email": email, "code": code, "displayName": name})


def allow_resend():
    """Move every code back past the resend wait, instead of sleeping."""
    with SessionLocal() as s:
        s.execute(update(m.EmailCode).values(created_at=m.now() - timedelta(minutes=2),
                                             expires_at=m.now() + timedelta(minutes=8)))
        s.commit()


def test_should_create_account_when_new_email_verifies_code(api):
    r = sign_in(api, emailed_code(api), name="Lan")
    assert r.status_code == 201, r.text
    assert r.json()["created"] is True
    assert r.json()["redirect"].endswith("/chat/key?welcome=email")
    session = api.get("/api/v1/auth/session", headers={"Authorization": f"Bearer {r.json()['token']}"}).json()
    assert session["identities"] == [{"provider": "email", "login": EMAIL}]


def test_should_never_return_the_code_to_the_browser(api):
    r = send_code(api)
    assert r.status_code == 201
    assert SENT_CODES[EMAIL] not in r.text and "devCode" not in r.json()


def test_should_ask_for_name_and_keep_code_when_email_is_new(api):
    code = emailed_code(api)
    r = sign_in(api, code)
    assert r.status_code == 409 and r.json()["error"]["code"] == "NAME_REQUIRED"
    assert sign_in(api, code, name="Lan").status_code == 201


def test_should_sign_in_existing_account_without_name(api):
    sign_in(api, emailed_code(api), name="Lan")
    allow_resend()
    r = sign_in(api, emailed_code(api, "  LAN@Example.edu "))
    assert r.status_code == 201, r.text
    assert r.json()["created"] is False


def test_should_reject_wrong_code_and_void_it_after_too_many_attempts(api):
    code = emailed_code(api)
    wrong = "000000" if code != "000000" else "111111"
    for _ in range(settings.email_code_attempts_max):
        r = sign_in(api, wrong, name="Lan")
        assert r.status_code == 400 and r.json()["error"]["code"] == "EMAIL_CODE_INVALID"
    assert sign_in(api, code, name="Lan").status_code == 400


def test_should_refuse_reusing_a_code(api):
    code = emailed_code(api)
    assert sign_in(api, code, name="Lan").status_code == 201
    assert sign_in(api, code).status_code == 400


def test_should_refuse_expired_code(api):
    code = emailed_code(api)
    with SessionLocal() as s:
        s.execute(update(m.EmailCode).values(created_at=m.now() - timedelta(hours=1),
                                             expires_at=m.now() - timedelta(seconds=1)))
        s.commit()
    assert sign_in(api, code, name="Lan").status_code == 400


def test_should_void_older_code_when_a_new_one_is_sent(api):
    first = emailed_code(api)
    allow_resend()
    second = emailed_code(api)
    if first != second:
        assert sign_in(api, first, name="Lan").status_code == 400
    assert sign_in(api, second, name="Lan").status_code == 201


def test_should_limit_resend_and_hourly_count(api, monkeypatch):
    assert send_code(api).status_code == 201
    r = send_code(api)
    assert r.status_code == 429 and r.json()["error"]["code"] == "EMAIL_CODE_TOO_SOON"
    monkeypatch.setattr(settings, "email_code_resend_seconds", 0)
    for _ in range(settings.email_codes_per_hour_max - 1):
        assert send_code(api).status_code == 201
    r = send_code(api)
    assert r.status_code == 429 and r.json()["error"]["code"] == "EMAIL_CODE_LIMIT"


def test_should_reject_malformed_email(api):
    r = send_code(api, "not-an-email")
    assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_EMAIL"


def test_should_store_only_a_hash_of_the_code(api):
    code = emailed_code(api)
    with SessionLocal() as s:
        row = s.query(m.EmailCode).one()
    assert code not in row.code_hash and len(row.code_hash) == 64


def test_should_report_send_failure(api, monkeypatch):
    def fail(address, code):
        raise mailer.MailError("SMTPAuthenticationError")

    monkeypatch.setattr(settings, "smtp_host", "smtp.example.test")
    monkeypatch.setattr(settings, "smtp_from_address", "noreply@example.test")
    monkeypatch.setattr(mailer, "send_login_code", fail)
    r = send_code(api)
    assert r.status_code == 502 and r.json()["error"]["code"] == "EMAIL_SEND_FAILED"


def test_should_turn_email_sign_in_off_without_smtp_even_in_development(api, monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", "")
    assert settings.auth_dev_login is True
    assert api.get("/api/v1/auth/providers").json()["email"] is False
    assert send_code(api).status_code == 501


class FakeSmtp:
    calls: list = []

    def __init__(self, host, port, timeout=None, context=None):
        FakeSmtp.calls.append(("connect", host, port))

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def starttls(self, context=None):
        FakeSmtp.calls.append(("starttls",))

    def login(self, username, password):
        FakeSmtp.calls.append(("login", username))

    def send_message(self, message):
        FakeSmtp.calls.append(("send", message["To"], message["Subject"], message.get_content()))


def test_mailer_should_use_starttls_login_and_put_code_in_message(monkeypatch):
    FakeSmtp.calls = []
    monkeypatch.setattr(mailer.smtplib, "SMTP", FakeSmtp)
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.test")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_username", "mailer")
    monkeypatch.setattr(settings, "smtp_from_address", "noreply@example.test")
    mailer.send_login_code(EMAIL, "123456")
    kinds = [call[0] for call in FakeSmtp.calls]
    assert kinds == ["connect", "starttls", "login", "send"]
    send = FakeSmtp.calls[-1]
    assert send[1] == EMAIL and "123456" in send[2] and "123456" in send[3]


def test_mailer_should_use_implicit_tls_on_port_465(monkeypatch):
    FakeSmtp.calls = []
    monkeypatch.setattr(mailer.smtplib, "SMTP_SSL", FakeSmtp)
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.test")
    monkeypatch.setattr(settings, "smtp_port", 465)
    monkeypatch.setattr(settings, "smtp_username", "")
    monkeypatch.setattr(settings, "smtp_from_address", "noreply@example.test")
    mailer.send_login_code(EMAIL, "654321")
    assert [call[0] for call in FakeSmtp.calls] == ["connect", "send"]


def test_mailer_should_verify_tls_with_certifi_roots(monkeypatch):
    FakeSmtp.calls = []
    cafiles = []
    real_context = mailer.ssl.create_default_context
    monkeypatch.setattr(mailer.ssl, "create_default_context",
                        lambda cafile=None: cafiles.append(cafile) or real_context(cafile=cafile))
    monkeypatch.setattr(mailer.smtplib, "SMTP", FakeSmtp)
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.test")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_from_address", "noreply@example.test")
    mailer.send_login_code(EMAIL, "123456")
    assert cafiles == [mailer.certifi.where()]
