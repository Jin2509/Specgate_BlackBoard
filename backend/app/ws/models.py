"""Defines the SpecGate Workspace tables (SRS v0.2)."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:16]}"


class User(Base):
    __tablename__ = "ws_users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("u"))
    display_name: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    # Last shared workspace opened, for "mở lại workspace dùng gần nhất" (UC01 step 5).
    last_workspace_id: Mapped[str | None] = mapped_column(String, nullable=True)


class OAuthAccount(Base):
    """One Google/GitHub/email identity -> exactly one user (FR-04)."""

    __tablename__ = "ws_oauth_accounts"
    __table_args__ = (UniqueConstraint("provider", "subject"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String)          # google | github | email
    # Provider's stable user id; the lower-cased address for email, the lower-cased login in dev mode.
    subject: Mapped[str] = mapped_column(String)
    login: Mapped[str] = mapped_column(String)             # email (Google, email) or username (GitHub), for display
    user_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)


class EmailCode(Base):
    """A one-time sign-in code sent to an address. Only an HMAC of the code is kept; the newest unused one counts."""

    __tablename__ = "ws_email_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(254), index=True)   # lower-cased
    code_hash: Mapped[str] = mapped_column(String(64))
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Workspace(Base):
    __tablename__ = "ws_workspaces"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("w"))
    kind: Mapped[str] = mapped_column(String)              # personal | shared
    name: Mapped[str] = mapped_column(String(80))
    brief: Mapped[str] = mapped_column(Text, default="")   # đề bài
    visibility: Mapped[str] = mapped_column(String, default="hidden")   # hidden | discoverable
    owner_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    join_code: Mapped[str | None] = mapped_column(String(7), unique=True, nullable=True)
    join_code_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    board_seq: Mapped[int] = mapped_column(Integer, default=0)
    # Task board (flow §13): its own numbering ("việc 3", never mixed with "ý 3") and the owner's lock.
    task_seq: Mapped[int] = mapped_column(Integer, default=0)
    tasks_locked: Mapped[bool] = mapped_column(Boolean, default=False)


class Member(Base):
    __tablename__ = "ws_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    role: Mapped[str] = mapped_column(String)              # owner | member
    team_role: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Name inside this workspace, unique per workspace (flow §14). None = the account's display name.
    nickname: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Set when the display name collided on join: the member is asked to pick a nickname (flow §8).
    needs_nickname: Mapped[bool] = mapped_column(Boolean, default=False)
    # Avatar colour index, unique inside the workspace while the palette lasts (flow §9).
    color: Mapped[int] = mapped_column(Integer, default=0)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    # Set when the member left or was removed (flow §14). The row stays so the name stays reserved for this person
    # and old messages, cards and highlights read "Lan (đã rời)". Joining again clears it.
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ChannelRead(Base):
    """How far a member has read a channel, for the unread dots on the rail and the channel list (flow §2)."""

    __tablename__ = "ws_channel_reads"
    __table_args__ = (UniqueConstraint("user_id", "channel_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    channel_id: Mapped[str] = mapped_column(ForeignKey("ws_channels.id"), index=True)
    last_seq: Mapped[int] = mapped_column(Integer, default=0)


class Channel(Base):
    __tablename__ = "ws_channels"
    __table_args__ = (UniqueConstraint("workspace_id", "name"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("ch"))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    name: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class JoinRequest(Base):
    __tablename__ = "ws_join_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("jr"))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    via: Mapped[str] = mapped_column(String)               # code | explore
    code: Mapped[str | None] = mapped_column(String(7), nullable=True)
    message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String, default="pending")   # pending | approved | rejected | cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decided_by: Mapped[str | None] = mapped_column(String, nullable=True)


class ProviderKey(Base):
    """The user's one API key (BR-01). `secret` is Fernet ciphertext; it is decrypted only to call the provider."""

    __tablename__ = "ws_provider_keys"

    user_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), primary_key=True)
    provider: Mapped[str] = mapped_column(String)          # anthropic | openai-compatible
    base_url: Mapped[str | None] = mapped_column(String, nullable=True)
    secret: Mapped[bytes] = mapped_column(LargeBinary)
    key_last4: Mapped[str] = mapped_column(String(4))
    model: Mapped[str] = mapped_column(String)
    models: Mapped[list] = mapped_column(JSON, default=list)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Conversation(Base):
    __tablename__ = "ws_conversations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("c"))
    owner_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    title: Mapped[str] = mapped_column(String(80), default="Hội thoại mới")
    workspace_id: Mapped[str | None] = mapped_column(ForeignKey("ws_workspaces.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Turn(Base):
    __tablename__ = "ws_turns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("t"))
    conversation_id: Mapped[str] = mapped_column(ForeignKey("ws_conversations.id", ondelete="CASCADE"), index=True)
    seq: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String)              # user | assistant
    text: Mapped[str] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    # Assistant turn that is only an error notice (UC03 exception); never sent back to the model.
    error: Mapped[str | None] = mapped_column(String, nullable=True)
    # The user pressed "Dừng" (or the connection dropped): the text is what was written until then.
    stopped: Mapped[bool] = mapped_column(Boolean, default=False)
    # "Tạo lại" keeps the old answer as a version (flow §4). Every version of one answer shares `version_group`
    # (the first version's id); only the `active` one is shown and sent back to the agent.
    version_group: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    # The shared workspace whose context the agent read when it wrote this answer (flow §6, warning on send).
    context_workspace_id: Mapped[str | None] = mapped_column(String, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Message(Base):
    """Channel message. sender_kind agent: sender_id is the agent's owner, agent_model the model at send time."""

    __tablename__ = "ws_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("m"))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    channel_id: Mapped[str] = mapped_column(ForeignKey("ws_channels.id"), index=True)
    seq: Mapped[int] = mapped_column(Integer, index=True)   # global order, for ?after= and SSE resume
    sender_kind: Mapped[str] = mapped_column(String)        # human | agent | system
    sender_id: Mapped[str] = mapped_column(String)
    agent_model: Mapped[str | None] = mapped_column(String, nullable=True)
    agent_provider: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text)
    body: Mapped[list] = mapped_column(JSON, default=list)  # segments: text | mention | command
    reply_to_id: Mapped[str | None] = mapped_column(String, nullable=True)
    attachment: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Cards carried by the message (flow §6): quote | conversation-summary. Snapshots.
    cards: Mapped[list | None] = mapped_column(JSON, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Highlight(Base):
    """"Highlight cho agent" (flow §10): snapshot of passages of other people's messages; owner-only.
    `segments` holds every passage with its own speaker and source message; the flat columns mirror the first."""

    __tablename__ = "ws_highlights"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("h"))
    owner_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    channel_id: Mapped[str] = mapped_column(String)
    message_id: Mapped[str] = mapped_column(String)
    author_kind: Mapped[str] = mapped_column(String)        # human | agent
    author_user_id: Mapped[str] = mapped_column(String)
    author_model: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(String)              # important | review
    note: Mapped[str | None] = mapped_column(Text, nullable=True)   # "Ghi chú của tôi", separate from the speaker's words
    segments: Mapped[list | None] = mapped_column(JSON, nullable=True)
    source_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)   # time of the first source message
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class PrivateHighlight(Base):
    """"Highlight riêng" (flow §4, §6): a passage of the user's own conversation, kept in the personal workspace.
    Leaves it only when the user sends it. kind summary = "Tóm tắt cho nhóm"; digest = "Tóm tắt tin cũ của tôi"."""

    __tablename__ = "ws_private_highlights"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("ph"))
    owner_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    kind: Mapped[str] = mapped_column(String, default="passage")   # passage | summary | digest
    conversation_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    conversation_title: Mapped[str] = mapped_column(String(80), default="")
    conversation_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    turn_id: Mapped[str | None] = mapped_column(String, nullable=True)
    speaker_kind: Mapped[str] = mapped_column(String)        # agent | human
    model: Mapped[str | None] = mapped_column(String, nullable=True)   # the model at creation time
    original_text: Mapped[str] = mapped_column(Text)        # what was selected (or what the agent wrote)
    text: Mapped[str] = mapped_column(Text)                 # current text, editable
    # The whole turn the passage was taken from: tells a full answer from an excerpt, and a cut mid-sentence (flow §6).
    source_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Shared workspaces whose context the agent was reading when it wrote these words (flow §6): sending them to
    # another workspace asks for confirmation.
    context_workspace_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    color: Mapped[str] = mapped_column(String, default="yellow")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    attached_turns: Mapped[list] = mapped_column(JSON, default=list)   # summary: original turns attached by the user
    sends: Mapped[list] = mapped_column(JSON, default=list)            # [{workspaceId, channelId, messageId, at}]
    workspace_id: Mapped[str | None] = mapped_column(String, nullable=True)   # digest: the workspace it summarizes
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ContextDigest(Base):
    """"Tóm tắt tin cũ của tôi" (flow §5): written by the user's own agent when their messages exceed the limit."""

    __tablename__ = "ws_context_digests"
    __table_args__ = (UniqueConstraint("user_id", "workspace_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("ws_users.id"), index=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    upto_seq: Mapped[int] = mapped_column(Integer)          # covers own messages with seq <= upto_seq
    count: Mapped[int] = mapped_column(Integer, default=0)
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text)
    # Blocks in time order, cut at the highlights in between (flow §5): {firstSeq, lastSeq, from, to, count,
    # verbatim, text}. A short block is kept word for word (verbatim, no text); the others carry the agent's summary.
    blocks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class BoardItem(Base):
    __tablename__ = "ws_board_items"
    __table_args__ = (UniqueConstraint("workspace_id", "number"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("b"))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    number: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String)               # idea | note
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[str | None] = mapped_column(String, nullable=True)   # ideas: proposed | discussing | decided | rejected
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_kind: Mapped[str] = mapped_column(String)    # human | agent
    created_by_id: Mapped[str] = mapped_column(String)
    created_by_model: Mapped[str | None] = mapped_column(String, nullable=True)
    # Source: the command message, and for /pin the message being pinned.
    source_channel_id: Mapped[str | None] = mapped_column(String, nullable=True)
    source_message_id: Mapped[str | None] = mapped_column(String, nullable=True)
    decided_by: Mapped[str | None] = mapped_column(String, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # /pin (flow §11): who the pinned words belong to when it is not simply the sender, e.g.
    # "Claude của Lan nói (trích một phần)" or "Bản tóm tắt kênh do Claude của Lan viết (chưa lọc)".
    author_label: Mapped[str | None] = mapped_column(String, nullable=True)
    # "Ghim cả hai": one idea in parts, each with its own speaker [{speaker, text}]; never merged into one voice.
    parts: Mapped[list | None] = mapped_column(JSON, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Task(Base):
    """One node of the task tree (flow §13): a short description, who does it and "doing" or "done".
    A task may sit under a parent task, at most three levels deep. No deadline or priority on purpose."""

    __tablename__ = "ws_tasks"
    __table_args__ = (UniqueConstraint("workspace_id", "number"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("tk"))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    number: Mapped[int] = mapped_column(Integer)
    body: Mapped[str] = mapped_column(String(200))
    # None = a top-level task; otherwise the id of the larger task this one breaks down.
    parent_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    # None = "chưa có người phụ trách": anyone may claim it, the owner may assign it.
    assignee_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String, default="doing")   # doing | done
    created_by: Mapped[str] = mapped_column(String)
    # Who put the current assignee on the task: the assignee themself (claimed) or the owner (assigned).
    assigned_by: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Brief(Base):
    """Snapshot built by /brief (UC13). The latest one is what members view and download."""

    __tablename__ = "ws_briefs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("br"))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("ws_workspaces.id"), index=True)
    built_by: Mapped[str] = mapped_column(String)
    built_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    data: Mapped[dict] = mapped_column(JSON)
    markdown: Mapped[str] = mapped_column(Text)
