""""Highlight riêng" (flow §4, §6): passages of the user's own conversations, kept in the personal workspace.

Rule of flow §6: save, review, then send. Nothing goes from a conversation straight to a channel: whatever reaches a
channel is a private highlight first, sent by its owner (here, or through "@ Highlight của tôi" in the composer).
The card in the channel is a snapshot: editing or deleting the highlight later does not change it.
"""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv
from app.ws.deps import channel_of, current_user, db, not_found, require_member

router = APIRouter(prefix="/private-highlights", tags=["private-highlights"])

COLORS = ("yellow", "green", "blue", "pink", "purple")
Color = Literal["yellow", "green", "blue", "pink", "purple"]


def _count(s: Session, user: m.User) -> int:
    return len(list(s.scalars(select(m.PrivateHighlight.id).where(m.PrivateHighlight.owner_id == user.id))))


def check_room(s: Session, user: m.User) -> None:
    if _count(s, user) >= settings.private_highlights_max:
        raise ApiError(409, f"Bạn đã có {settings.private_highlights_max} highlight riêng, mức tối đa. "
                            "Dùng \"Dọn dẹp\" để xóa bớt rồi lưu tiếp.", "HIGHLIGHT_LIMIT")


def _own(s: Session, user: m.User, hid: str) -> m.PrivateHighlight:
    h = s.get(m.PrivateHighlight, hid)
    if not h or h.owner_id != user.id:
        raise not_found("Không tìm thấy highlight.")
    return h


def _listing(s: Session, user: m.User, rows: list[m.PrivateHighlight]) -> dict:
    total = _count(s, user)
    limit = settings.private_highlights_max
    return {"items": [sv.private_highlight_out(s, h) for h in rows], "total": total, "limit": limit,
            # flow §4: remind to clean up before the list is full.
            "nearLimit": total >= int(limit * 0.9)}


@router.get("")
def list_private(color: Color | None = None, conversationId: str | None = None,
                 kind: Literal["passage", "summary", "digest"] | None = None, sent: bool | None = None,
                 q: str | None = Query(None, description="Tìm theo chữ"),
                 user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """Newest first; filter by colour, conversation, kind, sent or not, or text."""
    query = select(m.PrivateHighlight).where(m.PrivateHighlight.owner_id == user.id)
    if color:
        query = query.where(m.PrivateHighlight.color == color)
    if conversationId:
        query = query.where(m.PrivateHighlight.conversation_id == conversationId)
    if kind:
        query = query.where(m.PrivateHighlight.kind == kind)
    rows = list(s.scalars(query.order_by(m.PrivateHighlight.created_at.desc(), m.PrivateHighlight.id.desc())))
    if sent is not None:
        rows = [h for h in rows if bool(h.sends) == sent]
    if q and q.strip():
        needle = q.strip().casefold()
        rows = [h for h in rows if needle in h.text.casefold() or needle in (h.note or "").casefold()]
    return _listing(s, user, rows)


class NewPrivate(BaseModel):
    conversationId: str
    turnId: str
    text: str = Field(max_length=20000)
    color: Color = "yellow"
    note: str | None = Field(None, max_length=500)


@router.post("", status_code=201)
def create_private(body: NewPrivate, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """The selected passage of an answer (or of the user's own question). Stored verbatim with the model name of
    that moment, so it stays "Claude của Lan" after the user switches to another model."""
    conv = s.get(m.Conversation, body.conversationId)
    if not conv or conv.owner_id != user.id:
        raise not_found("Không tìm thấy hội thoại.")
    turn = s.get(m.Turn, body.turnId)
    if not turn or turn.conversation_id != conv.id or turn.error:
        raise not_found("Không tìm thấy lượt này trong hội thoại.")
    text = body.text.strip()
    if not text:
        raise ApiError(400, "Đoạn được chọn đang trống.", "EMPTY")
    if not sv.same_words(text, turn.text):
        raise ApiError(400, "Đoạn được chọn không có trong lượt này.", "NOT_IN_TURN")
    check_room(s, user)
    h = m.PrivateHighlight(owner_id=user.id, kind="passage", conversation_id=conv.id, conversation_title=conv.title,
                           turn_id=turn.id, speaker_kind="agent" if turn.role == "assistant" else "human",
                           model=turn.model, original_text=text, text=text, source_text=turn.text, color=body.color,
                           note=(body.note or "").strip() or None,
                           # flow §6: the group context the agent was reading when it wrote these words.
                           context_workspace_ids=[turn.context_workspace_id] if turn.context_workspace_id else None)
    s.add(h)
    s.commit()
    return sv.private_highlight_out(s, h)


class SaveDigest(BaseModel):
    workspaceId: str


@router.post("/from-digest", status_code=201)
def save_digest(body: SaveDigest, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """flow §5: "Tóm tắt tin cũ của tôi" stays private; to share it, the user saves it here and sends it like any other."""
    d = s.scalar(select(m.ContextDigest).where(m.ContextDigest.user_id == user.id,
                                               m.ContextDigest.workspace_id == body.workspaceId))
    if not d:
        raise not_found("Chưa có bản tóm tắt tin cũ cho workspace này.")
    check_room(s, user)
    ws = s.get(m.Workspace, body.workspaceId)
    h = m.PrivateHighlight(owner_id=user.id, kind="digest", conversation_title=f"Tin cũ của tôi ở {ws.name if ws else ''}",
                           speaker_kind="agent", model=d.model, original_text=d.text, text=d.text, color="blue",
                           workspace_id=body.workspaceId, context_workspace_ids=[body.workspaceId])
    s.add(h)
    s.commit()
    return sv.private_highlight_out(s, h)


class PatchPrivate(BaseModel):
    text: str | None = Field(None, max_length=20000)
    color: Color | None = None
    note: str | None = Field(None, max_length=500)
    attachedTurnIds: list[str] | None = Field(None, description="Bản tóm tắt: các lượt hỏi đáp gốc đính kèm")


@router.patch("/{hid}")
def patch_private(hid: str, body: PatchPrivate, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    h = _own(s, user, hid)
    fields = body.model_fields_set
    if "text" in fields and body.text is not None:
        if not body.text.strip():
            raise ApiError(400, "Nội dung highlight không được trống.", "EMPTY")
        h.text = body.text.strip()
    if "color" in fields and body.color:
        h.color = body.color
    if "note" in fields:
        h.note = (body.note or "").strip() or None
    if "attachedTurnIds" in fields and body.attachedTurnIds is not None:
        if h.kind != "summary":
            raise ApiError(400, "Chỉ bản tóm tắt mới đính kèm được lượt hỏi đáp.", "VALIDATION_ERROR")
        if len(body.attachedTurnIds) > settings.summary_attached_turns_max:
            raise ApiError(400, f"Đính kèm tối đa {settings.summary_attached_turns_max} lượt.", "TOO_MANY_TURNS")
        attached = []
        for tid in body.attachedTurnIds:
            t = s.get(m.Turn, tid)
            if not t or t.conversation_id != h.conversation_id or t.error:
                raise not_found("Không tìm thấy lượt này trong hội thoại của bản tóm tắt.")
            attached.append({"id": t.id, "role": t.role, "text": t.text, "model": t.model, "at": sv.iso(t.at)})
        h.attached_turns = attached
    h.updated_at = m.now()
    s.commit()
    return sv.private_highlight_out(s, h)


@router.delete("/{hid}", status_code=204)
def delete_private(hid: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    """Cards already sent from it stay in the channels."""
    s.delete(_own(s, user, hid))
    s.commit()


class Cleanup(BaseModel):
    ids: list[str] | None = None
    color: Color | None = None
    conversationId: str | None = None
    sentOnly: bool = False


@router.post("/cleanup")
def cleanup(body: Cleanup, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """"Dọn dẹp": delete many at once by ids, colour, conversation, or only those already sent. Needs a filter."""
    if not (body.ids or body.color or body.conversationId or body.sentOnly):
        raise ApiError(400, "Chọn ít nhất một điều kiện để dọn dẹp.", "VALIDATION_ERROR")
    query = select(m.PrivateHighlight).where(m.PrivateHighlight.owner_id == user.id)
    if body.ids:
        query = query.where(m.PrivateHighlight.id.in_(body.ids))
    if body.color:
        query = query.where(m.PrivateHighlight.color == body.color)
    if body.conversationId:
        query = query.where(m.PrivateHighlight.conversation_id == body.conversationId)
    rows = [h for h in s.scalars(query) if not body.sentOnly or h.sends]
    for h in rows:
        s.delete(h)
    s.commit()
    return {"deleted": len(rows), "total": _count(s, user)}


# ---------- sending to a channel ----------


def quote_cards(s: Session, user: m.User, ws: m.Workspace, hls: list[m.PrivateHighlight],
                overrides: dict[str, str] | None = None) -> list[dict]:
    """Snapshot cards, each stating whose words it holds (flow §6): "(trích một phần)" when cut mid-sentence,
    "(<tên> đã chỉnh)" when a word of the agent's was deleted in the middle, changed or added; "…" where it was cut."""
    overrides = overrides or {}
    me = sv.name_of(s, user.id, ws.id)
    cards = []
    for h in hls:
        text = (overrides.get(h.id) or h.text).strip()
        if not text:
            raise ApiError(400, "Nội dung gửi đi không được trống.", "EMPTY")
        speaker = sv.private_speaker(s, h, ws.id)
        status = sv.passage_status(h.source_text, h.original_text, text)
        if h.speaker_kind != "agent":
            status["edited"] = False
        label = sv.speaker_with_status(speaker, me, status)
        base = {"highlightId": h.id, "text": text, "speaker": speaker, "speakerLabel": label, "speakerKind": h.speaker_kind,
                "ownerId": user.id, "ownerName": me, "model": h.model, "agentName": sv.agent_name(h.model) if h.model else None,
                **status}
        if h.kind == "summary":
            cards.append({**base, "kind": "conversation-summary", "title": f"Tóm tắt hội thoại của {me}",
                          "turns": [{"role": t["role"], "text": t["text"],
                                     "speaker": sv.agent_label(s, user.id, t.get("model"), ws.id) if t["role"] == "assistant" else me}
                                    for t in h.attached_turns or []]})
        else:
            cards.append({**base, "kind": "quote", "digest": h.kind == "digest"})
    return cards


def record_sends(hls: list[m.PrivateHighlight], ws: m.Workspace, ch: m.Channel, msg: m.Message) -> None:
    for h in hls:
        h.sends = [*(h.sends or []), {"workspaceId": ws.id, "channelId": ch.id, "messageId": msg.id, "at": sv.iso(msg.at)}]


def duplicates(hls: list[m.PrivateHighlight], ch: m.Channel) -> list[str]:
    return [h.id for h in hls if any(x.get("channelId") == ch.id for x in h.sends or [])]


def check_context(s: Session, hls: list[m.PrivateHighlight], ws: m.Workspace, confirmed: bool) -> None:
    """flow §6: words written while the agent read another group's context may hold that group's information.
    Never blocked, never silent: the sender confirms."""
    others: list[str] = []
    for h in hls:
        for wid in h.context_workspace_ids or []:
            if wid != ws.id and wid not in others:
                others.append(wid)
    if others and not confirmed:
        names = ", ".join(x["name"] for x in sv.context_workspaces(s, others))
        raise ApiError(409, f"Đoạn này được viết khi agent đang đọc thông tin của nhóm {names}, và có thể chứa thông "
                            "tin của nhóm đó. Bạn vẫn muốn gửi sang nhóm này?", "OTHER_CONTEXT")


def load_mine(s: Session, user: m.User, ids: list[str]) -> list[m.PrivateHighlight]:
    out = []
    for hid in dict.fromkeys(ids):
        out.append(_own(s, user, hid))
    return out


class Send(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=10)
    workspaceId: str
    channelId: str
    text: str = Field("", max_length=20000, description="Lời của bạn đi kèm (tùy chọn)")
    overrides: dict[str, str] = Field(default_factory=dict, description="Sửa lần cuối trước khi gửi: id -> nội dung")
    confirm: bool = Field(False, description="Gửi dù đã gửi vào đúng kênh này trước đó")
    confirmContext: bool = Field(False, description="Gửi dù đoạn được viết khi agent đọc ngữ cảnh của nhóm khác")


@router.post("/send", status_code=201)
def send(body: Send, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """"Gửi vào nhóm" from the list: one message under the user's name carrying one card per highlight.
    The conversation does not need a group context. Commands in the text or cards are never run (BR-08)."""
    ws, _ = require_member(s, body.workspaceId, user)
    ch = channel_of(s, ws, body.channelId)
    hls = load_mine(s, user, body.ids)
    check_context(s, hls, ws, body.confirmContext)
    dup = duplicates(hls, ch)
    if dup and not body.confirm:
        raise ApiError(409, f"Bạn đã gửi {'highlight này' if len(dup) == 1 else f'{len(dup)} highlight này'} vào #{ch.name}. "
                            "Gửi lại lần nữa?", "ALREADY_SENT")
    text = body.text.strip()
    names = [t["user"]["displayName"] for t in sv.team(s, ws)]
    msg = sv.add_message(s, ws, ch, kind="human", sender_id=user.id, text=text,
                         body=sv.to_segments(text, names) if text else [], cards=quote_cards(s, user, ws, hls, body.overrides))
    record_sends(hls, ws, ch, msg)
    s.commit()
    sv.publish(s, [msg])
    return sv.message_out(s, msg)
