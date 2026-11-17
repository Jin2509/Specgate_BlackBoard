// Defines join codes, join requests and the public view of a workspace.
import type { Profile } from "./profile";

export type JoinStatus = "pending" | "approved" | "rejected" | "cancelled";
export type JoinRelation = "none" | "pending" | "member";

export interface JoinCode {
  code: string;
  createdAt: string | null;
}

export interface WorkspaceCard {
  id: string;
  name: string;
  short: string;
  brief: string;
  ownerName: string;
  memberCount: number;
}

export interface ExploreCard extends WorkspaceCard {
  relation: JoinRelation;
  pendingRequestId: string | null;
}

export interface ExploreListing {
  workspaces: ExploreCard[];
  selected: ExploreCard | null;
}

export interface JoinRequest {
  id: string;
  workspaceId: string;
  workspaceName: string | null;
  workspace: WorkspaceCard | null;
  userId: string;
  user: Profile | null;
  message: string;
  status: JoinStatus;
  via: "code" | "explore";
  code: string | null;
  at: string;
  decidedAt: string | null;
  decidedBy: string | null;
  deciderName: string | null;
  redirect?: string;
}

export interface JoinRequestBoard {
  pending: JoinRequest[];
  history: JoinRequest[];
}
