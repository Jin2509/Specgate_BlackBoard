// Các hàm truy vấn dữ liệu cho trang và component.
import type { Agent, BoardCard, BoardItem, Invite, JoinRelation, Message, Profile, Workspace } from "@/lib/types";
import {
  accounts,
  agents,
  boards,
  criteria,
  criterionAnnotations,
  draftAgreement,
  invites,
  joinRequests,
  messages,
  profiles,
  repairRows,
  runCost,
  runs,
  taskResults,
  workspaces,
} from "./data";

export function getWorkspaceIds(): string[] {
  return Object.keys(workspaces);
}

export function getWorkspace(id: string | undefined): Workspace | undefined {
  return id ? workspaces[id] : undefined;
}

export function getProfile(id: string | undefined): Profile | undefined {
  return id ? profiles[id] : undefined;
}

export function findUserByEmail(email: string): Profile | undefined {
  return getProfile(accounts[email.trim().toLowerCase()]);
}

export function isMember(ws: Workspace, userId: string, joined: string[] = []): boolean {
  return ws.members.some((m) => m.userId === userId) || joined.includes(ws.id);
}

export function isOwner(ws: Workspace, userId: string): boolean {
  return ws.members.some((m) => m.userId === userId && m.role === "owner");
}

export function getRail(userId: string, joined: string[] = []): Workspace[] {
  const mine = Object.values(workspaces).filter((w) => isMember(w, userId, joined));
  return [...mine.filter((w) => w.kind === "personal"), ...mine.filter((w) => w.kind === "shared")];
}

export function getPersonalWorkspace(userId: string): Workspace | undefined {
  return Object.values(workspaces).find((w) => w.kind === "personal" && w.ownerId === userId);
}

export function getMembers(ws: Workspace): Profile[] {
  return ws.members.map((m) => profiles[m.userId]).filter(Boolean);
}

export function getDiscoverableWorkspaces(): Workspace[] {
  const order = ["adom", "on-thi", "do-an"];
  return Object.values(workspaces)
    .filter((w) => w.kind === "shared" && w.visibility === "discoverable")
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

export function getJoinRelation(ws: Workspace, userId: string, joined: string[] = []): JoinRelation {
  if (isMember(ws, userId, joined)) return "member";
  const pending = joinRequests.some((r) => r.workspaceId === ws.id && r.userId === userId && r.status === "pending");
  return pending ? "pending" : "none";
}

export function getInvite(code: string): Invite | undefined {
  return invites.find((i) => i.code === code);
}

export function getInvites(workspaceId: string): Invite[] {
  return invites.filter((i) => i.workspaceId === workspaceId);
}

export function getAgents(ws: Workspace): Agent[] {
  return ws.agentIds.map((id) => agents[id]).filter(Boolean);
}

export function getAgent(id: string | undefined): Agent | undefined {
  return id ? agents[id] : undefined;
}

export function getMessages(workspaceId: string, channelId: string): Message[] {
  return messages[`${workspaceId}/${channelId}`] ?? [];
}

export function authorName(by: BoardItem["createdBy"]): string {
  return by.kind === "agent" ? (agents[by.id]?.handle ?? by.id) : (profiles[by.id]?.displayName ?? by.id);
}

function toCard(item: BoardItem): BoardCard {
  return {
    ...item,
    authorName: authorName(item.createdBy),
    deciderName: item.decidedBy ? profiles[item.decidedBy.id]?.displayName : undefined,
  };
}

export function getBoard(workspaceId: string): BoardCard[] {
  return (boards[workspaceId] ?? []).map(toCard);
}

export function countIdeas(workspaceId: string): number {
  return (boards[workspaceId] ?? []).filter((i) => i.kind === "idea").length;
}

export function getCapsuleItems(itemIds: string[]): BoardCard[] {
  const all = Object.values(boards).flat();
  return itemIds.flatMap((id) => {
    const item = all.find((i) => i.id === id);
    return item ? [toCard(item)] : [];
  });
}

export function getBriefHeader(ws: Workspace): { title: string; meta: string } {
  return {
    title: ws.id === "do-an" ? "Chọn đề tài đồ án môn Kiểm chứng phần mềm" : ws.name,
    meta: `27/11/2026 14:20 · ${ws.members.length} thành viên, ${getAgents(ws).length} agent · 46 tin nhắn`,
  };
}

export function getJoinRequests(workspaceId: string) {
  return joinRequests.filter((r) => r.workspaceId === workspaceId);
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
