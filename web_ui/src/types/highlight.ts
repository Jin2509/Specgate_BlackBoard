// Defines agent highlights and the group context a linked conversation sends to the model.
import type { ContextTask } from "./task";
import type { TeamMember } from "./workspace";

export type HighlightLabel = "important" | "review";

export interface HighlightSegment {
  messageId: string;
  channelId: string;
  channelName: string | null;
  part: number | null;
  text: string;
  at: string;
  authorKind: "human" | "agent";
  authorUserId: string;
  authorModel?: string | null;
  speaker: string;
  /** Index of an attached original turn inside a conversation summary card; absent for the summary itself. */
  turn?: number | null;
  partial?: boolean;
  cutStart?: boolean;
  cutEnd?: boolean;
  /** Taken from a summary: a retelling, not anyone's own position. */
  relayed?: boolean;
}

export interface Highlight {
  id: string;
  ownerId: string;
  workspaceId: string;
  workspaceName: string | null;
  channelId: string;
  channelName: string | null;
  messageId: string;
  author: { kind: "human" | "agent"; userId: string; model?: string };
  speaker: string;
  text: string;
  label: HighlightLabel;
  note: string | null;
  segments: HighlightSegment[];
  sourceAt: string;
  at: string;
}

export interface HighlightGroups {
  groups: Array<{ workspaceId: string; workspaceName: string | null; highlights: Highlight[]; count: number; limit: number }>;
  total: number;
  limit: number;
}

export interface ContextIdea {
  id: string;
  number: number;
  body: string;
  reason: string | null;
  deciderName: string | null;
}

export type TimelineItem =
  | {
      kind: "own";
      id: string;
      at: string;
      channelId: string;
      channelName: string;
      speaker: string;
      text: string;
      replyTo?: { id: string; speaker: string };
      /** An old message kept verbatim because its block was too short to summarize. */
      fromDigest?: boolean;
    }
  | {
      kind: "digest";
      id: string;
      at: string;
      to: string;
      count: number;
      text: string;
      title: string;
    }
  | {
      kind: "highlight";
      id: string;
      at: string;
      channelId: string;
      channelName: string | null;
      label: HighlightLabel;
      note: string | null;
      segments: HighlightSegment[];
    };

export interface AgentContext {
  workspace: { id: string; name: string; brief: string };
  myName: string;
  myTeamRole: string | null;
  team: TeamMember[];
  tasks: ContextTask[];
  decided: ContextIdea[];
  rejected: ContextIdea[];
  timeline: TimelineItem[];
  ownMessagesCount: number;
  ownMessagesOmitted: number;
  digest: { text: string; count: number; at: string; model: string | null; blocks: number } | null;
  digestPending: boolean;
  /** What "summarize old messages" will do, shown before the user pays for it. */
  digestPlan: {
    messages: number;
    blocks: number;
    summarizedBlocks: number;
    verbatimMessages: number;
    calls: number;
  } | null;
  highlights: Array<Highlight & { status: string }>;
  highlightLimit: number;
}

export interface ContextResponse {
  linked: boolean;
  context: AgentContext | null;
  system: string;
}
