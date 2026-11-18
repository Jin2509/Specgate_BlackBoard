"""Task board of a shared workspace (flow §13): assign and claim, /task, lock, leaving members, agent context."""

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


def test_should_create_task_in_own_name_and_announce_it(team):
    api, lan, long, ws = team
    r = create(api, long, ws, "tìm paper về phương pháp đánh giá")
    assert r.status_code == 201 and r.json()["number"] == 1 and r.json()["assignee"]["displayName"] == "Long"
    assert chung(api, lan, ws)[-1]["text"] == "Long tự nhận việc 1: tìm paper về phương pháp đánh giá."


def test_should_refuse_member_assigning_others_and_let_owner_assign(team):
    api, lan, long, ws = team
    lan_id, long_id = user_id(api, lan), user_id(api, long)
    assert create(api, long, ws, "dựng khung", assigneeId=lan_id).status_code == 403
    assert create(api, long, ws, "dựng khung", unassigned=True).status_code == 403
    assert create(api, lan, ws, "dựng runner", assigneeId=long_id).json()["assignee"]["displayName"] == "Long"
    assert chung(api, long, ws)[-1]["text"] == "Lan đã giao việc 1 cho Long: dựng runner."


def test_should_let_member_claim_unassigned_task_once(team):
    api, lan, long, ws = team
    create(api, lan, ws, "viết báo cáo", unassigned=True)
    assert api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/claim", headers=long).json()["assignee"]["displayName"] == "Long"
    r = api.post(f"/api/v1/workspaces/{ws['id']}/tasks/1/claim", headers=lan)
    assert r.status_code == 409 and r.json()["error"]["code"] == "TASK_TAKEN"


def test_task_command_assigns_with_mention_for_owner_only(team):
    api, lan, long, ws = team
    assert post(api, lan, ws, "/task @Long dựng runner cho ý 4")[-1]["text"] == "Lan đã giao việc 1 cho Long: dựng runner cho ý 4."
    refused = post(api, long, ws, "/task @Lan dựng khung")[-1]["text"]
    assert refused.startswith("Chỉ chủ workspace giao việc cho người khác")
    assert post(api, long, ws, "/task chạy lại dataset")[-1]["text"] == "Long tự nhận việc 2: chạy lại dataset."
    assert post(api, long, ws, "/task")[-1]["text"].startswith("Cách dùng: /task")
    assert [t["number"] for t in tasks(api, lan, ws)["tasks"]] == [1, 2]


def test_locked_board_blocks_changes_but_assignee_can_finish(team):
    api, lan, long, ws = team
    create(api, long, ws, "chạy runner")
    assert api.put(f"/api/v1/workspaces/{ws['id']}/tasks/lock", headers=long, json={"locked": True}).status_code == 403
    assert api.put(f"/api/v1/workspaces/{ws['id']}/tasks/lock", headers=lan, json={"locked": True}).json()["locked"] is True
    assert chung(api, long, ws)[-1]["text"].startswith("Lan đã khóa bảng phân công.")
    assert create(api, long, ws, "việc mới").json()["error"]["code"] == "TASKS_LOCKED"
    assert post(api, long, ws, "/task việc mới")[-1]["text"].startswith("Bảng phân công đang khóa.")
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
    post(api, long, ws, "/task việc A")
    post(api, long, ws, "/task việc B")
    post(api, long, ws, "/task việc C")
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/2/status", headers=long, json={"status": "done"})
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/lock", headers=lan, json={"locked": True})
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/members/me", headers=long).status_code == 204
    board = {t["number"]: t for t in tasks(api, lan, ws)["tasks"]}
    assert board[1]["assignee"] is None and board[3]["assignee"] is None
    assert board[2]["assignee"]["displayName"] == "Long (đã rời)"
    assert chung(api, lan, ws)[-1]["text"] == "Long đã rời workspace. Việc 1 và việc 3 hiện chưa có người phụ trách."


def test_removed_member_notice_names_the_removal(team):
    api, lan, long, ws = team
    api.delete(f"/api/v1/workspaces/{ws['id']}/members/{user_id(api, long)}", headers=lan)
    assert chung(api, lan, ws)[-1]["text"] == "Long đã bị chủ workspace xóa khỏi workspace."


def test_agent_context_carries_unfinished_tasks_only(team):
    api, lan, long, ws = team
    post(api, long, ws, "/task chạy dataset")
    create(api, lan, ws, "viết báo cáo", unassigned=True)
    create(api, lan, ws, "dựng khung")
    api.put(f"/api/v1/workspaces/{ws['id']}/tasks/3/status", headers=lan, json={"status": "done"})
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    body = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert [t["number"] for t in body["context"]["tasks"]] == [1, 2]
    assert "- việc 1: chạy dataset (phụ trách: Long)" in body["system"]
    assert "- việc 2: viết báo cáo (phụ trách: chưa có người phụ trách)" in body["system"]
    assert "dựng khung" not in body["system"]
