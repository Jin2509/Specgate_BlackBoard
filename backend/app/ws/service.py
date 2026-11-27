"""Shared domain logic: labels, serialization (camelCase, like web_ui/src/lib/types.ts), posting messages."""

import re
from collections.abc import Iterable
from datetime import datetime, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.ws import models as m
from app.ws.realtime import broker, channel_topic, user_topic, workspace_topic


def iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:   # SQLite drops tzinfo
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


LEFT_SUFFIX = " (đã rời)"


def base_name(s: Session, user_id: str, workspace_id: str | None = None) -> str:
    """The workspace name without any "(đã rời)": what stays reserved for the person (flow §14)."""
    if workspace_id:
        mem = member_row(s, workspace_id, user_id)
        if mem and mem.nickname:
            return mem.nickname
    u = user_by_id(s, user_id)
    return u.display_name if u else user_id


def has_left(s: Session, workspace_id: str | None, user_id: str) -> bool:
    if not workspace_id:
        return False
    mem = member_row(s, workspace_id, user_id)
    return bool(mem and mem.left_at)


def name_of(s: Session, user_id: str, workspace_id: str | None = None) -> str:
    """The person's name; inside a shared workspace their workspace name (nickname), unique there, and
    "Lan (đã rời)" once they left (flow §14): every message, card and highlight is tied to the person, not the string."""
    name = base_name(s, user_id, workspace_id)
    return name + LEFT_SUFFIX if has_left(s, workspace_id, user_id) else name


# Model id prefix -> the name people use for the agent ("Claude của Lan", "DeepSeek của Long").
_FAMILIES = (
    ("claude", "Claude"), ("deepseek", "DeepSeek"), ("chatgpt", "ChatGPT"), ("gpt", "GPT"), ("o1", "GPT"),
    ("o3", "GPT"), ("o4", "GPT"), ("qwen", "Qwen"), ("llama", "Llama"), ("gemini", "Gemini"), ("gemma", "Gemma"),
    ("mistral", "Mistral"), ("mixtral", "Mistral"), ("glm", "GLM"), ("grok", "Grok"), ("kimi", "Kimi"),
    ("phi", "Phi"),
)


def agent_name(model: str | None) -> str:
    base = (model or "").lower().rsplit("/", 1)[-1]
    for prefix, name in _FAMILIES:
        if base.startswith(prefix):
            return name
    return model or "Agent"


def agent_label(s: Session, owner_id: str, model: str | None, workspace_id: str | None = None) -> str:
    """FR-19 / flow §6: "<agent> của <tên>", e.g. "Claude của Lan". The exact model id travels next to it."""
    return f"{agent_name(model)} của {name_of(s, owner_id, workspace_id)}"


def speaker_label(s: Session, msg: m.Message) -> str:
    if msg.sender_kind == "agent":
        return agent_label(s, msg.sender_id, msg.agent_model, msg.workspace_id)
    if msg.sender_kind == "system":
        return "Hệ thống"
    return name_of(s, msg.sender_id, msg.workspace_id)


def segment_speaker(s: Session, workspace_id: str, seg: dict) -> str:
    """Speaker of one passage of a "Highlight cho agent": a card keeps the speaker it was posted with, plus
    "(đã rời)" once that person left (flow §14)."""
    if seg.get("speaker"):
        left = seg.get("authorUserId") and has_left(s, workspace_id, seg["authorUserId"])
        return seg["speaker"] + (f" · {base_name(s, seg['authorUserId'], workspace_id)}{LEFT_SUFFIX}" if left else "")
    if seg.get("authorKind") == "agent":
        return agent_label(s, seg["authorUserId"], seg.get("authorModel"), workspace_id)
    return name_of(s, seg["authorUserId"], workspace_id)


def highlight_speaker(s: Session, h: m.Highlight) -> str:
    segs = h.segments or []
    if segs:
        names = []
        for seg in segs:
            n = segment_speaker(s, h.workspace_id, seg)
            if n not in names:
                names.append(n)
        return ", ".join(names)
    if h.author_kind == "agent":
        return agent_label(s, h.author_user_id, h.author_model, h.workspace_id)
    return name_of(s, h.author_user_id, h.workspace_id)


def board_author(s: Session, item: m.BoardItem) -> str:
    """FR-51: cards from an agent's message read "<agent> của <tên>"; a pinned card keeps the speaker of the card
    (flow §11), e.g. "Claude của Lan nói (trích một phần)"."""
    if item.author_label:
        left = has_left(s, item.workspace_id, item.created_by_id)
        return item.author_label + (f" · {base_name(s, item.created_by_id, item.workspace_id)}{LEFT_SUFFIX}" if left else "")
    if item.created_by_kind == "agent":
        return agent_label(s, item.created_by_id, item.created_by_model, item.workspace_id)
    return name_of(s, item.created_by_id, item.workspace_id)


def _request_memo(s: Session, name: str) -> dict:
    """A memo that lives as long as the session, which is one request: building one response repeats the same lookups,
    and every lookup is a round trip to the database."""
    return s.info.setdefault(name, {})


def member_row(s: Session, workspace_id: str, user_id: str) -> m.Member | None:
    """The membership row whether the person is still in the workspace or left it."""
    memo = _request_memo(s, "member_rows")
    key = (workspace_id, user_id)
    if key in _request_memo(s, "absent_member_rows"):
        return None
    if key not in memo:
        mem = s.scalar(select(m.Member).where(m.Member.workspace_id == workspace_id, m.Member.user_id == user_id))
        if mem is None:
            # Not kept: the person may join later in the same request.
            return None
        memo[key] = mem
    return memo[key]


def user_by_id(s: Session, user_id: str) -> m.User | None:
    """The person, looked up once per request even when they no longer exist."""
    memo = _request_memo(s, "users")
    if user_id not in memo:
        memo[user_id] = s.get(m.User, user_id)
    return memo[user_id]


def keep_for_request(s: Session, row: object) -> None:
    """Hold a loaded row until the request ends: the session's identity map keeps rows only weakly, so a row fetched
    ahead would be dropped and fetched again by the next `s.get`."""
    _request_memo(s, "held_rows")[id(row)] = row


def is_member_row_loaded(s: Session, workspace_id: str, user_id: str) -> bool:
    return (workspace_id, user_id) in _request_memo(s, "member_rows")


def remember_members(s: Session, members: list[m.Member]) -> None:
    """Let member_row answer from rows already loaded."""
    memo = _request_memo(s, "member_rows")
    for mem in members:
        memo[(mem.workspace_id, mem.user_id)] = mem


def preload_people(s: Session, workspace_id: str, user_ids: Iterable[str]) -> None:
    """Load everyone a response names (account, membership row, sign-in hint) in one query instead of three per
    person, so the name and avatar lookups that follow are answered from memory. Only for read-only responses: a
    person marked as no member here stays so for the rest of the request."""
    users = _request_memo(s, "users")
    members = _request_memo(s, "member_rows")
    absent = _request_memo(s, "absent_member_rows")
    hints = _request_memo(s, "account_hints")
    missing = [uid for uid in dict.fromkeys(user_ids)
               if uid and (uid not in users or uid not in hints
                           or ((workspace_id, uid) not in members and (workspace_id, uid) not in absent))]
    if not missing:
        return
    first_accounts: dict[str, m.OAuthAccount] = {}
    for user, mem, account in s.execute(
            select(m.User, m.Member, m.OAuthAccount)
            .outerjoin(m.Member, and_(m.Member.user_id == m.User.id, m.Member.workspace_id == workspace_id))
            .outerjoin(m.OAuthAccount, m.OAuthAccount.user_id == m.User.id)
            .where(m.User.id.in_(missing)).order_by(m.OAuthAccount.id)):
        users[user.id] = user
        if mem is None:
            absent[(workspace_id, user.id)] = True
        else:
            members[(workspace_id, user.id)] = mem
        if account is not None:
            first_accounts.setdefault(user.id, account)
    for uid in missing:
        users.setdefault(uid, None)
        if (workspace_id, uid) not in members:
            absent[(workspace_id, uid)] = True
        # People without a sign-in account have no hint; remembering that avoids asking again for each mention.
        hints[uid] = _to_account_hint(first_accounts[uid]) if uid in first_accounts else None


def membership_of(s: Session, workspace_id: str, user_id: str) -> m.Member | None:
    """Current members only: someone who left keeps a row (for the name) but no access."""
    mem = member_row(s, workspace_id, user_id)
    return mem if mem and not mem.left_at else None


def active_members(s: Session, workspace_id: str):
    return select(m.Member).where(m.Member.workspace_id == workspace_id, m.Member.left_at.is_(None))


def initial(name: str) -> str:
    return name[:1].upper()


# Avatar colours (web_ui globals.css --avatar-0 .. --avatar-11). Unique per workspace while they last.
AVATAR_COLORS = 12


def free_color(s: Session, workspace_id: str, except_user: str | None = None) -> int:
    used = {mem.color for mem in s.scalars(active_members(s, workspace_id)) if mem.user_id != except_user}
    for i in range(AVATAR_COLORS):
        if i not in used:
            return i
    return len(used) % AVATAR_COLORS


def name_taken(s: Session, workspace_id: str, name: str, except_user: str | None = None) -> bool:
    """Workspace names are unique, ignoring case and spaces. A name stays taken after its owner left (flow §14):
    otherwise old cards reading "Claude của Lan" would point at the newcomer."""
    key = " ".join(name.split()).casefold()
    for mem in s.scalars(select(m.Member).where(m.Member.workspace_id == workspace_id)):
        if mem.user_id == except_user:
            continue
        if base_name(s, mem.user_id, workspace_id).casefold() == key:
            return True
    return False


def account_hint(s: Session, user_id: str) -> str | None:
    """Shown on hover over a name (flow §9): the GitHub login, or the Google or sign-in e-mail partly masked."""
    memo = _request_memo(s, "account_hints")
    if user_id not in memo:
        memo[user_id] = None
        memo.update(_account_hints(s, [user_id]))
    return memo.get(user_id)


def _account_hints(s: Session, user_ids: list[str]) -> dict[str, str]:
    """Hints of many people in one query: each person's first sign-in account."""
    first: dict[str, m.OAuthAccount] = {}
    for acc in s.scalars(select(m.OAuthAccount).where(m.OAuthAccount.user_id.in_(user_ids)).order_by(m.OAuthAccount.id)):
        first.setdefault(acc.user_id, acc)
    return {user_id: _to_account_hint(acc) for user_id, acc in first.items()}


def _to_account_hint(acc: m.OAuthAccount) -> str:
    if acc.provider in ("google", "email") and "@" in acc.login:
        local, domain = acc.login.split("@", 1)
        source = "Google" if acc.provider == "google" else "Email"
        return f"{source}: {local[:2]}{'•' * max(1, len(local) - 2)}@{domain}"
    return f"GitHub: {acc.login}"


# ---------- serializers ----------


def user_out(u: m.User) -> dict:
    return {"id": u.id, "displayName": u.display_name, "initial": initial(u.display_name)}


def key_out(k: m.ProviderKey | None) -> dict | None:
    """FR-14: last 4 characters only; the key itself never leaves the backend."""
    if not k:
        return None
    return {"provider": k.provider, "baseUrl": k.base_url, "keyLast4": k.key_last4, "model": k.model,
            "models": list(k.models or []), "savedAt": iso(k.saved_at)}


def agent_out(s: Session, user_id: str, workspace_id: str | None = None,
              key: m.ProviderKey | None | bool = True) -> dict | None:
    """`key`: the person's key when the caller already loaded it (None: they have none); True: look it up."""
    k = s.get(m.ProviderKey, user_id) if key is True else key
    if not k:
        return None
    name = name_of(s, user_id, workspace_id)
    return {"ownerId": user_id, "ownerName": name, "provider": k.provider, "model": k.model,
            "name": agent_name(k.model), "label": f"{agent_name(k.model)} của {name}"}


def member_user_out(s: Session, mem: m.Member) -> dict | None:
    u = user_by_id(s, mem.user_id)
    if not u:
        return None
    name = (mem.nickname or u.display_name) + (LEFT_SUFFIX if mem.left_at else "")
    out = {"id": u.id, "displayName": name, "initial": initial(name), "color": mem.color,
           "accountName": u.display_name, "account": account_hint(s, u.id)}
    if mem.left_at:
        out["left"] = True
    return out


def team(s: Session, ws: m.Workspace) -> list[dict]:
    """FR-62 / FR-44: workspace name, colour, role, team role, personal agent or null = "chưa nhập key". Never a key."""
    # One query for the whole team: members with their account, key and sign-in accounts (first one is the hint).
    joined = list(s.execute(active_members(s, ws.id).add_columns(m.User, m.ProviderKey, m.OAuthAccount)
                            .join(m.User, m.User.id == m.Member.user_id)
                            .outerjoin(m.ProviderKey, m.ProviderKey.user_id == m.Member.user_id)
                            .outerjoin(m.OAuthAccount, m.OAuthAccount.user_id == m.Member.user_id)
                            .order_by(m.Member.joined_at, m.Member.id, m.OAuthAccount.id)))
    if not joined:
        return []
    rows = list({mem.id: mem for mem, _, _, _ in joined}.values())
    remember_members(s, rows)
    _request_memo(s, "users").update({user.id: user for _, user, _, _ in joined})
    keys = {mem.user_id: key for mem, _, key, _ in joined if key is not None}
    hints = _request_memo(s, "account_hints")
    first_accounts: dict[str, m.OAuthAccount] = {}
    for mem, _, _, account in joined:
        if account is not None:
            first_accounts.setdefault(mem.user_id, account)
    for mem in rows:
        hints[mem.user_id] = _to_account_hint(first_accounts[mem.user_id]) if mem.user_id in first_accounts else None
    out = []
    for mem in rows:
        u = member_user_out(s, mem)
        if u:
            out.append({"user": u, "role": mem.role, "teamRole": mem.team_role, "needsNickname": mem.needs_nickname,
                        "agent": agent_out(s, mem.user_id, ws.id, key=keys.get(mem.user_id))})
    return out


def channels(s: Session, ws_id: str) -> list[m.Channel]:
    return list(s.scalars(select(m.Channel).where(m.Channel.workspace_id == ws_id).order_by(m.Channel.created_at, m.Channel.name)))


def workspace_out(s: Session, ws: m.Workspace, me: m.Member | None) -> dict:
    out = {
        "id": ws.id, "kind": ws.kind, "name": ws.name, "short": initial(ws.name), "brief": ws.brief,
        "visibility": ws.visibility, "ownerId": ws.owner_id, "createdAt": iso(ws.created_at),
    }
    if ws.kind == "shared" and me:
        out |= {
            "myRole": me.role,
            "myTeamRole": me.team_role,
            "myName": me.nickname or name_of(s, me.user_id),
            "needsNickname": me.needs_nickname,
            # FR-31: every member sees and copies the code.
            "joinCode": ws.join_code,
            "joinCodeAt": iso(ws.join_code_at),
            # flow §2: each channel name carries its own unread dot.
            "channels": [{"id": c.id, "name": c.name, **dot}
                         for c, dot in channels_with_unread(s, [me]).get(ws.id, [])],
            "members": team(s, ws),
        }
    return out


def preload_messages(s: Session, workspace_id: str, msgs: list[m.Message]) -> None:
    """Before serializing many messages: load the messages they reply to and everyone they name, in at most three
    queries, instead of a few per sender, card owner and reply."""
    loaded = {x.id for x in msgs}
    parent_ids = list({x.reply_to_id for x in msgs if x.reply_to_id and x.reply_to_id not in loaded})
    parents = list(s.scalars(select(m.Message).where(m.Message.id.in_(parent_ids)))) if parent_ids else []
    people: list[str] = []
    for x in [*msgs, *parents]:
        if x.sender_kind != "system":
            people.append(x.sender_id)
        people.extend(card["ownerId"] for card in x.cards or [] if card.get("ownerId"))
    preload_people(s, workspace_id, people)


def message_out(s: Session, msg: m.Message) -> dict:
    out = {
        "id": msg.id, "seq": msg.seq, "workspaceId": msg.workspace_id, "channelId": msg.channel_id,
        "senderKind": msg.sender_kind, "senderId": msg.sender_id, "senderName": speaker_label(s, msg),
        "at": iso(msg.at), "body": msg.body, "text": msg.text,
    }
    if msg.sender_kind != "system":
        # The person behind the message (for an agent message: the agent's owner), for the avatar and the byline.
        mem = member_row(s, msg.workspace_id, msg.sender_id)
        u = member_user_out(s, mem) if mem else None
        if not u:
            usr = user_by_id(s, msg.sender_id)
            u = user_out(usr) if usr else {"id": msg.sender_id, "displayName": msg.sender_id, "initial": "?"}
        out["sender"] = u
    if msg.agent_model:
        out["agentModel"] = msg.agent_model
        out["agentName"] = agent_name(msg.agent_model)
        out["agentProvider"] = msg.agent_provider
    if msg.reply_to_id:
        out["replyToId"] = msg.reply_to_id
        parent = s.get(m.Message, msg.reply_to_id)
        if parent:
            out["replyTo"] = {"id": parent.id, "speaker": speaker_label(s, parent), "text": parent.text[:140]}
    if msg.attachment:
        out["attachment"] = msg.attachment
    if msg.cards:
        out["cards"] = [card_out(s, c, msg.workspace_id) for c in msg.cards]
    return out


def card_text(card: dict) -> str:
    """The words of a card, as they are highlighted and as the owner's agent reads them."""
    if card.get("kind") in ("quote", "conversation-summary"):
        return card.get("text", "")
    return ""


def card_out(s: Session, card: dict, workspace_id: str | None = None) -> dict:
    """Cards are snapshots; a quote card names its owner as "(đã rời)" once they left (flow §14)."""
    out = dict(card)
    if card.get("ownerId") and has_left(s, workspace_id, card["ownerId"]):
        out["ownerLeft"] = True
        out["speakerLabel"] = f"{card.get('speakerLabel')} · {base_name(s, card['ownerId'], workspace_id)}{LEFT_SUFFIX}"
    return out


def segment_out(s: Session, workspace_id: str, seg: dict) -> dict:
    ch = s.get(m.Channel, seg.get("channelId"))
    return {**seg, "speaker": segment_speaker(s, workspace_id, seg), "channelName": ch.name if ch else None}


def highlight_out(s: Session, h: m.Highlight) -> dict:
    ch = s.get(m.Channel, h.channel_id)
    ws = s.get(m.Workspace, h.workspace_id)
    segs = h.segments or [{"messageId": h.message_id, "channelId": h.channel_id, "authorKind": h.author_kind,
                           "authorUserId": h.author_user_id, "authorModel": h.author_model, "text": h.text,
                           "at": iso(h.source_at or h.at)}]
    return {
        "id": h.id, "ownerId": h.owner_id, "workspaceId": h.workspace_id, "workspaceName": ws.name if ws else None,
        "channelId": h.channel_id, "channelName": ch.name if ch else None, "messageId": h.message_id,
        "author": {"kind": h.author_kind, "userId": h.author_user_id, **({"model": h.author_model} if h.author_model else {})},
        "speaker": highlight_speaker(s, h), "text": h.text, "label": h.label, "note": h.note,
        "segments": [segment_out(s, h.workspace_id, x) for x in segs],
        "sourceAt": iso(h.source_at or h.at), "at": iso(h.at),
    }


def private_speaker(s: Session, h: m.PrivateHighlight, workspace_id: str | None = None) -> str:
    """"Claude của Lan" for the agent's words, "Lan" for the user's own words; workspace name when sending."""
    if h.speaker_kind == "agent":
        return agent_label(s, h.owner_id, h.model, workspace_id)
    return name_of(s, h.owner_id, workspace_id)


def norm(text: str) -> str:
    return " ".join(text.split())


_MD = re.compile(r"(^|\n)\s*(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)|[*_`~]+|\|")


def same_words(passage: str, source: str) -> bool:
    """A highlighted passage comes from its source when its characters appear there in the same order, ignoring
    whitespace and Markdown markup (what a selection on screen loses or adds). No character can be added or changed."""
    squeeze = lambda t: "".join(plain(t).split())  # noqa: E731
    return norm(passage) in norm(source) or squeeze(passage) in squeeze(source)


def plain(text: str) -> str:
    """Words as a reader sees them once Markdown is rendered: a passage selected on screen is compared with this."""
    return norm(_MD.sub(lambda mt: mt.group(1) or " ", text))


def is_edited(original: str, text: str) -> bool:
    """Cutting is not editing (flow §6): edited when the text is not one unbroken piece of what was written.
    Deleting a word in the middle, changing or adding any word, all count as editing."""
    return not same_words(text, original)


_SENTENCE_END = ".!?…:;"


def _flat(text: str) -> str:
    """Rendered words with every whitespace run squeezed to one character: a newline if the run had one, else a
    space. Same length as its one-line form, so positions found there are valid here."""
    t = re.sub(r"[*_`~|]+", "", re.sub(r"(^|\n)\s*(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)", r"\1", text))
    return re.sub(r"\s+", lambda mt: "\n" if "\n" in mt.group(0) else " ", t).strip()


def excerpt(source: str | None, text: str) -> dict:
    """How a passage sits in the whole it was taken from (flow §6): cut at the start or end ("…" shown there), and
    cut mid-sentence ("trích một phần"). A passage made of whole sentences keeps the plain label."""
    if not source:
        return {"cutStart": False, "cutEnd": False, "partial": False}
    flat = _flat(source)
    line = flat.replace("\n", " ")
    needle = norm(_flat(text))
    i = line.find(needle) if needle else -1
    if i < 0:
        # Not found word for word (a selection across a table, say): it is a piece, assume it is cut mid-sentence.
        whole = norm(plain(text)) == norm(plain(source))
        return {"cutStart": not whole, "cutEnd": not whole, "partial": not whole}
    j = i + len(needle)
    cut_start, cut_end = i > 0, j < len(line)
    starts_clean = not cut_start or flat[i - 1] == "\n" or (i >= 2 and flat[i - 2] in _SENTENCE_END)
    ends_clean = not cut_end or needle[-1:] in _SENTENCE_END or flat[j] == "\n"
    return {"cutStart": cut_start, "cutEnd": cut_end, "partial": not (starts_clean and ends_clean)}


def passage_status(source: str | None, original: str, text: str) -> dict:
    """edited, partial, cutStart, cutEnd of a private highlight's current text (flow §6)."""
    base = source or original
    if is_edited(base, text):
        return {"edited": True, "partial": False, "cutStart": False, "cutEnd": False}
    return {"edited": False, **excerpt(base, text)}


def speaker_with_status(speaker: str, me: str, status: dict) -> str:
    """"Claude của Lan", "Claude của Lan (trích một phần)" or "Claude của Lan (Lan đã chỉnh)"."""
    if status.get("edited"):
        return f"{speaker} ({me} đã chỉnh)"
    if status.get("partial"):
        return f"{speaker} (trích một phần)"
    return speaker


def context_workspaces(s: Session, ids: list | None) -> list[dict]:
    out = []
    for wid in ids or []:
        ws = s.get(m.Workspace, wid)
        out.append({"id": wid, "name": ws.name if ws else "(workspace đã bị xóa)"})
    return out


def private_highlight_out(s: Session, h: m.PrivateHighlight) -> dict:
    sends = []
    for x in h.sends or []:
        ws, ch = s.get(m.Workspace, x.get("workspaceId")), s.get(m.Channel, x.get("channelId"))
        sends.append({**x, "workspaceName": ws.name if ws else None, "channelName": ch.name if ch else None})
    status = passage_status(h.source_text, h.original_text, h.text)
    if h.speaker_kind != "agent":
        status["edited"] = False   # the user's own words: editing them is just writing
    return {
        "id": h.id, "kind": h.kind, "conversationId": None if h.conversation_deleted else h.conversation_id,
        "conversationTitle": h.conversation_title, "conversationDeleted": h.conversation_deleted, "turnId": h.turn_id,
        "speakerKind": h.speaker_kind, "model": h.model, "speaker": private_speaker(s, h),
        "text": h.text, "originalText": h.original_text, "sourceText": h.source_text, **status,
        "color": h.color, "note": h.note, "attachedTurns": h.attached_turns or [], "sends": sends,
        "workspaceId": h.workspace_id, "contextWorkspaces": context_workspaces(s, h.context_workspace_ids),
        "createdAt": iso(h.created_at), "updatedAt": iso(h.updated_at),
    }


def is_channel_summary(msg: m.Message) -> bool:
    """/summarize output: everyone's ideas, unfiltered, so it never enters anyone's context by itself (flow §5)."""
    return msg.sender_kind == "agent" and (msg.attachment or {}).get("type") == "summary"


def is_own(msg: m.Message, user_id: str) -> bool:
    """Messages already in the user's agent context, which therefore cannot be highlighted (flow §10)."""
    return msg.sender_kind != "system" and msg.sender_id == user_id and not is_channel_summary(msg)


def board_item_out(s: Session, it: m.BoardItem) -> dict:
    out = {
        "id": it.id, "number": it.number, "kind": it.kind, "body": it.body, "status": it.status,
        "reason": it.reason, "createdBy": {"kind": it.created_by_kind, "id": it.created_by_id},
        "authorName": board_author(s, it), "at": iso(it.at),
        "source": {"channelId": it.source_channel_id, "messageId": it.source_message_id},
    }
    if it.parts:
        out["parts"] = it.parts
    if it.decided_by:
        out["decidedBy"] = {"id": it.decided_by, "at": iso(it.decided_at)}
        out["deciderName"] = name_of(s, it.decided_by, it.workspace_id)
    return out


def join_request_out(s: Session, r: m.JoinRequest) -> dict:
    u = s.get(m.User, r.user_id)
    ws = s.get(m.Workspace, r.workspace_id)
    decider = s.get(m.User, r.decided_by) if r.decided_by else None
    return {
        "id": r.id, "workspaceId": r.workspace_id, "workspaceName": ws.name if ws else None,
        # What the waiting page shows about the workspace (FR-38); no members, channels or code.
        "workspace": {"id": ws.id, "name": ws.name, "short": initial(ws.name), "brief": ws.brief,
                      "ownerName": name_of(s, ws.owner_id), "memberCount": len(team(s, ws))} if ws else None,
        "userId": r.user_id, "user": user_out(u) if u else None, "message": r.message, "status": r.status,
        "via": r.via, "code": r.code, "at": iso(r.created_at), "decidedAt": iso(r.decided_at),
        "decidedBy": r.decided_by, "deciderName": decider.display_name if decider else None,
    }


# ---------- unread dots (flow §2) ----------


# Unread messages scanned per channel for a mention of the reader, newest first.
UNREAD_SCAN_MAX = 200


def channels_with_unread(s: Session, members: list[m.Member]) -> dict[str, list[tuple[m.Channel, dict]]]:
    """Each workspace of one person's memberships, as its channels in order with {unread, mentioned}: messages of
    other people (not the system) after what they last read; before they ever opened a channel, after the moment
    they joined. One query whatever the number of workspaces and channels: every channel, joined to its newest
    unread messages."""
    if not members:
        return {}
    user_id = members[0].user_id
    workspace_ids = [mem.workspace_id for mem in members]
    remember_members(s, members)
    newest_first = func.row_number().over(partition_by=m.Message.channel_id, order_by=m.Message.seq.desc())
    unread = (select(m.Message.channel_id, m.Message.body, newest_first.label("rank"))
              .join(m.Member, and_(m.Member.workspace_id == m.Message.workspace_id, m.Member.user_id == user_id))
              .outerjoin(m.ChannelRead, and_(m.ChannelRead.channel_id == m.Message.channel_id,
                                             m.ChannelRead.user_id == user_id))
              .where(m.Message.workspace_id.in_(workspace_ids), m.Message.sender_kind != "system",
                     m.Message.sender_id != user_id,
                     or_(and_(m.ChannelRead.last_seq.is_not(None), m.Message.seq > m.ChannelRead.last_seq),
                         and_(m.ChannelRead.last_seq.is_(None), m.Message.at > m.Member.joined_at)))
              .subquery())
    rows = s.execute(select(m.Channel, unread.c.rank, unread.c.body)
                     .outerjoin(unread, and_(unread.c.channel_id == m.Channel.id, unread.c.rank <= UNREAD_SCAN_MAX))
                     .where(m.Channel.workspace_id.in_(workspace_ids))
                     .order_by(m.Channel.created_at, m.Channel.name, unread.c.rank))
    out: dict[str, list[tuple[m.Channel, dict]]] = {wid: [] for wid in workspace_ids}
    dots: dict[str, dict] = {}
    for ch, rank, body in rows:
        if ch.id not in dots:
            dots[ch.id] = {"unread": False, "mentioned": False}
            out[ch.workspace_id].append((ch, dots[ch.id]))
        if rank is None:
            continue
        dot = dots[ch.id]
        dot["unread"] = True
        if not dot["mentioned"]:
            me = base_name(s, user_id, ch.workspace_id).casefold()
            dot["mentioned"] = any(seg.get("t") == "mention" and str(seg.get("v", "")).casefold() == me
                                   for seg in body or [])
    return out


def remember_channel_read(s: Session, user_id: str, channel_id: str, read: m.ChannelRead | None) -> None:
    """Keep a read position loaded with the channel (None: never opened) for mark_read."""
    _request_memo(s, "channel_reads")[(user_id, channel_id)] = read


def mark_read(s: Session, user_id: str, ch: m.Channel, seq: int | None = None) -> None:
    top = seq if seq is not None else (s.scalar(select(func.max(m.Message.seq)).where(m.Message.channel_id == ch.id)) or 0)
    reads = _request_memo(s, "channel_reads")
    key = (user_id, ch.id)
    read = reads[key] if key in reads else s.scalar(
        select(m.ChannelRead).where(m.ChannelRead.user_id == user_id, m.ChannelRead.channel_id == ch.id))
    if read is None:
        read = m.ChannelRead(user_id=user_id, channel_id=ch.id, last_seq=top)
        s.add(read)
        reads[key] = read
    elif top > read.last_seq:
        read.last_seq = top


def workspace_badges(s: Session, members: list[m.Member], pending_by_workspace_id: dict[str, int]) -> dict[str, dict]:
    """What the rail shows next to each shared workspace of one person: a dot for unread, a stronger one for a
    mention, and for an owner the number of join requests waiting (counted by the caller with the memberships)."""
    per_workspace = channels_with_unread(s, members)
    out = {}
    for mem in members:
        per = {ch.id: dot for ch, dot in per_workspace.get(mem.workspace_id, [])}
        out[mem.workspace_id] = {"unread": any(v["unread"] for v in per.values()),
                                 "mentioned": any(v["mentioned"] for v in per.values()),
                                 "pendingRequests": pending_by_workspace_id.get(mem.workspace_id, 0)
                                 if mem.role == "owner" else 0,
                                 "channels": per}
    return out


# ---------- messages ----------

_TOKEN = re.compile(r"(^|\s)(@[^\s@/,.;:!?()\[\]]+|/[a-z]+)")


def to_segments(text: str, member_names: list[str]) -> list[dict]:
    """Same splitting as the UI mock: @mentions of members, /commands, plain text."""
    names = {n.lower() for n in member_names}
    segs: list[dict] = []
    last = 0
    for mt in _TOKEN.finditer(text):
        token, start = mt.group(2), mt.start(2)
        is_mention = token.startswith("@") and token[1:].lower() in names
        if not is_mention and not token.startswith("/"):
            continue
        if start > last:
            segs.append({"t": "text", "v": text[last:start]})
        segs.append({"t": "mention", "v": token[1:]} if is_mention else {"t": "command", "v": token})
        last = start + len(token)
    if last < len(text):
        segs.append({"t": "text", "v": text[last:]})
    return segs


def next_message_seq(s: Session) -> int:
    return (s.scalar(select(func.max(m.Message.seq))) or 0) + 1


def add_message(s: Session, ws: m.Workspace, ch: m.Channel, *, kind: str, sender_id: str, text: str,
                body: list[dict] | None = None, agent_model: str | None = None, agent_provider: str | None = None,
                reply_to_id: str | None = None, attachment: dict | None = None, cards: list[dict] | None = None) -> m.Message:
    msg = m.Message(
        workspace_id=ws.id, channel_id=ch.id, seq=next_message_seq(s), sender_kind=kind, sender_id=sender_id,
        agent_model=agent_model, agent_provider=agent_provider, text=text,
        body=body if body is not None else ([{"t": "text", "v": text}] if text else []), reply_to_id=reply_to_id,
        attachment=attachment, cards=cards or None,
    )
    s.add(msg)
    s.flush()
    return msg


# Realtime event names pushed to the browser (`<domain>.<entity>.<past-verb>`).
EVENT_CHANNEL_ACTIVITY = "workspace.channel.updated"
EVENT_JOIN_REQUEST = "join.request.changed"
EVENT_MEMBERSHIP = "workspace.membership.changed"


def publish(s: Session, msgs: list[m.Message]) -> None:
    """Call after commit. The channel gets the message; every member's rail learns that the channel moved."""
    for msg in msgs:
        broker.publish(channel_topic(msg.channel_id), {"type": "message", "message": message_out(s, msg)})
        broker.publish(workspace_topic(msg.workspace_id), {"type": EVENT_CHANNEL_ACTIVITY, "workspaceId": msg.workspace_id,
                                                           "channelId": msg.channel_id})


def publish_join_request(s: Session, req: m.JoinRequest) -> None:
    """Call after commit. Only the owners and the requester hear of a request, never the other members."""
    event = {"type": EVENT_JOIN_REQUEST, "workspaceId": req.workspace_id, "requestId": req.id, "status": req.status}
    owner_ids = s.scalars(select(m.Member.user_id).where(m.Member.workspace_id == req.workspace_id,
                                                         m.Member.role == "owner", m.Member.left_at.is_(None)))
    for user_id in {*owner_ids, req.user_id}:
        broker.publish(user_topic(user_id), event)


def publish_membership(workspace_id: str, user_id: str) -> None:
    """Call after commit, when someone joins or leaves, so their open connection follows the change."""
    broker.publish(user_topic(user_id), {"type": EVENT_MEMBERSHIP, "workspaceId": workspace_id})
