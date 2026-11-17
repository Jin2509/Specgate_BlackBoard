"""SpecGate Workspace against docs/flow.md (the version after SRS v0.2). Each test names the flow section it checks.
Runs with the fake agent and the simulated ADOM trial run: no network, no cost."""

import json
import time

import pytest

from app.config import settings
from test_ws import GOOD_KEY, add_member, api, ask, hl, keep, login, post, send_quote, shared, team, with_key  # noqa: F401

SUMMARY_CSV = """variant,number,row,value,set,decision_cell
A3-natural-standard,1-3 table,rules/gate,good=18 wrong_side=0 over_relax=8 unmeasured=104 blocked=0 no_candidate=1 no_repair=0 excluded=0,uncensored,yes
A3-natural-standard,1-3 table,llm_judge/gate,good=17 wrong_side=0 over_relax=8 unmeasured=104 blocked=0 no_candidate=1 no_repair=1 excluded=0,uncensored,yes
A3-natural-standard,1-3 table,always_spec/gate,good=18 wrong_side=0 over_relax=8 unmeasured=104 blocked=0 no_candidate=1 no_repair=0 excluded=0,uncensored,yes
A3-natural-standard,4 gate blocks wrong-side,rules,n=0,uncensored,yes
A3-natural-standard,"5 top1 harmful, right target",rules,"0.308 [0.00, 0.82] (8/26)",uncensored,yes
A3-natural-standard,9 SPEC_FAULT false rate,-,"0.000 [0.00, 0.00] (0/131)",uncensored,yes
A3-natural-standard,"10 wrongful repair, non-point",-,"0.357 [0.00, 0.72] (5/14)",uncensored,yes
A3-natural-standard,1 good repair rate,rules/gate,"0.667 [0.17, 0.97] (18/27)",uncensored,yes
A3-natural-standard,criterion 6 harm difference (baseline - rules/gate),vs llm_judge/gate,"0.000 [0.000, 0.000] (7 tasks, 27 violations)",uncensored,yes
A3-natural-standard,criterion 6 harm difference (baseline - rules/gate),vs rules/no_gate,"0.000 [0.000, 0.000] (7 tasks, 27 violations)",uncensored,yes
A1-natural-standard,9 SPEC_FAULT false rate,-,n=0,uncensored,no
"""
PER_TASK = "variant,task_id,status,a3_state,label_unique_output,label_source,decided_by,violations,ablation_attempts,contract_errors,contributing,wall_s\n" + "".join(
    f"A3-natural-standard,HumanEval/{i},ok,AGREE,True,auto_true,x,{v},0,0,{1 if v else 0},1.5\n"
    for i, v in enumerate([118, 23, 19, 16, 16, 15, 13, 13, 10, 9, 0, 0])
) + "A1-natural-standard,HumanEval/0,ok,AGREE,True,auto_true,x,26,9,0,1,0.17\n"
RUN_META = json.dumps({"run": "MAIN", "variants": {
    "A3-natural-standard": {"models": {"coder": "exp/claude-haiku-5.5", "spec": "exp/glm-5.3-flash",
                                       "draft1": "exp/qwen-3.8-max", "judge": "exp/deepseek-v4.1-flash"},
                            "timing_total_s": 523.3, "config_hash": "abc"},
    "A1-natural-standard": {"models": {}}}})


def import_main(c, h, ws, **kw):
    r = c.post(f"/api/v1/workspaces/{ws['id']}/runs/import", headers=h, json={
        "format": "adom-export", "summaryCsv": SUMMARY_CSV, "perTaskCsv": PER_TASK, "runMeta": RUN_META, **kw})
    assert r.status_code == 201, r.text
    return r.json()


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


# ---------- §13 paper results ----------


def test_s13_import_adom_export_stats_and_context(team):
    api, lan, long, ws = team
    assert api.get(f"/api/v1/workspaces/{ws['id']}", headers=long).json()["modules"] == []
    assert "chưa có số liệu" in post(api, long, ws, "/stats")[1]["text"]
    bad = api.post(f"/api/v1/workspaces/{ws['id']}/runs/import", headers=lan,
                   json={"format": "adom-export", "summaryCsv": "a,b\n1,2", "perTaskCsv": PER_TASK, "runMeta": RUN_META})
    assert bad.status_code == 400 and bad.json()["error"]["code"] == "BAD_REPORT"
    assert api.post(f"/api/v1/workspaces/{ws['id']}/runs/import", headers=long, json={"format": "adom-export"}).status_code == 403
    run = import_main(api, lan, ws)
    verdicts = [c["verdict"] for c in run["criteria"]]
    # The same verdicts ADOM's report gives for MAIN: only criterion 1 passes.
    assert verdicts == ["PASS", "INSUFFICIENT_DATA", "INSUFFICIENT_DATA", "INSUFFICIENT_DATA", "INSUFFICIENT_DATA",
                        "INSUFFICIENT_DATA"]
    assert run["criteria"][4]["display"] == "0.667" and run["criteria"][4]["ciLow"] == 0.17
    assert run["taskResults"][0]["taskId"] == "HumanEval/0" and run["repairs"][0]["good"] == 18 and run["name"] == "MAIN"
    msgs = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long).json()["messages"]
    assert msgs[-1]["senderKind"] == "system" and "Đã có lượt chạy mới: MAIN, HumanEval+" in msgs[-1]["text"]
    assert api.get(f"/api/v1/workspaces/{ws['id']}", headers=long).json()["modules"] == ["adom"]

    stats = post(api, long, ws, "/stats")[1]
    card = stats["cards"][0]
    assert card["kind"] == "stats" and len(card["criteria"]) == 6 and "notice" not in card
    task = post(api, long, ws, "/task 38")[1]
    assert "Lượt MAIN không có tác vụ" in task["text"]
    task = post(api, long, ws, "/task HumanEval/0")[1]
    assert task["cards"][0]["task"]["violations"] == 118
    # A line of the stats card can be highlighted by anyone, even the one who typed /stats.
    h = hl(api, long, ws, stats["id"], "Tiêu chí 1", part=0).json()
    assert h["segments"][0]["speaker"] == "Thẻ số liệu lượt MAIN"

    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    out = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert out["context"]["metrics"]["run"]["name"] == "MAIN" and "Số liệu bài báo ADOM: lượt MAIN" in out["system"]
    assert "Tiêu chí 5 (Tỷ lệ bản sửa tốt): 0.667" in out["system"]

    # Marking it invalid: old cards say so; the agent is told not to conclude from it; the brief records it.
    assert api.patch(f"/api/v1/workspaces/{ws['id']}/runs/{run['id']}", headers=lan, json={"validity": "invalidated"}).status_code == 400
    api.patch(f"/api/v1/workspaces/{ws['id']}/runs/{run['id']}", headers=lan,
              json={"validity": "invalidated", "invalidReason": "Engine đọc sai nhãn"})
    msgs = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long).json()["messages"]
    old = next(x for x in msgs if x["id"] == stats["id"])
    assert old["cards"][0]["notice"] == "Lượt chạy này đã bị đánh dấu không hợp lệ."
    out = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()
    assert "không dùng các con số này làm kết luận" in out["system"]
    brief = api.post(f"/api/v1/workspaces/{ws['id']}/brief", headers=lan).json()
    assert brief["evidence"]["run"]["name"] == "MAIN" and "## Số liệu dùng làm căn cứ" in brief["markdown"]
    assert "KHÔNG hợp lệ (Engine đọc sai nhãn)" in brief["markdown"]


def test_s13_native_format_and_newer_run_notice(team):
    api, lan, long, ws = team
    first = import_main(api, lan, ws)
    stats = post(api, lan, ws, "/stats")[1]
    report = {"format": "specgate-run/1", "name": "MAIN2", "dataset": "HumanEval+", "tasks": 3,
              "criteria": [{"number": i, "title": f"T{i}", "value": None, "verdict": "INSUFFICIENT_DATA"} for i in range(1, 7)],
              "perTask": []}
    r = api.post(f"/api/v1/workspaces/{ws['id']}/runs/import", headers=lan,
                 json={"format": "specgate-run/1", "report": json.dumps(report)})
    assert r.status_code == 201
    msgs = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan).json()["messages"]
    assert next(x for x in msgs if x["id"] == stats["id"])["cards"][0]["notice"] == "Đã có lượt chạy mới hơn."
    runs = api.get(f"/api/v1/workspaces/{ws['id']}/runs", headers=lan).json()
    assert runs["currentId"] == r.json()["id"] and len(runs["runs"]) == 2 and first
    api.delete(f"/api/v1/workspaces/{ws['id']}/runs/{r.json()['id']}", headers=lan)
    assert api.get(f"/api/v1/workspaces/{ws['id']}/runs", headers=lan).json()["currentId"] == first["id"]


def test_s13_trial_run(team, monkeypatch):
    api, lan, long, ws = team
    monkeypatch.setattr(settings, "adom_trial_fake", True)
    monkeypatch.setattr(settings, "adom_trial_fake_step_s", 0)
    body = {"taskIds": ["HumanEval/1", "13"], "level": "A3"}
    assert api.post(f"/api/v1/workspaces/{ws['id']}/runs/trial", headers=long, json=body).status_code == 403
    too_many = api.post(f"/api/v1/workspaces/{ws['id']}/runs/trial", headers=lan,
                        json={"taskIds": [str(i) for i in range(settings.adom_trial_max_tasks + 1)]})
    assert too_many.status_code == 400 and too_many.json()["error"]["code"] == "TOO_MANY_TASKS"
    r = api.post(f"/api/v1/workspaces/{ws['id']}/runs/trial", headers=lan, json=body)
    assert r.status_code == 201 and r.json()["kind"] == "trial"
    run_id = r.json()["id"]
    for _ in range(100):
        cur = api.get(f"/api/v1/workspaces/{ws['id']}/runs/{run_id}", headers=lan).json()
        if cur["status"] != "running":
            break
        time.sleep(0.05)
    assert cur["status"] == "done" and [t["taskId"] for t in cur["taskResults"]] == ["HumanEval/1", "HumanEval/13"]
    assert {c["verdict"] for c in cur["criteria"]} == {"INSUFFICIENT_DATA"}   # a few tasks never reach N_min
    msgs = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=long).json()["messages"]
    assert "Lượt chạy thử THU-1 đã xong" in msgs[-1]["text"]
    card = post(api, long, ws, "/stats")[1]["cards"][0]
    assert card["run"]["kind"] == "trial"
