// Các hàm truy vấn dữ liệu cho trang và component.
import type {
  Agent,
  AuthProvider,
  BoardCard,
  BoardItem,
  Conversation,
  Highlight,
  JoinCode,
  JoinRelation,
  JoinRequest,
  Message,
  OAuthAccount,
  Profile,
  ProviderKey,
  Workspace,
} from "@/lib/types";
import {
  agents,
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

export function getAgents(ws: Workspace): Agent[] {
  return ws.agentIds.map((id) => agents[id]).filter(Boolean);
}

export function getAgent(id: string | undefined): Agent | undefined {
  return id ? agents[id] : undefined;
}

export function getMessages(workspaceId: string, channelId: string): Message[] {
  return store().messages[`${workspaceId}/${channelId}`] ?? [];
}

// Workspace riêng.
export function getProviderKey(userId: string): ProviderKey | undefined {
  return store().providerKeys.find((k) => k.userId === userId);
}

export function getConversations(userId: string): Conversation[] {
  return store().conversations.filter((c) => c.ownerId === userId);
}

export function getConversation(id: string, userId: string): Conversation | undefined {
  return store().conversations.find((c) => c.id === id && c.ownerId === userId);
}

export function getHighlights(userId: string): Highlight[] {
  return store()
    .highlights.filter((h) => h.ownerId === userId)
    .slice()
    .reverse();
}

// Highlight đã được gửi vào một workspace chung thì mọi thành viên của workspace đó đọc được bản chụp,
// nhưng không ai đọc được hội thoại gốc.
export function getSharedHighlight(id: string): (Highlight & { ownerName: string }) | undefined {
  const h = store().highlights.find((x) => x.id === id);
  return h ? { ...h, ownerName: store().profiles[h.ownerId]?.displayName ?? h.ownerId } : undefined;
}

export function isHighlightOnBoard(workspaceId: string, highlightId: string): boolean {
  return (store().boards[workspaceId] ?? []).some((i) => i.fromHighlight?.highlightId === highlightId);
}

export function authorName(by: BoardItem["createdBy"]): string {
  return by.kind === "agent" ? (agents[by.id]?.handle ?? by.id) : (store().profiles[by.id]?.displayName ?? by.id);
}

function toCard(item: BoardItem): BoardCard {
  return {
    ...item,
    authorName: item.fromHighlight
      ? (store().profiles[item.fromHighlight.ownerId]?.displayName ?? item.fromHighlight.ownerId)
      : authorName(item.createdBy),
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
    meta: `Dựng lúc 27/11/2026 14:20, từ ${ws.members.length} thành viên và ${getAgents(ws).length} agent`,
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
