"""SpecGate Workspace against docs/flow.md (the version after SRS v0.2). Each test names the flow section it checks.
Runs with the fake agent: no network, no cost."""

from app.config import settings
from test_ws import GOOD_KEY, add_member, api, ask, hl, keep, login, post, send_quote, shared, team, with_key  # noqa: F401


# ---------- §1, §2 ----------


def test_s1_session_slides_and_home_page(api):
    h, first = login(api, "lan-pham", "Lan")
    assert first["redirect"].endswith("/chat/key?welcome=github")   # new account: key screen
    out = api.get("/api/v1/auth/session", headers=h).json()
    assert out["token"] and out["maxAgeSeconds"] == 30 * 86400 and out["home"] == "/"
    _, again = login(api, "lan-pham")
    assert again["redirect"] == "/"   # existing account: the home page, no automatic workspace


# ---------- §4 chat ----------


def test_s4_regenerate_and_history_window(api, monkeypatch):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    ask(api, h, conv["id"], "câu một")
    second = ask(api, h, conv["id"], "câu hai")["turn"]
    first_answer = api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()["turns"][1]
    assert api.post(f"/api/v1/conversations/{conv['id']}/turns/{first_answer['id']}/regenerate?stream=false",
                    headers=h).status_code == 409   # only the latest answer
    p = keep(api, h, conv["id"], second)
    r = api.post(f"/api/v1/conversations/{conv['id']}/turns/{second['id']}/regenerate?stream=false", headers=h)
    assert r.status_code == 200, r.text
    turns = api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()["turns"]
    assert [t["role"] for t in turns] == ["user", "assistant", "user", "assistant"] and turns[-1]["id"] != second["id"]
    # flow §4: the old answer stays as version 1 of 2, with its highlight; nothing is asked or deleted.
    assert turns[-1]["versions"] == [second["id"], turns[-1]["id"]] and turns[-1]["version"] == 2
    assert api.get("/api/v1/private-highlights", headers=h).json()["items"][0]["turnId"] == second["id"] and p
    shown = api.post(f"/api/v1/conversations/{conv['id']}/turns/{second['id']}/show", headers=h).json()["turns"]
    assert shown[-1]["id"] == second["id"] and shown[-1]["version"] == 1 and len(shown) == 4
    # Rename.
    assert api.patch(f"/api/v1/conversations/{conv['id']}", headers=h, json={"title": "Đổi tên"}).json()["title"] == "Đổi tên"
    # flow §4 open point 1: only the newest turns go back to the model.
    monkeypatch.setattr(settings, "conversation_history_turns_max", 2)
    assert "câu hỏi đầu tiên" in ask(api, h, conv["id"], "câu ba")["turn"]["text"]


def test_s4_stopped_answer_is_kept(api):
    from app.ws.routers.conversations import _save_answer

    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    me = api.get("/api/v1/me", headers=h).json()["user"]["id"]
    _save_answer(conv["id"], me, "claude-sonnet-5-5", "Phần đã viết", None, stopped=True)
    t = api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()["turns"][0]
    assert t["stopped"] is True and t["text"] == "Phần đã viết"


# ---------- §4 private highlights ----------


def test_s4_private_highlights_list_filter_edit_cleanup_limit(api, monkeypatch):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    out = ask(api, h, conv["id"], "Đề xuất giúp mình")
    answer, question = out["turn"], out["user"]
    a = keep(api, h, conv["id"], answer, color="yellow")
    b = keep(api, h, conv["id"], question, text="Đề xuất", color="pink")
    assert b["speaker"] == "Lan" and b["speakerKind"] == "human" and a["speaker"] == "Claude của Lan"
    assert [i["id"] for i in api.get("/api/v1/private-highlights?color=pink", headers=h).json()["items"]] == [b["id"]]
    assert api.get(f"/api/v1/private-highlights?conversationId={conv['id']}", headers=h).json()["total"] == 2
    edited = api.patch(f"/api/v1/private-highlights/{a['id']}", headers=h, json={"text": "Chữ Lan tự viết", "note": "ý hay"}).json()
    assert edited["edited"] is True and edited["note"] == "ý hay"
    cut = api.patch(f"/api/v1/private-highlights/{a['id']}", headers=h, json={"text": answer["text"][:10]}).json()
    assert cut["edited"] is False   # cutting is not editing
    # The conversation shows its marks; deleting it asks; "keep" is the default.
    assert api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()["highlightCount"] == 2
    assert api.post("/api/v1/private-highlights/cleanup", headers=h, json={}).status_code == 400
    assert api.post("/api/v1/private-highlights/cleanup", headers=h, json={"color": "pink"}).json()["deleted"] == 1
    monkeypatch.setattr(settings, "private_highlights_max", 1)
    full = api.post("/api/v1/private-highlights", headers=h,
                    json={"conversationId": conv["id"], "turnId": answer["id"], "text": answer["text"]})
    assert full.status_code == 409 and full.json()["error"]["code"] == "HIGHLIGHT_LIMIT"
    listing = api.get("/api/v1/private-highlights", headers=h).json()
    assert listing["nearLimit"] is True and listing["limit"] == 1
    api.delete(f"/api/v1/conversations/{conv['id']}?highlights=delete", headers=h)
    assert api.get("/api/v1/private-highlights", headers=h).json()["total"] == 0


def test_s6_conversation_summary_card(team):
    api, lan, long, ws = team
    conv = api.post("/api/v1/conversations", headers=long, json={}).json()
    assert api.post(f"/api/v1/conversations/{conv['id']}/summary", headers=long).status_code == 409   # nothing to summarize
    out = ask(api, long, conv["id"], "chi phí chạy thêm")
    summary = api.post(f"/api/v1/conversations/{conv['id']}/summary", headers=long)
    assert summary.status_code == 201
    sm = summary.json()
    assert sm["kind"] == "summary" and sm["sends"] == []   # saved, not sent
    attach = api.patch(f"/api/v1/private-highlights/{sm['id']}", headers=long,
                       json={"attachedTurnIds": [out["user"]["id"], out["turn"]["id"]]}).json()
    assert len(attach["attachedTurns"]) == 2
    msg = send_quote(api, long, ws, sm["id"])
    card = msg["cards"][0]
    assert card["kind"] == "conversation-summary" and card["title"] == "Tóm tắt hội thoại của Long"
    assert card["speakerLabel"] == "GPT của Long" and [t["role"] for t in card["turns"]] == ["user", "assistant"]
    # Lan highlights a piece of it: the speaker says whose summary and which agent wrote it.
    piece = card["text"].split("\n")[0][:12]
    h = hl(api, lan, ws, msg["id"], piece, part=0).json()
    assert h["segments"][0]["speaker"] == "Bản tóm tắt do GPT của Long viết (chưa lọc)" and h["segments"][0]["relayed"]
    # It is Long's own message: in his context, not highlightable by him.
    ctx = api.get(f"/api/v1/conversations/{api.post('/api/v1/conversations', headers=long, json={'workspaceId': ws['id']}).json()['id']}/context",
                  headers=long).json()
    assert "Tóm tắt hội thoại của Long" in ctx["system"]


# ---------- §7, §8, §14 ----------


def test_s7_workspace_name_unique_per_owner_and_limit(api, monkeypatch):
    h, _ = login(api, "lan-pham", "Lan")
    shared(api, h, name="Nhóm A")
    r = api.post("/api/v1/workspaces", headers=h, json={"name": "nhóm a", "brief": "x"})
    assert r.status_code == 409 and r.json()["error"]["code"] == "NAME_TAKEN"
    other, _ = login(api, "long-tran", "Long")
    shared(api, other, name="Nhóm A")   # another owner may use the same name
    monkeypatch.setattr(settings, "owned_workspaces_max", 1)
    r = api.post("/api/v1/workspaces", headers=h, json={"name": "Nhóm B", "brief": "x"})
    assert r.status_code == 409 and r.json()["error"]["code"] == "OWNED_LIMIT"


def test_s8_name_clash_asks_for_nickname_and_colors_are_unique(team):
    api, lan, long, ws = team
    lan2, _ = login(api, "lan-b", "Lan")
    add_member(api, lan, ws, lan2)
    me = api.get(f"/api/v1/workspaces/{ws['id']}", headers=lan2).json()
    assert me["needsNickname"] is True and me["myName"] == "Lan 2"
    taken = api.put(f"/api/v1/workspaces/{ws['id']}/members/me/nickname", headers=lan2, json={"nickname": "lan"})
    assert taken.status_code == 409 and taken.json()["error"]["code"] == "NAME_TAKEN"
    ok = api.put(f"/api/v1/workspaces/{ws['id']}/members/me/nickname", headers=lan2, json={"nickname": "Lan Phạm"})
    assert ok.json()["name"] == "Lan Phạm"
    team_ = api.get(f"/api/v1/workspaces/{ws['id']}/members", headers=lan).json()
    assert [t["user"]["displayName"] for t in team_] == ["Lan", "Long", "Lan Phạm"]
    assert len({t["user"]["color"] for t in team_}) == 3
    assert team_[1]["user"]["account"] == "GitHub: long-tran"
    with_key(api, lan2)
    msg = post(api, lan2, ws, "chào")[0]
    assert msg["senderName"] == "Lan Phạm" and msg["sender"]["displayName"] == "Lan Phạm"
