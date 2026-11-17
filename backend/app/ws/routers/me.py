"""The signed-in user: profile, workspace rail, API key and personal agent (UC02, FR-10-FR-14, FR-19)."""

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, SecretStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.ws import models as m
from app.ws import providers as pv
from app.ws import service as sv
from app.ws.deps import current_user, db
from app.ws.routers.auth import home_path, last_shared_path, personal_workspace
from app.ws.security import encrypt_key

router = APIRouter(prefix="/me", tags=["me"])

# FR-13: shown on the key screen.
SUBSCRIPTION_NOTE = ("Gói thuê bao như ChatGPT Plus hay Claude Pro không phải API key và không dùng được ở đây. "
                     "Tạo API key ở trang dành cho nhà phát triển của nhà cung cấp; chi phí tính vào key đó.")


@router.get("")
def me(user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    personal = personal_workspace(s, user.id)
    shared = _rail(s, user)
    pending = list(s.scalars(select(m.JoinRequest).where(m.JoinRequest.user_id == user.id,
                                                         m.JoinRequest.status == "pending")))
    return {
        "user": sv.user_out(user),
        "personalWorkspaceId": personal.id if personal else None,
        "key": sv.key_out(s.get(m.ProviderKey, user.id)),
        "agent": sv.agent_out(s, user.id),
        "workspaces": shared,
        "pendingJoins": [sv.join_request_out(s, r) for r in pending],
        "home": home_path(s, user),
        "lastSharedPath": last_shared_path(s, user),
        "privateHighlights": {"total": len(list(s.scalars(select(m.PrivateHighlight.id).where(
            m.PrivateHighlight.owner_id == user.id)))), "limit": settings.private_highlights_max},
    }


def _rail(s: Session, user: m.User) -> list[dict]:
    """Shared workspaces the user is in now, each with its dots (flow §2): unread, mentioned, and for the owner the
    number of join requests waiting."""
    out = []
    for mem in s.scalars(select(m.Member).where(m.Member.user_id == user.id, m.Member.left_at.is_(None))
                         .order_by(m.Member.joined_at, m.Member.id)):
        ws = s.get(m.Workspace, mem.workspace_id)
        if ws and ws.kind == "shared":
            b = sv.workspace_badges(s, ws, mem)
            out.append({"id": ws.id, "name": ws.name, "short": sv.initial(ws.name), "role": mem.role,
                        "unread": b["unread"], "mentioned": b["mentioned"], "pendingRequests": b["pendingRequests"],
                        "channels": [{"id": cid, **v} for cid, v in b["channels"].items()]})
    return out


@router.get("/badges")
def badges(user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """flow §2: the rail polls this to keep its dots current without reloading the page."""
    return {"workspaces": _rail(s, user)}


class LastWorkspace(BaseModel):
    workspaceId: str | None


@router.put("/last-workspace", status_code=204)
def set_last_workspace(body: LastWorkspace, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    """The UI calls this when a shared workspace is opened, for "workspace dùng gần nhất"."""
    if body.workspaceId and not sv.membership_of(s, body.workspaceId, user.id):
        raise ApiError(403, "Bạn chưa là thành viên của workspace này.", "NOT_MEMBER")
    user.last_workspace_id = body.workspaceId
    s.commit()


# ---------- API key ----------


class KeyIn(BaseModel):
    provider: Literal["anthropic", "openai-compatible"]
    apiKey: SecretStr = Field(description="Chỉ ghi: không bao giờ được trả lại")
    baseUrl: str | None = Field(None, description="Chỉ với openai-compatible, ví dụ https://api.deepseek.com/v1")
    model: str | None = Field(None, description="Mô hình chọn luôn; bỏ trống thì giữ mô hình cũ nếu còn, không thì mô hình đầu")


def _verify_error(e: pv.ProviderError) -> ApiError:
    status = {"invalid-key": 400, "quota": 400, "bad-url": 400, "model": 400}.get(e.code, 502)
    return ApiError(status, e.message, f"KEY_{e.code.upper().replace('-', '_')}")


@router.get("/key")
def get_key(user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    return {"key": sv.key_out(s.get(m.ProviderKey, user.id)), "note": SUBSCRIPTION_NOTE,
            "providers": [{"id": "anthropic", "name": "Anthropic"},
                          {"id": "openai-compatible", "name": "Kiểu OpenAI (OpenAI, OpenRouter, DeepSeek, Groq, Ollama…)",
                           "needsBaseUrl": True}]}


@router.post("/key/verify")
async def verify_key(body: KeyIn, user: m.User = Depends(current_user)) -> dict:
    """FR-11: check the key with the provider and return its models. Nothing is stored."""
    try:
        base = pv.normalize_base_url(body.provider, body.baseUrl)
        models = await pv.list_models(pv.Target(body.provider, body.apiKey.get_secret_value(), base))
    except pv.ProviderError as e:
        raise _verify_error(e) from None
    return {"ok": True, "models": models, "baseUrl": base}


@router.put("/key")
async def save_key(body: KeyIn, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-11/12/14: verify, then store encrypted. A bad key is never stored; the response has only the last 4 chars."""
    raw = body.apiKey.get_secret_value().strip()
    try:
        base = pv.normalize_base_url(body.provider, body.baseUrl)
        models = await pv.list_models(pv.Target(body.provider, raw, base))
    except pv.ProviderError as e:
        raise _verify_error(e) from None

    prev = s.get(m.ProviderKey, user.id)
    if body.model:
        if body.model not in models:
            raise ApiError(400, "Mô hình này không có trong danh sách của key.", "MODEL_NOT_AVAILABLE")
        model = body.model
    else:
        model = prev.model if prev and prev.model in models else models[0]
    if prev:
        s.delete(prev)
        s.flush()
    k = m.ProviderKey(user_id=user.id, provider=body.provider, base_url=base, secret=encrypt_key(raw),
                      key_last4=raw[-4:], model=model, models=models)
    s.add(k)
    s.commit()
    return {"key": sv.key_out(k), "agent": sv.agent_out(s, user.id)}


class ModelIn(BaseModel):
    model: str


@router.patch("/key")
def choose_model(body: ModelIn, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """UC02 alt flow: change model. Messages already in channels keep the model they were sent with."""
    k = s.get(m.ProviderKey, user.id)
    if not k:
        raise ApiError(409, "Bạn chưa nhập API key.", "NO_KEY")
    if body.model not in (k.models or []):
        raise ApiError(400, "Mô hình này không có trong danh sách của key.", "MODEL_NOT_AVAILABLE")
    k.model = body.model
    s.commit()
    return {"key": sv.key_out(k), "agent": sv.agent_out(s, user.id)}


@router.delete("/key", status_code=204)
def delete_key(user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    k = s.get(m.ProviderKey, user.id)
    if k:
        s.delete(k)
        s.commit()
