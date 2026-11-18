"""Idea board and brief (UC11-UC13, FR-50-FR-56, BR-05, BR-07)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv

COLUMNS = ("proposed", "discussing", "decided", "rejected")
STATUS_TEXT = {"proposed": "Đề xuất", "discussing": "Đang bàn", "decided": "Đã chốt", "rejected": "Đã loại"}


def add_item(s: Session, ws: m.Workspace, *, kind: str, body: str, by_kind: str, by_id: str, by_model: str | None = None,
             channel_id: str | None = None, message_id: str | None = None, author_label: str | None = None,
             parts: list[dict] | None = None) -> m.BoardItem:
    body = body.strip()
    if not body:
        raise ApiError(400, "Nội dung thẻ đang trống.", "EMPTY")
    if kind not in ("idea", "note"):
        raise ApiError(400, "Loại thẻ không hợp lệ.", "VALIDATION_ERROR")
    ws.board_seq = (ws.board_seq or 0) + 1
    item = m.BoardItem(
        workspace_id=ws.id, number=ws.board_seq, kind=kind, body=body[:4000],
        status="proposed" if kind == "idea" else None, created_by_kind=by_kind, created_by_id=by_id,
        created_by_model=by_model, source_channel_id=channel_id, source_message_id=message_id,
        author_label=author_label, parts=parts or None,
    )
    s.add(item)
    s.flush()
    return item


def item_by_number(s: Session, ws: m.Workspace, number: int) -> m.BoardItem:
    item = s.scalar(select(m.BoardItem).where(m.BoardItem.workspace_id == ws.id, m.BoardItem.number == number))
    if not item:
        raise ApiError(404, f"Không có thẻ #{number} trên bảng.", "NOT_FOUND")
    return item


def decide(s: Session, item: m.BoardItem, decider: m.User, decision: str, reason: str) -> m.BoardItem:
    """BR-07: humans only (callers never pass an agent), reason required, no way back from decided/rejected."""
    reason = " ".join(reason.split())
    if decision not in ("decided", "rejected"):
        raise ApiError(400, "Quyết định phải là chốt hoặc loại.", "VALIDATION_ERROR")
    if item.kind != "idea":
        raise ApiError(400, f"Thẻ #{item.number} là ghi chú, không chốt hay loại được.", "NOT_AN_IDEA")
    if item.status in ("decided", "rejected"):
        raise ApiError(409, f"Ý #{item.number} đã {STATUS_TEXT[item.status].lower()}, không đổi được nữa.", "ALREADY_DECIDED")
    if not reason:
        raise ApiError(400, "Chốt hoặc loại phải có lý do.", "REASON_REQUIRED")
    item.status, item.reason = decision, reason[:2000]
    item.decided_by, item.decided_at = decider.id, m.now()
    return item


def move_to_discussing(item: m.BoardItem, role: str) -> m.BoardItem:
    """flow §11: only the owner moves Đề xuất -> Đang bàn (the owner decides what the team spends time on)."""
    if role != "owner":
        raise ApiError(403, "Chỉ chủ workspace chuyển ý sang Đang bàn.", "FORBIDDEN")
    if item.kind != "idea" or item.status != "proposed":
        raise ApiError(409, "Chỉ chuyển được ý đang ở cột Đề xuất sang Đang bàn.", "INVALID_TRANSITION")
    item.status = "discussing"
    return item


def board(s: Session, ws: m.Workspace) -> dict:
    items = list(s.scalars(select(m.BoardItem).where(m.BoardItem.workspace_id == ws.id).order_by(m.BoardItem.number)))
    ideas = [i for i in items if i.kind == "idea"]
    return {
        # FR-50: four columns, the rejected one stays visible.
        "columns": [{"status": st, "title": STATUS_TEXT[st],
                     "items": [sv.board_item_out(s, i) for i in ideas if i.status == st]} for st in COLUMNS],
        "notes": [sv.board_item_out(s, i) for i in items if i.kind == "note"],
    }


# ---------- brief (FR-56) ----------


def build_brief(s: Session, ws: m.Workspace) -> dict:
    items = list(s.scalars(select(m.BoardItem).where(m.BoardItem.workspace_id == ws.id).order_by(m.BoardItem.number)))
    ideas = [i for i in items if i.kind == "idea"]
    row = lambda i: {"number": i.number, "body": i.body, "reason": i.reason, "authorName": sv.board_author(s, i),  # noqa: E731
                     "deciderName": sv.name_of(s, i.decided_by, ws.id) if i.decided_by else None}
    members = len(sv.team(s, ws))
    return {
        "title": ws.name, "brief": ws.brief, "memberCount": members,
        "decided": [row(i) for i in ideas if i.status == "decided"],
        "rejected": [row(i) for i in ideas if i.status == "rejected"],
        "discussing": [row(i) for i in ideas if i.status in ("proposed", "discussing")],
        "notes": [row(i) for i in items if i.kind == "note"],
    }


def _lower_first(text: str | None) -> str:
    return text[:1].lower() + text[1:] if text else ""


def brief_markdown(b: dict, built_at: str, built_by: str) -> str:
    lines = [f"# {b['title']}", "", f"> Đề bài: {b['brief']}", "",
             f"_Dựng lúc {built_at} bởi {built_by}, từ {b['memberCount']} thành viên và agent riêng của họ._", ""]

    def section(heading: str, rows: list[str]) -> None:
        lines.extend([f"## {heading}", "", *(rows or ["_(không có)_"]), ""])

    section("Đã chốt", [f"- **#{r['number']} {r['body']}**. Vì {_lower_first(r['reason'])}" for r in b["decided"]])
    section("Đã loại", [f"- #{r['number']} {r['body']}. Vì {_lower_first(r['reason'])}" for r in b["rejected"]])
    section("Còn đang bàn", [f"- #{r['number']} {r['body']}" for r in b["discussing"]])
    section("Ghi chú", [f"- {r['body']}" for r in b["notes"]])
    return "\n".join(lines).rstrip() + "\n"


def snapshot_brief(s: Session, ws: m.Workspace, owner: m.User) -> m.Brief:
    data = build_brief(s, ws)
    at = m.now()
    br = m.Brief(workspace_id=ws.id, built_by=owner.id, built_at=at, data=data,
                 markdown=brief_markdown(data, at.strftime("%d/%m/%Y %H:%M UTC"), owner.display_name))
    s.add(br)
    s.flush()
    return br


def brief_out(s: Session, br: m.Brief) -> dict:
    return {"id": br.id, "workspaceId": br.workspace_id, "builtAt": sv.iso(br.built_at),
            "builtBy": sv.user_out(s.get(m.User, br.built_by)) if s.get(m.User, br.built_by) else None,
            **br.data, "markdown": br.markdown}
