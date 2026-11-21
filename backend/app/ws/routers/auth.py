"""UC01: sign in / sign up with Google, GitHub or a one-time code sent by email (FR-01-FR-05).

Real OAuth: GET /api/auth/{provider}/start -> provider -> GET /api/auth/{provider}/callback -> cookie + redirect.
Email: POST /api/auth/email-codes (sends the code) -> POST /api/auth/email-sessions (checks it) -> cookie.
Dev/test: POST /api/auth/dev-login stands in for the provider step (enabled by AUTH_DEV_LOGIN).
"""

import re
import secrets
from typing import Literal
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.ws import email_codes
from app.ws import mailer
from app.ws import models as m
from app.ws import service as sv
from app.ws.deps import current_user, db
from app.ws.security import SESSION_COOKIE, issue_session, read_state, sign_state

router = APIRouter(prefix="/auth", tags=["auth"])

Provider = Literal["google", "github"]
GITHUB_LOGIN = re.compile(r"^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$", re.IGNORECASE)
EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def safe_next(next_: str | None) -> str | None:
    return next_ if next_ and next_.startswith("/") and not next_.startswith("//") else None


def personal_workspace(s: Session, user_id: str) -> m.Workspace | None:
    return s.scalar(select(m.Workspace).where(m.Workspace.kind == "personal", m.Workspace.owner_id == user_id))


def home_path(s: Session, user: m.User) -> str:
    """flow §2: signing in lands on the home page; the user chooses where to go (no automatic workspace)."""
    return "/"


def last_shared_path(s: Session, user: m.User) -> str | None:
    """"Vào làm việc với nhóm" on the home page opens the shared workspace used last, while still a member."""
    if user.last_workspace_id and sv.membership_of(s, user.last_workspace_id, user.id):
        ws = s.get(m.Workspace, user.last_workspace_id)
        if ws and ws.kind == "shared":
            return f"/w/{ws.id}/c/chung"
    return None


def upsert_identity(s: Session, provider: str, subject: str, login: str, display_name: str) -> tuple[m.User, bool]:
    """FR-03 / FR-04: a new identity creates the user and the personal workspace; a known one just signs in."""
    acc = s.scalar(select(m.OAuthAccount).where(m.OAuthAccount.provider == provider, m.OAuthAccount.subject == subject))
    if acc:
        return s.get(m.User, acc.user_id), False
    name = " ".join(display_name.split())[:40] or login.split("@")[0][:40]
    user = m.User(display_name=name)
    s.add(user)
    s.flush()
    s.add(m.OAuthAccount(provider=provider, subject=subject, login=login, user_id=user.id))
    s.add(m.Workspace(kind="personal", name=f"Của riêng {name}", owner_id=user.id, visibility="hidden"))
    s.flush()
    ws = personal_workspace(s, user.id)
    s.add(m.Member(workspace_id=ws.id, user_id=user.id, role="owner"))
    s.commit()
    return user, True


def set_session_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax", secure=settings.cookie_secure,
                    max_age=settings.session_ttl_days * 86400, path="/")


def after_login(s: Session, user: m.User, created: bool, provider: str, next_: str | None) -> str:
    if created:
        p = personal_workspace(s, user.id)
        return f"/w/{p.id}/chat/key?welcome={provider}"
    return next_ if next_ and next_ != "/" else home_path(s, user)


# ---------- providers ----------


def _configured(provider: str) -> bool:
    return bool(getattr(settings, f"{provider}_client_id") and getattr(settings, f"{provider}_client_secret"))


@router.get("/providers")
def providers() -> dict:
    return {"google": _configured("google"), "github": _configured("github"), "devLogin": settings.auth_dev_login,
            "email": _email_enabled()}


@router.get("/{provider}/start", response_class=RedirectResponse, status_code=302)
def start(provider: Provider, next: str | None = None, mode: Literal["login", "signup"] = "login"):
    if not _configured(provider):
        raise ApiError(501, f"Chưa cấu hình đăng nhập {provider}.", "OAUTH_NOT_CONFIGURED")
    state = sign_state({"next": safe_next(next), "mode": mode, "nonce": secrets.token_urlsafe(8), "p": provider})
    redirect_uri = f"{settings.public_api_url.rstrip('/')}{settings.api_prefix}/auth/{provider}/callback"
    if provider == "google":
        url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
            "client_id": settings.google_client_id, "redirect_uri": redirect_uri, "response_type": "code",
            "scope": "openid email profile", "state": state, "prompt": "select_account"})
    else:
        url = "https://github.com/login/oauth/authorize?" + urlencode({
            "client_id": settings.github_client_id, "redirect_uri": redirect_uri, "scope": "read:user user:email",
            "state": state, "prompt": "select_account"})
    return RedirectResponse(url, status_code=302)


def _login_redirect(error: str, next_: str | None) -> RedirectResponse:
    q = {"error": error, **({"next": next_} if next_ else {})}
    return RedirectResponse(f"{settings.frontend_url.rstrip('/')}/login?{urlencode(q)}", status_code=302)


@router.get("/{provider}/callback", response_class=RedirectResponse, status_code=302)
async def callback(provider: Provider, code: str | None = None, state: str | None = None, error: str | None = None,
                   s: Session = Depends(db)):
    st = read_state(state)
    next_ = st.get("next") if st else None
    # UC01 exception: cancelled at the provider -> back to login, no account created.
    if error or not code:
        return _login_redirect("cancelled", next_)
    if not st or st.get("p") != provider:
        return _login_redirect("oauth", None)
    try:
        subject, login, name = await _identity(provider, code)
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return _login_redirect("oauth", next_)
    user, created = upsert_identity(s, provider, subject, login, name)
    resp = RedirectResponse(settings.frontend_url.rstrip("/") + after_login(s, user, created, provider, next_), 302)
    set_session_cookie(resp, issue_session(user.id))
    return resp


async def _identity(provider: str, code: str) -> tuple[str, str, str]:
    redirect_uri = f"{settings.public_api_url.rstrip('/')}{settings.api_prefix}/auth/{provider}/callback"
    async with httpx.AsyncClient(timeout=15) as client:
        if provider == "google":
            tok = (await client.post("https://oauth2.googleapis.com/token", data={
                "code": code, "client_id": settings.google_client_id, "client_secret": settings.google_client_secret,
                "redirect_uri": redirect_uri, "grant_type": "authorization_code"})).raise_for_status().json()
            info = (await client.get("https://openidconnect.googleapis.com/v1/userinfo",
                                     headers={"Authorization": f"Bearer {tok['access_token']}"})).raise_for_status().json()
            return str(info["sub"]), info.get("email", ""), info.get("name") or info.get("email", "")
        tok = (await client.post("https://github.com/login/oauth/access_token", headers={"Accept": "application/json"}, data={
            "code": code, "client_id": settings.github_client_id, "client_secret": settings.github_client_secret,
            "redirect_uri": redirect_uri})).raise_for_status().json()
        info = (await client.get("https://api.github.com/user", headers={
            "Authorization": f"Bearer {tok['access_token']}", "Accept": "application/vnd.github+json"})).raise_for_status().json()
        return str(info["id"]), info["login"], info.get("name") or info["login"]


# ---------- email one-time code ----------

EMAIL_PROVIDER = "email"
DISPLAY_NAME_MAX = 40


def _email_enabled() -> bool:
    return mailer.is_configured() or settings.auth_dev_login


def _to_email(raw: str) -> str:
    email = raw.strip().lower()
    if not EMAIL.match(email) or len(email) > 254:
        raise ApiError(400, "Email chưa đúng dạng, ví dụ ten@gmail.com.", "INVALID_EMAIL")
    return email


class EmailCodeRequest(BaseModel):
    email: str = Field(description="Địa chỉ nhận mã đăng nhập")


@router.post("/email-codes", status_code=201)
def create_email_code(body: EmailCodeRequest, s: Session = Depends(db)) -> dict:
    """Send a 6-digit code. The answer is the same whether the address has an account, so it reveals nothing.
    Without SMTP (local development only) the code comes back as `devCode` instead of by email."""
    if not _email_enabled():
        raise ApiError(501, "Máy chủ chưa cấu hình gửi email.", "EMAIL_NOT_CONFIGURED")
    email = _to_email(body.email)
    code = email_codes.issue(s, email)
    s.commit()
    out = {"email": email, "expiresInSeconds": settings.email_code_ttl_minutes * 60,
           "resendAfterSeconds": settings.email_code_resend_seconds}
    if not mailer.is_configured():
        return {**out, "devCode": code}
    try:
        mailer.send_login_code(email, code)
    except mailer.MailError:
        raise ApiError(502, "Không gửi được email. Kiểm tra địa chỉ hoặc thử lại sau.", "EMAIL_SEND_FAILED") from None
    return out


class EmailSessionRequest(BaseModel):
    email: str
    code: str = Field(min_length=1, max_length=12)
    displayName: str | None = Field(None, description="Bắt buộc khi email chưa có tài khoản")
    next: str | None = None


@router.post("/email-sessions", status_code=201)
def create_email_session(body: EmailSessionRequest, response: Response, s: Session = Depends(db)) -> dict:
    """Check the code, then sign in, or create the account when the address is new. A new address without a
    display name answers 409 NAME_REQUIRED and keeps the code, so the user can add the name and send it again."""
    email = _to_email(body.email)
    row = email_codes.check(s, email, body.code)
    known = s.scalar(select(m.OAuthAccount).where(m.OAuthAccount.provider == EMAIL_PROVIDER,
                                                  m.OAuthAccount.subject == email))
    name = " ".join((body.displayName or "").split())
    if not known and not name:
        raise ApiError(409, "Email này chưa có tài khoản. Nhập tên hiển thị để tạo.", "NAME_REQUIRED")
    if not known and len(name) > DISPLAY_NAME_MAX:
        raise ApiError(400, "Tên hiển thị tối đa 40 ký tự.", "INVALID_NAME")
    email_codes.consume(row)
    s.commit()
    user, created = upsert_identity(s, EMAIL_PROVIDER, email, email, name)
    token = issue_session(user.id)
    set_session_cookie(response, token)
    return {"token": token, "user": sv.user_out(user), "created": created,
            "redirect": after_login(s, user, created, EMAIL_PROVIDER, safe_next(body.next))}


# ---------- dev login (the UI's mock provider form) ----------


class DevLogin(BaseModel):
    provider: Provider
    login: str = Field(description="Email Google hoặc tên GitHub")
    displayName: str | None = Field(None, description="Bắt buộc khi đăng ký tài khoản mới")
    next: str | None = None


@router.post("/dev-sessions", status_code=201)
def create_dev_session(body: DevLogin, response: Response, s: Session = Depends(db)) -> dict:
    if not settings.auth_dev_login:
        raise ApiError(404, "Không có đăng nhập giả lập trên máy chủ này.", "NOT_FOUND")
    login = body.login.strip()
    ok = GITHUB_LOGIN.match(login) if body.provider == "github" else (EMAIL.match(login) and len(login) <= 254)
    if not ok:
        msg = ("Tên GitHub chỉ gồm chữ, số và dấu gạch ngang, tối đa 39 ký tự." if body.provider == "github"
               else "Email chưa đúng dạng, ví dụ ten@gmail.com.")
        raise ApiError(400, msg, "INVALID_LOGIN")
    subject = login.lower()
    known = s.scalar(select(m.OAuthAccount).where(m.OAuthAccount.provider == body.provider, m.OAuthAccount.subject == subject))
    if not known:
        name = " ".join((body.displayName or "").split())
        if not name or len(name) > 40:
            raise ApiError(400, "Tên hiển thị không được trống và tối đa 40 ký tự.", "INVALID_NAME")
    user, created = upsert_identity(s, body.provider, subject, login, body.displayName or "")
    token = issue_session(user.id)
    set_session_cookie(response, token)
    return {"token": token, "user": sv.user_out(user), "created": created,
            "redirect": after_login(s, user, created, body.provider, safe_next(body.next))}


@router.get("/dev-accounts")
def dev_accounts(provider: Provider, s: Session = Depends(db)) -> list[dict]:
    """Dev only: the identities already registered, for the UI's mock provider screen (pick one to sign in).
    Disabled together with dev-login, so a public server never lists its users."""
    if not settings.auth_dev_login:
        raise ApiError(404, "Không có đăng nhập giả lập trên máy chủ này.", "NOT_FOUND")
    rows = s.scalars(select(m.OAuthAccount).where(m.OAuthAccount.provider == provider).order_by(m.OAuthAccount.id))
    out = []
    for acc in rows:
        user = s.get(m.User, acc.user_id)
        if user:
            out.append({"provider": acc.provider, "login": acc.login, "user": sv.user_out(user)})
    return out


@router.delete("/session", status_code=204)
def delete_session(response: Response) -> Response:
    response.delete_cookie(SESSION_COOKIE, path="/")
    response.status_code = 204
    return response


@router.get("/session")
def session(response: Response, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """identities: which Google/GitHub logins this user signs in with. `token`: a fresh 30-day token, so the session
    slides like Messenger (flow §1): every visit restarts the 30 days. The UI stores it in its cookie."""
    accounts = s.scalars(select(m.OAuthAccount).where(m.OAuthAccount.user_id == user.id))
    token = issue_session(user.id)
    set_session_cookie(response, token)
    return {"user": sv.user_out(user), "home": home_path(s, user), "token": token,
            "maxAgeSeconds": settings.session_ttl_days * 86400,
            "identities": [{"provider": a.provider, "login": a.login} for a in accounts]}
