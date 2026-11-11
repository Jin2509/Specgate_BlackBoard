// Bảng tông màu và nhãn theo trạng thái, phán quyết, vai agent.
import type { AgentRole, IdeaStatus, Validity, Verdict } from "@/lib/types";

export type Tone = "proposed" | "discussing" | "decided" | "rejected" | "data" | "insufficient" | "agent" | "neutral";

export const toneClasses: Record<Tone, { text: string; soft: string; line: string; bar: string }> = {
  proposed: { text: "text-proposed", soft: "bg-proposed-soft", line: "border-proposed-line", bar: "bg-proposed" },
  discussing: { text: "text-discussing", soft: "bg-discussing-soft", line: "border-discussing-line", bar: "bg-discussing" },
  decided: { text: "text-decided", soft: "bg-decided-soft", line: "border-decided-line", bar: "bg-decided" },
  rejected: { text: "text-rejected", soft: "bg-rejected-soft", line: "border-rejected-line", bar: "bg-rejected" },
  data: { text: "text-data", soft: "bg-data-soft", line: "border-data-line", bar: "bg-data" },
  insufficient: {
    text: "text-insufficient",
    soft: "bg-insufficient-soft",
    line: "border-insufficient-line",
    bar: "bg-insufficient",
  },
  agent: { text: "text-agent", soft: "bg-agent-soft", line: "border-agent-line", bar: "bg-agent" },
  neutral: { text: "text-muted-foreground", soft: "bg-muted", line: "border-border", bar: "bg-subtle" },
};

export const ideaStatusMeta: Record<IdeaStatus, { label: string; tone: Tone; verb: string }> = {
  proposed: { label: "Đề xuất", tone: "proposed", verb: "nêu" },
  discussing: { label: "Đang bàn", tone: "discussing", verb: "nêu" },
  decided: { label: "Đã chốt", tone: "decided", verb: "chốt" },
  rejected: { label: "Đã loại", tone: "rejected", verb: "loại" },
};

export const IDEA_COLUMNS: IdeaStatus[] = ["proposed", "discussing", "decided", "rejected"];

export const verdictMeta: Record<Verdict, { label: string; tone: Tone }> = {
  PASS: { label: "PASS", tone: "decided" },
  FAIL: { label: "FAIL", tone: "rejected" },
  INSUFFICIENT_DATA: { label: "Thiếu dữ liệu", tone: "insufficient" },
  NOT_SET: { label: "Chưa đặt", tone: "neutral" },
};

export const validityMeta: Record<Validity, { label: string; tone: Tone }> = {
  valid: { label: "valid", tone: "decided" },
  invalidated: { label: "invalidated", tone: "rejected" },
  pilot: { label: "pilot", tone: "neutral" },
};

export const agentRoleMeta: Record<AgentRole, { label: string }> = {
  generator: { label: "Phát ý" },
  critic: { label: "Phản biện" },
  synthesizer: { label: "Tổng hợp" },
  custom: { label: "Tự viết" },
};
