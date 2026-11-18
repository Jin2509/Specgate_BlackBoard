"""Channel commands (UC10-UC13). A command runs only when it is the first word of a message a *person* sent
(BR-08): agent messages are posted by app/ws/routers/conversations.py and never reach this module.
Typing a name (@Lan) never calls a model (FR-43)."""

import re
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.errors import ApiError
from app.ws import board as bd
from app.ws import models as m
from app.ws import service as sv
from app.ws import tasks as tk

# Same order as the list of commands in flow §9.
HELP = [
    ("/idea <nội dung>", "Ghi một ý lên bảng (cột Đề xuất)"),
    ("/note <nội dung>", "Thêm ghi chú"),
    ("/pin", "Trả lời một tin rồi gõ /pin để đưa tin đó lên bảng"),
    ("/decide #<số> chốt|loại <lý do>", "Chốt hoặc loại một ý, bắt buộc lý do"),
    ("/summarize", "Tóm tắt kênh bằng agent và key của chủ workspace (chỉ chủ)"),
    ("/brief", "Dựng bản tổng hợp từ bảng (chỉ chủ)"),
    ("/task [@tên] <mô tả>", "Tạo một việc đứng tên bạn trên bảng phân công; chủ thêm @tên để giao việc"),
    ("/help", "Danh sách lệnh"),
]
OWNER_ONLY = {"/summarize": "tóm tắt kênh", "/brief": "dựng bản tổng hợp"}
_DECIDE = re.compile(r"^#?(\d+)\s+(chốt|chot|loại|loai)\b\s*(.*)$", re.IGNORECASE | re.DOTALL)


@dataclass
class Outcome:
    """System replies to post after the person's message; `summarize` asks the router to run the LLM step."""

    replies: list[tuple[str, dict | None, list[dict] | None]] = field(default_factory=list)
    summarize: bool = False

    def say(self, text: str, attachment: dict | None = None, cards: list[dict] | None = None) -> "Outcome":
        self.replies.append((text, attachment, cards))
        return self


def parse(text: str) -> tuple[str, str] | None:
    mt = re.match(r"^(/[a-z]+)(?:\s+(.*))?$", text.strip(), re.DOTALL)
    return (mt.group(1), (mt.group(2) or "").strip()) if mt else None


def pin_needs_choice(msg: m.Message) -> bool:
    """flow §11: a message with both a person's words and a card holds two voices; the one who pins chooses."""
    return msg.sender_kind != "system" and bool(msg.text.strip()) and bool(msg.cards)


def _card_part(s: Session, ws: m.Workspace, msg: m.Message, card: dict) -> dict:
    """One card as a part of a pinned idea: its words and its speaker, exactly as the card shows them."""
    if card.get("kind") == "conversation-summary":
        return {"speaker": f"Bản tóm tắt do {card.get('speaker') or card.get('speakerLabel')} viết (chưa lọc)",
                "text": sv.card_text(card), "kind": "agent", "byId": card.get("ownerId") or msg.sender_id,
                "model": card.get("model")}
    agent = card.get("speakerKind") == "agent"
    return {"speaker": f"{card.get('speakerLabel') or card.get('speaker')} nói", "text": sv.card_text(card),
            "kind": "agent" if agent else "human", "byId": card.get("ownerId") or msg.sender_id,
            "model": card.get("model") if agent else None}


def _pin(s: Session, ws: m.Workspace, ch: m.Channel, reply_to: m.Message, pin_part: str | None) -> m.BoardItem:
    """flow §11: words of a person, a card, or both as separate parts; never merged into one voice."""
    text_part = {"speaker": sv.speaker_label(s, reply_to), "text": reply_to.text.strip(),
                 "kind": reply_to.sender_kind, "byId": reply_to.sender_id, "model": reply_to.agent_model}
    if sv.is_channel_summary(reply_to):
        text_part["speaker"] = f"Bản tóm tắt kênh do {sv.speaker_label(s, reply_to)} viết (chưa lọc)"
    card_parts = [_card_part(s, ws, reply_to, c) for c in reply_to.cards or []]
    # A system message's text is only the caption of its card.
    has_text = bool(text_part["text"]) and reply_to.sender_kind != "system"
    choice = pin_part or ("text" if has_text and not card_parts else "card" if card_parts and not has_text else "both")
    parts = ([text_part] if has_text and choice in ("text", "both") else []) + \
            (card_parts if choice in ("card", "both") else [])
    if not parts:
        raise ApiError(400, "Tin này không có phần nào để ghim.", "EMPTY")
    common = {"channel_id": ch.id, "message_id": reply_to.id}
    if len(parts) == 1:
        p = parts[0]
        label = None if p is text_part and not sv.is_channel_summary(reply_to) else p["speaker"].removesuffix(" nói")
        return bd.add_item(s, ws, kind="idea", body=p["text"], by_kind=p["kind"] if p["kind"] != "system" else "human",
                           by_id=p["byId"], by_model=p.get("model"), author_label=label, **common)
    shown = [{"speaker": p["speaker"], "text": p["text"]} for p in parts]
    body = "\n".join(f"{p['speaker']}: \"{p['text']}\"" for p in shown)
    return bd.add_item(s, ws, kind="idea", body=body, by_kind="human", by_id=reply_to.sender_id,
                       author_label=" và ".join(dict.fromkeys(p["speaker"].removesuffix(" nói") for p in shown)),
                       parts=shown, **common)


def run(s: Session, ws: m.Workspace, ch: m.Channel, user: m.User, role: str, msg: m.Message,
        reply_to: m.Message | None, pin_part: str | None = None) -> Outcome:
    out = Outcome()
    parsed = parse(msg.text)
    if not parsed:
        return out
    cmd, arg = parsed

    if cmd == "/help":
        return out.say("Các lệnh:\n" + "\n".join(f"{u}: {d}" for u, d in HELP),
                       {"type": "help", "commands": [{"usage": u, "description": d} for u, d in HELP]})
    if cmd in OWNER_ONLY and role != "owner":
        # FR-54: refusal message with the reason.
        return out.say(f"Chỉ chủ workspace dùng được {cmd}: việc {OWNER_ONLY[cmd]} là quyền của chủ workspace.")

    try:
        if cmd in ("/idea", "/note"):
            if not arg:
                return out.say(f"Cách dùng: {cmd} <nội dung>.")
            item = bd.add_item(s, ws, kind=cmd[1:], body=arg, by_kind="human", by_id=user.id,
                               channel_id=ch.id, message_id=msg.id)
            return out.say(_receipt_text(item), _receipt(item))

        if cmd == "/pin":
            if not reply_to:
                return out.say("Trả lời một tin rồi gõ /pin để đưa tin đó lên bảng.")
            if reply_to.sender_kind == "system" and not reply_to.cards:
                return out.say("Không ghim được tin của hệ thống.")
            item = _pin(s, ws, ch, reply_to, pin_part)
            return out.say(_receipt_text(item), _receipt(item))

        if cmd == "/decide":
            mt = _DECIDE.match(arg)
            if not mt:
                return out.say("Cách dùng: /decide #<số> chốt|loại <lý do>.")
            decision = "decided" if mt.group(2).lower() in ("chốt", "chot") else "rejected"
            item = bd.decide(s, bd.item_by_number(s, ws, int(mt.group(1))), user, decision, mt.group(3))
            verb = "chốt" if decision == "decided" else "loại"
            return out.say(f"{sv.name_of(s, user.id, ws.id)} đã {verb} ý #{item.number}: {item.body}. Lý do: {item.reason}",
                           _receipt(item))

        if cmd == "/brief":
            br = bd.snapshot_brief(s, ws, user)
            return out.say("Đã dựng bản tổng hợp từ bảng ý tưởng. Mọi thành viên xem và tải được dạng Markdown.",
                           {"type": "brief", "briefId": br.id})

        if cmd == "/summarize":
            out.summarize = True
            return out

        if cmd == "/task":
            return _task(s, ws, user, arg, out)
    except ApiError as e:
        return out.say(e.error)

    return out.say(f"Không có lệnh {cmd}. Gõ /help để xem danh sách lệnh.")


def _split_assignee(s: Session, ws: m.Workspace, arg: str) -> tuple[str | None, str]:
    """"@Lan B dựng runner" -> (Lan B's id, "dựng runner"). The longest member name wins, so names with spaces
    work; an @ that names nobody stays part of the description."""
    if not arg.startswith("@"):
        return None, arg
    rest = arg[1:]
    names = sorted(((sv.base_name(s, mem.user_id, ws.id), mem.user_id)
                    for mem in s.scalars(sv.active_members(s, ws.id))), key=lambda p: -len(p[0]))
    for name, user_id in names:
        if rest.casefold().startswith(name.casefold()) and rest[len(name):len(name) + 1] in ("", " "):
            return user_id, rest[len(name):].strip()
    return None, arg


def _task(s: Session, ws: m.Workspace, user: m.User, arg: str, out: Outcome) -> Outcome:
    """flow §13: a task in your own name; the owner adds @name to assign it. Never run from an agent's words."""
    assignee_id, body = _split_assignee(s, ws, arg)
    if not body:
        return out.say("Cách dùng: /task <mô tả>. Chủ workspace gõ /task @tên <mô tả> để giao việc.")
    actor = sv.membership_of(s, ws.id, user.id)
    if assignee_id not in (None, user.id) and actor.role != "owner":
        return out.say("Chỉ chủ workspace giao việc cho người khác. Gõ /task <mô tả> để tự nhận một việc.")
    task = tk.create_task(s, ws, actor, body, assignee_id or user.id)
    return out.say(tk.created_text(s, ws, task))


def _receipt(item: m.BoardItem) -> dict:
    return {"type": "board-receipt", "itemId": item.id, "number": item.number, "kind": item.kind,
            "text": item.body, "status": item.status}


def _receipt_text(item: m.BoardItem) -> str:
    where = "cột Đề xuất" if item.kind == "idea" else "mục ghi chú"
    return f"Đã thêm #{item.number} vào {where}: {item.body}"
