"""Task board routes of a shared workspace (flow §13). Rules live in app/ws/tasks.py; nothing here calls a model."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ws import models as m
from app.ws import service as sv
from app.ws import tasks as tk
from app.ws.deps import current_user, db, require_member

router = APIRouter(prefix="/workspaces/{ws_id}/tasks", tags=["tasks"])


def _commit_with_notices(s: Session, notices: list[m.Message | None]) -> None:
    s.commit()
    sv.publish(s, [x for x in notices if x is not None])


@router.get("")
def list_tasks(ws_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    ws, _ = require_member(s, ws_id, user)
    return tk.board_out(s, ws)


class NewTask(BaseModel):
    body: str = Field(max_length=2000)
    assigneeId: str | None = Field(None, description="Bỏ trống = việc chờ thành viên nhận")
    unassigned: bool = Field(False, description="Giữ cho tương thích: việc chờ thành viên nhận")
    parentNumber: int | None = Field(None, description="Số của việc lớn hơn mà việc này thuộc về; bỏ trống = việc cấp cao nhất")
    dueAt: datetime | None = Field(None, description="Hạn chót, ISO 8601 có múi giờ; bỏ trống = không có hạn")


@router.post("", status_code=201)
def create_task(ws_id: str, body: NewTask, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """Only the owner adds tasks; without an assignee the task waits in "Cần làm" for a member to claim it."""
    ws, mem = require_member(s, ws_id, user)
    assignee = None if body.unassigned else body.assigneeId
    task = tk.create_task(s, ws, mem, body.body, assignee, body.parentNumber, body.dueAt)
    _commit_with_notices(s, [tk.post_notice(s, ws, tk.created_text(s, ws, task))])
    return tk.task_out(s, task)


class TaskChange(BaseModel):
    body: str | None = Field(None, max_length=2000)
    assigneeId: str | None = Field(None, description="Người phụ trách mới; null cùng changeAssignee = bỏ trống")
    changeAssignee: bool = False
    dueAt: datetime | None = Field(None, description="Hạn chót mới; null cùng changeDueAt = bỏ hạn")
    changeDueAt: bool = False


@router.patch("/{number}")
def update_task(ws_id: str, number: int, body: TaskChange, user: m.User = Depends(current_user),
                s: Session = Depends(db)) -> dict:
    ws, mem = require_member(s, ws_id, user)
    task = tk.get_task(s, ws, number)
    previous_assignee = task.assignee_id
    task = tk.update_task(s, ws, mem, task, body=body.body, assignee_id=body.assigneeId,
                          change_assignee=body.changeAssignee, due_at=body.dueAt, change_due=body.changeDueAt)
    notices = ([tk.post_notice(s, ws, tk.assigned_text(s, ws, task, mem, previous_assignee))]
               if task.assignee_id != previous_assignee else [])
    _commit_with_notices(s, notices)
    return tk.task_out(s, task)


@router.post("/{number}/claim")
def claim_task(ws_id: str, number: int, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    ws, mem = require_member(s, ws_id, user)
    task = tk.claim_task(ws, mem, tk.get_task(s, ws, number))
    _commit_with_notices(s, [tk.post_notice(s, ws, tk.assigned_text(s, ws, task, mem))])
    return tk.task_out(s, task)


@router.post("/{number}/release")
def release_task(ws_id: str, number: int, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """"Bỏ nhận": the assignee hands the task back to "Cần làm"; the team sees it in #chung."""
    ws, mem = require_member(s, ws_id, user)
    task = tk.release_task(ws, mem, tk.get_task(s, ws, number))
    _commit_with_notices(s, [tk.post_notice(s, ws, tk.assigned_text(s, ws, task, mem, previous_assignee=user.id))])
    return tk.task_out(s, task)


class TaskLock(BaseModel):
    locked: bool


@router.put("/{number}/lock")
def update_task_lock(ws_id: str, number: int, body: TaskLock, user: m.User = Depends(current_user),
                     s: Session = Depends(db)) -> dict:
    """The owner locks or unlocks one task; every change is announced in #chung."""
    ws, mem = require_member(s, ws_id, user)
    task = tk.get_task(s, ws, number)
    notices = [tk.post_notice(s, ws, tk.task_lock_text(s, ws, mem, task))] if tk.update_task_lock(mem, task, body.locked) else []
    _commit_with_notices(s, notices)
    return tk.task_out(s, task)


class StatusChange(BaseModel):
    status: Literal["todo", "doing", "done"]


@router.put("/{number}/status")
def update_status(ws_id: str, number: int, body: StatusChange, user: m.User = Depends(current_user),
                  s: Session = Depends(db)) -> dict:
    ws, mem = require_member(s, ws_id, user)
    task = tk.update_status(ws, mem, tk.get_task(s, ws, number), body.status)
    s.commit()
    return tk.task_out(s, task)


@router.delete("/{number}", status_code=204)
def delete_task(ws_id: str, number: int, user: m.User = Depends(current_user), s: Session = Depends(db)) -> None:
    ws, mem = require_member(s, ws_id, user)
    tk.delete_task(s, ws, mem, tk.get_task(s, ws, number))
    s.commit()


class Lock(BaseModel):
    locked: bool


@router.put("/lock")
def update_lock(ws_id: str, body: Lock, user: m.User = Depends(current_user), s: Session = Depends(db)) -> dict:
    """Every lock or unlock is announced in #chung (flow §13)."""
    ws, mem = require_member(s, ws_id, user)
    notices = [tk.post_notice(s, ws, tk.lock_text(s, ws, mem))] if tk.update_lock(ws, mem, body.locked) else []
    _commit_with_notices(s, notices)
    return tk.board_out(s, ws)
