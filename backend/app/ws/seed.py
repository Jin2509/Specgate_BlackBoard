"""Demo data matching the UI's mock (docs/overallweb.md §6): python -m app.ws.seed [--reset]

- Lan (GitHub lan-pham): owner of "Đồ án Kiểm chứng" (code KC26DAX), team role "Dựng khung", Claude.
- Long (GitHub long-tran): member, "Runner", DeepSeek-style key.
- Trang (Google trang@example.edu): has a key, not in any shared workspace (demo: join with KC26DAX).

The stored keys are placeholders: they work with LLM_FAKE=true only. With a real provider, enter a real key.
"""

import sys

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.ws import models as m
from app.ws.migrate import add_missing_columns
from app.ws import service as sv
from app.ws.routers.auth import upsert_identity
from app.ws.security import encrypt_key

FAKE_KEY = "sk-demo-placeholder-key-0001"


def _key(s, user, provider, model, models, base_url=None):
    s.merge(m.ProviderKey(user_id=user.id, provider=provider, base_url=base_url, secret=encrypt_key(FAKE_KEY),
                          key_last4=FAKE_KEY[-4:], model=model, models=models))


def run(reset: bool = False) -> None:
    if reset:
        tables = [t for t in Base.metadata.sorted_tables if t.name.startswith("ws_")]
        Base.metadata.drop_all(engine, tables=tables)
    Base.metadata.create_all(engine)
    add_missing_columns(engine)
    with SessionLocal() as s:
        if s.scalar(select(m.Workspace).where(m.Workspace.join_code == "KC26DAX")):
            print("Đã có dữ liệu demo (dùng --reset để làm lại).")
            return
        lan, _ = upsert_identity(s, "github", "lan-pham", "lan-pham", "Lan")
        long, _ = upsert_identity(s, "github", "long-tran", "long-tran", "Long")
        trang, _ = upsert_identity(s, "google", "trang@example.edu", "trang@example.edu", "Trang")
        _key(s, lan, "anthropic", "claude-sonnet-5-5", ["claude-haiku-5-5", "claude-opus-5-5", "claude-sonnet-5-5"])
        _key(s, long, "openai-compatible", "deepseek-v4", ["deepseek-v4", "gpt-6-luna", "qwen-3.8-max"],
             "https://api.deepseek.com/v1")
        _key(s, trang, "anthropic", "claude-haiku-5-5", ["claude-haiku-5-5", "claude-opus-5-5", "claude-sonnet-5-5"])

        ws = m.Workspace(kind="shared", name="Đồ án Kiểm chứng", visibility="discoverable", owner_id=lan.id,
                         brief="Chọn đề tài đồ án môn Kiểm chứng phần mềm: một công cụ kiểm chứng chạy được trên HumanEval+.",
                         join_code="KC26DAX", join_code_at=m.now())
        s.add(ws)
        s.flush()
        s.add_all([m.Member(workspace_id=ws.id, user_id=lan.id, role="owner", team_role="Dựng khung", color=0),
                   m.Member(workspace_id=ws.id, user_id=long.id, role="member", team_role="Runner", color=1)])
        ch = m.Channel(workspace_id=ws.id, name="chung")
        s.add(ch)
        s.add(m.Channel(workspace_id=ws.id, name="runner"))
        s.flush()

        a = sv.add_message(s, ws, ch, kind="agent", sender_id=lan.id, agent_model="claude-sonnet-5-5",
                           agent_provider="anthropic",
                           text="Để dựng khung, runner cần thống nhất: 1. bộ dữ liệu, 2. số seed, 3. ngân sách gọi mô hình.")
        b = sv.add_message(s, ws, ch, kind="agent", sender_id=long.id, agent_model="deepseek-v4",
                           agent_provider="openai-compatible",
                           text="Runner đề xuất HumanEval+ 164 tác vụ, 3 seed, tối đa 2 000 lời gọi mỗi lượt.")
        c = sv.add_message(s, ws, ch, kind="human", sender_id=long.id,
                           text="Mình thêm: nên giữ 20% tác vụ làm holdout để kiểm tra cuối.")
        s.flush()
        s.add_all([
            m.Highlight(owner_id=lan.id, workspace_id=ws.id, channel_id=ch.id, message_id=b.id, author_kind="agent",
                        author_user_id=long.id, author_model="deepseek-v4", text="HumanEval+ 164 tác vụ, 3 seed",
                        label="important"),
            m.Highlight(owner_id=lan.id, workspace_id=ws.id, channel_id=ch.id, message_id=c.id, author_kind="human",
                        author_user_id=long.id, text="giữ 20% tác vụ làm holdout", label="review"),
        ])
        for kind, body, by in [("idea", "Dùng HumanEval+ làm bộ dữ liệu chính", long.id),
                               ("idea", "Viết lại bằng Coq", lan.id), ("idea", "Giữ 20% holdout", long.id),
                               ("note", "Hạn nộp 30/11", lan.id)]:
            ws.board_seq += 1
            s.add(m.BoardItem(workspace_id=ws.id, number=ws.board_seq, kind=kind, body=body,
                              status="proposed" if kind == "idea" else None, created_by_kind="human", created_by_id=by))
        s.flush()
        items = {i.number: i for i in s.scalars(select(m.BoardItem).where(m.BoardItem.workspace_id == ws.id))}
        items[1].status, items[1].reason, items[1].decided_by, items[1].decided_at = "decided", "Có sẵn bộ kiểm thử mạnh", lan.id, m.now()
        items[2].status, items[2].reason, items[2].decided_by, items[2].decided_at = "rejected", "Quá nặng cho 3 tuần", long.id, m.now()
        items[3].status = "discussing"

        conv = m.Conversation(owner_id=lan.id, title="Thống nhất với runner", workspace_id=ws.id)
        s.add(conv)
        s.flush()
        s.add_all([m.Turn(conversation_id=conv.id, seq=1, role="user", text="Runner cần thống nhất những gì với mình?"),
                   m.Turn(conversation_id=conv.id, seq=2, role="assistant", model="claude-sonnet-5-5", text=a.text)])
        t_conv = m.Conversation(owner_id=trang.id, title="Ôn tập kiểm chứng")
        s.add(t_conv)
        s.flush()
        s.add_all([m.Turn(conversation_id=t_conv.id, seq=1, role="user", text="Z3 là gì?"),
                   m.Turn(conversation_id=t_conv.id, seq=2, role="assistant", model="claude-haiku-5-5",
                          text="Z3 là bộ giải SMT của Microsoft Research.")])
        s.commit()
        print(f"Đã tạo dữ liệu demo. Workspace chung: {ws.id} (mã KC26DAX).")


if __name__ == "__main__":
    run(reset="--reset" in sys.argv)
