"""Task board of a shared workspace (flow §13), run like a small Jira: the owner (team lead) adds the tasks, members
pick them, and each task moves through "Cần làm" (todo), "Đang làm" (doing) and "Xong" (done).

A task may break down into smaller tasks, at most MAX_DEPTH levels deep. Deleting a task deletes the tasks under it.

Only the owner adds, edits, assigns and deletes tasks. A member claims a task nobody holds ("Nhận việc", which starts
it) and may hand it back ("Bỏ nhận", back to todo). The assignee moves their own task between the three columns; the
owner may move any task.

A task may carry a deadline. When it passes and the task is not done, #chung is told once, naming who holds it; a new
deadline is announced again when it passes.

Locks freeze who does what, never progress. The owner can lock one task: nobody claims, hands back, reassigns, edits,
breaks down or deletes it until the owner unlocks it. The owner can also lock the whole board: then nothing is added,
edited, assigned, claimed or deleted, not even with /task. In both cases the assignee still moves their own task, since
that reports progress. A member who leaves or is removed is taken off their unfinished tasks even when locked.
"""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv

BODY_MAX_LENGTH = 200
MAX_DEPTH = 3
TODO, DOING, DONE = "todo", "doing", "done"
STATUSES = (TODO, DOING, DONE)
GENERAL_CHANNEL = "chung"
LOCKED_TEXT = "Bảng phân công đang khóa. Chờ chủ workspace mở khóa."


def label(number: int) -> str:
    """Tasks are always written "việc 3", so they are never confused with "ý 3" on the idea board."""
    return f"việc {number}"


def labels(numbers: list[int]) -> str:
    names = [label(n) for n in numbers]
    return names[0] if len(names) == 1 else ", ".join(names[:-1]) + " và " + names[-1]


def list_tasks(s: Session, ws: m.Workspace) -> list[m.Task]:
    return list(s.scalars(select(m.Task).where(m.Task.workspace_id == ws.id).order_by(m.Task.number)))


def _numbers_by_id(s: Session, workspace_id: str) -> dict[str, int]:
    rows = s.execute(select(m.Task.id, m.Task.number).where(m.Task.workspace_id == workspace_id))
    return {task_id: number for task_id, number in rows}


def _aware(moment: datetime | None) -> datetime | None:
    """SQLite hands datetimes back without a zone; every stored moment is UTC."""
    if moment is None or moment.tzinfo is not None:
        return moment
    return moment.replace(tzinfo=timezone.utc)


def is_overdue(task: m.Task, now: datetime | None = None) -> bool:
    due = _aware(task.due_at)
    return bool(due and task.status != DONE and due <= (now or m.now()))


def _clean_due(due_at: datetime | None) -> datetime | None:
    """A deadline is a moment in the future; one sent without a zone is read as UTC."""
    if due_at is None:
        return None
    due = _aware(due_at)
    if due <= m.now():
        raise ApiError(400, "Hạn chót phải ở sau thời điểm hiện tại.", "DUE_IN_PAST")
    return due


def task_out(s: Session, t: m.Task, numbers_by_id: dict[str, int] | None = None) -> dict:
    holder = sv.member_row(s, t.workspace_id, t.assignee_id) if t.assignee_id else None
    if t.parent_id and numbers_by_id is None:
        numbers_by_id = _numbers_by_id(s, t.workspace_id)
    parent_number = numbers_by_id.get(t.parent_id) if t.parent_id and numbers_by_id else None
    return {"id": t.id, "number": t.number, "parentNumber": parent_number, "body": t.body, "status": t.status,
            "locked": bool(t.locked), "dueAt": sv.iso(_aware(t.due_at)), "isOverdue": is_overdue(t),
            "assignee": sv.member_user_out(s, holder) if holder else None,
            "createdBy": sv.name_of(s, t.created_by, t.workspace_id),
            "assignedBy": sv.name_of(s, t.assigned_by, t.workspace_id) if t.assigned_by else None,
            "createdAt": sv.iso(t.created_at), "doneAt": sv.iso(t.done_at)}


def board_out(s: Session, ws: m.Workspace) -> dict:
    numbers_by_id = _numbers_by_id(s, ws.id)
    return {"locked": bool(ws.tasks_locked), "tasks": [task_out(s, t, numbers_by_id) for t in list_tasks(s, ws)]}


def get_task(s: Session, ws: m.Workspace, number: int) -> m.Task:
    task = s.scalar(select(m.Task).where(m.Task.workspace_id == ws.id, m.Task.number == number))
    if not task:
        raise ApiError(404, f"Không có {label(number)} trên bảng phân công.", "NOT_FOUND")
    return task


def _require_unlocked(ws: m.Workspace) -> None:
    if ws.tasks_locked:
        raise ApiError(409, LOCKED_TEXT, "TASKS_LOCKED")


def _require_task_unlocked(task: m.Task) -> None:
    if task.locked:
        raise ApiError(409, f"{label(task.number).capitalize()} đang khóa. Chờ chủ workspace mở khóa.", "TASK_LOCKED")


def _require_owner(actor: m.Member, action: str) -> None:
    if actor.role != "owner":
        raise ApiError(403, f"Chỉ chủ workspace được {action}.", "FORBIDDEN")


def _clean_body(body: str) -> str:
    text = " ".join(body.split())
    if not text:
        raise ApiError(400, "Mô tả việc đang trống.", "EMPTY")
    if len(text) > BODY_MAX_LENGTH:
        raise ApiError(400, f"Mô tả việc tối đa {BODY_MAX_LENGTH} ký tự.", "TOO_LONG")
    return text


def _require_assignable(s: Session, ws: m.Workspace, assignee_id: str | None) -> None:
    """The owner gives a task to any current member, or to nobody."""
    if assignee_id is not None and not sv.membership_of(s, ws.id, assignee_id):
        raise ApiError(404, "Người này không còn là thành viên của workspace.", "NOT_FOUND")


def _depth(s: Session, task: m.Task) -> int:
    """Level of a task in the tree: 1 for a top-level task."""
    depth, parent_id = 1, task.parent_id
    while parent_id:
        depth += 1
        parent_id = s.scalar(select(m.Task.parent_id).where(m.Task.id == parent_id))
    return depth


def _resolve_parent(s: Session, ws: m.Workspace, parent_number: int | None) -> m.Task | None:
    if parent_number is None:
        return None
    parent = get_task(s, ws, parent_number)
    _require_task_unlocked(parent)
    if _depth(s, parent) >= MAX_DEPTH:
        raise ApiError(400, f"Bảng phân công chỉ chia tối đa {MAX_DEPTH} cấp việc.", "TOO_DEEP")
    return parent


def create_task(s: Session, ws: m.Workspace, actor: m.Member, body: str, assignee_id: str | None,
                parent_number: int | None = None, due_at: datetime | None = None) -> m.Task:
    """The owner adds a task to "Cần làm", for a member or for whoever claims it, with an optional deadline."""
    _require_owner(actor, "thêm việc")
    _require_unlocked(ws)
    text = _clean_body(body)
    due = _clean_due(due_at)
    _require_assignable(s, ws, assignee_id)
    parent = _resolve_parent(s, ws, parent_number)
    ws.task_seq = (ws.task_seq or 0) + 1
    task = m.Task(workspace_id=ws.id, number=ws.task_seq, parent_id=parent.id if parent else None, body=text,
                  assignee_id=assignee_id, status=TODO, due_at=due, created_by=actor.user_id,
                  assigned_by=actor.user_id if assignee_id else None)
    s.add(task)
    s.flush()
    return task


def created_text(s: Session, ws: m.Workspace, task: m.Task) -> str:
    """The system message for a new task: what it is, who does it and who assigned it (flow §13)."""
    by = sv.name_of(s, task.created_by, ws.id)
    parent_number = _numbers_by_id(s, ws.id).get(task.parent_id) if task.parent_id else None
    name = label(task.number) + (f" (thuộc {label(parent_number)})" if parent_number else "")
    if task.assignee_id is None:
        return f"{by} đã thêm {name}: {task.body}. Việc này chưa có người phụ trách."
    if task.assignee_id == task.created_by:
        return f"{by} tự nhận {name}: {task.body}."
    return f"{by} đã giao {name} cho {sv.name_of(s, task.assignee_id, ws.id)}: {task.body}."


def assigned_text(s: Session, ws: m.Workspace, task: m.Task, actor: m.Member, previous_assignee: str | None = None) -> str:
    """The system message when a task changes hands, so the whole team sees who does what now (flow §13)."""
    by = sv.name_of(s, actor.user_id, ws.id)
    if task.assignee_id is None and previous_assignee == actor.user_id:
        return f"{by} đã bỏ nhận {label(task.number)}: {task.body}. Việc này đang chờ người nhận."
    if task.assignee_id is None:
        return f"{by} đã bỏ người phụ trách {label(task.number)}: {task.body}. Việc này chưa có người phụ trách."
    if task.assignee_id == actor.user_id:
        return f"{by} đã nhận {label(task.number)}: {task.body}."
    return f"{by} đã giao {label(task.number)} cho {sv.name_of(s, task.assignee_id, ws.id)}: {task.body}."


def update_task(s: Session, ws: m.Workspace, actor: m.Member, task: m.Task, *, body: str | None,
                assignee_id: str | None, change_assignee: bool, due_at: datetime | None = None,
                change_due: bool = False) -> m.Task:
    """The owner edits, reschedules and reassigns any unlocked task."""
    _require_owner(actor, "sửa hoặc giao lại việc")
    _require_unlocked(ws)
    _require_task_unlocked(task)
    if body is not None:
        task.body = _clean_body(body)
    if change_due and _aware(task.due_at) != _aware(due_at):
        task.due_at = _clean_due(due_at)
        task.overdue_notified_at = None
    if change_assignee and assignee_id != task.assignee_id:
        _require_assignable(s, ws, assignee_id)
        task.assignee_id = assignee_id
        task.assigned_by = actor.user_id if assignee_id else None
        if assignee_id is None and task.status == DOING:
            task.status = TODO
    return task


def claim_task(ws: m.Workspace, actor: m.Member, task: m.Task) -> m.Task:
    """"Nhận việc": take a task nobody holds and start it."""
    _require_unlocked(ws)
    _require_task_unlocked(task)
    if task.assignee_id is not None:
        raise ApiError(409, f"{label(task.number).capitalize()} đã có người phụ trách.", "TASK_TAKEN")
    if task.status == DONE:
        raise ApiError(409, f"{label(task.number).capitalize()} đã xong.", "TASK_DONE")
    task.assignee_id, task.assigned_by = actor.user_id, actor.user_id
    task.status = DOING
    return task


def release_task(ws: m.Workspace, actor: m.Member, task: m.Task) -> m.Task:
    """"Bỏ nhận": the assignee hands an unfinished task back to "Cần làm" for someone else to pick."""
    if task.assignee_id != actor.user_id:
        raise ApiError(403, f"Chỉ người phụ trách mới bỏ nhận {label(task.number)}.", "FORBIDDEN")
    _require_unlocked(ws)
    _require_task_unlocked(task)
    if task.status == DONE:
        raise ApiError(409, f"{label(task.number).capitalize()} đã xong.", "TASK_DONE")
    task.assignee_id, task.assigned_by = None, None
    task.status = TODO
    return task


def update_status(ws: m.Workspace, actor: m.Member, task: m.Task, status: str) -> m.Task:
    """The assignee moves their task between columns even when it or the board is locked, since that only reports
    progress; the owner may move any task while the board is unlocked."""
    if status not in STATUSES:
        raise ApiError(400, "Trạng thái phải là cần làm, đang làm hoặc xong.", "VALIDATION_ERROR")
    if task.assignee_id != actor.user_id:
        _require_owner(actor, "đổi trạng thái việc của người khác")
        _require_unlocked(ws)
    task.status = status
    task.done_at = m.now() if status == DONE else None
    return task


def delete_task(s: Session, ws: m.Workspace, actor: m.Member, task: m.Task) -> None:
    """Deletes the task together with every task under it, unless one of them is locked."""
    _require_owner(actor, "xóa việc")
    _require_unlocked(ws)
    children_by_parent: dict[str, list[m.Task]] = {}
    for row in list_tasks(s, ws):
        if row.parent_id:
            children_by_parent.setdefault(row.parent_id, []).append(row)
    doomed, pending = [], [task]
    while pending:
        current = pending.pop()
        _require_task_unlocked(current)
        doomed.append(current)
        pending.extend(children_by_parent.get(current.id, []))
    for current in doomed:
        s.delete(current)


def update_task_lock(actor: m.Member, task: m.Task, locked: bool) -> bool:
    """The owner locks or unlocks one task; returns whether it changed, so the notice is posted only then."""
    _require_owner(actor, "khóa hoặc mở khóa việc")
    if bool(task.locked) == locked:
        return False
    task.locked = locked
    return True


def notify_overdue(s: Session, now: datetime | None = None) -> list[m.Message]:
    """Tell #chung once about every unfinished task whose deadline has passed; return the notices to publish."""
    moment = now or m.now()
    notices = []
    due = s.scalars(select(m.Task).where(m.Task.due_at.is_not(None), m.Task.due_at <= moment, m.Task.status != DONE,
                                         m.Task.overdue_notified_at.is_(None)).order_by(m.Task.due_at))
    for task in list(due):
        task.overdue_notified_at = moment
        ws = s.get(m.Workspace, task.workspace_id)
        if not ws:
            continue
        holder = (f"Người phụ trách: {sv.name_of(s, task.assignee_id, ws.id)}." if task.assignee_id
                  else "Việc này chưa có người phụ trách.")
        notice = post_notice(s, ws, f"{label(task.number).capitalize()} đã quá hạn chót mà chưa xong: {task.body}. {holder}")
        if notice:
            notices.append(notice)
    return notices


def task_lock_text(s: Session, ws: m.Workspace, actor: m.Member, task: m.Task) -> str:
    who = sv.name_of(s, actor.user_id, ws.id)
    if task.locked:
        return (f"{who} đã khóa {label(task.number)}: {task.body}. Không ai nhận, bỏ nhận hay giao lại việc này "
                "cho tới khi mở khóa; người phụ trách vẫn cập nhật được tiến độ.")
    return f"{who} đã mở khóa {label(task.number)}: {task.body}."


def update_lock(ws: m.Workspace, actor: m.Member, locked: bool) -> bool:
    """Returns whether the lock changed, so the caller posts the system message only when it did."""
    _require_owner(actor, "khóa hoặc mở khóa bảng phân công")
    if bool(ws.tasks_locked) == locked:
        return False
    ws.tasks_locked = locked
    return True


def lock_text(s: Session, ws: m.Workspace, actor: m.Member) -> str:
    who = sv.name_of(s, actor.user_id, ws.id)
    if ws.tasks_locked:
        return f"{who} đã khóa bảng phân công. Người phụ trách vẫn đánh dấu được việc của mình là Xong."
    return f"{who} đã mở khóa bảng phân công."


def release_member(s: Session, ws: m.Workspace, user_id: str) -> list[int]:
    """Takes a leaving member off their unfinished tasks, locked board or not; done tasks keep their name."""
    released = []
    for task in list_tasks(s, ws):
        if task.assignee_id == user_id and task.status != DONE:
            task.assignee_id, task.assigned_by = None, None
            task.status = TODO
            released.append(task.number)
    return released


def departure_text(name: str, removed: bool, released: list[int]) -> str:
    head = f"{name} đã bị chủ workspace xóa khỏi workspace." if removed else f"{name} đã rời workspace."
    if not released:
        return head
    return f"{head} {labels(released).capitalize()} hiện chưa có người phụ trách."


def general_channel(s: Session, ws: m.Workspace) -> m.Channel | None:
    """The "chung" channel every workspace starts with, where board-wide notices go."""
    chans = sv.channels(s, ws.id)
    return next((c for c in chans if c.name == GENERAL_CHANNEL), chans[0] if chans else None)


def post_notice(s: Session, ws: m.Workspace, text: str, channel: m.Channel | None = None) -> m.Message | None:
    ch = channel or general_channel(s, ws)
    if not ch:
        return None
    return sv.add_message(s, ws, ch, kind="system", sender_id="system", text=text)


def context_rows(s: Session, ws: m.Workspace) -> list[dict]:
    """What every member's agent reads (flow §13): unfinished tasks, assigned or not; finished ones are left out."""
    numbers_by_id = _numbers_by_id(s, ws.id)
    return [{"number": t.number, "parentNumber": numbers_by_id.get(t.parent_id) if t.parent_id else None,
             "body": t.body, "assigneeName": sv.name_of(s, t.assignee_id, ws.id) if t.assignee_id else None,
             "status": t.status, "dueAt": sv.iso(_aware(t.due_at)), "isOverdue": is_overdue(t)}
            for t in list_tasks(s, ws) if t.status != DONE]
