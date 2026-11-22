// Defines personal conversations with the agent and the private highlights kept from them.
import type { Channel } from "./workspace";

/** Token counts the provider reported for one answer; `cachedInputTokens` were read from its prompt cache. */
export interface TurnUsage {
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTokens: number | null;
}

/** A PDF or Word file attached to a conversation; only its text is kept and sent to the agent. */
export interface ConversationDocument {
  id: string;
  fileName: string;
  mediaType: string;
  sizeBytes: number;
  charCount: number;
  sentChars: number;
  truncated: boolean;
  createdAt: string;
}

export interface Turn {
  id: string;
  /** Answer versions kept by "regenerate", oldest first; `version` is this answer's number. */
  versions?: string[];
  version?: number;
  role: "user" | "assistant";
  text: string;
  at: string;
  model?: string;
  postAs?: string;
  /** The answer is only a provider error notice and is never sent back to the model. */
  error?: string;
  /** The user stopped the answer, or the connection dropped; the text is what was written until then. */
  stopped?: boolean;
  usage?: TurnUsage;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  workspaceId: string | null;
  workspace: { id: string; name: string; isMember: boolean; channels: Channel[] } | null;
  linked: boolean;
}

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export interface ConversationHighlightMark {
  id: string;
  turnId: string | null;
  text: string;
  color: HighlightColor;
  kind: string;
}

export interface Conversation extends ConversationSummary {
  turns: Turn[];
  highlights: ConversationHighlightMark[];
  highlightCount: number;
  /** Turn id to version group, to open the version that holds a highlight. */
  turnVersions?: Record<string, string>;
  documents: ConversationDocument[];
}

export interface HighlightSend {
  workspaceId: string;
  workspaceName: string | null;
  channelId: string;
  channelName: string | null;
  messageId: string;
  at: string;
}

export type PrivateHighlightKind = "passage" | "summary" | "digest";

export interface PrivateHighlight {
  id: string;
  kind: PrivateHighlightKind;
  conversationId: string | null;
  conversationTitle: string;
  conversationDeleted: boolean;
  turnId: string | null;
  speakerKind: "agent" | "human";
  model: string | null;
  speaker: string;
  text: string;
  originalText: string;
  /** The whole turn the passage came from, to tell whole sentences from cuts and edits. */
  sourceText: string | null;
  edited: boolean;
  partial: boolean;
  cutStart: boolean;
  cutEnd: boolean;
  color: HighlightColor;
  note: string | null;
  attachedTurns: Array<{ id: string; role: "user" | "assistant"; text: string; model: string | null; at: string }>;
  sends: HighlightSend[];
  workspaceId: string | null;
  /** Group contexts the agent was reading when it wrote this; sending elsewhere asks for confirmation. */
  contextWorkspaces: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateHighlightList {
  items: PrivateHighlight[];
  total: number;
  limit: number;
  nearLimit: boolean;
}
