// Defines the idea board, its cards and the brief built from it.
import type { Profile } from "./profile";
import type { CardRun, RunState } from "./run";

export type BoardItemKind = "idea" | "note";
export type IdeaStatus = "proposed" | "discussing" | "decided" | "rejected";
export type Decision = "decided" | "rejected";

export interface BoardItem {
  id: string;
  number: number;
  kind: BoardItemKind;
  body: string;
  status: IdeaStatus | null;
  reason: string | null;
  createdBy: { kind: "human" | "agent" | "data"; id: string };
  authorName: string;
  /** A pin of a message and its card: one idea in several parts, each with its own speaker. */
  parts?: Array<{ speaker: string; text: string }>;
  /** A pinned stats card whose run was invalidated, superseded or removed since. */
  notice?: string;
  runState?: RunState;
  at: string;
  source: { channelId: string | null; messageId: string | null };
  decidedBy?: { id: string; at: string | null };
  deciderName?: string;
}

/** A board item whose times were formatted on the server, so client components never format dates. */
export interface BoardCard extends BoardItem {
  atLabel: string;
  decidedAtLabel?: string;
}

export interface Board {
  columns: Array<{ status: IdeaStatus; title: string; items: BoardItem[] }>;
  notes: BoardItem[];
}

export interface BriefRow {
  number: number;
  body: string;
  reason: string | null;
  authorName: string;
  deciderName: string | null;
}

export interface Brief {
  id: string;
  workspaceId: string;
  builtAt: string;
  builtBy: Profile | null;
  title: string;
  brief: string;
  memberCount: number;
  decided: BriefRow[];
  rejected: BriefRow[];
  discussing: BriefRow[];
  notes: BriefRow[];
  evidence?: { run: CardRun; criteria: string[] } | null;
  markdown: string;
}
