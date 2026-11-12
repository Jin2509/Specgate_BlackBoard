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
  members: Member[];
  channels: Channel[];
}

// teamRole: vai trong nhóm do chính thành viên tự mô tả (ví dụ "Dựng khung", "Runner").
// Agent riêng của mọi thành viên đọc được vai này để biết trong nhóm còn ai, ai làm gì.
export interface Member {
  userId: string;
  role: MemberRole;
  teamRole?: string;
}

export interface Channel {
  id: string;
  name: string;
}

// Agent riêng của một người: chính là mô hình người đó chọn ở workspace riêng, chạy bằng key của người đó.
// Agent xuất hiện trong kênh chung chỉ khi chủ của nó gửi một câu trả lời từ workspace riêng vào kênh.
export interface PersonalAgent {
  ownerId: string;
  ownerName: string;
  provider: ProviderKind;
  model: string;
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
  | { type: "run-progress"; tasks: string[]; seconds: number; violations: number }
  | { type: "board-receipt"; text: string; status: IdeaStatus };

// Tin của agent (senderKind "agent"): senderId là id của người chủ agent, agentModel là mô hình lúc gửi.
// Người chủ gửi câu trả lời từ hội thoại riêng vào kênh; hội thoại gốc không đi theo.
export interface Message {
  id: string;
  channelId: string;
  senderKind: SenderKind;
  senderId: string;
  agentModel?: string;
  at: string;
  body: Segment[];
  list?: string[];
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
  // kind "agent": id là người chủ của agent.
  createdBy: { kind: "human" | "agent"; id: string };
  decidedBy?: { id: string; at: string };
  at: string;
  critiques?: number;
  latestCritique?: string;
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

// workspaceId: workspace chung mà hội thoại lấy ngữ cảnh. Khi có, mỗi lời gọi mô hình gửi kèm ngữ cảnh nhóm
// (xem getAgentContext) và câu trả lời gửi được vào kênh của workspace đó.
export interface Conversation {
  id: string;
  ownerId: string;
  title: string;
  updatedAt: string;
  turns: Turn[];
  workspaceId?: string;
}

export type HighlightLabel = "important" | "review";

// Highlight: một đoạn người dùng bôi đen trong tin nhắn của người khác ở kênh chung, để nạp vào agent riêng của mình.
// Lưu bản chụp văn bản và người nói (người hoặc agent của ai), không lưu vị trí ký tự.
export interface Highlight {
  id: string;
  ownerId: string;
  workspaceId: string;
  channelId: string;
  messageId: string;
  author: { kind: "human" | "agent"; userId: string; model?: string };
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
