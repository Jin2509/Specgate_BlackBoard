// Các hàm truy vấn dữ liệu cho trang và component.
import type {
  AuthProvider,
  BoardCard,
  BoardItem,
  Conversation,
  Highlight,
  JoinCode,
  JoinRelation,
  JoinRequest,
  Message,
  MemberRole,
  OAuthAccount,
  PersonalAgent,
  Profile,
  ProviderKey,
  Workspace,
} from "@/lib/types";
import {
  criteria,
  criterionAnnotations,
  draftAgreement,
  repairRows,
  runCost,
  runs,
  taskResults,
  workspaces as seedWorkspaces,
} from "./data";
import { store } from "./store";

export function getWorkspaceIds(): string[] {
  return Object.keys(seedWorkspaces);
}

export function getWorkspace(id: string | undefined): Workspace | undefined {
  return id ? store().workspaces[id] : undefined;
}

export function getProfile(id: string | undefined): Profile | undefined {
  return id ? store().profiles[id] : undefined;
}

export function getOAuthAccounts(provider: AuthProvider): Array<OAuthAccount & { profile: Profile }> {
  return store()
    .oauthAccounts.filter((a) => a.provider === provider)
    .map((a) => ({ ...a, profile: store().profiles[a.userId] }));
}

// Tài khoản của nhà cung cấp theo tên đăng nhập (email Google hoặc tên GitHub), không phân biệt hoa thường.
export function findOAuthIdentity(provider: AuthProvider, login: string): OAuthAccount | undefined {
  const key = login.trim().toLowerCase();
  return store().oauthAccounts.find((a) => a.provider === provider && a.login.toLowerCase() === key);
}

export function findOAuthAccount(provider: unknown, userId: unknown): OAuthAccount | undefined {
  return store().oauthAccounts.find((a) => a.provider === provider && a.userId === userId);
}

export function isMember(ws: Workspace, userId: string): boolean {
  return ws.members.some((m) => m.userId === userId);
}

export function isOwner(ws: Workspace, userId: string): boolean {
  return ws.members.some((m) => m.userId === userId && m.role === "owner");
}

export function getRail(userId: string): Workspace[] {
  const mine = Object.values(store().workspaces).filter((w) => isMember(w, userId));
  return [...mine.filter((w) => w.kind === "personal"), ...mine.filter((w) => w.kind === "shared")];
}

export function getPersonalWorkspace(userId: string): Workspace | undefined {
  return Object.values(store().workspaces).find((w) => w.kind === "personal" && w.ownerId === userId);
}

export function getMembers(ws: Workspace): Profile[] {
  return ws.members.map((m) => store().profiles[m.userId]).filter(Boolean);
}

export function getDiscoverableWorkspaces(): Workspace[] {
  return Object.values(store().workspaces).filter((w) => w.kind === "shared" && w.visibility === "discoverable");
}

export function getPendingRequest(workspaceId: string, userId: string): JoinRequest | undefined {
  return store().joinRequests.find((r) => r.workspaceId === workspaceId && r.userId === userId && r.status === "pending");
}

export function getJoinRelation(ws: Workspace, userId: string): JoinRelation {
  if (isMember(ws, userId)) return "member";
  return getPendingRequest(ws.id, userId) ? "pending" : "none";
}

export function getJoinCode(workspaceId: string): JoinCode | undefined {
  return store().joinCodes.find((c) => c.workspaceId === workspaceId);
}

export function findWorkspaceByCode(code: string): Workspace | undefined {
  return getWorkspace(store().joinCodes.find((c) => c.code === code)?.workspaceId);
}

export function getJoinRequest(id: string): JoinRequest | undefined {
  return store().joinRequests.find((r) => r.id === id);
}

// Workspace chung người dùng đang chờ duyệt, hiện mờ trên thanh workspace.
export function getPendingJoins(userId: string): Array<{ request: JoinRequest; ws: Workspace }> {
  return store().joinRequests.flatMap((r) => {
    const ws = r.userId === userId && r.status === "pending" ? getWorkspace(r.workspaceId) : undefined;
    return ws ? [{ request: r, ws }] : [];
  });
}

export function getMessages(workspaceId: string, channelId: string): Message[] {
  return store().messages[`${workspaceId}/${channelId}`] ?? [];
}

export function getMessage(workspaceId: string, channelId: string, messageId: string): Message | undefined {
  return getMessages(workspaceId, channelId).find((m) => m.id === messageId);
}

function nameOf(userId: string): string {
  return store().profiles[userId]?.displayName ?? userId;
}

// ---------- Agent riêng và đội ----------

// Agent riêng của một người là mô hình người đó đang chọn ở workspace riêng. Chưa có key thì chưa có agent.
export function getPersonalAgent(userId: string): PersonalAgent | undefined {
  const key = getProviderKey(userId);
  return key ? { ownerId: userId, ownerName: nameOf(userId), provider: key.provider, model: key.model } : undefined;
}

// Cách gọi tên agent ở mọi nơi: mô hình kèm tên chủ, ví dụ "claude-sonnet-5-5 của Lan".
export function agentLabel(ownerId: string, model?: string): string {
  return `${model ?? "agent"} của ${nameOf(ownerId)}`;
}

export interface TeamMember {
  profile: Profile;
  role: MemberRole;
  teamRole?: string;
  agent?: PersonalAgent;
}

export function getTeam(ws: Workspace): TeamMember[] {
  return ws.members.flatMap((m) => {
    const profile = store().profiles[m.userId];
    return profile ? [{ profile, role: m.role, teamRole: m.teamRole, agent: getPersonalAgent(m.userId) }] : [];
  });
}

export function getTeamAgents(ws: Workspace): PersonalAgent[] {
  return getTeam(ws).flatMap((m) => (m.agent ? [m.agent] : []));
}

// Tên người nói của một tin: người, hoặc agent của ai.
export function speakerLabel(m: Pick<Message, "senderKind" | "senderId" | "agentModel">): string {
  if (m.senderKind === "agent") return agentLabel(m.senderId, m.agentModel);
  if (m.senderKind === "system") return "Hệ thống";
  return nameOf(m.senderId);
}

export function highlightAuthorLabel(h: Highlight): string {
  return h.author.kind === "agent" ? agentLabel(h.author.userId, h.author.model) : nameOf(h.author.userId);
}

// ---------- Workspace riêng ----------

export function getProviderKey(userId: string): ProviderKey | undefined {
  return store().providerKeys.find((k) => k.userId === userId);
}

export function getConversations(userId: string): Conversation[] {
  return store().conversations.filter((c) => c.ownerId === userId);
}

export function getConversation(id: string, userId: string): Conversation | undefined {
  return store().conversations.find((c) => c.id === id && c.ownerId === userId);
}

// Highlight của một người, mới nhất lên đầu. Chỉ người tạo thấy highlight của mình.
export function getHighlights(userId: string, workspaceId?: string): Highlight[] {
  return store()
    .highlights.filter((h) => h.ownerId === userId && (!workspaceId || h.workspaceId === workspaceId))
    .slice()
    .reverse();
}

// Tin "của mình" trong kênh chung: tin mình nhắn và tin agent của mình gửi. Những tin này tự vào ngữ cảnh
// của agent riêng, không cần highlight.
export function isOwnMessage(m: Message, userId: string): boolean {
  return m.senderKind !== "system" && m.senderId === userId;
}

export interface ContextMessage {
  channelName: string;
  speaker: string;
  text: string;
  at: string;
}

export interface ContextHighlight extends Highlight {
  channelName: string;
  speaker: string;
}

// Ngữ cảnh nhóm gửi kèm mỗi lời gọi mô hình của một hội thoại riêng đã gắn workspace chung:
// đề bài, đội (vai trong nhóm và agent của từng người), ý đã chốt và đã loại, mọi tin của chính mình
// trong các kênh, và các đoạn mình đã highlight kèm người nói. Không có tin nào khác của người khác.
export interface AgentContext {
  ws: Workspace;
  team: TeamMember[];
  decided: BoardCard[];
  rejected: BoardCard[];
  ownMessages: ContextMessage[];
  highlights: ContextHighlight[];
}

export function messageText(m: Message): string {
  const body = m.body.map((seg) => (seg.t === "mention" ? `@${seg.v}` : "v" in seg ? seg.v : seg.ref.label)).join("");
  return [body, ...(m.list ?? []).map((li, i) => `${i + 1}. ${li}`)].filter(Boolean).join("\n");
}

export function getAgentContext(userId: string, workspaceId: string): AgentContext | undefined {
  const ws = getWorkspace(workspaceId);
  if (!ws || ws.kind !== "shared" || !isMember(ws, userId)) return undefined;
  const board = getBoard(ws.id).filter((i) => i.kind === "idea");
  const channelName = (id: string) => ws.channels.find((c) => c.id === id)?.name ?? id;
  const ownMessages = ws.channels.flatMap((c) =>
    getMessages(ws.id, c.id)
      .filter((m) => isOwnMessage(m, userId))
      .map((m) => ({ channelName: c.name, speaker: speakerLabel(m), text: messageText(m), at: m.at })),
  );
  return {
    ws,
    team: getTeam(ws),
    decided: board.filter((i) => i.status === "decided"),
    rejected: board.filter((i) => i.status === "rejected"),
    ownMessages,
    highlights: getHighlights(userId, ws.id)
      .slice()
      .reverse()
      .map((h) => ({ ...h, channelName: channelName(h.channelId), speaker: highlightAuthorLabel(h) })),
  };
}

export function authorName(by: BoardItem["createdBy"]): string {
  return by.kind === "agent" ? `Agent của ${nameOf(by.id)}` : nameOf(by.id);
}

function toCard(item: BoardItem): BoardCard {
  return {
    ...item,
    authorName: authorName(item.createdBy),
    deciderName: item.decidedBy ? store().profiles[item.decidedBy.id]?.displayName : undefined,
  };
}

export function getBoard(workspaceId: string): BoardCard[] {
  return (store().boards[workspaceId] ?? []).map(toCard);
}

export function countIdeas(workspaceId: string): number {
  return (store().boards[workspaceId] ?? []).filter((i) => i.kind === "idea").length;
}

export function getBriefHeader(ws: Workspace): { title: string; meta: string } {
  return {
    title: ws.id === "do-an" ? "Chọn đề tài đồ án môn Kiểm chứng phần mềm" : ws.name,
    meta: `Dựng lúc 27/11/2026 14:20, từ ${ws.members.length} thành viên và agent riêng của họ`,
  };
}

export function getJoinRequests(workspaceId: string) {
  // Mới nhất lên đầu.
  return store()
    .joinRequests.filter((r) => r.workspaceId === workspaceId)
    .reverse();
}

export function pendingRequests(workspaceId: string) {
  return getJoinRequests(workspaceId).filter((r) => r.status === "pending");
}

export function getRuns(workspaceId: string) {
  return runs.filter((r) => r.workspaceId === workspaceId);
}

export function getRun(runId: string) {
  return runs.find((r) => r.id === runId);
}

export function getCriteria() {
  return criteria;
}

export function countCriterionIdeas(criterion: number): number {
  return criterionAnnotations[criterion]?.length ?? 0;
}

export function getRepairRows() {
  return repairRows;
}

export function getTaskResults() {
  return taskResults;
}

export function getDraftAgreement() {
  return draftAgreement;
}

export function getRunCost() {
  return runCost;
}
