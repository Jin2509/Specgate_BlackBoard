"""SpecGate Workspace API against docs/SRS.md v0.2. Each test names the requirement it checks.
Runs with the deterministic fake agent (LLM_FAKE): no network, no cost."""

import json

import pytest

from app.config import settings
from app.db import SessionLocal
from app.ws import models as wm
from app.ws import providers as pv

GOOD_KEY = "sk-test-aaaaaaaaaaaaaaaaaaaa1234"


@pytest.fixture()
def api(client, monkeypatch):
    monkeypatch.setattr(settings, "llm_fake", True)
    monkeypatch.setattr(settings, "auth_dev_login", True)
    return client


def login(c, login_, name=None, provider="github"):
    r = c.post("/api/v1/auth/dev-sessions", json={"provider": provider, "login": login_, "displayName": name})
    assert r.status_code == 201, r.text
    c.cookies.clear()   # every test call authenticates with its Bearer token
    return {"Authorization": f"Bearer {r.json()['token']}"}, r.json()


def with_key(c, h, provider="anthropic", **kw):
    r = c.put("/api/v1/me/key", headers=h, json={"provider": provider, "apiKey": GOOD_KEY, **kw})
    assert r.status_code == 200, r.text
    return r.json()


def shared(c, h, name="Đồ án Kiểm chứng", brief="Chọn đề tài", visibility="discoverable"):
    r = c.post("/api/v1/workspaces", headers=h, json={"name": name, "brief": brief, "visibility": visibility})
    assert r.status_code == 201, r.text
    return r.json()


def add_member(c, owner_h, ws, h):
    r = c.post("/api/v1/join-requests", headers=h, json={"code": ws["joinCode"]})
    assert r.status_code == 201, r.text
    assert c.patch(f"/api/v1/join-requests/{r.json()['id']}", headers=owner_h, json={"status": "approved"}).status_code == 200


def post(c, h, ws, text, ch="chung", **kw):
    r = c.post(f"/api/v1/workspaces/{ws['id']}/channels/{ch}/messages", headers=h, json={"text": text, **kw})
    assert r.status_code == 201, r.text
    return r.json()["messages"]


def hl(c, h, ws, msg_id, text, label="important", ch="chung", part=None, note=None):
    seg = {"messageId": msg_id, "text": text, **({"part": part} if part is not None else {})}
    return c.post(f"/api/v1/workspaces/{ws['id']}/channels/{ch}/highlights", headers=h,
                  json={"segments": [seg], "label": label, **({"note": note} if note else {})})


def keep(c, h, conv_id, turn, text=None, color="yellow"):
    r = c.post("/api/v1/private-highlights", headers=h,
               json={"conversationId": conv_id, "turnId": turn["id"], "text": text or turn["text"], "color": color})
    assert r.status_code == 201, r.text
    return r.json()


def send_quote(c, h, ws, ph_id, ch="chung", **kw):
    r = c.post("/api/v1/private-highlights/send", headers=h,
               json={"ids": [ph_id], "workspaceId": ws["id"], "channelId": ch, **kw})
    assert r.status_code == 201, r.text
    return r.json()


def ask(c, h, conv_id, text):
    r = c.post(f"/api/v1/conversations/{conv_id}/turns?stream=false", headers=h, json={"text": text})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture()
def team(api):
    """Lan owns the workspace (Claude), Long is a member (DeepSeek-style key), like the UI's demo data."""
    lan, _ = login(api, "lan-pham", "Lan")
    long, _ = login(api, "long-tran", "Long")
    with_key(api, lan)
    with_key(api, long, provider="openai-compatible", baseUrl="https://api.deepseek.com/v1")
    ws = shared(api, lan)
    add_member(api, lan, ws, long)
    return api, lan, long, ws


# ---------- UC01 ----------


def test_fr01_requires_login(api):
    assert api.get("/api/v1/me").status_code == 401
    assert api.get("/api/v1/conversations", headers={"Authorization": "Bearer forged.token"}).status_code == 401


def test_fr03_fr04_signup_creates_once(api):
    h, first = login(api, "trang@example.edu", "Trang", provider="google")
    assert first["created"] is True and first["redirect"].endswith("/chat/key?welcome=google")
    me = api.get("/api/v1/me", headers=h).json()
    assert me["personalWorkspaceId"] and me["key"] is None and me["workspaces"] == []
    _, again = login(api, "TRANG@example.edu", provider="google")
    assert again["created"] is False and again["user"]["id"] == first["user"]["id"]
    # Same login on the other provider is a different identity.
    _, gh = login(api, "trang", "Trang GH")
    assert gh["user"]["id"] != first["user"]["id"]


def test_fr02_validation_and_unknown_signin(api):
    r = api.post("/api/v1/auth/dev-sessions", json={"provider": "github", "login": "bad login!"})
    assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_LOGIN"
    r = api.post("/api/v1/auth/dev-sessions", json={"provider": "google", "login": "new@x.com"})
    assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_NAME"
    assert api.post("/api/v1/auth/dev-sessions", json={"provider": "facebook", "login": "a"}).status_code == 400


def test_fr05_cookie_session_and_logout(api):
    r = api.post("/api/v1/auth/dev-sessions", json={"provider": "github", "login": "lan-pham", "displayName": "Lan"})
    assert "sg_session" in r.cookies
    assert api.get("/api/v1/me").status_code == 200
    api.delete("/api/v1/auth/session")
    assert api.get("/api/v1/me").status_code == 401


def test_oauth_cancel_goes_back_to_login(api):
    r = api.get("/api/v1/auth/github/callback?error=access_denied", follow_redirects=False)
    assert r.status_code == 302 and "/login?error=cancelled" in r.headers["location"]
    assert api.get("/api/v1/auth/google/start", follow_redirects=False).status_code == 501   # not configured in tests


def test_home_reopens_last_workspace(team):
    """flow §2: signing in lands on the home page; "Vào làm việc với nhóm" opens the workspace used last."""
    api, lan, _, ws = team
    assert api.put("/api/v1/me/last-workspace", headers=lan, json={"workspaceId": ws["id"]}).status_code == 204
    _, again = login(api, "lan-pham")
    assert again["redirect"] == "/"
    assert api.get("/api/v1/me", headers=lan).json()["lastSharedPath"] == f"/w/{ws['id']}/c/chung"


# ---------- UC02 ----------


def test_fr10_fr14_key_saved_encrypted_last4_only(api):
    h, _ = login(api, "lan-pham", "Lan")
    out = with_key(api, h, provider="openai-compatible", baseUrl="https://openrouter.ai/api/v1/v1/")
    assert out["key"]["keyLast4"] == "1234" and out["key"]["baseUrl"] == "https://openrouter.ai/api/v1/v1"
    assert GOOD_KEY not in json.dumps(out) and GOOD_KEY not in api.get("/api/v1/me", headers=h).text
    with SessionLocal() as s:
        row = s.get(wm.ProviderKey, api.get("/api/v1/me", headers=h).json()["user"]["id"])
        assert GOOD_KEY.encode() not in row.secret
    assert "ChatGPT Plus" in api.get("/api/v1/me/key", headers=h).json()["note"]   # FR-13


def test_fr11_verify_returns_models(api):
    h, _ = login(api, "lan-pham", "Lan")
    r = api.post("/api/v1/me/key/verify", headers=h, json={"provider": "anthropic", "apiKey": GOOD_KEY})
    assert r.status_code == 200 and "claude-sonnet-5-5" in r.json()["models"]
    assert api.get("/api/v1/me", headers=h).json()["key"] is None   # verify stores nothing


@pytest.mark.parametrize("key,code", [("short", "KEY_INVALID_KEY"), ("sk-test-bbbbbbbbbbbbbbbb0000", "KEY_QUOTA")])
def test_fr12_bad_key_not_saved(api, key, code):
    h, _ = login(api, "lan-pham", "Lan")
    r = api.put("/api/v1/me/key", headers=h, json={"provider": "anthropic", "apiKey": key})
    assert r.status_code == 400 and r.json()["error"]["code"] == code and r.json()["error"]
    assert key not in r.text
    assert api.get("/api/v1/me", headers=h).json()["key"] is None


def test_bad_base_url(api, monkeypatch):
    h, _ = login(api, "lan-pham", "Lan")
    r = api.put("/api/v1/me/key", headers=h, json={"provider": "openai-compatible", "apiKey": GOOD_KEY, "baseUrl": "ftp://x"})
    assert r.status_code == 400 and r.json()["error"]["code"] == "KEY_BAD_URL"


def test_fr19_choose_model_and_label(api):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    assert api.patch("/api/v1/me/key", headers=h, json={"model": "not-a-model"}).status_code == 400
    r = api.patch("/api/v1/me/key", headers=h, json={"model": "claude-opus-5-5"})
    agent = r.json()["agent"]
    assert agent["label"] == "Claude của Lan" and agent["model"] == "claude-opus-5-5"


# ---------- UC03 ----------


def test_fr15_fr16_conversation_lifecycle(api):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    first = ask(api, h, conv["id"], "Câu hỏi một")
    assert "câu hỏi đầu tiên" in first["turn"]["text"]
    second = ask(api, h, conv["id"], "Câu hỏi hai")
    assert "giữ 1 câu hỏi trước" in second["turn"]["text"]   # history is sent
    full = api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()
    assert full["title"] == "Câu hỏi một" and [t["role"] for t in full["turns"]] == ["user", "assistant"] * 2
    assert [c["id"] for c in api.get("/api/v1/conversations", headers=h).json()] == [conv["id"]]
    assert api.delete(f"/api/v1/conversations/{conv['id']}", headers=h).status_code == 204
    assert api.get(f"/api/v1/conversations/{conv['id']}", headers=h).status_code == 404


def test_fr17_stream_events(api):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    with api.stream("POST", f"/api/v1/conversations/{conv['id']}/turns", headers=h, json={"text": "Xin chào"}) as r:
        assert r.headers["content-type"].startswith("text/event-stream")
        events = [line[7:] for line in r.iter_lines() if line.startswith("event: ")]
    assert events[0] == "user" and events.count("delta") > 3 and events[-1] == "done"
    assert len(api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()["turns"]) == 2


def test_uc03_provider_error_keeps_question(api):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    out = ask(api, h, conv["id"], "Hỏi [fake-error]")
    assert out["error"]["code"] == "quota" and "hạn mức" in out["turn"]["text"]
    turns = api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()["turns"]
    assert turns[0]["text"] == "Hỏi [fake-error]" and turns[1]["error"] == "quota"
    # The error notice is not history; the unanswered question is merged into the next one.
    nxt = ask(api, h, conv["id"], "Lại")
    assert "error" not in nxt and "câu hỏi đầu tiên" in nxt["turn"]["text"]


def test_no_key_cannot_chat(api):
    h, _ = login(api, "lan-pham", "Lan")
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    r = api.post(f"/api/v1/conversations/{conv['id']}/turns?stream=false", headers=h, json={"text": "hi"})
    assert r.status_code == 409 and r.json()["error"]["code"] == "NO_KEY"


def test_fr18_nfr04_conversation_private(team):
    api, lan, long, _ = team
    conv = api.post("/api/v1/conversations", headers=lan, json={}).json()
    for method, path in [("GET", ""), ("GET", "/context"), ("DELETE", ""), ("PATCH", "")]:
        r = api.request(method, f"/api/v1/conversations/{conv['id']}{path}", headers=long, json={} if method == "PATCH" else None)
        assert r.status_code == 404
    assert api.get("/api/v1/conversations", headers=long).json() == []


# ---------- UC04 / FR-25-FR-27 ----------


def test_fr25_link_unlink_and_members_only(team):
    api, lan, long, ws = team
    trang, _ = login(api, "trang@example.edu", "Trang", provider="google")
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    assert conv["linked"] and conv["workspace"]["name"] == ws["name"]
    assert not api.patch(f"/api/v1/conversations/{conv['id']}", headers=lan, json={"workspaceId": None}).json()["linked"]
    t_conv = api.post("/api/v1/conversations", headers=trang, json={}).json()
    r = api.patch(f"/api/v1/conversations/{t_conv['id']}", headers=trang, json={"workspaceId": ws["id"]})
    assert r.status_code == 403 and r.json()["error"]["code"] == "NOT_MEMBER"


def test_fr26_group_context_contents(team):
    api, lan, long, ws = team
    api.put(f"/api/v1/workspaces/{ws['id']}/members/me/team-role", headers=lan, json={"teamRole": "Dựng khung"})
    api.put(f"/api/v1/workspaces/{ws['id']}/members/me/team-role", headers=long, json={"teamRole": "Runner"})
    lan_msg = post(api, lan, ws, "Tin của Lan")[0]
    long_msg = post(api, long, ws, "Long đề xuất dùng HumanEval", replyToId=lan_msg["id"])[0]
    post(api, long, ws, "Tin khác của Long không được highlight")
    post(api, lan, ws, "Lan trả lời sau", replyToId=long_msg["id"])
    post(api, lan, ws, "/idea Dùng Z3")
    post(api, lan, ws, "/idea Dùng Coq")
    post(api, lan, ws, "/decide #1 chốt nhanh và đủ")
    post(api, lan, ws, "/decide #2 loại quá nặng")
    hl(api, lan, ws, long_msg["id"], "dùng HumanEval", note="hỏi lại số seed")

    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    out = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    ctx, system = out["context"], out["system"]
    assert ctx["workspace"]["brief"] == "Chọn đề tài" and ctx["myTeamRole"] == "Dựng khung"
    assert {t["teamRole"] for t in ctx["team"]} == {"Dựng khung", "Runner"}
    assert {t["agent"]["model"] for t in ctx["team"]} == {"claude-sonnet-5-5", "gpt-6-luna"}
    assert [d["reason"] for d in ctx["decided"]] == ["nhanh và đủ"] and ctx["rejected"][0]["reason"] == "quá nặng"
    # flow §5: own messages and highlights in one timeline, in time order, with reply targets.
    kinds = [(x["kind"], x.get("text") or x["segments"][0]["text"]) for x in ctx["timeline"]][:3]
    assert kinds == [("own", "Tin của Lan"), ("highlight", "dùng HumanEval"), ("own", "Lan trả lời sau")]
    assert ctx["timeline"][2]["replyTo"]["speaker"] == "Long"
    own_texts = [x["text"] for x in ctx["timeline"] if x["kind"] == "own"]
    assert not any("Long" in t for t in own_texts)
    hl0 = ctx["highlights"][0]
    assert hl0["segments"][0]["speaker"] == "Long" and hl0["note"] == "hỏi lại số seed"
    # Nothing else of anyone else goes to the model.
    assert "Tin khác của Long" not in system and 'Long nói (trích một phần): "…dùng HumanEval"' in system and "Runner" in system
    assert "chưa phải quyết định của nhóm" in system and "Dùng Coq" in system and "hỏi lại số seed" in system
    assert "trả lời tin của Long" in system


def test_nfr07_old_messages_summarized_only_when_pressed(team, monkeypatch):
    """flow §5: past the limit the oldest own messages are left out and the panel says how many; nothing is
    summarized on its own. "Tóm tắt tin cũ" makes ONE call, in blocks cut at the highlights in between; a short block
    stays word for word. Highlights are never cut."""
    api, lan, long, ws = team
    monkeypatch.setattr(settings, "context_own_messages_max", 3)
    monkeypatch.setattr(settings, "digest_block_min", 3)
    for i in range(3):
        post(api, lan, ws, f"tin {i}")
    x = post(api, long, ws, "Long phản biện")[0]
    assert hl(api, lan, ws, x["id"], "Long phản biện", label="review").status_code == 201
    for i in range(3, 8):
        post(api, lan, ws, f"tin {i}")
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    ctx = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()["context"]
    assert [x["text"] for x in ctx["timeline"] if x["kind"] == "own"] == ["tin 5", "tin 6", "tin 7"]
    assert ctx["ownMessagesOmitted"] == 5 and ctx["digestPending"] is True and ctx["digest"] is None
    # Shown before it runs: 5 messages, 2 blocks (cut at Long's highlighted message), one summarized, one call.
    assert ctx["digestPlan"] == {"messages": 5, "blocks": 2, "summarizedBlocks": 1, "verbatimMessages": 2, "calls": 1}
    calls = []
    real = pv.complete

    async def counting(*a, **k):
        calls.append(a[2])
        return await real(*a, **k)

    monkeypatch.setattr(pv, "complete", counting)
    ask(api, lan, conv["id"], "tiếp")   # asking never summarizes
    assert len(calls) == 1 and "=== KHỐI" not in calls[0]
    calls.clear()
    r = api.post(f"/api/v1/conversations/{conv['id']}/context/digest", headers=lan)
    assert r.status_code == 200, r.text
    assert len(calls) == 1   # one call for every block
    ctx = r.json()["context"]
    assert ctx["ownMessagesOmitted"] == 0 and ctx["digest"]["count"] == 5
    order = [(t["kind"], t.get("text") if t["kind"] != "highlight" else "hl") for t in ctx["timeline"]]
    assert order[0][0] == "digest" and order[1] == ("highlight", "hl")
    assert order[2:4] == [("own", "tin 3"), ("own", "tin 4")]   # the short block after the highlight, word for word
    system = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()["system"]
    assert "Tóm tắt giả của khối 1" in system and "Tóm tắt tin của tôi, từ" in system
    saved = api.post("/api/v1/private-highlights/from-digest", headers=lan, json={"workspaceId": ws["id"]})
    assert saved.status_code == 201 and saved.json()["kind"] == "digest"
    # A provider error keeps the old digest and says so.
    for i in range(8, 14):
        post(api, lan, ws, f"tin {i}")

    async def broken(*a, **k):
        raise pv.ProviderError("quota", "Key đã hết tiền.")

    monkeypatch.setattr(pv, "complete", broken)
    r = api.post(f"/api/v1/conversations/{conv['id']}/context/digest", headers=lan)
    assert r.status_code == 502 and "hết tiền" in r.json()["error"]["message"]
    ctx = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()["context"]
    assert ctx["digest"]["count"] == 5 and ctx["ownMessagesOmitted"] == 6


def test_context_lost_after_leaving_is_not_sent(team):
    api, lan, long, ws = team
    conv = api.post("/api/v1/conversations", headers=long, json={"workspaceId": ws["id"]}).json()
    with SessionLocal() as s:
        s.query(wm.Member).filter_by(workspace_id=ws["id"], role="member").delete()
        s.commit()
    out = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=long).json()
    assert out["linked"] is False and "Ngữ cảnh nhóm" not in out["system"]


# ---------- UC05 ----------


def test_fr28_fr29_send_answer_to_channel(team):
    """flow §6: save, review, then send. The card names the speaker; editing the agent's words is marked."""
    api, lan, long, ws = team
    conv = api.post("/api/v1/conversations", headers=lan, json={}).json()   # no group context needed to send
    turn = ask(api, lan, conv["id"], "Hỏi runner giúp")["turn"]
    assert turn["postAs"] == "Claude của Lan"
    assert api.post(f"/api/v1/conversations/{conv['id']}/send-to-channel", headers=lan, json={}).status_code in (404, 405)
    cut = turn["text"].split(" ")[0]
    p1 = keep(api, lan, conv["id"], turn, text=cut)
    assert p1["speaker"] == "Claude của Lan" and p1["edited"] is False and p1["sends"] == []
    # Path 1: from the list, with a last edit -> "(Lan đã chỉnh)". Commands in the text are not run (BR-08).
    msg = send_quote(api, lan, ws, p1["id"], text="Mọi người xem", overrides={p1["id"]: "/decide #1 chốt đoạn đã lọc"})
    card = msg["cards"][0]
    assert msg["senderKind"] == "human" and msg["senderName"] == "Lan" and card["kind"] == "quote"
    assert card["speakerLabel"] == "Claude của Lan (Lan đã chỉnh)" and card["model"] == "claude-sonnet-5-5"
    board = api.get(f"/api/v1/workspaces/{ws['id']}/board", headers=lan).json()
    assert board["columns"][2]["items"] == []
    # Sending again to the same channel asks first.
    r = api.post("/api/v1/private-highlights/send", headers=lan, json={"ids": [p1["id"]], "workspaceId": ws["id"], "channelId": "chung"})
    assert r.status_code == 409 and r.json()["error"]["code"] == "ALREADY_SENT"
    # Path 2: "@ Highlight của tôi" in the composer; the model at save time is kept after switching models.
    api.patch("/api/v1/me/key", headers=lan, json={"model": "claude-opus-5-5"})
    p2 = keep(api, lan, conv["id"], turn, color="pink")
    m2 = post(api, lan, ws, "Long ơi xem giúp", quoteIds=[p2["id"]])[0]
    assert m2["text"] == "Long ơi xem giúp" and m2["cards"][0]["speakerLabel"] == "Claude của Lan"
    assert m2["cards"][0]["model"] == "claude-sonnet-5-5"
    listing = api.get("/api/v1/private-highlights", headers=lan).json()
    assert {len(i["sends"]) for i in listing["items"]} == {1}
    # The card is a snapshot: deleting the highlight leaves it.
    api.delete(f"/api/v1/private-highlights/{p2['id']}", headers=lan)
    msgs = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long).json()["messages"]
    assert [x["cards"][0]["text"] for x in msgs if x.get("cards")][-1] == p2["text"]


def test_uc05_errors(team):
    api, lan, long, ws = team
    conv = api.post("/api/v1/conversations", headers=lan, json={}).json()
    turn = ask(api, lan, conv["id"], "Hỏi")["turn"]
    bad = api.post("/api/v1/private-highlights", headers=lan,
                   json={"conversationId": conv["id"], "turnId": turn["id"], "text": "chữ không có trong lượt"})
    assert bad.status_code == 400 and bad.json()["error"]["code"] == "NOT_IN_TURN"
    p = keep(api, lan, conv["id"], turn)
    # BR-03: nobody else can send Lan's highlight or open her conversation's highlights.
    r = api.post("/api/v1/private-highlights/send", headers=long, json={"ids": [p["id"]], "workspaceId": ws["id"], "channelId": "chung"})
    assert r.status_code == 404
    assert api.get("/api/v1/private-highlights", headers=long).json()["items"] == []
    assert api.post(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long,
                    json={"text": "x", "quoteIds": [p["id"]]}).status_code == 404


# ---------- UC06 ----------


def test_fr20_fr24_highlight(team):
    api, lan, long, ws = team
    long_msg = post(api, long, ws, "Runner cần ba thứ: dữ liệu, seed, ngân sách")[0]
    r = hl(api, lan, ws, long_msg["id"], "  dữ liệu,\n seed ")
    assert r.status_code == 201
    h = r.json()
    assert h["text"] == "dữ liệu, seed" and h["speaker"] == "Long" and h["channelName"] == "chung"
    # flow §10: the speaker's words cannot be changed, only narrowed.
    changed = hl(api, lan, ws, long_msg["id"], "dữ liệu, seed, GPU")
    assert changed.status_code == 400 and changed.json()["error"]["code"] == "TEXT_CHANGED"
    mine = api.get("/api/v1/highlights", headers=lan).json()
    assert mine["groups"][0]["workspaceName"] == ws["name"] and mine["total"] == 1
    assert api.get("/api/v1/highlights", headers=long).json()["total"] == 0
    assert api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long).json()["myHighlights"] == []
    assert len(api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan).json()["myHighlights"]) == 1
    assert api.patch(f"/api/v1/highlights/{h['id']}", headers=lan, json={"note": "ghi chú", "label": "review"}).json()["note"] == "ghi chú"
    assert api.delete(f"/api/v1/highlights/{h['id']}", headers=long).status_code == 404
    assert api.delete(f"/api/v1/highlights/{h['id']}", headers=lan).status_code == 204


def test_agent_highlight_spans_messages_and_skips_own(team, monkeypatch):
    """flow §10: one highlight across several messages keeps each speaker; own parts are left out; limit 30."""
    api, lan, long, ws = team
    a = post(api, long, ws, "Ý thứ nhất của Long")[0]
    b = post(api, lan, ws, "Lan chen vào")[0]
    c = post(api, long, ws, "ý thứ hai nối tiếp")[0]
    r = api.post(f"/api/v1/workspaces/{ws['id']}/channels/chung/highlights", headers=lan, json={
        "label": "important", "segments": [{"messageId": a["id"], "text": "Ý thứ nhất"},
                                           {"messageId": b["id"], "text": "Lan chen vào"},
                                           {"messageId": c["id"], "text": "ý thứ hai"}]})
    assert r.status_code == 201
    out = r.json()
    assert [x["text"] for x in out["segments"]] == ["Ý thứ nhất", "ý thứ hai"] and out["skippedMessageIds"] == [b["id"]]
    monkeypatch.setattr(settings, "agent_highlights_max", 1)
    full = hl(api, lan, ws, a["id"], "nhất")
    assert full.status_code == 409 and full.json()["error"]["code"] == "HIGHLIGHT_LIMIT"


def test_fr22_highlight_of_agent_message_survives_conversation_delete(team):
    """Long sends his agent's words; Lan highlights the card: the speaker is Long's agent, kept after Long deletes."""
    api, lan, long, ws = team
    conv = api.post("/api/v1/conversations", headers=long, json={"workspaceId": ws["id"]}).json()
    turn = ask(api, long, conv["id"], "Trả lời Lan")["turn"]
    p = keep(api, long, conv["id"], turn)
    msg = send_quote(api, long, ws, p["id"])
    piece = turn["text"].split(" ")[0]
    h = hl(api, lan, ws, msg["id"], piece, label="review", part=0).json()
    assert h["speaker"] == "GPT của Long" and h["segments"][0]["authorKind"] == "agent"
    api.delete(f"/api/v1/conversations/{conv['id']}?highlights=keep", headers=long)
    assert api.get("/api/v1/highlights", headers=lan).json()["total"] == 1
    kept = api.get("/api/v1/private-highlights", headers=long).json()["items"][0]
    assert kept["conversationDeleted"] is True and kept["conversationId"] is None


def test_fr23_cannot_highlight_own(team):
    api, lan, long, ws = team
    mine = post(api, lan, ws, "tin của tôi")[0]
    r = hl(api, lan, ws, mine["id"], "tin")
    assert r.status_code == 400 and r.json()["error"]["code"] == "OWN_MESSAGE" and "tự vào ngữ cảnh" in r.json()["error"]["message"]
    assert mine["id"] in api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan).json()["ownMessageIds"]


# ---------- UC07-UC09 ----------


def test_fr30_create_workspace(api):
    h, _ = login(api, "lan-pham", "Lan")
    r = api.post("/api/v1/workspaces", headers=h, json={"name": " ", "brief": ""})
    assert r.status_code == 400 and r.json()["error"]["code"] == "MISSING_FIELDS" and "tên và đề bài" in r.json()["error"]["message"]
    ws = shared(api, h, visibility="hidden")
    assert ws["myRole"] == "owner" and [c["name"] for c in ws["channels"]] == ["chung"]
    assert len(ws["joinCode"]) == 7 and ws["members"][0]["agent"] is None   # no workspace agent; Lan has no key yet


def test_fr31_fr32_join_code(team):
    api, lan, long, ws = team
    assert api.get(f"/api/v1/workspaces/{ws['id']}/join-code", headers=long).json()["code"] == ws["joinCode"]
    assert api.put(f"/api/v1/workspaces/{ws['id']}/join-code", headers=long).status_code == 403
    new = api.put(f"/api/v1/workspaces/{ws['id']}/join-code", headers=lan).json()["code"]
    assert new != ws["joinCode"]
    trang, _ = login(api, "trang@example.edu", "Trang", provider="google")
    r = api.post("/api/v1/join-requests", headers=trang, json={"code": ws["joinCode"]})
    assert r.status_code == 404 and r.json()["error"]["code"] == "INVALID_CODE"
    assert api.post("/api/v1/join-requests", headers=trang, json={"code": new.lower()[:3] + "-" + new[3:]}).status_code == 201


def test_fr33_fr36_fr38_request_flow(team):
    api, lan, long, ws = team
    trang, _ = login(api, "trang@example.edu", "Trang", provider="google")
    r1 = api.post("/api/v1/join-requests", headers=trang, json={"code": ws["joinCode"]}).json()
    r2 = api.post("/api/v1/join-requests", headers=trang, json={"workspaceId": ws["id"], "message": "Cho mình vào"}).json()
    assert r1["id"] == r2["id"] and r2["message"] == "Cho mình vào"   # FR-36: one pending only
    assert api.get(f"/api/v1/workspaces/{ws['id']}", headers=trang).json()["error"]["code"] == "NOT_MEMBER"   # FR-39
    assert api.get(f"/api/v1/join-requests/{r1['id']}", headers=long).status_code == 404
    assert api.patch(f"/api/v1/join-requests/{r1['id']}", headers=long, json={"status": "approved"}).status_code == 403
    pend = api.get(f"/api/v1/workspaces/{ws['id']}/join-requests", headers=lan).json()
    assert pend["pending"][0]["user"]["displayName"] == "Trang"
    assert api.patch(f"/api/v1/join-requests/{r1['id']}", headers=lan, json={"status": "approved"}).json()["status"] == "approved"
    status = api.get(f"/api/v1/join-requests/{r1['id']}", headers=trang).json()
    assert status["redirect"] == f"/w/{ws['id']}/c/chung"   # FR-38
    assert api.patch(f"/api/v1/join-requests/{r1['id']}", headers=lan, json={"status": "approved"}).status_code == 409
    assert api.get(f"/api/v1/workspaces/{ws['id']}/join-requests", headers=lan).json()["history"][0]["status"] == "approved"
    assert api.post("/api/v1/join-requests", headers=trang, json={"code": ws["joinCode"]}).json()["error"]["code"] == "ALREADY_MEMBER"


def test_fr36_cancel_and_reject(team):
    api, lan, _, ws = team
    trang, _ = login(api, "trang@example.edu", "Trang", provider="google")
    r = api.post("/api/v1/join-requests", headers=trang, json={"code": ws["joinCode"]}).json()
    assert api.patch(f"/api/v1/join-requests/{r['id']}", headers=trang, json={"status": "cancelled"}).json()["status"] == "cancelled"
    assert api.patch(f"/api/v1/join-requests/{r['id']}", headers=trang, json={"status": "cancelled"}).status_code == 409
    r = api.post("/api/v1/join-requests", headers=trang, json={"code": ws["joinCode"]}).json()
    assert api.patch(f"/api/v1/join-requests/{r['id']}", headers=lan, json={"status": "rejected"}).json()["status"] == "rejected"
    assert api.get(f"/api/v1/workspaces/{ws['id']}", headers=trang).status_code == 403


def test_fr34_fr35_explore(team):
    api, lan, long, ws = team
    shared(api, lan, name="Bí mật", brief="ẩn", visibility="hidden")
    trang, _ = login(api, "trang@example.edu", "Trang", provider="google")
    found = api.get("/api/v1/explore?q=đề tài", headers=trang).json()["workspaces"]
    assert [w["name"] for w in found] == [ws["name"]] and found[0]["relation"] == "none"
    assert api.get("/api/v1/explore?q=Bí", headers=trang).json()["workspaces"] == []
    assert api.get("/api/v1/explore", headers=long).json()["workspaces"][0]["relation"] == "member"
    api.post("/api/v1/join-requests", headers=trang, json={"workspaceId": ws["id"], "message": "hi"})
    sel = api.get(f"/api/v1/explore?selected={ws['id']}", headers=trang).json()["selected"]
    assert sel["relation"] == "pending" and sel["pendingRequestId"]


def test_fr37_only_owner_sees_requests(team):
    api, _, long, ws = team
    assert api.get(f"/api/v1/workspaces/{ws['id']}/join-requests", headers=long).status_code == 403


# ---------- UC10 ----------


def test_fr40_fr43_channel_messages(team):
    api, lan, long, ws = team
    posted = post(api, lan, ws, "Chào @Long, xem giúp")
    assert len(posted) == 1   # a mention never makes an agent answer
    seg = posted[0]["body"]
    assert {"t": "mention", "v": "Long"} in seg and posted[0]["senderKind"] == "human"
    data = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long).json()
    assert data["messages"][0]["senderName"] == "Lan"
    later = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages?after={data['lastSeq']}", headers=long).json()
    assert later["messages"] == []
    trang, _ = login(api, "trang@example.edu", "Trang", provider="google")
    assert api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=trang).status_code == 403
    assert api.post(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=trang, json={"text": "x"}).status_code == 403


def test_fr41_broker_delivers(team):
    import asyncio

    from app.ws.realtime import broker, channel_topic

    api, lan, _, ws = team
    ch_id = api.get(f"/api/v1/workspaces/{ws['id']}/channels", headers=lan).json()[0]["id"]

    async def scenario():
        q = broker.subscribe(channel_topic(ch_id))
        await asyncio.to_thread(post, api, lan, ws, "realtime")
        ev = await asyncio.wait_for(q.get(), 2)
        broker.unsubscribe(channel_topic(ch_id), q)
        return ev

    ev = asyncio.run(scenario())
    assert ev["type"] == "message" and ev["message"]["text"] == "realtime"


def test_fr44_fr62_members_show_agents_never_keys(team):
    api, lan, long, ws = team
    trang, _ = login(api, "trang@example.edu", "Trang", provider="google")
    add_member(api, lan, ws, trang)
    rows = api.get(f"/api/v1/workspaces/{ws['id']}/members", headers=long).json()
    by = {r["user"]["displayName"]: r for r in rows}
    assert by["Lan"]["role"] == "owner" and by["Lan"]["agent"]["provider"] == "anthropic"
    assert by["Trang"]["agent"] is None   # "chưa nhập key"
    text = json.dumps(rows)
    assert GOOD_KEY not in text and "keyLast4" not in text


def test_fr49_help(team):
    api, lan, _, ws = team
    msgs = post(api, lan, ws, "/help")
    assert msgs[1]["senderKind"] == "system" and msgs[1]["attachment"]["type"] == "help"
    assert "/decide" in msgs[1]["text"]


# ---------- UC11-UC13 ----------


def test_fr50_fr51_board_commands(team):
    api, lan, long, ws = team
    post(api, long, ws, "/idea Dùng HumanEval+")
    post(api, long, ws, "/note Hạn nộp 30/11")
    assert "Cách dùng" in post(api, long, ws, "/idea")[1]["text"]
    assert "Trả lời một tin" in post(api, long, ws, "/pin")[1]["text"]
    lan_msg = post(api, lan, ws, "Lan đề xuất Z3")[0]
    receipt = post(api, long, ws, "/pin", replyToId=lan_msg["id"])[1]
    assert receipt["attachment"]["type"] == "board-receipt"
    board = api.get(f"/api/v1/workspaces/{ws['id']}/board", headers=lan).json()
    assert [c["title"] for c in board["columns"]] == ["Đề xuất", "Đang bàn", "Đã chốt", "Đã loại"]
    proposed = board["columns"][0]["items"]
    assert [(i["number"], i["authorName"]) for i in proposed] == [(1, "Long"), (3, "Lan")]
    assert proposed[1]["source"]["messageId"] == lan_msg["id"]
    assert board["notes"][0]["body"] == "Hạn nộp 30/11"


def test_fr52_fr53_decide(team):
    api, lan, long, ws = team
    post(api, lan, ws, "/idea A")
    post(api, lan, ws, "/note N")
    assert "phải có lý do" in post(api, long, ws, "/decide #1 chốt")[1]["text"]   # UC12: reason required
    r = api.put(f"/api/v1/workspaces/{ws['id']}/board/1/decision", headers=long, json={"decision": "decided", "reason": "  "})
    assert r.status_code == 400 and r.json()["error"]["code"] == "REASON_REQUIRED"
    # flow §11: only the owner moves an idea into "Đang bàn".
    assert api.put(f"/api/v1/workspaces/{ws['id']}/board/1/status", headers=long, json={"status": "discussing"}).status_code == 403
    assert api.put(f"/api/v1/workspaces/{ws['id']}/board/1/status", headers=lan, json={"status": "discussing"}).json()["status"] == "discussing"
    ok = post(api, long, ws, "/decide #1 chốt đủ nhanh")[1]
    assert "Long đã chốt ý #1" in ok["text"]
    item = api.get(f"/api/v1/workspaces/{ws['id']}/board", headers=lan).json()["columns"][2]["items"][0]
    assert item["deciderName"] == "Long" and item["reason"] == "đủ nhanh" and item["decidedBy"]["at"]
    assert "không đổi được nữa" in post(api, lan, ws, "/decide #1 loại đổi ý")[1]["text"]
    r = api.put(f"/api/v1/workspaces/{ws['id']}/board/1/decision", headers=lan, json={"decision": "rejected", "reason": "x"})
    assert r.status_code == 409
    assert api.put(f"/api/v1/workspaces/{ws['id']}/board/1/status", headers=lan, json={"status": "discussing"}).status_code == 409
    assert "ghi chú" in post(api, lan, ws, "/decide #2 chốt x")[1]["text"]
    assert "Không có thẻ #9" in post(api, lan, ws, "/decide #9 chốt x")[1]["text"]


def test_fr54_owner_only_commands(team):
    api, lan, long, ws = team
    for c in ("/summarize", "/brief"):
        reply = post(api, long, ws, c)[1]
        assert reply["senderKind"] == "system" and "Chỉ chủ workspace" in reply["text"]
    assert api.post(f"/api/v1/workspaces/{ws['id']}/brief", headers=long).status_code == 403


def test_fr55_summarize_with_owner_agent(team):
    api, lan, long, ws = team
    post(api, long, ws, "Mình nghĩ nên dùng HumanEval")
    msgs = post(api, lan, ws, "/summarize")
    summary = msgs[-1]
    assert summary["senderKind"] == "agent" and summary["senderName"] == "Claude của Lan"
    assert summary["attachment"] == {"type": "summary"}
    # flow §5: the channel summary is not Lan's own words: not in her context, and she may highlight it.
    assert summary["id"] not in api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan).json()["ownMessageIds"]
    assert hl(api, lan, ws, summary["id"], summary["text"].split(" ")[0]).status_code == 201
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    ctx = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()["context"]
    assert all(x["id"] != summary["id"] for x in ctx["timeline"] if x["kind"] == "own")


def test_fr55_summarize_without_owner_key(api):
    lan, _ = login(api, "lan-pham", "Lan")
    ws = shared(api, lan)
    reply = post(api, lan, ws, "/summarize")[-1]
    assert reply["senderKind"] == "system" and "nhập API key" in reply["text"]


def test_fr56_brief(team):
    api, lan, long, ws = team
    assert api.get(f"/api/v1/workspaces/{ws['id']}/brief", headers=long).json()["error"]["code"] == "NO_BRIEF"
    for t in ("/idea Z3", "/idea Coq", "/idea Lean", "/note N1", "/decide #1 chốt Nhanh", "/decide #2 loại Nặng"):
        post(api, lan, ws, t)
    reply = post(api, lan, ws, "/brief")[1]
    assert reply["attachment"]["type"] == "brief"
    b = api.get(f"/api/v1/workspaces/{ws['id']}/brief", headers=long).json()
    assert [x["body"] for x in b["decided"]] == ["Z3"] and b["rejected"][0]["reason"] == "Nặng"
    assert [x["body"] for x in b["discussing"]] == ["Lean"]
    md = api.get(f"/api/v1/workspaces/{ws['id']}/brief.md", headers=long)
    assert md.headers["content-type"].startswith("text/markdown") and "attachment" in md.headers["content-disposition"]
    assert "## Đã chốt" in md.text and "Vì nhanh" in md.text and "Vì nặng" in md.text and "- #3 Lean" in md.text


# ---------- UC14 / UC15 ----------


def test_fr61_team_role(team):
    api, lan, long, ws = team
    r = api.put(f"/api/v1/workspaces/{ws['id']}/members/me/team-role", headers=long, json={"teamRole": "x" * 41})
    assert r.status_code == 400
    assert api.put(f"/api/v1/workspaces/{ws['id']}/members/me/team-role", headers=long, json={"teamRole": " Runner "}).json() == {"teamRole": "Runner"}
    rows = api.get(f"/api/v1/workspaces/{ws['id']}/members", headers=lan).json()
    assert {r["user"]["displayName"]: r["teamRole"] for r in rows} == {"Lan": None, "Long": "Runner"}


def test_fr60_owner_config(team):
    api, lan, long, ws = team
    assert api.patch(f"/api/v1/workspaces/{ws['id']}", headers=long, json={"brief": "x"}).status_code == 403
    assert api.patch(f"/api/v1/workspaces/{ws['id']}", headers=lan, json={"brief": "Đề mới"}).json()["brief"] == "Đề mới"
    assert api.post(f"/api/v1/workspaces/{ws['id']}/channels", headers=long, json={"name": "runner"}).status_code == 403
    ch = api.post(f"/api/v1/workspaces/{ws['id']}/channels", headers=lan, json={"name": "#Runner Log"})
    assert ch.status_code == 201 and ch.json()["name"] == "runner-log"
    assert api.post(f"/api/v1/workspaces/{ws['id']}/channels", headers=lan, json={"name": "runner-log"}).status_code == 409
    post(api, long, ws, "ở kênh mới", ch=ch.json()["id"])
    conv = api.post("/api/v1/conversations", headers=long, json={"workspaceId": ws["id"]}).json()
    ctx = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=long).json()["context"]
    assert ctx["timeline"][0]["channelName"] == "runner-log"   # own messages from every channel


def test_personal_workspace_is_private(api):
    lan, me = login(api, "lan-pham", "Lan")
    long, _ = login(api, "long-tran", "Long")
    pid = api.get("/api/v1/me", headers=lan).json()["personalWorkspaceId"]
    assert api.get(f"/api/v1/workspaces/{pid}", headers=long).status_code == 404
    assert api.get(f"/api/v1/workspaces/{pid}/channels/chung/messages", headers=lan).status_code == 404   # FR-18


def test_fr27_removing_highlight_updates_context(team):
    api, lan, long, ws = team
    m = post(api, long, ws, "Ý của Long cần xem")[0]
    h = hl(api, lan, ws, m["id"], "cần xem", label="review").json()
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    before = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert len(before["context"]["highlights"]) == 1 and '"…cần xem"' in before["system"]
    api.delete(f"/api/v1/highlights/{h['id']}", headers=lan)
    after = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert after["context"]["highlights"] == [] and 'cần xem"' not in after["system"]
