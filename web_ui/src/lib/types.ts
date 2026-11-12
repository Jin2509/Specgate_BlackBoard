// Kiểu dữ liệu của workspace, bảng ý tưởng, tin nhắn và mô-đun ADOM.
export type WorkspaceKind = "personal" | "shared";
export type Visibility = "hidden" | "discoverable";
export type MemberRole = "owner" | "member";

export interface Profile {
  id: string;
  displayName: string;
  initial: string;
}

export type AuthProvider = "github" | "google";

export interface OAuthAccount {
  provider: AuthProvider;
  userId: string;
  login: string;
}

export interface Workspace {
  id: string;
  name: string;
  short: string;
  kind: WorkspaceKind;
  visibility: Visibility;
  ownerId: string;
  brief: string;
  modules: Array<"adom">;
  members: Array<{ userId: string; role: MemberRole }>;
  channels: Channel[];
  agentIds: string[];
}

export interface Channel {
  id: string;
  name: string;
}

export type AgentRole = "generator" | "critic" | "synthesizer" | "custom";

export interface Agent {
  id: string;
  handle: string;
  role: AgentRole;
  provider: string;
  model: string;
  systemPrompt: string;
  keyLast4: string;
  budgetUsd: number;
  spentUsd: number;
  enabled: boolean;
}

export type SenderKind = "human" | "agent" | "system";

export type RefTarget =
  | { module: "adom"; kind: "run"; runId: string; label: string }
  | { module: "adom"; kind: "criterion"; runId: string; criterion: number; label: string }
  | { module: "adom"; kind: "task"; runId: string; taskId: string; label: string };

export type Segment =
  | { t: "text"; v: string }
  | { t: "mention"; v: string }
  | { t: "command"; v: string }
  | { t: "flag"; v: string }
  | { t: "ref"; ref: RefTarget };

export type Attachment =
  | { type: "stats"; runId: string }
  | { type: "highlight"; highlightId: string }
  | { type: "run-progress"; tasks: string[]; seconds: number; violations: number }
  | { type: "board-receipt"; text: string; status: IdeaStatus };

export interface Message {
  id: string;
  channelId: string;
  senderKind: SenderKind;
  senderId: string;
  at: string;
  body: Segment[];
  list?: string[];
  replyTo?: { senderId: string; excerpt: string };
  attachment?: Attachment;
  streaming?: boolean;
}

export type BoardItemKind = "idea" | "note" | "question" | "summary";
export type IdeaStatus = "proposed" | "discussing" | "decided" | "rejected";
export type QuestionStatus = "open" | "answered";

export interface BoardItem {
  id: string;
  number: number;
  kind: BoardItemKind;
  body: string;
  status?: IdeaStatus | QuestionStatus;
  reason?: string;
  createdBy: { kind: "human" | "agent"; id: string };
  decidedBy?: { id: string; at: string };
  at: string;
  critiques?: number;
  latestCritique?: string;
  fromHighlight?: { highlightId: string; ownerId: string };
  refs?: RefTarget[];
}

export interface BoardCard extends BoardItem {
  authorName: string;
  deciderName?: string;
}

export type JoinStatus = "pending" | "approved" | "rejected" | "cancelled";

export type JoinRelation = "none" | "pending" | "member";

export interface JoinCode {
  code: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  workspaceId: string;
  userId: string;
  message: string;
  status: JoinStatus;
  via: "code" | "explore";
  code?: string;
  at: string;
  decidedBy?: string;
}

// Workspace riêng: khóa của nhà cung cấp, hội thoại nhiều lượt và highlight.
export type ProviderKind = "anthropic" | "openai-compatible";

export interface ProviderKey {
  userId: string;
  provider: ProviderKind;
  baseUrl?: string;
  keyLast4: string;
  model: string;
  models: string[];
  savedAt: string;
}

export interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
  model?: string;
}

export interface Conversation {
  id: string;
  ownerId: string;
  title: string;
  updatedAt: string;
  turns: Turn[];
}

export type HighlightLabel = "important" | "review";

export interface Highlight {
  id: string;
  ownerId: string;
  conversationId: string;
  turnId: string;
  text: string;
  label: HighlightLabel;
  at: string;
}

export type Validity = "valid" | "invalidated" | "pilot";
export type Verdict = "PASS" | "FAIL" | "INSUFFICIENT_DATA" | "NOT_SET";

export interface Run {
  id: string;
  workspaceId: string;
  name: string;
  variants: string[];
  primaryVariant: string;
  dataset: string;
  tasks: number;
  tasksWithSpec: number;
  violations: number[];
  validity: Validity;
  invalidReason?: string;
  importedBy: string;
  importedAt: string;
  models: Array<{ role: string; model: string }>;
}

export interface Criterion {
  number: number;
  title: string;
  value: number | null;
  display: string;
  numerator?: number;
  denominator?: number;
  tasks: number;
  ciLow?: number;
  ciHigh?: number;
  threshold?: { op: "<=" | ">="; value: number };
  footnote: string;
  verdict: Verdict;
}

export interface RepairRow {
  method: string;
  good: number;
  wrongSide: number;
  overRelax: number;
  unmeasured: number;
  noCandidate: number;
  notRepaired: number;
}

export interface TaskResult {
  taskId: string;
  violations: number;
  share: number;
  a3State: "AGREE" | "SINGLE" | "DISAGREE" | "no_spec";
  contributing: boolean;
  wallSeconds: number;
}
