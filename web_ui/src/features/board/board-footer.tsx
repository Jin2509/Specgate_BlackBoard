// Ba khối dưới bảng: ghi chú, câu hỏi mở, tóm tắt cuộn.
import { Check, CircleHelp, ListCollapse, StickyNote } from "lucide-react";
import { Panel } from "@/components/common/panel";
import type { BoardCard } from "@/lib/types";

export function BoardFooter({
  notes,
  questions,
  summary,
}: {
  notes: BoardCard[];
  questions: BoardCard[];
  summary: BoardCard | undefined;
}) {
  return (
    <div className="grid gap-4 @3xl:grid-cols-3">
      <Panel icon={<StickyNote />} title="Ghi chú" bodyClassName="space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {notes.map((n) => (
          <p key={n.id}>{n.body}</p>
        ))}
      </Panel>
      <Panel
        icon={<CircleHelp />}
        title="Câu hỏi mở"
        bodyClassName="space-y-1.5 text-[13px] leading-relaxed text-muted-foreground"
      >
        {questions.map((q) =>
          q.status === "answered" ? (
            <p key={q.id} className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-3.5 shrink-0 text-decided" /> Đã trả lời: {q.reason}
            </p>
          ) : (
            <p key={q.id}>{q.body}</p>
          ),
        )}
      </Panel>
      <Panel
        icon={<ListCollapse />}
        title="Tóm tắt cuộn"
        actions={summary ? <span className="text-[11px] text-subtle">cập nhật {summary.at}</span> : null}
        bodyClassName="text-[13px] leading-relaxed text-muted-foreground"
      >
        <p>{summary?.body ?? "Chưa có. Gõ /summarize trong kênh để tạo."}</p>
      </Panel>
    </div>
  );
}
