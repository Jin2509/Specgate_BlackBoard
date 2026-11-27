"""Task board of a shared workspace (flow §13): the owner adds, members claim and hand back, locks, deadlines,
/task, leaving members, agent context."""

from datetime import datetime, timedelta, timezone

from app.db import SessionLocal
from app.ws import tasks as tk

from test_ws import add_member, api, login, post, team, with_key  # noqa: F401


def tasks(api, h, ws):
    r = api.get(f"/api/v1/workspaces/{ws['id']}/tasks", headers=h)
    assert r.status_code == 200, r.text
    return r.json()


def create(api, h, ws, body, **kw):
    return api.post(f"/api/v1/workspaces/{ws['id']}/tasks", headers=h, json={"body": body, **kw})


def user_id(api, h):
    return api.get("/api/v1/me", headers=h).json()["user"]["id"]


def chung(api, h, ws):
    return api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=h).json()["messages"]


def claim(api, h, ws, number):
    return api.post(f"/api/v1/workspaces/{ws['id']}/tasks/{number}/claim", headers=h)


def test_should_let_only_the_owner_add_tasks_waiting_in_todo(team):
    api, lan, long, ws = team
    refused = create(api, long, ws, "tìm paper về phương pháp đánh giá")
    assert refused.status_code == 403 and refused.json()["error"]["code"] == "FORBIDDEN"
    r = create(api, lan, ws, "tìm paper về phương pháp đánh giá")
    assert r.status_code == 201 and r.json()["number"] == 1
    assert r.json()["assignee"] is None and r.json()["status"] == "todo" and r.json()["locked"] is False
    assert chung(api, long, ws)[-1]["text"] == (
        "Lan đã thêm việc 1: tìm paper về phương pháp đánh giá. Việc này chưa có người phụ trách.")


def test_should_refuse_member_assigning_others_and_let_owner_assign(team):
    api, lan, long, ws = team
    lan_id, long_id = user_id(api, lan), user_id(api, long)
    assert create(api, long, ws, "dựng khung", assigneeId=lan_id).status_code == 403
    assert create(api, lan, ws, "dựng runner", assigneeId=long_id).json()["assignee"]["displayName"] == "Long"
    assert chung(api, long, ws)[-1]["text"] == "Lan đã giao việc 1 cho Long: dựng runner."


def test_should_let_member_claim_unassigned_task_once(team):
    api, lan, long, ws = team
    create(api, lan, ws, "viết báo cáo", unassigned=True)
    assert api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/claim", headers=long).json()["assignee"]["displayName"] == "Long"
    r = api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/claim", headers=lan)
    assert r.status_code == 409 and r.json()["error"]["code"] == "TASK_TAKEN"


def test_task_command_is_for_the_owner_who_assigns_with_a_mention(team):
    api, lan, long, ws = team
    assert post(api, lan, ws, "/task @Long dựng runner cho ý 4")[-1]["text"] == "Lan đã giao việc 1 cho Long: dựng runner cho ý 4."
    assert post(api, lan, ws, "/task chạy lại dataset")[-1]["text"] == (
        "Lan đã thêm việc 2: chạy lại dataset. Việc này chưa có người phụ trách.")
    assert post(api, long, ws, "/task tự thêm")[-1]["text"].startswith("Chỉ chủ workspace thêm việc.")
    assert post(api, lan, ws, "/task")[-1]["text"].startswith("Cách dùng: /task")
    assert [t["number"] for t in tasks(api, lan, ws)["tasks"]] == [1, 2]


def test_locked_board_blocks_changes_but_assignee_can_finish(team):
    api, lan, long, ws = team
    create(api, lan, ws, "chạy runner", assigneeId=user_id(api, long))
    assert api.put(f"/api/v1/workspaces/{ws['id']}/tasks/lock", headers=long, json={"locked": True}).status_code == 403
    assert api.put(f"/api/v1/workspaces/{ws['id']}/tasks/lock", headers=lan, json={"locked": True}).json()["locked"] is True
    assert chung(api, long, ws)[-1]["text"].startswith("Lan đã khóa bảng phân công.")
    assert create(api, lan, ws, "việc mới").json()["error"]["code"] == "TASKS_LOCKED"
    assert post(api, lan, ws, "/task việc mới")[-1]["text"].startswith("Bảng phân công đang khóa.")
    r = api.patch(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=lan, json={"body": "sửa"})
    assert r.json()["error"]["code"] == "TASKS_LOCKED"
    done = api.put(f"/api/v1/workspaces/{ws['id']}/tasks/1/status", headers=long, json={"status": "done"})
    assert done.status_code == 200 and done.json()["status"] == "done"
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/lock", headers=lan, json={"locked": False})
    assert chung(api, long, ws)[-1]["text"] == "Lan đã mở khóa bảng phân công."


def test_only_assignee_or_owner_changes_status_and_only_owner_deletes(team):
    api, lan, long, ws = team
    create(api, lan, ws, "dựng khung")
    assert api.put(f"/api/v1/workspaces/{ws['id']}/tasks/1/status", headers=long, json={"status": "done"}).status_code == 403
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=long).status_code == 403
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=lan).status_code == 204
    assert tasks(api, lan, ws)["tasks"] == []


def test_leaving_member_is_released_from_unfinished_tasks_even_when_locked(team):
    api, lan, long, ws = team
    long_id = user_id(api, long)
    for body in ("việc A", "việc B", "việc C"):
        create(api, lan, ws, body, assigneeId=long_id)
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/2/status", headers=long, json={"status": "done"})
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/lock", headers=lan, json={"locked": True})
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/members/me", headers=long).status_code == 204
    board = {t["number"]: t for t in tasks(api, lan, ws)["tasks"]}
    assert board[1]["assignee"] is None and board[3]["assignee"] is None
    assert board[1]["status"] == "todo"
    assert board[2]["assignee"]["displayName"] == "Long (đã rời)"
    assert chung(api, lan, ws)[-1]["text"] == "Long đã rời workspace. Việc 1 và việc 3 hiện chưa có người phụ trách."


def test_removed_member_notice_names_the_removal(team):
    api, lan, long, ws = team
    api.delete(f"/api/v1/workspaces/{ws['id']}/members/{user_id(api, long)}", headers=lan)
    assert chung(api, lan, ws)[-1]["text"] == "Long đã bị chủ workspace xóa khỏi workspace."


def test_agent_context_carries_unfinished_tasks_only(team):
    api, lan, long, ws = team
    create(api, lan, ws, "chạy dataset", assigneeId=user_id(api, long))
    create(api, lan, ws, "viết báo cáo")
    create(api, lan, ws, "dựng khung")
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/3/status", headers=lan, json={"status": "done"})
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    body = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert [t["number"] for t in body["context"]["tasks"]] == [1, 2]
    assert "- việc 1: chạy dataset (phụ trách: Long)" in body["system"]
    assert "- việc 2: viết báo cáo (phụ trách: chưa có người phụ trách)" in body["system"]
    assert "dựng khung" not in body["system"]


def test_should_nest_subtasks_under_parent_and_announce_the_parent(team):
    api, lan, long, ws = team
    create(api, lan, ws, "xây dựng runner")
    r = create(api, lan, ws, "viết bộ chấm điểm", parentNumber=1)
    assert r.status_code == 201 and r.json()["parentNumber"] == 1
    assert chung(api, long, ws)[-1]["text"] == (
        "Lan đã thêm việc 2 (thuộc việc 1): viết bộ chấm điểm. Việc này chưa có người phụ trách.")
    assert {t["number"]: t["parentNumber"] for t in tasks(api, lan, ws)["tasks"]} == {1: None, 2: 1}


def test_should_let_owner_take_a_task_for_themself(team):
    api, lan, long, ws = team
    create(api, lan, ws, "tìm ý tưởng", unassigned=True)
    claimed = api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/claim", headers=lan)
    assert claimed.json()["assignee"]["displayName"] == "Lan"


def test_should_refuse_subtask_deeper_than_three_levels(team):
    api, lan, long, ws = team
    create(api, lan, ws, "cấp 1")
    create(api, lan, ws, "cấp 2", parentNumber=1)
    create(api, lan, ws, "cấp 3", parentNumber=2)
    r = create(api, lan, ws, "cấp 4", parentNumber=3)
    assert r.status_code == 400 and r.json()["error"]["code"] == "TOO_DEEP"
    assert create(api, lan, ws, "con", parentNumber=99).status_code == 404


def test_should_delete_subtasks_with_their_parent(team):
    api, lan, long, ws = team
    create(api, lan, ws, "cha")
    create(api, lan, ws, "con", parentNumber=1)
    create(api, lan, ws, "cháu", parentNumber=2)
    create(api, lan, ws, "việc khác")
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=lan).status_code == 204
    assert [t["number"] for t in tasks(api, lan, ws)["tasks"]] == [4]


def test_agent_context_names_the_parent_of_a_subtask(team):
    api, lan, long, ws = team
    create(api, lan, ws, "xây dựng runner")
    create(api, lan, ws, "viết bộ chấm điểm", parentNumber=1, assigneeId=user_id(api, lan))
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    body = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert "- việc 2 (thuộc việc 1): viết bộ chấm điểm (phụ trách: Lan)" in body["system"]


def reassign(api, h, ws, number, assignee_id):
    return api.patch(f"/api/v1/workspaces/{ws['id']}/tasks/{number}", headers=h,
                     json={"assigneeId": assignee_id, "changeAssignee": True})


def test_should_announce_when_the_owner_reassigns_a_task(team):
    api, lan, long, ws = team
    create(api, lan, ws, "dựng runner")
    r = reassign(api, lan, ws, 1, user_id(api, long))
    assert r.status_code == 200 and r.json()["assignee"]["displayName"] == "Long"
    assert chung(api, long, ws)[-1]["text"] == "Lan đã giao việc 1 cho Long: dựng runner."


def test_should_announce_when_the_owner_leaves_a_task_without_anyone(team):
    api, lan, long, ws = team
    create(api, lan, ws, "dựng runner", assigneeId=user_id(api, long))
    reassign(api, lan, ws, 1, None)
    assert chung(api, long, ws)[-1]["text"] == (
        "Lan đã bỏ người phụ trách việc 1: dựng runner. Việc này chưa có người phụ trách.")


def test_should_not_announce_an_edit_that_keeps_the_assignee(team):
    api, lan, long, ws = team
    create(api, lan, ws, "dựng runner")
    before = len(chung(api, lan, ws))
    api.patch(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=lan, json={"body": "dựng runner mới"})
    assert len(chung(api, lan, ws)) == before


def test_should_announce_when_a_member_claims_a_task(team):
    api, lan, long, ws = team
    create(api, lan, ws, "viết báo cáo", unassigned=True)
    api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/claim", headers=long)
    assert chung(api, lan, ws)[-1]["text"] == "Long đã nhận việc 1: viết báo cáo."


def test_should_refuse_a_member_reassigning_a_task(team):
    api, lan, long, ws = team
    create(api, lan, ws, "tìm paper", assigneeId=user_id(api, long))
    r = reassign(api, long, ws, 1, user_id(api, lan))
    assert r.status_code == 403 and r.json()["error"]["code"] == "FORBIDDEN"


# ---------- claim, hand back, per-task lock ----------


def test_should_start_a_claimed_task_and_hand_it_back_to_todo(team):
    api, lan, long, ws = team
    create(api, lan, ws, "viết báo cáo")
    claimed = claim(api, long, ws, 1).json()
    assert claimed["assignee"]["displayName"] == "Long" and claimed["status"] == "doing"
    assert api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/release", headers=lan).status_code == 403
    released = api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/release", headers=long).json()
    assert released["assignee"] is None and released["status"] == "todo"
    assert chung(api, lan, ws)[-1]["text"] == "Long đã bỏ nhận việc 1: viết báo cáo. Việc này đang chờ người nhận."


def test_locked_task_cannot_be_claimed_handed_back_edited_or_deleted_but_progress_moves(team):
    api, lan, long, ws = team
    create(api, lan, ws, "chạy runner")
    create(api, lan, ws, "viết báo cáo", assigneeId=user_id(api, long))
    lock = f"/api/v1/workspaces/{ws['id']}/tasks/{{}}/lock"
    assert api.put(lock.format(1), headers=long, json={"locked": True}).status_code == 403
    assert api.put(lock.format(1), headers=lan, json={"locked": True}).json()["locked"] is True
    assert chung(api, long, ws)[-1]["text"].startswith("Lan đã khóa việc 1: chạy runner.")
    assert claim(api, long, ws, 1).json()["error"]["code"] == "TASK_LOCKED"
    api.put(lock.format(2), headers=lan, json={"locked": True})
    assert api.post(f"/api/v1/workspaces/{ws['id']}/tasks/2/release", headers=long).json()["error"]["code"] == "TASK_LOCKED"
    assert reassign(api, lan, ws, 2, None).json()["error"]["code"] == "TASK_LOCKED"
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/tasks/2", headers=lan).json()["error"]["code"] == "TASK_LOCKED"
    assert create(api, lan, ws, "việc con", parentNumber=2).json()["error"]["code"] == "TASK_LOCKED"
    done = api.put(f"/api/v1/workspaces/{ws['id']}/tasks/2/status", headers=long, json={"status": "done"})
    assert done.status_code == 200 and done.json()["status"] == "done"
    assert api.put(lock.format(1), headers=lan, json={"locked": False}).json()["locked"] is False
    assert chung(api, long, ws)[-1]["text"] == "Lan đã mở khóa việc 1: chạy runner."
    assert claim(api, long, ws, 1).status_code == 200


def test_should_not_delete_a_parent_while_a_subtask_is_locked(team):
    api, lan, long, ws = team
    create(api, lan, ws, "cha")
    create(api, lan, ws, "con", parentNumber=1)
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/2/lock", headers=lan, json={"locked": True})
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=lan).json()["error"]["code"] == "TASK_LOCKED"
    assert len(tasks(api, lan, ws)["tasks"]) == 2


# ---------- deadlines ----------


def in_hours(hours: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def test_should_keep_a_future_deadline_and_refuse_a_past_one(team):
    api, lan, long, ws = team
    past = create(api, lan, ws, "nộp báo cáo", dueAt=in_hours(-1))
    assert past.status_code == 400 and past.json()["error"]["code"] == "DUE_IN_PAST"
    task = create(api, lan, ws, "nộp báo cáo", dueAt=in_hours(48)).json()
    assert task["dueAt"] is not None and task["isOverdue"] is False
    moved = api.patch(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=lan, json={"dueAt": None, "changeDueAt": True})
    assert moved.json()["dueAt"] is None


def test_should_announce_a_passed_deadline_once_and_again_after_a_new_deadline(team):
    api, lan, long, ws = team
    create(api, lan, ws, "nộp báo cáo", dueAt=in_hours(1), assigneeId=user_id(api, long))
    create(api, lan, ws, "việc đã xong", dueAt=in_hours(1), assigneeId=user_id(api, long))
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/2/status", headers=long, json={"status": "done"})
    later = datetime.now(timezone.utc) + timedelta(hours=2)
    with SessionLocal() as s:
        assert len(tk.notify_overdue(s, later)) == 1
        s.commit()
    assert chung(api, lan, ws)[-1]["text"] == (
        "Việc 1 đã quá hạn chót mà chưa xong: nộp báo cáo. Người phụ trách: Long.")
    with SessionLocal() as s:
        assert tk.notify_overdue(s, later) == []
    api.patch(f"/api/v1/workspaces/{ws['id']}/tasks/1", headers=lan, json={"dueAt": in_hours(3), "changeDueAt": True})
    with SessionLocal() as s:
        assert len(tk.notify_overdue(s, datetime.now(timezone.utc) + timedelta(hours=4))) == 1
        s.commit()


def test_agent_context_shows_the_deadline_of_a_task(team):
    api, lan, long, ws = team
    due = (datetime.now(timezone.utc) + timedelta(days=2)).replace(second=0, microsecond=0)
    create(api, lan, ws, "nộp báo cáo", dueAt=due.isoformat())
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    body = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert f"hạn {due.strftime('%Y-%m-%d %H:%M')} UTC" in body["system"]


def test_should_move_unclaimed_tasks_from_before_the_todo_column_to_todo(team):
    from app.ws import models as m
    from app.ws.migrate import start_unclaimed_tasks_as_todo

    api, lan, long, ws = team
    create(api, lan, ws, "việc cũ chưa ai nhận")
    create(api, lan, ws, "việc cũ đã có người", assigneeId=user_id(api, long))
    with SessionLocal() as s:
        for task in s.query(m.Task):
            task.status = "doing"
        s.commit()
        assert start_unclaimed_tasks_as_todo(s) == 1
    assert [t["status"] for t in tasks(api, lan, ws)["tasks"]] == ["todo", "doing"]
