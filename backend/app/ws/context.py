"""Group context (flow §5) of a conversation linked to a shared workspace.

The same structure feeds the model (render_system) and the "Agent đang đọc" panel, so the panel always shows exactly
what is sent. From the channels only two things come in: the user's own messages (cards they sent included, the
/summarize output excluded) and the passages they highlighted from others, merged into one timeline with time,
channel, speaker and what each message replies to. Nothing else anyone else wrote (BR-04).

When the user's messages exceed CONTEXT_OWN_MESSAGES_MAX, the older ones are left out and the panel says how many.
Nothing is summarized on its own: the user presses "Tóm tắt tin cũ" (run_digest), their own agent on their own key
writes the summary in one call, in blocks cut at the highlights in between so the timeline keeps its order; a short
block is sent word for word. Highlights are never cut or summarized.
"""

import re
from datetime import timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.ws import models as m
from app.ws import providers as pv
from app.ws import service as sv
from app.ws import tasks as tk

LABELS = {"important": "Quan trọng", "review": "Cần xem xét"}

BASE_SYSTEM = (
    "Bạn là agent riêng của {name} trong SpecGate, trả lời bằng tiếng Việt, định dạng Markdown khi cần. "
    "Chỉ {name} đọc hội thoại này. Bạn không tự gửi gì vào kênh nhóm, không tự chốt hay loại ý: "
    "{name} tự chọn đoạn nào để gửi, và đoạn đó hiện dưới tên \"{label}\"."
)


def _clock(dt) -> str:
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%d/%m %H:%M UTC")


def message_words(s: Session, msg: m.Message) -> str:
    """A message as the owner's agent reads it: the text, then each card it carries."""
    parts = [msg.text] if msg.text else []
    for card in msg.cards or []:
        kind = card.get("kind")
        if kind == "quote":
            words = ("…" if card.get("cutStart") else "") + (card.get("text") or "") + ("…" if card.get("cutEnd") else "")
            parts.append(f"[Trích dẫn: {card.get('speakerLabel')} nói: \"{words}\"]")
        elif kind == "conversation-summary":
            parts.append(f"[{card.get('title')}, do {card.get('speakerLabel')} viết, chưa được lọc: {card.get('text')}]")
    return "\n".join(parts)


def own_query(ws_id: str, user_id: str):
    return (select(m.Message).where(m.Message.workspace_id == ws_id, m.Message.sender_id == user_id,
                                    m.Message.sender_kind.in_(("human", "agent")))
            .order_by(m.Message.seq.desc()))


def _own_messages(s: Session, ws_id: str, user_id: str) -> list[m.Message]:
    """Newest first; the channel summary (/summarize) is not the owner's own words (flow §5)."""
    return [x for x in s.scalars(own_query(ws_id, user_id)) if not sv.is_channel_summary(x)]


def _utc(dt):
    return dt.replace(tzinfo=timezone.utc) if dt is not None and dt.tzinfo is None else dt


def _highlights(s: Session, user_id: str, ws_id: str) -> list[m.Highlight]:
    return list(s.scalars(select(m.Highlight).where(m.Highlight.owner_id == user_id, m.Highlight.workspace_id == ws_id)
                          .order_by(m.Highlight.at, m.Highlight.id)))


def split_blocks(msgs: list[m.Message], cuts: list) -> list[list[m.Message]]:
    """Old messages (oldest first) in blocks, a new block wherever a highlight's time falls between two messages."""
    cuts = sorted(_utc(c) for c in cuts if c is not None)
    blocks: list[list[m.Message]] = []
    for x in msgs:
        if blocks and any(_utc(blocks[-1][-1].at) < c <= _utc(x.at) for c in cuts):
            blocks.append([x])
        elif blocks:
            blocks[-1].append(x)
        else:
            blocks.append([x])
    return blocks


def _old_messages(s: Session, user_id: str, ws_id: str) -> tuple[list[m.Message], list[m.Message], m.ContextDigest | None]:
    """(own messages in the window, oldest first; older ones not yet in the digest, oldest first; the digest)."""
    all_own = _own_messages(s, ws_id, user_id)
    limit = settings.context_own_messages_max
    own, older = list(reversed(all_own[:limit])), list(reversed(all_own[limit:]))
    digest = s.scalar(select(m.ContextDigest).where(m.ContextDigest.user_id == user_id,
                                                    m.ContextDigest.workspace_id == ws_id))
    upto = digest.upto_seq if digest else 0
    return own, [x for x in older if x.seq > upto], digest


def digest_plan(s: Session, user_id: str, ws_id: str, pending: list[m.Message] | None = None) -> dict:
    """What pressing "Tóm tắt tin cũ" would do, shown before it runs (flow §5)."""
    if pending is None:
        _, pending, _ = _old_messages(s, user_id, ws_id)
    blocks = split_blocks(pending, [h.source_at or h.at for h in _highlights(s, user_id, ws_id)])
    summarized = [b for b in blocks if len(b) >= settings.digest_block_min]
    return {"messages": len(pending), "blocks": len(blocks), "summarizedBlocks": len(summarized),
            "verbatimMessages": sum(len(b) for b in blocks if len(b) < settings.digest_block_min),
            "calls": 1 if summarized else 0}


def _digest_blocks(digest: m.ContextDigest | None, older_msgs: list[m.Message]) -> list[dict]:
    if not digest:
        return []
    if digest.blocks:
        return digest.blocks
    # A digest written before blocks existed: one block covering everything it summarized.
    covered = [x for x in older_msgs if x.seq <= digest.upto_seq]
    return [{"firstSeq": covered[0].seq if covered else 0, "lastSeq": digest.upto_seq,
             "from": sv.iso(covered[0].at) if covered else sv.iso(digest.at),
             "to": sv.iso(covered[-1].at) if covered else sv.iso(digest.at), "count": digest.count,
             "verbatim": False, "text": digest.text}]


def _day(iso: str | None) -> str:
    return f"{iso[8:10]}/{iso[5:7]}" if iso else ""


def build(s: Session, user: m.User, workspace_id: str) -> dict | None:
    ws = s.get(m.Workspace, workspace_id)
    if not ws or ws.kind != "shared":
        return None
    me = sv.membership_of(s, ws.id, user.id)
    if not me:
        return None
    chans = {c.id: c.name for c in sv.channels(s, ws.id)}
    ideas = list(s.scalars(select(m.BoardItem).where(m.BoardItem.workspace_id == ws.id, m.BoardItem.kind == "idea")
                           .order_by(m.BoardItem.number)))

    own, pending, digest = _old_messages(s, user.id, ws.id)
    window_ids = {x.id for x in own}
    covered_msgs = [x for x in reversed(_own_messages(s, ws.id, user.id))
                    if x.id not in window_ids and digest and x.seq <= digest.upto_seq]
    blocks = _digest_blocks(digest, covered_msgs)
    hls = _highlights(s, user.id, ws.id)

    def card(it: m.BoardItem) -> dict:
        return {"id": it.id, "number": it.number, "body": it.body, "reason": it.reason,
                "deciderName": sv.name_of(s, it.decided_by, ws.id) if it.decided_by else None}

    def own_item(x: m.Message, verbatim_block: bool = False) -> dict:
        item = {"kind": "own", "id": x.id, "at": sv.iso(x.at), "channelId": x.channel_id,
                "channelName": chans.get(x.channel_id, x.channel_id), "speaker": sv.speaker_label(s, x),
                "text": message_words(s, x)}
        if verbatim_block:
            item["fromDigest"] = True   # an old message kept word for word: its block was too short to summarize
        if x.reply_to_id:
            parent = s.get(m.Message, x.reply_to_id)
            if parent:
                item["replyTo"] = {"id": parent.id, "speaker": sv.speaker_label(s, parent)}
        return item

    timeline = [(x.at, own_item(x)) for x in own]
    by_seq = {x.seq: x for x in covered_msgs}
    for b in blocks:
        if b.get("verbatim"):
            for seq in sorted(q for q in by_seq if b["firstSeq"] <= q <= b["lastSeq"]):
                timeline.append((by_seq[seq].at, own_item(by_seq[seq], verbatim_block=True)))
        else:
            first = by_seq.get(b["firstSeq"])
            timeline.append((first.at if first else digest.at, {
                "kind": "digest", "id": f"digest-{b['firstSeq']}", "at": b["from"], "to": b["to"],
                "count": b["count"], "text": b["text"],
                "title": f"Tóm tắt tin của tôi, từ {_day(b['from'])} tới {_day(b['to'])}"}))
    highlights = []
    for h in hls:
        out = {**sv.highlight_out(s, h), "status": "chưa phải quyết định của nhóm"}
        highlights.append(out)
        timeline.append((h.source_at or h.at, {"kind": "highlight", "id": h.id, "at": out["sourceAt"],
                                               "channelId": h.channel_id, "channelName": out["channelName"],
                                               "label": h.label, "note": h.note, "segments": out["segments"]}))
    timeline.sort(key=lambda p: _utc(p[0]))

    return {
        "workspace": {"id": ws.id, "name": ws.name, "brief": ws.brief},
        "myName": me.nickname or user.display_name,
        "myTeamRole": me.team_role,
        "team": sv.team(s, ws),
        # flow §13: unfinished tasks, assigned or not; finished ones are not sent.
        "tasks": tk.context_rows(s, ws),
        "decided": [card(i) for i in ideas if i.status == "decided"],
        "rejected": [card(i) for i in ideas if i.status == "rejected"],
        "timeline": [item for _, item in timeline],
        "ownMessagesCount": len(own),
        # Old messages that are not sent at all, until the user presses "Tóm tắt tin cũ" (flow §5).
        "ownMessagesOmitted": len(pending),
        "digest": ({"text": digest.text, "count": digest.count, "at": sv.iso(digest.at), "model": digest.model,
                    "blocks": len(blocks)} if digest and blocks else None),
        "digestPending": bool(pending),
        "digestPlan": digest_plan(s, user.id, ws.id, pending) if pending else None,
        "highlights": highlights,
        "highlightLimit": settings.agent_highlights_max,
    }


_BLOCK = re.compile(r"^=== KHỐI (\d+)[^\n]*===\s*$", re.MULTILINE)


def _parse_blocks(text: str) -> dict[int, str]:
    parts = _BLOCK.split(text)
    # parts: [before, n1, body1, n2, body2, ...]
    return {int(parts[i]): parts[i + 1].strip() for i in range(1, len(parts) - 1, 2) if parts[i + 1].strip()}


async def run_digest(s: Session, user: m.User, workspace_id: str, target: pv.Target, model: str) -> dict:
    """"Tóm tắt tin cũ" (flow §5), only when the user presses it. The old messages not yet summarized are cut into
    blocks at the highlights in between; a block under DIGEST_BLOCK_MIN messages stays word for word; all the others
    go in ONE call, each marked, and come back one summary per block. On a provider error the old digest stays and
    the error is raised for the router to report; nothing else changes."""
    _, pending, digest = _old_messages(s, user.id, workspace_id)
    if not pending:
        return digest_plan(s, user.id, workspace_id, pending)
    blocks = split_blocks(pending, [h.source_at or h.at for h in _highlights(s, user.id, workspace_id)])
    to_sum = [b for b in blocks if len(b) >= settings.digest_block_min]
    ws = s.get(m.Workspace, workspace_id)
    chans = {c.id: c.name for c in sv.channels(s, workspace_id)}
    name = sv.name_of(s, user.id, workspace_id)
    summaries: dict[int, str] = {}
    if to_sum:
        marked = []
        for n, b in enumerate(to_sum, 1):
            lines = "\n".join(f"[{_clock(x.at)}, #{chans.get(x.channel_id, '?')}] {message_words(s, x)}" for x in b)
            marked.append(f"=== KHỐI {n} (từ {_clock(b[0].at)} tới {_clock(b[-1].at)}) ===\n{lines}")
        system = (f"Bạn là agent riêng của {name}. Tóm tắt các tin cũ của chính {name} trong workspace \"{ws.name}\", "
                  "bằng tiếng Việt, theo đúng từng khối được đánh dấu: với mỗi khối, viết một dòng \"=== KHỐI <số> ===\" "
                  "rồi bản tóm tắt ngắn của khối đó, không gộp hai khối. Giữ thứ tự thời gian, giữ người nói khi tin có "
                  "trích dẫn lời người khác. Không thêm ý mới.")
        text = await pv.complete(target, model, system, [{"role": "user", "content": "\n\n".join(marked)}])
        summaries = _parse_blocks(text)
        if len(to_sum) == 1 and not summaries and text.strip():
            summaries = {1: text.strip()}
        missing = [n for n in range(1, len(to_sum) + 1) if n not in summaries]
        if missing:
            raise pv.ProviderError("format", "Agent trả về bản tóm tắt không đúng từng khối. Bản tóm tắt cũ vẫn được giữ; "
                                             "hãy thử lại.")
    new_blocks, k = [], 0
    for b in blocks:
        entry = {"firstSeq": b[0].seq, "lastSeq": b[-1].seq, "from": sv.iso(b[0].at), "to": sv.iso(b[-1].at),
                 "count": len(b), "verbatim": len(b) < settings.digest_block_min}
        if not entry["verbatim"]:
            k += 1
            entry["text"] = summaries[k]
        new_blocks.append(entry)
    if digest is None:
        digest = m.ContextDigest(user_id=user.id, workspace_id=workspace_id, upto_seq=0, text="", count=0)
        s.add(digest)
        old_blocks = []
    else:
        old_blocks = list(digest.blocks or _digest_blocks(digest, []))
    all_blocks = old_blocks + new_blocks
    digest.blocks = all_blocks
    digest.upto_seq = pending[-1].seq
    digest.count = sum(b["count"] for b in all_blocks)
    digest.text = "\n\n".join(f"Tóm tắt tin của tôi, từ {_day(b['from'])} tới {_day(b['to'])}:\n{b['text']}"
                              for b in all_blocks if not b.get("verbatim"))
    digest.model, digest.at = model, m.now()
    s.commit()
    return {"messages": len(pending), "blocks": len(blocks), "summarizedBlocks": len(to_sum),
            "verbatimMessages": sum(len(b) for b in blocks if len(b) < settings.digest_block_min),
            "calls": 1 if to_sum else 0}


def render_segment(seg: dict) -> str:
    """One passage as the agent reads it: verbatim, "…" where cut, "(trích một phần)" when cut mid-sentence, and the
    notice of flow §6 (a summary is relayed words)."""
    text = ("…" if seg.get("cutStart") else "") + seg["text"] + ("…" if seg.get("cutEnd") else "")
    verb = "viết" if seg.get("relayed") else "nói"
    marks = []
    if seg.get("partial"):
        marks.append("trích một phần")
    if seg.get("relayed"):
        marks.append("lời thuật lại của agent, không phải lập trường riêng của người hay của agent nào")
    tail = f" ({'; '.join(marks)})" if marks else ""
    return f"    - {seg['speaker']} {verb}{tail}: \"{text}\""


def render_system(user_name: str, agent_label: str, ctx: dict | None) -> str:
    parts = [BASE_SYSTEM.format(name=user_name, label=agent_label)]
    if not ctx:
        return parts[0]
    name = ctx.get("myName") or user_name
    ws = ctx["workspace"]
    parts.append(f"# Ngữ cảnh nhóm: workspace chung \"{ws['name']}\"\n\n## Đề bài\n{ws['brief'] or '(chưa có)'}")

    lines = []
    for t in ctx["team"]:
        agent = f"{t['agent']['name']} ({t['agent']['model']})" if t["agent"] else "chưa nhập key"
        role = t["teamRole"] or "chưa ghi vai"
        who = t["user"]["displayName"] + (" (chủ workspace)" if t["role"] == "owner" else "")
        lines.append(f"- {who}: vai \"{role}\", agent {agent}")
    parts.append("## Thành viên\n" + "\n".join(lines))
    parts.append(f"Bạn đang làm việc cho {name}. Vai của {name}: {ctx['myTeamRole'] or '(chưa ghi)'}")

    tasks = "\n".join(f"- {tk.label(t['number'])}: {t['body']} (phụ trách: {t['assigneeName'] or 'chưa có người phụ trách'})"
                      for t in ctx.get("tasks", [])) or "(chưa có việc nào)"
    parts.append("## Bảng phân công: việc đang làm và việc chưa có người phụ trách\n" + tasks)

    def ideas(title: str, rows: list[dict]) -> str:
        body = "\n".join(f"- #{r['number']} {r['body']} (lý do: {r['reason']})" for r in rows) or "(không có)"
        return f"## {title}\n{body}"

    parts.append(ideas("Ý nhóm đã chốt", ctx["decided"]))
    parts.append(ideas("Ý nhóm đã loại. Đừng đề xuất lại các ý này", ctx["rejected"]))

    if ctx.get("ownMessagesOmitted"):
        parts.append(f"({ctx['ownMessagesOmitted']} tin cũ hơn của {name} không được gửi kèm.)")

    rows = []
    for it in ctx["timeline"]:
        when = it["at"][5:16].replace("T", " ") if it.get("at") else ""
        where = f"#{it.get('channelName')}"
        if it["kind"] == "own":
            reply = f" (trả lời tin của {it['replyTo']['speaker']})" if it.get("replyTo") else ""
            rows.append(f"- [{when}, {where}] {it['speaker']}{reply}: {it['text']}")
        elif it["kind"] == "digest":
            until = it["to"][5:16].replace("T", " ") if it.get("to") else ""
            rows.append(f"- [{when} → {until}] {it['title']} ({it['count']} tin, do agent của {name} tóm tắt): {it['text']}")
        else:
            label = LABELS.get(it["label"], it["label"])
            head = f"- [{when}, {where}] {name} đã highlight [{label}, chưa phải quyết định của nhóm]:"
            segs = [render_segment(seg) for seg in it["segments"]]
            note = [f"    - Ghi chú của {name}: {it['note']}"] if it.get("note") else []
            rows.append("\n".join([head, *segs, *note]))
    parts.append(f"## Dòng thời gian: tin của {name} và các đoạn {name} đã highlight từ người khác\n"
                 + ("\n".join(rows) or "(chưa có)"))

    parts.append("Khi trả lời, nói rõ bạn dựa vào ý của ai (ví dụ \"Long nói…\"). Highlight chỉ là đánh dấu của "
                 f"{name}, chưa phải quyết định của nhóm. Đoạn ghi \"trích một phần\" đã bị cắt giữa câu: đừng suy ra ý "
                 "của người nói từ phần bị cắt. Bản tóm tắt là lời thuật lại: đừng coi đó là lập trường của riêng ai.")
    return "\n\n".join(parts)
