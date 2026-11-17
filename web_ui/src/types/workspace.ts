// Defines shared and personal workspaces, their channels and members.
import type { PersonalAgent } from "./agent";
import type { Profile } from "./profile";

export type WorkspaceKind = "personal" | "shared";
export type Visibility = "hidden" | "discoverable";
export type MemberRole = "owner" | "member";
export type WorkspaceModule = "adom";

export interface Channel {
  id: string;
  name: string;
  unread?: boolean;
  mentioned?: boolean;
}

export interface TeamMember {
  user: Profile;
  role: MemberRole;
  teamRole: string | null;
  needsNickname?: boolean;
  agent: PersonalAgent | null;
}

export interface Workspace {
  id: string;
  kind: WorkspaceKind;
  name: string;
  short: string;
  brief: string;
  visibility: Visibility;
  ownerId: string;
  createdAt: string;
  myRole?: MemberRole;
  myTeamRole?: string | null;
  myName?: string;
  needsNickname?: boolean;
  joinCode?: string | null;
  joinCodeAt?: string | null;
  channels?: Channel[];
  members?: TeamMember[];
  modules?: WorkspaceModule[];
}

export interface SharedWorkspace extends Workspace {
  kind: "shared";
  myRole: MemberRole;
  channels: Channel[];
  members: TeamMember[];
}

/** `pendingRequests` is sent to the owner only. */
export interface RailWorkspace {
  id: string;
  name: string;
  short: string;
  role: MemberRole;
  unread?: boolean;
  mentioned?: boolean;
  pendingRequests?: number;
  channels?: Array<{ id: string; unread: boolean; mentioned: boolean }>;
}
