// Các thao tác ghi lên kho dữ liệu giả: mã tham gia, yêu cầu tham gia, duyệt; workspace riêng (key, hội thoại,
// gắn ngữ cảnh nhóm, gửi câu trả lời vào kênh); kênh chung (tin nhắn, highlight, vai trong nhóm).
// Khi có backend, mỗi hàm ở đây ứng với một endpoint FastAPI ghi vào Supabase.
import { generateJoinCode } from "@/lib/join-code";
import type {
  AuthProvider,
  Conversation,
  Highlight,
  HighlightLabel,
  JoinCode,
  JoinRequest,
  Message,
  ProviderKey,
  ProviderKind,
  Segment,
  Turn,
} from "@/lib/types";
import {
  agentLabel,
  getAgentContext,
  getMembers,
  getMessage,
  getPendingRequest,
  getWorkspace,
  isMember,
  isOwnMessage,
  isOwner,
  type AgentContext,
} from "./queries";
import { clockLabel, nextId, nowLabel, store } from "./store";

export type MutationError =
  | "not-found"
  | "forbidden"
  | "already-member"
  | "not-pending"
  | "invalid-key"
  | "quota"
  | "no-key"
  | "empty"
  | "own-message"
  | "not-linked";
export type Result<T> = { ok: true; value: T } | { ok: false; error: MutationError };

const fail = (error: MutationError): { ok: false; error: MutationError } => ({ ok: false, error });

// Sinh mã mới cho workspace chung; mã cũ hết hiệu lực ngay. Chỉ chủ workspace được đổi mã.
export function rotateJoinCode(workspaceId: string, userId: string): Result<JoinCode> {
  const ws = getWorkspace(workspaceId);
  if (!ws || ws.kind !== "shared") return fail("not-found");
  if (!isOwner(ws, userId)) return fail("forbidden");
  const s = store();
  const taken = new Set(s.joinCodes.map((c) => c.code));
  let code = generateJoinCode();
  while (taken.has(code)) code = generateJoinCode();
  const entry: JoinCode = { code, workspaceId, createdBy: userId, createdAt: nowLabel() };
  s.joinCodes = [...s.joinCodes.filter((c) => c.workspaceId !== workspaceId), entry];
  return { ok: true, value: entry };
}

export interface JoinRequestInput {
  workspaceId: string;
  userId: string;
  via: JoinRequest["via"];
  code?: string;
  message?: string;
}

// Tạo yêu cầu đang chờ; nếu đã có yêu cầu chờ thì cập nhật lời nhắn thay vì tạo trùng.
export function submitJoinRequest(input: JoinRequestInput): Result<JoinRequest> {
  const ws = getWorkspace(input.workspaceId);
  if (!ws || ws.kind !== "shared") return fail("not-found");
  if (isMember(ws, input.userId)) return fail("already-member");

  const existing = getPendingRequest(ws.id, input.userId);
  if (existing) {
    if (input.message !== undefined) existing.message = input.message;
    if (input.code) Object.assign(existing, { via: input.via, code: input.code });
    existing.at = nowLabel();
    return { ok: true, value: existing };
  }

  const request: JoinRequest = {
    id: nextId("r"),
    workspaceId: ws.id,
    userId: input.userId,
    message: input.message ?? "",
    status: "pending",
    via: input.via,
    code: input.code,
    at: nowLabel(),
  };
  store().joinRequests.push(request);
  return { ok: true, value: request };
}

// Chủ workspace duyệt hoặc từ chối. Duyệt thì thêm người đó vào workspace với vai thành viên.
export function decideJoinRequest(requestId: string, deciderId: string, approve: boolean): Result<JoinRequest> {
  const s = store();
  const request = s.joinRequests.find((r) => r.id === requestId);
  const ws = getWorkspace(request?.workspaceId);
  if (!request || !ws) return fail("not-found");
  if (!isOwner(ws, deciderId)) return fail("forbidden");
  if (request.status !== "pending") return fail("not-pending");

  Object.assign(request, { status: approve ? "approved" : "rejected", decidedBy: deciderId, at: nowLabel() });
  if (!approve) return { ok: true, value: request };

  if (!isMember(ws, request.userId)) ws.members.push({ userId: request.userId, role: "member" });
  return { ok: true, value: request };
}

export function cancelJoinRequest(requestId: string, userId: string): Result<JoinRequest> {
  const request = store().joinRequests.find((r) => r.id === requestId);
  if (!request || request.userId !== userId) return fail("not-found");
  if (request.status !== "pending") return fail("not-pending");
  Object.assign(request, { status: "cancelled", at: nowLabel() });
  return { ok: true, value: request };
}

// ---------- Workspace riêng: key của nhà cung cấp ----------

// Danh sách mô hình nhà cung cấp trả về khi kiểm key. Khi có backend, đây là kết quả gọi endpoint liệt kê mô hình.
export const MODEL_CATALOG: Record<ProviderKind, string[]> = {
  anthropic: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
  "openai-compatible": ["gpt-6-luna", "qwen-3.8-max", "deepseek-v4"],
};

export interface ProviderKeyInput {
  userId: string;
  provider: ProviderKind;
  apiKey: string;
  baseUrl?: string;
}

// Kiểm key rồi lưu. Kho chỉ giữ 4 ký tự cuối; key đầy đủ không bao giờ được lưu hay trả lại.
// Bản giả lập: key ngắn hơn 20 ký tự bị coi là sai, key kết thúc bằng "0000" bị coi là hết hạn mức.
export function saveProviderKey(input: ProviderKeyInput): Result<ProviderKey> {
  const key = input.apiKey.trim();
  if (key.length < 20 || /\s/.test(key)) return fail("invalid-key");
  if (key.endsWith("0000")) return fail("quota");
  const models = MODEL_CATALOG[input.provider];
  const s = store();
  const previous = s.providerKeys.find((k) => k.userId === input.userId);
  const entry: ProviderKey = {
    userId: input.userId,
    provider: input.provider,
    baseUrl: input.provider === "openai-compatible" ? input.baseUrl?.trim() || "https://api.openai.com/v1" : undefined,
    keyLast4: key.slice(-4),
    model: previous && models.includes(previous.model) ? previous.model : models[0],
    models,
    savedAt: nowLabel(),
  };
  s.providerKeys = [...s.providerKeys.filter((k) => k.userId !== input.userId), entry];
  return { ok: true, value: entry };
}

export function chooseModel(userId: string, model: string): Result<ProviderKey> {
  const entry = store().providerKeys.find((k) => k.userId === userId);
  if (!entry) return fail("no-key");
  if (!entry.models.includes(model)) return fail("not-found");
  entry.model = model;
  return { ok: true, value: entry };
}

export function removeProviderKey(userId: string) {
  const s = store();
  s.providerKeys = s.providerKeys.filter((k) => k.userId !== userId);
}

// ---------- Workspace riêng: hội thoại ----------

function titleFrom(text: string): string {
  const line = text.trim().split("\n")[0];
  return line.length > 48 ? `${line.slice(0, 47).trimEnd()}…` : line;
}

// Câu trả lời giả lập của agent. Khi có backend, đây là câu trả lời stream từ mô hình đã chọn,
// gửi kèm toàn bộ các lượt trước của hội thoại và, nếu hội thoại gắn workspace chung, ngữ cảnh nhóm.
function fakeAnswer(conv: Conversation, model: string, question: string, ctx: AgentContext | undefined): string {
  const earlier = conv.turns.filter((t) => t.role === "user").length;
  const history =
    earlier > 0
      ? `Mình vẫn giữ ${earlier} câu hỏi trước của bạn trong hội thoại này, nên trả lời tiếp từ đó.`
      : "Đây là câu hỏi đầu tiên của hội thoại.";
  const parts = [history];
  if (ctx) {
    const others = ctx.team.filter((m) => m.profile.id !== conv.ownerId);
    const team = others.map((m) => `${m.profile.displayName}${m.teamRole ? ` (${m.teamRole})` : ""}`).join(", ");
    parts.push(
      `Ngữ cảnh nhóm "${ctx.ws.name}": trong nhóm còn ${team || "chưa có ai khác"}. Mình đọc ${ctx.ownMessages.length} tin của bạn trong kênh và ${ctx.highlights.length} đoạn bạn highlight.`,
    );
    if (ctx.highlights.length > 0) {
      parts.push(ctx.highlights.map((h, i) => `${i + 1}. ${h.speaker} nói: "${h.text}"`).join("\n"));
    }
  }
  parts.push(
    `Về "${titleFrom(question)}": đây là câu trả lời mẫu của bản giao diện. Khi nối backend, ${model} trả lời thật bằng key của bạn và chữ hiện dần trong lúc mô hình viết.`,
  );
  return parts.join("\n\n");
}

export function startConversation(userId: string): Result<Conversation> {
  const conv: Conversation = { id: nextId("c"), ownerId: userId, title: "Hội thoại mới", updatedAt: nowLabel(), turns: [] };
  store().conversations.unshift(conv);
  return { ok: true, value: conv };
}

export function sendTurn(
  userId: string,
  conversationId: string | undefined,
  text: string,
  workspaceId?: string,
): Result<Conversation> {
  const question = text.trim();
  if (!question) return fail("empty");
  const s = store();
  const key = s.providerKeys.find((k) => k.userId === userId);
  if (!key) return fail("no-key");

  let conv = conversationId ? s.conversations.find((c) => c.id === conversationId) : undefined;
  if (conversationId && (!conv || conv.ownerId !== userId)) return fail("not-found");
  if (!conv) {
    const ws = getWorkspace(workspaceId);
    const linked = ws && ws.kind === "shared" && isMember(ws, userId) ? ws.id : undefined;
    conv = {
      id: nextId("c"),
      ownerId: userId,
      title: titleFrom(question),
      updatedAt: nowLabel(),
      turns: [],
      workspaceId: linked,
    };
    s.conversations.unshift(conv);
  }
  if (conv.turns.length === 0) conv.title = titleFrom(question);

  const ctx = conv.workspaceId ? getAgentContext(userId, conv.workspaceId) : undefined;
  const answer = fakeAnswer(conv, key.model, question, ctx);
  const at = clockLabel();
  const turns: Turn[] = [
    { id: nextId("u"), role: "user", text: question, at },
    { id: nextId("a"), role: "assistant", text: answer, at, model: key.model },
  ];
  conv.turns.push(...turns);
  conv.updatedAt = nowLabel();
  // Hội thoại vừa dùng lên đầu danh sách.
  s.conversations = [conv, ...s.conversations.filter((c) => c.id !== conv.id)];
  return { ok: true, value: conv };
}

export function deleteConversation(userId: string, conversationId: string): Result<null> {
  const s = store();
  const conv = s.conversations.find((c) => c.id === conversationId);
  if (!conv || conv.ownerId !== userId) return fail("not-found");
  // Highlight là bản chụp nên vẫn còn sau khi xóa hội thoại.
  s.conversations = s.conversations.filter((c) => c.id !== conversationId);
  return { ok: true, value: null };
}

// ---------- Ngữ cảnh nhóm của hội thoại riêng ----------

// Gắn hội thoại riêng với một workspace chung (hoặc bỏ gắn khi workspaceId rỗng). Chỉ gắn được workspace mình là thành viên.
export function linkConversation(userId: string, conversationId: string, workspaceId: string | undefined): Result<Conversation> {
  const conv = store().conversations.find((c) => c.id === conversationId);
  if (!conv || conv.ownerId !== userId) return fail("not-found");
  if (!workspaceId) {
    conv.workspaceId = undefined;
    return { ok: true, value: conv };
  }
  const ws = getWorkspace(workspaceId);
  if (!ws || ws.kind !== "shared") return fail("not-found");
  if (!isMember(ws, userId)) return fail("forbidden");
  conv.workspaceId = ws.id;
  return { ok: true, value: conv };
}

// Mỗi thành viên tự mô tả vai của mình trong nhóm; agent riêng của mọi thành viên đọc được.
export function setTeamRole(userId: string, workspaceId: string, teamRole: string): Result<null> {
  const ws = getWorkspace(workspaceId);
  const member = ws?.members.find((m) => m.userId === userId);
  if (!ws || ws.kind !== "shared") return fail("not-found");
  if (!member) return fail("forbidden");
  const value = teamRole.replace(/\s+/g, " ").trim().slice(0, 40);
  member.teamRole = value || undefined;
  return { ok: true, value: null };
}

export interface AgentPostInput {
  userId: string;
  conversationId: string;
  turnId: string;
  channelId: string;
  text: string;
}

// Gửi một câu trả lời (cả lượt hoặc đoạn đã chọn, đã sửa) từ hội thoại riêng vào kênh của workspace chung
// đã gắn. Tin hiện dưới tên agent của người gửi, ví dụ "claude-sonnet-5-5 của Lan". Hội thoại gốc không đi theo.
export function postAgentReply(input: AgentPostInput): Result<Message> {
  const text = input.text.trim();
  if (!text) return fail("empty");
  const s = store();
  const conv = s.conversations.find((c) => c.id === input.conversationId);
  if (!conv || conv.ownerId !== input.userId) return fail("not-found");
  const turn = conv.turns.find((t) => t.id === input.turnId);
  if (!turn || turn.role !== "assistant") return fail("not-found");
  if (!conv.workspaceId) return fail("not-linked");
  const ws = getWorkspace(conv.workspaceId);
  if (!ws || !ws.channels.some((c) => c.id === input.channelId)) return fail("not-found");
  if (!isMember(ws, input.userId)) return fail("forbidden");

  const message: Message = {
    id: nextId("m"),
    channelId: input.channelId,
    senderKind: "agent",
    senderId: input.userId,
    agentModel: turn.model,
    at: clockLabel(),
    body: [{ t: "text", v: text }],
  };
  const key = `${ws.id}/${input.channelId}`;
  s.messages[key] = [...(s.messages[key] ?? []), message];
  return { ok: true, value: message };
}

// ---------- Highlight trong kênh chung ----------

export interface HighlightInput {
  userId: string;
  workspaceId: string;
  channelId: string;
  messageId: string;
  text: string;
  label: HighlightLabel;
}

// Highlight một đoạn trong tin của người khác (hoặc agent của người khác). Tin của chính mình và của agent mình
// đã tự vào ngữ cảnh nên không highlight. Highlight lưu bản chụp và người nói.
export function addHighlight(input: HighlightInput): Result<Highlight> {
  const text = input.text.replace(/\s+/g, " ").trim();
  if (!text) return fail("empty");
  const ws = getWorkspace(input.workspaceId);
  if (!ws || ws.kind !== "shared") return fail("not-found");
  if (!isMember(ws, input.userId)) return fail("forbidden");
  const message = getMessage(ws.id, input.channelId, input.messageId);
  if (!message || message.senderKind === "system") return fail("not-found");
  if (isOwnMessage(message, input.userId)) return fail("own-message");
  const h: Highlight = {
    id: nextId("h"),
    ownerId: input.userId,
    workspaceId: ws.id,
    channelId: input.channelId,
    messageId: message.id,
    author:
      message.senderKind === "agent"
        ? { kind: "agent", userId: message.senderId, model: message.agentModel }
        : { kind: "human", userId: message.senderId },
    text,
    label: input.label,
    at: nowLabel(),
  };
  store().highlights.push(h);
  return { ok: true, value: h };
}

export function removeHighlight(userId: string, highlightId: string): Result<null> {
  const s = store();
  const h = s.highlights.find((x) => x.id === highlightId);
  if (!h || h.ownerId !== userId) return fail("not-found");
  s.highlights = s.highlights.filter((x) => x.id !== highlightId);
  return { ok: true, value: null };
}

// ---------- Kênh chung ----------

const OWNER_COMMANDS = new Set(["/summarize", "/brief"]);

// Tách chữ thành các đoạn: nhắc tên (@người), lệnh (/lệnh ở đầu từ) và chữ thường.
export function toSegments(text: string, names: string[]): Segment[] {
  const segments: Segment[] = [];
  const re = /(^|\s)(@[^\s@/]+|\/[a-z]+)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const token = m[2];
    const start = (m.index ?? 0) + m[1].length;
    const isMention = token.startsWith("@") && names.includes(token.slice(1).toLowerCase());
    const isCommand = token.startsWith("/");
    if (!isMention && !isCommand) continue;
    if (start > last) segments.push({ t: "text", v: text.slice(last, start) });
    segments.push(isMention ? { t: "mention", v: token.slice(1) } : { t: "command", v: token });
    last = start + token.length;
  }
  if (last < text.length) segments.push({ t: "text", v: text.slice(last) });
  return segments;
}

export interface ChannelPostInput {
  workspaceId: string;
  channelId: string;
  userId: string;
  text: string;
}

// Người gửi tin vào kênh chung. Kênh không có agent tự trả lời: agent của mỗi người làm việc ở workspace riêng
// của người đó, và câu trả lời vào kênh qua postAgentReply.
export function postChannelMessage(input: ChannelPostInput): Result<Message[]> {
  const ws = getWorkspace(input.workspaceId);
  if (!ws || ws.kind !== "shared" || !ws.channels.some((c) => c.id === input.channelId)) return fail("not-found");
  if (!isMember(ws, input.userId)) return fail("forbidden");
  const text = input.text.trim();
  if (!text) return fail("empty");

  const names = getMembers(ws).map((p) => p.displayName.toLowerCase());
  const at = clockLabel();
  const posted: Message[] = [
    {
      id: nextId("m"),
      channelId: input.channelId,
      senderKind: "human",
      senderId: input.userId,
      at,
      body: toSegments(text, names),
    },
  ];

  const command = /(?:^|\s)(\/[a-z]+)/.exec(text)?.[1];
  if (command && OWNER_COMMANDS.has(command) && !isOwner(ws, input.userId)) {
    posted.push({
      id: nextId("m"),
      channelId: input.channelId,
      senderKind: "system",
      senderId: "system",
      at,
      body: [{ t: "text", v: `Chỉ chủ workspace dùng được ${command}. Việc tổng hợp do chủ workspace thực hiện.` }],
    });
  } else if (command === "/summarize") {
    posted.push({
      id: nextId("m"),
      channelId: input.channelId,
      senderKind: "system",
      senderId: "system",
      at,
      body: [
        {
          t: "text",
          v: `Bản giao diện chưa tóm tắt thật. Khi nối backend, ${agentLabel(input.userId)} tóm tắt kênh bằng key của chủ workspace.`,
        },
      ],
    });
  }

  const key = `${ws.id}/${input.channelId}`;
  store().messages[key] = [...(store().messages[key] ?? []), ...posted];
  return { ok: true, value: posted };
}

// ---------- Đăng ký tài khoản (lần đầu đăng nhập bằng Google hoặc GitHub) ----------

export interface SignUpInput {
  provider: AuthProvider;
  login: string;
  displayName: string;
}

export type SignUpError = "invalid-login" | "invalid-name";

const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignUp(input: SignUpInput): SignUpError | null {
  const login = input.login.trim();
  const ok = input.provider === "github" ? GITHUB_LOGIN.test(login) : EMAIL.test(login) && login.length <= 254;
  if (!ok) return "invalid-login";
  const name = input.displayName.trim();
  if (!name || name.length > 40) return "invalid-name";
  return null;
}

// Giả lập phần Supabase Auth làm khi một tài khoản Google/GitHub đăng nhập lần đầu: tạo hồ sơ, gắn tài khoản của nhà
// cung cấp và tạo workspace riêng (chưa có key, chưa vào workspace chung nào). Tài khoản đã có thì trả về hồ sơ cũ.
export function registerAccount(
  input: SignUpInput,
): { ok: true; value: { userId: string; created: boolean } } | { ok: false; error: SignUpError } {
  const error = validateSignUp(input);
  if (error) return { ok: false, error };
  const s = store();
  const login = input.login.trim();
  const existing = s.oauthAccounts.find((a) => a.provider === input.provider && a.login.toLowerCase() === login.toLowerCase());
  if (existing) return { ok: true, value: { userId: existing.userId, created: false } };

  const displayName = input.displayName.trim().replace(/\s+/g, " ");
  const userId = nextId("u");
  s.profiles[userId] = { id: userId, displayName, initial: displayName.slice(0, 1).toUpperCase() };
  s.oauthAccounts.push({ provider: input.provider, userId, login });
  const wsId = `rieng-${userId}`;
  s.workspaces[wsId] = {
    id: wsId,
    name: `Của riêng ${displayName}`,
    short: displayName.slice(0, 1).toUpperCase(),
    kind: "personal",
    visibility: "hidden",
    ownerId: userId,
    brief: "",
    modules: [],
    members: [{ userId, role: "owner" }],
    channels: [],
  };
  return { ok: true, value: { userId, created: true } };
}
