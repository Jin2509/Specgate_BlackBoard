// Defines the signed-in account as returned by GET /api/me.
import type { PersonalAgent, ProviderKey } from "./agent";
import type { JoinRequest } from "./join";
import type { Profile } from "./profile";
import type { RailWorkspace } from "./workspace";

export interface Me {
  user: Profile;
  personalWorkspaceId: string | null;
  key: ProviderKey | null;
  agent: PersonalAgent | null;
  workspaces: RailWorkspace[];
  pendingJoins: JoinRequest[];
  home: string;
  lastSharedPath: string | null;
  privateHighlights: { total: number; limit: number };
}
