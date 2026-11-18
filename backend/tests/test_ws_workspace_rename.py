"""Renaming a shared workspace (flow §7, §13): owner only, never the same name as another workspace they own."""

from test_ws import api, login, shared, team  # noqa: F401


def rename(api, h, ws, name):
    return api.patch(f"/api/v1/workspaces/{ws['id']}", headers=h, json={"name": name})


def test_should_let_owner_rename_workspace(team):
    api, lan, _, ws = team
    r = rename(api, lan, ws, "  Đồ án   Kiểm chứng 2 ")
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "Đồ án Kiểm chứng 2"


def test_should_refuse_rename_by_member(team):
    api, _, long, ws = team
    assert rename(api, long, ws, "Tên mới").status_code == 403


def test_should_refuse_empty_name(team):
    api, lan, _, ws = team
    assert rename(api, lan, ws, "   ").status_code == 400


def test_should_refuse_name_of_another_workspace_the_owner_holds(team):
    api, lan, _, ws = team
    other = shared(api, lan, name="Nhóm khác")
    r = rename(api, lan, ws, "nhóm KHÁC")
    assert r.status_code == 409 and r.json()["error"]["code"] == "NAME_TAKEN"
    assert rename(api, lan, other, "Nhóm khác").status_code == 200
