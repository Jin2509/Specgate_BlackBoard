// Dựng bản tổng hợp từ bảng ý tưởng và xuất Markdown.
import type { BoardItem } from "@/lib/types";

export interface BriefModel<T extends BoardItem = BoardItem> {
  title: string;
  decided: T[];
  rejected: T[];
  discussing: T[];
  openQuestions: T[];
  notes: T[];
}

export function buildBrief<T extends BoardItem>(title: string, items: T[]): BriefModel<T> {
  const ideas = items.filter((i) => i.kind === "idea");
  return {
    title,
    decided: ideas.filter((i) => i.status === "decided"),
    rejected: ideas.filter((i) => i.status === "rejected"),
    discussing: ideas.filter((i) => i.status === "discussing" || i.status === "proposed"),
    openQuestions: items.filter((i) => i.kind === "question" && i.status === "open"),
    notes: items.filter((i) => i.kind === "note"),
  };
}

export function briefToMarkdown(b: BriefModel, brief: string): string {
  const lines: string[] = [`# ${b.title}`, "", `> Đề bài: ${brief}`, ""];
  const section = (heading: string, rows: string[]) => {
    lines.push(`## ${heading}`, "");
    lines.push(...(rows.length ? rows : ["_(không có)_"]), "");
  };
  section(
    "Đã chốt",
    b.decided.map((i) => `- **${i.body}**. Vì ${lowerFirst(i.reason)}`),
  );
  section(
    "Đã loại",
    b.rejected.map((i) => `- ${i.body}. Vì ${lowerFirst(i.reason)}`),
  );
  section(
    "Còn đang bàn",
    b.discussing.map((i) => `- ${i.body}`),
  );
  section(
    "Câu hỏi mở",
    b.openQuestions.map((i) => `- ${i.body}`),
  );
  section(
    "Ràng buộc đã ghi",
    b.notes.map((i) => `- ${i.body}`),
  );
  return lines.join("\n").trimEnd() + "\n";
}

export function lowerFirst(s = ""): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}
