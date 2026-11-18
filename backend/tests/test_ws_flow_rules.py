"""SpecGate Workspace against the revised docs/flow.md: excerpt labels, answer versions, cross-workspace warning,
departed members' names, summary speakers, /pin choices, unread dots.
Runs with the fake agent: no network, no cost."""

from app.ws import service as sv
from test_ws import add_member, api, ask, hl, keep, login, post, send_quote, shared, team, with_key  # noqa: F401

ANSWER = "Không nên dùng phương pháp X vì tốn RAM. Hãy chạy thêm 40 tác vụ. Kết quả sẽ rõ hơn."


# ---------- §6 excerpt labels ----------


def test_excerpt_detection():
    # Whole sentences: plain label, only the "…" where the answer goes on.
    assert sv.excerpt(ANSWER, "Hãy chạy thêm 40 tác vụ.") == {"cutStart": True, "cutEnd": True, "partial": False}
    # Cut mid-sentence: flips the meaning, so it is marked.
    assert sv.excerpt(ANSWER, "nên dùng phương pháp X")["partial"] is True
    assert sv.excerpt(ANSWER, ANSWER) == {"cutStart": False, "cutEnd": False, "partial": False}
    # Deleting a word in the middle is editing, not cutting.
    assert sv.passage_status(ANSWER, ANSWER, "Không dùng phương pháp X vì tốn RAM.")["edited"] is True
    # A line of a list or a code block ends at the newline: a whole line is not "partial".
    md = "Các bước:\n- chạy HumanEval/38 với seed 0.842\n- so sánh"
    assert sv.excerpt(md, "chạy HumanEval/38 với seed 0.842")["partial"] is False


def _answer(api, h, ws_id=None):
    conv = api.post("/api/v1/conversations", headers=h, json={"workspaceId": ws_id} if ws_id else {}).json()
    from app.db import SessionLocal
    from app.ws import models as wm
    turn = ask(api, h, conv["id"], "Nên làm gì?")["turn"]
    with SessionLocal() as s:   # a fixed answer, so the cut points are known
        t = s.get(wm.Turn, turn["id"])
        t.text = ANSWER
        s.commit()
    return conv, {**turn, "text": ANSWER}


def test_cards_say_whole_partial_or_edited(team):
    api, lan, _, ws = team
    conv, turn = _answer(api, lan)
    whole = keep(api, lan, conv["id"], turn, "Hãy chạy thêm 40 tác vụ.")
    cut = keep(api, lan, conv["id"], turn, "nên dùng phương pháp X")
    assert cut["partial"] is True and whole["partial"] is False and whole["cutStart"] is True
    c1 = send_quote(api, lan, ws, whole["id"])["cards"][0]
    c2 = send_quote(api, lan, ws, cut["id"])["cards"][0]
    assert c1["speakerLabel"] == "Claude của Lan" and c1["cutStart"] and c1["cutEnd"]
    assert c2["speakerLabel"] == "Claude của Lan (trích một phần)"
    edited = keep(api, lan, conv["id"], turn, ANSWER)
    api.patch(f"/api/v1/private-highlights/{edited['id']}", headers=lan, json={"text": "Không dùng phương pháp X vì tốn RAM."})
    c3 = send_quote(api, lan, ws, edited["id"])["cards"][0]
    assert c3["speakerLabel"] == "Claude của Lan (Lan đã chỉnh)" and c3["edited"]


def test_agent_highlight_marks_cut_mid_sentence(team):
    api, lan, long, ws = team
    m = post(api, long, ws, "Không nên dùng phương pháp X vì tốn RAM.")[0]
    h = hl(api, lan, ws, m["id"], "dùng phương pháp X").json()
    assert h["segments"][0]["partial"] is True and h["segments"][0]["cutStart"]
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    system = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()["system"]
    assert 'Long nói (trích một phần): "…dùng phương pháp X…"' in system


# ---------- §4 versions ----------


def test_regenerate_keeps_versions_and_agent_reads_the_shown_one(api):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    first = ask(api, h, conv["id"], "câu một")["turn"]
    ph = keep(api, h, conv["id"], first)
    api.post(f"/api/v1/conversations/{conv['id']}/turns/{first['id']}/regenerate?stream=false", headers=h)
    again = api.post(f"/api/v1/conversations/{conv['id']}/turns/{first['id']}/regenerate", headers=h)
    assert again.status_code == 404   # an older version is not the latest answer any more
    full = api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()
    latest = full["turns"][-1]
    assert latest["versions"][0] == first["id"] and latest["version"] == 2 and len(full["turns"]) == 2
    # The highlight of version 1 is still there, and opening it shows version 1.
    assert full["turnVersions"][first["id"]] == latest["versions"][0]
    assert api.get("/api/v1/private-highlights", headers=h).json()["items"][0]["id"] == ph["id"]
    full = api.post(f"/api/v1/conversations/{conv['id']}/turns/{first['id']}/show", headers=h).json()
    assert full["turns"][-1]["id"] == first["id"]
    assert [x["turnId"] for x in full["highlights"]] == [first["id"]]


# ---------- §6 warning when sending to another group ----------


def test_sending_words_written_with_another_groups_context_asks_first(team):
    api, lan, long, ws = team
    other = shared(api, lan, name="Nhóm khác", brief="Việc khác")
    conv, turn = _answer(api, lan, ws["id"])
    p = keep(api, lan, conv["id"], turn, "Hãy chạy thêm 40 tác vụ.")
    assert p["contextWorkspaces"] == [{"id": ws["id"], "name": ws["name"]}]
    body = {"ids": [p["id"]], "workspaceId": other["id"], "channelId": "chung"}
    r = api.post("/api/v1/private-highlights/send", headers=lan, json=body)
    assert r.status_code == 409 and r.json()["error"]["code"] == "OTHER_CONTEXT" and ws["name"] in r.json()["error"]["message"]
    assert api.post("/api/v1/private-highlights/send", headers=lan, json={**body, "confirmContext": True}).status_code == 201
    # Same group: no question. Through "@ Highlight của tôi" in a channel: same check.
    assert send_quote(api, lan, ws, p["id"])["cards"]
    r = api.post(f"/api/v1/workspaces/{other['id']}/channels/chung/messages", headers=lan,
                 json={"text": "xem", "quoteIds": [p["id"]], "confirm": True})
    assert r.status_code == 409 and r.json()["error"]["code"] == "OTHER_CONTEXT"


# ---------- §14 names of people who left ----------


def test_left_member_name_is_reserved_and_shown_as_left(team):
    api, lan, long, ws = team
    msg = post(api, long, ws, "Ý của Long")[0]
    hl(api, lan, ws, msg["id"], "Ý của Long")
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/members/me", headers=lan).status_code == 409   # the owner stays
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/members/me", headers=long).status_code == 204
    assert api.get(f"/api/v1/workspaces/{ws['id']}", headers=long).status_code == 403
    msgs = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan).json()["messages"]
    assert next(x for x in msgs if x["id"] == msg["id"])["senderName"] == "Long (đã rời)"
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    assert 'Long (đã rời) nói: "Ý của Long"' in api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()["system"]
    # Another "Long" cannot take the name.
    other, _ = login(api, "long-nguyen", "Long")
    add_member(api, lan, ws, other)
    team_now = api.get(f"/api/v1/workspaces/{ws['id']}/members", headers=lan).json()
    newcomer = next(t for t in team_now if t["user"]["accountName"] == "Long")
    assert newcomer["user"]["displayName"] == "Long 2" and newcomer["needsNickname"]
    assert api.put(f"/api/v1/workspaces/{ws['id']}/members/me/nickname", headers=other, json={"nickname": "Long"}).status_code == 409
    # The same account coming back gets its name back.
    add_member(api, lan, ws, long)
    msgs = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan).json()["messages"]
    assert next(x for x in msgs if x["id"] == msg["id"])["senderName"] == "Long"


def test_owner_removes_member(team):
    api, lan, long, ws = team
    me = api.get("/api/v1/me", headers=long).json()["user"]["id"]
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/members/{me}", headers=long).status_code == 403
    assert api.delete(f"/api/v1/workspaces/{ws['id']}/members/{me}", headers=lan).status_code == 204
    assert [w["id"] for w in api.get("/api/v1/me", headers=long).json()["workspaces"]] == []


# ---------- §6, §12 summary speakers ----------


def test_channel_summary_highlight_is_relayed_words(team):
    api, lan, long, ws = team
    post(api, long, ws, "Long muốn chạy thêm")
    summary = post(api, lan, ws, "/summarize")[-1]
    assert summary["senderKind"] == "agent"
    h = hl(api, long, ws, summary["id"], summary["text"].split("\n")[0][:20]).json()
    seg = h["segments"][0]
    assert seg["speaker"] == "Bản tóm tắt kênh do Claude của Lan viết (chưa lọc)" and seg["relayed"]
    conv = api.post("/api/v1/conversations", headers=long, json={"workspaceId": ws["id"]}).json()
    system = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=long).json()["system"]
    assert "lời thuật lại" in system


def test_attached_turn_of_a_summary_keeps_its_own_speaker(team):
    api, lan, long, ws = team
    conv = api.post("/api/v1/conversations", headers=long, json={}).json()
    ask(api, long, conv["id"], "Chạy thêm có tốn không?")
    sm = api.post(f"/api/v1/conversations/{conv['id']}/summary", headers=long).json()
    turns = api.get(f"/api/v1/conversations/{conv['id']}", headers=long).json()["turns"]
    api.patch(f"/api/v1/private-highlights/{sm['id']}", headers=long, json={"attachedTurnIds": [t["id"] for t in turns]})
    msg = send_quote(api, long, ws, sm["id"])
    seg = {"messageId": msg["id"], "text": "Chạy thêm có tốn không?", "part": 0, "turn": 0}
    h = api.post(f"/api/v1/workspaces/{ws['id']}/channels/chung/highlights", headers=lan,
                 json={"segments": [seg], "label": "important"}).json()
    assert h["segments"][0]["speaker"] == "Long" and not h["segments"][0].get("relayed")


# ---------- §9 command list ----------


def test_paper_commands_are_unknown_and_help_follows_the_flow_order(team):
    api, lan, _, ws = team
    assert "modules" not in api.get(f"/api/v1/workspaces/{ws['id']}", headers=lan).json()
    assert post(api, lan, ws, "/stats")[-1]["text"] == "Không có lệnh /stats. Gõ /help để xem danh sách lệnh."
    usages = [c["usage"].split()[0] for c in post(api, lan, ws, "/help")[-1]["attachment"]["commands"]]
    assert usages == ["/idea", "/note", "/pin", "/decide", "/summarize", "/brief", "/task", "/help"]


# ---------- §11 /pin ----------


def test_pin_asks_which_part_and_keeps_voices_apart(team):
    api, lan, long, ws = team
    conv, turn = _answer(api, lan)
    p = keep(api, lan, conv["id"], turn, "Hãy chạy thêm 40 tác vụ.")
    msg = api.post(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan,
                   json={"text": "Mọi người xem hướng này", "quoteIds": [p["id"]]}).json()["messages"][0]
    r = api.post(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long,
                 json={"text": "/pin", "replyToId": msg["id"]})
    assert r.status_code == 409 and r.json()["error"]["code"] == "PIN_CHOICE"
    post(api, long, ws, "/pin", replyToId=msg["id"], pinPart="card")
    post(api, long, ws, "/pin", replyToId=msg["id"], pinPart="text")
    post(api, long, ws, "/pin", replyToId=msg["id"], pinPart="both")
    items = api.get(f"/api/v1/workspaces/{ws['id']}/board", headers=lan).json()["columns"][0]["items"]
    card, text, both = items
    assert card["authorName"] == "Claude của Lan" and card["body"] == "Hãy chạy thêm 40 tác vụ."
    assert text["authorName"] == "Lan" and text["body"] == "Mọi người xem hướng này"
    assert [x["speaker"] for x in both["parts"]] == ["Lan", "Claude của Lan nói"]
    # A message with only words is pinned straight away.
    plain = post(api, long, ws, "Ý riêng của Long")[0]
    post(api, lan, ws, "/pin", replyToId=plain["id"])


# ---------- §2 unread dots ----------


def test_rail_dots_unread_mention_and_requests(team):
    api, lan, long, ws = team
    rail = lambda h: api.get("/api/v1/me/badges", headers=h).json()["workspaces"][0]  # noqa: E731
    assert rail(lan)["unread"] is False
    post(api, long, ws, "Chào cả nhóm")
    assert rail(lan)["unread"] is True and rail(lan)["mentioned"] is False and rail(long)["unread"] is False
    post(api, long, ws, "@Lan xem giúp")
    assert rail(lan)["mentioned"] is True
    api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan)   # opening the channel reads it
    assert rail(lan)["unread"] is False and rail(lan)["mentioned"] is False
    newcomer, _ = login(api, "khang", "Khang")
    api.post("/api/v1/join-requests", headers=newcomer, json={"code": ws["joinCode"]})
    assert rail(lan)["pendingRequests"] == 1 and rail(long)["pendingRequests"] == 0
    chans = api.get(f"/api/v1/workspaces/{ws['id']}", headers=lan).json()["channels"]
    assert chans[0]["unread"] is False
