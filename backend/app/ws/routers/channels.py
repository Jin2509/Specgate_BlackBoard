"""Channels of a shared workspace: messages, commands, realtime stream, highlights (UC06, UC10-UC13).

FR-43: nothing here calls a model on a mention. The only model call is /summarize, run by the workspace owner
with the owner's own agent and key (BR-02, FR-55).
"""

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Literal

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.errors import ApiError
from app.config import settings
from app.ws import commands as cmd
from app.ws import context as cx
from app.ws import models as m
from app.ws import providers as pv
from app.ws import service as sv
from app.ws.deps import channel_of, current_user, db, not_found, require_member
from app.ws.routers import private_highlights as ph
from app.ws.realtime import broker, channel_topic
from app.ws.security import decrypt_key

router = APIRouter(prefix="/workspaces/{ws_id}/channels/{channel_id}", tags=["channels"])


@router.get("/messages")
def list_messages(ws_id: str, channel_id: str, after: int | None = Query(None, description="seq: chỉ lấy tin mới hơn"),
                  limit: int = Query(200, ge=1, le=500), user: m.User = Depends(current_user),
                  s: Session = Depends(db)) -> dict:
    """FR-40: senderKind human | agent (agentModel + owner) | system. `ownMessageIds`: messages that are already
    in the user's agent context (FR-23); `myHighlights`: the user's own chalk marks in this channel (FR-24)."""
    ws, _ = require_member(s, ws_id, user)
    ch = channel_of(s, ws, channel_id)
    q = select(m.Message).where(m.Message.channel_id == ch.id)
    if after is not None:
        q = q.where(m.Message.seq > after).order_by(m.Message.seq).limit(limit)
        rows = list(s.scalars(q))
    else:
        rows = list(reversed(list(s.scalars(q.order_by(m.Message.seq.desc()).limit(limit)))))
    hls = s.scalars(select(m.Highlight).where(m.Highlight.owner_id == user.id, m.Highlight.channel_id == ch.id)
                    .order_by(m.Highlight.at))
    if after is None and rows:
        # Opening the channel reads it (flow §2: the dot on the rail and on the channel name goes away).
        sv.mark_read(s, user.id, ch, rows[-1].seq)
        s.commit()
    return {
        "channel": {"id": ch.id, "name": ch.name},
        "messages": [sv.message_out(s, x) for x in rows],
        "ownMessageIds": [x.id for x in rows if sv.is_own(x, user.id)],
        "myHighlights": [sv.highlight_out(s, h) for h in hls],
        "lastSeq": rows[-1].seq if rows else after,
    }


class Read(BaseModel):
    seq: int | None = Field(None, description="seq cuối đã đọc; bỏ trống = tin mới nhất của kênh")


@router.put("/read", status_code=204)
def mark_read(ws_id: str, channel_id: str, body: Read, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    """flow §2: the open channel calls this as new messages arrive, so its dots stay off."""
    ws, _ = require_member(s, ws_id, user)
    sv.mark_read(s, user.id, channel_of(s, ws, channel_id), body.seq)
    s.commit()


class Post(BaseModel):
    text: str = Field("", max_length=20000)
    replyToId: str | None = Field(None, description="Tin đang trả lời (dùng cho /pin)")
    quoteIds: list[str] = Field(default_factory=list, max_length=10,
                                description="flow §6: highlight riêng chèn bằng \"@ Highlight của tôi\"")
    confirm: bool = Field(False, description="Gửi dù highlight đã được gửi vào kênh này")
    confirmContext: bool = Field(False, description="Gửi dù highlight được viết khi agent đọc ngữ cảnh của nhóm khác")
    pinPart: Literal["text", "card", "both"] | None = Field(
        None, description="/pin một tin có cả lời của người lẫn thẻ: ghim phần nào (flow §11)")


@router.post("/messages", status_code=201)
async def post_message(ws_id: str, channel_id: str, body: Post, user: m.User = Depends(current_user),
                       s: Session = Depends(db)) -> dict:
    """UC10. A message starting with a command runs it (BR-08: only people's messages run commands)."""
    ws, mem = require_member(s, ws_id, user)
    ch = channel_of(s, ws, channel_id)
    text = body.text.strip()
    if not text and not body.quoteIds:
        raise ApiError(400, "Tin nhắn đang trống.", "EMPTY")
    quotes = ph.load_mine(s, user, body.quoteIds) if body.quoteIds else []
    ph.check_context(s, quotes, ws, body.confirmContext)
    dup = ph.duplicates(quotes, ch)
    if dup and not body.confirm:
        raise ApiError(409, f"Bạn đã gửi highlight này vào #{ch.name} trước đó. Gửi lại lần nữa?", "ALREADY_SENT")
    reply_to = None
    if body.replyToId:
        reply_to = s.get(m.Message, body.replyToId)
        if not reply_to or reply_to.workspace_id != ws.id:
            raise not_found("Không tìm thấy tin đang trả lời.")
    if not quotes and (cmd.parse(text) or ("",))[0] == "/pin" and reply_to and cmd.pin_needs_choice(reply_to) \
            and not body.pinPart:
        # flow §11: the words of a person and the card they carry are two voices; the person who pins chooses.
        raise ApiError(409, "Tin này có cả lời của người gửi lẫn thẻ trích dẫn. Chọn phần cần ghim.", "PIN_CHOICE")

    names = [t["user"]["displayName"] for t in sv.team(s, ws)]
    msg = sv.add_message(s, ws, ch, kind="human", sender_id=user.id, text=text,
                         body=sv.to_segments(text, names) if text else [], reply_to_id=reply_to.id if reply_to else None,
                         cards=ph.quote_cards(s, user, ws, quotes) if quotes else None)
    if quotes:
        ph.record_sends(quotes, ws, ch, msg)
    # A message carrying quotes is a message, not a command.
    outcome = cmd.run(s, ws, ch, user, mem.role, msg, reply_to, pin_part=body.pinPart) if not quotes else cmd.Outcome()
    sv.mark_read(s, user.id, ch, msg.seq)
    posted = [msg] + [sv.add_message(s, ws, ch, kind="system", sender_id="system", text=t, attachment=a, cards=c)
                      for t, a, c in outcome.replies]
    s.commit()
    sv.publish(s, posted)

    if outcome.summarize:
        posted.append(await _summarize(ws.id, ch.id, user))
    return {"messages": [sv.message_out(s, x) for x in posted]}


async def _summarize(ws_id: str, ch_id: str, owner: m.User) -> m.Message:
    """FR-55: the owner's agent summarizes the channel with the owner's key; the result is posted under it."""
    with SessionLocal() as s:
        ws, ch = s.get(m.Workspace, ws_id), s.get(m.Channel, ch_id)
        key = s.get(m.ProviderKey, owner.id)
        api_key = decrypt_key(key.secret) if key else None
        if not key or api_key is None:
            msg = sv.add_message(s, ws, ch, kind="system", sender_id="system",
                                 text="Chủ workspace cần nhập API key ở workspace riêng trước khi dùng /summarize.")
            s.commit()
            sv.publish(s, [msg])
            return msg
        rows = list(reversed(list(s.scalars(select(m.Message).where(m.Message.channel_id == ch.id,
                                                                     m.Message.sender_kind != "system")
                                            .order_by(m.Message.seq.desc()).limit(300)))))
        transcript = "\n".join(f"{sv.speaker_label(s, x)}: {cx.message_words(s, x)}" for x in rows
                               if not x.text.startswith("/summarize") and not sv.is_channel_summary(x))
        target, model = pv.Target(key.provider, api_key, key.base_url), key.model
        owner_name = sv.name_of(s, owner.id, ws.id)
        # flow §12: the agent reads exactly two things, the brief and this channel's messages that every member has
        # seen. No group context of the owner (§5), no private conversation or highlight, no other channel.
        system = (f"Bạn là agent riêng của {owner_name}, chủ workspace \"{ws.name}\". Đề bài: {ws.brief}\n"
                  "Tóm tắt đoạn chat của kênh bằng tiếng Việt: các ý chính, ai đề xuất gì, điểm còn tranh luận. "
                  "Mỗi ý bắt đầu bằng tên người đưa ra ý trong ngoặc vuông, ví dụ \"[Khang] cho rằng…\"; lời của agent "
                  "do ai gửi thì ghi như \"[Claude của Lan] đề xuất…\". Không gộp ý của hai người thành một. "
                  "Chỉ dùng đoạn chat bên dưới, không thêm điều gì kênh chưa nói. Không tự chốt hay loại ý nào.")
    try:
        summary = await pv.complete(target, model, system,
                                    [{"role": "user", "content": f"Đoạn chat của #{ch.name}:\n{transcript or '(trống)'}"}])
        kind, text = "agent", summary or "(agent không trả về nội dung)"
    except pv.ProviderError as e:
        kind, text = "system", f"Không tóm tắt được: {e.message}"
    with SessionLocal() as s:
        ws, ch = s.get(m.Workspace, ws_id), s.get(m.Channel, ch_id)
        msg = sv.add_message(s, ws, ch, kind=kind, sender_id=owner.id if kind == "agent" else "system", text=text,
                             agent_model=model if kind == "agent" else None,
                             agent_provider=target.provider if kind == "agent" else None,
                             attachment={"type": "summary"} if kind == "agent" else None)
        s.commit()
        sv.publish(s, [msg])
        s.expunge(msg)
        return msg


@router.get("/stream", responses={200: {"content": {"text/event-stream": {}}}})
async def stream(ws_id: str, channel_id: str, request: Request,
                 after: int | None = Query(None, description="seq cuối đã có; gửi bù tin bị lỡ"),
                 user: m.User = Depends(current_user), s: Session = Depends(db)):
    """FR-41 / NFR-05: SSE `message` events for everyone with the channel open; `ping` every 15 s."""
    ws, _ = require_member(s, ws_id, user)
    ch = channel_of(s, ws, channel_id)
    ch_id, user_id = ch.id, user.id
    backlog = []
    if after is not None:
        backlog = [sv.message_out(s, x) for x in
                   s.scalars(select(m.Message).where(m.Message.channel_id == ch_id, m.Message.seq > after)
                             .order_by(m.Message.seq))]

    async def events() -> AsyncIterator[str]:
        q = broker.subscribe(channel_topic(ch_id))
        try:
            seen = after or 0
            for msg in backlog:
                seen = max(seen, msg["seq"])
                yield f"id: {msg['seq']}\nevent: message\ndata: {json.dumps(msg, ensure_ascii=False)}\n\n"
            yield "event: ready\ndata: {}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    ev = await asyncio.wait_for(q.get(), timeout=15)
                except asyncio.TimeoutError:
                    # Membership can be lost while connected.
                    with SessionLocal() as s2:
                        if not sv.membership_of(s2, ws_id, user_id):
                            break
                    yield "event: ping\ndata: {}\n\n"
                    continue
                msg = ev["message"]
                if msg["seq"] <= seen:
                    continue
                seen = msg["seq"]
                yield f"id: {msg['seq']}\nevent: message\ndata: {json.dumps(msg, ensure_ascii=False)}\n\n"
        finally:
            broker.unsubscribe(channel_topic(ch_id), q)

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"})


# ---------- "Highlight cho agent" (flow §10) ----------


class Segment(BaseModel):
    messageId: str
    text: str = Field(max_length=5000, description="Đoạn đã bôi đen; chỉ được thu hẹp, không được sửa chữ")
    part: int | None = Field(None, description="Chỉ số thẻ trong tin (thẻ trích dẫn, tóm tắt, số liệu); bỏ trống = nội dung tin")
    turn: int | None = Field(None, description="Thẻ tóm tắt hội thoại: chỉ số lượt hỏi đáp gốc đính kèm; bỏ trống = phần tóm tắt")


class NewHighlight(BaseModel):
    segments: list[Segment] = Field(min_length=1, max_length=20)
    label: Literal["important", "review"]
    note: str | None = Field(None, max_length=1000, description="Ghi chú của tôi, tách riêng khỏi lời người nói")


def summary_speaker(writer: str, channel: bool = False) -> str:
    """flow §6, §12: a summary is the agent relaying a whole session or channel, neither the person's stance nor the
    agent's own; whoever highlights it says so."""
    return f"Bản tóm tắt {'kênh ' if channel else ''}do {writer} viết (chưa lọc)"


def _source(s: Session, msg: m.Message, part: int | None, turn: int | None = None) -> tuple[str, dict]:
    """The words a passage must come from, and who said them (a card keeps the speaker it was posted with)."""
    if part is None:
        if msg.sender_kind == "system":
            raise ApiError(400, "Không highlight được tin của hệ thống.", "SYSTEM_MESSAGE")
        who = {"authorKind": msg.sender_kind, "authorUserId": msg.sender_id, "authorModel": msg.agent_model}
        if sv.is_channel_summary(msg):
            who |= {"speaker": summary_speaker(sv.speaker_label(s, msg), channel=True), "relayed": True}
        return msg.text, who
    cards = msg.cards or []
    if part < 0 or part >= len(cards):
        raise not_found("Không tìm thấy thẻ này trong tin.")
    card = cards[part]
    if card.get("kind") in ("stats", "task"):
        run = card.get("run", {})
        who = f"Thẻ số liệu lượt {run.get('name')}" + (" (không hợp lệ)" if run.get("validity") != "valid" else "")
        # flow §13: the line remembers its run, so a later "không hợp lệ" or newer run follows it into the context.
        return sv.card_text(card), {"authorKind": "data", "authorUserId": msg.sender_id, "speaker": who,
                                    "runId": run.get("id"), "runValidity": run.get("validity")}
    kind = "agent" if card.get("speakerKind") == "agent" else "human"
    owner = card.get("ownerId") or msg.sender_id
    if card.get("kind") == "conversation-summary":
        if turn is not None:
            turns = card.get("turns") or []
            if turn < 0 or turn >= len(turns):
                raise not_found("Không tìm thấy lượt hỏi đáp này trong thẻ.")
            t = turns[turn]
            # An attached original turn keeps its own speaker: "Lan" for the question, "Claude của Lan" for the answer.
            return t.get("text", ""), {"authorKind": "agent" if t.get("role") == "assistant" else "human",
                                       "authorUserId": owner, "authorModel": card.get("model") if t.get("role") == "assistant" else None,
                                       "speaker": t.get("speaker")}
        return sv.card_text(card), {"authorKind": kind, "authorUserId": owner, "authorModel": card.get("model"),
                                    "speaker": summary_speaker(card.get("speaker") or card.get("speakerLabel")),
                                    "relayed": True}
    return sv.card_text(card), {"authorKind": kind, "authorUserId": owner, "authorModel": card.get("model"),
                                "speaker": card.get("speakerLabel") or card.get("speaker")}


@router.post("/highlights", status_code=201)
def add_highlight(ws_id: str, channel_id: str, body: NewHighlight, user: m.User = Depends(current_user),
                  s: Session = Depends(db)) -> dict:
    """One or more passages, across consecutive messages, each with its own speaker and source message.
    The user's own messages are left out ("đã tự vào ngữ cảnh"); the rest is saved. Words are never changed: each
    passage must be a piece of its source. At most AGENT_HIGHLIGHTS_MAX per workspace; nothing is dropped silently."""
    ws, _ = require_member(s, ws_id, user)
    ch = channel_of(s, ws, channel_id)
    count = len(list(s.scalars(select(m.Highlight.id).where(m.Highlight.owner_id == user.id,
                                                            m.Highlight.workspace_id == ws.id))))
    if count >= settings.agent_highlights_max:
        raise ApiError(409, f"Bạn đã có {settings.agent_highlights_max} highlight cho agent ở workspace này. "
                            "Bỏ bớt highlight cũ rồi thêm highlight mới.", "HIGHLIGHT_LIMIT")
    kept, skipped, first_msg = [], [], None
    for seg in body.segments:
        text = " ".join(seg.text.split())
        if not text:
            continue
        msg = s.get(m.Message, seg.messageId)
        if not msg or msg.channel_id != ch.id:
            raise not_found("Không tìm thấy tin nhắn.")
        if sv.is_own(msg, user.id):
            skipped.append(msg.id)
            continue
        source, who = _source(s, msg, seg.part, seg.turn)
        if not sv.same_words(text, source):
            who_name = who.get("speaker") or sv.segment_speaker(s, ws.id, who)
            raise ApiError(400, f"Không được sửa chữ của {who_name} trong highlight: chỉ thu hẹp hoặc bỏ bớt đoạn "
                                f"(đoạn \"{text[:40]}\").", "TEXT_CHANGED")
        # flow §10: "…" where the passage was cut, "trích một phần" when cut mid-sentence; the words stay verbatim.
        kept.append({"messageId": msg.id, "channelId": ch.id, "part": seg.part, "turn": seg.turn, "text": text,
                     "at": sv.iso(msg.at), **who, **sv.excerpt(source, text)})
        first_msg = first_msg or msg
    if not kept:
        raise ApiError(400, "Tin của bạn và thẻ bạn đã gửi đã tự vào ngữ cảnh agent của bạn, không cần highlight.",
                       "OWN_MESSAGE")
    head = kept[0]
    h = m.Highlight(owner_id=user.id, workspace_id=ws.id, channel_id=ch.id, message_id=head["messageId"],
                    author_kind="agent" if head["authorKind"] == "agent" else "human", author_user_id=head["authorUserId"],
                    author_model=head.get("authorModel"), text=" … ".join(x["text"] for x in kept), label=body.label,
                    note=(body.note or "").strip() or None, segments=kept, source_at=first_msg.at)
    s.add(h)
    s.commit()
    return {**sv.highlight_out(s, h), "skippedMessageIds": skipped}
