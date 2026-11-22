"""Personal workspace: conversations with the personal agent (UC03-UC05, FR-15-FR-19, FR-25-FR-29).

Only the owner can read a conversation, also through the API (NFR-04): another user's id answers 404.
"""

import json
from collections.abc import AsyncIterator

from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import SessionLocal
from app.errors import ApiError
from app.ws import context as cx
from app.ws import documents as dc
from app.ws import models as m
from app.ws import providers as pv
from app.ws import service as sv
from app.ws.deps import current_user, db, not_found, owned_conversation, require_member
from app.ws.security import decrypt_key

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _own(s: Session, conv_id: str, user: m.User) -> m.Conversation:
    return owned_conversation(s, conv_id, user)


def _all_turns(s: Session, conv_id: str) -> list[m.Turn]:
    """Every turn, older versions of regenerated answers included."""
    return list(s.scalars(select(m.Turn).where(m.Turn.conversation_id == conv_id).order_by(m.Turn.seq, m.Turn.at)))


def _turns(s: Session, conv_id: str) -> list[m.Turn]:
    """The conversation as shown and as the agent reads it: one version of each answer, the one on screen."""
    return [t for t in _all_turns(s, conv_id) if t.active]


def _versions(s: Session, t: m.Turn) -> list[m.Turn]:
    if not t.version_group:
        return [t]
    return list(s.scalars(select(m.Turn).where(m.Turn.version_group == t.version_group).order_by(m.Turn.at, m.Turn.seq)))


def _turn_out(s: Session, t: m.Turn, owner_id: str) -> dict:
    out = {"id": t.id, "role": t.role, "text": t.text, "at": sv.iso(t.at)}
    if t.role == "assistant" and t.version_group:
        # "‹ 1/2 ›" (flow §4): the versions of this answer, oldest first.
        ids = [v.id for v in _versions(s, t)]
        out["versions"] = ids
        out["version"] = ids.index(t.id) + 1 if t.id in ids else len(ids)
    if t.model:
        out["model"] = t.model
        # The name the agent's words carry once a highlight of them is sent ("Claude của Lan").
        out["postAs"] = sv.agent_label(s, owner_id, t.model)
    if t.error:
        out["error"] = t.error
    if t.stopped:
        out["stopped"] = True
    if t.input_tokens is not None:
        out["usage"] = {"inputTokens": t.input_tokens, "cachedInputTokens": t.cached_input_tokens or 0,
                        "cacheWriteTokens": t.cache_write_tokens or 0, "outputTokens": t.output_tokens}
    return out


def _highlights_of(s: Session, conv_id: str, owner_id: str, turn_id: str | None = None) -> list[m.PrivateHighlight]:
    q = select(m.PrivateHighlight).where(m.PrivateHighlight.owner_id == owner_id,
                                         m.PrivateHighlight.conversation_id == conv_id,
                                         m.PrivateHighlight.conversation_deleted.is_(False))
    if turn_id:
        q = q.where(m.PrivateHighlight.turn_id == turn_id)
    return list(s.scalars(q))


def _linked(s: Session, conv: m.Conversation, user: m.User) -> dict | None:
    if not conv.workspace_id:
        return None
    ws = s.get(m.Workspace, conv.workspace_id)
    if not ws:
        return None
    is_member = sv.membership_of(s, ws.id, user.id) is not None
    return {"id": ws.id, "name": ws.name, "isMember": is_member,
            "channels": [{"id": c.id, "name": c.name} for c in sv.channels(s, ws.id)] if is_member else []}


def _summary(s: Session, conv: m.Conversation, user: m.User) -> dict:
    linked = _linked(s, conv, user)
    return {"id": conv.id, "title": conv.title, "updatedAt": sv.iso(conv.updated_at), "createdAt": sv.iso(conv.created_at),
            "workspaceId": conv.workspace_id, "workspace": linked,
            # FR-15: linked conversations are marked in the list.
            "linked": bool(linked)}


def _full(s: Session, conv: m.Conversation, user: m.User) -> dict:
    hls = _highlights_of(s, conv.id, user.id)
    return {**_summary(s, conv, user), "turns": [_turn_out(s, t, user.id) for t in _turns(s, conv.id)],
            # Which version holds each turn id, so a highlight of an older version opens that version.
            "turnVersions": {t.id: t.version_group for t in _all_turns(s, conv.id) if t.version_group},
            # flow §4: private highlights painted in the conversation, and the count asked about on delete.
            "highlights": [{"id": h.id, "turnId": h.turn_id, "text": h.original_text, "color": h.color, "kind": h.kind}
                           for h in hls if h.kind == "passage"],
            "highlightCount": len(hls),
            "documents": [dc.document_out(d) for d in dc.list_documents(s, conv.id)]}


def _check_link(s: Session, workspace_id: str, user: m.User) -> str:
    ws, _ = require_member(s, workspace_id, user)   # UC04 exception: not a member -> cannot link
    return ws.id


@router.get("")
def list_conversations(user: m.User = Depends(current_user), s: Session = Depends(db)) -> list[dict]:
    rows = s.scalars(select(m.Conversation).where(m.Conversation.owner_id == user.id)
                     .order_by(m.Conversation.updated_at.desc(), m.Conversation.id))
    return [_summary(s, c, user) for c in rows]


class NewConversation(BaseModel):
    workspaceId: str | None = Field(None, description="FR-25: chọn workspace chung trước câu hỏi đầu")
    title: str | None = None


@router.post("", status_code=201)
def create_conversation(body: NewConversation | None = None, user: m.User = Depends(current_user),
                        s: Session = Depends(db)) -> dict:
    body = body or NewConversation()
    ws_id = _check_link(s, body.workspaceId, user) if body.workspaceId else None
    conv = m.Conversation(owner_id=user.id, workspace_id=ws_id, title=(body.title or "Hội thoại mới").strip()[:80])
    s.add(conv)
    s.commit()
    return _full(s, conv, user)


@router.get("/{conv_id}")
def get_conversation(conv_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    return _full(s, _own(s, conv_id, user), user)


class PatchConversation(BaseModel):
    workspaceId: str | None = Field(None, description="null = Không gắn")
    title: str | None = None


@router.patch("/{conv_id}")
def patch_conversation(conv_id: str, body: PatchConversation, user: m.User = Depends(current_user),
                       s: Session = Depends(db)) -> dict:
    """FR-25: link to at most one shared workspace the user is a member of; change or unlink any time."""
    conv = _own(s, conv_id, user)
    fields = body.model_fields_set
    if "workspaceId" in fields:
        conv.workspace_id = _check_link(s, body.workspaceId, user) if body.workspaceId else None
    if "title" in fields and body.title and body.title.strip():
        conv.title = body.title.strip()[:80]
    s.commit()
    return _full(s, conv, user)


def _drop_highlights(s: Session, hls: list[m.PrivateHighlight], keep: bool, *, conversation_gone: bool) -> None:
    """flow §4: the user chooses; the default keeps them. Kept ones note that the original is gone."""
    for h in hls:
        if not keep:
            s.delete(h)
        elif conversation_gone:
            h.conversation_deleted, h.turn_id = True, None
        else:
            h.turn_id = None


@router.delete("/{conv_id}", status_code=204)
def delete_conversation(conv_id: str, highlights: Literal["keep", "delete"] = Query("keep"),
                        user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    """Messages already sent to a channel are separate snapshots and stay. Private highlights: keep (default)
    or delete, as the user answered."""
    conv = _own(s, conv_id, user)
    _drop_highlights(s, _highlights_of(s, conv.id, user.id), highlights == "keep", conversation_gone=True)
    for t in _turns(s, conv.id):
        s.delete(t)
    for d in dc.list_documents(s, conv.id):
        s.delete(d)
    s.delete(conv)
    s.commit()


@router.get("/{conv_id}/context")
def get_context(conv_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """FR-27: exactly the group context sent with each call, plus the rendered system prompt."""
    conv = _own(s, conv_id, user)
    ctx = cx.build(s, user, conv.workspace_id) if conv.workspace_id else None
    docs = dc.list_documents(s, conv.id)
    agent = sv.agent_out(s, user.id)
    label = agent["label"] if agent else f"agent của {user.display_name}"
    return {"linked": ctx is not None, "context": ctx, "documents": [dc.document_out(d) for d in docs],
            "system": cx.render_system(user.display_name, label, ctx, documents=dc.context_rows(docs))}


@router.post("/{conv_id}/context/digest")
async def summarize_old_messages(conv_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """"Tóm tắt tin cũ" (flow §5): only when the user presses it, with their agent and key, in one call. On a
    provider error the old digest stays and the error is returned; chatting is not affected."""
    conv = _own(s, conv_id, user)
    if not conv.workspace_id:
        raise ApiError(409, "Hội thoại này chưa chọn ngữ cảnh nhóm.", "NOT_LINKED")
    require_member(s, conv.workspace_id, user)
    key, target = _agent_target(s, user)
    try:
        done = await cx.run_digest(s, user, conv.workspace_id, target, key.model)
    except pv.ProviderError as e:
        s.rollback()
        raise ApiError(502, f"Không tóm tắt được tin cũ: {e.message}", f"PROVIDER_{e.code.upper().replace('-', '_')}") from None
    return {"done": done, "context": cx.build(s, user, conv.workspace_id)}


# ---------- asking the agent ----------


class Ask(BaseModel):
    text: str = Field(min_length=1, max_length=20000)


def _history(turns: list[m.Turn]) -> list[dict]:
    """FR-16: every call carries the conversation, the newest CONVERSATION_HISTORY_TURNS_MAX turns of it (flow §4).
    Error notices are skipped; same-role runs are merged (a failed answer leaves two user turns in a row, which
    Anthropic rejects); the window never starts with an answer."""
    turns = [t for t in turns if not t.error][-settings.conversation_history_turns_max:]
    while turns and turns[0].role != "user":
        turns = turns[1:]
    out: list[dict] = []
    for t in turns:
        if t.error:
            continue
        if out and out[-1]["role"] == t.role:
            out[-1]["content"] += "\n\n" + t.text
        else:
            out.append({"role": t.role, "content": t.text})
    return out


def _title(text: str) -> str:
    line = text.strip().split("\n")[0]
    return line if len(line) <= 48 else line[:47].rstrip() + "…"


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _next_seq(s: Session, conv_id: str) -> int:
    return (s.scalar(select(func.max(m.Turn.seq)).where(m.Turn.conversation_id == conv_id)) or 0) + 1


def _save_answer(conv_id: str, owner_id: str, model: str, text: str, error: str | None, stopped: bool = False,
                 *, version_group: str | None = None, context_ws: str | None = None,
                 usage: pv.Usage | None = None) -> dict:
    usage = usage or pv.Usage()
    with SessionLocal() as s2:
        t = m.Turn(conversation_id=conv_id, seq=_next_seq(s2, conv_id), role="assistant", text=text, model=model,
                   error=error, stopped=stopped, version_group=version_group, context_workspace_id=context_ws,
                   input_tokens=usage.input_tokens, cached_input_tokens=usage.cached_input_tokens,
                   cache_write_tokens=usage.cache_write_tokens, output_tokens=usage.output_tokens)
        s2.add(t)
        conv = s2.get(m.Conversation, conv_id)
        if conv:
            conv.updated_at = m.now()
        s2.commit()
        return _turn_out(s2, t, owner_id)


def _agent_target(s: Session, user: m.User) -> tuple[m.ProviderKey, pv.Target]:
    key = s.get(m.ProviderKey, user.id)
    if not key:
        raise ApiError(409, "Bạn cần nhập API key trước khi chat.", "NO_KEY")
    api_key = decrypt_key(key.secret)
    if api_key is None:
        raise ApiError(409, "Không đọc được key đã lưu (khóa mã hóa của máy chủ đã đổi). Hãy nhập lại key.", "NO_KEY")
    return key, pv.Target(key.provider, api_key, key.base_url)


async def _answer(s: Session, conv: m.Conversation, user: m.User, user_turn: m.Turn, stream: bool, event_user: bool,
                  version_group: str | None = None):
    """Calls the agent with the conversation up to user_turn. The question is already saved, so a provider error
    or "Dừng" never loses it; what was written before a stop is kept (flow §4). Old messages are never summarized
    here: that is "Tóm tắt tin cũ", pressed by the user (flow §5)."""
    key, target = _agent_target(s, user)
    ctx = cx.build(s, user, conv.workspace_id) if conv.workspace_id else None
    documents = dc.context_rows(dc.list_documents(s, conv.id))
    system = cx.render_system_blocks(user.display_name, sv.agent_label(s, user.id, key.model), ctx, documents=documents)
    turns = [t for t in _turns(s, conv.id) if t.seq <= user_turn.seq]
    messages = _history(turns)
    model, owner_id, conv_key = key.model, user.id, conv.id
    user_out = _turn_out(s, user_turn, owner_id)
    # flow §6: the answer remembers whose group context it was written with.
    usage = pv.Usage()
    save = {"version_group": version_group, "context_ws": ctx["workspace"]["id"] if ctx else None, "usage": usage}

    if not stream:
        try:
            text = await pv.complete(target, model, system, messages, usage=usage)
        except pv.ProviderError as e:
            return {"user": user_out, "error": {"code": e.code, "message": e.message},
                    "turn": _save_answer(conv_key, owner_id, model, e.message, e.code, **save)}
        return {"user": user_out, "turn": _save_answer(conv_key, owner_id, model, text, None, **save)}

    async def events() -> AsyncIterator[str]:
        if event_user:
            yield _sse("user", {"turn": user_out, "conversationId": conv_key})
        chunks: list[str] = []
        finished = False
        try:
            async for delta in pv.stream_chat(target, model, system, messages, usage=usage):
                chunks.append(delta)
                yield _sse("delta", {"text": delta})
            finished = True
            yield _sse("done", {"turn": _save_answer(conv_key, owner_id, model, "".join(chunks).strip(), None, **save)})
        except pv.ProviderError as e:
            finished = True
            # UC03 exception: the error shows in the conversation; the question stays.
            turn = _save_answer(conv_key, owner_id, model, e.message, e.code, **save)
            yield _sse("error", {"code": e.code, "message": e.message, "turn": turn})
        finally:
            if not finished and chunks:   # "Dừng" or the connection dropped: keep what was written
                _save_answer(conv_key, owner_id, model, "".join(chunks).strip(), None, stopped=True, **save)

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"})


@router.post("/{conv_id}/turns", responses={200: {"content": {"text/event-stream": {}}}})
async def ask(conv_id: str, body: Ask, stream: bool = Query(True, description="false: trả JSON khi xong (tiện cho Swagger)"),
              user: m.User = Depends(current_user), s: Session = Depends(db)):
    """UC03. SSE events: `user` (saved question), `delta` {text}, `done` {turn}, `error` {code, message, turn}.
    The client aborting the request is "Dừng": the partial answer is saved with `stopped`."""
    conv = _own(s, conv_id, user)
    question = body.text.strip()
    if not question:
        raise ApiError(400, "Câu hỏi đang trống.", "EMPTY")
    _agent_target(s, user)
    if not _turns(s, conv.id):
        conv.title = _title(question)
    user_turn = m.Turn(conversation_id=conv.id, seq=_next_seq(s, conv.id), role="user", text=question)
    s.add(user_turn)
    conv.updated_at = m.now()
    s.commit()
    return await _answer(s, conv, user, user_turn, stream, event_user=True)


@router.post("/{conv_id}/turns/{turn_id}/regenerate", responses={200: {"content": {"text/event-stream": {}}}})
async def regenerate(conv_id: str, turn_id: str, stream: bool = Query(True), user: m.User = Depends(current_user),
                     s: Session = Depends(db)):
    """"Tạo lại" (flow §4): a new answer to the same question. The old answer is NOT deleted: it stays as a version
    ("‹ 1/2 ›"), with its private highlights still on it, so nothing is asked about them. An error notice is just
    replaced (there is nothing in it to keep)."""
    conv = _own(s, conv_id, user)
    turns = _turns(s, conv.id)
    target = next((t for t in turns if t.id == turn_id), None)
    if not target or target.role != "assistant":
        raise not_found("Không tìm thấy câu trả lời này trong hội thoại.")
    if turns[-1].id != target.id:
        raise ApiError(409, "Chỉ tạo lại được câu trả lời mới nhất.", "NOT_LATEST")
    question = next((t for t in reversed(turns) if t.seq < target.seq and t.role == "user"), None)
    if not question:
        raise ApiError(409, "Không có câu hỏi nào trước câu trả lời này.", "NO_QUESTION")
    _agent_target(s, user)
    group = target.version_group
    if target.error:
        s.delete(target)
    else:
        group = group or target.id
        target.version_group, target.active = group, False
    conv.updated_at = m.now()
    s.commit()
    return await _answer(s, conv, user, question, stream, event_user=False, version_group=group)


@router.post("/{conv_id}/turns/{turn_id}/show")
def show_version(conv_id: str, turn_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """"‹ 1/2 ›" (flow §4): show this version of an answer. The agent reads only the version on screen."""
    conv = _own(s, conv_id, user)
    t = s.get(m.Turn, turn_id)
    if not t or t.conversation_id != conv.id or t.role != "assistant":
        raise not_found("Không tìm thấy câu trả lời này trong hội thoại.")
    for v in _versions(s, t):
        v.active = v.id == t.id
    s.commit()
    return _full(s, conv, user)


# ---------- "Tóm tắt cho nhóm" (flow §6, cách thứ hai) ----------

SUMMARY_FRAME = (
    "Viết bản tóm tắt hội thoại này cho nhóm, bằng tiếng Việt, đúng bốn mục Markdown sau và không thêm mục nào:\n"
    "## Vấn đề đang xét\n## Các hướng đã thử và kết quả\n## Những điểm còn chưa chắc\n## Câu hỏi muốn nhóm trả lời\n"
    "Mỗi ý bắt buộc bắt đầu bằng người đưa ra ý trong ngoặc vuông: \"[{person}]\" cho ý của {person}, \"[{agent}]\" cho "
    "ý của agent, ví dụ \"- [{person}] muốn giữ thời gian chạy dưới 1 giờ\", \"- [{agent}] đề xuất chạy thêm 40 tác vụ\". "
    "Không trộn ý của người với ý của agent trong cùng một ý. Ngắn gọn, không bịa thêm điều hội thoại chưa nói."
)


@router.post("/{conv_id}/summary", status_code=201)
async def summarize_for_team(conv_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """The user's agent, on the user's key, writes a fixed-frame summary. It is NOT sent: it lands in the private
    highlight list as a "bản tóm tắt", to review, edit, attach turns to, and send later."""
    from app.ws.routers.private_highlights import check_room

    conv = _own(s, conv_id, user)
    turns = [t for t in _turns(s, conv.id) if not t.error]
    if not any(t.role == "assistant" for t in turns):
        raise ApiError(409, "Hội thoại chưa có câu trả lời nào để tóm tắt.", "EMPTY")
    check_room(s, user)
    key, target = _agent_target(s, user)
    person, agent = user.display_name, sv.agent_name(key.model)
    transcript = "\n\n".join(f"{person if t.role == 'user' else agent}: {t.text}" for t in turns)
    frame = SUMMARY_FRAME.format(person=person, agent=agent)
    try:
        text = await pv.complete(target, key.model, cx.BASE_SYSTEM.format(name=user.display_name,
                                                                          label=sv.agent_label(s, user.id, key.model)),
                                 [{"role": "user", "content": f"{transcript}\n\n---\n{frame}"}])
    except pv.ProviderError as e:
        raise ApiError(502, e.message, f"PROVIDER_{e.code.upper().replace('-', '_')}") from None
    ctx_ids = list(dict.fromkeys(t.context_workspace_id for t in turns if t.context_workspace_id))
    h = m.PrivateHighlight(owner_id=user.id, kind="summary", conversation_id=conv.id, conversation_title=conv.title,
                           speaker_kind="agent", model=key.model, original_text=text.strip(), text=text.strip(),
                           source_text=text.strip(), color="purple",
                           # flow §6: a summary of answers written with a group's context carries that warning too.
                           context_workspace_ids=ctx_ids or None)
    s.add(h)
    s.commit()
    return sv.private_highlight_out(s, h)
